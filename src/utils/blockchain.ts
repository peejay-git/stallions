import { getCurrentNetwork, getTokenBySymbol } from '@/config/networks';
import { SorobanService } from '@/lib/soroban';
import { Distribution } from '@/types/bounty';
import toast from 'react-hot-toast';

/**
 * Utility functions for frontend blockchain operations
 */

/**
 * Handle blockchain error and show appropriate toast message
 * @param error The error object
 * @param context Context of where the error occurred (e.g., 'creating bounty', 'updating bounty')
 * @param toastId Toast ID for deduplication
 */
export function handleBlockchainError(
  error: any,
  context: string = 'blockchain operation',
  toastId: string = 'wallet-transaction'
): never {
  console.error(`Error in ${context}:`, error);

  // Parse JSON error messages if they exist
  let errorMessage = error.message || 'Unknown error';

  try {
    // Sometimes errors come as JSON strings
    if (typeof errorMessage === 'string' && errorMessage.includes('{')) {
      const jsonStart = errorMessage.indexOf('{');
      if (jsonStart >= 0) {
        const jsonPart = errorMessage.substring(jsonStart);
        const parsedError = JSON.parse(jsonPart);

        if (parsedError.message) {
          errorMessage = parsedError.message;
        } else if (parsedError.code) {
          errorMessage = `Error code: ${parsedError.code}`;
          if (parsedError.detail) {
            errorMessage += ` - ${parsedError.detail}`;
          }
        }
      }
    }
  } catch (parseError) {
    // If JSON parsing fails, just use the original error message
    console.error('Error parsing error message:', parseError);
  }

  // Show appropriate error message based on the error type
  if (error.message?.includes('User declined')) {
    toast.error('Transaction was declined in wallet.', {
      id: toastId,
    });
  } else if (error.message?.includes('Account not found')) {
    toast.error(
      "Account not found on the blockchain. Make sure you have created and funded the accounts you're using.",
      {
        id: toastId,
      }
    );
  } else if (error.message?.includes('timeout')) {
    toast.error('Wallet response timed out. Please try again.', {
      id: toastId,
    });
  } else if (error.message?.toLowerCase().includes('trustline')) {
    toast.error(
      'Transaction failed. Please set trustline for the token and make sure you have enough balance.',
      {
        id: toastId,
      }
    );
  } else if (
    error.message?.includes('insufficient balance') ||
    error.message?.includes('resulting balance is not within the allowed range')
  ) {
    toast.error('Insufficient balance in your wallet.', {
      id: toastId,
    });
  } else if (error.message?.includes('Unsupported address type')) {
    toast.error(
      'Token not supported on this network. Please try USDC instead.',
      { id: toastId }
    );
  } else if (error.message?.includes('Unsupported token')) {
    toast.error(
      'The selected token is not configured properly. Please try USDC instead.',
      { id: toastId }
    );
  } else if (error.message?.includes('token')) {
    toast.error(`Token error: ${error.message}. Please try USDC instead.`, {
      id: toastId,
    });
  } else if (
    error.message?.includes('Simulation error') ||
    error.message?.includes('simulate')
  ) {
    if (error.message?.includes('The user rejected this request')) {
      toast.error('Transaction was rejected in wallet.', {
        id: toastId,
      });
    } else {
      toast.error(
        `Transaction simulation failed. Please try again with different parameters.`,
        { id: toastId }
      );
    }
  } else if (
    error.message?.includes('Contract error') ||
    error.message?.includes('contract')
  ) {
    toast.error(`Smart contract error: ${errorMessage}`, {
      id: toastId,
    });
  } else if (error.message?.includes(`Failed to ${context}`)) {
    toast.error(`Blockchain error: ${errorMessage}`, {
      id: toastId,
    });
  } else if (error.message?.includes('Account not found')) {
    toast.error(
      `Account not found on the blockchain. Make sure you have created and funded the accounts you're using.`,
      { id: toastId }
    );
    console.error(
      'Account not found error. This usually means the token contract or user account does not exist on the current network.'
    );
  } else {
    toast.error(`Error in ${context}: ${errorMessage}`, {
      id: toastId,
    });
  }

  // Re-throw the error so the caller can handle it if needed
  throw error;
}

