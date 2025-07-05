import { useState } from 'react';
import { FiAward, FiCheck, FiExternalLink, FiX } from 'react-icons/fi';

interface SubmissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: {
    id: string;
    applicant: string;
    content: string;
    links?: string;
    created: string;
    status: string;
    ranking?: number | null;
    details?: string;
    walletAddress?: string;
  };
  isOwner: boolean;
  isSponsor?: boolean;
  onAccept?: (submissionId: string) => void;
  onRank?: (submissionId: string, ranking: 1 | 2 | 3 | null) => void;
  rankingsApproved?: boolean;
  otherSubmissions?: any[];
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
  const [tab, setTab] = useState<'details' | 'links'>('details');

  if (!isOpen) return null;

  // Log submission data for debugging
  console.log(
    'DEBUG: Modal submission data:',
    JSON.stringify(submission, null, 2),
    { isOwner, isSponsor }
  );

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
      case 'PENDING':
        return (
          <span className="px-3 py-1 bg-yellow-900/40 text-yellow-300 border border-yellow-700/30 rounded-full text-sm font-medium">
            Pending
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-3 py-1 bg-green-900/40 text-green-300 border border-green-700/30 rounded-full text-sm font-medium">
            Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 bg-red-900/40 text-red-300 border border-red-700/30 rounded-full text-sm font-medium">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Determine content to show
  const getContentToShow = () => {
    if (submission.details) return submission.details;
    if (submission.content) return submission.content;
    return 'No details provided.';
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-75"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="px-6 pt-5 pb-4 bg-[#0F0F11]">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium leading-6 text-white">
                Submission Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {getStatusBadge(submission.status)}
                <span className="text-gray-300 text-sm">
                  Submitted on {formatDate(submission.created)}
                </span>
              </div>

              <div className="mb-4">
                <h4 className="text-sm text-gray-300 mb-1">Applicant</h4>
                <p className="font-medium text-white">
                  {getApplicantAddress()}
                </p>
                <span className="text-xs text-gray-400">
                  (Talent's wallet address)
                </span>
              </div>

              {submission.ranking && (
                <div className="mb-4">
                  <h4 className="text-sm text-gray-300 mb-1">Ranking</h4>
                  <div
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      submission.ranking === 1
                        ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30'
                        : submission.ranking === 2
                        ? 'bg-gray-700/40 text-gray-300 border border-gray-600/30'
                        : 'bg-amber-900/40 text-amber-300 border border-amber-700/30'
                    }`}
                  >
                    {submission.ranking === 1
                      ? '1st Place 🥇'
                      : submission.ranking === 2
                      ? '2nd Place 🥈'
                      : '3rd Place 🥉'}
                  </div>
                </div>
              )}

              <div className="border-b border-gray-700">
                <nav className="-mb-px flex" aria-label="Tabs">
                  <button
                    onClick={() => setTab('details')}
                    className={`py-2 px-4 text-sm font-medium ${
                      tab === 'details'
                        ? 'border-b-2 border-white text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setTab('links')}
                    className={`py-2 px-4 text-sm font-medium ${
                      tab === 'links'
                        ? 'border-b-2 border-white text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Links
                  </button>
                </nav>
              </div>

              <div className="mt-4">
                {tab === 'details' && (
                  <div className="whitespace-pre-wrap text-gray-300 bg-black/20 p-4 rounded-lg max-h-80 overflow-y-auto">
                    {getContentToShow()}
                  </div>
                )}

                {tab === 'links' && (
                  <div className="text-gray-300">
                    {submission.links ? (
                      <div className="bg-black/20 p-4 rounded-lg">
                        {submission.links.split(',').map((link, index) => (
                          <a
                            key={index}
                            href={link.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-2"
                          >
                            <FiExternalLink />
                            {link.trim()}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No links provided.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {(isOwner || isSponsor) && (
            <div className="px-6 py-4 bg-black/30">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  {!rankingsApproved && isOwner && !isSponsor && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => onRank?.(submission.id, 1)}
                        className={`px-3 py-1 bg-yellow-900/40 text-yellow-300 border border-yellow-700/30 rounded text-sm hover:bg-yellow-900/60 flex items-center gap-1 ${
                          isRankingTaken(1)
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        disabled={isRankingTaken(1)}
                      >
                        <FiAward /> 1st Place
                      </button>
                      <button
                        onClick={() => onRank?.(submission.id, 2)}
                        className={`px-3 py-1 bg-gray-700/40 text-gray-300 border border-gray-600/30 rounded text-sm hover:bg-gray-700/60 flex items-center gap-1 ${
                          isRankingTaken(2)
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        disabled={isRankingTaken(2)}
                      >
                        <FiAward /> 2nd Place
                      </button>
                      <button
                        onClick={() => onRank?.(submission.id, 3)}
                        className={`px-3 py-1 bg-amber-900/40 text-amber-300 border border-amber-700/30 rounded text-sm hover:bg-amber-900/60 flex items-center gap-1 ${
                          isRankingTaken(3)
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        disabled={isRankingTaken(3)}
                      >
                        <FiAward /> 3rd Place
                      </button>
                    </div>
                  )}

                  {isSponsor && (
                    <div className="text-gray-400 text-sm italic">
                      As a sponsor, you can view submissions but only the bounty
                      owner can rank them.
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                  >
                    Close
                  </button>
                  {isOwner && !isSponsor && submission.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        onAccept?.(submission.id);
                        onClose();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                    >
                      <FiCheck /> Accept Submission
                    </button>
                  )}
                </div>
              </div>

              {isOwner &&
                !isSponsor &&
                submission.ranking &&
                !rankingsApproved && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => onRank?.(submission.id, null)}
                      className="text-red-300 hover:text-red-200 text-sm flex items-center gap-1"
                    >
                      <FiX /> Remove ranking
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
