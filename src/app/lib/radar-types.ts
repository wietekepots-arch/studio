export type Role = 'Admin' | 'Editor' | 'Viewer';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  team?: string;
}

export interface RadarConfig {
  quadrants: string[];
  rings: string[];
}

export type ItemStatus = 'Draft' | 'In Review' | 'Approved' | 'Archived';
export type CostRange = 'Free' | 'Low' | 'Medium' | 'High';
export type Origin = 'European' | 'American' | 'Other';
export type DataSensitivity = 'Public' | 'Internal' | 'Client Confidential';

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
  before?: any;
  after?: any;
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
  scores: {
    maturity: number;
    impact: number;
    effort: number;
    risk: number;
  };
  costRange: CostRange;
  origin: Origin;
  sustainabilityNotes: string;
  securityNotes: string;
  pricingTiers?: PricingTier[];
  links: string[];
  status: ItemStatus;
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
  status: 'Published' | 'Hidden';
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
    "Creation & Craft",
    "Strategy & Intelligence",
    "Process & Flow",
    "Positive Impact"
  ],
  rings: [
    "Adopt",
    "Trial",
    "Assess",
    "Hold"
  ]
};
