'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '@/lib/stores/useUserStore';
import toast from 'react-hot-toast';
import { LoadingSpinner } from './LoadingSpinner';

export default function AdminProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const loading = useUserStore((state) => state.loading);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error('Please login as admin');
        router.push('/admin/login');
        return;
      }

      if (user.role !== 'admin') {
        toast.error('You do not have admin access');
        router.push('/');
        return;
      }
    }
  }, [user, loading, router]);

  if (loading) {
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