import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from '@/lib/firestore';
import { BlockchainError } from '@/utils/errorHandler';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bounties/[id]/submissions/[submissionId]
 * Get a specific submission for a bounty
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const { id, submissionId } = await params;
    if (!id || !submissionId) {
      return NextResponse.json(
        { error: 'Bounty ID and Submission ID are required' },
        { status: 400 }
      );
    }

    console.log(`Fetching submission ${submissionId} for bounty ${id}`);

    // Fetch from the database instead of blockchain
    const submissionRef = doc(db, 'submissions', submissionId);
    const submissionSnap = await getDoc(submissionRef);

    if (!submissionSnap.exists()) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const data = submissionSnap.data();
    console.log(`Found submission data:`, data);

    // Format the submission data
    const submission = {
      id: submissionId,
      bountyId: parseInt(id),
      applicant: data.applicantAddress,
      content: data.content || '',
      details: data.content || '',
      link: data.link || '',
      created: data.createdAt || new Date().toISOString(),
      status: data.status || 'PENDING',
      ranking: data.ranking || null,
    };

    return NextResponse.json({ submission });
  } catch (error) {
    console.error(
      `Error fetching submission for bounty ${(await params).id}:`,
      error
    );
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bounties/[id]/submissions/[submissionId]
 * Rank a submission
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const { id, submissionId } = await params;
    if (!id || !submissionId) {
      return NextResponse.json(
        { error: 'Bounty ID and Submission ID are required' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();

    // Validate the request
    const { action, userId, ranking } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the bounty to verify ownership (admin SDK)
    const bountyRef = adminDb.collection('bounties').doc(id);
    const bountySnap = await bountyRef.get();

    if (!bountySnap.exists) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }

    const bountyData = bountySnap.data();
    if (!bountyData) {
      return NextResponse.json(
        { error: 'Bounty data missing' },
        { status: 500 }
      );
    }

    // Get user data to check if they're a sponsor (admin SDK)
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    if (!userData) {
      return NextResponse.json({ error: 'User data missing' }, { status: 500 });
    }
    const isSponsor = userData.role === 'sponsor';
    const isOwner = bountyData.owner === userId;

    // Only allow owners or sponsors to rank submissions
    if (!isOwner && !isSponsor) {
      return NextResponse.json(
        { error: 'Only bounty owners or sponsors can rank submissions' },
        { status: 403 }
      );
    }

    // Check if it's a ranking update
    if (action === 'rank' && ranking !== undefined) {
      console.log(`Ranking submission ${submissionId} as ${ranking}`);

      // Update the ranking in the database
      const submissionRef = adminDb.collection('submissions').doc(submissionId);
      const submissionSnap = await submissionRef.get();

      if (!submissionSnap.exists) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }

      // Verify the submission belongs to this bounty
      const submissionData = submissionSnap.data();
      if (!submissionData) {
        return NextResponse.json(
          { error: 'Submission data missing' },
          { status: 500 }
        );
      }
      if (
        submissionData.bountyId !== id &&
        submissionData.bountyId !== parseInt(id)
      ) {
        return NextResponse.json(
          { error: 'Submission does not belong to this bounty' },
          { status: 400 }
        );
      }

      // Update the ranking in the database
      await submissionRef.update({
        ranking: ranking,
        updatedAt: new Date().toISOString(),
      });

      console.log(`Updated submission ${submissionId} ranking to ${ranking}`);

      return NextResponse.json({
        success: true,
        message: 'Submission ranked successfully',
        id: submissionId,
        bountyId: id,
        ranking,
      });
    }

    // Handle accept action
    if (action === 'accept') {
      // Only bounty owners can accept submissions
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Only bounty owners can accept submissions' },
          { status: 403 }
        );
      }

      console.log(`Accepting submission ${submissionId}`);

      // Update the status in the database
      const submissionRef = adminDb.collection('submissions').doc(submissionId);
      const submissionSnap = await submissionRef.get();

      if (!submissionSnap.exists) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }

      // Verify the submission belongs to this bounty
      const submissionData = submissionSnap.data();
      if (!submissionData) {
        return NextResponse.json(
          { error: 'Submission data missing' },
          { status: 500 }
        );
      }
      if (
        submissionData.bountyId !== id &&
        submissionData.bountyId !== parseInt(id)
      ) {
        return NextResponse.json(
          { error: 'Submission does not belong to this bounty' },
          { status: 400 }
        );
      }

      // Update the status in the database
      await submissionRef.update({
        status: 'ACCEPTED',
        updatedAt: new Date().toISOString(),
      });

      console.log(`Updated submission ${submissionId} status to ACCEPTED`);

      return NextResponse.json({
        success: true,
        message: 'Submission accepted successfully',
        id: submissionId,
        bountyId: id,
        status: 'ACCEPTED',
      });
    }

    return NextResponse.json(
      { error: 'Valid action (accept or rank) is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      `Error processing submission ${(await params).submissionId} for bounty ${
        (await params).id
      }:`,
      error
    );
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}
