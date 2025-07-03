'use client';

import { ReactNode, memo, useEffect, useState } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Ensure content transition is smooth
  useEffect(() => {
    setIsLoaded(true);
    // Cleanup function
    return () => setIsLoaded(false);
  }, []);

  return (
    <div className={`layout-container ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
      <Header />
      <main className="min-h-screen bg-[#070708] text-white">
        {children}
      </main>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(Layout); 