'use client';

import { RichTextEditor } from '@/components';
import { useWallet } from '@/hooks/useWallet';
import useAuthStore from '@/lib/stores/auth.store';
import { submitWorkOnChain } from '@/utils/blockchain';
import { doc, getFirestore, setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { FormEvent, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface SubmitWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  bountyId: string;
  onSubmitSuccess: () => void;
}

export default function SubmitWorkModal({
  isOpen,
  onClose,
  bountyId,
  onSubmitSuccess,
}: SubmitWorkModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [workContent, setWorkContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const { publicKey, connect } = useWallet();
  const { user } = useAuthStore();
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      if (isOpen) {
        modal.showModal();
      } else {
        modal.close();
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    setWorkContent('');
    setLinkUrl('');
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in before submitting work');
      return;
    }

    if (!workContent && !linkUrl) {
      toast.error(
        'Please provide either work description or link to your work'
      );
      return;
    }

    try {
      setSubmitting(true);

      // Create submission content including work description and link
      const content = JSON.stringify({
        description: workContent,
        link: linkUrl,
        timestamp: Date.now(),
      });

      // Generate blockchain submission ID when wallet is connected
      let submissionId;
      if (publicKey) {
        // If wallet is connected, use blockchain ID as primary ID
        submissionId = await submitWorkOnChain({
          userPublicKey: publicKey,
          bountyId: parseInt(bountyId),
          content,
        });
        // Convert number to string if needed
        submissionId = String(submissionId);
      } else {
        // If no wallet connected, generate local ID
        submissionId = nanoid();
      }

      // Save submission to Firestore
      const db = getFirestore();
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId, // Single ID field used for both on-chain and off-chain
        userId: user.uid,
        bountyId,
        content: workContent,
        link: linkUrl,
        status: 'PENDING',
        createdAt: Timestamp.now(),
        walletAddress: publicKey || null,
      });

      toast.success('Work submitted successfully!');
      onSubmitSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error submitting work:', error);
      toast.error(`Failed to submit work: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={modalRef}
      className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-full max-w-2xl"
      onClose={handleClose}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Submit Your Work</h2>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Work Description
          </label>
          <RichTextEditor
            onChange={setWorkContent}
            value={workContent}
            placeholder="Describe your work and submission details..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Link to Work (Optional)
          </label>
          <input
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400 mt-1">
            Add a link to your work if it's hosted elsewhere (GitHub, Figma,
            etc.)
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || (!publicKey && !user)}
            className={`px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors ${
              submitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit Work'}
          </button>
        </div>

        {!publicKey && (
          <div className="mt-4 p-3 bg-gray-800 rounded-md">
            <p className="text-sm text-gray-300">
              Connect your wallet to receive rewards if your submission is
              selected
            </p>
            <button
              type="button"
              onClick={() => connect()}
              className="mt-2 px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </form>
    </dialog>
  );
}
