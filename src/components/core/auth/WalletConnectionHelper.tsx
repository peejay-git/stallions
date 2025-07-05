'use client';

import { useWallet } from '@/hooks/useWallet';
import { connectWallet, walletToAccount } from '@/lib/authService';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from '@/lib/firestore';
import useUserStore from '@/lib/stores/useUserStore';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
  onSuccess?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  mode?: 'connect' | 'link';
  email?: string;
};

export default function WalletConnectionHelper({
  onSuccess,
  onSkip,
  showSkip = true,
  mode = 'connect',
  email = '',
}: Props) {
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

      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserRole(userData.role);

          if (userData.wallet && userData.wallet.address) {
            setUserHasWallet(true);
            setStoredWalletAddress(userData.wallet.address);
          }
        }
      } catch (error) {
        console.error('Error checking user wallet:', error);
      }
    };

    checkUserWallet();
  }, []);

  // If user is a talent with an existing wallet, don't allow wallet connection
  if (userRole === 'talent' && userHasWallet && storedWalletAddress) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden p-6">
        <h3 className="text-xl font-bold mb-2 text-white">
          Wallet Already Connected
        </h3>

        <p className="text-gray-300 mb-6">
          Your account is already linked to a wallet address. Talents cannot
          change their wallet address after signup.
        </p>

        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 mb-6">
          <p className="text-white font-medium">Your Wallet Address</p>
          <p className="text-sm text-gray-300 break-all mt-1">
            {storedWalletAddress}
          </p>
        </div>

        <motion.button
          onClick={onSuccess}
          className="bg-white text-black font-medium py-2.5 px-4 rounded-lg hover:bg-white/90 transition-colors w-full"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue
        </motion.button>
      </div>
    );
  }

  const handleConnectWallet = async () => {
    try {
      setIsSubmitting(true);

      if (!isConnected) {
        await connect({});
      }

      if (!publicKey) {
        toast.error('Failed to get wallet public key');
        return;
      }

      if (mode === 'connect') {
        // Connect wallet to current user account
        await connectWallet({
          address: publicKey,
          publicKey: publicKey,
          network: networkPassphrase!,
        });

        toast.success('Wallet connected successfully!');
        onSuccess?.();
      } else if (mode === 'link') {
        // Link wallet to existing account by email
        if (!userEmail) {
          toast.error('Please enter an email address');
          return;
        }

        const result = await walletToAccount(publicKey, userEmail);

        if (result.success) {
          toast.success('Wallet linked to account successfully!');
          onSuccess?.();
        } else {
          toast.error(result.message || 'Failed to link wallet to account');
        }
      }
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

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden p-6">
      <h3 className="text-xl font-bold mb-2 text-white">
        {mode === 'connect' ? 'Connect Your Wallet' : 'Link Your Wallet'}
      </h3>

      <p className="text-gray-300 mb-6">
        {mode === 'connect'
          ? 'Connect your Stellar wallet to complete your profile'
          : 'Link your wallet to an existing account'}
      </p>

      {isConnected ? (
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 mb-6">
          <p className="text-white font-medium">Wallet Connected</p>
          <p className="text-sm text-gray-300 break-all mt-1">{publicKey}</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
          <p className="text-white font-medium">No Wallet Connected</p>
          <p className="text-sm text-gray-300 mt-1">
            You'll need to install and connect a Stellar wallet like Freighter
          </p>
        </div>
      )}

      {mode === 'link' && !isConnected && (
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Enter your account email"
            className="input w-full"
          />
        </div>
      )}

      <div className="space-y-4">
        <motion.button
          onClick={handleConnectWallet}
          disabled={
            isSubmitting || (isConnected && isSubmitting && mode === 'connect')
          }
          className="bg-white text-black font-medium py-2.5 px-4 rounded-lg hover:bg-white/90 transition-colors w-full flex items-center justify-center"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSubmitting ? (
            <span className="flex gap-2 items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 rounded-full bg-black animate-bounce"></span>
            </span>
          ) : isConnected ? (
            mode === 'connect' ? (
              'Save Wallet Connection'
            ) : (
              'Link to Account'
            )
          ) : (
            'Connect Wallet'
          )}
        </motion.button>

        {showSkip && (
          <motion.button
            onClick={onSkip}
            className="bg-white/10 backdrop-blur-xl border border-white/20 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-white/20 transition-colors w-full"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Skip for Now
          </motion.button>
        )}
      </div>

      <p className="text-gray-300 text-sm mt-6">
        Don't have a Stellar wallet?{' '}
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:underline"
        >
          Get Freighter
        </a>
      </p>
    </div>
  );
}
