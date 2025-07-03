"use client";

import {
  allowAllModules,
  StellarWalletsKit,
  WalletNetwork,
} from "@creit.tech/stellar-wallets-kit";
import { TrezorModule } from "@creit.tech/stellar-wallets-kit/modules/trezor.module";
import {
  WalletConnectAllowedMethods,
  WalletConnectModule,
} from "@creit.tech/stellar-wallets-kit/modules/walletconnect.module";
import freighterApi from '@stellar/freighter-api';
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

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

const createWalletKit = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  // Wait for window to be fully loaded
  if (!window.document.body) {
    await new Promise(resolve => window.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.warn("Missing required environment variable NEXT_PUBLIC_APP_URL");
    return null;
  }

  if (!process.env.NEXT_PUBLIC_TREZOR_CONTACT_EMAIL) {
    console.warn(
      "Missing required environment variable NEXT_PUBLIC_TREZOR_CONTACT_EMAIL"
    );
    return null;
  }

  console.log("Initializing wallet kit...");

  // Always use TestNet
  const network = TESTNET_PASSPHRASE as WalletNetwork;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const trezorContactEmail = process.env.NEXT_PUBLIC_TREZOR_CONTACT_EMAIL;

  if (!appUrl || !trezorContactEmail) {
    console.warn("Missing required configuration for wallet kit");
    return null;
  }

  try {
    // Check if Freighter is available and on TestNet
    const isFreighterAvailable = await new Promise<boolean>(async (resolve) => {
      const checkFreighter = async () => {
        if (window.freighter) {
          try {
            const isConnected = await freighterApi.isConnected();
            if (isConnected) {
              const network = await freighterApi.getNetwork();
              if (network !== TESTNET_PASSPHRASE) {
                console.warn('Freighter is not on TestNet');
                toast.error('Please switch Freighter to TestNet');
                resolve(false);
                return;
              }
            }
            resolve(true);
          } catch (error) {
            console.error('Error checking Freighter:', error);
            resolve(false);
          }
        } else {
          resolve(false);
        }
      };
      
      // Check immediately
      if (window.freighter) {
        await checkFreighter();
      } else {
        // Set a timeout as fallback
        setTimeout(checkFreighter, 1000);
      }
    });

    console.log("Freighter availability:", isFreighterAvailable);

    const newKit = new StellarWalletsKit({
      network,
      modules: [
        ...allowAllModules(),
        new TrezorModule({
          appUrl,
          email: trezorContactEmail,
        }),
        new WalletConnectModule({
          url: appUrl,
          projectId: appUrl,
          method: WalletConnectAllowedMethods.SIGN,
          description:
            "Stallion is a decentralized bounty platform built on the Stellar network",
          name: "Stallion",
          icons: ["/favicon.svg"],
          network,
        }),
      ],
    });

    // Add Freighter compatibility layer with better error handling and network verification
    const originalGetAddress = newKit.getAddress.bind(newKit);
    newKit.getAddress = async () => {
      try {
        // First try the original method
        return await originalGetAddress();
      } catch (error) {
        console.error('Original getAddress error:', error);
        
        // If it fails, try Freighter's method
        if (await freighterApi.isConnected()) {
          try {
            // Verify network before proceeding
            const network = await freighterApi.getNetwork();
            if (network !== TESTNET_PASSPHRASE) {
              throw new Error('Please switch Freighter to TestNet');
            }

            const address = await freighterApi.getPublicKey();
            if (!address) {
              throw new Error('Freighter returned empty address');
            }
            return { address };
          } catch (freighterError) {
            console.error('Freighter getPublicKey error:', freighterError);
            throw new Error(freighterError instanceof Error ? freighterError.message : 'Failed to get address from Freighter');
          }
        }
        
        throw new Error('No compatible wallet found or wallet not connected');
      }
    };

    // Add network check to ensure we're on TestNet
    const originalGetNetwork = newKit.getNetwork.bind(newKit);
    newKit.getNetwork = async () => {
      try {
        const result = await originalGetNetwork();
        if (result.networkPassphrase !== TESTNET_PASSPHRASE) {
          throw new Error('Please switch to TestNet');
        }
        return result;
      } catch (error) {
        // If original fails, try Freighter
        if (await freighterApi.isConnected()) {
          try {
            const networkPassphrase = await freighterApi.getNetwork();
            if (networkPassphrase !== TESTNET_PASSPHRASE) {
              throw new Error('Please switch Freighter to TestNet');
            }
            return { network: 'testnet', networkPassphrase };
          } catch (freighterError) {
            console.error('Freighter getNetwork error:', freighterError);
            throw new Error(freighterError instanceof Error ? freighterError.message : 'Failed to get network from Freighter');
          }
        }
        throw error;
      }
    };

    // Add transaction signing with network verification
    newKit.signTransaction = async (transaction: string) => {
      if (await freighterApi.isConnected()) {
        try {
          // Verify network before signing
          const network = await freighterApi.getNetwork();
          if (network !== TESTNET_PASSPHRASE) {
            throw new Error('Please switch Freighter to TestNet');
          }

          const signedXdr = await freighterApi.signTransaction(transaction);
          if (!signedXdr) {
            throw new Error('Failed to sign transaction');
          }
          return {
            signedTxXdr: signedXdr,
            signerAddress: await freighterApi.getPublicKey()
          };
        } catch (error) {
          console.error('Transaction signing error:', error);
          throw new Error(error instanceof Error ? error.message : 'Failed to sign transaction. Please check your Freighter wallet.');
        }
      }
      throw new Error('Wallet not connected. Please connect your Freighter wallet.');
    };

    console.log("Wallet kit created successfully");
    return newKit;
  } catch (error) {
    console.error("Error creating wallet kit:", error);
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
      let retries = 3;
      while (retries > 0) {
        walletKit = await createWalletKit();
        if (walletKit) {
          console.log("Wallet kit initialized successfully");
          break;
        }
        console.warn(`Failed to initialize wallet kit, retries left: ${retries - 1}`);
        retries--;
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
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
if (typeof window !== "undefined") {
  // Don't wait for the promise to resolve
  initializeWallet().catch(console.error);
}

export { initializeWallet, getWalletKit };
// Remove synchronous export
export const kit = null;
