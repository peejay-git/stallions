'use client';

import { auth, db } from '@/lib/firebase';
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UserProfile {
  uid: string;
  email?: string;
  username?: string;
  firstName?: string;
  role: string;
  walletConnected?: boolean;
  walletAddress?: string;
  profileImage?: string;

  // Sponsor additional details
  companyName?: string;
  companyUsername?: string;
  companyUrl?: string;
  companyTwitter?: string;
  entityName?: string;
  companyLogo?: string;
  industry?: string;
  shortBio?: string;
}

interface UserState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
  setLoading: (value: boolean) => void;
  fetchUserFromFirestore: () => Promise<void>;
  initializeAuthListener: () => () => void;
}

// Ensure Firebase auth persistence is always set to local storage
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) =>
    console.error('Error setting auth persistence:', error)
  );
}

const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      setUser: (user) => {
        set({ user, loading: false });
      },
      clearUser: () => {
        set({ user: null, loading: false });
      },
      setLoading: (val) => set({ loading: val }),
      fetchUserFromFirestore: async () => {
        try {
          if (typeof window === 'undefined') return;

          const currentUser = auth.currentUser;
          if (!currentUser) {
            set({ user: null, loading: false });
            return;
          }
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log('USER DATA', userData);
            const userProfile = {
              uid: currentUser.uid,
              email: currentUser.email || undefined,
              ...userData.profileData,
              role: userData.role,
              walletConnected: !!userData.wallet,
              wallet: userData.wallet,
            };

            set({ user: userProfile, loading: false });
          } else {
            set({ user: null, loading: false });
          }
        } catch (error) {
          set({ user: null, loading: false });
        }
      },
      initializeAuthListener: () => {
        if (typeof window === 'undefined') return () => {};

        const storedUser = localStorage.getItem('user');
        if (storedUser && !get().user) {
          try {
            const parsedUser = JSON.parse(storedUser);
            set({ user: parsedUser, loading: true });
          } catch (e) {
            console.error('Failed to parse stored user:', e);
          }
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          try {
            const loggedUser = firebaseUser || get().user;
            if (loggedUser) {
              const docRef = doc(db, 'users', loggedUser.uid);
              const docSnap = await getDoc(docRef);
              console.log('USER DATA', docSnap.data());

              if (docSnap.exists()) {
                const userData = docSnap.data();
                const userProfile = {
                  uid: loggedUser.uid,
                  email: loggedUser.email || undefined,
                  ...userData.profileData,
                  role: userData.role,
                  walletConnected: !!userData.wallet,
                  wallet: userData.wallet || null,
                };

                set({ user: userProfile, loading: false });
              } else {
                set({ user: null, loading: false });
              }
            } else {
              set({ user: null, loading: false });
            }
          } catch (error) {
            set({ user: null, loading: false });
          }
        });

        return unsubscribe;
      },
    }),
    {
      name: 'user-storage',
      storage:
        typeof window !== 'undefined'
          ? createJSONStorage(() => localStorage)
          : undefined,
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Initialize auth listener when the store is created
if (typeof window !== 'undefined') {
  const cleanup = useUserStore.getState().initializeAuthListener();
  window.addEventListener('unload', cleanup);
}

export default useUserStore;
