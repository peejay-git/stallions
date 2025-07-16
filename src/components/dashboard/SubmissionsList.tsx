'use client';

import { assetSymbols } from '@/components/core/bounty/BountyCard';
import Link from 'next/link';
import React from 'react';
import { formatDistanceToNow } from 'date-fns';

// Type definitions
interface Bounty {
  id: string;
  title: string;
  status: string;
  reward: {
    amount: string;
    asset: string;
  };
  deadline?: string;
}

interface Submission {
  id: string;
  bountyId: string;
  bountyTitle?: string;
  status: string;
  createdAt: string;
  submitted: string;
  link?: string;
  // New field from API that contains the full bounty details
  bounty?: Bounty | null;
}

interface SubmissionsListProps {
  submissions: Submission[];
  loading: boolean;
}

export function SubmissionsList({ submissions, loading }: SubmissionsListProps) {
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
      // Skeleton loader for submissions
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

  if (submissions.length === 0) {
    return <p className="text-gray-300">You haven't submitted any work yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-600">
        <thead>
          <tr>
            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Bounty
            </th>
            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Reward
            </th>
            <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Submitted
            </th>
            <th className="px-4 py-3 bg-black/20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-600">
          {submissions.map((submission) => {
            // Get title from either submission.bountyTitle, submission.bounty?.title, or "Unknown Bounty"
            const bountyTitle = submission.bountyTitle || 
                              (submission.bounty?.title) || 
                              "Unknown Bounty";
                              
            // Get reward details from bounty if available
            const rewardAmount = submission.bounty?.reward?.amount || "-";
            const rewardAsset = submission.bounty?.reward?.asset || "USDC";
            const rewardSymbol = assetSymbols[rewardAsset] || rewardAsset;
            
            return (
              <tr key={submission.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {bountyTitle}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      submission.status === 'PENDING'
                        ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30'
                        : submission.status === 'ACCEPTED'
                        ? 'bg-green-900/40 text-green-300 border border-green-700/30'
                        : 'bg-red-900/40 text-red-300 border border-red-700/30'
                    }`}
                  >
                    {submission.status}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                  {rewardAmount} {rewardSymbol}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                  {formatDate(submission.submitted || submission.createdAt)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/bounties/${submission.bountyId}`}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    View Bounty
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
