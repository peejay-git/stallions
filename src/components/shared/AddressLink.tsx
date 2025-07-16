'use client';

import { getNetworkById } from '@/config/networks';
import React from 'react';
import { FiExternalLink } from 'react-icons/fi';

interface AddressLinkProps {
  address: string;
  className?: string;
  showExternalIcon?: boolean;
  truncateLength?: number;
  network?: 'public' | 'testnet';
}

/**
 * AddressLink component displays a formatted Stellar address with a link to Stellar Expert explorer
 *
 * @param address - The Stellar address to display and link to
 * @param className - Optional additional CSS classes
 * @param showExternalIcon - Whether to show an external link icon (default: true)
 * @param truncateLength - Number of characters to show at beginning and end (default: 6)
 * @param network - Stellar network to use: 'public' or 'testnet' (default: 'public')
 */
const AddressLink: React.FC<AddressLinkProps> = ({
  address,
  className = '',
  showExternalIcon = true,
  truncateLength = 6,
  network = 'public',
}) => {
  if (!address) return <span className={className}>Unknown</span>;

  // Format the address for display (e.g., GDUA...5XB7)
  const formattedAddress =
    address.length > truncateLength * 2
      ? `${address.slice(0, truncateLength)}...${address.slice(
          -truncateLength
        )}`
      : address;

  const explorerBaseUrl = getNetworkById(network)?.explorerBaseUrl;

  return (
    <a
      href={`${explorerBaseUrl}/account/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center hover:text-blue-400 transition-colors ${className}`}
      title={address}
    >
      {formattedAddress}
      {showExternalIcon && <FiExternalLink className="ml-1 h-3 w-3" />}
    </a>
  );
};

export default AddressLink;
