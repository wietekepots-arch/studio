import {
  addDoc,
  collection,
  doc,
  getDocs,
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

export function sortConfigOptions(
  options: RadarConfigOption[] | null | undefined,
): RadarConfigOption[] {
  if (!options) {
    return [];
  }

  return [...options].sort((left, right) => left.order - right.order);
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

  const existingQuadrants = new Set(quadrantDocs.docs.map((item) => item.id));
  const existingRings = new Set(ringDocs.docs.map((item) => item.id));
  const existingTags = new Set(tagDocs.docs.map((item) => item.id));
  const existingRadarItems = new Set(radarItemDocs.docs.map((item) => item.id));
  const batch = writeBatch(db);
  let result: SeedResult = {
    quadrants: 0,
    rings: 0,
    tags: 0,
    items: 0,
    historyEntries: 0,
  };
  const now = Date.now();

  for (const quadrant of seedQuadrants) {
    if (existingQuadrants.has(quadrant.id)) {
      continue;
    }

    batch.set(doc(db, "quadrants", quadrant.id), quadrant);
    result = { ...result, quadrants: result.quadrants + 1 };
  }

  for (const ring of seedRings) {
    if (existingRings.has(ring.id)) {
      continue;
    }

    batch.set(doc(db, "rings", ring.id), ring);
    result = { ...result, rings: result.rings + 1 };
  }

  for (const tag of getSeedTags()) {
    if (existingTags.has(tag.id)) {
      continue;
    }

    batch.set(doc(db, "tags", tag.id), tag);
    result = { ...result, tags: result.tags + 1 };
  }

  for (const item of getSeedRadarItems(now)) {
    if (existingRadarItems.has(item.id)) {
      continue;
    }

    const normalizedItem: RadarItem = {
      ...item,
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

    batch.set(doc(db, "radarItems", item.id), normalizedItem);
    result = { ...result, items: result.items + 1 };

    for (const historyEntry of item.history || []) {
      batch.set(
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
  }

  if (
    result.quadrants ||
    result.rings ||
    result.tags ||
    result.items ||
    result.historyEntries
  ) {
    await batch.commit();
  }

  return result;
}
