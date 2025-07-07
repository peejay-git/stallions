import { Submission } from '@/types/bounty';
import { useEffect, useState } from 'react';
import { FiArrowRight, FiAward, FiCheck, FiUser } from 'react-icons/fi';
import { useWallet } from '@/hooks/useWallet';

interface SelectWinnersFormProps {
  bountyId: number;
  winnerCount: number;
  distributions: { position: number; percentage: number }[];
  onSelectionComplete: () => void;
}

export default function SelectWinnersForm({
  bountyId,
  winnerCount,
  distributions,
  onSelectionComplete,
}: SelectWinnersFormProps) {
  const { isConnected, publicKey } = useWallet();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWinners, setSelectedWinners] = useState<{
    [position: number]: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch submissions for this bounty
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch(`/api/bounties/${bountyId}/submissions`);

        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }

        const data = await response.json();
        setSubmissions(data);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [bountyId]);

  const handleSelectWinner = (position: number, applicantAddress: string) => {
    // Make sure we don't select the same applicant for multiple positions
    const currentPositionForApplicant = Object.entries(selectedWinners).find(
      ([pos, addr]) => addr === applicantAddress
    );

    if (currentPositionForApplicant) {
      // Remove from previous position
      const newSelections = { ...selectedWinners };
      delete newSelections[parseInt(currentPositionForApplicant[0])];
      setSelectedWinners(newSelections);
    }

    // Add to new position
    setSelectedWinners((prev) => ({
      ...prev,
      [position]: applicantAddress,
    }));
  };

  const isComplete = () => {
    return Object.keys(selectedWinners).length === winnerCount;
  };

  const handleSubmit = async () => {
    if (!isComplete()) {
      setError('Please select winners for all positions');
      return;
    }

    try {
      setIsSubmitting(true);

      // Check if wallet is connected
      if (!isConnected || publicKey) {
        throw new Error('Wallet not connected');
      }

      // Convert selected winners to array format for API
      const winnerAddresses = distributions
        .sort((a, b) => a.position - b.position)
        .map((dist) => selectedWinners[dist.position] || '');

      // Submit winners to API
      const response = await fetch(`/api/bounties/${bountyId}/winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winnerAddresses,
          userPublicKey: publicKey,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to select winners');
      }

      // Success - notify parent component
      onSelectionComplete();
    } catch (err) {
      console.error('Error selecting winners:', err);
      setError(err instanceof Error ? err.message : 'Failed to select winners');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
        <p className="text-white text-center mt-4">Loading submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-8">
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 text-red-300">
          {error}
        </div>
        <button
          onClick={() => setError(null)}
          className="mt-4 bg-white text-black py-2 px-4 rounded-lg hover:bg-white/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-8 text-center">
        <p className="text-gray-300">No submissions yet for this bounty.</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <FiAward className="text-yellow-400" />
        Select Winners
      </h2>

      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 text-blue-300">
          <p>
            Select {winnerCount} winners for this bounty. Choose carefully as
            this cannot be changed once submitted.
          </p>
        </div>

        {/* Position selections */}
        <div className="space-y-6">
          {distributions
            .sort((a, b) => a.position - b.position)
            .map((dist) => (
              <div key={dist.position} className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-2">
                  {dist.position === 1
                    ? '1st Place'
                    : dist.position === 2
                    ? '2nd Place'
                    : dist.position === 3
                    ? '3rd Place'
                    : `${dist.position}th Place`}{' '}
                  ({dist.percentage}%)
                </h3>

                <div className="space-y-2 mt-3">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      onClick={() =>
                        handleSelectWinner(dist.position, submission.applicant)
                      }
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedWinners[dist.position] === submission.applicant
                          ? 'bg-green-900/30 border border-green-700/30'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white">
                        {selectedWinners[dist.position] ===
                        submission.applicant ? (
                          <FiCheck className="text-green-400" />
                        ) : (
                          <FiUser />
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="text-white">
                          Applicant: {submission.applicant.substring(0, 8)}...
                        </div>
                        <div className="text-gray-400 text-sm mt-1 line-clamp-1">
                          {submission.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {/* Submit button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            disabled={!isComplete() || isSubmitting}
            className={`flex items-center gap-2 py-2 px-6 rounded-lg transition-colors ${
              isComplete() && !isSubmitting
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/30 text-white/70 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <span>Select Winners</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
