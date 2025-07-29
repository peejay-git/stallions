"use client";

import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  QueryConstraint,
  serverTimestamp,
  updateDoc,
  where,
} from "@/lib/firestore";
import { BountyCategory, BountyStatus, Distribution } from "@/types/bounty";

export interface FirebaseBounty {
  id: string; // When from blockchain: converted from number to string
  title: string;
  description: string;
  distribution: Distribution[];
  submissionDeadline: string;
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
  statusFilters?: ("OPEN" | "CLOSE")[];
  categoryFilters?: string[];
  assetFilters?: string[]; // Filter by reward asset (e.g., 'XLM', 'USDC')
  skills?: string[]; // User must match at least one
}

export async function saveBounty(bounty: any) {
  const bountyRef = collection(db, "bounties");
  const doc = await addDoc(bountyRef, {
    ...bounty,
    status: (bounty.status || "OPEN").toUpperCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return doc.id;
}

export async function getFeaturedBounties(limit = 3) {
  const constraints: QueryConstraint[] = [
    where("status", "==", "OPEN"),
    orderBy("createdAt", "desc"),
  ];

  const q = query(collection(db, "bounties"), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.slice(0, limit).map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || "Untitled Bounty",
      description: data.description || "",
      distribution: data.distribution || [],
      submissionDeadline: data.submissionDeadline || new Date().toISOString(),
      category: data.category || "OTHER",
      skills: data.skills || [],
      reward: data.reward || { amount: "0", asset: "USDC" },
      status: data.status || "OPEN",
      deadline: data.deadline || new Date().toISOString(),
      owner: data.owner || "",
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      ...data,
    };
  });
}

