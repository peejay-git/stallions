// This file handles dynamic imports of wallet-related modules
let walletKit: any = null;

export const importWalletKit = async () => {
  if (typeof window === 'undefined') {
    return {
      StellarWalletsKit: class {
        constructor() {}
        setWallet() {}
        getAddress() { return Promise.resolve({ address: '' }); }
        getNetwork() { return Promise.resolve({ networkPassphrase: 'Test SDF Network ; September 2015' }); }
        signTransaction() { return Promise.resolve({ signedTxXdr: '', signerAddress: '' }); }
        disconnect() {}
        openModal() { return Promise.resolve(); }
      },
      WalletNetwork: {
        PUBLIC: 'Public Global Stellar Network ; September 2015',
        TESTNET: 'Test SDF Network ; September 2015'
      },
      allowAllModules: () => [],
      TrezorModule: class {
        constructor() {}
      },
      WalletConnectModule: class {
        constructor() {}
      },
      WalletConnectAllowedMethods: {
        SIGN: 'sign'
      }
    };
  }

  if (!walletKit) {
    const [
      { StellarWalletsKit, WalletNetwork, allowAllModules },
      { TrezorModule },
      { WalletConnectModule, WalletConnectAllowedMethods }
    ] = await Promise.all([
      import('@creit.tech/stellar-wallets-kit'),
      import('@creit.tech/stellar-wallets-kit/modules/trezor.module'),
      import('@creit.tech/stellar-wallets-kit/modules/walletconnect.module')
    ]);

    walletKit = {
      StellarWalletsKit,
      WalletNetwork,
      allowAllModules,
      TrezorModule,
      WalletConnectModule,
      WalletConnectAllowedMethods
    };
  }

  return walletKit;
};

// Import Freighter API as a CommonJS module
import freighterApi from '@stellar/freighter-api';

// Re-export the functions we need
export const {
  isConnected,
  getPublicKey: getAddress, // Freighter uses getPublicKey instead of getAddress
  signTransaction,
  signAuthEntry,
  getNetwork
} = freighterApi;

// Export the default import as well
export default freighterApi; 