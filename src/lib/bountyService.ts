import { BountyCategory, BountyStatus } from '@/types/bounty';
import type {
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore/lite';
import { FirebaseBounty } from './bounties';
import { db } from './firebase';
import { adminDb } from './firebaseAdmin';

interface FirestoreSubmissionData {
  bountyId: string;
  applicantAddress: string;
  content: string;
  link: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  status: string;
  ranking?: number | null;
}

interface SubmissionWithRanking {
  id: string;
  bountyId: number;
  applicant: string;
  userId: string | null;
  submission: string;
  content: string;
  details: string;
  link: string;
  created: string;
  status: string;
  ranking: number | null;
}

/**
 * BountyService class that handles database operations
 */
export class BountyService {
  private db: any;
  private submissionsRef: any;
  private bountiesRef: any;

  constructor() {
    // Use adminDb if we're in an API route (server-side)
    this.db = typeof window === 'undefined' ? adminDb : db;
    this.submissionsRef = this.db.collection('submissions');
    this.bountiesRef = this.db.collection('bounties');
  }

  /**
   * Get bounty details from database
   */
  async getBountyById(id: string): Promise<FirebaseBounty> {
    try {
      // Get data from Firestore
      const docRef = this.bountiesRef.doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw new Error('Bounty not found');
      }

      const data = docSnap.data() as FirebaseBounty;

      // Return the bounty data
      return {
        id,
        owner: data.owner || '',
        title: data.title || '',
        description: data.description || '',
        reward: data.reward || { amount: '0', asset: 'USDC' },
        distribution: data.distribution || [],
        submissionDeadline: data.submissionDeadline || new Date().toISOString(),
        status: data.status || BountyStatus.OPEN,
        category: data.category || BountyCategory.OTHER,
        skills: data.skills || [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        deadline: data.deadline || new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error fetching bounty ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all bounties from database
   */
  async getAllBounties(filters?: any): Promise<FirebaseBounty[]> {
    try {
      const snapshot = await this.bountiesRef.get();

      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data() as FirebaseBounty;
        return {
          id: doc.id,
          owner: data.owner || '',
          title: data.title || '',
          description: data.description || '',
          reward: data.reward || { amount: '', asset: '' },
          distribution: data.distribution || [],
          submissionDeadline:
            data.submissionDeadline || new Date().toISOString(),
          status: data.status || BountyStatus.OPEN,
          category: data.category || BountyCategory.OTHER,
          skills: data.skills || [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          deadline: data.deadline || new Date().toISOString(),
        } as FirebaseBounty;
      });
    } catch (error) {
      console.error('Error fetching all bounties:', error);
      throw error;
    }
  }

  /**
   * Save submission to database
   */
  async saveSubmissionToDatabase(
    bountyId: string,
    applicantAddress: string,
    content: string,
    submissionId: string,
    link?: string,
    userId?: string
  ) {
    try {
      // Save to Firestore
      const submissionRef = this.submissionsRef.doc(submissionId);
      await submissionRef.set({
        bountyId,
        applicantAddress,
        content,
        link: link || '',
        userId: userId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'PENDING',
      } as FirestoreSubmissionData);

      return submissionId;
    } catch (error) {
      console.error('Error saving submission to database:', error);
      throw new Error('Failed to save submission to database');
    }
  }

  /**
   * Get all submissions for a bounty
   */
  async getBountySubmissions(bountyId: string) {
    try {
      // Get submission data from the database
      const snapshot = await this.submissionsRef
        .where('bountyId', '==', bountyId)
        .get();

      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data() as FirestoreSubmissionData;
        return {
          id: doc.id,
          bountyId,
          applicant: data.applicantAddress,
          userId: data.userId || null,
          submission: data.link || '',
          content: data.content || '',
          details: data.content || '',
          link: data.link || '',
          created: data.createdAt || new Date().toISOString(),
          status: data.status || 'PENDING',
          ranking: data.ranking || null,
        };
      });
    } catch (error) {
      console.error(
        `Error fetching submissions for bounty ${bountyId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get winners for a bounty
   */
  async getBountyWinners(bountyId: string): Promise<
    {
      applicantAddress: string;
      position: number;
      percentage: number;
      content: string;
      rewardAmount: string;
      rewardAsset: string;
    }[]
  > {
    try {
      // Get the bounty details first
      const bounty = await this.getBountyById(bountyId);

      // If the bounty is not completed, it doesn't have winners yet
      if (bounty.status !== 'COMPLETED') {
        return [];
      }

      // Get submissions that have rankings
      const submissions = await this.getBountySubmissions(bountyId);
      const rankedSubmissions = submissions
        .filter((sub: SubmissionWithRanking) => sub.ranking !== null)
        .sort(
          (a: SubmissionWithRanking, b: SubmissionWithRanking) =>
            (a.ranking || 0) - (b.ranking || 0)
        );

      // Match the winners with the distribution percentages
      return bounty.distribution.map((dist, index) => {
        const winner = rankedSubmissions[index] || null;

        // If there's no winner for this position, return placeholder data
        if (!winner) {
          return {
            applicantAddress: 'No winner selected',
            position: dist.position,
            percentage: dist.percentage,
            content: '',
            rewardAmount: '0',
            rewardAsset: bounty.reward.asset,
          };
        }

        return {
          applicantAddress: winner.applicant,
          position: dist.position,
          percentage: dist.percentage,
          content: winner.content,
          rewardAmount: bounty.reward.amount,
          rewardAsset: bounty.reward.asset,
        };
      });
    } catch (error) {
      console.error(`Error fetching winners for bounty ${bountyId}:`, error);
      throw error;
    }
  }

  /**
   * Save bounty to database
   */
  async saveBountyToDatabase(
    bountyId: number,
    data: {
      description: string;
      category: string;
      skills: string[];
      extraRequirements?: string;
      owner: string;
      title: string;
      reward: string | { amount: string; asset: string };
      distribution: { position: number; percentage: number }[];
      deadline: string;
      submissionDeadline: string;
      status: string;
      updatedAt: string;
      sponsorName?: string;
    }
  ) {
    try {
      // Parse reward if it's a string
      let parsedReward: { amount: string; asset: string };
      if (typeof data.reward === 'string') {
        try {
          parsedReward = JSON.parse(data.reward);
        } catch (parseError) {
          console.error('Error parsing reward:', parseError);
          parsedReward = { amount: '0', asset: 'USDC' };
        }
      } else {
        parsedReward = data.reward;
      }

      // Prepare the bounty data
      const bountyData: FirebaseBounty = {
        id: bountyId.toString(),
        description: data.description,
        category: data.category as BountyCategory,
        skills: Array.isArray(data.skills) ? data.skills : [],
        owner: data.owner,
        title: data.title,
        reward: parsedReward,
        deadline: data.deadline,
        submissionDeadline: data.submissionDeadline,
        status: data.status as BountyStatus,
        createdAt: new Date().toISOString(),
        updatedAt: data.updatedAt,
        sponsorName: data.sponsorName || '',
        distribution: data.distribution, // Default empty distribution
      };

      // Validate required fields
      if (!bountyData.title) {
        throw new Error('Title is required');
      }
      if (!bountyData.reward.amount || !bountyData.reward.asset) {
        throw new Error('Reward amount and asset are required');
      }
      if (!bountyData.submissionDeadline) {
        throw new Error('Submission deadline is required');
      }

      // Ensure bountyId is a non-empty string for Firestore doc reference
      if (bountyId === undefined || bountyId === null) {
        throw new Error('bountyId must be a valid number');
      }

      // Convert to string and ensure it's not empty
      const bountyIdStr = String(bountyId);
      if (!bountyIdStr) {
        throw new Error('bountyId must convert to a non-empty string');
      }

      // Save to Firestore
      const bountyRef = this.bountiesRef.doc(bountyIdStr);
      await bountyRef.set(bountyData);

      return bountyId;
    } catch (error) {
      console.error('Error saving bounty to database:', error);
      throw new Error(
        'Failed to save bounty to database: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  }

  /**
   * Select winners for a bounty and process payments
   */
  async selectBountyWinners(
    bountyId: string,
    winnerAddresses: string[],
    userPublicKey: string
  ): Promise<void> {
    try {
      // Get the bounty to verify ownership
      const bounty = await this.getBountyById(bountyId);

      // Verify the user is the bounty owner
      if (bounty.owner !== userPublicKey) {
        throw new Error('Only the bounty owner can select winners');
      }

      // Update bounty status to COMPLETED
      const bountyRef = this.bountiesRef.doc(bountyId);
      await bountyRef.update({
        status: 'COMPLETED',
        updatedAt: new Date().toISOString(),
      });

      // Get ranked submissions
      const submissions = await this.getBountySubmissions(bountyId);
      const rankedSubmissions = submissions
        .filter((sub: SubmissionWithRanking) => sub.ranking !== null)
        .sort(
          (a: SubmissionWithRanking, b: SubmissionWithRanking) =>
            (a.ranking || 0) - (b.ranking || 0)
        );

      // Update submission statuses to COMPLETED for winners
      for (let i = 0; i < winnerAddresses.length; i++) {
        const winningSubmission = rankedSubmissions[i];
        if (winningSubmission) {
          const submissionRef = this.submissionsRef.doc(winningSubmission.id);
          await submissionRef.update({
            status: 'COMPLETED',
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error selecting winners:', error);
      throw error;
    }
  }
}
