// src/components/AppClientWrapper.tsx
'use client';

import { initUserStore } from '@/utils/initUserStore';
import { memo, ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

function AppClientWrapper({ children }: { children: ReactNode }) {
  const [storeInitialized, setStoreInitialized] = useState(false);

  // Initialize user store only once on mount
  useEffect(() => {
    // Check if already initialized to prevent duplicate initializations
    if (typeof window !== 'undefined' && !window.__STORE_INITIALIZED) {
      window.__STORE_INITIALIZED = true;

      try {
        const unsubscribe = initUserStore();
        setStoreInitialized(true);
        
        // Cleanup subscription on unmount
        return () => {
          if (unsubscribe) unsubscribe();
        };
      } catch (error) {
        console.error('Failed to initialize user store:', error);
        // Set initialized anyway to prevent infinite retries
        setStoreInitialized(true);
      }
    } else {
      setStoreInitialized(true);
    }
  }, []);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          // Reduce animation duration for better performance
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            maxWidth: '320px',
          },
        }}
      />
    </>
  );
}

// Add type definition for the global window object
declare global {
  interface Window {
    __STORE_INITIALIZED?: boolean;
  }
}

// Memoize to prevent unnecessary re-renders
export default memo(AppClientWrapper);
