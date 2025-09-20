import { BountyDistribution } from '@/types/bounty';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { defaultDistributions, validateDistribution } from '@/utils/distribution';
import { useState } from 'react';
import { FiPlus, FiTrash } from 'react-icons/fi';

interface DistributionEditorProps {
  value: BountyDistribution[];
  onChange: (distribution: BountyDistribution[]) => void;
  className?: string;
}

export default function DistributionEditor({
  value,
  onChange,
  className = '',
}: DistributionEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDistributionChange = (
    position: number,
    percentage: number
  ) => {
    const newDistribution = value.map((dist) =>
      dist.position === position ? { ...dist, percentage } : dist
    );
    
    const validation = validateDistribution(newDistribution);
    if (!validation.isValid) {
      setError(validation.error);
    } else {
      setError(null);
      onChange(newDistribution);
    }
  };

  const addPosition = () => {
    const newPosition = value.length + 1;
    // Redistribute percentages
    const newPercentage = Math.floor(100 / (value.length + 1));
    const remainingPercentage = 100 - newPercentage;
    
    const newDistribution = [
      ...value.map((dist) => ({
        ...dist,
        percentage: Math.floor((dist.percentage / 100) * remainingPercentage),
      })),
      { position: newPosition, percentage: newPercentage },
    ];

    const validation = validateDistribution(newDistribution);
    if (!validation.isValid) {
      setError(validation.error);
    } else {
      setError(null);
      onChange(newDistribution);
    }
  };

  const removePosition = (position: number) => {
    const remainingDistributions = value.filter(
      (dist) => dist.position !== position
    ).map((dist, index) => ({
      ...dist,
      position: index + 1,
    }));

    // Redistribute percentages
    const totalPercentage = remainingDistributions.reduce(
      (sum, dist) => sum + dist.percentage,
      0
    );
    const multiplier = 100 / totalPercentage;
    
    const newDistribution = remainingDistributions.map((dist) => ({
      ...dist,
      percentage: Math.round(dist.percentage * multiplier),
    }));

    const validation = validateDistribution(newDistribution);
    if (!validation.isValid) {
      setError(validation.error);
    } else {
      setError(null);
      onChange(newDistribution);
    }
  };

  const setPresetDistribution = (preset: keyof typeof defaultDistributions) => {
    onChange(defaultDistributions[preset]);
    setError(null);
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPresetDistribution('single')}
            className="px-3 py-1 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            Single Winner
          </button>
          <button
            type="button"
            onClick={() => setPresetDistribution('dual')}
            className="px-3 py-1 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            Two Winners
          </button>
          <button
            type="button"
            onClick={() => setPresetDistribution('triple')}
            className="px-3 py-1 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            Three Winners
          </button>
        </div>

        <div className="space-y-3">
          {value.map((dist) => (
            <AnimatedContainer
              key={dist.position}
              animation="fadeIn"
              className="flex items-center gap-3"
            >
              <div className="flex-1 bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">
                    {dist.position === 1
                      ? '1st Place'
                      : dist.position === 2
                      ? '2nd Place'
                      : dist.position === 3
                      ? '3rd Place'
                      : `${dist.position}th Place`}
                  </span>
                  {value.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePosition(dist.position)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <FiTrash size={16} />
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={dist.percentage}
                  onChange={(e) =>
                    handleDistributionChange(
                      dist.position,
                      Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    )
                  }
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-1 text-white"
                  min="0"
                  max="100"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {dist.percentage}% of total reward
                </div>
              </div>
            </AnimatedContainer>
          ))}
        </div>

        {value.length < 5 && (
          <button
            type="button"
            onClick={addPosition}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <FiPlus />
            Add Position
          </button>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-900/30 rounded-lg p-3">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
