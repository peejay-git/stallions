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
import AdminProtectedRoute from '@/components/AdminProtectedRoute';

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
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-2">Total Bounties</h3>
              <p className="text-3xl font-bold">{stats?.totalBounties || 0}</p>
            </div>
            
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-2">Active Bounties</h3>
              <p className="text-3xl font-bold">{stats?.totalCompletedBounties || 0}</p>
            </div>
            
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-2">Total Users</h3>
              <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
            
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-2">Total Submissions</h3>
              <p className="text-3xl font-bold">{stats?.totalSubmissions || 0}</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="text-gray-400">No recent activity</div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
} 