"use client";

import {
  type RadarConfigOption,
  type RadarFamily,
  type RadarItem,
  type RadarProvider,
  type SeedMetadata,
} from "@/app/lib/radar-types";
import seedFamiliesData from "@/content/seed/families.json";
import seedItemsData from "@/content/seed/items.json";
import seedProvidersData from "@/content/seed/providers.json";
import seedQuadrantsData from "@/content/seed/quadrants.json";
import seedRingsData from "@/content/seed/rings.json";

export const STARTER_SEED_VERSION = "v2";

function withSeedMetadata<T extends object>(entity: T): T & SeedMetadata {
  return {
    ...entity,
    seedManaged: true,
    seedVersion: STARTER_SEED_VERSION,
  };
}

function slugifyTag(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type SeedConfigOptionData = Omit<RadarConfigOption, "seedManaged" | "seedVersion">;
type SeedProviderData = Omit<RadarProvider, "seedManaged" | "seedVersion">;
type SeedFamilyData = Omit<RadarFamily, "seedManaged" | "seedVersion">;
type SeedRadarItemInput = Omit<
  RadarItem,
  | "ownerId"
  | "ownerName"
  | "status"
  | "submittedAt"
  | "submittedBy"
  | "reviewedAt"
  | "reviewedBy"
  | "reviewComment"
  | "lastReviewedAt"
  | "createdAt"
  | "createdBy"
  | "updatedAt"
  | "updatedBy"
  | "history"
  | "providerName"
  | "familyName"
  | "originOverride"
  | "sustainabilityNotesOverride"
  | "securityNotesOverride"
  | "ethicsNotesOverride"
  | "seedManaged"
  | "seedVersion"
>;

type SeedResolvedRadarItem = Omit<
  RadarItem,
  | "ownerId"
  | "ownerName"
  | "status"
  | "submittedAt"
  | "submittedBy"
  | "reviewedAt"
  | "reviewedBy"
  | "reviewComment"
  | "lastReviewedAt"
  | "createdAt"
  | "createdBy"
  | "updatedAt"
  | "updatedBy"
  | "history"
>;

export const seedQuadrants: RadarConfigOption[] = (
  seedQuadrantsData as SeedConfigOptionData[]
).map((item) => withSeedMetadata(item));

export const seedRings: RadarConfigOption[] = (
  seedRingsData as SeedConfigOptionData[]
).map((item) => withSeedMetadata(item));

export const seedProviders: RadarProvider[] = (
  seedProvidersData as SeedProviderData[]
).map((item) => withSeedMetadata(item));

export const seedFamilies: RadarFamily[] = (
  seedFamiliesData as SeedFamilyData[]
).map((item) => withSeedMetadata(item));

export const legacySeedRadarItemIds = [
  "claude-3-5",
  "claude-4-6",
  "transcriptor",
  "firebase-studio",
  "gpt-5-4",
  "gpt-5-3",
  "gpt-5-3-codex",
  "gpt-5-1-codex-mini",
  "gemini-3-flash",
  "antigravity",
  "cursor",
  "copilot",
  "github-copilot",
  "claude-code",
  "warp",
  "windsurf",
  "v0",
  "perplexity",
  "mistral-le-chat",
  "lovable",
] as const;

const legacySeedTagNames = [
  "AI Editor",
  "Agentic",
  "Anthropic",
  "App Builder",
  "Audio",
  "CLI",
  "Cloud",
  "Coding",
  "Creative",
  "Emerging",
  "EU",
  "European",
  "Fast",
  "Flagship",
  "Full-stack",
  "GDPR",
  "GitHub",
  "GitLab",
  "Google",
  "IDE",
  "Legacy",
  "Lightweight",
  "LLM",
  "Microsoft",
  "Multimodal",
  "OpenAI",
  "Privacy-First",
  "Productivity",
  "Prototyping",
  "React",
  "Research",
  "Search",
  "Terminal",
  "UI",
  "Vercel",
] as const;

export const legacySeedTagIds = legacySeedTagNames.map((tag) => slugifyTag(tag));
export const seedProviderIds = seedProviders.map((item) => item.id);
export const seedFamilyIds = seedFamilies.map((item) => item.id);
export const seedRadarItemIds = (seedItemsData as SeedRadarItemInput[]).map(
  (item) => item.id,
);

const seedProvidersById = new Map(seedProviders.map((item) => [item.id, item]));
const seedFamiliesById = new Map(seedFamilies.map((item) => [item.id, item]));

function buildSeedRadarItem(input: SeedRadarItemInput): SeedResolvedRadarItem {
  const family = input.familyId ? seedFamiliesById.get(input.familyId) : undefined;
  const providerId = input.providerId || family?.providerId;
  const provider = providerId ? seedProvidersById.get(providerId) : undefined;
  const inheritedOrigin = family?.origin ?? provider?.origin;
  const inheritedSustainability =
    family?.sustainabilityNotes ?? provider?.sustainabilityNotes;
  const inheritedSecurity = family?.securityNotes ?? provider?.securityNotes;
  const inheritedEthics = family?.ethicsNotes ?? provider?.ethicsNotes;
  const inheritedSecurityReferences =
    family?.securityCertifications ?? provider?.securityCertifications;
  const origin = input.origin ?? inheritedOrigin ?? "Other";
  const sustainabilityNotes =
    input.sustainabilityNotes ?? inheritedSustainability ?? "";
  const securityNotes = input.securityNotes ?? inheritedSecurity ?? "";
  const ethicsNotes = input.ethicsNotes ?? inheritedEthics ?? "";
  const securityCertifications =
    input.securityCertifications ?? inheritedSecurityReferences ?? [];
  const providerName = provider?.name;
  const familyName = family?.name;

  return withSeedMetadata({
    ...input,
    ...(providerId ? { providerId } : {}),
    ...(providerName ? { providerName } : {}),
    ...(family?.id ? { familyId: family.id } : {}),
    ...(familyName ? { familyName } : {}),
    origin,
    sustainabilityNotes,
    securityNotes,
    ethicsNotes,
    securityCertifications,
    ...(providerId && input.origin !== undefined && input.origin !== inheritedOrigin
      ? { originOverride: input.origin }
      : {}),
    ...(providerId &&
    input.sustainabilityNotes !== undefined &&
    input.sustainabilityNotes !== inheritedSustainability
      ? { sustainabilityNotesOverride: input.sustainabilityNotes }
      : {}),
    ...(providerId &&
    input.securityNotes !== undefined &&
    input.securityNotes !== inheritedSecurity
      ? { securityNotesOverride: input.securityNotes }
      : {}),
    ...(providerId &&
    input.ethicsNotes !== undefined &&
    input.ethicsNotes !== inheritedEthics
      ? { ethicsNotesOverride: input.ethicsNotes }
      : {}),
  });
}

export function getSeedRadarItems(now = Date.now()): RadarItem[] {
  const items = seedItemsData as SeedRadarItemInput[];
  const totalItems = items.length;

  return items.map((item, index) => {
    const seededItem = buildSeedRadarItem(item);
    const createdAt = now - (totalItems - index) * 86_400_000;

    return {
      ...seededItem,
      ownerId: "seed-admin",
      ownerName: "Greenberry Admin",
      status: "Approved",
      lastReviewedAt: now,
      reviewedAt: now,
      reviewedBy: "seed-admin",
      createdAt,
      updatedAt: now,
      createdBy: "seed-admin",
      updatedBy: "seed-admin",
      history: [],
    };
  });
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
    .map((tag, index) =>
      withSeedMetadata({
        id: slugifyTag(tag),
        name: tag,
        order: index,
      }),
    );
}
