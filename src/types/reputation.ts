export interface TalentBadge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: BadgeCriteria;
}

export interface BadgeCriteria {
  completedBounties?: number;
  totalEarned?: number;
  successRate?: number;
  specialization?: string[];
}

export interface TalentReputation {
  userId: string;
  totalBounties: number;
  completedBounties: number;
  totalEarned: number;
  successRate: number;
  specializations: string[];
  badges: string[]; // Badge IDs
  verificationLevel: VerificationLevel;
  lastUpdated: string;
}

export enum VerificationLevel {
  UNVERIFIED = 'UNVERIFIED',
  BASIC = 'BASIC',
  VERIFIED = 'VERIFIED',
  EXPERT = 'EXPERT',
}

export interface VerificationRequirement {
  level: VerificationLevel;
  requirements: {
    minCompletedBounties?: number;
    minTotalEarned?: number;
    minSuccessRate?: number;
    requiredBadges?: string[];
  };
}
