import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from '@/lib/firestore';
import { BlockchainError } from '@/utils/error-handler';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Define interface for submission data
interface SubmissionData {
  id: string;
  bountyId: string;
  applicantAddress: string;
  userId?: string | null;
  content?: string;
  links?: string;
  createdAt?: string;
  submittedAt?: { toDate?: () => Date };
  status?: string;
}

/**
 * GET /api/user/submissions
 * Get all submissions for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from the request
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');

    if (!userId && !walletAddress) {
      return NextResponse.json(
        { error: 'User ID or wallet address required as query parameter' },
        { status: 400 }
      );
    }

    console.log('Fetching submissions for:', { userId, walletAddress });

    // Get submissions from database
    const submissionsRef = collection(db, 'submissions');

    // Build query conditions
    const conditions = [];

    if (userId) {
      conditions.push(query(submissionsRef, where('userId', '==', userId)));
    }

    if (walletAddress) {
      conditions.push(
        query(submissionsRef, where('applicantAddress', '==', walletAddress))
      );
    }

    // Execute queries and combine results
    const allSubmissions: SubmissionData[] = [];

    for (const q of conditions) {
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Add each submission to the results, avoiding duplicates
        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data() as Omit<SubmissionData, 'id'>;
          console.log(
            `DEBUG: Raw submission data for ${docSnapshot.id}:`,
            JSON.stringify(data)
          );

          if (!data.applicantAddress) {
            console.error(
              `ERROR: Missing applicantAddress in submission ${docSnapshot.id}`
            );
          }

          if (!allSubmissions.some((s) => s.id === docSnapshot.id)) {
            allSubmissions.push({
              id: docSnapshot.id,
              ...data,
            });
          }
        });
      }
    }

    // If there are no submissions, return empty array
    if (allSubmissions.length === 0) {
      return NextResponse.json([]);
    }

    console.log(`DEBUG: Found ${allSubmissions.length} submissions for user`);

    // Get bounty titles for each submission
    const submissions = await Promise.all(
      allSubmissions.map(async (submission) => {
        // Get bounty details to include title
        let bountyTitle = 'Unknown Bounty';
        try {
          const bountyRef = doc(db, 'bounties', submission.bountyId);
          const bountySnap = await getDoc(bountyRef);
          if (bountySnap.exists()) {
            bountyTitle = bountySnap.data().title || 'Unknown Bounty';
          }
        } catch (error) {
          console.error(`Error fetching bounty ${submission.bountyId}:`, error);
        }

        // Ensure applicantAddress is present
        const applicantAddress = submission.applicantAddress || 'Unknown';

        return {
          id: submission.id,
          bountyId: submission.bountyId,
          bountyTitle,
          applicant: applicantAddress,
          walletAddress: applicantAddress, // Add this field explicitly for consistency
          content: submission.content || '',
          links: submission.links || '',
          submitted:
            submission.createdAt ||
            submission.submittedAt?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
          status: submission.status || 'PENDING',
        };
      })
    );

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
