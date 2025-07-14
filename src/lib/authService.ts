import { FormDataType } from '@/components/core/auth/RegisterModal';
import type { UserProfile, UserRole } from '@/types/auth.types';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import useAuthStore from './stores/auth.store';

type TalentRegistrationData = Omit<
  FormDataType,
  'confirmPassword' | 'profileImage'
> & {
  profileImageFile?: File | null;
};

interface WalletData {
  address: string;
  publicKey: string;
  network: string;
}

// #region Sponsor Register Controller
export async function registerSponsor(data: any) {
  const {
    email,
    password,
    profileImageFile,
    companyLogoFile,
    walletAddress,
    ...rest
  } = data;
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const uid = userCredential.user.uid;

  await setDoc(doc(db, 'users', uid), {
    uid,
    role: 'sponsor',
    email,
    profileData: {
      ...rest,
    },
    wallet: walletAddress,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  });

  return userCredential;
}
// #endregion

// #region Talent Register Controller
export async function registerTalent(data: TalentRegistrationData) {
  const { email, password, profileImageFile, walletAddress, ...rest } = data;
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const uid = userCredential.user.uid;

  // Save user data to Firestore
  await setDoc(doc(db, 'users', uid), {
    uid,
    role: 'talent',
    email,
    profileData: {
      ...rest,
    },
    wallet: walletAddress
      ? {
          address: walletAddress,
          publicKey: walletAddress, // Use the actual Stellar public key
          network: 'TESTNET', // Use the actual network
        }
      : null,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  });

  // Set Zustand auth store
  const setUser = useAuthStore.getState().setUser;
  const userProfile: UserProfile = {
    uid,
    username: rest.username,
    firstName: rest.firstName,
    role: 'talent' as UserRole,
    walletConnected: !!walletAddress,
    walletInfo: walletAddress
      ? {
          address: walletAddress,
          publicKey: walletAddress,
          network: 'TESTNET',
          connectedAt: new Date().toISOString(),
        }
      : undefined,
    isProfileComplete: !!rest.username && !!rest.firstName,
  };

  setUser(userProfile);

  return userCredential;
}
// #endregion

// #region Login Controller
export async function loginUser(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Update last login timestamp
  const userRef = doc(db, 'users', userCredential.user.uid);
  await updateDoc(userRef, {
    lastLogin: new Date().toISOString(),
  });

  return userCredential;
}
// #endregion

// #region Google Auth
export async function signInWithGoogle() {
  try {
    // Configure Google provider with custom parameters
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      // Add authorized domains as login_hint to help Firebase recognize them
      login_hint: window.location.hostname,
    });

    // Get auth domain from Firebase config
    // @ts-ignore - accessing auth domain
    const firebaseAuthDomain = auth.app.options.authDomain;

    // Try with popup first
    let result;
    let errorOccurred = false;

    try {
      // Forcibly set auth domain on the auth object if possible
      // @ts-ignore - this is a workaround
      if (auth._config) {
        // @ts-ignore - this is a workaround
        auth._config.authDomain = window.location.hostname;
      }

      result = await signInWithPopup(auth, googleProvider);
    } catch (popupError: any) {
      errorOccurred = true;
      console.error('Popup sign-in failed:', popupError);

      // If it's an unauthorized domain error, try a different approach
      if (popupError.code === 'auth/unauthorized-domain') {
        console.error('Domain error details:', {
          domain: window.location.hostname,
          fullOrigin: window.location.origin,
          code: popupError.code,
          message: popupError.message,
          firebaseAuthDomain,
        });

        const errorMsg = `Google sign-in domain error: Your current domain (${window.location.hostname}) is not authorized in Firebase. Please verify that both 'earnstallions.xyz' and 'www.earnstallions.xyz' are added to your Firebase Console authorized domains, and that your authDomain is set correctly in the Firebase config.`;
        console.error(errorMsg);

        // Show helpful information for debugging
        console.log('DEBUG STEPS:');
        console.log(
          '1. Check Firebase Console > Authentication > Settings > Authorized domains'
        );
        console.log('2. Verify environment variables in Vercel');
        console.log('3. Make sure Google OAuth is properly configured');

        throw new Error(errorMsg);
      }

      // If we reach here, it's another type of error
      throw popupError;
    }

    // If result is undefined and no error occurred, something went wrong
    if (!result && !errorOccurred) {
      throw new Error('Google sign-in failed: No result returned');
    }

    const user = result.user;

    // Check if user exists in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // If user doesn't exist, create a new user doc
      const userData = {
        uid: user.uid,
        email: user.email,
        role: 'talent' as UserRole, // Default role
        profileData: {
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          username: user.email?.split('@')[0] || '',
          profileImage: user.photoURL || '',
        },
        wallet: null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        authProvider: 'google',
      };

      await setDoc(userRef, userData);

      const userProfile: UserProfile = {
        uid: user.uid,
        username: userData.profileData.username,
        firstName: userData.profileData.firstName,
        role: userData.role,
        walletConnected: false,
        profileImage: user.photoURL || '',
        isProfileComplete: false, // New Google sign-up needs profile completion
      };

      useAuthStore.getState().setUser(userProfile);
      // No need to manually set localStorage anymore as it's handled by the auth store

      return { user: result.user, isNewUser: true };
    } else {
      // User exists, update last login
      await updateDoc(userRef, {
        lastLogin: new Date().toISOString(),
      });

      const userData = userDoc.data();
      const userProfile = {
        uid: user.uid,
        ...userData.profileData,
        role: userData.role,
        walletConnected: !!userData.wallet,
        profileImage: user.photoURL,
      };

      useAuthStore.getState().setUser(userProfile);
      // No need to manually set localStorage anymore as it's handled by the auth store

      return { user: result.user, isNewUser: false };
    }
  } catch (error: any) {
    console.error('Error signing in with Google', error);

    // Provide more specific error messages
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing the sign-in');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by the browser');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Multiple popup requests were triggered');
    } else if (error.code === 'auth/unauthorized-domain') {
      console.error(
        'Domain not authorized in Firebase:',
        window.location.origin
      );
      throw new Error(
        `This domain (${window.location.origin}) is not authorized for Google sign-in. Please add it to Firebase Console's authorized domains.`
      );
    } else {
      throw error;
    }
  }
}
// #endregion

