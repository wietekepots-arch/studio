export type Role = "Member" | "PowerUser" | "Admin";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  team?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface RadarConfig {
  quadrants: string[];
  rings: string[];
}

export interface RadarConfigOption {
  id: string;
  name: string;
  order: number;
  description?: string;
}

export interface RadarSharedProfile {
  origin?: Origin;
  sustainabilityNotes?: string;
  securityNotes?: string;
  ethicsNotes?: string;
}

export interface RadarProvider extends RadarSharedProfile {
  id: string;
  name: string;
  order: number;
  description?: string;
  website?: string;
}

export interface RadarFamily extends RadarSharedProfile {
  id: string;
  providerId: string;
  providerName?: string;
  name: string;
  order: number;
  description?: string;
}

export type ItemStatus = "Draft" | "Pending" | "Approved" | "Archived";
export type CostRange = "Free" | "Low" | "Medium" | "High";
export type Origin = "European" | "American" | "Other";
export type DataSensitivity = "Public" | "Internal" | "Client Confidential";

export interface PricingTier {
  name: string;
  cost: string;
  billing?: string; // e.g. "per month", "per user/month"
  features: string[];
}

export interface HistoryEntry {
  id: string;
  itemId: string;
  action: string;
  note?: string;
  before?: unknown;
  after?: unknown;
  createdAt: number;
  createdBy: string;
}

export interface RadarItem {
  id: string;
  name: string;
  shortDesc: string;
  notes: string;
  quadrantId: number; // 0 to 3
  ringId: number;     // 0 to 3
  previousRingId?: number; // For tracking movement
  tags: string[];
  team: string;
  ownerId: string;
  ownerName: string;
  providerId?: string;
  providerName?: string;
  familyId?: string;
  familyName?: string;
  scores: {
    maturity: number;
    impact: number;
    effort: number;
    risk: number;
  };
  costRange: CostRange;
  origin: Origin;
  originOverride?: Origin;
  sustainabilityNotes: string;
  sustainabilityNotesOverride?: string;
  securityNotes: string;
  securityNotesOverride?: string;
  ethicsNotes: string;
  ethicsNotesOverride?: string;
  pricingTiers?: PricingTier[];
  links: string[];
  status: ItemStatus;
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
}

export interface Experience {
  id: string;
  title: string;
  summary: string;
  toolLinks: string[]; // RadarItem IDs
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
    "Build & Prototype",
    "Models & Intelligence",
    "Workflow & Agents",
    "Trust & Governance"
  ],
  rings: [
    "Adopt",
    "Trial",
    "Assess",
    "Hold"
  ]
};
