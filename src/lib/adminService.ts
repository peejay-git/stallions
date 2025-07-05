import { db } from '@/lib/firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from '@/lib/firestore';
import { Bounty, BountyCategory, BountyStatus } from '@/types/bounty';

// Get all bounties for admin view
export async function getAllBounties() {
  try {
    const bountiesRef = collection(db, 'bounties');
    const q = query(bountiesRef, orderBy('created', 'desc'));
    const snapshot = await getDocs(q);

    // Cast the data with type conversion to ensure it matches the Bounty interface
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: parseInt(doc.id), // Convert string ID to number
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
      } as Bounty;
    });
  } catch (error) {
    console.error('Error getting all bounties:', error);
    throw error;
  }
}

// Get all submissions across all bounties
export async function getAllSubmissions() {
  try {
    const submissionsRef = collection(db, 'submissions');
    const q = query(submissionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const submissions = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        bountyId: data.bountyId || '',
        userId: data.userId || '',
        content: data.content || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        status: data.status || 'PENDING',
        bountyTitle: data.bountyTitle || '',
        applicant: data.applicantAddress || '',
        links: data.links || '',
        ranking: data.ranking || null,
      };
    });

    return submissions;
  } catch (error) {
    console.error('Error getting all submissions:', error);
    throw error;
  }
}

// Get all users
export async function getAllUsers() {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt || new Date().toISOString(),
      lastLogin: doc.data().lastLogin || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

// Update bounty status (for admin operations)
export async function updateBountyStatus(bountyId: string, status: string) {
  try {
    const bountyRef = doc(db, 'bounties', bountyId);
    await updateDoc(bountyRef, {
      status: status,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error updating bounty status:', error);
    throw error;
  }
}

// Delete bounty (admin only)
export async function deleteBounty(bountyId: string) {
  try {
    const bountyRef = doc(db, 'bounties', bountyId);

    // Check if bounty has submissions
    const submissionsRef = collection(db, 'submissions');
    const q = query(submissionsRef, where('bountyId', '==', bountyId));
    const snapshot = await getDocs(q);

    // Delete all submissions for this bounty
    const deleteSubmissions = snapshot.docs.map((doc) => deleteDoc(doc.ref));

    await Promise.all(deleteSubmissions);

    // Delete the bounty
    await deleteDoc(bountyRef);
    return true;
  } catch (error) {
    console.error('Error deleting bounty:', error);
    throw error;
  }
}

// Add admin role to user
export async function makeUserAdmin(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'admin',
    });
    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    throw error;
  }
}

// Get platform stats for admin dashboard
export async function getPlatformStats() {
  try {
    // Get total users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const totalUsers = usersSnapshot.docs.length;

    // Get total bounties
    const bountiesRef = collection(db, 'bounties');
    const bountiesSnapshot = await getDocs(bountiesRef);
    const totalBounties = bountiesSnapshot.docs.length;

    // Get total submissions
    const submissionsRef = collection(db, 'submissions');
    const submissionsSnapshot = await getDocs(submissionsRef);
    const totalSubmissions = submissionsSnapshot.docs.length;

    // Get total completed bounties
    const completedBountiesQ = query(
      bountiesRef,
      where('status', '==', 'COMPLETED')
    );
    const completedBountiesSnapshot = await getDocs(completedBountiesQ);
    const totalCompletedBounties = completedBountiesSnapshot.docs.length;

    return {
      totalUsers,
      totalBounties,
      totalSubmissions,
      totalCompletedBounties,
    };
  } catch (error) {
    console.error('Error getting platform stats:', error);
    throw error;
  }
}
