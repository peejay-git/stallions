export enum Status {
  Active = 'Active',
  InReview = 'InReview',
  Completed = 'Completed',
}

export enum BountyStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BountyCategory {
  DEVELOPMENT = 'DEVELOPMENT',
  DESIGN = 'DESIGN',
  MARKETING = 'MARKETING',
  RESEARCH = 'RESEARCH',
  OTHER = 'OTHER',
}

export interface Distribution {
  percentage: number;
  position: number;
}

export interface Bounty {
  id: number;
  owner: string;
  title: string;
  description: string;
  reward: {
    amount: string;
    asset: string;
  };
  distribution: Distribution[];
  submissionDeadline: number;
  status: BountyStatus;
  category: BountyCategory;
  skills: string[];
  createdAt: string;
  updatedAt: string;
  deadline: string;
  sponsorName?: string;
  sponsorLogo?: string;
}

export interface Submission {
  id: string;
  bountyId: number;
  applicant: string;
  walletAddress?: string;
  userId?: string | null;
  content: string;
  link: string;
  created: string;
  status: BountyStatus;
  ranking: number | null;
}
