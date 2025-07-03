import { SorobanService } from '@/lib/soroban';
import { Distribution } from '@/types/bounty';
import { getNetwork } from '@stellar/freighter-api';
import toast from 'react-hot-toast';

/**
 * Utility functions for frontend blockchain operations
 */

// Token address mapping for blockchain contract integration
// Using the actual token contract addresses on the Stellar network
const TOKEN_ADDRESSES: Record<string, string> = {
  // These are asset contract IDs for the Stellar testnet
  USDC: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  NGNC: 'CBYFV4W2LTMXYZ3XWFX5BK2BY255DU2DSXNAE4FJ5A5VYUWGIBJDOIGG',
  KALE: 'CB23WRDQWGSP6YPMY4UV5C4OW5CBTXKYN3XEATG7KJEZCXMJBYEHOUOV',
  XLM: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
};

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

    // The token parameter is now already the address,
    // so we don't need to look it up in the mapping
    const tokenAddress = token;

    console.log(`Using token address: ${tokenAddress}`);

    // Get the network to confirm we're on the right one
    const network = await getNetwork().catch((error) => {
      console.warn('Failed to get network, using default:', error);
      return 'TESTNET'; // Default to testnet if we can't get the current network
    });
    console.log('Current network:', network);

    // Initialize Soroban service with the user's public key
    const sorobanService = new SorobanService(userPublicKey);

    // Update toast with more specific message
    toast.loading('Requesting wallet approval for transaction...', {
      id: 'wallet-transaction',
    });

    try {
      // Create bounty on the blockchain with the token address instead of symbol
      // Use retry logic for blockchain operations
      const bountyId = await retryOperation(async () => {
        return await sorobanService.createBounty({
          title,
          owner: userPublicKey,
          token: tokenAddress, // Use the resolved token address
          reward: { amount: reward.amount, asset: token }, // Use the token symbol
          distribution,
          submissionDeadline,
        });
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
    console.error('Error creating bounty on blockchain:', error);

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
        id: 'wallet-transaction',
      });
    } else if (error.message?.includes('timeout')) {
      toast.error('Wallet response timed out. Please try again.', {
        id: 'wallet-transaction',
      });
    } else if (error.message?.includes('insufficient balance')) {
      toast.error('Insufficient balance in your wallet.', {
        id: 'wallet-transaction',
      });
    } else if (error.message?.includes('Unsupported address type')) {
      toast.error(
        'Token not supported on this network. Please try USDC instead.',
        { id: 'wallet-transaction' }
      );
    } else if (error.message?.includes('Unsupported token')) {
      toast.error(
        'The selected token is not configured properly. Please try USDC instead.',
        { id: 'wallet-transaction' }
      );
    } else if (error.message?.includes('token')) {
      toast.error(`Token error: ${error.message}. Please try USDC instead.`, {
        id: 'wallet-transaction',
      });
    } else if (
      error.message?.includes('Simulation error') ||
      error.message?.includes('simulate')
    ) {
      toast.error(
        `Transaction simulation failed. Please try again with different parameters.`,
        { id: 'wallet-transaction' }
      );
    } else if (
      error.message?.includes('Contract error') ||
      error.message?.includes('contract')
    ) {
      toast.error(`Smart contract error: ${errorMessage}`, {
        id: 'wallet-transaction',
      });
    } else if (error.message?.includes('Failed to create bounty')) {
      toast.error(`Blockchain error: ${errorMessage}`, {
        id: 'wallet-transaction',
      });
    } else if (error.message?.includes('Account not found')) {
      toast.error(
        `Account not found on the blockchain. Make sure you have created and funded the accounts you're using.`,
        { id: 'wallet-transaction' }
      );
      console.error(
        'Account not found error. This usually means the token contract or user account does not exist on the current network.'
      );
    } else {
      toast.error(`Error creating bounty: ${errorMessage}`, {
        id: 'wallet-transaction',
      });
    }

    throw error;
  }
}

/**
 * Submit work to a bounty (database only approach)
 * @returns The submission ID
 */
export async function submitWorkOnChain({
  userPublicKey,
  bountyId,
  content,
}: {
  userPublicKey: string;
  bountyId: number;
  content: string;
}): Promise<string> {
  try {
    // Generate a unique submission ID using user's address, bounty ID and timestamp
    // This replaces the blockchain transaction
    const timestamp = Date.now();
    const submissionId = `${userPublicKey.substring(0, 8)}-${bountyId}-${timestamp}`;
    
    console.log(`Generated submission ID: ${submissionId} (database-only approach)`);

    return submissionId;
  } catch (error) {
    console.error('Error generating submission ID:', error);
    throw error;
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
  } catch (error) {
    console.error('Error updating bounty on blockchain:', error);
    throw error;
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
  } catch (error) {
    console.error('Error deleting bounty on blockchain:', error);
    throw error;
  }
}
