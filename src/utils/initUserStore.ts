'use client';

import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from '@/lib/firestore';
import useUserStore from '@/lib/stores/useUserStore';
import { onAuthStateChanged } from 'firebase/auth';

export function initUserStore() {
  if (typeof window === 'undefined') return;

  const store = useUserStore.getState();
  store.setLoading(true);

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profile = docSnap.data();
        store.setUser({
          uid: user.uid,
          ...profile.profileData,
          role: profile.role,
        });
      } else {
        store.clearUser();
      }
    } else {
      store.clearUser();
    }
  });
}
