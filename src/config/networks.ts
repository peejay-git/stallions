/**
 * Network configuration for Stallion client
 *
 * This file provides configuration for different Stellar networks (testnet, public, etc.)
 * and their associated token addresses.
 *
 * The active network is determined by the NEXT_PUBLIC_NETWORK environment variable or defaults to testnet.
 */

export interface TokenConfig {
  symbol: string;
  name: string;
  logo: string;
  address: string;
}

export interface NetworkConfig {
  id: string; // Unique identifier for the network
  name: string; // Human-readable name
  passphrase: string; // Network passphrase
  displayName: string; // Display name in UI
  explorerBaseUrl: string; // Base URL for the network's explorer
  sorobanRpcUrl: string; // Soroban RPC endpoint URL
  tokens: TokenConfig[]; // Supported tokens on this network
  isDefault?: boolean; // Whether this is the default network
}

// Define all supported networks
export const NETWORKS: NetworkConfig[] = [
  {
    id: 'testnet',
    name: 'TESTNET',
    passphrase: 'Test SDF Network ; September 2015',
    displayName: 'Testnet',
    explorerBaseUrl: 'https://testnet.stellar.expert',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
    isDefault: true,
    tokens: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: '/images/tokens/usdc.svg',
        address: 'CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5',
      },
      {
        symbol: 'XLM',
        name: 'Stellar Lumens',
        logo: '/images/tokens/xlm.svg',
        address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      },
    ],
  },
  {
    id: 'public',
    name: 'PUBLIC',
    passphrase: 'Public Global Stellar Network ; September 2015',
    displayName: 'Public',
    explorerBaseUrl: 'https://stellar.expert',
    sorobanRpcUrl: 'https://mainnet.sorobanrpc.com',
    tokens: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: '/images/tokens/usdc.svg',
        address: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
      },
      {
        symbol: 'XLM',
        name: 'Stellar Lumens',
        logo: '/images/tokens/xlm.svg',
        address: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
      },
      {
        symbol: 'NGNC',
        name: 'NGNC',
        logo: '/images/tokens/ngnc.svg',
        address: 'CBYFV4W2LTMXYZ3XWFX5BK2BY255DU2DSXNAE4FJ5A5VYUWGIBJDOIGG',
      },
      {
        symbol: 'KALE',
        name: 'KALE',
        logo: '/images/tokens/kale.svg',
        address: 'CB23WRDQWGSP6YPMY4UV5C4OW5CBTXKYN3XEATG7KJEZCXMJBYEHOUOV',
      },
      {
        symbol: 'USDGLO',
        name: 'Glo Dollar',
        logo: '/images/tokens/usdglo.svg',
        address: 'CB226ZOEYXTBPD3QEGABTJYSKZVBP2PASEISLG3SBMTN5CE4QZUVZ3CE',
      },
    ],
  },
];

// Get the default network configuration
export const getDefaultNetwork = (): NetworkConfig => {
  return NETWORKS.find((network) => network.isDefault) || NETWORKS[0];
};

// Get a network configuration by ID
export const getNetworkById = (id: string): NetworkConfig | undefined => {
  return NETWORKS.find((network) => network.id === id);
};

// Get token configuration by symbol for a specific network
export const getTokenBySymbol = (
  networkId: string,
  symbol: string
): TokenConfig | undefined => {
  const network = getNetworkById(networkId);
  if (!network) return undefined;

  return network.tokens.find((token) => token.symbol === symbol);
};

// Get token configuration by address for a specific network
export const getTokenByAddress = (
  networkId: string,
  address: string
): TokenConfig | undefined => {
  const network = getNetworkById(networkId);
  if (!network) return undefined;

  return network.tokens.find((token) => token.address === address);
};

// Get the current active network based on environment variable or default to testnet
export const getCurrentNetwork = (): NetworkConfig => {
  // Get network from environment variable if available
  const envNetwork =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_NETWORK
      : undefined;

  if (envNetwork) {
    const network = getNetworkById(envNetwork);
    if (network) {
      return network;
    }
    // If env network specified but not found, log a warning
    if (typeof window !== 'undefined') {
      console.warn(
        `Network '${envNetwork}' specified in NEXT_PUBLIC_NETWORK not found. Using default.`
      );
    }
  }

  // Default to the network marked as default, or first in the list
  return getDefaultNetwork();
};

// Export the network passphrase for the current network (for backward compatibility)
export const NETWORK = getCurrentNetwork().passphrase;
