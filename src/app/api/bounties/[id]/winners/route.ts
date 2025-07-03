import { NextRequest, NextResponse } from 'next/server';
import { BountyService } from '@/lib/bountyService';
import { BlockchainError } from '@/utils/error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bounties/[id]/winners
 * Get winners for a bounty
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
    
    // Get the winners for the bounty
    const winners = await bountyService.getBountyWinners(id);

    return NextResponse.json(winners);
  } catch (error) {
    console.error(`Error fetching winners for bounty ${params.id}:`, error);
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
  { params }: { params: { id: string } }
) {
  try {
    console.log('POST /api/bounties/[id]/winners - Request received');
    console.log('Params:', params);

    const { id } = params;
    if (!id) {
      console.log('Error: Bounty ID is missing');
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();
    console.log('Request body:', body);
    const { winnerAddresses, userPublicKey } = body;

    // Validate required fields
    if (!winnerAddresses || !Array.isArray(winnerAddresses) || !userPublicKey) {
      console.log('Error: Invalid request body', { winnerAddresses, userPublicKey });
      return NextResponse.json(
        { error: 'Winner addresses and user public key are required' },
        { status: 400 }
      );
    }

    console.log('Selecting winners for bounty:', {
      bountyId: id,
      userPublicKey,
      winnerAddresses
    });

    // Create bounty service
    const bountyService = new BountyService();
    
    try {
      // Select winners for the bounty - this will call the blockchain to process payments
      await bountyService.selectBountyWinners(
        parseInt(id),
        winnerAddresses,
        userPublicKey
      );

      console.log('Winners selected successfully');
    return NextResponse.json({
      success: true,
        message: 'Winners selected and payments are being processed',
        winnerAddresses
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
    console.error(`Error selecting winners for bounty ${params.id}:`, error);
    if (error instanceof BlockchainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to select winners' },
      { status: 500 }
    );
  }
} 