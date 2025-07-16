'use client';

import { assetSymbols } from '@/components/core/bounty/BountyCard';
import { BountyStatus } from '@/types/bounty';
import Link from 'next/link';
import { FirebaseBounty } from '@/lib/bounties';
import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface BountyListProps {
  bounties: FirebaseBounty[];
  loading: boolean;
}

export function BountyList({ bounties, loading }: BountyListProps) {
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'No date';
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      // Skeleton loader for bounties
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-4">
            <div className="w-1/4 h-5 bg-white/10 rounded" />
            <div className="w-1/4 h-5 bg-white/10 rounded" />
            <div className="w-1/4 h-5 bg-white/10 rounded" />
            <div className="w-1/4 h-5 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (bounties.length === 0) {
    return <p className="text-gray-300">You haven't created any bounties yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-600">
        <thead>
          <tr>
            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Title
            </th>
            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Reward
            </th>
            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Deadline
            </th>
            <th className="px-4 py-3 bg-black/20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-600">
          {bounties.map((bounty) => (
            <tr key={bounty.id}>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                {bounty.title}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    bounty.status?.toUpperCase() === BountyStatus.OPEN
                      ? 'bg-green-900/40 text-green-300 border border-green-700/30'
                      : bounty.status?.toUpperCase() === BountyStatus.IN_PROGRESS
                      ? 'bg-blue-900/40 text-blue-300 border border-blue-700/30'
                      : bounty.status?.toUpperCase() === BountyStatus.COMPLETED
                      ? 'bg-gray-700/40 text-gray-300 border border-gray-600/30'
                      : bounty.status?.toUpperCase() === BountyStatus.REVIEW
                      ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30'
                      : 'bg-red-900/40 text-red-300 border border-red-700/30'
                  }`}
                >
                  {bounty.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                {bounty.reward?.amount} {assetSymbols[bounty.reward?.asset] || bounty.reward?.asset}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                {bounty.deadline ? formatDate(bounty.deadline) : 'No deadline'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  href={`/bounties/${bounty.id}`}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
