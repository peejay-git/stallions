'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminProtectedRoute } from '@/hooks/useAdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { getPlatformStats, getAllBounties } from '@/lib/adminService';
import { Bounty } from '@/types/bounty';
import { 
  FiUsers, 
  FiFileText, 
  FiCheckCircle, 
  FiLifeBuoy, 
  FiArrowRight,
  FiTrendingUp,
  FiActivity,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface PlatformStats {
  totalUsers: number;
  totalBounties: number;
  totalSubmissions: number;
  totalCompletedBounties: number;
}

export default function AdminDashboardPage() {
  const { isAdmin, loading: authLoading } = useAdminProtectedRoute();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentBounties, setRecentBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch platform stats
        const platformStats = await getPlatformStats();
        setStats(platformStats);
        
        // Fetch recent bounties
        const bounties = await getAllBounties();
        setRecentBounties(bounties.slice(0, 5)); // Only take the 5 most recent
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Create a skeleton loader for stats
  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 animate-pulse">
          <div className="w-10 h-10 bg-gray-700 rounded-full mb-4"></div>
          <div className="h-5 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );

  // Create a skeleton loader for recent bounties
  const BountiesSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="w-1/2 h-5 bg-gray-700 rounded mb-2"></div>
            <div className="w-20 h-5 bg-gray-700 rounded"></div>
          </div>
          <div className="h-4 bg-gray-700 rounded w-1/3 mt-4"></div>
        </div>
      ))}
    </div>
  );

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null; // Return null because the useAdminProtectedRoute hook will handle the redirect
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Welcome to your admin control panel. View and manage all platform activities.</p>
      </div>

      {/* Stats Overview */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-600/10 backdrop-blur-lg border border-blue-600/20 rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
              <FiUsers className="text-blue-400 text-xl" />
            </div>
            <h3 className="text-sm text-gray-400 mb-1">Total Users</h3>
            <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
          </div>

          <div className="bg-purple-600/10 backdrop-blur-lg border border-purple-600/20 rounded-xl p-6">
            <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
              <FiLifeBuoy className="text-purple-400 text-xl" />
            </div>
            <h3 className="text-sm text-gray-400 mb-1">Total Bounties</h3>
            <p className="text-3xl font-bold text-white">{stats?.totalBounties || 0}</p>
          </div>

          <div className="bg-green-600/10 backdrop-blur-lg border border-green-600/20 rounded-xl p-6">
            <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mb-4">
              <FiFileText className="text-green-400 text-xl" />
            </div>
            <h3 className="text-sm text-gray-400 mb-1">Total Submissions</h3>
            <p className="text-3xl font-bold text-white">{stats?.totalSubmissions || 0}</p>
          </div>

          <div className="bg-teal-600/10 backdrop-blur-lg border border-teal-600/20 rounded-xl p-6">
            <div className="w-12 h-12 bg-teal-600/20 rounded-full flex items-center justify-center mb-4">
              <FiCheckCircle className="text-teal-400 text-xl" />
            </div>
            <h3 className="text-sm text-gray-400 mb-1">Completed Bounties</h3>
            <p className="text-3xl font-bold text-white">{stats?.totalCompletedBounties || 0}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bounties Panel */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Recent Bounties</h2>
              <Link href="/admin/bounties" className="flex items-center text-sm text-blue-400 hover:text-blue-300">
                View all <FiArrowRight className="ml-1" />
              </Link>
            </div>
            <div className="p-6">
              {loading ? (
                <BountiesSkeleton />
              ) : recentBounties.length === 0 ? (
                <p className="text-gray-400">No bounties found.</p>
              ) : (
                <div className="space-y-4">
                  {recentBounties.map((bounty) => (
                    <div key={bounty.id} className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-white">{bounty.title}</h3>
                        <span 
                          className={`text-xs px-2 py-1 rounded-full ${
                            bounty.status === 'OPEN' ? 'bg-green-900/40 text-green-300 border border-green-700/30' :
                            bounty.status === 'IN_PROGRESS' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/30' :
                            bounty.status === 'COMPLETED' ? 'bg-gray-700/40 text-gray-300 border border-gray-600/30' :
                            'bg-red-900/40 text-red-300 border border-red-700/30'
                          }`}
                        >
                          {bounty.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        <p>Created: {formatDate(bounty.created)}</p>
                        <p>Reward: {bounty.reward.amount} {bounty.reward.asset}</p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Link 
                          href={`/admin/bounties/${bounty.id}`}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <Link href="/admin/bounties/create" className="flex items-center p-4 bg-gray-800/50 backdrop-blur-lg rounded-xl hover:bg-gray-800 transition-colors">
                <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center mr-4">
                  <FiLifeBuoy className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Create Bounty</h3>
                  <p className="text-sm text-gray-400">Create a new bounty for talents</p>
                </div>
              </Link>

              <Link href="/admin/users" className="flex items-center p-4 bg-gray-800/50 backdrop-blur-lg rounded-xl hover:bg-gray-800 transition-colors">
                <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center mr-4">
                  <FiUsers className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Manage Users</h3>
                  <p className="text-sm text-gray-400">View and manage user accounts</p>
                </div>
              </Link>

              <Link href="/admin/submissions" className="flex items-center p-4 bg-gray-800/50 backdrop-blur-lg rounded-xl hover:bg-gray-800 transition-colors">
                <div className="w-10 h-10 bg-green-600/20 rounded-full flex items-center justify-center mr-4">
                  <FiFileText className="text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Review Submissions</h3>
                  <p className="text-sm text-gray-400">Review pending submissions</p>
                </div>
              </Link>

              <Link href="/admin/analytics" className="flex items-center p-4 bg-gray-800/50 backdrop-blur-lg rounded-xl hover:bg-gray-800 transition-colors">
                <div className="w-10 h-10 bg-teal-600/20 rounded-full flex items-center justify-center mr-4">
                  <FiActivity className="text-teal-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Analytics</h3>
                  <p className="text-sm text-gray-400">Platform performance overview</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 