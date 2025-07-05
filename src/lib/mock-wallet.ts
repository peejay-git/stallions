// Mock implementation of wallet functions for server-side rendering
export const WalletNetwork = {
  TESTNET: "Test SDF Network ; September 2015",
};

export class StellarWalletsKit {
  constructor() {}
  setWallet() {}
  getAddress() {
    return { address: "" };
  }
  getNetwork() {
    return { networkPassphrase: WalletNetwork.TESTNET };
  }
  signTransaction() {
    return "";
  }
  disconnect() {}
  openModal() {}
}

export const allowAllModules = () => [];

export class TrezorModule {
  constructor() {}
}

export class WalletConnectModule {
  constructor() {}
}

export const WalletConnectAllowedMethods = {
  SIGN: "sign",
};
