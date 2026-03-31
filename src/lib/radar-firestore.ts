import {
  addDoc,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";
import {
  Blip,
  BlipStatus,
  HistoryEntry,
  RadarConfig,
  RadarConfigOption,
  RadarFamily,
  RadarProvider,
  Role,
  UserProfile,
} from "@/app/lib/radar-types";
import { canReviewBlips } from "@/lib/company-auth";
import {
  getSeedBlips,
  seedFamilies,
  seedProviders,
  getSeedTags,
  legacySeedBlipIds,
  legacySeedTagIds,
  seedFamilyIds,
  seedProviderIds,
  seedQuadrants,
  seedBlipIds,
  seedRings,
} from "@/lib/radar-seed";

export const RADAR_BLIPS_COLLECTION = "radarItems";
export const BLIP_HISTORY_COLLECTION = "itemHistory";

export interface SeedResult {
  quadrants: number;
  rings: number;
  providers: number;
  families: number;
  tags: number;
  blips: number;
  historyEntries: number;
}

interface OrderedNamedEntity {
  id: string;
  name: string;
  order: number;
  description?: string;
}

function hasJsonChanged(left: unknown, right: unknown): boolean {
  return JSON.stringify(left ?? null) !== JSON.stringify(right ?? null);
}

function hasConfigOptionChanged(
  existingOption: Partial<RadarConfigOption> | undefined,
  nextOption: RadarConfigOption,
): boolean {
  if (!existingOption) {
    return true;
  }

  return (
    existingOption.name !== nextOption.name ||
    existingOption.order !== nextOption.order ||
    existingOption.description !== nextOption.description ||
    existingOption.seedManaged !== nextOption.seedManaged ||
    existingOption.seedVersion !== nextOption.seedVersion
  );
}

function hasSharedProfileChanged<
  T extends OrderedNamedEntity & {
    origin?: string;
    sustainabilityNotes?: string;
    securityNotes?: string;
    securityCertifications?: unknown;
    ethicsNotes?: string;
    providerId?: string;
    website?: string;
    seedManaged?: boolean;
    seedVersion?: string;
  },
>(
  existingProfile: Partial<T> | undefined,
  nextProfile: T,
): boolean {
  if (!existingProfile) {
    return true;
  }

  return (
    existingProfile.name !== nextProfile.name ||
    existingProfile.order !== nextProfile.order ||
    existingProfile.description !== nextProfile.description ||
    existingProfile.origin !== nextProfile.origin ||
    existingProfile.sustainabilityNotes !== nextProfile.sustainabilityNotes ||
    existingProfile.securityNotes !== nextProfile.securityNotes ||
    hasJsonChanged(
      existingProfile.securityCertifications,
      nextProfile.securityCertifications,
    ) ||
    existingProfile.ethicsNotes !== nextProfile.ethicsNotes ||
    existingProfile.providerId !== nextProfile.providerId ||
    existingProfile.website !== nextProfile.website ||
    existingProfile.seedManaged !== nextProfile.seedManaged ||
    existingProfile.seedVersion !== nextProfile.seedVersion
  );
}

function canFinalizeSeedBlip(
  blip: Partial<Blip> | undefined,
  userId: string,
): boolean {
  if (!blip) {
    return true;
  }

  return (
    blip.status === "Pending" &&
    blip.createdBy === userId &&
    blip.updatedBy === userId &&
    blip.ownerId === userId &&
    blip.submittedBy === userId
  );
}

function sortOrderedNamedEntities<T extends OrderedNamedEntity>(
  options: T[] | null | undefined,
): T[] {
  if (!options) {
    return [];
  }

  return [...options].sort((left, right) => left.order - right.order);
}

function mergeOrderedNamedEntities<T extends OrderedNamedEntity>(
  options: T[] | null | undefined,
  fallback: T[],
  preferFallback = false,
): T[] {
  const sortedOptions = sortOrderedNamedEntities(options);

  if (!sortedOptions.length) {
    return fallback;
  }

  const optionsById = new Map(sortedOptions.map((item) => [item.id, item]));
  const merged = fallback.map((fallbackItem) => {
    const option = optionsById.get(fallbackItem.id);

    if (!option) {
      return fallbackItem;
    }

    return preferFallback
      ? { ...option, ...fallbackItem }
      : { ...fallbackItem, ...option };
  });

  return sortOrderedNamedEntities(merged);
}

function buildEntityMap<T extends { id: string }>(
  items: T[] | Map<string, T> | null | undefined,
): Map<string, T> {
  if (!items) {
    return new Map();
  }

  if (items instanceof Map) {
    return items;
  }

  return new Map(items.map((item) => [item.id, item]));
}

export function sortConfigOptions(
  options: RadarConfigOption[] | null | undefined,
): RadarConfigOption[] {
  return sortOrderedNamedEntities(options);
}

export function mergeConfigOptions(
  options: RadarConfigOption[] | null | undefined,
  fallback: RadarConfigOption[],
  preferFallback = false,
): RadarConfigOption[] {
  return mergeOrderedNamedEntities(options, fallback, preferFallback);
}

export function sortRadarProviders(
  providers: RadarProvider[] | null | undefined,
): RadarProvider[] {
  return sortOrderedNamedEntities(providers);
}

export function mergeRadarProviders(
  providers: RadarProvider[] | null | undefined,
  fallback: RadarProvider[],
  preferFallback = false,
): RadarProvider[] {
  return mergeOrderedNamedEntities(providers, fallback, preferFallback);
}

export function sortRadarFamilies(
  families: RadarFamily[] | null | undefined,
): RadarFamily[] {
  return sortOrderedNamedEntities(families);
}

export function mergeRadarFamilies(
  families: RadarFamily[] | null | undefined,
  fallback: RadarFamily[],
  preferFallback = false,
): RadarFamily[] {
  return mergeOrderedNamedEntities(families, fallback, preferFallback);
}

export function resolveRadarSharedProfile(
  provider?: RadarProvider | null,
  family?: RadarFamily | null,
  fallbackOrigin: Blip["origin"] = "Other",
): Pick<
  Blip,
  | "origin"
  | "sustainabilityNotes"
  | "securityNotes"
  | "securityCertifications"
  | "ethicsNotes"
> {
  return {
    origin: family?.origin ?? provider?.origin ?? fallbackOrigin,
    sustainabilityNotes:
      family?.sustainabilityNotes ?? provider?.sustainabilityNotes ?? "",
    securityNotes: family?.securityNotes ?? provider?.securityNotes ?? "",
    securityCertifications:
      family?.securityCertifications ?? provider?.securityCertifications ?? [],
    ethicsNotes: family?.ethicsNotes ?? provider?.ethicsNotes ?? "",
  };
}

export function resolveBlip(
  blip: Blip,
  families: RadarFamily[] | Map<string, RadarFamily> | null | undefined,
  providers: RadarProvider[] | Map<string, RadarProvider> | null | undefined,
): Blip {
  const familyMap = buildEntityMap(families);
  const providerMap = buildEntityMap(providers);
  const family = blip.familyId ? familyMap.get(blip.familyId) : undefined;
  const providerId = blip.providerId || family?.providerId;
  const provider = providerId ? providerMap.get(providerId) : undefined;

  return {
    ...blip,
    ...(providerId ? { providerId } : {}),
    ...(provider?.name || family?.providerName || blip.providerName
      ? {
          providerName: provider?.name || family?.providerName || blip.providerName,
        }
      : {}),
    ...(family?.id || blip.familyId ? { familyId: blip.familyId || family?.id } : {}),
    ...(family?.name || blip.familyName
      ? { familyName: family?.name || blip.familyName }
      : {}),
    origin: blip.originOverride ?? family?.origin ?? provider?.origin ?? blip.origin,
    sustainabilityNotes:
      blip.sustainabilityNotesOverride ??
      family?.sustainabilityNotes ??
      provider?.sustainabilityNotes ??
      blip.sustainabilityNotes,
    securityNotes:
      blip.securityNotesOverride ??
      family?.securityNotes ??
      provider?.securityNotes ??
      blip.securityNotes,
    securityCertifications:
      blip.securityCertifications?.length
        ? blip.securityCertifications
        : family?.securityCertifications ??
          provider?.securityCertifications ??
          [],
    ethicsNotes:
      blip.ethicsNotesOverride ??
      family?.ethicsNotes ??
      provider?.ethicsNotes ??
      blip.ethicsNotes,
  };
}

export function buildRadarConfig(
  quadrants: RadarConfigOption[] | null | undefined,
  rings: RadarConfigOption[] | null | undefined,
): RadarConfig {
  return {
    quadrants: sortConfigOptions(quadrants).map((item) => item.name),
    rings: sortConfigOptions(rings).map((item) => item.name),
  };
}

export function sortBlips(
  blips: Blip[] | null | undefined,
): Blip[] {
  if (!blips) {
    return [];
  }

  return [...blips].sort((left, right) => right.updatedAt - left.updatedAt);
}

export function canEditBlip(
  blip: Blip,
  userId?: string | null,
  role?: Role | null,
): boolean {
  if (!userId) {
    return false;
  }

  if (canReviewBlips(role)) {
    return true;
  }

  return (
    blip.createdBy === userId &&
    blip.ownerId === userId &&
    blip.status !== "Archived"
  );
}

export function getNextBlipStatus(
  blip: Blip | null | undefined,
  userId: string,
  role?: Role | null,
): BlipStatus {
  if (!blip) {
    return "Pending";
  }

  const isOwner = blip.createdBy === userId && blip.ownerId === userId;

  if (!isOwner) {
    return blip.status;
  }

  if (blip.status === "Draft") {
    return "Pending";
  }

  if (blip.status === "Approved" && !canReviewBlips(role)) {
    return "Pending";
  }

  return blip.status;
}

export function isBlipEditResubmission(
  blip: Blip | null | undefined,
  userId: string,
  role?: Role | null,
): boolean {
  if (!blip) {
    return false;
  }

  return (
    getNextBlipStatus(blip, userId, role) === "Pending" &&
    blip.status !== "Pending"
  );
}

export function getStatusBadgeVariant(
  status: BlipStatus,
): "default" | "secondary" | "outline" {
  if (status === "Approved") {
    return "default";
  }

  if (status === "Pending") {
    return "secondary";
  }

  return "outline";
}

export async function appendBlipHistory(
  db: Firestore,
  blipId: string,
  entry: Omit<HistoryEntry, "id">,
): Promise<void> {
  await addDoc(
    collection(db, RADAR_BLIPS_COLLECTION, blipId, BLIP_HISTORY_COLLECTION),
    entry,
  );
}

export async function reviewBlip(
  db: Firestore,
  blip: Blip,
  reviewer: UserProfile,
  nextStatus: Extract<BlipStatus, "Draft" | "Approved" | "Archived">,
  note: string,
): Promise<void> {
  const now = Date.now();
  const trimmedNote = note.trim();

  await updateDoc(doc(db, RADAR_BLIPS_COLLECTION, blip.id), {
    status: nextStatus,
    reviewedAt: now,
    reviewedBy: reviewer.uid,
    reviewComment: trimmedNote,
    lastReviewedAt: now,
    updatedAt: now,
    updatedBy: reviewer.uid,
  });
}

function shouldResetSeedDoc(
  id: string,
  data: { seedManaged?: boolean } | undefined,
  ids: Set<string>,
): boolean {
  return ids.has(id) || Boolean(data?.seedManaged);
}

async function deleteDocumentRefs(
  db: Firestore,
  refs: Array<DocumentReference<unknown, DocumentData>>,
): Promise<void> {
  const chunkSize = 400;

  for (let index = 0; index < refs.length; index += chunkSize) {
    const batch = writeBatch(db);

    for (const ref of refs.slice(index, index + chunkSize)) {
      batch.delete(ref);
    }

    await batch.commit();
  }
}

async function deleteBlipHistories(
  db: Firestore,
  blipIds: string[],
): Promise<void> {
  const historyRefs: Array<DocumentReference<unknown, DocumentData>> = [];

  for (const blipId of blipIds) {
    const historyDocs = await getDocs(
      collection(db, RADAR_BLIPS_COLLECTION, blipId, BLIP_HISTORY_COLLECTION),
    );

    historyRefs.push(...historyDocs.docs.map((entry) => entry.ref));
  }

  await deleteDocumentRefs(db, historyRefs);
}

async function resetStarterRadarCollections(
  db: Firestore,
  snapshots: {
    quadrants: Awaited<ReturnType<typeof getDocs>>;
    rings: Awaited<ReturnType<typeof getDocs>>;
    providers: Awaited<ReturnType<typeof getDocs>>;
    families: Awaited<ReturnType<typeof getDocs>>;
    tags: Awaited<ReturnType<typeof getDocs>>;
    blips: Awaited<ReturnType<typeof getDocs>>;
  },
): Promise<void> {
  const quadrantIds = new Set(seedQuadrants.map((item) => item.id));
  const ringIds = new Set(seedRings.map((item) => item.id));
  const providerIds = new Set(seedProviderIds);
  const familyIds = new Set(seedFamilyIds);
  const tagIds = new Set([...legacySeedTagIds, ...getSeedTags().map((item) => item.id)]);
  const blipIds = new Set([...legacySeedBlipIds, ...seedBlipIds]);

  const blipDocsToDelete = snapshots.blips.docs.filter((entry) =>
    shouldResetSeedDoc(
      entry.id,
      entry.data() as { seedManaged?: boolean } | undefined,
      blipIds,
    ),
  );
  const blipIdsToDelete = blipDocsToDelete.map((entry) => entry.id);

  await deleteBlipHistories(db, blipIdsToDelete);

  await deleteDocumentRefs(db, [
    ...snapshots.quadrants.docs
      .filter((entry) =>
        shouldResetSeedDoc(
          entry.id,
          entry.data() as { seedManaged?: boolean } | undefined,
          quadrantIds,
        ),
      )
      .map((entry) => entry.ref),
    ...snapshots.rings.docs
      .filter((entry) =>
        shouldResetSeedDoc(
          entry.id,
          entry.data() as { seedManaged?: boolean } | undefined,
          ringIds,
        ),
      )
      .map((entry) => entry.ref),
    ...snapshots.providers.docs
      .filter((entry) =>
        shouldResetSeedDoc(
          entry.id,
          entry.data() as { seedManaged?: boolean } | undefined,
          providerIds,
        ),
      )
      .map((entry) => entry.ref),
    ...snapshots.families.docs
      .filter((entry) =>
        shouldResetSeedDoc(
          entry.id,
          entry.data() as { seedManaged?: boolean } | undefined,
          familyIds,
        ),
      )
      .map((entry) => entry.ref),
    ...snapshots.tags.docs
      .filter((entry) =>
        shouldResetSeedDoc(
          entry.id,
          entry.data() as { seedManaged?: boolean } | undefined,
          tagIds,
        ),
      )
      .map((entry) => entry.ref),
    ...blipDocsToDelete.map((entry) => entry.ref),
  ]);
}

export async function seedRadarCollections(
  db: Firestore,
  userProfile: UserProfile,
  options?: {
    reset?: boolean;
  },
): Promise<SeedResult> {
  const [
    quadrantDocs,
    ringDocs,
    providerDocs,
    familyDocs,
    tagDocs,
    radarBlipDocs,
  ] = await Promise.all([
    getDocs(collection(db, "quadrants")),
    getDocs(collection(db, "rings")),
    getDocs(collection(db, "radarProviders")),
    getDocs(collection(db, "radarFamilies")),
    getDocs(collection(db, "tags")),
    getDocs(collection(db, RADAR_BLIPS_COLLECTION)),
  ]);

  if (options?.reset) {
    await resetStarterRadarCollections(db, {
      quadrants: quadrantDocs,
      rings: ringDocs,
      providers: providerDocs,
      families: familyDocs,
      tags: tagDocs,
      blips: radarBlipDocs,
    });

    return seedRadarCollections(db, userProfile);
  }

  const existingQuadrants = new Map(
    quadrantDocs.docs.map((item) => [
      item.id,
      item.data() as Partial<RadarConfigOption>,
    ]),
  );
  const existingRings = new Map(
    ringDocs.docs.map((item) => [
      item.id,
      item.data() as Partial<RadarConfigOption>,
    ]),
  );
  const existingProviders = new Map(
    providerDocs.docs.map((item) => [item.id, item.data() as Partial<RadarProvider>]),
  );
  const existingFamilies = new Map(
    familyDocs.docs.map((item) => [item.id, item.data() as Partial<RadarFamily>]),
  );
  const existingTags = new Set(tagDocs.docs.map((item) => item.id));
  const existingBlips = new Map(
    radarBlipDocs.docs.map((blip) => [blip.id, blip.data() as Partial<Blip>]),
  );
  const configBatch = writeBatch(db);
  let result: SeedResult = {
    quadrants: 0,
    rings: 0,
    providers: 0,
    families: 0,
    tags: 0,
    blips: 0,
    historyEntries: 0,
  };
  const now = Date.now();
  let hasConfigWrites = false;

  for (const quadrant of seedQuadrants) {
    const existingQuadrant = existingQuadrants.get(quadrant.id);

    if (!hasConfigOptionChanged(existingQuadrant, quadrant)) {
      continue;
    }

    configBatch.set(doc(db, "quadrants", quadrant.id), quadrant);
    hasConfigWrites = true;

    if (!existingQuadrant) {
      result = { ...result, quadrants: result.quadrants + 1 };
    }
  }

  for (const ring of seedRings) {
    const existingRing = existingRings.get(ring.id);

    if (!hasConfigOptionChanged(existingRing, ring)) {
      continue;
    }

    configBatch.set(doc(db, "rings", ring.id), ring);
    hasConfigWrites = true;

    if (!existingRing) {
      result = { ...result, rings: result.rings + 1 };
    }
  }

  for (const provider of seedProviders) {
    const existingProvider = existingProviders.get(provider.id);

    if (!hasSharedProfileChanged(existingProvider, provider)) {
      continue;
    }

    configBatch.set(doc(db, "radarProviders", provider.id), provider);
    hasConfigWrites = true;

    if (!existingProvider) {
      result = { ...result, providers: result.providers + 1 };
    }
  }

  for (const family of seedFamilies) {
    const existingFamily = existingFamilies.get(family.id);

    if (!hasSharedProfileChanged(existingFamily, family)) {
      continue;
    }

    configBatch.set(doc(db, "radarFamilies", family.id), family);
    hasConfigWrites = true;

    if (!existingFamily) {
      result = { ...result, families: result.families + 1 };
    }
  }

  for (const tag of getSeedTags()) {
    if (existingTags.has(tag.id)) {
      continue;
    }

    configBatch.set(doc(db, "tags", tag.id), tag);
    hasConfigWrites = true;
    result = { ...result, tags: result.tags + 1 };
  }

  if (hasConfigWrites) {
    await configBatch.commit();
  }

  for (const blip of getSeedBlips(now)) {
    const existingBlip = existingBlips.get(blip.id);
    const { history, ...seedBlip } = blip;
    const normalizedBlip: Omit<Blip, "history"> = {
      ...seedBlip,
      ownerId: userProfile.uid,
      ownerName: userProfile.displayName,
      createdBy: userProfile.uid,
      updatedBy: userProfile.uid,
      submittedAt: blip.createdAt,
      submittedBy: userProfile.uid,
      reviewedBy: userProfile.uid,
      reviewedAt: blip.reviewedAt || now,
      lastReviewedAt: blip.lastReviewedAt || now,
    };
    const shouldFinalize = canFinalizeSeedBlip(existingBlip, userProfile.uid);

    if (!existingBlip) {
      const { reviewedAt, reviewedBy, reviewComment, ...pendingBase } =
        normalizedBlip;
      const pendingBlip: Omit<Blip, "history"> = {
        ...pendingBase,
        status: "Pending",
        lastReviewedAt: normalizedBlip.createdAt,
      };

      await setDoc(doc(db, RADAR_BLIPS_COLLECTION, blip.id), pendingBlip);
      existingBlips.set(blip.id, pendingBlip);
      result = { ...result, blips: result.blips + 1 };
    }

    if (!shouldFinalize) {
      continue;
    }

    const finalizeBatch = writeBatch(db);
    finalizeBatch.update(doc(db, RADAR_BLIPS_COLLECTION, blip.id), normalizedBlip);

    let existingHistoryEntries = new Set<string>();

    if (history?.length) {
      const historyDocs = await getDocs(
        collection(db, RADAR_BLIPS_COLLECTION, blip.id, BLIP_HISTORY_COLLECTION),
      );
      existingHistoryEntries = new Set(historyDocs.docs.map((entry) => entry.id));
    }

    for (const historyEntry of history || []) {
      if (existingHistoryEntries.has(historyEntry.id)) {
        continue;
      }

      finalizeBatch.set(
        doc(
          db,
          RADAR_BLIPS_COLLECTION,
          blip.id,
          BLIP_HISTORY_COLLECTION,
          historyEntry.id,
        ),
        {
          ...historyEntry,
          blipId: historyEntry.blipId || historyEntry.itemId || blip.id,
          itemId: historyEntry.itemId || historyEntry.blipId || blip.id,
          createdBy: userProfile.uid,
        },
      );
      result = {
        ...result,
        historyEntries: result.historyEntries + 1,
      };
    }

    await finalizeBatch.commit();
  }

  return result;
}
