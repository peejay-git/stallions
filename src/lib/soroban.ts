import { getCurrentNetwork } from '@/config/networks';
import { Distribution } from '@/types/bounty';
import { BlockchainError } from '@/utils/errorHandler';
import {
  Status as BountyStatus,
  Bounty as ContractBounty,
  Client as SorobanClient,
} from '../../packages/stallion/src/index';
import { getWalletKit } from './wallet';

// Environment variables with defaults - now enhanced with network configuration
const CONTRACT_ID = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID || '';
const NETWORK = getCurrentNetwork().passphrase;

// Use network-specific RPC URL if defined in configuration, otherwise fall back to env var or default
const SOROBAN_RPC_URL =
  getCurrentNetwork().sorobanRpcUrl ||
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  'https://soroban-testnet.stellar.org';

// Only throw in development environment, in production we'll show appropriate UI
if (
  process.env.NODE_ENV === 'development' &&
  (!CONTRACT_ID || !NETWORK || !SOROBAN_RPC_URL)
) {
  console.error('Missing required environment variables for Soroban:', {
    CONTRACT_ID: !!CONTRACT_ID,
    NETWORK: !!NETWORK,
    SOROBAN_RPC_URL: !!SOROBAN_RPC_URL,
  });
  throw new Error('Missing required environment variables for Soroban');
}

/**
 * Soroban service for interacting with the bounty contract
 */
export class SorobanService {
  private contractId: string;
  private network: string;
  private sorobanClient: SorobanClient;
  private publicKey: string | null;

  constructor(publicKey?: string) {
    this.contractId = CONTRACT_ID;
    this.network = getCurrentNetwork().passphrase; // Always use current network
    this.publicKey = publicKey || null;

    try {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      if (!CONTRACT_ID || CONTRACT_ID.length < 10) {
        console.error('Warning: Contract ID appears to be invalid or missing');
      }

      if (!NETWORK) {
        console.error('Warning: Network passphrase is missing');
      }

      if (!SOROBAN_RPC_URL) {
        console.error('Warning: Soroban RPC URL is missing');
      }

      // Initialize the Soroban client for contract interactions
      this.sorobanClient = new SorobanClient({
        contractId: this.contractId,
        networkPassphrase: this.network,
        rpcUrl: SOROBAN_RPC_URL,
        publicKey: this.publicKey || '',
      });
    } catch (error) {
      console.error('Error initializing Soroban client:', error);
      throw new BlockchainError(
        'Failed to initialize Soroban client',
        'CONNECTION_ERROR'
      );
    }
  }

