'use client';

import { useAdminProtectedRoute } from '@/hooks/useAdminProtectedRoute';
import { getAllUsers, makeUserAdmin } from '@/lib/adminService';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheck, FiSearch, FiShield } from 'react-icons/fi';

interface User {
  id: string;
  email: string;
  role: string;
  profileData: {
    firstName?: string;
    lastName?: string;
    username?: string;
    [key: string]: any;
  };
  createdAt: string;
  lastLogin: string;
}

export default function AdminUsersPage() {
  const { isAdmin, loading: authLoading } = useAdminProtectedRoute();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  // Fetch all users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAllUsers();
        setUsers(data as User[]);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle making a user an admin
  const handleMakeAdmin = async (userId: string) => {
    try {
      setProcessingUser(userId);
      await makeUserAdmin(userId);

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: 'admin' } : user
        )
      );

      toast.success('User has been made an admin');
    } catch (error) {
      console.error('Error making user admin:', error);
      toast.error('Failed to update user role');
    } finally {
      setProcessingUser(null);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchString = (
      (user.profileData?.firstName || '') +
      (user.profileData?.lastName || '') +
      (user.profileData?.username || '') +
      user.email +
      user.role
    ).toLowerCase();

    return searchString.includes(searchTerm.toLowerCase());
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Manage Users</h1>
        <p className="text-gray-400">
          View and manage user accounts on the platform
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          className="bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 border border-gray-700"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">
              No users found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    Joined
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    Last Login
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                          {user.profileData?.firstName?.[0] ||
                            user.email[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.profileData?.firstName}{' '}
                            {user.profileData?.lastName}
                          </div>
                          <div className="text-sm text-gray-400">
                            @{user.profileData?.username || 'unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-900/40 text-purple-300 border border-purple-700/30'
                            : user.role === 'sponsor'
                            ? 'bg-blue-900/40 text-blue-300 border border-blue-700/30'
                            : 'bg-green-900/40 text-green-300 border border-green-700/30'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleMakeAdmin(user.id)}
                          disabled={processingUser === user.id}
                          className={`text-purple-400 hover:text-purple-300 flex items-center gap-1 ml-auto ${
                            processingUser === user.id
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          title="Make Admin"
                        >
                          {processingUser === user.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                              Processing
                            </>
                          ) : (
                            <>
                              <FiShield size={18} />
                              Make Admin
                            </>
                          )}
                        </button>
                      )}
                      {user.role === 'admin' && (
                        <span className="text-purple-400 flex items-center gap-1 ml-auto">
                          <FiCheck size={18} />
                          Admin
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
