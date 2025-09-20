import { db } from './firebase';
import {
  TalentReputation,
  VerificationLevel,
  TalentBadge,
  VerificationRequirement,
} from '@/types/reputation';
import { collection, doc, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';

const VERIFICATION_REQUIREMENTS: VerificationRequirement[] = [
  {
    level: VerificationLevel.BASIC,
    requirements: {
      minCompletedBounties: 1,
      minSuccessRate: 80,
    },
  },
  {
    level: VerificationLevel.VERIFIED,
    requirements: {
      minCompletedBounties: 5,
      minTotalEarned: 1000,
      minSuccessRate: 90,
    },
  },
  {
    level: VerificationLevel.EXPERT,
    requirements: {
      minCompletedBounties: 20,
      minTotalEarned: 5000,
      minSuccessRate: 95,
      requiredBadges: ['consistent_performer', 'top_earner'],
    },
  },
];

export class ReputationService {
  private static instance: ReputationService;

  private constructor() {}

  static getInstance(): ReputationService {
    if (!ReputationService.instance) {
      ReputationService.instance = new ReputationService();
    }
    return ReputationService.instance;
  }

  async getTalentReputation(userId: string): Promise<TalentReputation | null> {
    try {
      const docRef = doc(db, 'reputation', userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docSnap.data() as TalentReputation;
    } catch (error) {
      console.error('Error fetching talent reputation:', error);
      return null;
    }
  }

  async updateReputation(userId: string, updates: Partial<TalentReputation>): Promise<void> {
    try {
      const docRef = doc(db, 'reputation', userId);
      await updateDoc(docRef, {
        ...updates,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating reputation:', error);
      throw error;
    }
  }

  async getBadges(userId: string): Promise<TalentBadge[]> {
    try {
      const reputation = await this.getTalentReputation(userId);
      if (!reputation?.badges?.length) return [];

      const badgesRef = collection(db, 'badges');
      const badgesSnap = await getDocs(
        query(badgesRef, where('id', 'in', reputation.badges))
      );

      return badgesSnap.docs.map((doc) => doc.data() as TalentBadge);
    } catch (error) {
      console.error('Error fetching badges:', error);
      return [];
    }
  }

  async checkAndUpdateVerificationLevel(userId: string): Promise<VerificationLevel> {
    try {
      const reputation = await this.getTalentReputation(userId);
      if (!reputation) return VerificationLevel.UNVERIFIED;

      // Check requirements from highest to lowest
      for (const { level, requirements } of VERIFICATION_REQUIREMENTS.reverse()) {
        if (
          (!requirements.minCompletedBounties || reputation.completedBounties >= requirements.minCompletedBounties) &&
          (!requirements.minTotalEarned || reputation.totalEarned >= requirements.minTotalEarned) &&
          (!requirements.minSuccessRate || reputation.successRate >= requirements.minSuccessRate) &&
          (!requirements.requiredBadges?.length || requirements.requiredBadges.every((badge) => reputation.badges.includes(badge)))
        ) {
          if (reputation.verificationLevel !== level) {
            await this.updateReputation(userId, { verificationLevel: level });
          }
          return level;
        }
      }

      return VerificationLevel.UNVERIFIED;
    } catch (error) {
      console.error('Error checking verification level:', error);
      return VerificationLevel.UNVERIFIED;
    }
  }

  async calculateSuccessRate(userId: string): Promise<number> {
    try {
      const reputation = await this.getTalentReputation(userId);
      if (!reputation || !reputation.totalBounties) return 0;

      return (reputation.completedBounties / reputation.totalBounties) * 100;
    } catch (error) {
      console.error('Error calculating success rate:', error);
      return 0;
    }
  }

  getVerificationRequirements(level: VerificationLevel): VerificationRequirement | null {
    return VERIFICATION_REQUIREMENTS.find((req) => req.level === level) || null;
  }
}
