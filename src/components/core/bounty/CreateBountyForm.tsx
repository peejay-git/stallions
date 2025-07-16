'use client';

import { RichTextEditor } from '@/components';
import { getCurrentNetwork } from '@/config/networks';
import { useWallet } from '@/hooks/useWallet';
import useAuthStore from '@/lib/stores/auth.store';
import { Distribution } from '@/types/bounty';
import { createBountyOnChain } from '@/utils/blockchain';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function CreateBountyForm() {
  const user = useAuthStore((state: { user: any }) => state.user);
  const { isConnected, publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<
    'form' | 'blockchain' | 'database' | 'complete'
  >('form');
  const [blockchainBountyId, setBlockchainBountyId] = useState<number | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: `<p><strong>Project Overview</strong><br/>Briefly describe the project and its goals.</p>
<p><strong>Task Details</strong><br/>- What needs to be done?<br/>- Any specific requirements?</p>
<p><strong>Deliverables</strong><br/>- List what you expect to receive.</p>
<p><strong>Evaluation Criteria</strong><br/>- How will submissions be judged?</p>
<p><strong>Timeline</strong><br/>- Submission deadline<br/>- Judging deadline</p>
<p><strong>Additional Notes</strong><br/>- Any other info for applicants.</p>`,
    category: 'DEVELOPMENT',
    skills: [] as string[],
    token: getCurrentNetwork().tokens[0].address, // Use first token by default
    tokenSymbol: getCurrentNetwork().tokens[0].symbol, // Track the token symbol separately for display
    rewardAmount: '',
    submissionDeadline: '',
    distribution: [] as Distribution[],
    winnerCount: 1,
  });

  // Initialize distribution based on winner count
  useEffect(() => {
    const newDistribution = Array.from(
      { length: formData.winnerCount },
      (_, i) => ({
        position: i + 1,
        percentage: calculateDefaultPercentage(i + 1, formData.winnerCount),
      })
    );
    setFormData((prev) => ({ ...prev, distribution: newDistribution }));
  }, [formData.winnerCount]);

  // Available skills for skill selection
  const skillsOptions = [
    'JavaScript',
    'React',
    'Node.js',
    'Solidity',
    'Blockchain',
    'Smart Contracts',
    'Python',
    'UI/UX',
    'Graphic Design',
    'Writing',
    'Marketing',
    'Community Management',
    'Translation',
    'Research',
    'Rust',
    'Stellar',
  ];

  // Handle rich text editor content changes
  const handleQuillChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === 'winnerCount') {
      const count = parseInt(value);
      if (count >= 1 && count <= 5) {
        // Create new distribution based on winner count
        const newDistribution = Array.from({ length: count }, (_, i) => {
          const position = i + 1;
          // For existing positions, keep their percentage if available
          const existingEntry = formData.distribution.find(
            (d) => d.position === position
          );
          return {
            position,
            percentage:
              existingEntry?.percentage ||
              calculateDefaultPercentage(count, position),
          };
        });

        setFormData((prev) => ({
          ...prev,
          winnerCount: count,
          distribution: newDistribution,
        }));
      }
    } else if (name === 'token') {
      // When token changes, update both token (address) and tokenSymbol
      const selectedToken = getCurrentNetwork().tokens.find(
        (t) => t.address === value
      );
      if (selectedToken) {
        setFormData((prev) => ({
          ...prev,
          token: value,
          tokenSymbol: selectedToken.symbol,
        }));
      } else {
        // Fallback if token not found
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDistributionChange = (position: number, percentage: number) => {
    const newDistribution = formData.distribution.map((item) => {
      if (item.position === position) {
        return { ...item, percentage };
      }
      return item;
    });

    setFormData((prev) => ({
      ...prev,
      distribution: newDistribution,
    }));
  };

  const calculateDefaultPercentage = (
    totalWinners: number,
    position: number
  ): number => {
    // Default percentage distribution based on position
    switch (totalWinners) {
      case 1:
        return 100;
      case 2:
        return position === 1 ? 70 : 30;
      case 3:
        return position === 1 ? 50 : position === 2 ? 30 : 20;
      case 4:
        return position === 1
          ? 40
          : position === 2
          ? 30
          : position === 3
          ? 20
          : 10;
      case 5:
        return position === 1
          ? 40
          : position === 2
          ? 25
          : position === 3
          ? 15
          : position === 4
          ? 10
          : 10;
      default:
        return 100 / totalWinners;
    }
  };

  const validateDistribution = (): boolean => {
    const total = formData.distribution.reduce(
      (sum, item) => sum + item.percentage,
      0
    );
    return total === 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the distribution percentages sum to 100%
    if (!validateDistribution()) {
      alert('The sum of reward distribution percentages must equal 100%');
      return;
    }

    // Validate skills selection
    if (formData.skills.length === 0) {
      alert('Please select at least one skill');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Check if wallet is connected
      if (!isConnected || !publicKey) {
        throw new Error('Wallet not connected');
      }

      // Step 3: Update UI state
      setStep('blockchain');

      // Step 4: Create bounty on the blockchain
      let bountyId;
      try {
        bountyId = await createBountyOnChain({
          userPublicKey: publicKey,
          title: formData.title,
          token: formData.token,
          reward: {
            amount: formData.rewardAmount,
            asset: formData.tokenSymbol,
          },
          distribution: formData.distribution,
          submissionDeadline: new Date(formData.submissionDeadline).getTime(),
        });

        // Step 5: Store blockchain bounty ID
        setBlockchainBountyId(bountyId);
      } catch (blockchainError) {
        // If there's a blockchain error, we need to handle it appropriately
        console.error('Blockchain error:', blockchainError);
        // Reset back to form if user declined or there was an error
        setStep('form');
        setIsLoading(false);
        return; // Exit early so we don't proceed to database step
      }

      // Step 6: Update UI state
      setStep('database');

      // Step 7: Save off-chain data to the database
      const requestBody = {
        blockchainBountyId: bountyId,
        description: formData.description,
        distribution: formData.distribution,
        category: formData.category,
        skills:
          Array.isArray(formData.skills) && formData.skills.length > 0
            ? formData.skills
            : ['General'],
        extraRequirements: '',
        owner: publicKey,
        title: formData.title,
        reward: {
          amount: formData.rewardAmount,
          asset: formData.tokenSymbol,
        },
        submissionDeadline: new Date(formData.submissionDeadline).toISOString(),
        deadline: new Date(formData.submissionDeadline).toISOString(),
        status: 'OPEN',
        sponsorName: user?.companyUsername || '',
      };

      const response = await fetch('/api/bounties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      let responseData;
      try {
        const text = await response.text();
        responseData = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            responseData.details ||
            'Failed to save bounty data'
        );
      }

      // Step 8: Complete
      setStep('complete');
      toast.success('Bounty created successfully!', { id: 'submit-work' });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Failed to create bounty: ${errorMessage}`, {
        id: 'submit-work',
      });
      // Reset back to form
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle skill toggle
  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];

      return {
        ...prev,
        skills,
      };
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Bounty Details</h2>

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-white mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white mb-2">Description</label>
            <div className="text-xs text-gray-400 mb-1">
              You can use or edit the template below to help structure your bounty description.
            </div>
            <RichTextEditor
              value={formData.description}
              onChange={handleQuillChange}
              placeholder="Provide a detailed description for your bounty..."
            />
            <p className="text-xs text-gray-400 mt-1">
              Use the rich text editor above to format your bounty description
              with headings, lists, and other formatting.
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-white mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
              required
            >
              <option value="DEVELOPMENT">Development</option>
              <option value="DESIGN">Design</option>
              <option value="MARKETING">Marketing</option>
              <option value="RESEARCH">Research</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-white mb-2">Skills Required</label>
            <div className="flex flex-wrap gap-2">
              {skillsOptions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                    formData.skills.includes(skill)
                      ? 'bg-blue-500/30 text-blue-200 border-blue-500/50'
                      : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                  }`}
                >
                  {skill} {formData.skills.includes(skill) ? '✓' : '+'}
                </button>
              ))}
            </div>
            {formData.skills.length === 0 && (
              <p className="text-xs text-amber-400 mt-2">
                Please select at least one skill.
              </p>
            )}
          </div>

          {/* Token and Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">Token</label>
              <div className="relative">
                <select
                  name="token"
                  value={formData.token}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white appearance-none"
                  required
                >
                  {getCurrentNetwork().tokens.map((token) => (
                    <option key={token.symbol} value={token.address}>
                      {token.name} ({token.symbol})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <img
                    src={
                      getCurrentNetwork().tokens.find(
                        (t) => t.address === formData.token
                      )?.logo || '/images/tokens/usdc.svg'
                    }
                    alt={formData.tokenSymbol}
                    className="h-5 w-5 rounded-full"
                  />
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                USDC is recommended for best compatibility with the Stellar
                network.
              </p>
            </div>
            <div>
              <label className="block text-white mb-2">Reward Amount</label>
              <div className="relative">
                <input
                  type="number"
                  name="rewardAmount"
                  value={formData.rewardAmount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white pr-16"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-300 pointer-events-none bg-white/5 border-l border-white/20 rounded-r-lg">
                  {formData.tokenSymbol}
                </div>
              </div>
            </div>
          </div>

          {/* Deadlines */}
          <div>
            <label className="block text-white mb-2">Submission Deadline</label>
            <div className="relative flex items-center">
              <input
                type="datetime-local"
                name="submissionDeadline"
                value={formData.submissionDeadline}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
                required
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              />
              <div className="absolute right-0 pr-3 text-gray-400 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Select when submissions should close (will be converted to UTC)
            </p>
          </div>

          {/* Winner Count and Distribution */}
          <div>
            <label className="block text-white mb-2">Number of Winners</label>
            <select
              name="winnerCount"
              value={formData.winnerCount}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              <option value={1}>1 Winner</option>
              <option value={2}>2 Winners</option>
              <option value={3}>3 Winners</option>
              <option value={4}>4 Winners</option>
              <option value={5}>5 Winners</option>
            </select>
          </div>

          {/* Distribution Percentages */}
          <div>
            <label className="block text-white mb-2">Reward Distribution</label>
            <div className="space-y-3 mt-3">
              {formData.distribution.map((dist) => (
                <div key={dist.position} className="flex items-center gap-3">
                  <div className="w-24 flex-shrink-0">
                    <span className="text-white">
                      {dist.position === 1
                        ? '1st Place'
                        : dist.position === 2
                        ? '2nd Place'
                        : dist.position === 3
                        ? '3rd Place'
                        : `${dist.position}th Place`}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={dist.percentage}
                    onChange={(e) =>
                      handleDistributionChange(
                        dist.position,
                        parseInt(e.target.value)
                      )
                    }
                    className="w-20 bg-white/5 border border-white/20 rounded-lg px-2 py-1 text-white text-center"
                  />
                  <span className="text-white">%</span>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-white">Total:</span>
                <span
                  className={`font-medium ${
                    validateDistribution() ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {formData.distribution.reduce(
                    (sum, item) => sum + item.percentage,
                    0
                  )}
                  %{!validateDistribution() && ' (Must equal 100%)'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !validateDistribution()}
            className={`w-full font-medium py-3 rounded-lg transition-colors ${
              validateDistribution()
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/50 text-black/70 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Creating Bounty...' : 'Create Bounty'}
          </button>
        </form>
      )}

      {step === 'blockchain' && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">
            Creating bounty on the blockchain...
          </p>
          <p className="text-gray-400 mt-2">
            Please confirm the transaction in your wallet
          </p>
          <div className="mt-6 text-gray-400 text-sm max-w-md mx-auto">
            <p>
              Your wallet should be prompting you to confirm this transaction.
            </p>
            <p className="mt-2">
              If you don't see a wallet popup, please check your wallet
              extension.
            </p>
            <p className="mt-4">
              Confirm the transaction to create your bounty on the Stellar
              blockchain.
            </p>
          </div>
        </div>
      )}

      {step === 'database' && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Saving bounty details...</p>
          <p className="text-gray-400 mt-2">Bounty ID: {blockchainBountyId}</p>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center py-10">
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
            Bounty Created!
          </h3>
          <p className="text-gray-400 mt-2">Bounty ID: {blockchainBountyId}</p>
          <Link
            href={`/bounties/${blockchainBountyId}`}
            className="mt-6 bg-white text-black font-medium py-2 px-6 rounded-lg hover:bg-white/90 transition-colors"
          >
            View Bounty
          </Link>
        </div>
      )}
    </div>
  );
}
