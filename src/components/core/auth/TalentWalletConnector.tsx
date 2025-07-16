'use client';

import { useWallet } from '@/hooks/useWallet';
import { connectWallet } from '@/lib/authService';
import useAuthStore from '@/lib/stores/auth.store';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  onSuccess?: () => void;
}

export default function TalentWalletConnector({ onSuccess }: Props) {
  const { connect, networkPassphrase } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const { user } = useAuthStore();
  const fetchUser = useAuthStore(
    (state: { fetchUserFromFirestore: any }) => state.fetchUserFromFirestore
  );

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);

      // Connect wallet
      await connect();

      // After connect() is called, check if we have a public key
      if (user?.uid && networkPassphrase) {
        // Save the wallet to the user's account
        await connectWallet({
          address: user.wallet?.address || '',
          publicKey: user.wallet?.publicKey || '',
          network: networkPassphrase,
        });

        // Update user data in store
        await fetchUser();
        toast.success('Wallet connected successfully!');

        // Call the success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else if (!user?.uid) {
        toast.error('Please log in first');
      } else {
        toast.error('Could not connect wallet');
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
