export interface SubmissionData {
  id: string;
  bountyId: string;
  applicantAddress: string;
  userId?: string | null;
  content?: string;
  link?: string;
  createdAt?: string;
  status?: string;
}
