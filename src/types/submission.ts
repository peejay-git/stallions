export interface SubmissionData {
  id: string;
  bountyId: string;
  applicantAddress: string;
  userId?: string | null;
  content?: string;
  links?: string;
  createdAt?: string;
  submittedAt?: {
    toDate: () => Date;
  };
  status?: string;
}
