import { TalentFormDataType } from "@/components/core/auth/register";
import { getCurrentNetwork } from "@/config/networks";
import type { UserProfile, UserRole } from "@/types/auth.types";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db, googleProvider, storage } from "./firebase";
import useAuthStore from "./stores/auth.store";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  SponsorOnboardingFormDataType,
  TalentOnboardingFormDataType,
} from "@/components/core/auth/onboard";

type TalentRegistrationData = Omit<
  TalentFormDataType,
  "confirmPassword" | "profileImage"
> & {
  profileImageFile?: File | null;
  uid?: string; // Optional UID for when user already exists
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

  // Use existing Firebase auth user (created in RegisterModal)
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("No authenticated user found");
  }

  let companyLogoUrl = "";
  if (companyLogoFile) {
    try {
      // Upload logo to Firebase Storage
      const logoRef = ref(
        storage,
        `sponsor-logos/${uid}/${companyLogoFile.name}`
      );
      await uploadBytes(logoRef, companyLogoFile);
      companyLogoUrl = await getDownloadURL(logoRef);
    } catch (uploadError) {
      console.error("Error uploading company logo:", uploadError);
      // Optionally, you could notify the user here
    }
  }

  await setDoc(doc(db, "users", uid), {
    uid,
    role: "sponsor",
    email,
    profileData: {
      ...rest,
      companyLogo: companyLogoUrl || "",
    },
    wallet: walletAddress
      ? {
          address: walletAddress,
          publicKey: walletAddress,
          network: getCurrentNetwork().name,
        }
      : null,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  });

  // Set user in auth store
  const userProfile: UserProfile = {
    uid,
    role: "sponsor",
    email,
    ...rest,
    companyLogo: companyLogoUrl || "",
    walletConnected: !!walletAddress,
    isProfileComplete: true,
  };

  useAuthStore.getState().setUser(userProfile);

  return { user: auth.currentUser, isNewUser: false };
}

// #endregion

// #region Talent Register Controller
export async function registerTalent(data: TalentRegistrationData) {
  const {
    email,
    password,
    profileImageFile,
    walletAddress,
    firstName,
    lastName,
    username,
    location,
    skills,
    socials,
  } = data;

  // Use existing Firebase auth user (created in RegisterModal)
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("No authenticated user found");
  }

  // Save user data to Firestore
  await setDoc(doc(db, "users", uid), {
    uid,
    role: "talent",
    email,
    profileData: {
      firstName,
      lastName,
      username,
      location,
      skills,
      socials,
    },
    wallet: walletAddress
      ? {
          address: walletAddress,
          publicKey: walletAddress, // Use the actual Stellar public key
          network: getCurrentNetwork().name, // Use the actual network
        }
      : null,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  });

  // Set Zustand auth store
  const setUser = useAuthStore.getState().setUser;
  const userProfile: UserProfile = {
    uid,
    role: "talent",
    email,
    profileData: {
      firstName,
      lastName,
      username,
      location,
      skills,
      socials,
    },
    wallet: {
      address: walletAddress,
      publicKey: walletAddress, // Use the actual Stellar public key
      network: getCurrentNetwork().name, // Use the actual network
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isProfileComplete: !!username && !!firstName,
  };

  setUser(userProfile);

  return { user: auth.currentUser, isNewUser: false };
}

// #endregion

// #region Login Controller
export async function loginUser(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Update last login timestamp and fetch user data through auth store
  await useAuthStore.getState().fetchUserFromFirestore();

  return userCredential;
}

// #endregion