  /**
   * Create a new bounty
   */
  async createBounty({
    title,
    owner,
    token,
    reward,
    distribution,
    submissionDeadline,
  }: {
    title: string;
    owner: string;
    token: string;
    reward: { amount: string; asset: string };
    distribution: Distribution[];
    submissionDeadline: number;
  }): Promise<number> {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Validate parameters before sending to the blockchain
      if (!owner || owner.trim() === '') {
        throw new Error('Invalid owner address');
      }

      if (!token || token.trim() === '') {
        throw new Error('Invalid token');
      }

      if (
        !reward.amount ||
        isNaN(Number(reward.amount)) ||
        Number(reward.amount) <= 0
      ) {
        throw new Error('Invalid reward amount');
      }

      if (distribution.length === 0) {
        throw new Error('Distribution cannot be empty');
      }

      if (submissionDeadline <= Date.now()) {
        throw new Error('Submission deadline must be in the future');
      }

      try {
        // Prepare transaction
        const tx = await this.sorobanClient.create_bounty({
          owner: owner,
          token: token, // Use the token address passed in as a parameter
          reward: BigInt(reward.amount),
          distribution: distribution.map((dist) => [
            dist.position,
            dist.percentage,
          ]),
          submission_deadline: BigInt(submissionDeadline),
          title: title,
        });

        // Simulate to ensure transaction is valid
        try {
          const result = await tx.simulate();

          // The result object might contain errors in various formats
          // Using type assertion since the exact structure can vary
          const resultAny = result as any;
          if (resultAny.simulationError || resultAny.error) {
            const errorDetails = resultAny.simulationError || resultAny.error;
            throw new Error(
              `Simulation error: ${JSON.stringify(errorDetails)}`
            );
          }

          // Sign and send the transaction to the blockchain
          const walletKit = await getWalletKit();
          if (!walletKit) {
            throw new Error('Wallet not initialized');
          }

          const sentTx = await result.signAndSend({
            signTransaction: async (transaction) => {
              try {
                return await walletKit.signTransaction(transaction);
              } catch (error) {
                console.error('Transaction signing error:', error);
                throw error;
              }
            },
          });

          // await confirmation
          if (sentTx.result.isOk()) {
            const bountyId = Number(sentTx.result.unwrap().toString());
            return bountyId;
          }

          // If we get here, there was a problem
          const errorMsg = sentTx.result.isErr()
            ? sentTx.result.unwrapErr()
            : 'Unknown error';
          console.error('Transaction failed:', errorMsg);
          throw new BlockchainError(
            `Transaction failed: ${JSON.stringify(errorMsg)}`,
            'CONTRACT_ERROR'
          );
        } catch (simulateError: any) {
          console.error('Simulation failed:', simulateError);
          throw new Error(
            `Failed to simulate transaction: ${
              simulateError?.message || JSON.stringify(simulateError)
            }`
          );
        }
      } catch (contractError: any) {
        console.error('Contract interaction failed:', contractError);
        throw new Error(
          `Contract error: ${
            contractError?.message || JSON.stringify(contractError)
          }`
        );
      }
    } catch (error) {
      console.error('Error creating bounty:', error);
      throw error;
    }
  }

  /**
   * Get all bounties
   */
  async getBounties(): Promise<ContractBounty[]> {
    try {
      const tx = await this.sorobanClient.get_bounties();
      const result = await tx.simulate();
      const bountyIds = result.result;
      const bounties = await Promise.all(
        bountyIds.map(async (id) => {
          return await this.getBounty(Number(id.toString()));
        })
      );
      return bounties;
    } catch (error) {
      console.error('Error getting bounties:', error);
      throw error;
    }
  }

  /**
   * Get bounties owned by a specific user
   */
  async getOwnerBounties(owner: string): Promise<ContractBounty[]> {
    try {
      const tx = await this.sorobanClient.get_owner_bounties({
        owner,
      });
      const result = await tx.simulate();
      const bountyIds = result.result;
      const bounties = await Promise.all(
        bountyIds.map(async (id) => {
          return await this.getBounty(Number(id.toString()));
        })
      );
      return bounties;
    } catch (error) {
      console.error('Error getting owner bounties:', error);
      throw error;
    }
  }

  /**
   * Get bounties by status
   */
  async getBountiesByStatus(status: BountyStatus): Promise<ContractBounty[]> {
    try {
      const tx = await this.sorobanClient.get_bounties_by_status({
        status,
      });
      const result = await tx.simulate();
      const bountyIds = result.result;
      const bounties = await Promise.all(
        bountyIds.map(async (id) => {
          return await this.getBounty(Number(id.toString()));
        })
      );
      return bounties;
    } catch (error) {
      console.error('Error getting bounties by status:', error);
      throw error;
    }
  }

  /**
   * Get bounties by token
   */
  async getBountiesByToken(token: string): Promise<ContractBounty[]> {
    try {
      const tx = await this.sorobanClient.get_bounties_by_token({
        token,
      });
      const result = await tx.simulate();
      const bountyIds = result.result;
      const bounties = await Promise.all(
        bountyIds.map(async (id) => {
          return await this.getBounty(Number(id.toString()));
        })
      );
      return bounties;
    } catch (error) {
      console.error('Error getting bounties by token:', error);
      throw error;
    }
  }

  /**
   * Get active bounties
   */
  async getActiveBounties(): Promise<ContractBounty[]> {
    try {
      const tx = await this.sorobanClient.get_active_bounties();
      const result = await tx.simulate();
      const bountyIds = result.result;

      const bounties = await Promise.all(
        bountyIds.map(async (id) => {
          return await this.getBounty(Number(id.toString()));
        })
      );

      return bounties;
    } catch (error) {
      console.error('Error getting active bounties:', error);
      throw error;
    }
  }

  /**
   * Get bounty details
   */
  async getBounty(bountyId: number): Promise<ContractBounty> {
    try {
      const tx = await this.sorobanClient.get_bounty({
        bounty_id: bountyId,
      });
      const result = await tx.simulate();

      // Sign and send the transaction to the blockchain
      const walletKit = await getWalletKit();
      if (!walletKit) {
        throw new Error('Wallet not initialized');
      }
      const sentTx = await result.signAndSend({
        signTransaction: async (transaction) => {
          return await walletKit.signTransaction(transaction);
        },
      });

      // await confirmation
      if (sentTx.result.isOk()) {
        return sentTx.result.unwrap();
      }

      throw new BlockchainError('Failed to get bounty', 'CONTRACT_ERROR');
    } catch (error) {
      console.error('Error getting bounty:', error);
      throw error;
    }
  }

  /**
   * Update a bounty
   */
  async updateBounty(
    bountyId: number,
    updates: {
      title?: string;
      distribution?: Array<readonly [number, number]>;
      submissionDeadline?: number;
    }
  ): Promise<void> {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Create the transaction for updating the bounty
      // Matching contract method signature
      const tx = await this.sorobanClient.update_bounty({
        owner: this.publicKey,
        bounty_id: bountyId,
        new_title: updates.title ? updates.title : undefined,
        new_distribution: updates.distribution || [],
        new_submission_deadline: updates.submissionDeadline
          ? BigInt(updates.submissionDeadline)
          : undefined,
      });

      const result = await tx.simulate();

      // Sign and send the transaction to the blockchain
      const walletKit = await getWalletKit();
      if (!walletKit) {
        throw new Error('Wallet not initialized');
      }
      const sentTx = await result.signAndSend({
        signTransaction: async (transaction) => {
          return await walletKit.signTransaction(transaction);
        },
      });

      // await confirmation
      if (sentTx.result.isOk()) {
        return;
      }

      throw new BlockchainError('Failed to update bounty', 'CONTRACT_ERROR');
    } catch (error) {
      console.error('Error updating bounty:', error);
      throw error;
    }
  }

  /**
   * Delete a bounty
   */
  async deleteBounty(bountyId: number): Promise<void> {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Create the transaction for deleting the bounty
      const tx = await this.sorobanClient.delete_bounty({
        owner: this.publicKey,
        bounty_id: bountyId,
      });

      const result = await tx.simulate();

      // Sign and send the transaction to the blockchain
      const walletKit = await getWalletKit();
      if (!walletKit) {
        throw new Error('Wallet not initialized');
      }
      const sentTx = await result.signAndSend({
        signTransaction: async (transaction) => {
          return await walletKit.signTransaction(transaction);
        },
      });

      // await confirmation
      if (sentTx.result.isOk()) {
        return;
      }

      throw new BlockchainError('Failed to delete bounty', 'CONTRACT_ERROR');
    } catch (error) {
      console.error('Error deleting bounty:', error);
      throw error;
    }
  }

  /**
   * Select winners for a bounty
   */
  async selectWinners(
    bountyId: number,
    owner: string,
    winners: string[]
  ): Promise<void> {
    try {
      if (!this.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Create the transaction for selecting winners
      const tx = await this.sorobanClient.select_winners({
        owner,
        bounty_id: bountyId,
        winners,
      });

      // Simulate the transaction first
      const result = await tx.simulate();

      // Check for simulation errors
      const resultAny = result as any;
      if (resultAny.simulationError || resultAny.error) {
        const errorDetails = resultAny.simulationError || resultAny.error;
        throw new Error(`Simulation error: ${JSON.stringify(errorDetails)}`);
      }

      // Sign and send the transaction
      const walletKit = await getWalletKit();
      if (!walletKit) {
        throw new Error('Wallet not initialized');
      }

      const sentTx = await result.signAndSend({
        signTransaction: async (transaction) => {
          try {
            return await walletKit.signTransaction(transaction);
          } catch (error) {
            console.error('Transaction signing error:', error);
            throw error;
          }
        },
      });

      // Check the result
      if (sentTx.result.isOk()) {
        return;
      }

      // If we get here, there was a problem
      const errorMsg = sentTx.result.isErr()
        ? sentTx.result.unwrapErr()
        : 'Unknown error';
      throw new BlockchainError(
        `Transaction failed: ${JSON.stringify(errorMsg)}`,
        'CONTRACT_ERROR'
      );
    } catch (error) {
      throw error;
    }
  }
}
