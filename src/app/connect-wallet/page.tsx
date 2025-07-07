'use client';

import { Layout } from '@/components';
import WalletConnectionModal from '@/components/core/auth/WalletConnectionModal';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from '@/lib/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import toast from 'react-hot-toast';

function ConnectWalletPageContent() {
  useProtectedRoute();
  const router = useRouter();
  const params = useSearchParams();

  // Redirect if user already has a wallet connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role === 'talent' && userData.wallet?.address) {
          toast('You already have a wallet connected to your account.');
          router.push(params.get('redirect') || '/dashboard');
        }
      }
    };

    checkWalletConnection();
  }, [router, params]);

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <WalletConnectionModal
            isOpen={true}
            onClose={() => router.push(params.get('redirect') || '/dashboard')}
            onSuccess={() =>
              router.push(params.get('redirect') || '/dashboard')
            }
            mode="connect"
          />
        </div>
      </div>
    </Layout>
  );
}

export default function ConnectWalletPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConnectWalletPageContent />
    </Suspense>
  );
}
