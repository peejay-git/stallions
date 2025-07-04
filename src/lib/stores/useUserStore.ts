'use client';

// lib/stores/useUserStore.ts
import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
    uid: string;
    email?: string;
    username?: string;
    firstName?: string;
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
    initializeAuthListener: () => () => void;
}

const useUserStore = create<UserState>()((set) => ({
    user: null,
    loading: true,
    setUser: (user) => {
        set({ user, loading: false });
        console.log('User set in store:', user);
    },
    clearUser: () => {
        set({ user: null, loading: false });
        localStorage.removeItem('user');
        console.log('User cleared from store');
    },
    setLoading: (val) => set({ loading: val }),
    fetchUserFromFirestore: async () => {
        try {
            console.log('Fetching user from Firestore...');
            if (typeof window === 'undefined') return;
            
            const currentUser = auth.currentUser;
            if (!currentUser) {
                console.log('No current user');
                set({ user: null, loading: false });
                return;
            }
            
            console.log('Current user:', currentUser.uid);
            const docRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const userData = docSnap.data();
                console.log('User data from Firestore:', userData);
                
                const userProfile = {
                    uid: currentUser.uid,
                    email: currentUser.email || undefined,
                    ...userData.profileData,
                    role: userData.role,
                    walletConnected: !!userData.wallet,
                    wallet: userData.wallet || null
                };
                
                console.log('Setting user profile:', userProfile);
                set({ user: userProfile, loading: false });
                localStorage.setItem('user', JSON.stringify(userProfile));
            } else {
                console.log('No user document found');
                set({ user: null, loading: false });
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            set({ user: null, loading: false });
        }
    },
    initializeAuthListener: () => {
        if (typeof window === 'undefined') return () => {};

        console.log('Initializing auth listener...');
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    console.log('Auth state changed - user logged in:', firebaseUser.uid);
                    const docRef = doc(db, 'users', firebaseUser.uid);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        const userProfile = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || undefined,
                            ...userData.profileData,
                            role: userData.role,
                            walletConnected: !!userData.wallet,
                            wallet: userData.wallet || null
                        };
                        
                        set({ user: userProfile, loading: false });
                        localStorage.setItem('user', JSON.stringify(userProfile));
                    } else {
                        console.log('User document not found in Firestore');
                        set({ user: null, loading: false });
                        localStorage.removeItem('user');
                    }
                } else {
                    console.log('Auth state changed - no user');
                    set({ user: null, loading: false });
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error('Error in auth state change:', error);
                set({ user: null, loading: false });
                localStorage.removeItem('user');
            }
        });

        return unsubscribe;
    }
}));

// Initialize auth listener when the store is created
if (typeof window !== 'undefined') {
    const cleanup = useUserStore.getState().initializeAuthListener();
    window.addEventListener('unload', cleanup);
}

export default useUserStore;
