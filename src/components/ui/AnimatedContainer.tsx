import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import * as transitions from '@/utils/transitions';

interface AnimatedContainerProps {
  children: ReactNode;
  animation?: keyof typeof transitions;
  className?: string;
  delay?: number;
  duration?: number;
  as?: keyof JSX.IntrinsicElements;
}

export default function AnimatedContainer({
  children,
  animation = 'fadeIn',
  className = '',
  delay = 0,
  duration,
  as = 'div',
}: AnimatedContainerProps) {
  // Get the animation variants from our transitions
  const variants = transitions[animation] as Variants;

  // Create a new variant object with the modified transition
  const customVariants: Variants = {
    hidden: variants.hidden,
    exit: variants.exit,
    visible: {
      opacity: [0, 1],
      y: [10, 0],
      transition: {
        duration: duration || 0.4,
        delay,
        type: "tween",
        ease: "easeOut",
      },
    } as any,
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={customVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered list container that animates children with a delay
export function AnimatedList({
  children,
  className = '',
  itemClassName = '',
  delay = 0,
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  delay?: number;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        ...transitions.staggerContainer,
        visible: {
          ...transitions.staggerContainer.visible,
          transition: {
            ...transitions.staggerContainer.visible?.transition,
            delayChildren: delay,
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div
              key={index}
              variants={transitions.listItem}
              className={itemClassName}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}

// Button with press animation
export function AnimatedButton({
  children,
  className = '',
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : "hover"}
      whileTap={disabled ? undefined : "tap"}
      variants={transitions.buttonPress}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// Card with hover animation
export function AnimatedCard({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover="hover"
      whileTap="tap"
      variants={transitions.hoverScale}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}
