'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminProtectedRoute } from '@/hooks/useAdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { getAllBounties, deleteBounty, updateBountyStatus } from '@/lib/adminService';
import { Bounty, BountyStatus } from '@/types/bounty';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiSearch,
  FiCheck,
  FiX,
  FiEye,
  FiFilter
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminBountiesPage() {
  const { isAdmin, loading: authLoading } = useAdminProtectedRoute();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Fetch all bounties
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAllBounties();
        setBounties(data);
      } catch (error) {
        console.error('Error fetching bounties:', error);
        toast.error('Failed to load bounties');
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

  // Handle bounty deletion
  const handleDelete = async (bountyId: number | string) => {
    const bountyIdStr = typeof bountyId === 'number' ? bountyId.toString() : bountyId;
    const bountyIdNum = typeof bountyId === 'string' ? Number(bountyId) : bountyId;
    
    try {
      await deleteBounty(bountyIdStr);
      setBounties(bounties.filter(bounty => bounty.id !== bountyIdNum));
      toast.success('Bounty deleted successfully');
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting bounty:', error);
      toast.error('Failed to delete bounty');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (bountyId: number | string, newStatus: string) => {
    const bountyIdStr = typeof bountyId === 'number' ? bountyId.toString() : bountyId;
    const bountyIdNum = typeof bountyId === 'string' ? Number(bountyId) : bountyId;

    try {
      await updateBountyStatus(bountyIdStr, newStatus);
      
      // Update the local state
      setBounties(bounties.map(bounty => 
        bounty.id === bountyIdNum
          ? { ...bounty, status: newStatus as BountyStatus } 
          : bounty
      ));
      
      toast.success(`Bounty status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating bounty status:', error);
      toast.error('Failed to update bounty status');
    }
  };

  // Filter bounties based on search term and status filter
  const filteredBounties = bounties.filter(bounty => {
    const matchesSearch = bounty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bounty.owner.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || bounty.status === statusFilter;
    
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
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Manage Bounties</h1>
          <p className="text-gray-400">View, edit and manage all bounties on the platform</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link 
            href="/admin/bounties/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FiPlus className="mr-2" /> Create Bounty
          </Link>
        </div>
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
            placeholder="Search bounties..."
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
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Under Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bounties Table */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading bounties...</p>
          </div>
        ) : filteredBounties.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">No bounties found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reward</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Owner</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredBounties.map((bounty) => (
                  <tr key={bounty.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {bounty.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            bounty.status === 'OPEN' ? 'bg-green-900/40 text-green-300 border border-green-700/30' :
                            bounty.status === 'IN_PROGRESS' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/30' :
                            bounty.status === 'COMPLETED' ? 'bg-gray-700/40 text-gray-300 border border-gray-600/30' :
                            bounty.status === 'REVIEW' ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30' :
                            'bg-red-900/40 text-red-300 border border-red-700/30'
                          }`}
                        >
                          {bounty.status}
                        </span>
                        <div className="ml-2">
                          <select
                            className="text-xs bg-gray-800 text-white rounded border border-gray-700 py-1 px-1"
                            value={bounty.status}
                            onChange={(e) => handleStatusUpdate(bounty.id, e.target.value as BountyStatus)}
                          >
                            <option value={BountyStatus.OPEN}>Open</option>
                            <option value={BountyStatus.IN_PROGRESS}>In Progress</option>
                            <option value={BountyStatus.REVIEW}>Review</option>
                            <option value={BountyStatus.COMPLETED}>Completed</option>
                            <option value={BountyStatus.CANCELLED}>Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {bounty.reward.amount} {bounty.reward.asset}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(bounty.created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {bounty.owner.slice(0, 6)}...{bounty.owner.slice(-4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/bounties/${bounty.id}`}
                          className="text-gray-400 hover:text-white"
                          title="View"
                        >
                          <FiEye size={18} />
                        </Link>
                        <Link
                          href={`/admin/bounties/${bounty.id}/edit`}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit"
                        >
                          <FiEdit size={18} />
                        </Link>
                        {confirmDelete === bounty.id.toString() ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleDelete(bounty.id)}
                              className="text-green-400 hover:text-green-300"
                              title="Confirm Delete"
                            >
                              <FiCheck size={18} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-red-400 hover:text-red-300"
                              title="Cancel"
                            >
                              <FiX size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(bounty.id.toString())}
                            className="text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 