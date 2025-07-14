'use client';

import { ISupportedWallet } from '@creit.tech/stellar-wallets-kit';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getWalletKit, initializeWallet } from '../lib/wallet';

// Wallet context type definition
interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  networkPassphrase: string | null;
  connect: (props?: {
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize wallet on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeWallet();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      }
    };
    init();
  }, []);

  // Connect wallet
  const connect = async (props?: {
    onWalletSelected?: (address: string) => void;
    modalTitle?: string;
    notAvailableText?: string;
  }): Promise<string | null> => {
    const { onWalletSelected, modalTitle, notAvailableText } = props || {};

    if (!isInitialized) {
      toast.error('Wallet system not initialized');
    }

    if (isConnected && publicKey) return publicKey;

    const kit = await getWalletKit();
    if (!kit) {
      toast.error('Wallet kit not initialized');
      return null;
    }

    setIsConnecting(true);

    let address: string | null = null;
    try {
      await kit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          kit.setWallet(option.id);
          address = (await kit.getAddress()).address;
          if (!address) {
            throw new Error('No address returned from wallet');
          }

          setPublicKey(address);
          onWalletSelected?.(address);
          setIsConnected(true);
        },
        modalTitle,
        notAvailableText,
        onClosed: () => {
          setIsConnecting(false);
        },
      });

      // Wait until public key is set
      while (!address) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return address;
    } catch (e) {
      console.error('Error connecting wallet:', e);
      if ((e as any).code !== -3) {
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
    setNetworkPassphrase(null);
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
