'use client';

import useAuthStore from '@/lib/stores/auth.store';
import { motion } from 'framer-motion';
import { useState } from 'react';
import WalletConnectionModal from './WalletConnectionModal';

interface WalletPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionDescription: string; // Description of the action requiring wallet connection
  onSuccess?: () => void; // Optional callback for when wallet is successfully connected
}

export default function WalletPromptModal({
  isOpen,
  onClose,
  actionDescription,
  onSuccess,
}: WalletPromptModalProps) {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { isWalletAuthenticated } = useAuthStore((state) => state);

  // Close the modal if wallet is already authenticated
  if (isWalletAuthenticated) {
    onClose();
    onSuccess?.();
    return null;
  }

  if (!isOpen) return null;

  const handleConnectWallet = () => {
    setShowConnectionModal(true);
  };

  const handleConnectionSuccess = () => {
    setShowConnectionModal(false);
    onSuccess?.();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md p-6 bg-[#0c0c0d] rounded-xl border border-white/10 backdrop-blur-sm shadow-xl"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Wallet Required</h2>

          <p className="text-gray-300 mb-6">
            {actionDescription || 'This action requires a connected wallet.'}
          </p>

          <div className="space-y-4">
            <button
              onClick={handleConnectWallet}
              className="w-full px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
            >
              Connect Wallet
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-2.5 bg-transparent border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>

      {showConnectionModal && (
        <WalletConnectionModal
          isOpen={showConnectionModal}
          onClose={() => setShowConnectionModal(false)}
          mode="connect"
          onSuccess={handleConnectionSuccess}
        />
      )}
    </>
  );
}
