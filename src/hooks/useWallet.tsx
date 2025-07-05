'use client';

import { ISupportedWallet } from '@creit.tech/stellar-wallets-kit';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useUserStore from '../lib/stores/useUserStore';
import { getWalletKit, initializeWallet } from '../lib/wallet';

// Wallet context type definition
interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  networkPassphrase: string | null;
  connect: ({
    onWalletSelected,
    modalTitle,
    notAvailableText,
  }: {
    onWalletSelected?: (address: string) => void;
    modalTitle?: string;
    notAvailableText?: string;
  }) => Promise<string | null>;
  disconnect: () => void;
}

// Default context value
const defaultContext: WalletContextType = {
  isConnected: false,
  isConnecting: false,
  publicKey: null,
  networkPassphrase: null,
  connect: async () => null,
  disconnect: () => {},
};

// Local storage keys
const WALLET_ID_KEY = 'walletId';

// Create the context
const WalletContext = createContext<WalletContextType>(defaultContext);

// Provider component
export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(
    null
  );
  const [walletId, setWalletId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const user = useUserStore((state) => state.user);

  // Initialize wallet on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeWallet();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
        setIsInitialized(true); // Still mark as initialized even on error
      }
    };
    init();
  }, []);

  // Check if wallet is connected on initial load (only for sponsors)
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (typeof window === 'undefined') return;
        if (!isInitialized) return;
        // Only auto-connect for logged-in sponsors
        if (!user || user.role !== 'sponsor') return;
        const kit = await getWalletKit();
        if (!kit) {
          console.warn('Wallet kit not available');
          return;
        }
        try {
          setIsConnecting(true);
          const storedWalletId = localStorage.getItem(WALLET_ID_KEY);
          if (storedWalletId) {
            setWalletId(storedWalletId);
            kit.setWallet(storedWalletId);
            const address = await kit.getAddress();
            if (!address?.address) {
              throw new Error('No address returned from wallet');
            }
            setPublicKey(address.address);
            setIsConnected(true);
            const network = await kit.getNetwork();
            setNetworkPassphrase(network.networkPassphrase);
          }
        } catch (error) {
          console.error('Error reconnecting to wallet:', error);
          localStorage.removeItem(WALLET_ID_KEY);
          setWalletId(null);
          setIsConnected(false);
          setPublicKey(null);
          setNetworkPassphrase(null);
        }
      } catch (e) {
        console.error('Error checking wallet connection:', e);
      } finally {
        setIsConnecting(false);
      }
    };
    checkConnection();
  }, [isInitialized, user]);

  // Connect wallet
  const connect = async ({
    onWalletSelected,
    modalTitle = 'Connect Wallet',
    notAvailableText = 'No wallets available',
  }: {
    onWalletSelected?: (address: string) => void;
    modalTitle?: string;
    notAvailableText?: string;
  }): Promise<string | null> => {
    if (!isInitialized) {
      toast.error('Wallet system not initialized');
      return null;
    }

    if (isConnected && publicKey) return publicKey;

    const kit = await getWalletKit();
    if (!kit) {
      toast.error('Wallet kit not initialized');
      return null;
    }

    setIsConnecting(true);

    try {
      if (walletId) {
        kit.setWallet(walletId);

        const address = await kit.getAddress();
        if (!address?.address) {
          throw new Error('No address returned from wallet');
        }

        const pubKey = address.address;
        setPublicKey(pubKey);
        setIsConnected(true);
        const network = await kit.getNetwork();
        setNetworkPassphrase(network.networkPassphrase);
        return pubKey;
      }

      await kit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          kit.setWallet(option.id);
          setWalletId(option.id);
          localStorage.setItem(WALLET_ID_KEY, option.id);

          const { address } = await kit.getAddress();
          if (!address) {
            throw new Error('No address returned from wallet');
          }

          setPublicKey(address);
          onWalletSelected?.(address);
        },
        modalTitle,
        notAvailableText,
      });

      // Get the public key
      const address = await kit.getAddress();
      if (!address?.address) {
        throw new Error('No address returned from wallet');
      }

      const pubKey = address.address;
      if (pubKey) {
        setPublicKey(pubKey);
        setIsConnected(true);
        return pubKey;
      }

      toast.error('No public key returned from wallet');
      return null;
    } catch (e) {
      console.error('Error connecting wallet:', e);
      if ((e as any).code !== -3) {
        console.log('WJWII', (e as any).code);
        toast.error('Error connecting wallet: ' + (e as Error).message);
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    if (!isInitialized) return;

    const kit = await getWalletKit();
    if (!kit) return;

    try {
      await kit.disconnect();
    } catch (e) {
      console.error('Error disconnecting from wallet:', e);
    }

    setIsConnected(false);
    setPublicKey(null);
    setWalletId(null);
    setNetworkPassphrase(null);
    localStorage.removeItem(WALLET_ID_KEY);
    toast.success('Wallet disconnected');
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        publicKey,
        networkPassphrase,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Hook to use the wallet context
export const useWallet = () => useContext(WalletContext);
