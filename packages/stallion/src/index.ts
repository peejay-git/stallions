import type { i128, Option, u32, u64 } from '@stellar/stellar-sdk/contract';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  Spec as ContractSpec,
  MethodOptions,
  Result,
} from '@stellar/stellar-sdk/contract';
import { Buffer } from 'buffer';
export * from '@stellar/stellar-sdk';
export * as contract from '@stellar/stellar-sdk/contract';
export * as rpc from '@stellar/stellar-sdk/rpc';

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}

export const networks = {
  testnet: {
    networkPassphrase: 'Test SDF Network ; September 2015',
    contractId: 'CDIV4XW26HU7DL732Z4NC3KELPENKBOSUJWKTHIB5QD5OQDJSSARYXZP',
  },
} as const;

export const Errors = {
  1: { message: 'OnlyOwner' },
  2: { message: 'InactiveBounty' },
  3: { message: 'BountyDeadlinePassed' },
  4: { message: 'BountyNotFound' },
  5: { message: 'DistributionMustSumTo100' },
  6: { message: 'InvalidDeadlineUpdate' },
  7: { message: 'TooManyWinners' },
  8: { message: 'NotAdmin' },
  9: { message: 'AdminCannotBeZero' },
  10: { message: 'FeeAccountCannotBeZero' },
  11: { message: 'SameFeeAccount' },
  12: { message: 'InvalidReward' },
  13: { message: 'InternalError' },
};

export type Status =
  | { tag: 'Active'; values: void }
  | { tag: 'InReview'; values: void }
  | { tag: 'Completed'; values: void };

export interface Bounty {
  distribution: Map<u32, u32>;
  owner: string;
  reward: i128;
  status: Status;
  submission_deadline: u64;
  title: string;
  token: string;
  winners: Array<string>;
}

