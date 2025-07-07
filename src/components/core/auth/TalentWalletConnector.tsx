'use client';

import { useWallet } from '@/hooks/useWallet';
import { connectWallet } from '@/lib/authService';
import useUserStore from '@/lib/stores/useUserStore';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  onSuccess?: () => void;
}

export default function TalentWalletConnector({ onSuccess }: Props) {
  const { connect, networkPassphrase } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const user = useUserStore((state) => state.user);
  const fetchUser = useUserStore((state) => state.fetchUserFromFirestore);

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      const publicKey = await connect();

      if (publicKey && user?.uid) {
        // Save the wallet to the user's account
        await connectWallet({
          address: publicKey,
          publicKey: publicKey,
          network: networkPassphrase!,
        });

        // Update user data in store
        await fetchUser();
        toast.success('Wallet connected successfully!');

        // Call the success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else if (!publicKey) {
        toast.error('Could not connect wallet');
      } else if (!user?.uid) {
        toast.error('Please log in first');
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-8 text-center text-white">
      <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
      <p className="text-gray-300 mb-6">
        Connect your Stellar wallet to access all features and manage your
        bounties.
      </p>
      <button
        onClick={handleConnectWallet}
        disabled={isConnecting}
        className="bg-white text-black font-medium py-3 px-6 rounded-lg hover:bg-white/90 transition-colors"
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
      </button>
    </div>
  );
}
