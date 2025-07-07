'use client';

import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from '@/lib/firestore';
import useUserStore from '@/lib/stores/useUserStore';
import { onAuthStateChanged } from 'firebase/auth';

export function initUserStore() {
  if (typeof window === 'undefined') return;

  const store = useUserStore.getState();

  return onAuthStateChanged(auth, async (user) => {
    store.setLoading(true);

    const loggedUser = user || store.user;
    if (loggedUser) {
      const docRef = doc(db, 'users', loggedUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profile = docSnap.data();
        store.setUser({
          uid: loggedUser.uid,
          ...profile.profileData,
          role: profile.role,
        });
      } else {
        store.clearUser();
      }
    } else {
      store.clearUser();
    }
    store.setLoading(false);
  });
}
