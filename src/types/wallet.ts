export interface StellarWallet {
  publicKey: string;
  network: string;
  networkPassphrase: string;
}

export interface FreighterResponse {
  publicKey?: string;
  error?: string;
  network?: string;
  networkPassphrase?: string;
}
