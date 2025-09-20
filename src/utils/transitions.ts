import { Variants } from 'framer-motion';

// Fade in animation variants
export const fadeIn: Variants = {
  hidden: {
    opacity: [1, 0],
    y: [0, 10],
  } as any,
  visible: {
    opacity: [0, 1],
    y: [10, 0],
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  } as any,
  exit: {
    opacity: [1, 0],
    y: [0, -10],
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  } as any,
};

// Scale animation variants
export const scale: Variants = {
  hidden: {
    opacity: [1, 0],
    scale: [1, 0.95],
  } as any,
  visible: {
    opacity: [0, 1],
    scale: [0.95, 1],
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1], // Custom ease curve for natural feel
    },
  } as any,
  exit: {
    opacity: [1, 0],
    scale: [1, 0.95],
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  } as any,
};

// Slide up animation variants
export const slideUp: Variants = {
  hidden: {
    opacity: [1, 0],
    y: [0, 20],
  } as any,
  visible: {
    opacity: [0, 1],
    y: [20, 0],
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  } as any,
  exit: {
    opacity: [1, 0],
    y: [0, 10],
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  } as any,
};

// Slide in from left animation variants
export const slideInLeft: Variants = {
  hidden: {
    opacity: [1, 0],
    x: [0, -20],
  } as any,
  visible: {
    opacity: [0, 1],
    x: [-20, 0],
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  } as any,
  exit: {
    opacity: [1, 0],
    x: [0, 20],
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  } as any,
};

// Staggered children animation variants
export const staggerContainer: Variants = {
  hidden: {
    opacity: [1, 0],
  } as any,
  visible: {
    opacity: [0, 1],
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  } as any,
  exit: {
    opacity: [1, 0],
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  } as any,
};

// Hover animation variants
export const hoverScale: Variants = {
  hover: {
    scale: [1, 1.02],
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  } as any,
  tap: {
    scale: [1, 0.98],
    transition: {
      duration: 0.1,
      ease: 'easeInOut',
    },
  } as any,
};

// Button press animation variants
export const buttonPress: Variants = {
  hover: {
    scale: [1, 1.02],
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  } as any,
  tap: {
    scale: [1, 0.95],
    transition: {
      duration: 0.1,
      ease: 'easeInOut',
    },
  } as any,
};

// List item animation variants
export const listItem: Variants = {
  hidden: {
    opacity: [1, 0],
    x: [0, -20],
  } as any,
  visible: {
    opacity: [0, 1],
    x: [-20, 0],
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  } as any,
  exit: {
    opacity: [1, 0],
    x: [0, 20],
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  } as any,
};

// Modal animation variants
export const modalVariants: Variants = {
  hidden: {
    opacity: [1, 0],
    scale: [1, 0.95],
    y: [0, -20],
  } as any,
  visible: {
    opacity: [0, 1],
    scale: [0.95, 1],
    y: [-20, 0],
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  } as any,
  exit: {
    opacity: [1, 0],
    scale: [1, 0.95],
    y: [0, 10],
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  } as any,
};

// Modal backdrop animation variants
export const backdropVariants: Variants = {
  hidden: {
    opacity: [1, 0],
  } as any,
  visible: {
    opacity: [0, 1],
    transition: {
      duration: 0.2,
    },
  } as any,
  exit: {
    opacity: [1, 0],
    transition: {
      duration: 0.2,
      delay: 0.1,
    },
  } as any,
};
