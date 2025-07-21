'use client';

import { auth, db } from '@/lib/firebase';
import {
  AuthState,
  UserProfile,
  UserRole,
  WalletInfo,
} from '@/types/auth.types';
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Ensure Firebase auth persistence is always set to local storage
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) =>
    console.error('Error setting auth persistence:', error)
  );
}

// Check if user profile is complete
function isProfileComplete(user: UserProfile): boolean {
  if (!user) return false;

  if (user.role === 'talent') {
    return !!(user.profileData?.username && user.profileData?.firstName);
  }

  if (user.role === 'sponsor') {
    return !!(user.profileData?.companyName && user.profileData?.industry);
  }

  return true;
}

interface AuthStoreState extends AuthState {
  _hasHydrated: boolean;
}

const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isEmailAuthenticated: false,
      isWalletAuthenticated: false,
      loading: true,
      _hasHydrated: false,

      setUser: (user) => {
        if (!user) {
          set({
            user: null,
            isAuthenticated: false,
            isEmailAuthenticated: false,
            isWalletAuthenticated: false,
            loading: false,
          });
          return;
        }

        const isComplete = isProfileComplete(user);

        set({
          user: {
            ...user,
            isProfileComplete: isComplete,
          },
          loading: false,
          isAuthenticated: true,
          isEmailAuthenticated: !!user.email,
          isWalletAuthenticated: !!user.wallet,
        });
      },

      clearUser: () => {
        set({
          user: null,
          loading: false,
          isAuthenticated: false,
          isEmailAuthenticated: false,
          isWalletAuthenticated: false,
        });
      },

      setLoading: (val) => set({ loading: val }),

      fetchUserFromFirestore: async () => {
        try {
          if (typeof window === 'undefined') return;

          const currentUser = auth.currentUser;
          if (!currentUser) {
            set({
              user: null,
              loading: false,
              isAuthenticated: false,
              isEmailAuthenticated: false,
              isWalletAuthenticated: false,
            });
            return;
          }

          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();

            // Create user profile
            const userProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || undefined,
              role: userData.role,
              wallet: userData.wallet || null,
              profileData: userData.profileData || {},
              createdAt: userData.createdAt,
              lastLogin: userData.lastLogin,
              ...userData, // This will include any additional fields
              isProfileComplete: false, // Will be calculated in setUser
            };

            get().setUser(userProfile);
          } else {
            set({
              user: null,
              loading: false,
              isAuthenticated: false,
              isEmailAuthenticated: false,
              isWalletAuthenticated: false,
            });
          }
        } catch (error) {
          console.error('Error fetching user from Firestore:', error);
          set({
            user: null,
            loading: false,
            isAuthenticated: false,
            isEmailAuthenticated: false,
            isWalletAuthenticated: false,
          });
        }
      },

      initializeAuthListener: () => {
        // Server-side rendering check
        if (typeof window === 'undefined') return () => {};

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // User is signed in, fetch their data from Firestore
            await get().fetchUserFromFirestore();
          } else {
            // User is signed out
            set({
              user: null,
              loading: false,
              isAuthenticated: false,
              isEmailAuthenticated: false,
              isWalletAuthenticated: false,
            });
          }
        });

        return unsubscribe;
      },

      updateUserProfile: async (profileData) => {
        const { user } = get();

        if (!user || !user.uid) {
          throw new Error('No authenticated user found');
        }

        // Update profile data in Firestore
        const docRef = doc(db, 'users', user.uid);

        await updateDoc(docRef, {
          ...user,
          profileData: profileData,
          updatedAt: new Date().toISOString(),
        });

        // Update local state
        set({
          user: {
            ...user,
            profileData,
            isProfileComplete: true,
          } as UserProfile,
        });
      },

      updateUserRole: async (role: UserRole) => {
        const { user } = get();

        if (!user || !user.uid) {
          throw new Error('No authenticated user found');
        }

        // Update role in Firestore
        const docRef = doc(db, 'users', user.uid);

        await updateDoc(docRef, {
          role,
          updatedAt: new Date().toISOString(),
        });

        // Update local state
        set({
          user: {
            ...user,
            role,
          } as UserProfile,
        });
      },

      connectWalletToUser: async (walletInfo: WalletInfo) => {
        const { user } = get();

        if (!user || !user.uid) {
          throw new Error('No authenticated user found');
        }

        // Update wallet info in Firestore
        const docRef = doc(db, 'users', user.uid);

        await updateDoc(docRef, {
          wallet: {
            ...walletInfo,
            connectedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        });

        // Update local state
        set({
          user: {
            ...user,
            wallet: walletInfo,
          },
          isWalletAuthenticated: true,
        });
      },

      disconnectWallet: async () => {
        const { user } = get();

        if (!user || !user.uid) {
          throw new Error('No authenticated user found');
        }

        // Update local state
        set({
          isWalletAuthenticated: false,
        });
      },

      logout: async () => {
        try {
          if (typeof window === 'undefined') return false;

          // Sign out from Firebase auth
          await auth.signOut();

          // Clear user data from store
          get().clearUser();

          return true;
        } catch (error) {
          console.error('Error during logout:', error);
          return false;
        }
      },

      requiresProfileCompletion: () => {
        const { user } = get();
        return user ? !user.isProfileComplete : false;
      },

      // Fetch user by wallet address when not signed in
      fetchUserByWalletAddress: async (walletAddress: string) => {
        try {
          set({ loading: true });

          // Query Firestore for users with this wallet address
          const usersRef = collection(db, 'users');
          const q = query(
            usersRef,
            where('wallet.publicKey', '==', walletAddress)
          );
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            // No user with this wallet address exists
            set({ loading: false });
            return null;
          }

          // User with this wallet exists
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();

          // Sign in with custom token or directly update store state
          // Note: This doesn't do Firebase Auth sign-in, just updates the store
          // You would need to implement Firebase custom token auth to fully sign in

          const userProfile = {
            uid: userDoc.id,
            email: userData.email,
            profileData: userData.profileData,
            photoURL: userData.photoURL || '',
            role: userData.role || '',
            walletConnected: true,
            emailVerified: userData.emailVerified || false,
            isProfileComplete: isProfileComplete(userData as UserProfile),
            createdAt: userData.createdAt || '',
            updatedAt: userData.updatedAt || '',
            lastLoginAt: new Date().toISOString(),
            wallet: userData.wallet || {},
            ...userData,
          };

          set({
            user: userProfile,
            loading: false,
            isAuthenticated: true,
            isWalletAuthenticated: true,
            isEmailAuthenticated: false,
          });

          return userProfile;
        } catch (error) {
          console.error('Error fetching user by wallet address:', error);
          set({ loading: false });
          return null;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage:
        typeof window !== 'undefined'
          ? createJSONStorage(() => localStorage)
          : undefined,
      onRehydrateStorage: () => (state) => {
        // Called when the store is rehydrated from storage
        if (state) {
          state._hasHydrated = true;
        }
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isEmailAuthenticated: state.isEmailAuthenticated,
        isWalletAuthenticated: state.isWalletAuthenticated,
      }),
    }
  )
);

// Initialize auth listener when the store is created
if (typeof window !== 'undefined') {
  const cleanup = useAuthStore.getState().initializeAuthListener();
  window.addEventListener('unload', cleanup);
}

export default useAuthStore;
