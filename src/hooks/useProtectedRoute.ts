import useUserStore from '@/lib/stores/useUserStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useProtectedRoute() {
  const user = useUserStore((s) => s.user);
  const loading = useUserStore((s) => s.loading);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading]);
}
