'use client';

import React from 'react';
import { FiMail } from 'react-icons/fi';
import { SiBlockchaindotcom } from 'react-icons/si';

export type WalletLoginFormData = {
  email: string;
};

export type WalletLoginFieldErrors = {
  email: string;
};

type Props = {
  isConnected: boolean;
  publicKey: string | null;
  email: string;
  isSubmitting: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onWalletConnect: () => void;
  onWalletLogin: () => void;
  onBack: () => void;
  emailError?: string;
};

export default function WalletLoginForm({
  isConnected,
  publicKey,
  email,
  isSubmitting,
  onEmailChange,
  onWalletConnect,
  onWalletLogin,
  onBack,
  emailError,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 mb-4">
        <p className="text-sm text-center">
          {isConnected
            ? `Wallet Connected: ${publicKey?.slice(0, 6)}...${publicKey?.slice(
                -4
              )}`
            : 'Connect your wallet to continue'}
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiMail className="text-gray-500" />
        </div>
        <input
          type="email"
          name="email"
          value={email}
          onChange={onEmailChange}
          placeholder="Enter your email"
          className="input pl-10 w-full"
          required
        />
      </div>
      {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onBack}
          className="bg-white/5 hover:bg-white/10 text-white py-2 px-4 rounded transition duration-200 border border-white/10"
        >
          Back
        </button>

        {isConnected ? (
          <button
            type="button"
            onClick={onWalletLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition duration-200 flex justify-center items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing In...
              </>
            ) : (
              <>
                <SiBlockchaindotcom className="mr-2" />
                Login
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onWalletConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition duration-200 flex justify-center items-center"
          >
            <SiBlockchaindotcom className="mr-2" />
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}
