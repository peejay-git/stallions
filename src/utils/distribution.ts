export const calculateDefaultPercentage = (position: number, totalWinners: number): number => {
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

export const validateDistribution = (distribution: { percentage: number }[]): boolean => {
  const total = distribution.reduce((sum, item) => sum + item.percentage, 0);
  return total === 100;
};
