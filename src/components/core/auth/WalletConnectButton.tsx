'use client';

import { useWallet } from '@/hooks/useWallet';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaWallet } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';

interface WalletConnectButtonProps {
  onAddressChange: (address: string) => void;
  currentAddress?: string;
  buttonClassName?: string;
}

const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  onAddressChange,
  currentAddress,
  buttonClassName = 'flex items-center justify-center gap-2 w-full p-3 border rounded-lg border-gray-300 bg-white font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
}) => {
  const { connect, isConnected, publicKey, isConnecting } = useWallet();
  
  useEffect(() => {
    if (isConnected && publicKey && !currentAddress) {
      onAddressChange(publicKey);
    }
  }, [isConnected, publicKey, onAddressChange, currentAddress]);

  const handleConnect = async () => {
    try {
      const address = await connect();
      if (address) {
        onAddressChange(address);
        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      toast.error('Failed to connect wallet. Please try again.');
      console.error('Wallet connection error:', error);
    }
  };

  // Truncate address for display
  const truncateAddress = (address: string) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  };

  if (isConnected && publicKey) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between p-3 border rounded-lg border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
          <div className="flex items-center gap-2">
            <FaWallet className="text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-600 dark:text-green-400">
              Connected: {truncateAddress(publicKey)}
            </span>
          </div>
          <a
            href={`https://stellar.expert/explorer/public/account/${publicKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
          >
            <FiExternalLink size={16} />
            <span className="text-xs">View</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      className={buttonClassName}
      disabled={isConnecting}
    >
      <FaWallet />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};

export default WalletConnectButton;