// Max retries for blockchain operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Utility function to retry a function with exponential backoff
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(
        `Operation failed (attempt ${attempt}/${maxRetries}):`,
        error
      );
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Operation failed after multiple attempts');
}

/**
 * Create a bounty on the blockchain
 * @returns The blockchain bounty ID
 */
export async function createBountyOnChain({
  userPublicKey,
  title,
  token,
  reward,
  distribution,
  submissionDeadline,
}: {
  userPublicKey: string;
  title: string;
  token: string;
  reward: { amount: string; asset: string };
  distribution: Distribution[];
  submissionDeadline: number;
}): Promise<number> {
  try {
    // Display clear message to user
    toast.loading('Preparing transaction for wallet approval...', {
      id: 'wallet-transaction',
    });

    // Validate the public key
    if (!userPublicKey) {
      toast.error(
        'Wallet public key is missing. Please reconnect your wallet.',
        { id: 'wallet-transaction' }
      );
      throw new Error('Wallet public key is missing');
    }

    // The token parameter could be either a symbol or address, try to resolve it
    let tokenAddress = token;

    // If this doesn't look like a Stellar address, try to resolve as symbol
    if (!token.startsWith('C') && !token.startsWith('G')) {
      const tokenConfig = getTokenBySymbol(getCurrentNetwork().id, token);
      if (tokenConfig) {
        tokenAddress = tokenConfig.address;
      } else {
        toast.error(
          `Token symbol ${token} not found in the current network configuration.`,
          { id: 'wallet-transaction' }
        );
        throw new Error(
          `Token symbol ${token} not found in the current network`
        );
      }
    }

    // Initialize Soroban service with the user's public key
    const sorobanService = new SorobanService(userPublicKey);

    // Update toast with more specific message
    toast.loading('Requesting wallet approval for transaction...', {
      id: 'wallet-transaction',
    });

    try {
      // Create bounty on the blockchain with the token address instead of symbol
      const bountyId = await sorobanService.createBounty({
        title,
        owner: userPublicKey,
        token: tokenAddress, // Use the resolved token address
        reward: { amount: reward.amount, asset: tokenAddress }, // Use the token address for contract
        distribution,
        submissionDeadline,
      });

      // Success message
      toast.success('Transaction approved! Creating bounty on blockchain...', {
        id: 'wallet-transaction',
      });

      return bountyId;
    } catch (blockchainError: any) {
      // If the error is related to user interaction (like declining), don't retry
      if (
        blockchainError.message?.includes('User declined') ||
        blockchainError.message?.includes('denied') ||
        blockchainError.message?.includes('rejected')
      ) {
        throw blockchainError;
      }

      throw blockchainError;
    }
  } catch (error: any) {
    // Use the reusable error handler
    handleBlockchainError(error, 'creating bounty');
  }
}

/**
 * Update a bounty on the blockchain
 */
export async function updateBountyOnChain({
  userPublicKey,
  bountyId,
  title,
  distribution,
  submissionDeadline,
}: {
  userPublicKey: string;
  bountyId: number;
  title?: string;
  distribution?: Distribution[];
  submissionDeadline?: number;
}): Promise<void> {
  try {
    // Initialize Soroban service with the user's public key
    const sorobanService = new SorobanService(userPublicKey);

    // Convert distribution to the format expected by the smart contract
    const formattedDistribution = distribution
      ? distribution.map((dist) => [dist.position, dist.percentage] as const)
      : [];

    // Update the bounty on the blockchain
    await sorobanService.updateBounty(bountyId, {
      title,
      distribution: formattedDistribution,
      submissionDeadline,
    });
  } catch (error: any) {
    handleBlockchainError(error, 'updating bounty');
  }
}

/**
 * Delete a bounty on the blockchain
 */
export async function deleteBountyOnChain({
  userPublicKey,
  bountyId,
}: {
  userPublicKey: string;
  bountyId: number;
}): Promise<void> {
  try {
    // Initialize Soroban service with the user's public key
    const sorobanService = new SorobanService(userPublicKey);

    // Delete the bounty on the blockchain
    await sorobanService.deleteBounty(bountyId);
  } catch (error: any) {
    handleBlockchainError(error, 'deleting bounty');
  }
}
