'use client';

import { getCurrentNetwork } from '@/config/networks';

/**
 * Token constants file that re-exports from centralized network configuration
 * This provides backward compatibility for code that imports from here
 * while ensuring tokens come from our centralized network config
 */

// Default token (first token in the current network)
export const DEFAULT_TOKEN = {
  symbol: getCurrentNetwork().tokens[0].symbol,
  address: getCurrentNetwork().tokens[0].address,
};

// XLM token
export const XLM_TOKEN = getCurrentNetwork().tokens.find(t => t.symbol === 'XLM') || {
  symbol: 'XLM',
  address: getCurrentNetwork().tokens.find(t => t.symbol === 'XLM')?.address || '',
};

// USDC token
export const USDC_TOKEN = getCurrentNetwork().tokens.find(t => t.symbol === 'USDC') || {
  symbol: 'USDC',
  address: getCurrentNetwork().tokens.find(t => t.symbol === 'USDC')?.address || '',
};

// Get all supported tokens for the current network
export const SUPPORTED_TOKENS = getCurrentNetwork().tokens;

// Export network information
export const CURRENT_NETWORK = {
  name: getCurrentNetwork().name,
  displayName: getCurrentNetwork().displayName,
  passphrase: getCurrentNetwork().passphrase,
  id: getCurrentNetwork().id,
};

export default SUPPORTED_TOKENS;
