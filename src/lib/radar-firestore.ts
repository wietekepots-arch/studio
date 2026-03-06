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
  RadarItem,
  Role,
  UserProfile,
} from "@/app/lib/radar-types";
import { canReviewBlips } from "@/lib/company-auth";
import {
  getSeedRadarItems,
  getSeedTags,
  seedQuadrants,
  seedRings,
} from "@/lib/radar-seed";

export interface SeedResult {
  quadrants: number;
  rings: number;
  tags: number;
  items: number;
  historyEntries: number;
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

export function sortConfigOptions(
  options: RadarConfigOption[] | null | undefined,
): RadarConfigOption[] {
  if (!options) {
    return [];
  }

  return [...options].sort((left, right) => left.order - right.order);
}

export function mergeConfigOptions(
  options: RadarConfigOption[] | null | undefined,
  fallback: RadarConfigOption[],
  preferFallback = false,
): RadarConfigOption[] {
  const sortedOptions = sortConfigOptions(options);

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

  return sortConfigOptions(merged);
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
    (item.status === "Draft" || item.status === "Pending")
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
  const [quadrantDocs, ringDocs, tagDocs, radarItemDocs] = await Promise.all([
    getDocs(collection(db, "quadrants")),
    getDocs(collection(db, "rings")),
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
  const existingTags = new Set(tagDocs.docs.map((item) => item.id));
  const existingRadarItems = new Map(
    radarItemDocs.docs.map((item) => [item.id, item.data() as Partial<RadarItem>]),
  );
  const configBatch = writeBatch(db);
  let result: SeedResult = {
    quadrants: 0,
    rings: 0,
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
