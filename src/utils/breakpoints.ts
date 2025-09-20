// Breakpoint values in pixels
export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Media query strings for use with CSS-in-JS
export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  '2xl': `@media (min-width: ${breakpoints['2xl']}px)`,
  
  // Max-width queries
  maxXs: `@media (max-width: ${breakpoints.xs - 1}px)`,
  maxSm: `@media (max-width: ${breakpoints.sm - 1}px)`,
  maxMd: `@media (max-width: ${breakpoints.md - 1}px)`,
  maxLg: `@media (max-width: ${breakpoints.lg - 1}px)`,
  maxXl: `@media (max-width: ${breakpoints.xl - 1}px)`,
  max2xl: `@media (max-width: ${breakpoints['2xl'] - 1}px)`,
  
  // Range queries
  xsToSm: `@media (min-width: ${breakpoints.xs}px) and (max-width: ${breakpoints.sm - 1}px)`,
  smToMd: `@media (min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  mdToLg: `@media (min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lgToXl: `@media (min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  xlTo2xl: `@media (min-width: ${breakpoints.xl}px) and (max-width: ${breakpoints['2xl'] - 1}px)`,
  
  // Orientation queries
  portrait: '@media (orientation: portrait)',
  landscape: '@media (orientation: landscape)',
  
  // Device queries
  touch: '@media (hover: none) and (pointer: coarse)',
  mouse: '@media (hover: hover) and (pointer: fine)',
  
  // Dark mode query
  dark: '@media (prefers-color-scheme: dark)',
  light: '@media (prefers-color-scheme: light)',
  
  // Reduced motion query
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
} as const;

// React hook for checking breakpoints
export function useBreakpoint() {
  if (typeof window === 'undefined') {
    return {
      isXs: false,
      isSm: false,
      isMd: false,
      isLg: false,
      isXl: false,
      is2xl: false,
    };
  }

  const isXs = window.matchMedia(`(min-width: ${breakpoints.xs}px)`).matches;
  const isSm = window.matchMedia(`(min-width: ${breakpoints.sm}px)`).matches;
  const isMd = window.matchMedia(`(min-width: ${breakpoints.md}px)`).matches;
  const isLg = window.matchMedia(`(min-width: ${breakpoints.lg}px)`).matches;
  const isXl = window.matchMedia(`(min-width: ${breakpoints.xl}px)`).matches;
  const is2xl = window.matchMedia(`(min-width: ${breakpoints['2xl']}px)`).matches;

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
  };
}

// Container max-widths for each breakpoint
export const containerMaxWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Spacing scale (in pixels) for consistent spacing across the app
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const;

// Grid system configuration
export const grid = {
  columns: 12,
  gap: spacing[4], // 1rem gap by default
  container: {
    padding: {
      xs: spacing[4],
      sm: spacing[6],
      md: spacing[8],
      lg: spacing[10],
      xl: spacing[12],
      '2xl': spacing[16],
    },
  },
} as const;
