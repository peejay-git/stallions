import { containerMaxWidths, grid } from '@/utils/breakpoints';
import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  maxWidth?: keyof typeof containerMaxWidths | 'full' | 'none';
  padding?: boolean;
  className?: string;
}

export default function Container({
  children,
  maxWidth = 'lg',
  padding = true,
  className = '',
}: ContainerProps) {
  // Base container styles
  const baseStyles = 'w-full mx-auto';

  // Max width styles
  const maxWidthStyles = maxWidth === 'full' || maxWidth === 'none'
    ? ''
    : `max-w-[${containerMaxWidths[maxWidth]}]`;

  // Padding styles based on breakpoints
  const paddingStyles = padding
    ? `
      px-[${grid.container.padding.xs}]
      sm:px-[${grid.container.padding.sm}]
      md:px-[${grid.container.padding.md}]
      lg:px-[${grid.container.padding.lg}]
      xl:px-[${grid.container.padding.xl}]
      2xl:px-[${grid.container.padding['2xl']}]
    `
    : '';

  return (
    <div className={`${baseStyles} ${maxWidthStyles} ${paddingStyles} ${className}`}>
      {children}
    </div>
  );
}

// Grid container component
interface GridContainerProps extends ContainerProps {
  columns?: number;
  gap?: keyof typeof grid.gap;
}

export function GridContainer({
  children,
  maxWidth = 'lg',
  padding = true,
  columns = grid.columns,
  gap = 4,
  className = '',
}: GridContainerProps) {
  return (
    <Container maxWidth={maxWidth} padding={padding} className={className}>
      <div
        className={`grid grid-cols-${columns} gap-[${grid.gap}] ${className}`}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: grid.gap,
        }}
      >
        {children}
      </div>
    </Container>
  );
}

// Flex container component
interface FlexContainerProps extends ContainerProps {
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  items?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: keyof typeof grid.gap;
}

export function FlexContainer({
  children,
  maxWidth = 'lg',
  padding = true,
  direction = 'row',
  wrap = 'wrap',
  justify = 'start',
  items = 'start',
  gap = 4,
  className = '',
}: FlexContainerProps) {
  const flexStyles = `
    flex
    flex-${direction}
    flex-${wrap}
    justify-${justify}
    items-${items}
    gap-[${grid.gap}]
  `;

  return (
    <Container maxWidth={maxWidth} padding={padding} className={className}>
      <div className={`${flexStyles} ${className}`}>
        {children}
      </div>
    </Container>
  );
}