// #region Wallet Connection
export async function connectWallet(walletData: WalletData) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not logged in');

  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User document not found');
  }

  const userData = userDoc.data();

  // Prevent talents from overriding their stored wallet address
  if (
    userData.role === 'talent' &&
    userData.wallet &&
    userData.wallet.address
  ) {
    throw new Error(
      'Talents cannot change their wallet address after signup. Please use your original wallet address.'
    );
  }

  await updateDoc(userRef, {
    wallet: walletData,
  });

  // Update user store
  const updatedUserDoc = await getDoc(userRef);
  if (updatedUserDoc.exists()) {
    const updatedUserData = updatedUserDoc.data();
    const userProfile: UserProfile = {
      uid: user.uid,
      ...updatedUserData.profileData,
      role: updatedUserData.role as UserRole,
      walletConnected: true,
      isProfileComplete:
        !!updatedUserData.profileData?.firstName &&
        !!updatedUserData.profileData?.username,
    };

    useAuthStore.getState().setUser(userProfile);
    // No need to manually set localStorage anymore as it's handled by the auth store
  }

  return walletData;
}

export async function updateUserWallet(walletData: WalletData) {
  return connectWallet(walletData);
}

export async function walletToAccount(
  walletAddress: string,
  userEmail: string
) {
  // This function handles connecting a wallet to an existing account
  // or creating a new account if the user doesn't exist

  try {
    // First, let's try to find a user with this email address
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // User with this email exists
      const existingUserDoc = querySnapshot.docs[0];
      const existingUserData = existingUserDoc.data();

      // Check if the user already has a different wallet connected
      if (
        existingUserData.wallet &&
        existingUserData.wallet.publicKey &&
        existingUserData.wallet.publicKey !== walletAddress
      ) {
        return {
          success: false,
          message:
            'This account already has a different wallet connected. Please use that wallet instead.',
        };
      }

      // Either the user has no wallet or has this same wallet
      // Update the user with wallet info
      await updateDoc(doc(db, 'users', existingUserDoc.id), {
        wallet: {
          address: walletAddress,
          publicKey: walletAddress,
          network: 'TESTNET', // Could be made dynamic
        },
      });

      return {
        success: true,
        message: 'Wallet connected successfully',
        user: {
          ...existingUserData,
          uid: existingUserDoc.id,
          walletConnected: true,
        },
      };
    }

    // If we get here, no user with this email exists
    return {
      success: false,
      message: 'No account found with this email. Please register first.',
    };
  } catch (error) {
    console.error('Error connecting wallet to account:', error);
    throw error;
  }
}
// #endregion

// #region Auth State Observer
export function initAuthStateObserver(callback: (user: any) => void) {
  return onAuthStateChanged(auth, async (authUser) => {
    if (authUser) {
      // User is signed in
      const userRef = doc(db, 'users', authUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const walletInfo = userData.wallet
          ? {
              address: userData.wallet.address,
              publicKey: userData.wallet.publicKey,
              network: userData.wallet.network,
              connectedAt: userData.wallet.connectedAt,
            }
          : undefined;

        const userProfile: UserProfile = {
          uid: authUser.uid,
          ...userData.profileData,
          email: authUser.email,
          role: userData.role as UserRole,
          walletConnected: !!userData.wallet,
          walletInfo,
          isProfileComplete: true, // This will be recalculated by the auth store
        };
        callback(userProfile);
      } else {
        callback(null);
      }
    } else {
      // User is signed out
      callback(null);
    }
  });
}
// #endregion

// #region Forgot Password
export async function forgotPassword(email: string) {
  try {
    // Configure action code settings to specify the URL to redirect to after
    // the password reset is complete
    const actionCodeSettings = {
      // URL you want to redirect back to after password reset
      url: `${window.location.origin}/auth/reset-success`,
      // This must be true for reset to work properly
      handleCodeInApp: true,
    };

    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    let errorMessage = 'Failed to send password reset email';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No user found with this email address';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email format';
    }

    return { success: false, message: errorMessage };
  }
}
// #endregion
