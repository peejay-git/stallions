'use client';

import {
  AddressLink,
  BountyDetailSkeleton,
  RichTextViewer,
  SubmissionDetailsModal,
} from '@/components';
import { assetSymbols } from '@/components/core/bounty/BountyCard';
import { useWallet } from '@/hooks/useWallet';
import {
  bountyHasSubmissions,
  FirebaseBounty,
  getBountyById,
} from '@/lib/bounties';
import useAuthStore from '@/lib/stores/auth.store';
import { BountyStatus, Submission } from '@/types/bounty';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiAward, FiBriefcase, FiClock, FiUser } from 'react-icons/fi';

export default function BountyDetailPage() {
  const params = useParams<{ id: string }>();
  const [bounty, setBounty] = useState<FirebaseBounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSponsor, setIsSponsor] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [rankingsApproved, setRankingsApproved] = useState(false);
  const { publicKey } = useWallet();
  const [winners, setWinners] = useState<any[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = params.id;
        if (!id || typeof id !== 'string') return;

        const data = await getBountyById(id);
        setBounty(data);

        // If bounty is completed, fetch winners
        if (data && data.status === BountyStatus.COMPLETED) {
          fetchWinners(data.id);
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching bounty');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  // Update countdown timer
  useEffect(() => {
    if (!bounty || !bounty.deadline) return;

    const calculateCountdown = () => {
      const deadline = new Date(bounty.deadline).getTime();
      const now = new Date().getTime();
      const timeLeft = deadline - now;

      if (timeLeft <= 0) {
        // Deadline has passed
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        });
        return;
      }

      // Calculate time units
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setCountdown({
        days,
        hours,
        minutes,
        seconds,
        expired: false,
      });
    };

    // Calculate initial countdown
    calculateCountdown();

    // Update countdown every second
    const timer = setInterval(calculateCountdown, 1000);

    // Clean up timer on unmount
    return () => clearInterval(timer);
  }, [bounty]);

  const fetchWinners = async (bountyId: string) => {
    try {
      setLoadingWinners(true);
      const response = await fetch(`/api/bounties/${bountyId}/winners`);
      if (response.ok) {
        const data = await response.json();
        setWinners(data);
      }
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setLoadingWinners(false);
    }
  };

  // Fetch submissions when bounty and userId are available
  useEffect(() => {
    if (!bounty || !userId) return;

    // Allow both bounty owners and sponsors to view submissions
    const isOwnerByWallet = bounty.owner === publicKey;

    if (!isOwnerByWallet && !isSponsor) {
      return;
    }

    const fetchSubmissions = async () => {
      try {
        setLoadingSubmissions(true);

        const response = await fetch(`/api/bounties/${params.id}/submissions`, {
          headers: {
            Authorization: `Bearer ${userId}`,
            'x-user-role': userRole || '',
            'x-wallet-address': publicKey || '',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          throw new Error(errorData.error || 'Failed to fetch submissions');
        }

        const data = await response.json();

        // Validate each submission has an applicant address
        const validatedData = data.map((submission: any) => {
          if (!submission.applicant && !submission.walletAddress) {
            console.error(
              'ERROR: Missing applicant address in submission:',
              submission.id
            );
            // Provide a fallback
            return {
              ...submission,
              applicant: 'Unknown',
              walletAddress: 'Unknown',
            };
          }
          return submission;
        });

        setSubmissions(validatedData);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error(`Failed to load submissions: ${(error as Error).message}`);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    fetchSubmissions();
  }, [bounty, userId, publicKey, params.id, isSponsor, userRole]);

  // Detect logged-in user and get their ID
  useEffect(() => {
    const auth = getAuth(); // Initialize Firebase auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If user is logged in, set the user ID (uid)
        setUserId(user.uid);

        // Check if the user is a sponsor by getting their role from auth store
        const checkUserRole = async () => {
          try {
            // Refresh user data from Firestore to ensure we have the latest
            await useAuthStore.getState().fetchUserFromFirestore();

            // Get the user role from auth store
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              const role = currentUser.role;
              setUserRole(role);
              setIsSponsor(role === 'sponsor');
            }
          } catch (error) {
            console.error('Error checking user role:', error);
          }
        };

        checkUserRole();
      } else {
        // User is not logged in
        setUserId(null);
        setUserRole(null);
        setIsSponsor(false);
      }
    });

    return () => unsubscribe(); // Clean up on unmount
  }, []);

  // Check if user can edit this bounty (is owner and no submissions)
  useEffect(() => {
    const checkEditPermission = async () => {
      const id = params.id;
      if (!id || typeof id !== 'string') return;

      if (!bounty || !publicKey) {
        setCanEdit(false);
        return;
      }

      if (bounty.owner !== publicKey) {
        setCanEdit(false);
        return;
      }

      try {
        // Check if bounty has submissions
        const hasSubmissions = await bountyHasSubmissions(id);
        setCanEdit(!hasSubmissions);
      } catch (err) {
        console.error('Error checking bounty submissions:', err);
        setCanEdit(false);
      }
    };

    if (bounty && publicKey) {
      checkEditPermission();
    }
  }, [bounty, publicKey, params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if bounty is expired
  const isBountyExpired = () => {
    if (!bounty) return false;

    const deadline = new Date(bounty.deadline);
    const now = new Date();
    return now > deadline;
  };

  // Update bounty status to COMPLETED if deadline has passed
  useEffect(() => {
    const updateExpiredBountyStatus = async () => {
      if (
        !bounty ||
        !isBountyExpired() ||
        bounty.status === BountyStatus.COMPLETED
      ) {
        return; // No need to update if not expired or already completed
      }

      try {
        // Update the status in the database
        const response = await fetch(`/api/bounties/${params.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userId}`,
          },
          body: JSON.stringify({
            status: BountyStatus.COMPLETED,
          }),
        });

        if (response.ok) {
          // Update local state
          setBounty({
            ...bounty,
            status: BountyStatus.COMPLETED,
          });
        } else {
          console.error(
            'Failed to update bounty status:',
            await response.text()
          );
        }
      } catch (error) {
        console.error('Error updating bounty status:', error);
      }
    };

    updateExpiredBountyStatus();
  }, [bounty, params.id, userId]);

  // Handle accept submission
  const handleAcceptSubmission = async (submissionId: string) => {
    if (!bounty || !publicKey) return;

    try {
      const response = await fetch(
        `/api/bounties/${params.id}/submissions/${submissionId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'accept',
            senderPublicKey: publicKey, // Use wallet public key
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept submission');
      }

      // Update the local submissions list
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === submissionId
            ? { ...sub, status: 'ACCEPTED' as unknown as BountyStatus }
            : sub
        )
      );

      toast.success(
        'Submission accepted! The bounty reward will be transferred to the winner.'
      );

      // Update bounty status to completed
      if (bounty) {
        setBounty({
          ...bounty,
          status: BountyStatus.COMPLETED,
        });
      }
    } catch (err: any) {
      console.error('Error accepting submission:', err);
      toast.error(err.message || 'Failed to accept submission');
    }
  };

  // Handle ranking submission (1st, 2nd, 3rd place)
  const handleRankSubmission = async (
    submissionId: string,
    ranking: 1 | 2 | 3 | null
  ) => {
    if (!bounty || !userId) return;

    try {
      const response = await fetch(
        `/api/bounties/${params.id}/submissions/${submissionId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'rank',
            userId: userId, // Use userId instead of senderPublicKey
            ranking,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rank submission');
      }

      // Update the local submissions list
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === submissionId ? { ...sub, ranking } : sub))
      );

      toast.success(
        ranking
          ? `Submission ranked #${ranking} successfully`
          : 'Ranking removed'
      );
    } catch (err: any) {
      console.error('Error ranking submission:', err);
      toast.error(err.message || 'Failed to rank submission');
    }
  };

  // Get status color and text
  const getStatusBadge = (status: BountyStatus) => {
    switch (status) {
      case BountyStatus.OPEN:
        return (
          <span className="px-3 py-1 bg-green-900/40 text-green-300 border border-green-700/30 rounded-full text-sm font-medium">
            Open
          </span>
        );
      case BountyStatus.IN_PROGRESS:
        return (
          <span className="px-3 py-1 bg-blue-900/40 text-blue-300 border border-blue-700/30 rounded-full text-sm font-medium">
            In Progress
          </span>
        );
      case BountyStatus.COMPLETED:
        return (
          <span className="px-3 py-1 bg-gray-700/40 text-gray-300 border border-gray-600/30 rounded-full text-sm font-medium">
            Completed
          </span>
        );
      case BountyStatus.CANCELLED:
        return (
          <span className="px-3 py-1 bg-red-900/40 text-red-300 border border-red-700/30 rounded-full text-sm font-medium">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  // Get submission status badge
  const getSubmissionStatusBadge = (status: string) => {
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

  // Handle approve rankings function
  const handleApproveRankings = async () => {
    if (!bounty || !publicKey) {
      return;
    }

    // Check if all places (1st, 2nd, 3rd) have been assigned
    const hasFirstPlace = submissions.some((sub) => sub.ranking === 1);

    if (!hasFirstPlace) {
      toast.error('Please select a 1st place winner before approving');
      return;
    }

    // Get the distribution count from the bounty
    const distributionCount = bounty.distribution.length;

    // Check if we have enough ranked submissions for the distribution
    const rankedSubmissions = submissions
      .filter((sub) => sub.ranking !== null)
      .sort((a, b) => (a.ranking || 0) - (b.ranking || 0));

    if (rankedSubmissions.length < distributionCount) {
      toast.error(
        `Please rank at least ${distributionCount} submission(s) before approving`
      );
      return;
    }

    try {
      toast.loading('Finalizing winners and sending payments...', {
        id: 'approve-rankings',
      });

      // Get the wallet addresses of the winners in order of their ranking
      const winnerAddresses = rankedSubmissions
        .slice(0, distributionCount)
        .map((sub) => sub.walletAddress || sub.applicant);

      // Call the API to select winners and process payments on the blockchain
      const response = await fetch(`/api/bounties/${params.id}/winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winnerAddresses,
          userPublicKey: publicKey, // Use wallet public key
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API error response:', error);
        throw new Error(error.error || 'Failed to select winners');
      }

      const result = await response.json();

      // Update local state
      setRankingsApproved(true);
      toast.success(
        'Winners have been selected and payments are being processed!',
        { id: 'approve-rankings' }
      );

      // Update bounty status to COMPLETED
      if (bounty) {
        setBounty({
          ...bounty,
          status: BountyStatus.COMPLETED,
        });
      }

      // Fetch the updated winners
      fetchWinners(bounty.id);
    } catch (err: any) {
      console.error('Error approving rankings:', err);
      toast.error(err.message || 'Failed to approve rankings', {
        id: 'approve-rankings',
      });
    }
  };

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

  // Open submission details modal
  const openSubmissionModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  if (loading) return <BountyDetailSkeleton />;
  if (!bounty) return <div className="text-center py-12">Bounty not found</div>;

  const isOwner = publicKey === bounty.owner;
  const canViewSubmissions = isOwner || isSponsor;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8 flex justify-between items-center">
          <nav className="text-sm text-gray-300">
            <Link
              href="/bounties"
              className="hover:text-white transition-colors"
            >
              Bounties
            </Link>{' '}
            / {bounty.title}
          </nav>
          <Link
            href="/bounties"
            className="bg-white/10 backdrop-blur-xl border border-white/20 text-white py-2 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </Link>
        </div>

        {/* Bounty info */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {bounty.title}
              </h1>
              <div className="flex items-center gap-3 mb-2">
                {getStatusBadge(bounty.status as BountyStatus)}
                {isBountyExpired() && (
                  <span className="px-3 py-1 bg-red-900/40 text-red-300 border border-red-700/30 rounded-full text-sm font-medium">
                    Expired
                  </span>
                )}
              </div>
              <div className="text-gray-300 text-sm mb-2">
                Posted on {formatDate(bounty.createdAt)}
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <FiBriefcase className="flex-shrink-0" />
                <span>Sponsored by {bounty.sponsorName || 'Anonymous'}</span>
              </div>
              {bounty.status === BountyStatus.OPEN && !isBountyExpired() && (
                <div className="my-2">
                  <h3 className="text-gray-300 mb-2 flex items-center gap-1">
                    <FiClock /> Time Remaining:
                  </h3>
                  <div className="flex gap-2">
                    <div className="bg-white/10 rounded-lg px-3 py-2 text-center w-16">
                      <div className="text-xl font-mono">{countdown.days}</div>
                      <div className="text-xs text-gray-400">Days</div>
                    </div>
                    <div className="bg-white/10 rounded-lg px-3 py-2 text-center w-16">
                      <div className="text-xl font-mono">
                        {countdown.hours.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-400">Hours</div>
                    </div>
                    <div className="bg-white/10 rounded-lg px-3 py-2 text-center w-16">
                      <div className="text-xl font-mono">
                        {countdown.minutes.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-400">Min</div>
                    </div>
                    <div className="bg-white/10 rounded-lg px-3 py-2 text-center w-16">
                      <div className="text-xl font-mono">
                        {countdown.seconds.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-400">Sec</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end">
              <div className="bg-white text-black py-3 px-6 rounded-lg text-center mb-3 w-full md:w-auto">
                <div className="text-sm opacity-90">Reward</div>
                <div className="text-xl font-bold">
                  {assetSymbols[bounty.reward.asset] || ''}
                  {/* Show adjusted reward amount (after fee) for talents */}
                  {isSponsor
                    ? bounty.reward.amount
                    : (parseFloat(bounty.reward.amount) * 0.95).toFixed(2)}{' '}
                  {bounty.reward.asset}
                </div>
              </div>

              {canEdit && (
                <Link
                  href={`/bounties/${params.id}/edit`}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 text-white font-medium py-2 px-4 rounded-lg hover:bg-white/20 transition-colors w-full md:w-auto"
                >
                  Edit Bounty
                </Link>
              )}
            </div>
          </div>

          <div className="border-t border-gray-600 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="text-sm text-gray-300 mb-1">Category</h3>
                <p className="font-medium text-white">{bounty.category}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-300 mb-1">Deadline</h3>
                <p className="font-medium text-white">
                  {formatDate(bounty.deadline)}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-gray-300 mb-1">Posted By</h3>
                <p className="font-medium text-white truncate">
                  <AddressLink address={bounty.owner} />
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm text-gray-300 mb-2">Description</h3>
              <RichTextViewer
                content={bounty.description}
                className="bg-white/5 p-4 rounded-lg prose prose-invert prose-headings:text-white prose-a:text-blue-400 max-w-none"
              />
            </div>

            <div className="mb-6">
              <h3 className="text-sm text-gray-300 mb-1">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {bounty.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="bg-white/10 text-gray-200 px-3 py-1 rounded-full text-sm border border-white/10"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Reward Distribution Section */}
            <div className="mb-6">
              <h3 className="text-sm text-gray-300 mb-1">
                Reward Distribution
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white">Total Reward:</span>
                  <span className="text-white font-medium">
                    {assetSymbols[bounty.reward.asset] || ''}
                    {isSponsor
                      ? bounty.reward.amount
                      : (parseFloat(bounty.reward.amount) * 0.95).toFixed(2)}{' '}
                    {bounty.reward.asset}
                  </span>
                </div>
                
                {/* Only show platform fee to sponsors */}
                {isSponsor && (
                  <>
                    <div className="flex justify-between items-center mb-3 text-sm">
                      <span className="text-gray-300">Platform Fee (5%):</span>
                      <span className="text-gray-300">
                        {assetSymbols[bounty.reward.asset] || ''}
                        {(parseFloat(bounty.reward.amount) * 0.05).toFixed(2)}{' '}
                        {bounty.reward.asset}
                      </span>
                    </div>
                    <div className="border-t border-white/10 my-3"></div>
                  </>
                )}
                
                {bounty.distribution && bounty.distribution.length > 0 ? (
                  <>
                    <div className="text-sm text-gray-300 mb-2">
                      {isSponsor ? 'Distribution after platform fee:' : 'Distribution:'}
                    </div>
                    <div className="space-y-2">
                      {bounty.distribution.map((dist) => {
                        const totalAfterFee =
                          parseFloat(bounty.reward.amount) * 0.95;
                        const positionAmount =
                          totalAfterFee * (dist.percentage / 100);
                        return (
                          <div
                            key={dist.position}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="flex items-center gap-1">
                              {dist.position === 1 && '🥇 1st'}
                              {dist.position === 2 && '🥈 2nd'}
                              {dist.position === 3 && '🥉 3rd'}
                              {dist.position > 3 && `${dist.position}th`} Place
                              ({dist.percentage}%):
                            </span>
                            <span className="font-medium text-white">
                              {assetSymbols[bounty.reward.asset] || ''}
                              {positionAmount.toFixed(2)} {bounty.reward.asset}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-300">
                    Winner takes all{isSponsor ? ' (after 5% platform fee)' : ''}:{' '}
                    {assetSymbols[bounty.reward.asset] || ''}
                    {(parseFloat(bounty.reward.amount) * 0.95).toFixed(2)}{' '}
                    {bounty.reward.asset}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions section (visible to bounty owner) */}
      {canViewSubmissions && (
        <div className="max-w-5xl mx-auto backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-8 text-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FiUser className="text-blue-400" /> Submissions
                {submissions.length > 0 && (
                  <span className="bg-blue-500/30 text-blue-200 border border-blue-500/50 rounded-full px-2 py-0.5 text-xs font-medium">
                    {submissions.length}
                  </span>
                )}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {submissions.length === 0
                  ? 'No submissions yet. Check back later!'
                  : isOwner
                  ? 'Rank the best submissions to select winners and distribute rewards.'
                  : 'View submissions for this bounty.'}
              </p>
            </div>

            {submissions.length > 0 &&
              isOwner &&
              submissions.some((sub) => sub.ranking) &&
              !rankingsApproved && (
                <button
                  onClick={handleApproveRankings}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FiAward /> Finalize Winners & Send Payments
                </button>
              )}
            {rankingsApproved && (
              <div className="bg-green-900/40 text-green-300 border border-green-700/30 rounded-lg px-4 py-2 flex items-center gap-2">
                <FiAward /> Winners Finalized ✓
              </div>
            )}
          </div>

          {loadingSubmissions ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-300">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-white/5 rounded-lg p-8 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-300">No submissions yet.</p>
              <p className="text-gray-400 text-sm mt-2">
                Check back later or share your bounty to get more visibility.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-600">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 bg-black/20 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      {isOwner ? 'Ranking' : 'Position'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-black/10 divide-y divide-gray-600">
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              <AddressLink
                                address={submission.applicant}
                                truncateLength={8}
                              />
                            </div>
                            <div className="text-sm text-gray-300">
                              {formatDate(submission.created)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {formatDate(submission.created)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getSubmissionStatusBadge(submission.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isOwner ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleRankSubmission(submission.id, 1)
                              }
                              className="px-2 py-1 bg-green-600/40 text-green-300 border border-green-600/30 rounded text-xs hover:bg-green-600/60"
                              title="Set as 1st place"
                              disabled={submissions.some(
                                (sub) => sub.ranking === 1
                              )}
                            >
                              1st
                            </button>
                            <button
                              onClick={() =>
                                handleRankSubmission(submission.id, 2)
                              }
                              className="px-2 py-1 bg-blue-600/40 text-blue-300 border border-blue-600/30 rounded text-xs hover:bg-blue-600/60"
                              title="Set as 2nd place"
                              disabled={submissions.some(
                                (sub) => sub.ranking === 2
                              )}
                            >
                              2nd
                            </button>
                            <button
                              onClick={() =>
                                handleRankSubmission(submission.id, 3)
                              }
                              className="px-2 py-1 bg-amber-900/40 text-amber-300 border border-amber-700/30 rounded text-xs hover:bg-amber-900/60"
                              title="Set as 3rd place"
                              disabled={submissions.some(
                                (sub) => sub.ranking === 3
                              )}
                            >
                              3rd
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not ranked</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openSubmissionModal(submission)}
                          className="text-blue-400 hover:text-blue-300 mr-4"
                        >
                          View Details
                        </button>

                        {isOwner &&
                          submission.status.toString() === 'PENDING' && (
                            <button
                              onClick={() =>
                                handleAcceptSubmission(submission.id)
                              }
                              className="text-green-300 hover:text-green-200 mr-4"
                              disabled={
                                bounty.status === BountyStatus.COMPLETED
                              }
                            >
                              Accept
                            </button>
                          )}

                        {isOwner && submission.ranking && !rankingsApproved && (
                          <button
                            onClick={() =>
                              handleRankSubmission(submission.id, null)
                            }
                            className="text-red-300 hover:text-red-200 ml-4"
                            title="Remove ranking"
                          >
                            Clear Rank
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <SubmissionDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        submission={selectedSubmission}
        isOwner={isOwner}
        isSponsor={isSponsor}
        onAccept={(submissionId) => handleAcceptSubmission(submissionId)}
        onRank={(submissionId, ranking) =>
          handleRankSubmission(submissionId, ranking)
        }
        rankingsApproved={rankingsApproved}
        otherSubmissions={submissions}
      />
    </div>
  );
}
