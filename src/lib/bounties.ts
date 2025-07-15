'use client';

import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  QueryConstraint,
  serverTimestamp,
  updateDoc,
  where,
} from '@/lib/firestore';
import { BountyCategory, BountyStatus, Distribution } from '@/types/bounty';

export interface FirebaseBounty {
  id: string; // When from blockchain: converted from number to string
  title: string;
  description: string;
  distribution: Distribution[];
  submissionDeadline: string;
  judgingDeadline: string;
  category: string;
  skills: string[];
  reward: { amount: string; asset: string };
  sponsorName?: string;
  status: string;
  deadline: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

interface SubmitBountyInput {
  bountyId: string;
  userId: string;
  submissionData: any;
}
interface FilterOptions {
  statusFilters?: ('OPEN' | 'CLOSE')[];
  categoryFilters?: string[];
  rewardRange?: {
    min?: number;
    max?: number;
  };
  skills?: string[]; // User must match at least one
}

export async function saveBounty(bounty: any) {
  const bountyRef = collection(db, 'bounties');
  const doc = await addDoc(bountyRef, {
    ...bounty,
    status: (bounty.status || 'OPEN').toUpperCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return doc.id;
}

export async function getFeaturedBounties(limit = 3) {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'OPEN'),
    orderBy('createdAt', 'desc'),
  ];

  const q = query(collection(db, 'bounties'), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.slice(0, limit).map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || 'Untitled Bounty',
      description: data.description || '',
      distribution: data.distribution || [],
      submissionDeadline: data.submissionDeadline || new Date().toISOString(),
      judgingDeadline: data.judgingDeadline || new Date().toISOString(),
      category: data.category || 'OTHER',
      skills: data.skills || [],
      reward: data.reward || { amount: '0', asset: 'USDC' },
      status: data.status || 'OPEN',
      deadline: data.deadline || new Date().toISOString(),
      owner: data.owner || '',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      ...data,
    };
  });
}

export async function getAllBounties() {
  const q = query(collection(db, 'bounties'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || 'Untitled Bounty',
      description: data.description || '',
      category: data.category || 'OTHER',
      skills: data.skills || [],
      reward: data.reward || { amount: '0', asset: 'USDC' },
      status: data.status || 'OPEN',
      deadline: data.deadline || new Date().toISOString(),
      owner: data.owner || '',
      createdAt: data.createdAt || {
        seconds: Date.now() / 1000,
        nanoseconds: 0,
      },
      updatedAt: data.updatedAt || {
        seconds: Date.now() / 1000,
        nanoseconds: 0,
      },
      ...data,
    };
  });
}

export async function getBountyById(
  id: string
): Promise<FirebaseBounty | null> {
  const docRef = doc(db, 'bounties', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    owner: data.owner || '',
    title: data.title || '',
    description: data.description || '',
    reward: data.reward || { amount: '0', asset: 'XLM' },
    distribution: data.distribution || [],
    submissionDeadline: data.submissionDeadline || 0,
    judgingDeadline: data.judgingDeadline || 0,
    status: data.status || BountyStatus.OPEN,
    category: data.category || BountyCategory.OTHER,
    skills: data.skills || [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    deadline: data.deadline || new Date().toISOString(),
  };
}

export async function getBountiesByOwner(
  ownerId: string
): Promise<FirebaseBounty[]> {
  const q = query(collection(db, 'bounties'), where('owner', '==', ownerId));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      owner: data.owner || '',
      title: data.title || 'Untitled Bounty',
      description: data.description || '',
      reward: data.reward || { amount: '0', asset: 'XLM' },
      distribution: data.distribution || [],
      submissionDeadline: data.submissionDeadline || new Date().toISOString(),
      judgingDeadline: data.judgingDeadline || new Date().toISOString(),
      status: data.status || BountyStatus.OPEN,
      category: data.category || BountyCategory.OTHER,
      skills: data.skills || [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      deadline: data.deadline || new Date().toISOString(),
    };
  });
}

