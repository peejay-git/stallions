'use client';

// lib/stores/useUserStore.ts
import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from '@/lib/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
    uid: string;
    username: string;
    firstName: string;
    role: string;
    [key: string]: any;
}

interface UserState {
    user: UserProfile | null;
    loading: boolean;
    setUser: (user: UserProfile) => void;
    clearUser: () => void;
    setLoading: (value: boolean) => void;
    fetchUserFromFirestore: () => Promise<void>;
}

const useUserStore = create<UserState>()((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user, loading: false }),
    clearUser: () => set({ user: null, loading: false }),
    setLoading: (val) => set({ loading: val }),
    fetchUserFromFirestore: async () => {
        if (typeof window === 'undefined') return;
        
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const profile = docSnap.data();
            const userProfile = {
                uid: currentUser.uid,
                ...profile.profileData,
                role: profile.role,
                walletConnected: !!profile.wallet,
                wallet: profile.wallet || null
            };
            set({ user: userProfile, loading: false });
            localStorage.setItem('user', JSON.stringify(userProfile));
        } else {
            set({ user: null, loading: false });
        }
    },
}));

export default useUserStore;
