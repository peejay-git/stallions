import { BountyDistribution } from '@/types/bounty';

export const PLATFORM_FEE_PERCENTAGE = 5; // 5% platform fee

interface DistributionCalculation {
  winnerAmount: number;
  platformFee: number;
}

export function calculateDistribution(
  totalAmount: number,
  distribution: BountyDistribution[]
): DistributionCalculation[] {
  // Calculate platform fee
  const platformFeeAmount = (totalAmount * PLATFORM_FEE_PERCENTAGE) / 100;
  const amountAfterFee = totalAmount - platformFeeAmount;

  // Sort distribution by position to ensure correct order
  const sortedDistribution = [...distribution].sort((a, b) => a.position - b.position);

  return sortedDistribution.map((dist) => {
    const winnerAmount = (amountAfterFee * dist.percentage) / 100;
    return {
      winnerAmount,
      platformFee: (winnerAmount * PLATFORM_FEE_PERCENTAGE) / 100,
    };
  });
}

export function validateDistribution(distribution: BountyDistribution[]): {
  isValid: boolean;
  error?: string;
} {
  // Check if distribution is empty
  if (!distribution.length) {
    return { isValid: false, error: 'Distribution cannot be empty' };
  }

  // Check if positions are unique and sequential
  const positions = distribution.map((d) => d.position).sort((a, b) => a - b);
  const expectedPositions = Array.from(
    { length: positions.length },
    (_, i) => i + 1
  );
  if (!positions.every((p, i) => p === expectedPositions[i])) {
    return {
      isValid: false,
      error: 'Distribution positions must be sequential starting from 1',
    };
  }

  // Check if percentages sum to 100
  const totalPercentage = distribution.reduce(
    (sum, dist) => sum + dist.percentage,
    0
  );
  if (Math.abs(totalPercentage - 100) > 0.01) {
    return {
      isValid: false,
      error: 'Distribution percentages must sum to 100%',
    };
  }

  // Check if any percentage is negative or zero
  if (distribution.some((dist) => dist.percentage <= 0)) {
    return {
      isValid: false,
      error: 'Distribution percentages must be positive',
    };
  }

  return { isValid: true };
}

export function formatDistributionAmount(
  amount: number,
  asset: string,
  includeSymbol = true
): string {
  const formattedAmount = amount.toFixed(2);
  if (!includeSymbol) return formattedAmount;

  const symbols: Record<string, string> = {
    USDC: '$',
    XLM: '★',
    EURC: '€',
    NGNC: 'N',
    KALE: 'K',
  };

  return `${symbols[asset] || ''}${formattedAmount} ${asset}`;
}

export const defaultDistributions = {
  single: [{ position: 1, percentage: 100 }],
  dual: [
    { position: 1, percentage: 70 },
    { position: 2, percentage: 30 },
  ],
  triple: [
    { position: 1, percentage: 50 },
    { position: 2, percentage: 30 },
    { position: 3, percentage: 20 },
  ],
} as const;

export function getDistributionLabel(distribution: BountyDistribution[]): string {
  if (distribution.length === 1) return 'Winner takes all';
  return `${distribution.length} winners`;
}

export function getPositionLabel(position: number): string {
  const suffixes = ['st', 'nd', 'rd'];
  const specialSuffix = position <= 3 ? suffixes[position - 1] : 'th';
  return `${position}${specialSuffix} Place`;
}