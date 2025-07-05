import { db } from '@/lib/firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from '@/lib/firestore';
import { BountyCategory, BountyStatus } from '@/types/bounty';
import { NextRequest, NextResponse } from 'next/server';

// Seed data for completed bounties with winners
const MOCK_COMPLETED_BOUNTIES = [
  {
    id: '9001',
    title: 'Build a Decentralized Exchange UI',
    description:
      'Create a modern and intuitive user interface for a decentralized exchange on Stellar. The UI should support token swaps, liquidity provision, and position management.',
    reward: {
      amount: '5000',
      asset: 'USDC',
    },
    distribution: [
      { position: 1, percentage: 60 },
      { position: 2, percentage: 30 },
      { position: 3, percentage: 10 },
    ],
    submissionDeadline: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    judgingDeadline: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
    status: BountyStatus.COMPLETED,
    category: BountyCategory.DEVELOPMENT,
    skills: ['React', 'TypeScript', 'Web3', 'UI/UX'],
    created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    updatedAt: new Date().toISOString(),
    deadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    owner: 'sponsor_address_1',
    winnerCount: 3,
  },
  {
    id: '9002',
    title: 'Create a Stellar Wallet Browser Extension',
    description:
      'Develop a browser extension wallet for Stellar that supports multiple accounts, asset management, and transaction signing. The wallet should be secure and user-friendly.',
    reward: {
      amount: '8000',
      asset: 'XLM',
    },
    distribution: [
      { position: 1, percentage: 70 },
      { position: 2, percentage: 30 },
    ],
    submissionDeadline: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
    judgingDeadline: Date.now() - 25 * 24 * 60 * 60 * 1000, // 25 days ago
    status: BountyStatus.COMPLETED,
    category: BountyCategory.DEVELOPMENT,
    skills: [
      'JavaScript',
      'Browser Extensions',
      'Stellar SDK',
      'Crypto Wallets',
    ],
    created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
    updatedAt: new Date().toISOString(),
    deadline: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
    owner: 'sponsor_address_2',
    winnerCount: 2,
  },
  {
    id: '9003',
    title: 'Design a Soroban Smart Contract Educational Website',
    description:
      'Design a comprehensive educational website for teaching developers how to build smart contracts on Soroban. Include interactive tutorials, visual guides, and example code.',
    reward: {
      amount: '3500',
      asset: 'USDC',
    },
    distribution: [
      { position: 1, percentage: 50 },
      { position: 2, percentage: 25 },
      { position: 3, percentage: 15 },
      { position: 4, percentage: 10 },
    ],
    submissionDeadline: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
    judgingDeadline: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    status: BountyStatus.COMPLETED,
    category: BountyCategory.DESIGN,
    skills: ['UI/UX', 'Web Design', 'Educational Content', 'Figma'],
    created: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), // 50 days ago
    updatedAt: new Date().toISOString(),
    deadline: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    owner: 'sponsor_address_3',
    winnerCount: 4,
  },
  {
    id: '9004',
    title: 'Research on Stellar Blockchain Adoption in Emerging Markets',
    description:
      'Conduct comprehensive research on the adoption of Stellar blockchain in emerging markets, focusing on use cases, challenges, and growth opportunities.',
    reward: {
      amount: '2500',
      asset: 'USDC',
    },
    distribution: [{ position: 1, percentage: 100 }],
    submissionDeadline: Date.now() - 25 * 24 * 60 * 60 * 1000, // 25 days ago
    judgingDeadline: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
    status: BountyStatus.COMPLETED,
    category: BountyCategory.RESEARCH,
    skills: [
      'Market Research',
      'Data Analysis',
      'Blockchain Knowledge',
      'Report Writing',
    ],
    created: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(), // 55 days ago
    updatedAt: new Date().toISOString(),
    deadline: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    owner: 'sponsor_address_4',
    winnerCount: 1,
  },
  {
    id: '9005',
    title: 'Develop a Soroban Token Vesting Contract',
    description:
      'Implement a token vesting smart contract on Soroban that supports multiple vesting schedules, cliff periods, and flexible withdrawal options for token recipients.',
    reward: {
      amount: '7500',
      asset: 'XLM',
    },
    distribution: [
      { position: 1, percentage: 40 },
      { position: 2, percentage: 30 },
      { position: 3, percentage: 15 },
      { position: 4, percentage: 10 },
      { position: 5, percentage: 5 },
    ],
    submissionDeadline: Date.now() - 35 * 24 * 60 * 60 * 1000, // 35 days ago
    judgingDeadline: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
    status: BountyStatus.COMPLETED,
    category: BountyCategory.DEVELOPMENT,
    skills: ['Rust', 'Smart Contracts', 'Soroban', 'Token Standards'],
    created: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(), // 70 days ago
    updatedAt: new Date().toISOString(),
    deadline: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
    owner: 'sponsor_address_5',
    winnerCount: 5,
  },
];

// Mock submissions for each bounty
const createMockSubmissions = (bountyId: string, winnerCount: number) => {
  const submissions = [];

  for (let i = 1; i <= winnerCount + 2; i++) {
    // Add 2 extra submissions that didn't win
    submissions.push({
      id: `submission_${bountyId}_${i}`,
      bountyId,
      applicant: `winner_${i}_address`,
      content: `Submission content for bounty ${bountyId} by applicant ${i}`,
      created: new Date(
        Date.now() - (30 + i) * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: 'COMPLETED',
      ranking: i <= winnerCount ? i : null, // Only winners have rankings
    });
  }

  return submissions;
};

/**
 * GET /api/seed
 * Seeds the database with mock bounty data for testing
 */
export async function GET(request: NextRequest) {
  try {
    // Clear existing mock data if ?clear=true
    const searchParams = request.nextUrl.searchParams;
    const shouldClear = searchParams.get('clear') === 'true';

    if (shouldClear) {
      // Clear existing mock bounties
      const bountyRef = collection(db, 'bounties');
      const mockBountyQuery = query(bountyRef, where('id', '>=', '9000'));
      const mockBounties = await getDocs(mockBountyQuery);

      for (const bountyDoc of mockBounties.docs) {
        await deleteDoc(doc(db, 'bounties', bountyDoc.id));
      }

      // Clear existing mock submissions
      const submissionRef = collection(db, 'submissions');
      const mockSubmissionQuery = query(
        submissionRef,
        where('bountyId', '>=', '9000')
      );
      const mockSubmissions = await getDocs(mockSubmissionQuery);

      for (const submissionDoc of mockSubmissions.docs) {
        await deleteDoc(doc(db, 'submissions', submissionDoc.id));
      }

      return NextResponse.json({ success: true, message: 'Mock data cleared' });
    }

    // Seed bounties
    for (const bounty of MOCK_COMPLETED_BOUNTIES) {
      await setDoc(doc(db, 'bounties', bounty.id), bounty);

      // Create and seed submissions for this bounty
      const submissions = createMockSubmissions(bounty.id, bounty.winnerCount);
      for (const submission of submissions) {
        await setDoc(doc(db, 'submissions', submission.id), submission);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Mock data seeded successfully',
      data: {
        bounties: MOCK_COMPLETED_BOUNTIES.length,
        submissions: MOCK_COMPLETED_BOUNTIES.reduce(
          (acc, bounty) => acc + bounty.winnerCount + 2,
          0
        ),
      },
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
