"use client";

import {
  type RadarConfigOption,
  type RadarFamily,
  type Blip,
  type RadarProvider,
  type RadarEntityType,
  type RadarUseCase,
  type SeedMetadata,
} from "@/app/lib/radar-types";
import seedFamiliesData from "@/content/seed/families.json";
import seedBlipsData from "@/content/seed/blips.json";
import seedProvidersData from "@/content/seed/providers.json";
import seedQuadrantsData from "@/content/seed/quadrants.json";
import seedRingsData from "@/content/seed/rings.json";

export const STARTER_SEED_VERSION = "v3";

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
type SeedBlipInput = {
  id: string;
  name: string;
  subtitle: string;
  overview: string;
  useCases: RadarUseCase[];
  quadrantId: number;
  ringId: number;
  tags: string[];
  dateAdded: string;
  link: string;
  entityType?: RadarEntityType;
};

type SeedResolvedBlip = Omit<
  Blip,
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

export const legacySeedBlipIds = [
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
export const seedBlipIds = (seedBlipsData as SeedBlipInput[]).map(
  (item) => item.id,
);

function getDefaultEntityType(quadrantId: number): RadarEntityType {
  if (quadrantId === 0 || quadrantId === 3) {
    return "workflow";
  }

  return "product";
}

function parseSeedDate(dateAdded: string, fallback: number): number {
  const parsed = Date.parse(`${dateAdded}T12:00:00Z`);

  return Number.isNaN(parsed) ? fallback : parsed;
}

function buildSeedBlip(input: SeedBlipInput): SeedResolvedBlip {
  return withSeedMetadata({
    id: input.id,
    name: input.name,
    shortDesc: input.subtitle,
    notes: input.overview,
    entityType: input.entityType || getDefaultEntityType(input.quadrantId),
    useCases: input.useCases,
    quadrantId: input.quadrantId,
    ringId: input.ringId,
    tags: input.tags,
    team: "",
    origin: "Other",
    sustainabilityNotes: "",
    securityNotes: "",
    ethicsNotes: "",
    securityCertifications: [],
    links: input.link ? [input.link] : [],
  });
}

export function getSeedBlips(now = Date.now()): Blip[] {
  const blips = seedBlipsData as SeedBlipInput[];
  const totalBlips = blips.length;

  return blips.map((blip, index) => {
    const seededBlip = buildSeedBlip(blip);
    const fallbackCreatedAt = now - (totalBlips - index) * 86_400_000;
    const createdAt = parseSeedDate(blip.dateAdded, fallbackCreatedAt);

    return {
      ...seededBlip,
      ownerId: "seed-admin",
      ownerName: "Greenberry Admin",
      status: "Approved",
      lastReviewedAt: createdAt,
      reviewedAt: createdAt,
      reviewedBy: "seed-admin",
      createdAt,
      updatedAt: createdAt,
      createdBy: "seed-admin",
      updatedBy: "seed-admin",
      history: [],
    };
  });
}

export function getSeedTags(): RadarConfigOption[] {
  const tags = new Set<string>();

  for (const blip of getSeedBlips()) {
    for (const tag of blip.tags) {
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
