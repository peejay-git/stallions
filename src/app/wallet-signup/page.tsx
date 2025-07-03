'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { motion } from 'framer-motion';
import { TabOption } from '@/components/TabOption';
import WalletConnectionHelper from '@/components/WalletConnectionHelper';
import { SignUpWithWallet } from '@/components/SignUpWithWallet';
import Layout from '@/components/Layout';

type Tab = 'link' | 'create';

export default function WalletSignupPage() {
  const router = useRouter();
  const { isConnected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>('link');
  
  // Redirect if wallet isn't connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  const handleSkip = () => {
    router.push('/');
  };

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-2 text-white text-center">Complete Your Account</h2>
            <p className="text-gray-300 text-center mb-8">
              Your wallet is connected. Now complete your account setup.
            </p>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden shadow-xl mb-8">
              <div className="p-4 bg-white/5 border-b border-white/10">
                <div className="flex">
                  <TabOption
                    label="Link Existing Account"
                    active={activeTab === 'link'}
                    onClick={() => setActiveTab('link')}
                  />
                  <TabOption
                    label="Create New Account"
                    active={activeTab === 'create'}
                    onClick={() => setActiveTab('create')}
                  />
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'link' ? (
                  <WalletConnectionHelper
                    mode="link"
                    onSuccess={handleSuccess}
                    onSkip={handleSkip}
                    showSkip={false}
                  />
                ) : (
                  <SignUpWithWallet
                    onSuccess={handleSuccess}
                    walletAddress={publicKey || ''}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 