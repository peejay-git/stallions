'use client';

import { memo, ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

function AppClientWrapper({ children }: { children: ReactNode }) {
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

// Memoize to prevent unnecessary re-renders
export default memo(AppClientWrapper);
