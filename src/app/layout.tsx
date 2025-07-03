import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { WalletProvider } from '@/hooks/useWallet';
import AppClientWrapper from '@/components/AppClientWrapper';
import Script from 'next/script';

// Use font with subset to reduce bundle size
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Improves perceived loading time
  preload: true,
});

export const metadata: Metadata = {
  title: 'Stallion',
  description: 'A Web3 platform powered by Stellar and Soroban',
  icons: {
    icon: '/logonew.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload essential assets */}
        <link rel="preload" href="/images/unicorn-logo.svg" as="image" />
        
        {/* Preload Albedo script for faster wallet detection */}
        <link 
          rel="preload" 
          href="https://albedo.link/albedo-intent.js" 
          as="script" 
          crossOrigin="anonymous"
        />
        
        {/* Load Albedo script with appropriate strategy for wallet functionality */}
        <Script 
          src="https://albedo.link/albedo-intent.js" 
          strategy="afterInteractive"
          id="albedo-script"
        />
      </head>
      <body className={`${inter.className} bg-[#070708]`}>
        <WalletProvider>
          <AppClientWrapper>
            {children}
          </AppClientWrapper>
        </WalletProvider>
      </body>
    </html>
  );
} 