export interface Client {
  /**
   * Construct and simulate a get_bounties transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bounties: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<u32>>>;

  /**
   * Construct and simulate a get_owner_bounties transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_owner_bounties: (
    { owner }: { owner: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Array<u32>>>;

  /**
   * Construct and simulate a get_owner_bounties_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_owner_bounties_count: (
    { owner }: { owner: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a get_bounties_by_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bounties_by_token: (
    { token }: { token: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Array<u32>>>;

  /**
   * Construct and simulate a get_bounties_by_token_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bounties_by_token_count: (
    { token }: { token: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a get_active_bounties transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_active_bounties: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<u32>>>;

  /**
   * Construct and simulate a get_bounties_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bounties_count: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a get_bounties_by_status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bounties_by_status: (
    { status }: { status: Status },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Array<u32>>>;

  /**
   * Construct and simulate a get_bounties_by_status_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bounties_by_status_count: (
    { status }: { status: Status },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a get_bounty transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bounty: (
    { bounty_id }: { bounty_id: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Result<Bounty>>>;

  /**
   * Construct and simulate a get_bounty_winners transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bounty_winners: (
    { bounty_id }: { bounty_id: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Result<Array<string>>>>;

  /**
   * Construct and simulate a get_bounty_status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bounty_status: (
    { bounty_id }: { bounty_id: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Result<Status>>>;

  /**
   * Construct and simulate a update_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  update_admin: (
    { new_admin }: { new_admin: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Result<string>>>;

  /**
   * Construct and simulate a update_fee_account transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  update_fee_account: (
    { new_fee_account }: { new_fee_account: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Result<string>>>;

  /**
   * Construct and simulate a create_bounty transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_bounty: (
    {
      owner,
      token,
      reward,
      distribution,
      submission_deadline,
      title,
    }: {
      owner: string;
      token: string;
      reward: i128;
      distribution: Array<readonly [u32, u32]>;
      submission_deadline: u64;
      title: string;
    },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Result<u32>>>;

  /**
   * Construct and simulate a update_bounty transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  update_bounty: (
    {
      owner,
      bounty_id,
      new_title,
      new_distribution,
      new_submission_deadline,
    }: {
      owner: string;
      bounty_id: u32;
      new_title: Option<string>;
      new_distribution: Array<readonly [u32, u32]>;
      new_submission_deadline: Option<u64>;
    },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Result<void>>>;

  /**
   * Construct and simulate a delete_bounty transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  delete_bounty: (
    { owner, bounty_id }: { owner: string; bounty_id: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Result<void>>>;

  /**
   * Construct and simulate a select_winners transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  select_winners: (
    {
      owner,
      bounty_id,
      winners,
    }: { owner: string; bounty_id: u32; winners: Array<string> },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    }
  ) => Promise<AssembledTransaction<Result<void>>>;
}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin, fee_account }: { admin: string; fee_account: string },
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, 'contractId'> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: 'hex' | 'base64';
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({ admin, fee_account }, options);
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([
        'AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADQAAAAAAAAAJT25seU93bmVyAAAAAAAAAQAAAAAAAAAOSW5hY3RpdmVCb3VudHkAAAAAAAIAAAAAAAAAFEJvdW50eURlYWRsaW5lUGFzc2VkAAAAAwAAAAAAAAAOQm91bnR5Tm90Rm91bmQAAAAAAAQAAAAAAAAAGERpc3RyaWJ1dGlvbk11c3RTdW1UbzEwMAAAAAUAAAAAAAAAFUludmFsaWREZWFkbGluZVVwZGF0ZQAAAAAAAAYAAAAAAAAADlRvb01hbnlXaW5uZXJzAAAAAAAHAAAAAAAAAAhOb3RBZG1pbgAAAAgAAAAAAAAAEUFkbWluQ2Fubm90QmVaZXJvAAAAAAAACQAAAAAAAAAWRmVlQWNjb3VudENhbm5vdEJlWmVybwAAAAAACgAAAAAAAAAOU2FtZUZlZUFjY291bnQAAAAAAAsAAAAAAAAADUludmFsaWRSZXdhcmQAAAAAAAAMAAAAAAAAAA1JbnRlcm5hbEVycm9yAAAAAAAADQ==',
        'AAAAAgAAAAAAAAAAAAAABlN0YXR1cwAAAAAAAwAAAAAAAAAAAAAABkFjdGl2ZQAAAAAAAAAAAAAAAAAISW5SZXZpZXcAAAAAAAAAAAAAAAlDb21wbGV0ZWQAAAA=',
        'AAAAAQAAAAAAAAAAAAAABkJvdW50eQAAAAAACAAAAAAAAAAMZGlzdHJpYnV0aW9uAAAD7AAAAAQAAAAEAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAABnJld2FyZAAAAAAACwAAAAAAAAAGc3RhdHVzAAAAAAfQAAAABlN0YXR1cwAAAAAAAAAAABNzdWJtaXNzaW9uX2RlYWRsaW5lAAAAAAYAAAAAAAAABXRpdGxlAAAAAAAAEAAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAd3aW5uZXJzAAAAA+oAAAAT',
        'AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAALZmVlX2FjY291bnQAAAAAEwAAAAA=',
        'AAAAAAAAAAAAAAAMZ2V0X2JvdW50aWVzAAAAAAAAAAEAAAPqAAAABA==',
        'AAAAAAAAAAAAAAASZ2V0X293bmVyX2JvdW50aWVzAAAAAAABAAAAAAAAAAVvd25lcgAAAAAAABMAAAABAAAD6gAAAAQ=',
        'AAAAAAAAAAAAAAAYZ2V0X293bmVyX2JvdW50aWVzX2NvdW50AAAAAQAAAAAAAAAFb3duZXIAAAAAAAATAAAAAQAAAAQ=',
        'AAAAAAAAAAAAAAAVZ2V0X2JvdW50aWVzX2J5X3Rva2VuAAAAAAAAAQAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAQAAA+oAAAAE',
        'AAAAAAAAAAAAAAAbZ2V0X2JvdW50aWVzX2J5X3Rva2VuX2NvdW50AAAAAAEAAAAAAAAABXRva2VuAAAAAAAAEwAAAAEAAAAE',
        'AAAAAAAAAAAAAAATZ2V0X2FjdGl2ZV9ib3VudGllcwAAAAAAAAAAAQAAA+oAAAAE',
        'AAAAAAAAAAAAAAASZ2V0X2JvdW50aWVzX2NvdW50AAAAAAAAAAAAAQAAAAQ=',
        'AAAAAAAAAAAAAAAWZ2V0X2JvdW50aWVzX2J5X3N0YXR1cwAAAAAAAQAAAAAAAAAGc3RhdHVzAAAAAAfQAAAABlN0YXR1cwAAAAAAAQAAA+oAAAAE',
        'AAAAAAAAAAAAAAAcZ2V0X2JvdW50aWVzX2J5X3N0YXR1c19jb3VudAAAAAEAAAAAAAAABnN0YXR1cwAAAAAH0AAAAAZTdGF0dXMAAAAAAAEAAAAE',
        'AAAAAAAAAAAAAAAKZ2V0X2JvdW50eQAAAAAAAQAAAAAAAAAJYm91bnR5X2lkAAAAAAAABAAAAAEAAAPpAAAH0AAAAAZCb3VudHkAAAAAAAM=',
        'AAAAAAAAAAAAAAASZ2V0X2JvdW50eV93aW5uZXJzAAAAAAABAAAAAAAAAAlib3VudHlfaWQAAAAAAAAEAAAAAQAAA+kAAAPqAAAAEwAAAAM=',
        'AAAAAAAAAAAAAAARZ2V0X2JvdW50eV9zdGF0dXMAAAAAAAABAAAAAAAAAAlib3VudHlfaWQAAAAAAAAEAAAAAQAAA+kAAAfQAAAABlN0YXR1cwAAAAAAAw==',
        'AAAAAAAAAAAAAAAMdXBkYXRlX2FkbWluAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAEAAAPpAAAAEwAAAAM=',
        'AAAAAAAAAAAAAAASdXBkYXRlX2ZlZV9hY2NvdW50AAAAAAABAAAAAAAAAA9uZXdfZmVlX2FjY291bnQAAAAAEwAAAAEAAAPpAAAAEwAAAAM=',
        'AAAAAAAAAAAAAAANY3JlYXRlX2JvdW50eQAAAAAAAAYAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAZyZXdhcmQAAAAAAAsAAAAAAAAADGRpc3RyaWJ1dGlvbgAAA+oAAAPtAAAAAgAAAAQAAAAEAAAAAAAAABNzdWJtaXNzaW9uX2RlYWRsaW5lAAAAAAYAAAAAAAAABXRpdGxlAAAAAAAAEAAAAAEAAAPpAAAABAAAAAM=',
        'AAAAAAAAAAAAAAANdXBkYXRlX2JvdW50eQAAAAAAAAUAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAJYm91bnR5X2lkAAAAAAAABAAAAAAAAAAJbmV3X3RpdGxlAAAAAAAD6AAAABAAAAAAAAAAEG5ld19kaXN0cmlidXRpb24AAAPqAAAD7QAAAAIAAAAEAAAABAAAAAAAAAAXbmV3X3N1Ym1pc3Npb25fZGVhZGxpbmUAAAAD6AAAAAYAAAABAAAD6QAAA+0AAAAAAAAAAw==',
        'AAAAAAAAAAAAAAANZGVsZXRlX2JvdW50eQAAAAAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAJYm91bnR5X2lkAAAAAAAABAAAAAEAAAPpAAAD7QAAAAAAAAAD',
        'AAAAAAAAAAAAAAAOc2VsZWN0X3dpbm5lcnMAAAAAAAMAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAJYm91bnR5X2lkAAAAAAAABAAAAAAAAAAHd2lubmVycwAAAAPqAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAAD',
      ]),
      options
    );
  }
  public readonly fromJSON = {
    get_bounties: this.txFromJSON<Array<u32>>,
    get_owner_bounties: this.txFromJSON<Array<u32>>,
    get_owner_bounties_count: this.txFromJSON<u32>,
    get_bounties_by_token: this.txFromJSON<Array<u32>>,
    get_bounties_by_token_count: this.txFromJSON<u32>,
    get_active_bounties: this.txFromJSON<Array<u32>>,
    get_bounties_count: this.txFromJSON<u32>,
    get_bounties_by_status: this.txFromJSON<Array<u32>>,
    get_bounties_by_status_count: this.txFromJSON<u32>,
    get_bounty: this.txFromJSON<Result<Bounty>>,
    get_bounty_winners: this.txFromJSON<Result<Array<string>>>,
    get_bounty_status: this.txFromJSON<Result<Status>>,
    update_admin: this.txFromJSON<Result<string>>,
    update_fee_account: this.txFromJSON<Result<string>>,
    create_bounty: this.txFromJSON<Result<u32>>,
    update_bounty: this.txFromJSON<Result<void>>,
    delete_bounty: this.txFromJSON<Result<void>>,
    select_winners: this.txFromJSON<Result<void>>,
  };
}
