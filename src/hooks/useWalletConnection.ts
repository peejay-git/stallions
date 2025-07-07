import { useWallet } from '@/hooks/useWallet';
import { connectWallet, walletToAccount } from '@/lib/authService';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from '@/lib/firestore';
import useUserStore from '@/lib/stores/useUserStore';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export type WalletConnectionMode = 'connect' | 'link';

export interface UseWalletConnectionOptions {
  mode?: WalletConnectionMode;
  email?: string;
}

export interface WalletConnectionState {
  isSubmitting: boolean;
  isConnected: boolean;
  publicKey: string | null;
  userHasWallet: boolean;
  userRole: string | null;
  storedWalletAddress: string | null;
  userEmail: string;
}

export interface UseWalletConnectionResult {
  state: WalletConnectionState;
  connectWallet: () => Promise<void>;
  setUserEmail: (email: string) => void;
}

export function useWalletConnection({
  mode = 'connect',
  email = '',
}: UseWalletConnectionOptions = {}): UseWalletConnectionResult {
  const { connect, isConnected, publicKey, networkPassphrase } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState(email);
  const [userHasWallet, setUserHasWallet] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [storedWalletAddress, setStoredWalletAddress] = useState<string | null>(
    null
  );
  const user = useUserStore((state) => state.user);

  // Check if user already has a wallet address stored
  useEffect(() => {
    const checkUserWallet = async () => {
      if (!auth.currentUser) return;

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserRole(userData.role);
        setUserHasWallet(!!userData.wallet?.address);
        setStoredWalletAddress(userData.wallet?.address || null);
      }
    };

    checkUserWallet();
  }, [auth.currentUser]);

  const handleConnectWallet = async () => {
    try {
      setIsSubmitting(true);

      if (!isConnected) {
        await connect({});
      }

      if (!publicKey) {
        throw new Error('Failed to get wallet public key');
      }

      // Store wallet info in user account
      await connectWallet({
        address: publicKey,
        publicKey: publicKey,
        network: networkPassphrase!,
      });

      if (mode === 'link' && email) {
        await walletToAccount(publicKey, email);
      }

      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      if (
        error.message?.includes('Talents cannot change their wallet address')
      ) {
        toast.error(
          'You already have a wallet address linked to your account.'
        );
      } else {
        toast.error('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    state: {
      isSubmitting,
      isConnected,
      publicKey,
      userHasWallet,
      userRole,
      storedWalletAddress,
      userEmail,
    },
    connectWallet: handleConnectWallet,
    setUserEmail,
  };
}
