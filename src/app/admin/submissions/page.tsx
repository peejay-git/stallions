'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminProtectedRoute } from '@/hooks/useAdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { getAllSubmissions } from '@/lib/adminService';
import { FiSearch, FiFilter, FiEye, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Submission {
  id: string;
  bountyId: string;
  bountyTitle?: string;
  userId: string;
  content: string;
  submittedAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export default function AdminSubmissionsPage() {
  const { isAdmin, loading: authLoading } = useAdminProtectedRoute();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Fetch all submissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAllSubmissions();
        // Data is now properly typed from the service
        setSubmissions(data);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error('Failed to load submissions');
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter submissions based on search term and status filter
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = (submission.bountyTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
    return null;
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Manage Submissions</h1>
        <p className="text-gray-400">View and manage all bounty submissions on the platform</p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center mb-6 gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 border border-gray-700"
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="text-gray-400" />
          </div>
          <select
            className="bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 border border-gray-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">No submissions found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bounty</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Applicant</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Submitted</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      <Link href={`/bounties/${submission.bountyId}`} className="hover:underline">
                        {submission.bountyTitle || `Bounty #${submission.bountyId.slice(0, 8)}`}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {submission.userId.slice(0, 6)}...{submission.userId.slice(-4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          submission.status === 'PENDING' ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30' :
                          submission.status === 'ACCEPTED' ? 'bg-green-900/40 text-green-300 border border-green-700/30' :
                          'bg-red-900/40 text-red-300 border border-red-700/30'
                        }`}
                      >
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(submission.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="text-blue-400 hover:text-blue-300 mr-2"
                        title="View Details"
                      >
                        <FiEye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
              onClick={() => setSelectedSubmission(null)}
            ></div>

            <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="text-gray-400 bg-transparent hover:text-gray-200"
                  onClick={() => setSelectedSubmission(null)}
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg font-medium leading-6 text-white">
                    Submission Details
                  </h3>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400">Bounty</h4>
                      <Link 
                        href={`/bounties/${selectedSubmission.bountyId}`}
                        className="text-white hover:underline"
                      >
                        {selectedSubmission.bountyTitle || `Bounty #${selectedSubmission.bountyId.slice(0, 8)}`}
                      </Link>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-400">Applicant</h4>
                      <p className="text-white">
                        {selectedSubmission.userId.slice(0, 6)}...{selectedSubmission.userId.slice(-4)}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-400">Status</h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedSubmission.status === 'PENDING' ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30' :
                          selectedSubmission.status === 'ACCEPTED' ? 'bg-green-900/40 text-green-300 border border-green-700/30' :
                          'bg-red-900/40 text-red-300 border border-red-700/30'
                        }`}
                      >
                        {selectedSubmission.status}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-400">Submitted</h4>
                      <p className="text-white">{formatDate(selectedSubmission.submittedAt)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-400">Content</h4>
                      <div className="mt-2 bg-gray-900 rounded-md p-4 max-h-60 overflow-y-auto">
                        <p className="text-white whitespace-pre-wrap">
                          {selectedSubmission.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                <Link
                  href={`/bounties/${selectedSubmission.bountyId}`}
                  className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                >
                  View Bounty
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="inline-flex justify-center w-full px-4 py-2 mt-3 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md shadow-sm hover:bg-gray-600 sm:mt-0"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 