'use client';

import { SponsorWalletPrompt, TalentWalletConnector } from '@/components';
import { assetSymbols } from '@/components/core/bounty/BountyCard';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useWallet } from '@/hooks/useWallet';
import { FirebaseBounty, getBountiesByOwner } from '@/lib/bounties';
import useAuthStore from '@/lib/stores/auth.store';
import { AuthState, SponsorProfile, TalentProfile } from '@/types/auth.types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BountyList } from '@/components/dashboard/BountyList';
import { SubmissionsList } from '@/components/dashboard/SubmissionsList';

export default function DashboardPage() {
  useProtectedRoute();
  const router = useRouter();
  const { isConnected, publicKey } = useWallet();
  const [bounty, setBounty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'created' | 'submissions'>(
    user?.role === 'sponsor' ? 'created' : 'submissions'
  );
  const fetchUser = useAuthStore(
    (state: AuthState) => state.fetchUserFromFirestore
  );
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  // Track totals by token
  const [totalSpentOrEarned, setTotalSpentOrEarned] = useState<
    Record<string, number>
  >({});

  // Determine if user is a sponsor or talent
  const isSponsor = user?.role === 'sponsor';
  const isTalent = user?.role === 'talent';

  // Fetch bounties
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.uid) return;

        setLoading(true);

        // Try to fetch bounties using both user.uid and publicKey
        let data: FirebaseBounty[] = [];

        // For sponsors, we need both user.uid and wallet
        if (isSponsor) {
          // Always fetch bounties by UID first
          const uidBounties = await getBountiesByOwner(user.uid);
          data = [...uidBounties];

          // If wallet is connected, also fetch by public key
          if (publicKey) {
            const keyBounties = await getBountiesByOwner(publicKey);
            // Add any bounties not already included
            keyBounties.forEach((bounty) => {
              if (!data.find((b) => b.id === bounty.id)) {
                data.push(bounty);
              }
            });
          }

          // Calculate total spent or earned per token
          const totalByToken = data.reduce((acc, bounty) => {
            const asset = bounty.reward?.asset || 'USDC';
            const bountyAmount = Number(bounty.reward?.amount || 0);

            // Initialize if the token doesn't exist yet in our accumulator
            if (!acc[asset]) {
              acc[asset] = 0;
            }

            // Add this bounty's amount to the token total
            acc[asset] += bountyAmount;
            return acc;
          }, {} as Record<string, number>);

          setTotalSpentOrEarned(totalByToken);
        } else {
          // For talents, we can fetch by user.uid
          const uidBounties = await getBountiesByOwner(user.uid);
          data = [...uidBounties];

          // Calculate total spent or earned per token
          const totalByToken = data.reduce((acc, bounty) => {
            const asset = bounty.reward?.asset || 'USDC';
            const bountyAmount = Number(bounty.reward?.amount || 0);

            // Initialize if the token doesn't exist yet in our accumulator
            if (!acc[asset]) {
              acc[asset] = 0;
            }

            // Add this bounty's amount to the token total
            acc[asset] += bountyAmount;
            return acc;
          }, {} as Record<string, number>);

          setTotalSpentOrEarned(totalByToken);
        }

        // Ensure each bounty has required fields
        const processedBounties = data.map((bounty) => ({
          ...bounty,
          title: bounty.title || 'Untitled Bounty',
          reward: bounty.reward || { amount: '0', asset: 'USDC' },
          status: bounty.status || 'OPEN',
          deadline: bounty.deadline || new Date().toISOString(),
        }));

        setBounty(processedBounties);
      } catch (err: any) {
        console.error('Error fetching bounties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid, publicKey, isSponsor]);

  // Fetch user submissions
  useEffect(() => {
    const fetchUserSubmissions = async () => {
      try {
        if (!user?.uid && !user?.wallet?.address) return;

        setLoadingSubmissions(true);

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (user?.uid) {
          queryParams.append('userId', user.uid);
        }
        if (user?.wallet?.address) {
          queryParams.append('walletAddress', user.wallet.address);
        }

        // Fetch submissions from API
        const response = await fetch(
          `/api/user/submissions?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }

        const data = await response.json();
        setUserSubmissions(data);
      } catch (err: any) {
        console.error('Error fetching user submissions:', err);
        setUserSubmissions([]);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    if (isConnected) {
      fetchUserSubmissions();
    }
  }, [user?.uid, user?.wallet?.address, isConnected]);

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleLogout = async () => {
    try {
      // Show a confirmation dialog
      const confirmLogout = window.confirm('Are you sure you want to log out?');

      // Only proceed with logout if user confirms
      if (confirmLogout) {
        useAuthStore.getState().logout();
        router.push('/');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Guard: Only render dashboard if user state is loaded
  if (user === undefined || user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Show wallet connection prompt for sponsors
  if (isSponsor && !isConnected && !user?.wallet) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">Dashboard</h1>
          <h1 className="text-2xl font-semibold text-white mb-8">
            Welcome{' '}
            {(user as SponsorProfile).profileData?.companyName ||
              (user as SponsorProfile).profileData?.firstName ||
              '...'}
          </h1>

          <SponsorWalletPrompt
            onSuccess={() => {
              // This will trigger a re-render and fetch bounties
              fetchUser();
            }}
          />
        </div>
      </div>
    );
  }

  // Show talent wallet connector for talents
  if (isTalent && !isConnected && (!user || !user.wallet)) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">Dashboard</h1>
          <h1 className="text-2xl font-semibold text-white">
            Welcome{' '}
            {(user as TalentProfile).profileData?.username ||
              (user as TalentProfile).profileData?.firstName ||
              '...'}
          </h1>

          <TalentWalletConnector
            onSuccess={() => {
              // This will trigger a re-render and fetch bounties
              fetchUser();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Welcome message and profile section */}
        <div className="mb-8 flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
              {(
                user as TalentProfile | SponsorProfile
              ).profileData?.firstName?.charAt(0) || '...'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-[#070708]"></div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Welcome{' '}
              {(user as TalentProfile | SponsorProfile).profileData
                ?.firstName || '...'}
            </h1>
            <p className="text-gray-400">
              {(user as TalentProfile | SponsorProfile).profileData?.username ||
                '...'}
            </p>
          </div>
        </div>

        {/* Dashboard card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Account Overview
                </h2>
                <p className="text-gray-300 truncate">
                  {user?.wallet?.address?.slice(0, 8)}...
                  {user?.wallet?.address?.slice(-8)}
                </p>
              </div>
              <div className="flex gap-3">
                {/* Only show Create Bounty button for sponsors */}
                {isSponsor && (
                  <Link
                    href="/bounties/create"
                    className="bg-white text-black font-medium py-2 px-4 rounded-lg hover:bg-white/90 transition-colors"
                  >
                    Create Bounty
                  </Link>
                )}
                <Link
                  href="/bounties"
                  className="bg-white/10 backdrop-blur-xl border border-white/20 text-white font-medium py-2 px-4 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Browse Bounties
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600/20 text-red-300 border border-red-500/40 font-medium py-2 px-4 rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-600">
            {/* Only show Bounties Created for sponsors */}
            {isSponsor && (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-300 text-sm mb-1">Bounties Created</p>
                <p className="text-2xl font-semibold text-white">
                  {bounty.length}
                </p>
              </div>
            )}

            {/* Only show Submissions Made for talents */}
            {isTalent && (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                    />
                  </svg>
                </div>
                <p className="text-gray-300 text-sm mb-1">Submissions Made</p>
                <p className="text-2xl font-semibold text-white">
                  {loadingSubmissions ? (
                    <span className="inline-block w-6 h-6 rounded-full border-2 border-green-300 border-t-transparent animate-spin"></span>
                  ) : (
                    userSubmissions.length
                  )}
                </p>
              </div>
            )}

            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              {/* Show different text based on user role */}
              <p className="text-gray-300 text-sm mb-1">
                {isSponsor ? 'Total Spent' : 'Total Earned'}
              </p>
              <div className="flex flex-col gap-2 text-2xl font-semibold text-white">
                {Object.keys(totalSpentOrEarned).length > 0 ? (
                  Object.entries(totalSpentOrEarned).map(
                    ([asset, amount], index) => {
                      const symbol = assetSymbols[asset] || '';
                      return (
                        <div key={asset} className={index > 0 ? 'mt-2' : ''}>
                          {symbol}
                          {amount.toFixed(2)} {asset}
                        </div>
                      );
                    }
                  )
                ) : (
                  <div>0.00 USDC</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content area with tabs and data tables */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden">
          {/* Tab navigation for bounties vs submissions */}
          <div className="flex border-b border-gray-600">
            {/* Only show Your Bounties tab for sponsors */}
            {isSponsor ? (
              <button
                className={`px-6 py-4 font-medium text-sm focus:outline-none transition-all duration-300 ${
                  activeTab === 'created'
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('created')}
              >
                Your Bounties
              </button>
            ) : (
              <button
                className={`px-6 py-4 font-medium text-sm focus:outline-none transition-all duration-300 ${
                  activeTab === 'submissions'
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('submissions')}
              >
                Your Submissions
              </button>
            )}
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'created' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">
                  Your Bounties
                </h3>

                <BountyList bounties={bounty} loading={loading} />
              </div>
            )}

            {activeTab === 'submissions' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">
                  Your Submissions
                </h3>

                <SubmissionsList
                  submissions={userSubmissions}
                  loading={loadingSubmissions}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
