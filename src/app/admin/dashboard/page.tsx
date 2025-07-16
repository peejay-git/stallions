'use client';

import { LoadingSpinner } from '@/components';
import { useAdminProtectedRoute } from '@/hooks/useAdminProtectedRoute';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore/lite';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalBounties: number;
  activeBounties: number;
  totalUsers: number;
  totalSubmissions: number;
}

interface RecentBounty {
  id: string;
  title: string;
  status: string;
  reward: {
    amount: string;
    asset: string;
  };
  createdAt: string;
}

interface RecentSubmission {
  id: string;
  bountyId: string;
  bountyTitle: string;
  applicant: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  useAdminProtectedRoute();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBounties, setRecentBounties] = useState<RecentBounty[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<
    RecentSubmission[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get bounties count and recent bounties
        const bountiesRef = collection(db, 'bounties');
        const bountiesSnapshot = await getDocs(bountiesRef);
        const totalBounties = bountiesSnapshot.size;

        // Get active bounties count
        const activeBounties = bountiesSnapshot.docs.filter(
          (doc) => doc.data().status === 'OPEN'
        ).length;

        // Get recent bounties
        const recentBountiesQuery = query(
          bountiesRef,
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentBountiesSnapshot = await getDocs(recentBountiesQuery);
        const recentBountiesData = recentBountiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt || new Date().toISOString(),
        })) as RecentBounty[];

        // Get users count
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const totalUsers = usersSnapshot.size;

        // Get submissions count and recent submissions
        const submissionsRef = collection(db, 'submissions');
        const submissionsSnapshot = await getDocs(submissionsRef);
        const totalSubmissions = submissionsSnapshot.size;

        // Get recent submissions
        const recentSubmissionsQuery = query(
          submissionsRef,
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSubmissionsSnapshot = await getDocs(recentSubmissionsQuery);
        const recentSubmissionsData = recentSubmissionsSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt || new Date().toISOString(),
          })
        ) as RecentSubmission[];

        setStats({
          totalBounties,
          activeBounties,
          totalUsers,
          totalSubmissions,
        });

        setRecentBounties(recentBountiesData);
        setRecentSubmissions(recentSubmissionsData);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return loading ? (
    <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner />
    </div>
  ) : (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-white/60">
            Manage bounties, users, and submissions
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/create"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Bounty
          </Link>
          <button
            onClick={() => router.refresh()}
            className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white/80">
              Total Bounties
            </h3>
            <span className="p-2 bg-blue-500/30 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold mt-4">{stats?.totalBounties || 0}</p>
          <Link
            href="/admin/bounties"
            className="mt-4 inline-flex items-center text-sm text-blue-400 hover:text-blue-300"
          >
            View All
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white/80">
              Active Bounties
            </h3>
            <span className="p-2 bg-green-500/30 rounded-lg">
              <svg
                className="w-6 h-6 text-green-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold mt-4">
            {stats?.activeBounties || 0}
          </p>
          <Link
            href="/admin/bounties?status=active"
            className="mt-4 inline-flex items-center text-sm text-green-400 hover:text-green-300"
          >
            View Active
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white/80">Total Users</h3>
            <span className="p-2 bg-purple-500/30 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold mt-4">{stats?.totalUsers || 0}</p>
          <Link
            href="/admin/users"
            className="mt-4 inline-flex items-center text-sm text-purple-400 hover:text-purple-300"
          >
            Manage Users
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white/80">
              Total Submissions
            </h3>
            <span className="p-2 bg-orange-500/30 rounded-lg">
              <svg
                className="w-6 h-6 text-orange-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold mt-4">
            {stats?.totalSubmissions || 0}
          </p>
          <Link
            href="/admin/submissions"
            className="mt-4 inline-flex items-center text-sm text-orange-400 hover:text-orange-300"
          >
            View Submissions
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bounties */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Bounties</h2>
            <Link
              href="/admin/bounties"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
            >
              View All
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
          {recentBounties.length > 0 ? (
            <div className="space-y-4">
              {recentBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div>
                    <Link
                      href={`/bounties/${bounty.id}`}
                      className="font-medium hover:text-blue-400 transition-colors"
                    >
                      {bounty.title}
                    </Link>
                    <p className="text-sm text-white/60 mt-1">
                      {bounty.reward.amount} {bounty.reward.asset}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      bounty.status === 'OPEN'
                        ? 'bg-green-900/40 text-green-300 border border-green-700/30'
                        : bounty.status === 'COMPLETED'
                        ? 'bg-blue-900/40 text-blue-300 border border-blue-700/30'
                        : 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30'
                    }`}
                  >
                    {bounty.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/60">
              <p>No bounties found</p>
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Submissions</h2>
            <Link
              href="/admin/submissions"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
            >
              View All
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
          {recentSubmissions.length > 0 ? (
            <div className="space-y-4">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div>
                    <Link
                      href={`/bounties/${submission.bountyId}`}
                      className="font-medium hover:text-blue-400 transition-colors"
                    >
                      {submission.bountyTitle ||
                        `Bounty #${submission.bountyId}`}
                    </Link>
                    <p className="text-sm text-white/60 mt-1">
                      by {submission.applicant}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      submission.status === 'COMPLETED'
                        ? 'bg-green-900/40 text-green-300 border border-green-700/30'
                        : submission.status === 'PENDING'
                        ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30'
                        : 'bg-gray-900/40 text-gray-300 border border-gray-700/30'
                    }`}
                  >
                    {submission.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/60">
              <p>No submissions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/create"
          className="group backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 rounded-xl p-6 text-left hover:bg-white/10 transition-all"
        >
          <div className="flex items-center mb-4">
            <span className="p-2 bg-blue-500/30 rounded-lg group-hover:bg-blue-500/40 transition-colors">
              <svg
                className="w-6 h-6 text-blue-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </span>
          </div>
          <h3 className="text-lg font-medium mb-2">Create New Bounty</h3>
          <p className="text-sm text-white/60">
            Create and publish a new bounty for the community
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="group backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/20 rounded-xl p-6 text-left hover:bg-white/10 transition-all"
        >
          <div className="flex items-center mb-4">
            <span className="p-2 bg-purple-500/30 rounded-lg group-hover:bg-purple-500/40 transition-colors">
              <svg
                className="w-6 h-6 text-purple-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </span>
          </div>
          <h3 className="text-lg font-medium mb-2">Manage Users</h3>
          <p className="text-sm text-white/60">
            View and manage user accounts and permissions
          </p>
        </Link>

        <Link
          href="/admin/submissions"
          className="group backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-white/20 rounded-xl p-6 text-left hover:bg-white/10 transition-all"
        >
          <div className="flex items-center mb-4">
            <span className="p-2 bg-orange-500/30 rounded-lg group-hover:bg-orange-500/40 transition-colors">
              <svg
                className="w-6 h-6 text-orange-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </span>
          </div>
          <h3 className="text-lg font-medium mb-2">Review Submissions</h3>
          <p className="text-sm text-white/60">
            Review and manage bounty submissions
          </p>
        </Link>
      </div>
    </div>
  );
}
