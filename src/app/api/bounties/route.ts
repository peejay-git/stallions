import { BountyService } from '@/lib/bountyService';
import { BlockchainError } from '@/utils/error-handler';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

// Force dynamic rendering for APIs to work properly in production
export const dynamic = 'force-dynamic';

// Log environment variables (without sensitive data)
console.log('API Route - Environment Variables:', {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '(missing)',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '(set)' : '(missing)',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '(set)' : '(missing)',
  NODE_ENV: process.env.NODE_ENV,
  // Add more detailed logging
  ENV_KEYS: Object.keys(process.env).filter(key => key.startsWith('FIREBASE_')),
  PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
  PRIVATE_KEY_SAMPLE: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50) + '...',
});

// Verify Firebase Admin is initialized
console.log('API Route - Checking Firebase Admin initialization...');
if (!adminDb) {
  console.error('Firebase Admin is not initialized!');
  throw new Error('Firebase Admin is not initialized');
}
console.log('Firebase Admin is initialized');

/**
 * GET /api/bounties
 * List all bounties with optional filtering
 * Backend handles fetching from both blockchain and database
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const token = searchParams.get('token');
    const owner = searchParams.get('owner');

    // Create service instance
    const bountyService = new BountyService();

    // Get all bounties (the service will combine blockchain and database data)
    let bounties: any[] = [];
    try {
      bounties = await bountyService.getAllBounties();
    } catch (fetchError) {
      console.error('Error fetching bounties from service:', fetchError);
      // Return empty array instead of failing completely
      bounties = [];
    }

    // Apply filters if needed
    let filteredBounties = bounties;

    if (status) {
      filteredBounties = filteredBounties.filter((b) => b.status === status);
    }

    if (token) {
      filteredBounties = filteredBounties.filter(
        (b) => b.reward.asset === token
      );
    }

    if (owner) {
      filteredBounties = filteredBounties.filter((b) => b.owner === owner);
    }

    return NextResponse.json(filteredBounties);
  } catch (error) {
    console.error('Error fetching bounties:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch bounties',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bounties
 * This endpoint is called AFTER the blockchain transaction
 * It saves the off-chain data to the database
 */
export async function POST(request: NextRequest) {
  console.log('POST /api/bounties - Starting request handling');
  
  try {
    // Verify Firebase Admin is initialized
    if (!adminDb) {
      console.error('Firebase Admin is not initialized in POST handler');
      return NextResponse.json(
        { error: 'Firebase Admin is not initialized' },
        { status: 500 }
      );
    }

    let requestBody;
    try {
      const text = await request.text();
      console.log('Raw request body:', text);
      requestBody = JSON.parse(text);
      console.log('Parsed request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', details: 'Failed to parse JSON' },
        { status: 400 }
      );
    }
    
    const {
      blockchainBountyId,
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
      sponsorName,
    } = requestBody;

    console.log('Extracted request data:', {
      blockchainBountyId,
      description: description?.substring(0, 50) + '...',
      category,
      skills,
      owner,
      title,
      reward,
      submissionDeadline,
      status
    });

    // Validate required fields
    if (
      blockchainBountyId === null ||
      blockchainBountyId === undefined ||
      !description ||
      !category ||
      !skills ||
      !owner
    ) {
      const missingFields = [];
      if (blockchainBountyId === null || blockchainBountyId === undefined) missingFields.push('blockchainBountyId');
      if (!description) missingFields.push('description');
      if (!category) missingFields.push('category');
      if (!skills) missingFields.push('skills');
      if (!owner) missingFields.push('owner');

      console.error('Validation failed - Missing fields:', missingFields);
      return NextResponse.json(
        { error: 'Missing required fields', details: missingFields },
        { status: 400 }
      );
    }

    // Ensure blockchainBountyId is a number
    const numericBountyId = Number(blockchainBountyId);
    if (isNaN(numericBountyId)) {
      console.error('Invalid blockchainBountyId:', { blockchainBountyId, type: typeof blockchainBountyId });
      return NextResponse.json(
        { error: 'Invalid blockchainBountyId format' },
        { status: 400 }
      );
    }

    // Create bounty service
    console.log('Creating BountyService instance...');
    const bountyService = new BountyService();

    try {
      // Save to database using the blockchain-generated ID
      console.log('Attempting to save bounty to database:', numericBountyId);
      await bountyService.saveBountyToDatabase(numericBountyId, {
        description: description || '',
        category: category || '',
        skills: Array.isArray(skills) ? skills : [],
        extraRequirements: extraRequirements || '',
        owner: owner || '',
        title: title || '',
        reward: typeof reward === 'object' ? JSON.stringify(reward) : reward || '',
        deadline: deadline || new Date().toISOString(),
        submissionDeadline: submissionDeadline || deadline || new Date().toISOString(),
        judgingDeadline: judgingDeadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: status || 'OPEN',
        updatedAt: new Date().toISOString()
      });

      console.log('Bounty saved successfully:', numericBountyId);
      return NextResponse.json({
        success: true,
        id: blockchainBountyId,
        message: 'Bounty saved successfully',
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      console.error('Database error stack:', dbError instanceof Error ? dbError.stack : 'No stack trace');
      return NextResponse.json(
        { 
          error: 'Database error',
          details: dbError instanceof Error ? dbError.message : String(dbError),
          stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in POST handler:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json(
      { 
        error: 'Failed to create bounty',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}
