import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '@/lib/stores/useUserStore';
import toast from 'react-hot-toast';

export function useAdminProtectedRoute() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const loading = useUserStore((state) => state.loading);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not logged in, redirect to login
        toast.error('Please login to access this page');
        router.push('/login?redirect=/admin/dashboard');
        return;
      }

      // Check if user has admin role
      if (user.role !== 'admin') {
        toast.error('You do not have permission to access this page');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
    }
  }, [user, loading, router]);

  return { isAdmin, loading };
} 