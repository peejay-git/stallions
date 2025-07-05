/**
 * Custom error class for blockchain-related errors
 */
export class BlockchainError extends Error {
  code: string;

  constructor(message: string, code: string = 'BLOCKCHAIN_ERROR') {
    super(message);
    this.name = 'BlockchainError';
    this.code = code;
  }
}

/**
 * Custom error class for wallet-related errors
 */
export class WalletError extends Error {
  code: string;

  constructor(message: string, code: string = 'WALLET_ERROR') {
    super(message);
    this.name = 'WalletError';
    this.code = code;
  }
}

/**
 * Handles an error and returns a user-friendly error message
 */
export function handleError(error: unknown): string {
  if (error instanceof BlockchainError) {
    return `Blockchain error: ${error.message}`;
  }

  if (error instanceof WalletError) {
    return `Wallet error: ${error.message}`;
  }

  if (error instanceof Error) {
    console.error('Application error:', error);
    return error.message;
  }

  console.error('Unknown error:', error);
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Common blockchain error codes with user-friendly messages
 */
export const blockchainErrorMessages: Record<string, string> = {
  INSUFFICIENT_FUNDS:
    'Your account does not have enough funds to complete this transaction.',
  CONTRACT_ERROR:
    'The smart contract encountered an error while processing your request.',
  TRANSACTION_FAILED:
    'The transaction failed to be confirmed on the blockchain.',
  TIMEOUT: 'The operation timed out. The network may be congested.',
  INVALID_ADDRESS: 'The address provided is not a valid Stellar address.',
};

/**
 * Common wallet error codes with user-friendly messages
 */
export const walletErrorMessages: Record<string, string> = {
  NOT_CONNECTED:
    'Your wallet is not connected. Please connect your wallet to continue.',
  REJECTED: 'The transaction was rejected by your wallet.',
  UNSUPPORTED_NETWORK:
    'Your wallet is connected to an unsupported network. Please switch to the Stellar network.',
  WALLET_LOCKED:
    'Your wallet is locked. Please unlock your wallet to continue.',
  NO_WALLET:
    'No Stellar wallet was detected. Please install a Stellar wallet extension like Freighter.',
};