// #region Google Auth
export async function signInWithGoogle() {
  try {
    // Configure Google provider with custom parameters
    googleProvider.setCustomParameters({
      prompt: "select_account",
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
      console.error("Popup sign-in failed:", popupError);

      // If it's an unauthorized domain error, try a different approach
      if (popupError.code === "auth/unauthorized-domain") {
        console.error("Domain error details:", {
          domain: window.location.hostname,
          fullOrigin: window.location.origin,
          code: popupError.code,
          message: popupError.message,
          firebaseAuthDomain,
        });

        const errorMsg = `Google sign-in domain error: Your current domain (${window.location.hostname}) is not authorized in Firebase. Please verify that both 'earnstallions.xyz' and 'www.earnstallions.xyz' are added to your Firebase Console authorized domains, and that your authDomain is set correctly in the Firebase config.`;
        console.error(errorMsg);

        // Show helpful information for debugging
        console.log("DEBUG STEPS:");
        console.log(
          "1. Check Firebase Console > Authentication > Settings > Authorized domains"
        );
        console.log("2. Verify environment variables in Vercel");
        console.log("3. Make sure Google OAuth is properly configured");

        throw new Error(errorMsg);
      }

      // If we reach here, it's another type of error
      throw popupError;
    }

    // If result is undefined and no error occurred, something went wrong
    if (!result && !errorOccurred) {
      throw new Error("Google sign-in failed: No result returned");
    }

    const user = result.user;

    // Check if user exists in Firestore
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // If user doesn't exist, create a new user doc
      const userData = {
        uid: user.uid,
        email: user.email,
        // role: "talent",
        profileData: {
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
          username: user.email?.split("@")[0] || "",
          location: "",
        },
        wallet: null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        authProvider: "google",
        isOnboarded: false, // New Google sign-up needs profile completion
      };

      await setDoc(userRef, userData);

      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        // role: "talent",
        profileData: {
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
          username: user.email?.split("@")[0] || "",
          location: "",
        },
        wallet: null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        authProvider: "google",
        isOnboarded: false, // New Google sign-up needs profile completion
      };

      useAuthStore.getState().setUser(userProfile);
      // No need to manually set localStorage anymore as it's handled by the auth store

      return {
        user: { ...result.user, isOnboarded: false, authProvider: "google" },
        isNewUser: true,
      };
    } else {
      // User exists, update last login
      await updateDoc(userRef, {
        lastLogin: new Date().toISOString(),
      });

      const userData = userDoc.data();
      const userProfile = {
        uid: user.uid,
        profileData: userData.profileData,
        role: userData.role,
        isOnboarded: userData.isOnboarded,
        email: userData.email,
        walletConnected: !!userData.wallet,
        profileImage: user.photoURL,
        wallet: userData.wallet,
      };

      useAuthStore.getState().setUser(userProfile);
      // No need to manually set localStorage anymore as it's handled by the auth store

      return {
        user: {
          ...result.user,
          isOnboarded: !!userData.isOnboarded,
          authProvider: userData?.authProvider || "google",
        },
        isNewUser: false,
      };
    }
  } catch (error: any) {
    console.error("Error signing in with Google", error);

    // Provide more specific error messages
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in popup was closed before completing the sign-in");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Sign-in popup was blocked by the browser");
    } else if (error.code === "auth/cancelled-popup-request") {
      throw new Error("Multiple popup requests were triggered");
    } else if (error.code === "auth/unauthorized-domain") {
      console.error(
        "Domain not authorized in Firebase:",
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

export const onboardSponsor = async (
  data: SponsorOnboardingFormDataType & { socials: any }
) => {
  const {
    username,
    telegram,
    profileImage,
    companyName,
    companyUsername,
    companyUrl,
    companyTwitter,
    entityName,
    companyLogo,
    industry,
    shortBio,
    walletAddress,
  } = data;

  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("No authenticated user found");
  }

  let companyLogoUrl = "";
  if (companyLogo) {
    try {
      // Upload logo to Firebase Storage
      const logoRef = ref(storage, `sponsor-logos/${uid}/${companyLogo.name}`);
      await uploadBytes(logoRef, companyLogo);
      companyLogoUrl = await getDownloadURL(logoRef);
    } catch (uploadError) {
      console.error("Error uploading company logo:", uploadError);
      // Optionally, you could notify the user here
    }
  }

  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      role: "sponsor",
      profileData: {
        username,
        telegram,
        profileImage,
        companyName,
        companyUsername,
        companyUrl,
        companyTwitter,
        entityName,
        companyLogo: companyLogoUrl,
        industry,
        shortBio,
      },
      wallet: walletAddress
        ? {
            address: walletAddress,
            publicKey: walletAddress,
            network: getCurrentNetwork().name,
          }
        : null,
      lastLogin: new Date().toISOString(),
      isOnboarded: true,
    },
    { merge: true }
  );

  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user found");
  }

  // Set user in auth store
  const userProfile: any = {
    uid,
    role: "sponsor",
    email: user.email || "",
    profileData: {
      firstName: user.displayName?.split(" ")[0] || "",
      lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
      username,
      telegram,
      companyName,
      companyUsername,
      companyUrl,
      companyTwitter,
      entityName,
      companyLogo: companyLogoUrl,
      industry,
      shortBio,
    },
    profileImage,
    walletAddress,
    wallet: {
      address: walletAddress,
      publicKey: walletAddress, // Use the actual Stellar public key
      network: getCurrentNetwork().name, // Use the actual network
    },
    walletConnected: !!walletAddress,
    isProfileComplete: true,
    isOnboarded: true,
  };

  useAuthStore.getState().setUser(userProfile);

  return { user: auth.currentUser, isNewUser: false };
};

