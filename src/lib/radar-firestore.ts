import {
  addDoc,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import {
  HistoryEntry,
  ItemStatus,
  RadarConfig,
  RadarConfigOption,
  RadarFamily,
  RadarItem,
  RadarProvider,
  Role,
  UserProfile,
} from "@/app/lib/radar-types";
import { canReviewBlips } from "@/lib/company-auth";
import {
  getSeedRadarItems,
  seedFamilies,
  seedProviders,
  getSeedTags,
  seedQuadrants,
  seedRings,
} from "@/lib/radar-seed";

export interface SeedResult {
  quadrants: number;
  rings: number;
  providers: number;
  families: number;
  tags: number;
  items: number;
  historyEntries: number;
}

interface OrderedNamedEntity {
  id: string;
  name: string;
  order: number;
  description?: string;
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
    existingOption.description !== nextOption.description
  );
}

function hasSharedProfileChanged<
  T extends OrderedNamedEntity & {
    origin?: string;
    sustainabilityNotes?: string;
    securityNotes?: string;
    ethicsNotes?: string;
    providerId?: string;
    website?: string;
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
    existingProfile.ethicsNotes !== nextProfile.ethicsNotes ||
    existingProfile.providerId !== nextProfile.providerId ||
    existingProfile.website !== nextProfile.website
  );
}

