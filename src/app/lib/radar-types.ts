export type Role = "Member" | "PowerUser" | "Admin";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  team?: string;
  createdAt?: number;
  lastLoginAt?: number;
  previousLoginAt?: number;
  updatedAt?: number;
}

export interface RoleAssignment {
  uid: string;
  email: string;
  role: Role;
  createdAt?: number;
  createdBy?: string;
  updatedAt?: number;
  updatedBy?: string;
}

export interface RadarConfig {
  quadrants: string[];
  rings: string[];
}

export interface SeedMetadata {
  seedManaged?: boolean;
  seedVersion?: string;
}

export interface RadarLink {
  label: string;
  url: string;
}

export interface RadarSecurityReference {
  label: string;
  url?: string;
  details?: string;
}

export interface RadarUseCase {
  role: string;
  summary: string;
}

export interface RadarModelEntry {
  name: string;
  familyId?: string;
  summary: string;
  vendorLink?: string;
  benchmarkLinks?: RadarLink[];
}

export interface RadarConfigOption extends SeedMetadata {
  id: string;
  name: string;
  order: number;
  description?: string;
}

export interface RadarSharedProfile {
  origin?: Origin;
  sustainabilityNotes?: string;
  securityNotes?: string;
  securityCertifications?: RadarSecurityReference[];
  ethicsNotes?: string;
}

export interface RadarProvider extends RadarSharedProfile, SeedMetadata {
  id: string;
  name: string;
  order: number;
  description?: string;
  website?: string;
}

export interface RadarFamily extends RadarSharedProfile, SeedMetadata {
  id: string;
  providerId: string;
  providerName?: string;
  name: string;
  order: number;
  description?: string;
}

export type BlipStatus = "Draft" | "Pending" | "Approved" | "Archived";
export type CostRange = "Free" | "Low" | "Medium" | "High";
export type Origin = "European" | "American" | "Other";
export type DataSensitivity = "Public" | "Internal" | "Client Confidential";
export type RadarEntityType =
  | "provider"
  | "product"
  | "workflow"
  | "governance";

export interface PricingTier {
  name: string;
  cost: string;
  billing?: string; // e.g. "per month", "per user/month"
  features: string[];
}

export interface HistoryEntry {
  id: string;
  blipId?: string;
  itemId?: string;
  action: string;
  note?: string;
  before?: unknown;
  after?: unknown;
  createdAt: number;
  createdBy: string;
}

export interface Blip {
  id: string;
  name: string;
  shortDesc: string;
  notes: string;
  entityType?: RadarEntityType;
  useCases?: RadarUseCase[];
  quadrantId: number; // 0 to 3
  ringId: number; // 0 to 3
  previousRingId?: number; // For tracking movement
  tags: string[];
  team: string;
  ownerId: string;
  ownerName: string;
  providerId?: string;
  providerName?: string;
  familyId?: string;
  familyName?: string;
  costRange?: CostRange;
  origin: Origin;
  originOverride?: Origin;
  sustainabilityNotes: string;
  sustainabilityNotesOverride?: string;
  securityNotes: string;
  securityNotesOverride?: string;
  securityCertifications?: RadarSecurityReference[];
  ethicsNotes: string;
  ethicsNotesOverride?: string;
  availabilitySummary?: string;
  accessNotes?: string;
  accessRequestUrl?: string;
  pricingTiers?: PricingTier[];
  pricingSummary?: string;
  pricingUrl?: string;
  modelEntries?: RadarModelEntry[];
  links: string[];
  status: BlipStatus;
  submittedAt?: number;
  submittedBy?: string;
  reviewedAt?: number;
  reviewedBy?: string;
  reviewComment?: string;
  lastReviewedAt: number;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  viewCount?: number;
  history?: HistoryEntry[];
  seedManaged?: boolean;
  seedVersion?: string;
}

export interface ExperienceToolContext {
  blipId?: string;
  itemId?: string;
  providerId?: string;
  familyId?: string;
  modelName?: string;
  modelVersion?: string;
}

export interface Experience {
  id: string;
  title: string;
  summary: string;
  toolLinks: string[]; // Blip IDs
  toolContexts?: ExperienceToolContext[];
  howUsed: string;
  promptsOrTemplates?: string;
  findings: string;
  recommendations?: string;
  roleTitle: string;
  team: string;
  projectContext?: string;
  dataSensitivity?: DataSensitivity;
  outcomeRating?: number; // 1-5
  timeSavedHours?: number;
  tags?: string[];
  links?: string[];
  status: "Published" | "Hidden";
  createdAt: number;
  createdBy: string;
  creatorName?: string;
  updatedAt: number;
  updatedBy: string;
  likesCount?: number;
  viewsCount?: number;
}

export const DEFAULT_CONFIG: RadarConfig = {
  quadrants: [
    "Methods & Practices",
    "Models & Platforms",
    "Workflow & Tools",
    "Prototyping & Experiments",
  ],
  rings: ["Adopt", "Trial", "Assess", "Hold"],
};
