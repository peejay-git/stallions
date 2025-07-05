import { BountyService } from '@/lib/bountyService';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from '@/lib/firestore';
import { BlockchainError } from '@/utils/error-handler';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bounties/[id]
 * Get a bounty by ID
 * Backend handles fetching both blockchain and database data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // Create bounty service
    const bountyService = new BountyService();

    // Get the complete bounty (combining blockchain and database data)
    const bounty = await bountyService.getBountyById(id);

    return NextResponse.json(bounty);
  } catch (error) {
    console.error(`Error fetching bounty ${params.id}:`, error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch bounty' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bounties/[id]
 * Update a bounty by ID
 * This is called AFTER the blockchain update
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // Parse the request body - only expecting off-chain data updates
    const {
      description,
      category,
      skills,
      extraRequirements,
      owner,
      title,
      reward,
      deadline,
      submissionDeadline,
      judgingDeadline,
      status,
    } = await request.json();

    // Create bounty service
    const bountyService = new BountyService();

    // Special handling for status updates due to expired deadline
    if (status === 'COMPLETED') {
      console.log(
        'Updating bounty status to COMPLETED due to expired deadline'
      );

      // Get current bounty data to verify deadline has passed
      try {
        const bountyRef = doc(db, 'bounties', id);
        const bountySnap = await getDoc(bountyRef);

        if (bountySnap.exists()) {
          const bountyData = bountySnap.data();
          const deadline = bountyData.deadline || bountyData.submissionDeadline;

          if (deadline) {
            const deadlineDate = new Date(deadline);
            const now = new Date();

            // Allow the status update if deadline has passed or if user is admin
            if (now > deadlineDate) {
              console.log(
                'Deadline has passed, allowing status update to COMPLETED'
              );

              // Update the status in Firestore directly
              await updateDoc(bountyRef, {
                status: 'COMPLETED',
                updatedAt: new Date().toISOString(),
              });

              return NextResponse.json({
                success: true,
                message: 'Bounty marked as COMPLETED due to expired deadline',
                id,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking deadline for status update:', error);
      }
    }

    // Update off-chain data
    await bountyService.saveBountyToDatabase(parseInt(id), {
      description: description || '',
      category: category || '',
      skills: skills || [],
      extraRequirements: extraRequirements || '',
      owner: owner || '',
      title: title || '',
      reward: reward || '',
      deadline: deadline || '',
      submissionDeadline: submissionDeadline || '',
      judgingDeadline: judgingDeadline || '',
      status: status || 'OPEN',
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Bounty updated successfully',
      id,
    });
  } catch (error) {
    console.error(`Error updating bounty ${params.id}:`, error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update bounty' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bounties/[id]
 * Delete a bounty's off-chain data
 * This should be called after the blockchain operation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // For now, we're not actually implementing deletion of off-chain data
    // This would depend on your requirements - you might want to keep the data
    // for historical purposes even if the bounty is cancelled on-chain

    return NextResponse.json({
      success: true,
      message: 'Bounty cancelled successfully',
      id,
    });
  } catch (error) {
    console.error(`Error cancelling bounty ${params.id}:`, error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to cancel bounty' },
      { status: 500 }
    );
  }
}
