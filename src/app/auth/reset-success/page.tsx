'use client';

import { PasswordInput } from '@/components';
import { auth } from '@/lib/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

export default function ResetSuccessPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const oobCode = searchParams?.get('oobCode');
  const mode = searchParams?.get('mode');

  useEffect(() => {
    console.log('Reset parameters:', { oobCode, mode });

    if (!oobCode) {
      setError(
        'Missing password reset code. Please use the link from your email.'
      );
      setIsLoading(false);
      return;
    }

    if (mode !== 'resetPassword') {
      console.log('Incorrect mode:', mode);
      setError('Invalid password reset link. Please request a new one.');
      setIsLoading(false);
      return;
    }

    // Verify the password reset code
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        console.log('Reset code verified for email:', email);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error verifying reset code:', error);
        setError(
          'This password reset link has expired or already been used. Please request a new one.'
        );
        setIsLoading(false);
      });
  }, [oobCode, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setPasswordError(null);

    // Validate passwords
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (!oobCode) {
      setError('Missing reset code');
      return;
    }

    setIsResetting(true);
    console.log(
      'Attempting to confirm password reset with code:',
      oobCode?.substring(0, 5) + '...'
    );

    try {
      // Complete the password reset
      await confirmPasswordReset(auth, oobCode, newPassword);
      console.log('Password reset confirmed successfully');
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 to-black">
        <div className="w-full max-w-md p-8 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
          <p className="text-white text-center mt-4">
            Verifying your reset link...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 to-black">
        <div className="w-full max-w-md p-8 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <div className="flex justify-center text-red-400">
            <FiAlertTriangle size={64} />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mt-6">
            Password Reset Failed
          </h1>
          <p className="text-gray-300 text-center mt-2">{error}</p>
          <div className="mt-8">
            <Link
              href="/"
              className="block w-full text-center py-3 px-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 to-black">
        <div className="w-full max-w-md p-8 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <div className="flex justify-center text-green-400">
            <FiCheckCircle size={64} />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mt-6">
            Password Reset Successful
          </h1>
          <p className="text-gray-300 text-center mt-2">
            Your password has been reset successfully.
          </p>
          <p className="text-gray-300 text-center mt-2">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 to-black">
      <div className="w-full max-w-md p-8 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
        <h1 className="text-2xl font-bold text-white text-center">
          Reset Your Password
        </h1>
        <p className="text-gray-300 text-center mt-2 mb-6">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              New Password
            </label>
            <PasswordInput
              name="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-4 py-2"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Confirm New Password
            </label>
            <PasswordInput
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-4 py-2"
              required
            />
            {passwordError && (
              <p className="text-red-400 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
            disabled={isResetting}
          >
            {isResetting ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
