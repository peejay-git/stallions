import { db } from '@/lib/firebase';
import useAuthStore from '@/lib/stores/auth.store';
import type { SubmissionData } from '@/types/submission';
import { submitWorkOnChain } from '@/utils/blockchain';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface SubmitWorkFormProps {
  bountyId: number;
  submissionDeadline: number;
}

export default function SubmitWorkForm({
  bountyId,
  submissionDeadline,
}: SubmitWorkFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<
    | 'checking'
    | 'form'
    | 'submitting'
    | 'complete'
    | 'already-submitted'
    | 'expired'
  >('checking');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [userWalletAddress, setUserWalletAddress] = useState<string | null>(
    null
  );
  const [userSubmission, setUserSubmission] = useState<SubmissionData | null>(
    null
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const user = useAuthStore((state) => state.user);

  // Form state
  const [formData, setFormData] = useState({
    content: '',
    detailedDescription: '',
    link: '',
  });

  // Fetch user's wallet address from Firestore
  useEffect(() => {
    if (!user) return;

    // Get wallet address from auth store user data
    if (user && user.wallet?.address) {
      setUserWalletAddress(user.wallet.address);
    }
  }, [user]);

  // Check if bounty has expired and if user has already submitted work
  useEffect(() => {
    const checkSubmissionStatus = async () => {
      if (!user?.uid) {
        setStep('form'); // If no user, just show form (validation will happen later)
        return;
      }

      try {
        // First check if bounty has expired or is completed
        const bountyRef = doc(db, 'bounties', bountyId.toString());
        const bountySnap = await getDoc(bountyRef);

        if (bountySnap.exists()) {
          const bountyData = bountySnap.data();

          // Check if bounty is already marked as COMPLETED
          if (bountyData.status === 'COMPLETED') {
            setStep('expired');
            return;
          }

          // Check if deadline has passed
          const deadline = bountyData.deadline || bountyData.submissionDeadline;
          if (deadline) {
            const deadlineDate = new Date(deadline);
            const now = new Date();

            if (now > deadlineDate) {
              // Update bounty status to COMPLETED
              try {
                await updateDoc(bountyRef, {
                  status: 'COMPLETED',
                  updatedAt: new Date().toISOString(),
                });
              } catch (updateError) {
                console.error('Error updating bounty status:', updateError);
              }

              setStep('expired');
              return;
            }
          }
        }

        // Then check if user already submitted
        const q = query(
          collection(db, 'submissions'),
          where('bountyId', '==', bountyId.toString()),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // Store the user's submission data
          const submissionData = snapshot.docs[0].data() as SubmissionData;
          setUserSubmission({
            ...submissionData,
            id: snapshot.docs[0].id,
          });
          setStep('already-submitted');
        } else {
          setStep('form');
        }
      } catch (error) {
        console.error('Error checking submission status:', error);
        setStep('form'); // On error, default to showing the form
      }
    };

    checkSubmissionStatus();
  }, [bountyId, user?.uid]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user is logged in
      if (!user?.uid) {
        throw new Error('You must be logged in to submit work');
      }

      // Check if we have the user's wallet address
      if (!userWalletAddress) {
        throw new Error('No wallet address found. Please connect your wallet.');
      }

      // Double-check if bounty has expired
      const bountyRef = doc(db, 'bounties', bountyId.toString());
      const bountySnap = await getDoc(bountyRef);

      if (bountySnap.exists()) {
        const bountyData = bountySnap.data();
        const deadline = bountyData.deadline || bountyData.submissionDeadline;

        if (deadline) {
          const deadlineDate = new Date(deadline);
          const now = new Date();

          if (now > deadlineDate) {
            throw new Error(
              'This bounty has expired and is no longer accepting submissions'
            );
          }
        }
      }

      // Update UI state
      setStep('submitting');
      toast.loading('Submitting your work...', { id: 'submit-work' });

      // Submit to blockchain (Soroban contract)
      let blockchainSubmissionId;
      try {
        blockchainSubmissionId = await submitWorkOnChain({
          userPublicKey: userWalletAddress,
          bountyId,
          content: formData.link, // Use link as the on-chain content
        });
      } catch (blockchainError) {
        console.error('Error submitting to blockchain:', blockchainError);
        toast.remove('submit-work');
        setIsLoading(false);
        setStep('form');
        // We don't display a toast here because submitWorkOnChain already shows an error toast
        return;
      }

      if (!blockchainSubmissionId) {
        throw new Error('Failed to generate submission ID');
      }

      setSubmissionId(blockchainSubmissionId);

      // Save submission data to the database
      const response = await fetch(`/api/bounties/${bountyId}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.uid}`,
          'x-user-role': user.role || 'user',
        },
        body: JSON.stringify({
          submissionId: blockchainSubmissionId,
          applicantAddress: userWalletAddress,
          userId: user.uid,
          content: formData.detailedDescription,
          link: formData.link,
        }),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('API error response:', responseData);
        throw new Error(responseData.error || 'Failed to save submission');
      }

      // Complete
      setStep('complete');
      toast.success('Work submitted successfully!', { id: 'submit-work' });
    } catch (err: unknown) {
      const error =
        err instanceof Error ? err : new Error('Failed to submit work');
      console.error('Error submitting work:', error);
      toast.error(error.message, { id: 'submit-work' });
      setStep('form');

      // If it's a duplicate submission, update the state
      if (error.message.includes('already submitted')) {
        setHasSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'checking') {
    return (
      <div className="text-center py-10 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
        <p className="text-white mt-4">Checking submission status...</p>
      </div>
    );
  }

  if (step === 'already-submitted') {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Your Submission
        </h2>
        <div className="bg-blue-900/30 text-white border border-blue-700/30 p-6 rounded-lg">
          <div className="flex flex-col gap-4">
            {userSubmission?.createdAt && (
              <div>
                <h3 className="text-blue-300 font-medium mb-1">Submitted on</h3>
                <p className="text-white">
                  {new Date(userSubmission.createdAt).toLocaleString()}
                </p>
              </div>
            )}

            {userSubmission?.link && (
              <div>
                <h3 className="text-blue-300 font-medium mb-1">Link</h3>
                <p className="text-white">
                  <a
                    href={userSubmission.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-200"
                  >
                    {userSubmission.link}
                  </a>
                </p>
              </div>
            )}

            {userSubmission?.content && (
              <div>
                <h3 className="text-blue-300 font-medium mb-1">Description</h3>
                <p className="text-white whitespace-pre-wrap">
                  {userSubmission.content}
                </p>
              </div>
            )}

            <div className="mt-4">
              <p className="bg-gray-900/60 p-3 rounded text-gray-400 text-sm">
                <span className="text-white font-medium block mb-1">Note</span>
                You can only submit once per bounty.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'expired' || new Date() > new Date(submissionDeadline)) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Submit Work</h2>
        <div className="bg-gray-700/40 text-gray-300 border border-gray-600/30 p-4 rounded-lg">
          <p>
            This bounty has been completed and is no longer accepting
            submissions.
          </p>
          <p className="mt-2">Please check other active bounties.</p>
        </div>
      </div>
    );
  }

  // Show warning if no wallet address is found
  if (step === 'form' && !userWalletAddress) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Submit Work</h2>
        <div className="bg-yellow-900/40 text-yellow-300 border border-yellow-700/30 p-4 rounded-lg">
          <p>No wallet address found in your profile.</p>
          <p className="mt-2">
            Please update your profile with a wallet address to submit work.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-white p-6 pb-0 mb-4">
        Submit Work
      </h2>

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6 p-6 pt-0">
          {/* Wallet Address Display */}
          <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 text-sm">
            <p className="text-white font-medium">
              Submission will be linked to your wallet
            </p>
            <p className="text-gray-300 break-all text-xs mt-1">
              {userWalletAddress}
            </p>
          </div>

          {/* Link */}
          <div>
            <label className="block text-white mb-2">Link to Work</label>
            <input
              type="text"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="GitHub repository URL, deployed app URL, etc."
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-white mb-2">
              Detailed Description
            </label>
            <textarea
              name="detailedDescription"
              value={formData.detailedDescription}
              onChange={handleChange}
              placeholder="Describe your submission in detail. Include any relevant information that would help the bounty owner evaluate your work."
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white h-32"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-white/90 transition-colors"
          >
            {isLoading ? 'Submitting Work...' : 'Submit Work'}
          </button>
        </form>
      )}

      {step === 'submitting' && (
        <div className="text-center py-10 p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Submitting your work...</p>
          <p className="text-gray-400 mt-2">
            Please wait while we save your submission
          </p>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center py-10 p-6">
          <div className="w-12 h-12 rounded-full bg-green-500 mx-auto flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-white text-xl font-semibold mt-4">
            Work Submitted!
          </h3>
          <p className="text-gray-400 mt-2">
            Your submission has been recorded successfully.
          </p>
          <Link
            href={`/bounties/${bountyId}`}
            className="mt-6 bg-white text-black font-medium py-2 px-6 rounded-lg hover:bg-white/90 transition-colors"
          >
            View Bounty
          </Link>
        </div>
      )}
    </>
  );
}
