import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '@/lib/stores/useUserStore';
import toast from 'react-hot-toast';

export function useAdminProtectedRoute() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const loading = useUserStore((state) => state.loading);
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async () => {
      if (!user) {
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${user.uid}`,
          },
          // Add cache: 'no-store' to prevent caching
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Admin verification failed');
        }

        if (mounted) {
          setIsAdmin(true);
          setVerifying(false);
        }
      } catch (error) {
        console.error('Admin verification error:', error);
        if (mounted) {
          setIsAdmin(false);
          setVerifying(false);
          // Clear user store on verification failure
          useUserStore.getState().clearUser();
          toast.error('Admin session expired. Please login again.');
          router.push('/admin/login');
        }
      }
    };

    if (!loading) {
      if (!user) {
        toast.error('Please login as admin to access this page');
        router.push('/admin/login');
        return;
      }

      if (user.role !== 'admin') {
        toast.error('You do not have permission to access this page');
        router.push('/');
        return;
      }

      // Verify admin status
      verifyAdmin();

      // Set up periodic verification
      const interval = setInterval(verifyAdmin, 5 * 60 * 1000); // Verify every 5 minutes

      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }
  }, [user, loading, router]);

  return { isAdmin, loading: loading || verifying };
} 