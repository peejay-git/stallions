'use client';

import ProfileCompletionModal from '@/components/core/auth/ProfileCompletionModal';
import WalletPromptModal from '@/components/core/auth/WalletPromptModal';
import useAuthStore from '@/lib/stores/auth.store';
import { useCallback, useEffect, useState } from 'react';

interface UseAuthOptions {
  requireProfile?: boolean;
  requireWallet?: boolean;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { requireProfile = false, requireWallet = false } = options;
  
  const { 
    user, 
    isAuthenticated, 
    isEmailAuthenticated,
    isWalletAuthenticated,
    loading
  } = useAuthStore((state) => state);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  const [walletActionDescription, setWalletActionDescription] = useState('');

  // Check if profile needs completion when component mounts
  useEffect(() => {
    // Only run this effect after initial loading is complete
    if (loading) return;
    
    if (
      requireProfile && 
      user && 
      !user.isProfileComplete
    ) {
      setShowProfileModal(true);
    } else {
      // Only close if we were showing it before
      if (showProfileModal) {
        setShowProfileModal(false);
      }
    }
  }, [user, loading, requireProfile, showProfileModal]);

  /**
   * Function to request wallet connection with a specific action description
   * Returns a promise that resolves when the wallet is connected
   */
  const requestWalletConnection = useCallback((actionDescription: string = 'This action requires a connected wallet') => {
    return new Promise<void>((resolve, reject) => {
      // If wallet is already connected, resolve immediately
      if (isWalletAuthenticated) {
        resolve();
        return;
      }
      
      // Show wallet prompt with the provided description
      setWalletActionDescription(actionDescription);
      setShowWalletPrompt(true);
      
      // The promise will be resolved by the onSuccess callback in the WalletPromptModal
      const originalOnSuccess = () => {
        resolve();
      };
      
      // Store the callback to be used when wallet is connected
      (window as any).__walletConnectionResolve = originalOnSuccess;
      
      // Cleanup function to reject the promise if component unmounts
      return () => {
        if ((window as any).__walletConnectionResolve) {
          delete (window as any).__walletConnectionResolve;
          reject(new Error('Component unmounted before wallet connection'));
        }
      };
    });
  }, [isWalletAuthenticated]);
  
  // Handle wallet connection success
  const handleWalletSuccess = useCallback(() => {
    // Call the stored resolve function if it exists
    if ((window as any).__walletConnectionResolve) {
      (window as any).__walletConnectionResolve();
      delete (window as any).__walletConnectionResolve;
    }
    
    setShowWalletPrompt(false);
  }, []);
  
  // Effect to check if wallet is required when component mounts
  useEffect(() => {
    // Skip during initial loading or if already prompting for wallet
    if (loading || showWalletPrompt) return;
    
    if (requireWallet && !isWalletAuthenticated) {
      requestWalletConnection('This feature requires a wallet connection');
    }
  }, [requireWallet, isWalletAuthenticated, loading, requestWalletConnection, showWalletPrompt]);

  // Render the modals
  const AuthModals = useCallback(() => (
    <>
      {showProfileModal && (
        <ProfileCompletionModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
      
      {showWalletPrompt && (
        <WalletPromptModal
          isOpen={showWalletPrompt}
          onClose={() => setShowWalletPrompt(false)}
          actionDescription={walletActionDescription}
          onSuccess={handleWalletSuccess}
        />
      )}
    </>
  ), [showProfileModal, showWalletPrompt, walletActionDescription, handleWalletSuccess]);

  return {
    user,
    isAuthenticated,
    isEmailAuthenticated,
    isWalletAuthenticated,
    loading,
    requiresProfile: user ? !user.isProfileComplete : false,
    requiresWallet: requireWallet && !isWalletAuthenticated,
    requestWalletConnection,
    AuthModals,
  };
}
