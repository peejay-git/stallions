import { adminDb } from '@/lib/firebaseAdmin';
import { SubmissionData } from '@/types/submission';
import { FirebaseBounty } from '@/lib/bounties';
import { CollectionReference, Query } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required as query parameter' },
        { status: 400 }
      );
    }

    console.log('Fetching submissions for:', { walletAddress });

    // Get submissions from database and build query
    let submissionsQuery: CollectionReference | Query =
      adminDb.collection('submissions');

    // Only use walletAddress for query
    submissionsQuery = submissionsQuery.where('applicantAddress', '==', walletAddress);

    // Execute the query
    const querySnapshot = await submissionsQuery.get();
    const submissions = querySnapshot.docs.map((doc) => {
      const data = doc.data() as SubmissionData;
      return {
        ...data,
        id: doc.id,
      };
    });

    // Fetch bounty details for each submission
    const submissionsWithBounties = await Promise.all(
      submissions.map(async (submission) => {
        try {
          // Skip if no bountyId
          if (!submission.bountyId) {
            return {
              ...submission,
              bounty: null,
            };
          }

          // Get the bounty document
          const bountyDoc = await adminDb
            .collection('bounties')
            .doc(submission.bountyId)
            .get();

          if (!bountyDoc.exists) {
            console.log(`Bounty not found for submission ${submission.id}`);
            return {
              ...submission,
              bounty: null,
            };
          }

          const bountyData = bountyDoc.data() as FirebaseBounty;
          return {
            ...submission,
            bounty: {
              ...bountyData,
              id: bountyDoc.id,
            },
          };
        } catch (error) {
          console.error(
            `Error fetching bounty for submission ${submission.id}:`,
            error
          );
          return {
            ...submission,
            bounty: null,
          };
        }
      })
    );

    // Sort submissions by createdAt date
    const sortedSubmissions = submissionsWithBounties.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Descending order
    });

    return NextResponse.json(sortedSubmissions);
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: `Failed to fetch submissions: ${error.message}` },
      { status: 500 }
    );
  }
}
