"use client";

import {
  RadarConfigOption,
  RadarItem,
} from "@/app/lib/radar-types";
import seedQuadrantsData from "@/content/seed/quadrants.json";
import seedRingsData from "@/content/seed/rings.json";
import seedItemsData from "@/content/seed/items.json";

export const seedQuadrants: RadarConfigOption[] = seedQuadrantsData;

export const seedRings: RadarConfigOption[] = seedRingsData;

interface SeedItemData {
  id: string;
  name: string;
  shortDesc: string;
  notes: string;
  quadrantId: number;
  ringId: number;
  previousRingId?: number;
  tags: string[];
  team: string;
  costRange: string;
  origin: string;
  sustainabilityNotes: string;
  securityNotes: string;
  ethicsNotes: string;
  links: string[];
  scores: { maturity: number; impact: number; effort: number; risk: number };
  pricingTiers?: { name: string; cost: string; billing?: string; features: string[] }[];
  history?: { action: string; note: string }[];
}

export function getSeedRadarItems(now = Date.now()): RadarItem[] {
  return (seedItemsData as SeedItemData[]).map((item) => ({
    ...item,
    costRange: item.costRange as RadarItem["costRange"],
    origin: item.origin as RadarItem["origin"],
    ownerId: "seed-admin",
    ownerName: "Greenberry Admin",
    status: "Approved" as const,
    lastReviewedAt: now,
    reviewedAt: now,
    reviewedBy: "seed-admin",
    createdAt: now,
    updatedAt: now,
    createdBy: "seed-admin",
    updatedBy: "seed-admin",
    pricingTiers: item.pricingTiers || [],
    history: (item.history || []).map((entry, index) => ({
      id: `h${index + 1}`,
      itemId: item.id,
      action: entry.action,
      note: entry.note,
      createdAt: now,
      createdBy: "seed-admin",
    })),
  }));
}

export function getSeedTags(): RadarConfigOption[] {
  const tags = new Set<string>();

  for (const item of getSeedRadarItems()) {
    for (const tag of item.tags) {
      tags.add(tag);
    }
  }

  return Array.from(tags)
    .sort((left, right) => left.localeCompare(right))
    .map((tag, index) => ({
      id: tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name: tag,
      order: index,
    }));
}
