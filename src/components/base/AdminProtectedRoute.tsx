'use client';

import { LoadingSpinner } from '@/components';
import { auth } from '@/lib/firebase';
import useUserStore from '@/lib/stores/useUserStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const loading = useUserStore((state) => state.loading);
  const fetchUserFromFirestore = useUserStore(
    (state) => state.fetchUserFromFirestore
  );
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      console.log('Checking auth state...');
      try {
        if (!auth.currentUser) {
          console.log('No current user, redirecting to login');
          toast.error('Please login as admin');
          router.push('/admin/login');
          return;
        }

        if (!user && !loading) {
          console.log('No user in store, fetching from Firestore');
          await fetchUserFromFirestore();
        }

        if (user && user.role !== 'admin') {
          console.log('User is not admin:', user);
          toast.error('You do not have admin access');
          router.push('/');
          return;
        }

        console.log('Auth check complete:', { user, loading });
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        toast.error('Authentication error');
        router.push('/admin/login');
      }
    }

    checkAuth();
  }, [user, loading, router, fetchUserFromFirestore]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
