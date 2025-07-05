import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth using admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: true,
    });

    // Create admin user in Firestore using admin SDK
    await adminDb
      .collection('users')
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        email,
        role: 'admin',
        profileData: {
          firstName: 'Admin',
          lastName: 'User',
          username: 'admin',
        },
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      {
        error: 'Failed to create admin user',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