export async function getAllBounties() {
  const q = query(collection(db, "bounties"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || "Untitled Bounty",
      description: data.description || "",
      category: data.category || "OTHER",
      skills: data.skills || [],
      reward: data.reward || { amount: "0", asset: "USDC" },
      status: data.status || "OPEN",
      deadline: data.deadline || new Date().toISOString(),
      owner: data.owner || "",
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

export async function getAllBountiesWithSponsors() {
  const q = query(collection(db, "bounties"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  const bounties = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || "Untitled Bounty",
      description: data.description || "",
      category: data.category || "OTHER",
      skills: data.skills || [],
      reward: data.reward || { amount: "0", asset: "USDC" },
      status: data.status || "OPEN",
      deadline: data.deadline || new Date().toISOString(),
      owner: data.owner || "",
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

  // Step 1: Get unique owner IDs
  // @ts-ignore
  const uniqueOwnerIds = Array.from(
    new Set(bounties.map((b) => b.owner).filter(Boolean))
  );

  // Step 2: Fetch sponsor data in batches (10 per Firestore limitation)
  const sponsorDataMap = new Map();

  for (let i = 0; i < uniqueOwnerIds.length; i += 10) {
    const batch = uniqueOwnerIds.slice(i, i + 10);
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("__name__", "in", batch));
    const userSnapshots = await getDocs(q);
    userSnapshots.forEach((doc) => {
      const data = doc.data();
      sponsorDataMap.set(doc.id, {
        companyName: data.profileData?.companyName || "",
        companyLogo: data.profileData?.companyLogo || "",
        walletAddress: data.wallet?.address || data.wallet?.publicKey || "",
      });
    });
  }

  // Step 3: Merge sponsor data into each bounty
  return bounties.map((bounty) => ({
    ...bounty,
    sponsor: sponsorDataMap.get(bounty.owner) || null,
  }));
}

export async function getBountyById(
  id: string
): Promise<FirebaseBounty | null> {
  const docRef = doc(db, "bounties", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    owner: data.owner || "",
    title: data.title || "",
    description: data.description || "",
    reward: data.reward || { amount: "0", asset: "XLM" },
    distribution: data.distribution || [],
    submissionDeadline: data.submissionDeadline || 0,
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
  const q = query(collection(db, "bounties"), where("owner", "==", ownerId));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      owner: data.owner || "",
      title: data.title || "Untitled Bounty",
      description: data.description || "",
      reward: data.reward || { amount: "0", asset: "XLM" },
      distribution: data.distribution || [],
      submissionDeadline: data.submissionDeadline || new Date().toISOString(),
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
  // If no filters are specified, just return all bounties
  if (
    (!filters.statusFilters || filters.statusFilters.length === 0) &&
    (!filters.categoryFilters || filters.categoryFilters.length === 0) &&
    (!filters.skills || filters.skills.length === 0) &&
    (!filters.assetFilters || filters.assetFilters.length === 0)
  ) {
    return getAllBounties();
  }

  const bountyRef = collection(db, "bounties");
  const constraints: QueryConstraint[] = [];

  let activeFilterCount = 0;
  let inFilterApplied = false;

  // Handle status filters
  if (filters.statusFilters && filters.statusFilters.length > 0) {
    const normalizedStatus = filters.statusFilters
      .slice(0, 10)
      .map((status) => status.toUpperCase());

    constraints.push(where("status", "in", normalizedStatus));
    inFilterApplied = true;
    activeFilterCount++;
  }

  // Handle category filters if no other IN filter is applied
  if (
    filters.categoryFilters &&
    filters.categoryFilters.length > 0 &&
    !inFilterApplied
  ) {
    constraints.push(
      where("category", "in", filters.categoryFilters.slice(0, 10))
    );
    inFilterApplied = true;
    activeFilterCount++;
  }

  // Handle skills filter if no other IN filter is applied
  if (filters.skills && filters.skills.length > 0 && !inFilterApplied) {
    constraints.push(
      where("skills", "array-contains-any", filters.skills.slice(0, 10))
    );
    activeFilterCount++;
  }

  // Handle asset filters if no other IN filter is applied
  if (
    filters.assetFilters &&
    filters.assetFilters.length > 0 &&
    !inFilterApplied
  ) {
    constraints.push(
      where("reward.asset", "in", filters.assetFilters.slice(0, 10))
    );
    activeFilterCount++;
  }

  // Add sorting
  constraints.push(orderBy("createdAt", "desc"));

  // Execute the query
  const q = query(bountyRef, ...constraints);
  const snapshot = await getDocs(q);

  // Get initial results with proper typing
  let results = snapshot.docs.map((doc) => {
    const data = doc.data() as {
      status?: string;
      category?: string;
      skills?: string[];
      reward?: { amount?: string };
      [key: string]: any;
    };

    return {
      id: doc.id,
      ...data,
    };
  });

  // Define a type for our bounty object from Firestore
  type BountyDocument = {
    id: string;
    status?: string;
    category?: string;
    skills?: string[];
    reward?: { amount?: string; asset?: string };
    [key: string]: any;
  };

  // Apply remaining filters client-side if needed

  // Filter by category if it wasn't already applied in the query
  if (
    filters.categoryFilters &&
    filters.categoryFilters.length > 0 &&
    inFilterApplied
  ) {
    results = results.filter(
      (bounty: BountyDocument) =>
        bounty.category && filters.categoryFilters?.includes(bounty.category)
    );
  }

  // Filter by skills if it wasn't already applied in the query
  if (filters.skills && filters.skills.length > 0 && inFilterApplied) {
    results = results.filter(
      (bounty: BountyDocument) =>
        bounty.skills &&
        Array.isArray(bounty.skills) &&
        bounty.skills.some((skill: string) => filters.skills?.includes(skill))
    );
  }

  // Filter by asset if it wasn't already applied in the query
  if (
    filters.assetFilters &&
    filters.assetFilters.length > 0 &&
    inFilterApplied
  ) {
    results = results.filter(
      (bounty: BountyDocument) =>
        bounty.reward?.asset &&
        filters.assetFilters &&
        filters.assetFilters.includes(bounty.reward.asset)
    );
  }

  return results;
}

export async function submitBounty({
  bountyId,
  userId,
  submissionData,
}: SubmitBountyInput) {
  // 1. Fetch bounty to check rules
  const bountyRef = doc(db, "bounties", bountyId);
  const bountySnap = await getDoc(bountyRef);

  if (!bountySnap.exists()) throw new Error("Bounty not found");

  const bounty = bountySnap.data();

  // 2. Check if user is the bounty owner
  if (bounty.owner === userId) {
    throw new Error("You cannot submit work to your own bounty.");
  }

  // 3. Check if deadline has passed
  const deadlineDate = new Date(bounty.deadline);
  const now = new Date();
  if (now > deadlineDate) {
    throw new Error("The submission deadline for this bounty has passed.");
  }

  // 4. Check if user already submitted
  const submissionsRef = collection(db, "submissions");
  const q = query(
    submissionsRef,
    where("bountyId", "==", bountyId),
    where("userId", "==", userId)
  );
  const existing = await getDocs(q);

  if (!existing.empty) {
    throw new Error("You have already submitted work for this bounty.");
  }

  // 5. Save submission
  const docRef = await addDoc(submissionsRef, {
    bountyId,
    userId,
    ...submissionData,
    status: "PENDING",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function bountyHasSubmissions(bountyId: string): Promise<boolean> {
  const submissionsRef = collection(db, "submissions");
  const q = query(submissionsRef, where("bountyId", "==", bountyId));
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
    throw new Error("Bounty not found");
  }

  // Check if the bounty has submissions
  const hasSubmissions = await bountyHasSubmissions(bountyId);
  if (hasSubmissions) {
    throw new Error("Cannot edit a bounty that already has submissions.");
  }

  // If the bounty has a numeric ID (meaning it's on blockchain) and the user provided a public key, update on blockchain
  if (!isNaN(Number(currentBounty.id)) && publicKey) {
    try {
      const { updateBountyOnChain } = await import("@/utils/blockchain");

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

      console.log("Successfully updated bounty on blockchain");
    } catch (error: any) {
      console.error("Error updating bounty on blockchain:", error);
      throw error;
    }
  } else if (!isNaN(Number(currentBounty.id)) && !publicKey) {
    // Warn that blockchain update was skipped because no wallet is connected
    console.warn("Skipping blockchain update because wallet is not connected");
  }

  // Update the bounty in Firestore
  const bountyRef = doc(db, "bounties", bountyId);
  await updateDoc(bountyRef, {
    ...updatedData,
    updatedAt: serverTimestamp(),
  });

  return true;
}

/**
 * Delete a bounty from Firestore and optionally from the blockchain
 * @param bountyId ID of the bounty to delete
 * @param publicKey Optional user's public key for blockchain deletion
 * @returns True if deletion is successful
 */
export async function deleteBounty(
  bountyId: string,
  publicKey?: string
): Promise<boolean> {
  // First get the current bounty data to check if it has a blockchain ID
  const currentBounty = await getBountyById(bountyId);
  if (!currentBounty) {
    throw new Error("Bounty not found");
  }

  // Check if the bounty has submissions
  const hasSubmissions = await bountyHasSubmissions(bountyId);
  if (hasSubmissions) {
    throw new Error("Cannot delete a bounty that already has submissions.");
  }

  // If the bounty has a numeric ID (meaning it's on blockchain) and the user provided a public key, delete from blockchain
  if (!isNaN(Number(currentBounty.id)) && publicKey) {
    try {
      const { deleteBountyOnChain } = await import("@/utils/blockchain");

      // Delete from blockchain
      await deleteBountyOnChain({
        userPublicKey: publicKey,
        bountyId: Number(currentBounty.id),
      });

      console.log("Successfully deleted bounty from blockchain");
    } catch (error: any) {
      console.error("Error deleting bounty from blockchain:", error);
      throw error;
    }
  } else if (!isNaN(Number(currentBounty.id)) && !publicKey) {
    // Warn that blockchain deletion was skipped because no wallet is connected
    console.warn(
      "Skipping blockchain deletion because wallet is not connected"
    );
  }

  // Delete the bounty from Firestore
  const bountyRef = doc(db, "bounties", bountyId);
  await deleteDoc(bountyRef);

  return true;
}
