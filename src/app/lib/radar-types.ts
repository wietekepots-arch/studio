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

export interface RadarItem {
  id: string;
  name: string;
  shortDesc: string;
  notes: string;
  quadrantId: number; // 0 to 3
  ringId: number;     // 0 to 3
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
  links: string[];
  status: ItemStatus;
  lastReviewedAt: number;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  viewCount?: number;
}

export interface Comment {
  id: string;
  itemId: string;
  text: string;
  createdAt: number;
  createdBy: string;
  createdByName: string;
}

export interface HistoryEntry {
  id: string;
  itemId: string;
  action: string;
  before?: any;
  after?: any;
  createdAt: number;
  createdBy: string;
}

export const DEFAULT_CONFIG: RadarConfig = {
  quadrants: [
    "Tools & Platforms",
    "Methods & Workflow",
    "Data & Governance",
    "Delivery & Client Impact"
  ],
  rings: [
    "Adopt",
    "Trial",
    "Assess",
    "Hold"
  ]
};