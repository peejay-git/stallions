import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export const dynamic = 'force-dynamic';

/**
 * This is a temporary API endpoint to help completely reset
 * Firebase authentication state for an email that's causing problems.
 * 
 * !!! WARNING: This endpoint should be removed after use as it poses security risks !!!
 */
export async function POST(req: NextRequest) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }
    
    // Get email and password from request body
    const data = await req.json();
    const { email, password } = data;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Try to log in with the credentials (if account exists)
    try {
      if (password) {
        // Try to sign in with the provided password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // If sign-in is successful, delete the user
        await userCredential.user.delete();
        return NextResponse.json({
          success: true,
          message: `User with email ${email} has been deleted`
        });
      }
    } catch (loginError: any) {
      console.log(`Login failed: ${loginError.code}`);
      // Continue to the next approach if login fails
    }
    
    // If we get here, either the password was wrong or not provided
    // We'll try to get the current user and check if it's the one with the problematic email
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email === email) {
      await currentUser.delete();
      return NextResponse.json({
        success: true,
        message: `Current user with email ${email} has been deleted`
      });
    }
    
    return NextResponse.json({
      success: false,
      message: `Could not delete user with email ${email}. User might not exist, or you're not authenticated as this user.`,
      action: "Please go to Firebase Console and manually delete the user."
    });
    
  } catch (error: any) {
    console.error('Error in reset-auth API:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred',
        message: error.message,
        code: error.code,
        action: "Please go to Firebase Console and manually delete the user."
      },
      { status: 500 }
    );
  }
} 