import { AddressLink, RichTextViewer } from '@/components/shared';
import { Dialog } from '@/components/ui';
import { Submission } from '@/types/bounty';
import { FiCalendar, FiExternalLink, FiStar, FiUser, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface SubmissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  isOwner: boolean;
  onRank?: (submissionId: string, ranking: number) => void;
  rankingsApproved?: boolean;
  otherSubmissions?: Submission[];
}

export default function SubmissionDetailsModal({
  isOpen,
  onClose,
  submission,
  isOwner,
  onRank,
  rankingsApproved = false,
  otherSubmissions = [],
}: SubmissionDetailsModalProps) {
  if (!isOpen || !submission) return null;

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

  const getRankingLabel = (rank: number) => {
    if (rank === 1) return '1st Place 🥇';
    if (rank === 2) return '2nd Place 🥈';
    if (rank === 3) return '3rd Place 🥉';
    return `${rank}th Place`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content className="max-w-3xl">
        {/* Header */}
        <Dialog.Header className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
          <div>
            <Dialog.Title className="text-2xl font-bold text-white mb-1">
              Submission Details
            </Dialog.Title>
            <p className="text-gray-400 text-sm">
              Submitted {formatDate(submission.created)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </Dialog.Header>

        {/* Content */}
        <div className="space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Applicant Info */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <FiUser className="w-4 h-4" />
                <span className="text-sm font-medium">Applicant</span>
              </div>
              <div className="flex items-center gap-2">
                <AddressLink
                  address={submission.applicant}
                  className="text-white hover:text-blue-400 transition-colors"
                />
                {submission.walletAddress && (
                  <span className="bg-green-900/30 text-green-300 border border-green-700/30 px-2 py-0.5 rounded-full text-xs">
                    Verified Wallet
                  </span>
                )}
              </div>
            </div>

            {/* Ranking Info */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <FiStar className="w-4 h-4" />
                <span className="text-sm font-medium">Ranking</span>
              </div>
              <AnimatePresence mode="wait">
                {submission.ranking ? (
                  <motion.div
                    key="ranked"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-white font-medium">
                      {getRankingLabel(submission.ranking)}
                    </span>
                    {isOwner && !rankingsApproved && (
                      <button
                        onClick={() => onRank?.(submission.id, 0)}
                        className="text-red-400 hover:text-red-300 text-sm ml-2"
                      >
                        Clear Rank
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.span
                    key="unranked"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="text-gray-400"
                  >
                    Not ranked yet
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Submission Content */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Submission Content
            </h3>
            <div className="prose prose-invert max-w-none">
              <RichTextViewer content={submission.content || 'No content provided.'} />
            </div>
          </div>

          {/* External Link */}
          {submission.link && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <FiExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">External Link</span>
              </div>
              <a
                href={submission.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline transition-colors break-all"
              >
                {submission.link}
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <Dialog.Footer className="flex justify-end gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/20"
          >
            Close
          </button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}