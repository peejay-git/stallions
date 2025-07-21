import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/contract';
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
        contractId: 'CDLUBYGHEWTTZPJGYI34MEHCJ7FVUVDXNGCJVEA4URV2JMXWY5VNGCLT',
    },
};
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
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin, fee_account }, 
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy({ admin, fee_account }, options);
    }
    constructor(options) {
        super(new ContractSpec([
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
        ]), options);
        this.options = options;
    }
    fromJSON = {
        get_bounties: (this.txFromJSON),
        get_owner_bounties: (this.txFromJSON),
        get_owner_bounties_count: (this.txFromJSON),
        get_bounties_by_token: (this.txFromJSON),
        get_bounties_by_token_count: (this.txFromJSON),
        get_active_bounties: (this.txFromJSON),
        get_bounties_count: (this.txFromJSON),
        get_bounties_by_status: (this.txFromJSON),
        get_bounties_by_status_count: (this.txFromJSON),
        get_bounty: (this.txFromJSON),
        get_bounty_winners: (this.txFromJSON),
        get_bounty_status: (this.txFromJSON),
        update_admin: (this.txFromJSON),
        update_fee_account: (this.txFromJSON),
        create_bounty: (this.txFromJSON),
        update_bounty: (this.txFromJSON),
        delete_bounty: (this.txFromJSON),
        select_winners: (this.txFromJSON),
    };
}
