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
import { Bounty, BountyCategory, BountyStatus } from '@/types/bounty';

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

export async function getBountyById(id: string): Promise<Bounty | null> {
  const docRef = doc(db, 'bounties', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: parseInt(docSnap.id), // Convert string ID to number
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
    created: data.created || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    deadline: data.deadline || new Date().toISOString(),
  };
}

export async function getBountiesByOwner(ownerId: string): Promise<Bounty[]> {
  const q = query(collection(db, 'bounties'), where('owner', '==', ownerId));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: parseInt(doc.id), // Convert string ID to number
      owner: data.owner || '',
      title: data.title || 'Untitled Bounty',
      description: data.description || '',
      reward: data.reward || { amount: '0', asset: 'XLM' },
      distribution: data.distribution || [],
      submissionDeadline: data.submissionDeadline || 0,
      judgingDeadline: data.judgingDeadline || 0,
      status: data.status || BountyStatus.OPEN,
      category: data.category || BountyCategory.OTHER,
      skills: data.skills || [],
      created: data.createdAt || new Date().toISOString(),
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

export async function updateBounty(bountyId: string, updatedData: any) {
  // First check if the bounty has submissions
  const hasSubmissions = await bountyHasSubmissions(bountyId);

  if (hasSubmissions) {
    throw new Error('Cannot edit a bounty that already has submissions.');
  }

  const bountyRef = doc(db, 'bounties', bountyId);

  // Update the bounty with the new data
  await updateDoc(bountyRef, {
    ...updatedData,
    updatedAt: serverTimestamp(),
  });

  return true;
}
