import { adminDb } from '@/lib/firebaseAdmin';
import { SubmissionData } from '@/types/submission';
import { CollectionReference, Query } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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

    // Get submissions from database and build query
    let submissionsQuery: CollectionReference | Query =
      adminDb.collection('submissions');

    // Add query conditions
    if (userId) {
      submissionsQuery = submissionsQuery.where('userId', '==', userId);
    }

    if (walletAddress) {
      submissionsQuery = submissionsQuery.where(
        'applicantAddress',
        '==',
        walletAddress
      );
    }

    // Execute the query
    const querySnapshot = await submissionsQuery.get();
    const submissions = querySnapshot.docs.map((doc) => {
      const data = doc.data() as SubmissionData;
      return {
        ...data,
        id: doc.id,
      };
    });

    // Sort submissions by createdAt date
    const sortedSubmissions = submissions.sort((a, b) => {
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
