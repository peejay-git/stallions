'use client';

import { LoadingSpinner } from '@/components';
import { auth } from '@/lib/firebase';
import useAuthStore from '@/lib/stores/auth.store';
import { AuthState } from '@/types/auth.types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state: AuthState) => state.user);
  const loading = useAuthStore((state: AuthState) => state.loading);
  const fetchUserFromFirestore = useAuthStore(
    (state: AuthState) => state.fetchUserFromFirestore
  );
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        if (!auth.currentUser) {
          toast.error('Please login as admin');
          router.push('/admin/login');
          return;
        }

        if (!user && !loading) {
          await fetchUserFromFirestore();
        }

        if (user && user.role !== 'admin') {
          toast.error('You do not have admin access');
          router.push('/');
          return;
        }
        setIsChecking(false);
      } catch (error) {
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
