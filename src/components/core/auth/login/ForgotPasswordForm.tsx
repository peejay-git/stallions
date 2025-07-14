'use client';

import { FiMail } from 'react-icons/fi';
import React from 'react';

type Props = {
  email: string;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
};

export default function ForgotPasswordForm({
  email,
  isSubmitting,
  error,
  success,
  onChange,
  onSubmit,
  onBack,
}: Props) {
  return (
    <div>
      {error && (
        <div className="bg-red-900/20 text-red-300 border border-red-700/30 p-4 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 text-green-300 border border-green-700/30 p-4 rounded-lg mb-6 text-sm">
          Password reset email sent! Please check your inbox.
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiMail className="text-gray-500" />
            </div>
            <input
              type="email"
              name="resetEmail"
              value={email}
              onChange={onChange}
              placeholder="Enter your email address"
              className="input pl-10 w-full"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onBack}
            className="bg-white/5 hover:bg-white/10 text-white py-2 px-4 rounded transition duration-200 border border-white/10"
          >
            Back
          </button>
          <button
            type="submit"
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
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
