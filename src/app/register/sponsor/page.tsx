'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/**
 * Redirect page - Registration is now handled through modals
 * This page redirects users to the homepage where they can register via the modal flow
 */
export default function SponsorRegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to homepage and show toast notification
    toast.success('Please register using the Register button in the navigation bar.', {
      duration: 5000,
    });
    router.replace('/');
  }, [router]);

  // Simple loading state shown briefly during redirect
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-primary mx-auto"></div>
        <h1 className="text-xl font-bold">Redirecting...</h1>
        <p className="text-gray-500 mt-2">
          Registration is now handled through the navigation bar.
        </p>
      </div>
    </div>
  );
}
