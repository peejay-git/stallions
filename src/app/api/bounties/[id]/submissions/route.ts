import { NextRequest, NextResponse } from 'next/server';
import { BlockchainError } from '@/utils/error-handler';
import { BountyService } from '@/lib/bountyService';
import { adminDb } from '@/lib/firebase-admin';

interface Submission {
  applicant: string;
  userId: string | null;
}

export const dynamic = 'force-dynamic';

/**
 * GET /api/bounties/[id]/submissions
 * Get submissions for a bounty
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`API: Getting submissions for bounty ID ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // Create bounty service
    const bountyService = new BountyService();
    
    // First get the bounty to check if it exists
    let bounty;
    try {
      bounty = await bountyService.getBountyById(id);
    } catch (error) {
      console.error(`Error fetching bounty ${id}:`, error);
      // Get bounty from database only
      const docSnap = await adminDb.collection('bounties').doc(id).get();
      
      if (!docSnap.exists) {
        return NextResponse.json(
          { error: 'Bounty not found in database' },
          { status: 404 }
        );
      }
      
      bounty = {
        id: parseInt(id),
        ...docSnap.data(),
        owner: docSnap.data()?.owner || '',
        sponsorName: docSnap.data()?.sponsorName || ''
      };
    }
    
    if (!bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    // Check if this is just a count request (no auth needed)
    const countOnly = request.nextUrl.searchParams.get('count') === 'true';
    if (countOnly) {
      const submissionsRef = adminDb.collection('submissions');
      const snapshot = await submissionsRef.where('bountyId', '==', id).get();
      return NextResponse.json({ count: snapshot.size });
    }

    // For full submission details, require authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user role and check if sponsor
    const userRole = request.headers.get('x-user-role');
    const isSponsor = userRole === 'sponsor';
    
    // Get the user's wallet address from the headers
    const walletAddress = request.headers.get('x-wallet-address') || '';
    
    // Check if the user is the bounty owner (by wallet) or a sponsor
    const isOwnerByWallet = bounty.owner === walletAddress;

    // Allow access if user is either the owner (by wallet) or a sponsor
    if (!isOwnerByWallet && !isSponsor) {
      return NextResponse.json(
        { error: 'You are not authorized to view submissions for this bounty' },
        { status: 403 }
      );
    }

    // Get all submissions for the bounty
    const submissions = await bountyService.getBountySubmissions(id);

    return NextResponse.json(submissions);
  } catch (error) {
    console.error(`Error fetching submissions for bounty ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bounties/[id]/submissions
 * Save the submission data to the database
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('POST /api/bounties/[id]/submissions - Start', {
      id: params.id,
      headers: Object.fromEntries(request.headers.entries())
    });

    const { id: bountyId } = params;
    if (!bountyId) {
      return NextResponse.json(
        { error: 'Bounty ID is required' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.text();
    console.log('Request body:', body);
    
    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { 
      applicantAddress, 
      userId,
      content,
      submissionId,
      links 
    } = requestData;

    // Log parsed data
    console.log('Parsed submission data:', {
      bountyId,
      applicantAddress,
      userId,
      content: content?.substring(0, 50) + '...',
      links,
      submissionId
    });

    // Validate required fields
    if (!applicantAddress || !content || !submissionId || !userId) {
      const missingFields = [];
      if (!applicantAddress) missingFields.push('applicantAddress');
      if (!content) missingFields.push('content');
      if (!submissionId) missingFields.push('submissionId');
      if (!userId) missingFields.push('userId');

      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Additional validation for applicantAddress
    if (typeof applicantAddress !== 'string' || applicantAddress.trim() === '') {
      console.error('ERROR: Invalid applicantAddress format:', applicantAddress);
      return NextResponse.json(
        { error: 'Invalid applicant address format' },
        { status: 400 }
      );
    }

    // Create bounty service
    console.log('Creating BountyService instance...');
    const bountyService = new BountyService();

    try {
      // Check if user or wallet has already submitted
      console.log('Checking for existing submissions...');
      const existingSubmissions = await bountyService.getBountySubmissions(bountyId);
      const hasSubmitted = existingSubmissions.some(
        (submission: Submission) => 
          submission.applicant === applicantAddress || 
          (userId && submission.userId === userId)
      );

      if (hasSubmitted) {
        console.log('User has already submitted:', { applicantAddress, userId });
        return NextResponse.json(
          { error: 'You have already submitted work for this bounty' },
          { status: 400 }
        );
      }

      // Get bounty details to check deadline
      console.log('Checking bounty deadline...');
      const bounty = await bountyService.getBountyById(bountyId);
      if (bounty.submissionDeadline < Date.now()) {
        console.log('Submission deadline has passed:', {
          deadline: bounty.submissionDeadline,
          now: Date.now()
        });
        return NextResponse.json(
          { error: 'Submission deadline has passed' },
          { status: 400 }
        );
      }
      
      // Save submission to database
      console.log('Saving submission to database...');
      await bountyService.saveSubmissionToDatabase(
        parseInt(bountyId),
        applicantAddress,
        content,
        submissionId,
        links,
        userId
      );

      console.log('Submission saved successfully');
      return NextResponse.json({
        success: true,
        message: 'Submission saved successfully',
        id: submissionId,
      });
    } catch (serviceError: any) {
      console.error('Service error:', {
        error: serviceError,
        message: serviceError.message,
        stack: serviceError.stack
      });
      return NextResponse.json(
        { error: serviceError.message || 'Failed to process submission' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Unhandled error:', {
      error,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
