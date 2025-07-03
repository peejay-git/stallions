'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import { db } from '@/lib/firebase';
import { collection, getDocs } from '@/lib/firestore';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface DashboardStats {
  totalBounties: number;
  activeBounties: number;
  totalUsers: number;
  totalSubmissions: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get bounties count
        const bountiesSnapshot = await getDocs(collection(db, 'bounties'));
        const totalBounties = bountiesSnapshot.size;
        
        // Get active bounties count
        const activeBounties = bountiesSnapshot.docs.filter(
          doc => doc.data().status === 'OPEN'
        ).length;

        // Get users count
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;

        // Get submissions count
        const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
        const totalSubmissions = submissionsSnapshot.size;

        // Get recent activity
        const recentActivity = [
          {
            type: 'bounty',
            description: 'New bounty created',
            timestamp: new Date().toISOString()
          },
          // Add more activity items as needed
        ];

        setStats({
          totalBounties,
          activeBounties,
          totalUsers,
          totalSubmissions,
          recentActivity
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        {loading ? (
          <div className="flex justify-center items-center min-h-screen">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Refresh Stats
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stats Cards */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
                <h3 className="text-lg font-medium mb-2">Total Bounties</h3>
                <p className="text-3xl font-bold">{stats?.totalBounties || 0}</p>
              </div>
              
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
                <h3 className="text-lg font-medium mb-2">Active Bounties</h3>
                <p className="text-3xl font-bold">{stats?.activeBounties || 0}</p>
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
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-white/10">
                      <div>
                        <p className="text-sm text-white/80">{activity.description}</p>
                        <p className="text-xs text-white/60">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-white/5 rounded-full">{activity.type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white/60">No recent activity</div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button 
                onClick={() => window.location.href = '/admin/bounties'}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 text-left hover:bg-white/20 transition-colors"
              >
                <h3 className="text-lg font-medium mb-2">Manage Bounties</h3>
                <p className="text-sm text-white/60">Create, edit, and manage bounties</p>
              </button>

              <button 
                onClick={() => window.location.href = '/admin/users'}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 text-left hover:bg-white/20 transition-colors"
              >
                <h3 className="text-lg font-medium mb-2">Manage Users</h3>
                <p className="text-sm text-white/60">View and manage user accounts</p>
              </button>

              <button 
                onClick={() => window.location.href = '/admin/submissions'}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 text-left hover:bg-white/20 transition-colors"
              >
                <h3 className="text-lg font-medium mb-2">Review Submissions</h3>
                <p className="text-sm text-white/60">Review and manage bounty submissions</p>
              </button>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  );
} 