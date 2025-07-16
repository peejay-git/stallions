import { BountyStatus, Submission } from '@/types/bounty';
import { useState } from 'react';
import { FiX } from 'react-icons/fi';

interface SubmissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  isOwner: boolean;
  isSponsor?: boolean;
  onAccept?: (submissionId: string) => void;
  onRank?: (submissionId: string, ranking: 1 | 2 | 3 | null) => void;
  rankingsApproved?: boolean;
  otherSubmissions?: Submission[];
}

export default function SubmissionDetailsModal({
  isOpen,
  onClose,
  submission,
  isOwner,
  isSponsor = false,
  onAccept,
  onRank,
  rankingsApproved = false,
  otherSubmissions = [],
}: SubmissionDetailsModalProps) {
  const [tab, setTab] = useState<'details' | 'link'>('details');

  if (!isOpen) return null;
  if (!submission) return null;

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if a specific ranking is already taken by another submission
  const isRankingTaken = (rank: number) => {
    return otherSubmissions.some(
      (sub) => sub.id !== submission.id && sub.ranking === rank
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case BountyStatus.IN_PROGRESS:
        return (
          <span className="px-3 py-1 bg-yellow-900/40 text-yellow-300 border border-yellow-700/30 rounded-full text-sm font-medium">
            In Progress
          </span>
        );
      case BountyStatus.REVIEW:
        return (
          <span className="px-3 py-1 bg-green-900/40 text-green-300 border border-green-700/30 rounded-full text-sm font-medium">
            Under Review
          </span>
        );
      case BountyStatus.COMPLETED:
        return (
          <span className="px-3 py-1 bg-red-900/40 text-red-300 border border-red-700/30 rounded-full text-sm font-medium">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  // Determine content to show
  const getContentToShow = () => {
    if (submission.content) return submission.content;
    return 'No content provided.';
  };

  // Get the applicant address to display
  const getApplicantAddress = () => {
    // Use walletAddress first if available, then applicant
    const address = submission.walletAddress || submission.applicant;
    if (!address) {
      console.error(
        'ERROR: No applicant address found in submission:',
        submission.id
      );
      return 'Unknown applicant';
    }
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-70 transition-opacity" />
      {/* Modal */}
      <div className="relative z-10 bg-[#262626] text-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
          <h2 className="text-xl font-semibold">Submission Details</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Applicant</p>
              <div className="flex items-center gap-2">
                <span className="text-white">
                  {submission.applicant.substring(0, 8)}...
                  {submission.applicant.substring(
                    submission.applicant.length - 8
                  )}
                </span>
                {submission.walletAddress && (
                  <span className="text-gray-400 bg-gray-700/40 px-2 py-0.5 rounded text-xs ml-2">
                    Wallet Connected
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Submitted</p>
              <span className="text-white">
                {formatDate(submission.created)}
              </span>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Status</p>
              <span className="text-white">
                {getStatusBadge(submission.status)}
              </span>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Ranking</p>
              <span className="text-white">
                {submission.ranking ? `${submission.ranking}st` : 'Not ranked'}
              </span>
            </div>
          </div>

          <div className="bg-[#262626] p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-2">Submission Content</h3>
            <div className="prose prose-invert max-w-none">
              {getContentToShow()}
            </div>
            {submission.link && (
              <div>
                <h3 className="text-blue-300 font-medium mb-2">Link</h3>
                <a
                  href={submission.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {submission.link}
                </a>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            {isOwner && submission.status === BountyStatus.REVIEW && (
              <button
                onClick={() => onAccept?.(submission.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Accept
              </button>
            )}

            {isOwner && submission.ranking && !rankingsApproved && (
              <button
                onClick={() => onRank?.(submission.id, null)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Clear Rank
              </button>
            )}

            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
