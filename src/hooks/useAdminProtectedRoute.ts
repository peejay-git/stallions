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
        // User not logged in, redirect to admin login
        toast.error('Please login as admin to access this page');
        router.push('/admin/login');
        return;
      }

      // Check if user has admin role
      if (user.role !== 'admin') {
        toast.error('You do not have permission to access this page');
        router.push('/');
        return;
      }

      // Verify admin status in real-time
      const verifyAdmin = async () => {
        try {
          const response = await fetch('/api/admin/verify', {
            headers: {
              'Authorization': `Bearer ${user.uid}`,
            }
          });

          if (!response.ok) {
            throw new Error('Admin verification failed');
          }

          setIsAdmin(true);
        } catch (error) {
          console.error('Admin verification error:', error);
          toast.error('Admin session expired. Please login again.');
          router.push('/admin/login');
        }
      };

      verifyAdmin();
    }
  }, [user, loading, router]);

  return { isAdmin, loading };
} 