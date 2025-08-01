'use client';

import {
  allowAllModules,
  StellarWalletsKit,
  WalletNetwork,
} from '@creit.tech/stellar-wallets-kit';
import toast from 'react-hot-toast';

// Add Freighter type to window object
declare global {
  interface Window {
    freighter?: {
      isConnected: () => Promise<boolean>;
      getPublicKey: () => Promise<string>;
      getNetwork: () => Promise<string>;
    };
  }
}

let walletKit: StellarWalletsKit | null = null;
let initializationPromise: Promise<StellarWalletsKit | null> | null = null;

// Import network configuration from centralized config
import { getCurrentNetwork, NETWORKS } from '@/config/networks';

// Export network information for use throughout the app
// Note: These exports are for backward compatibility - new code should use getCurrentNetwork()
export const NETWORK = getCurrentNetwork().passphrase;
export const NETWORK_NAME = getCurrentNetwork().name;
export const NETWORK_DISPLAY_NAME = getCurrentNetwork().displayName;

// Define aliases that might be returned by different wallet implementations
// Include passphrases from all supported networks for comparison
export const NETWORK_ALIASES = NETWORKS.flatMap((network) => [
  network.passphrase,
  network.name,
  network.displayName,
  network.id,
]);

const createWalletKit = async () => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Wait for window to be fully loaded
  if (!window.document.body) {
    await new Promise((resolve) =>
      window.addEventListener('DOMContentLoaded', resolve, { once: true })
    );
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.warn('Missing required environment variable NEXT_PUBLIC_APP_URL');
    return null;
  }

  if (!process.env.NEXT_PUBLIC_TREZOR_CONTACT_EMAIL) {
    console.warn(
      'Missing required environment variable NEXT_PUBLIC_TREZOR_CONTACT_EMAIL'
    );
    return null;
  }

  // Always use the current selected network from our config
  const network = getCurrentNetwork().passphrase as WalletNetwork;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const trezorContactEmail = process.env.NEXT_PUBLIC_TREZOR_CONTACT_EMAIL;

  if (!appUrl || !trezorContactEmail) {
    console.warn('Missing required configuration for wallet kit');
    return null;
  }

  try {
    // Initialize the kit with all modules
    const newKit = new StellarWalletsKit({
      network,
      modules: [
        ...allowAllModules(),
        // new TrezorModule({
        //   appUrl,
        //   email: trezorContactEmail,
        // }),
        // new WalletConnectModule({
        //   url: appUrl,
        //   projectId: appUrl,
        //   method: WalletConnectAllowedMethods.SIGN,
        //   description:
        //     'Stallion is a decentralized bounty platform built on the Stellar network',
        //   name: 'Stallion',
        //   icons: ['/favicon.svg'],
        //   network,
        // }),
      ],
    });

    // Add network verification middleware
    const originalGetNetwork = newKit.getNetwork.bind(newKit);
    newKit.getNetwork = async () => {
      try {
        const result = await originalGetNetwork();

        // Verify the network is supported
        const isSupported = NETWORK_ALIASES.some(
          (alias) =>
            result.networkPassphrase.toLowerCase() === alias.toLowerCase()
        );
        if (!isSupported) {
          const currentNetwork = getCurrentNetwork().displayName;
          toast.error(`Please switch your wallet to the ${currentNetwork} network`);
          throw new Error(`Please switch your wallet to the ${currentNetwork} network`);
        }
        return result;
      } catch (error) {
        console.error('Error getting network:', error);
        throw new Error(
          error instanceof Error
            ? error.message
            : 'Failed to get network from wallet'
        );
      }
    };

    return newKit;
  } catch (error) {
    return null;
  }
};

// Initialize the wallet kit with retry logic
const initializeWallet = async () => {
  // Return existing initialization promise if it exists
  if (initializationPromise) {
    return initializationPromise;
  }

  // Create new initialization promise
  initializationPromise = (async () => {
    if (!walletKit) {
      // Add an initial delay to allow browser extensions to fully initialize
      // This is critical for proper wallet detection
      await new Promise((resolve) => setTimeout(resolve, 10000));

      let retries = 3;
      while (retries > 0) {
        walletKit = await createWalletKit();
        if (walletKit) {
          // Log available wallets for debugging
          try {
            // Use kit's getSupportedWallets method if available, otherwise fallback to type casting
            const supportedWallets =
              typeof walletKit.getSupportedWallets === 'function'
                ? walletKit.getSupportedWallets()
                : (walletKit as any).supportedWallets || [];

            console.log(
              'Available wallets:',
              Array.isArray(supportedWallets)
                ? supportedWallets
                    .map((w: any) => w.id || w.name || 'unknown')
                    .filter(Boolean)
                : 'No wallets detected'
            );
          } catch (error) {
            console.error('Error getting wallet list:', error);
          }
          break;
        }
        console.warn(
          `Failed to initialize wallet kit, retries left: ${retries - 1}`
        );
        retries--;
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return walletKit;
  })();

  return initializationPromise;
};

// Get the wallet kit instance
const getWalletKit = async () => {
  return await initializeWallet();
};

// Initialize the kit immediately in the browser
if (typeof window !== 'undefined') {
  // Don't wait for the promise to resolve
  initializeWallet().catch(console.error);
}

// Sign transactions using the wallet kit
export const signTransaction = async (
  xdr: string,
  networkPassphrase: string
): Promise<{
  signedTxXdr: string;
  signerAddress?: string;
}> => {
  if (typeof window === 'undefined') {
    throw new Error('signTransaction can only be called in browser');
  }

  try {
    const wallet = await getWalletKit();
    if (!wallet) {
      throw new Error(
        'Wallet not initialized. Please connect your wallet first.'
      );
    }

    // Verify network passphrase matches one of our supported networks
    const isSupported = NETWORK_ALIASES.some(
      (alias) => networkPassphrase.toLowerCase() === alias.toLowerCase()
    );

    if (!isSupported) {
      console.warn('Expected a supported network passphrase');
      console.warn('Expected one of:', NETWORK_ALIASES);
      console.warn('Received:', networkPassphrase);
      throw new Error(
        'Network passphrase does not match any supported network'
      );
    }

    // Use the wallet kit for signing
    const signedTx = await wallet.signTransaction(xdr, {
      networkPassphrase,
    });

    if (!signedTx) {
      throw new Error('Failed to get signed transaction from wallet');
    }

    return signedTx;
  } catch (error) {
    console.error('Transaction signing error:', error);

    // Show a user-friendly error
    if (error instanceof Error) {
      if (
        error.message.includes('User declined') ||
        error.message.includes('rejected') ||
        error.message.includes('denied')
      ) {
        toast.error('Transaction was rejected by wallet');
      } else if (error.message.includes('network')) {
        toast.error(
          `Network mismatch. Please switch your wallet to ${
            getCurrentNetwork().name
          }`
        );
      } else {
        toast.error('Failed to sign transaction: ' + error.message);
      }
    } else {
      toast.error('Unknown error while signing transaction');
    }

    throw new Error(
      error instanceof Error ? error.message : 'Unknown signing error'
    );
  }
};

export { getWalletKit, initializeWallet };