export async function getFilteredBounties(filters: FilterOptions) {
  const bountyRef = collection(db, 'bounties');
  const constraints: QueryConstraint[] = [];

  if (filters.statusFilters && filters.statusFilters.length > 0) {
    const normalizedStatus = filters.statusFilters
      .slice(0, 10)
      .map((status) => status.toUpperCase());
    constraints.push(where('status', 'in', normalizedStatus));
  }

  if (filters.categoryFilters && filters.categoryFilters.length > 0) {
    constraints.push(
      where('category', 'in', filters.categoryFilters.slice(0, 10))
    );
  }

  if (
    filters.rewardRange?.min !== undefined &&
    filters.rewardRange.min !== null
  ) {
    constraints.push(
      where('reward.amount', '>=', filters.rewardRange.min.toString())
    );
  }

  if (
    filters.rewardRange?.max !== undefined &&
    filters.rewardRange.max !== null
  ) {
    constraints.push(
      where('reward.amount', '<=', filters.rewardRange.max.toString())
    );
  }
  if (filters.skills && filters.skills.length > 0) {
    constraints.push(
      where('skills', 'array-contains-any', filters.skills.slice(0, 10))
    );
  }

  // Firestore only allows **one** of in/array-contains-any per query
  // If you use both 'status in' and 'category in' or 'skills array-contains-any' → you'll hit an error.
  if (
    [filters.statusFilters, filters.categoryFilters, filters.skills].filter(
      (f) => Array.isArray(f) && f.length > 0
    ).length > 1
  ) {
    throw new Error(
      'Firestore only allows one `in` or `array-contains-any` filter per query. Please narrow your filters.'
    );
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(bountyRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function submitBounty({
  bountyId,
  userId,
  submissionData,
}: SubmitBountyInput) {
  // 1. Fetch bounty to check rules
  const bountyRef = doc(db, 'bounties', bountyId);
  const bountySnap = await getDoc(bountyRef);

  if (!bountySnap.exists()) throw new Error('Bounty not found');

  const bounty = bountySnap.data();

  // 2. Check if user is the bounty owner
  if (bounty.owner === userId) {
    throw new Error('You cannot submit work to your own bounty.');
  }

  // 3. Check if deadline has passed
  const deadlineDate = new Date(bounty.deadline);
  const now = new Date();
  if (now > deadlineDate) {
    throw new Error('The submission deadline for this bounty has passed.');
  }

  // 4. Check if user already submitted
  const submissionsRef = collection(db, 'submissions');
  const q = query(
    submissionsRef,
    where('bountyId', '==', bountyId),
    where('userId', '==', userId)
  );
  const existing = await getDocs(q);

  if (!existing.empty) {
    throw new Error('You have already submitted work for this bounty.');
  }

  // 5. Save submission
  const docRef = await addDoc(submissionsRef, {
    bountyId,
    userId,
    ...submissionData,
    submittedAt: serverTimestamp(),
    status: 'PENDING',
  });

  return docRef.id;
}

export async function bountyHasSubmissions(bountyId: string): Promise<boolean> {
  const submissionsRef = collection(db, 'submissions');
  const q = query(submissionsRef, where('bountyId', '==', bountyId));
  const snapshot = await getDocs(q);

  return !snapshot.empty;
}

/**
 * Update a bounty in Firestore and optionally on the blockchain
 * @param bountyId ID of the bounty to update
 * @param updatedData Updated bounty data
 * @param publicKey Optional user's public key for blockchain updates
 * @returns True if update is successful
 */
export async function updateBounty(
  bountyId: string,
  updatedData: any,
  publicKey?: string
) {
  // First get the current bounty data to check if it has a blockchain ID
  const currentBounty = await getBountyById(bountyId);
  if (!currentBounty) {
    throw new Error('Bounty not found');
  }

  // Check if the bounty has submissions
  const hasSubmissions = await bountyHasSubmissions(bountyId);
  if (hasSubmissions) {
    throw new Error('Cannot edit a bounty that already has submissions.');
  }

  // If the bounty has a numeric ID (meaning it's on blockchain) and the user provided a public key, update on blockchain
  if (!isNaN(Number(currentBounty.id)) && publicKey) {
    try {
      const { updateBountyOnChain } = await import('@/utils/blockchain');

      // Convert distribution from Firebase format to blockchain format if present
      let distribution = undefined;
      if (
        currentBounty.distribution &&
        Array.isArray(currentBounty.distribution)
      ) {
        distribution = currentBounty.distribution.map((dist) => ({
          position: dist.position,
          percentage: dist.percentage,
        }));
      }

      // Parse deadline into timestamp if present
      let submissionDeadline = undefined;
      if (updatedData.deadline) {
        submissionDeadline = new Date(updatedData.deadline).getTime();
      }

      // Update on blockchain
      await updateBountyOnChain({
        userPublicKey: publicKey,
        bountyId: Number(currentBounty.id),
        title: updatedData.title,
        distribution: distribution,
        submissionDeadline: submissionDeadline,
      });

      console.log('Successfully updated bounty on blockchain');
    } catch (error: any) {
      console.error('Error updating bounty on blockchain:', error);

      // If blockchain update fails, ask user if they want to continue with off-chain update
      if (
        !confirm(
          'Failed to update on blockchain. Continue with off-chain update only?'
        )
      ) {
        throw error;
      }
    }
  } else if (!isNaN(Number(currentBounty.id)) && !publicKey) {
    // Warn that blockchain update was skipped because no wallet is connected
    console.warn('Skipping blockchain update because wallet is not connected');
  }

  // Update the bounty in Firestore
  const bountyRef = doc(db, 'bounties', bountyId);
  await updateDoc(bountyRef, {
    ...updatedData,
    updatedAt: serverTimestamp(),
  });

  return true;
}
