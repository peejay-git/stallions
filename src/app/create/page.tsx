'use client';

import { CreateBountyForm, Layout } from '@/components';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import useAuthStore from '@/lib/stores/auth.store';
import Link from 'next/link';
import { IoInformationCircleOutline } from 'react-icons/io5';

export default function CreateBountyPage() {
  useProtectedRoute();
  const user = useAuthStore((state) => state.user);

  if (!user || user.role !== 'sponsor') {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <IoInformationCircleOutline className="text-red-300 text-2xl flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Sponsor Account Required
                  </h3>
                  <p className="text-red-200 mb-4">
                    Only sponsors can create bounties. Please register as a
                    sponsor to continue.
                  </p>
                  <Link
                    href={`/register?role=sponsor&redirect=${encodeURIComponent(
                      '/create'
                    )}`}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Register as Sponsor
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Create a New Bounty
            </h1>
            <p className="text-gray-300 text-lg">
              Post a bounty and get talented developers to work on your project
            </p>
          </div>

          {/* How it works info box */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <IoInformationCircleOutline className="text-blue-300 text-2xl flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  How Bounty Creation Works
                </h3>
                <p className="text-blue-200 leading-relaxed">
                  When you create a bounty, you'll need to pay the reward amount
                  and transaction fees. The reward will be locked in a smart
                  contract until the work is completed and ranked.
                </p>
              </div>
            </div>
          </div>

          {/* Create bounty form */}
          <CreateBountyForm />
        </div>
      </div>
    </Layout>
  );
}
