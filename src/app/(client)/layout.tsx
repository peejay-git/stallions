'use client';

import { ReactNode, memo, useEffect, useState } from 'react';
import { Header } from '@/components/shared';

interface LayoutProps {
  children: ReactNode;
}

const ClientLayout = ({ children }: LayoutProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Ensure content transition is smooth
  useEffect(() => {
    // Only set once to avoid excessive re-renders
    if (!isLoaded) {
      setIsLoaded(true);
    }
    // No cleanup function that changes state - this could cause issues during unmounting
  }, [isLoaded]);

  return (
    <div
      className={`layout-container ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-200`}
    >
      <Header />
      <main className="min-h-screen bg-[#070708] text-white">{children}</main>
    </div>
  );
};

// No need to memoize since it's a layout component
export default ClientLayout;
