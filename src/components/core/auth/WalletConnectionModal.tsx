'use client';

import { motion } from 'framer-motion';
import { WalletConnectionMode } from '@/hooks/useWalletConnection';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useEffect } from 'react';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: WalletConnectionMode;
  email?: string;
  onSuccess?: () => void;
}

export default function WalletConnectionModal({
  isOpen,
  onClose,
  mode = 'connect',
  email = '',
  onSuccess,
}: WalletConnectionModalProps) {
  const { state, connectWallet, setUserEmail } = useWalletConnection({
    mode,
    email,
  });

  // Close modal when wallet is successfully connected
  useEffect(() => {
    if (!isOpen) return;

    if (state.isConnected && !state.isSubmitting) {
      onSuccess?.();
      onClose();
    }
  }, [isOpen, state.isConnected, state.isSubmitting, onSuccess, onClose]);

  if (!isOpen) return null;

  if (state.userRole === 'talent' && state.userHasWallet && state.storedWalletAddress) {
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
            {state.storedWalletAddress}
          </p>
        </div>

        <motion.button
          onClick={onClose}
          className="bg-white text-black font-medium py-2.5 px-4 rounded-lg hover:bg-white/90 transition-colors w-full"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          Close
        </motion.button>
      </div>
    );
  }

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

      {state.isConnected ? (
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 mb-6">
          <p className="text-white font-medium">Wallet Connected</p>
          <p className="text-sm text-gray-300 break-all mt-1">{state.publicKey}</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
          <p className="text-white font-medium">No Wallet Connected</p>
          <p className="text-sm text-gray-300 mt-1">
            You'll need to install and connect a Stellar wallet like Freighter
          </p>
        </div>
      )}

      {mode === 'link' && !state.isConnected && (
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={state.userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Enter your account email"
            className="input w-full"
          />
        </div>
      )}

      <div className="space-y-4">
        <motion.button
          onClick={connectWallet}
          disabled={
            state.isSubmitting || (state.isConnected && state.isSubmitting && mode === 'connect')
          }
          className="bg-white text-black font-medium py-2.5 px-4 rounded-lg hover:bg-white/90 transition-colors w-full flex items-center justify-center"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          {state.isSubmitting ? 'Connecting...' : 'Connect Wallet'}
        </motion.button>

        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
