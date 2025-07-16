import { Dialog } from '@/components/ui';
import { Submission } from '@/types/bounty';
import { FiX } from 'react-icons/fi';

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

  // Determine content to show
  const getContentToShow = () => {
    if (submission.content) return submission.content;
    return 'No content provided.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content>
        <Dialog.Header className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
          <Dialog.Title className="text-white">Submission Details</Dialog.Title>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-300 hover:text-white"
          >
            <FiX className="w-6 h-6" />
          </button>
        </Dialog.Header>

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
              <p className="text-gray-400 text-sm mb-1">Ranking</p>
              <span className="text-white">
                {submission.ranking ? `${submission.ranking}st` : 'Not ranked'}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-white">
              Submission Content
            </h3>
            <div className="prose prose-invert max-w-none text-white">
              {getContentToShow()}
            </div>
            {submission.link && (
              <div className="mt-4">
                <h3 className="text-white font-medium mb-2">Link</h3>
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

          <Dialog.Footer className="flex justify-end gap-2">
            {isOwner && submission.ranking && !rankingsApproved && (
              <button
                onClick={() => onRank?.(submission.id, 0)}
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
          </Dialog.Footer>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
