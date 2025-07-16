'use client';

import { Bounty } from '@/types/bounty';
import { SubmissionData } from '@/types/submission';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiAward, FiClock, FiDollarSign, FiTag, FiUser } from 'react-icons/fi';

export default function BountyWinnersPage() {
  const [completedBounties, setCompletedBounties] = useState<Bounty[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCompletedBounties = async () => {
      try {
        // Fetch completed bounties
        const response = await fetch('/api/bounties?status=COMPLETED');

        if (!response.ok) {
          throw new Error('Failed to fetch completed bounties');
        }

        const data = await response.json();
        setCompletedBounties(data);

        // Fetch submissions for these bounties
        const allSubmissions: SubmissionData[] = [];
        for (const bounty of data) {
          const submissionsResponse = await fetch(
            `/api/bounties/${bounty.id}/submissions`
          );
          if (submissionsResponse.ok) {
            const submissionsData = await submissionsResponse.json();
            allSubmissions.push(...submissionsData);
          }
        }
        setSubmissions(allSubmissions);
      } catch (err) {
        console.error('Error fetching completed bounties:', err);
        setError('Failed to load completed bounties');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedBounties();
  }, []);

  // Extract winners from completed bounties based on distribution data
  const extractWinners = (bounty: Bounty, allSubmissions: SubmissionData[]): SubmissionData[] => {
    if (!bounty.distribution || !Array.isArray(bounty.distribution)) {
      console.error('Missing distribution data for bounty:', bounty.id);
      return [];
    }

    return bounty.distribution.map((dist) => {
      // For each position in the distribution, create a SubmissionData object
      // Try to match with existing submission data if possible based on bountyId
      const matchingSubmission = allSubmissions.find(
        (s) => s.bountyId === bounty.id.toString()
      );
      
      // Common winner data regardless if we find a submission or not
      const winnerData = {
        id: matchingSubmission?.id || `winner-${bounty.id}-${dist.position}`,
        bountyId: bounty.id.toString(),
        applicantAddress: matchingSubmission?.applicantAddress || `Winner ${dist.position}`,
        userId: matchingSubmission?.userId || null,
        link: matchingSubmission?.link || '',
        status: matchingSubmission?.status || 'ACCEPTED',
        // Add additional properties for UI display that aren't in the SubmissionData type
        position: dist.position,
        percentage: dist.percentage,
        amount: calculateRewardAmount(bounty.reward.amount, dist.percentage),
      };
      
      return winnerData as SubmissionData;
    });
  };

  const calculateRewardAmount = (
    totalAmount: string,
    percentage: number
  ): string => {
    const total = parseFloat(totalAmount);
    return ((total * percentage) / 100).toString();
  };

  const allWinners = completedBounties.flatMap((bounty) =>
    extractWinners(bounty, submissions)
  );

  const positionToMedal = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${position}th`;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Bounty Winners</h1>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Bounty Winners</h1>
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-6">
          <p className="text-red-300">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Bounty Winners</h1>

      {completedBounties.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-8 text-center">
          <p className="text-gray-300 text-lg">No completed bounties found.</p>
          <Link
            href="/bounties"
            className="mt-4 inline-block bg-white text-black py-2 px-4 rounded-lg hover:bg-white/90 transition-colors"
          >
            Browse Active Bounties
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {completedBounties.map((bounty) => (
            <div
              key={bounty.id}
              className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl overflow-hidden"
            >
              <div className="bg-white/10 p-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  <Link
                    href={`/bounties/${bounty.id}`}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {bounty.title}
                  </Link>
                </h2>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full flex items-center gap-1">
                    <FiClock className="flex-shrink-0" />
                    <span>Completed</span>
                  </span>
                  <span className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full flex items-center gap-1">
                    <FiTag className="flex-shrink-0" />
                    <span>{bounty.category}</span>
                  </span>
                  <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full flex items-center gap-1">
                    <FiDollarSign className="flex-shrink-0" />
                    <span>
                      {bounty.reward.amount} {bounty.reward.asset}
                    </span>
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FiAward className="text-yellow-400" />
                  Winners
                </h3>

                <div className="space-y-4">
                  {bounty.distribution.map((dist) => {
                    // In a real implementation, you would map this to the actual winners
                    // For now, we'll just display the positions and distributions
                    return (
                      <div
                        key={dist.position}
                        className="flex items-center gap-4 bg-white/5 p-4 rounded-lg"
                      >
                        <div className="text-3xl">
                          {positionToMedal(dist.position)}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">
                              {dist.position === 1
                                ? '1st Place'
                                : dist.position === 2
                                ? '2nd Place'
                                : dist.position === 3
                                ? '3rd Place'
                                : `${dist.position}th Place`}
                            </span>
                            <span className="text-gray-300 text-sm">
                              {dist.percentage}% of reward
                            </span>
                          </div>
                          <div className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                            <FiUser className="flex-shrink-0" />
                            <span>
                              Winner Address:{' '}
                              {`winner_${dist.position}_address`.substring(
                                0,
                                8
                              )}
                              ...
                            </span>
                          </div>
                          <div className="mt-2 text-green-400 font-medium">
                            {calculateRewardAmount(
                              bounty.reward.amount,
                              dist.percentage
                            )}{' '}
                            {bounty.reward.asset}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-white/10 p-4 flex justify-end">
                <Link
                  href={`/bounties/${bounty.id}`}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  View Bounty Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
