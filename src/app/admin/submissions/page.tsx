'use client';

import { AdminLayout, AdminProtectedRoute, LoadingSpinner } from '@/components';
import { useAdminProtectedRoute } from '@/hooks/useAdminProtectedRoute';
import { getAllSubmissions } from '@/lib/adminService';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Submission {
  id: string;
  bountyId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  bountyTitle: string;
  applicant: string;
  links: string;
  ranking: number | null;
}

export default function AdminSubmissionsPage() {
  const { isAdmin, loading: authLoading } = useAdminProtectedRoute();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAllSubmissions();
        setSubmissions(data);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    }

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter submissions based on search term and status filter
  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      (submission.bountyTitle || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (authLoading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="flex justify-center items-center min-h-screen">
            <LoadingSpinner />
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Submissions</h1>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>

          {submissions.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
              <p className="text-white/60">No submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-white/20">
                    <th className="pb-4 font-medium">Bounty</th>
                    <th className="pb-4 font-medium">Applicant</th>
                    <th className="pb-4 font-medium">Status</th>
                    <th className="pb-4 font-medium">Submitted</th>
                    <th className="pb-4 font-medium">Ranking</th>
                    <th className="pb-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-white/5">
                      <td className="py-4">
                        {submission.bountyTitle ||
                          `Bounty #${submission.bountyId}`}
                      </td>
                      <td className="py-4">{submission.applicant}</td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            submission.status === 'COMPLETED'
                              ? 'bg-green-900/40 text-green-300 border border-green-700/30'
                              : submission.status === 'PENDING'
                              ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30'
                              : 'bg-gray-900/40 text-gray-300 border border-gray-700/30'
                          }`}
                        >
                          {submission.status}
                        </span>
                      </td>
                      <td className="py-4">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">{submission.ranking || '-'}</td>
                      <td className="py-4">
                        <button
                          onClick={() =>
                            (window.location.href = `/bounties/${submission.bountyId}`)
                          }
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View Bounty
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