function canFinalizeSeedItem(
  item: Partial<RadarItem> | undefined,
  userId: string,
): boolean {
  if (!item) {
    return true;
  }

  return (
    item.status === "Pending" &&
    item.createdBy === userId &&
    item.updatedBy === userId &&
    item.ownerId === userId &&
    item.submittedBy === userId
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
  fallbackOrigin: RadarItem["origin"] = "Other",
): Pick<
  RadarItem,
  "origin" | "sustainabilityNotes" | "securityNotes" | "ethicsNotes"
> {
  return {
    origin: family?.origin ?? provider?.origin ?? fallbackOrigin,
    sustainabilityNotes:
      family?.sustainabilityNotes ?? provider?.sustainabilityNotes ?? "",
    securityNotes: family?.securityNotes ?? provider?.securityNotes ?? "",
    ethicsNotes: family?.ethicsNotes ?? provider?.ethicsNotes ?? "",
  };
}

export function resolveRadarItem(
  item: RadarItem,
  families: RadarFamily[] | Map<string, RadarFamily> | null | undefined,
  providers: RadarProvider[] | Map<string, RadarProvider> | null | undefined,
): RadarItem {
  const familyMap = buildEntityMap(families);
  const providerMap = buildEntityMap(providers);
  const family = item.familyId ? familyMap.get(item.familyId) : undefined;
  const providerId = item.providerId || family?.providerId;
  const provider = providerId ? providerMap.get(providerId) : undefined;
  const sharedProfile = resolveRadarSharedProfile(provider, family, item.origin);

  return {
    ...item,
    ...(providerId ? { providerId } : {}),
    ...(provider?.name || item.providerName
      ? { providerName: item.providerName || provider?.name }
      : {}),
    ...(family?.id || item.familyId ? { familyId: item.familyId || family?.id } : {}),
    ...(family?.name || item.familyName
      ? { familyName: item.familyName || family?.name }
      : {}),
    origin: item.originOverride ?? sharedProfile.origin ?? item.origin,
    sustainabilityNotes:
      item.sustainabilityNotesOverride ?? sharedProfile.sustainabilityNotes,
    securityNotes: item.securityNotesOverride ?? sharedProfile.securityNotes,
    ethicsNotes: item.ethicsNotesOverride ?? sharedProfile.ethicsNotes,
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

export function sortRadarItems(
  items: RadarItem[] | null | undefined,
): RadarItem[] {
  if (!items) {
    return [];
  }

  return [...items].sort((left, right) => right.updatedAt - left.updatedAt);
}

export function canEditRadarItem(
  item: RadarItem,
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
    item.createdBy === userId &&
    item.ownerId === userId &&
    item.status !== "Archived"
  );
}

export function getNextRadarItemStatus(
  item: RadarItem | null | undefined,
  userId: string,
  role?: Role | null,
): ItemStatus {
  if (!item) {
    return "Pending";
  }

  const isOwner = item.createdBy === userId && item.ownerId === userId;

  if (!isOwner) {
    return item.status;
  }

  if (item.status === "Draft") {
    return "Pending";
  }

  if (item.status === "Approved" && !canReviewBlips(role)) {
    return "Pending";
  }

  return item.status;
}

export function isRadarItemEditResubmission(
  item: RadarItem | null | undefined,
  userId: string,
  role?: Role | null,
): boolean {
  if (!item) {
    return false;
  }

  return (
    getNextRadarItemStatus(item, userId, role) === "Pending" &&
    item.status !== "Pending"
  );
}

export function getStatusBadgeVariant(
  status: ItemStatus,
): "default" | "secondary" | "outline" {
  if (status === "Approved") {
    return "default";
  }

  if (status === "Pending") {
    return "secondary";
  }

  return "outline";
}

export async function appendItemHistory(
  db: Firestore,
  itemId: string,
  entry: Omit<HistoryEntry, "id">,
): Promise<void> {
  await addDoc(collection(db, "radarItems", itemId, "itemHistory"), entry);
}

export async function reviewRadarItem(
  db: Firestore,
  item: RadarItem,
  reviewer: UserProfile,
  nextStatus: Extract<ItemStatus, "Draft" | "Approved" | "Archived">,
  note: string,
): Promise<void> {
  const now = Date.now();
  const trimmedNote = note.trim();

  await updateDoc(doc(db, "radarItems", item.id), {
    status: nextStatus,
    reviewedAt: now,
    reviewedBy: reviewer.uid,
    reviewComment: trimmedNote,
    lastReviewedAt: now,
    updatedAt: now,
    updatedBy: reviewer.uid,
  });

  await appendItemHistory(db, item.id, {
    itemId: item.id,
    action:
      nextStatus === "Approved"
        ? "approved"
        : nextStatus === "Archived"
          ? "archived"
          : "sent back to draft",
    note: trimmedNote,
    before: item.status,
    after: nextStatus,
    createdAt: now,
    createdBy: reviewer.uid,
  });
}

export async function seedRadarCollections(
  db: Firestore,
  userProfile: UserProfile,
): Promise<SeedResult> {
  const [
    quadrantDocs,
    ringDocs,
    providerDocs,
    familyDocs,
    tagDocs,
    radarItemDocs,
  ] = await Promise.all([
    getDocs(collection(db, "quadrants")),
    getDocs(collection(db, "rings")),
    getDocs(collection(db, "radarProviders")),
    getDocs(collection(db, "radarFamilies")),
    getDocs(collection(db, "tags")),
    getDocs(collection(db, "radarItems")),
  ]);

  const existingQuadrants = new Map(
    quadrantDocs.docs.map((item) => [
      item.id,
      item.data() as Partial<RadarConfigOption>,
    ]),
  );
  const existingRings = new Set(ringDocs.docs.map((item) => item.id));
  const existingProviders = new Map(
    providerDocs.docs.map((item) => [item.id, item.data() as Partial<RadarProvider>]),
  );
  const existingFamilies = new Map(
    familyDocs.docs.map((item) => [item.id, item.data() as Partial<RadarFamily>]),
  );
  const existingTags = new Set(tagDocs.docs.map((item) => item.id));
  const existingRadarItems = new Map(
    radarItemDocs.docs.map((item) => [item.id, item.data() as Partial<RadarItem>]),
  );
  const configBatch = writeBatch(db);
  let result: SeedResult = {
    quadrants: 0,
    rings: 0,
    providers: 0,
    families: 0,
    tags: 0,
    items: 0,
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
    if (existingRings.has(ring.id)) {
      continue;
    }

    configBatch.set(doc(db, "rings", ring.id), ring);
    hasConfigWrites = true;
    result = { ...result, rings: result.rings + 1 };
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

  for (const item of getSeedRadarItems(now)) {
    const existingItem = existingRadarItems.get(item.id);
    const { history, ...seedItem } = item;
    const normalizedItem: Omit<RadarItem, "history"> = {
      ...seedItem,
      ownerId: userProfile.uid,
      ownerName: userProfile.displayName,
      createdBy: userProfile.uid,
      updatedBy: userProfile.uid,
      submittedAt: item.createdAt,
      submittedBy: userProfile.uid,
      reviewedBy: userProfile.uid,
      reviewedAt: item.reviewedAt || now,
      lastReviewedAt: item.lastReviewedAt || now,
    };
    const shouldFinalize = canFinalizeSeedItem(existingItem, userProfile.uid);

    if (!existingItem) {
      const { reviewedAt, reviewedBy, reviewComment, ...pendingBase } =
        normalizedItem;
      const pendingItem: Omit<RadarItem, "history"> = {
        ...pendingBase,
        status: "Pending",
        lastReviewedAt: normalizedItem.createdAt,
      };

      await setDoc(doc(db, "radarItems", item.id), pendingItem);
      existingRadarItems.set(item.id, pendingItem);
      result = { ...result, items: result.items + 1 };
    }

    if (!shouldFinalize) {
      continue;
    }

    const finalizeBatch = writeBatch(db);
    finalizeBatch.update(doc(db, "radarItems", item.id), normalizedItem);

    let existingHistoryEntries = new Set<string>();

    if (history?.length) {
      const historyDocs = await getDocs(
        collection(db, "radarItems", item.id, "itemHistory"),
      );
      existingHistoryEntries = new Set(historyDocs.docs.map((entry) => entry.id));
    }

    for (const historyEntry of history || []) {
      if (existingHistoryEntries.has(historyEntry.id)) {
        continue;
      }

      finalizeBatch.set(
        doc(db, "radarItems", item.id, "itemHistory", historyEntry.id),
        {
          ...historyEntry,
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
