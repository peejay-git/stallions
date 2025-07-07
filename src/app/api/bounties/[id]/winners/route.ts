import { BountyService } from '@/lib/bountyService';
import { BlockchainError } from '@/utils/errorHandler';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bounties/[id]/winners
 * Get winners for a bounty
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // Create bounty service
    const bountyService = new BountyService();

    // Get the winners for the bounty
    const winners = await bountyService.getBountyWinners(id);

    return NextResponse.json(winners);
  } catch (error) {
    console.error(
      `Error fetching winners for bounty ${(await params).id}:`,
      error
    );
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bounties/[id]/winners
 * Select winners for a bounty and process payments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      console.error('Error: Bounty ID is missing');
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { winnerAddresses, userPublicKey } = body;

    // Validate required fields
    if (!winnerAddresses || !Array.isArray(winnerAddresses) || !userPublicKey) {
      console.error('Error: Invalid request body', {
        winnerAddresses,
        userPublicKey,
      });
      return NextResponse.json(
        { error: 'Winner addresses and user public key are required' },
        { status: 400 }
      );
    }

    // Create bounty service
    const bountyService = new BountyService();

    try {
      // Select winners for the bounty - this will call the blockchain to process payments
      await bountyService.selectBountyWinners(
        parseInt(id),
        winnerAddresses,
        userPublicKey
      );

      return NextResponse.json({
        success: true,
        message: 'Winners selected and payments are being processed',
        winnerAddresses,
      });
    } catch (error: any) {
      console.error('Error selecting winners:', error);

      // Return a more specific error message
      if (error.message?.includes('Only the bounty owner')) {
        return NextResponse.json(
          { error: 'Only the bounty owner can select winners' },
          { status: 403 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error(
      `Error selecting winners for bounty ${(await params).id}:`,
      error
    );
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to select winners',
      },
      { status: 500 }
    );
  }
}
