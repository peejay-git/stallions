import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from '@/lib/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/submissions
 * Get all submissions for debugging
 */
export async function GET(request: NextRequest) {
  try {
    // Get all submissions from database
    const submissionsRef = collection(db, 'submissions');
    const snapshot = await getDocs(submissionsRef);
    
    // Map the submissions to a readable format
    const submissions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toString() : null,
      };
    });
    
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
} 
 
 
 