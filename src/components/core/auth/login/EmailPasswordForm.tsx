'use client';

import { PasswordInput } from '@/components/ui';
import { FiMail } from 'react-icons/fi';
import React, { useState } from 'react';

export type EmailPasswordFormData = {
  email: string;
  password: string;
};

export type EmailPasswordFieldErrors = {
  email: string;
  password: string;
};

type Props = {
  formData: EmailPasswordFormData;
  fieldErrors: EmailPasswordFieldErrors;
  formError: string | null;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onForgotPassword: () => void;
  onSwitchToRegister: () => void;
};

export default function EmailPasswordForm({
  formData,
  fieldErrors,
  formError,
  isSubmitting,
  onSubmit,
  onChange,
  onForgotPassword,
  onSwitchToRegister,
}: Props) {
  return (
    <div>
      {formError && (
        <div className="bg-red-900/20 text-red-300 border border-red-700/30 p-4 rounded-lg mb-6 text-sm">
          {formError}
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
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="Email Address"
              className="input pl-10 w-full"
              required
            />
          </div>
          {fieldErrors.email && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <PasswordInput
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={onChange}
            required
          />
          {fieldErrors.password && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.password}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-blue-400 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition duration-200 flex justify-center items-center"
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
            'Sign In'
          )}
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-400 hover:underline"
            >
              Register
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