export const onboardTalent = async (data: TalentOnboardingFormDataType) => {
  const { location, skills, socials, username, walletAddress } = data;

  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("No authenticated user found");
  }

  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      role: "talent",
      profileData: {
        username,
        location,
        skills,
        socials,
      },
      wallet: walletAddress
        ? {
            address: walletAddress,
            publicKey: walletAddress, // Use the actual Stellar public key
            network: getCurrentNetwork().name, // Use the actual network
          }
        : null,
      lastLogin: new Date().toISOString(),
      isOnboarded: true,
    },
    { merge: true }
  );

  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user found");
  }

  // Update Zustand auth store
  const setUser = useAuthStore.getState().setUser;
  const userProfile: UserProfile = {
    uid,
    role: "talent",
    email: user?.email || "",
    profileData: {
      firstName: user?.displayName?.split(" ")[0] || "",
      lastName: user?.displayName?.split(" ").slice(1).join(" ") || "",
      username,
      location,
      skills,
      socials,
    },
    wallet: {
      address: walletAddress,
      publicKey: walletAddress, // Use the actual Stellar public key
      network: getCurrentNetwork().name, // Use the actual network
    },
    lastLogin: new Date().toISOString(),
    isOnboarded: true,
  };

  setUser(userProfile);

  return { user: auth.currentUser, isNewUser: false };
};
// #endregion

// #region Wallet Connection
export async function connectWallet(walletData: WalletData) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  // Get user data from auth store
  const authStoreUser = useAuthStore.getState().user;

  if (!authStoreUser) {
    throw new Error("User document not found");
  }

  // Prevent talents from overriding their stored wallet address
  if (authStoreUser.role === "talent" && authStoreUser.wallet) {
    throw new Error(
      "Talents cannot change their wallet address after signup. Please use your original wallet address."
    );
  }

  // Connect wallet through auth store
  await useAuthStore.getState().connectWalletToUser(walletData);

  return walletData;
}

export async function updateUserWallet(walletData: WalletData) {
  return connectWallet(walletData);
}

export async function walletToAccount(
  walletAddress: string,
  userEmail: string
) {
  // This function handles connecting a wallet to an existing account by email

  try {
    // First, let's try to find a user with this email address
    // We still need to use Firestore here as we're looking up by email, not by current user
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // User with this email exists
      const existingUserDoc = querySnapshot.docs[0];
      const existingUserData = existingUserDoc.data();
      const userId = existingUserDoc.id;

      // Check if the user already has a different wallet connected
      if (
        existingUserData.wallet &&
        existingUserData.wallet.publicKey &&
        existingUserData.wallet.publicKey !== walletAddress
      ) {
        return {
          success: false,
          message:
            "This account already has a different wallet connected. Please use that wallet instead.",
        };
      }

      // Either the user has no wallet or has this same wallet
      // Create wallet info object
      const walletInfo = {
        address: walletAddress,
        publicKey: walletAddress,
        network: getCurrentNetwork().name,
        connectedAt: new Date().toISOString(),
      };

      // Use the auth store to update Firestore
      // Since we're not the currently authenticated user, we need to update Firestore directly
      await updateDoc(doc(db, "users", userId), {
        wallet: walletInfo,
        updatedAt: new Date().toISOString(),
      });

      // If this is the current user, update the auth store as well
      if (auth.currentUser?.uid === userId) {
        useAuthStore.getState().connectWalletToUser(walletInfo);
      }

      return {
        success: true,
        message: "Wallet connected successfully",
        user: {
          ...existingUserData,
          uid: userId,
          walletConnected: true,
          walletInfo,
        },
      };
    }

    // If we get here, no user with this email exists
    return {
      success: false,
      message: "No account found with this email. Please register first.",
    };
  } catch (error) {
    console.error("Error connecting wallet to account:", error);
    throw error;
  }
}

// #endregion

// #region Auth State Observer
export function initAuthStateObserver(callback: (user: any) => void) {
  return onAuthStateChanged(auth, async (authUser) => {
    if (authUser) {
      // User is signed in
      const userRef = doc(db, "users", authUser.uid);
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
    return { success: true, message: "Password reset email sent successfully" };
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    let errorMessage = "Failed to send password reset email";

    if (error.code === "auth/user-not-found") {
      errorMessage = "No user found with this email address";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email format";
    }

    return { success: false, message: errorMessage };
  }
}

// #endregion
