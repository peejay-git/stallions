'use client';

import { getCurrentNetwork } from '@/config/networks';
import { useWallet } from '@/hooks/useWallet';
import useAuthStore from '@/lib/stores/auth.store';
import { motion } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
  onSuccess: () => void;
};

export default function SponsorWalletPrompt({ onSuccess }: Props) {
  const { connect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const user = useAuthStore((state: { user: any }) => state.user);

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);

      // Connect wallet
      const publicKey = await connect();

      if (!publicKey) {
        toast.error('Failed to get wallet public key');
        return;
      }

      // Update user's wallet info using auth store
      if (user?.uid) {
        const walletInfo = {
          address: publicKey,
          publicKey: publicKey,
          network: getCurrentNetwork().name,
        };

        // Use auth store to update Firestore and local state
        await useAuthStore.getState().connectWalletToUser(walletInfo);
      }

      toast.success('Wallet connected successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-300 mb-4">
            To view your bounties and create new ones, you'll need to connect
            your Stellar wallet. Your bounties and rewards will be managed
            through this wallet.
          </p>
          <motion.button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="bg-white text-black font-medium py-2.5 px-4 rounded-lg hover:bg-white/90 transition-colors w-full sm:w-auto flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isConnecting ? (
              <span className="flex gap-2 items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 rounded-full bg-black animate-bounce"></span>
              </span>
            ) : (
              'Connect Wallet'
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
