'use client';

import {
  BountyCard,
  BountyCardSkeleton,
  BountyFilter,
  Layout,
} from '@/components';
import { getAllBounties, getFilteredBounties } from '@/lib/bounties';
import { Bounty, BountyCategory, BountyStatus } from '@/types/bounty';
import { useEffect, useMemo, useState } from 'react';

// Define a type that matches the actual shape of bounties returned from the API
interface ApiBounty {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  skills?: string[];
  reward?: {
    amount: string;
    asset: string;
  };
  status?: string;
  deadline?: string;
  owner?: string;
  createdAt?:
    | {
        seconds: number;
        nanoseconds: number;
      }
    | string;
  updatedAt?: any;
}

// Convert API bounty to the format expected by BountyCard
const adaptBounty = (apiBounty: ApiBounty): Bounty => {
  return {
    id: parseInt(apiBounty.id) || 0,
    owner: apiBounty.owner || '',
    title: apiBounty.title || '',
    description: apiBounty.description || '',
    reward: apiBounty.reward || { amount: '0', asset: 'USDC' },
    distribution: [],
    submissionDeadline: 0,
    status: (apiBounty.status as BountyStatus) || BountyStatus.OPEN,
    category: (apiBounty.category as BountyCategory) || BountyCategory.OTHER,
    skills: apiBounty.skills || [],
    created:
      typeof apiBounty.createdAt === 'string'
        ? apiBounty.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof apiBounty.updatedAt === 'string'
        ? apiBounty.updatedAt
        : new Date().toISOString(),
    deadline: apiBounty.deadline || new Date().toISOString(),
  };
};

export default function BountiesPage() {
  const [bounties, setBounties] = useState<ApiBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilters, setStatusFilters] = useState<BountyStatus[]>([
    BountyStatus.OPEN,
  ]);
  const [categoryFilters, setCategoryFilters] = useState<BountyCategory[]>([]);
  const [rewardRange, setRewardRange] = useState<{
    min: number;
    max: number | null;
  }>({ min: 0, max: null });
  const [skills, setSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const itemsPerPage = 10; // Show 10 bounties per page

  // Handle window resize and initial client-side mounted state
  useEffect(() => {
    setIsMounted(true);
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const applyFilters = async () => {
    setLoading(true);

    try {
      const filtered = await getFilteredBounties({
        statusFilters: statusFilters.map(
          (status) => status as 'OPEN' | 'CLOSE'
        ),
        categoryFilters,
        rewardRange: {
          min: rewardRange.min,
          max: rewardRange.max ?? undefined,
        },
        skills,
      });
      setBounties(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setLoading(true);
    getAllBounties()
      .then(setBounties)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getAllBounties()
      .then(setBounties)
      .finally(() => setLoading(false));
  }, []);

  // Filter bounties based on selected filter and completed status
  const filteredBounties = useMemo(() => {
    let filtered = bounties;

    // Apply category filter if selected
    if (filter) {
      filtered = filtered.filter((bounty) => bounty.category === filter);
    }

    // Check if bounties are completed (either by status or by passed deadline)
    const isCompleted = (bounty: any) => {
      // Completed by status
      if (bounty.status?.toUpperCase() === BountyStatus.COMPLETED) return true;

      // Completed by passed deadline
      if (bounty.deadline && typeof bounty.deadline === 'string') {
        const deadline = new Date(bounty.deadline).getTime();
        const now = Date.now();
        return now > deadline;
      }

      return false;
    };

    // Filter based on status filters
    if (
      statusFilters.includes(BountyStatus.OPEN) &&
      !statusFilters.includes(BountyStatus.COMPLETED)
    ) {
      filtered = filtered.filter((bounty) => !isCompleted(bounty));
    } else if (
      !statusFilters.includes(BountyStatus.OPEN) &&
      statusFilters.includes(BountyStatus.COMPLETED)
    ) {
      filtered = filtered.filter((bounty) => isCompleted(bounty));
    }

    return filtered;
  }, [bounties, filter, statusFilters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredBounties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBounties = filteredBounties.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of bounty list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="min-h-screen pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
          {/* Header section */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Browse Bounties
            </h1>
            <p className="text-gray-300">
              Find and apply for bounties that match your skills
            </p>
          </div>

          {/* Mobile filter toggle */}
          <div className="lg:hidden flex justify-between items-center mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white/10 text-white py-2 px-4 rounded-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4h12m-12 0V8m30 0v8"
                />
              </svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300 whitespace-nowrap">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/10 border-white/20 text-white rounded-lg text-sm px-2 py-1.5"
              >
                <option value="newest">Newest</option>
                <option value="reward-high">Highest Reward</option>
                <option value="reward-low">Lowest Reward</option>
                <option value="deadline">Deadline (Soon)</option>
              </select>
            </div>
          </div>

          {/* Search and filter section */}
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {/* Filter sidebar - make it fixed on desktop */}
            <div
              className={`lg:w-1/4 ${
                showFilters || (isMounted && windowWidth >= 1024)
                  ? 'block'
                  : 'hidden'
              }`}
            >
              <div className="lg:sticky lg:top-8">
                <BountyFilter
                  statusFilters={statusFilters}
                  categoryFilters={categoryFilters}
                  rewardRange={rewardRange}
                  skills={skills}
                  setStatusFilters={setStatusFilters}
                  setCategoryFilters={setCategoryFilters}
                  setRewardRange={setRewardRange}
                  setSkills={setSkills}
                  onApply={() => {
                    applyFilters();
                    if (isMounted && windowWidth < 1024) setShowFilters(false);
                  }}
                  onReset={onReset}
                />
              </div>
            </div>

            {/* Bounty listing - make it scrollable */}
            <div className="lg:w-3/4 max-h-screen overflow-y-auto">
              {/* Search bar and desktop sorting options */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="relative flex-grow max-w-md">
                  <input
                    type="text"
                    placeholder="Search bounties..."
                    className="input pl-10 w-full bg-white/10 border-white/20 text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-sm text-gray-300 whitespace-nowrap">
                    Sort by:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/10 border-white/20 text-white rounded-lg text-sm px-2 py-1.5"
                  >
                    <option value="newest">Newest</option>
                    <option value="reward-high">Highest Reward</option>
                    <option value="reward-low">Lowest Reward</option>
                    <option value="deadline">Deadline (Soon)</option>
                  </select>
                </div>
              </div>

              {/* Bounty count */}
              <div className="mb-6">
                <p className="text-gray-300">
                  Showing{' '}
                  <span className="font-medium text-white">
                    {filteredBounties.length}
                  </span>{' '}
                  bounties
                </p>
              </div>

              {/* Bounty cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <BountyCardSkeleton key={i} />
                  ))
                ) : filteredBounties.length === 0 ? (
                  <p className="text-center text-white col-span-2">
                    No bounties found
                  </p>
                ) : (
                  paginatedBounties.map((bounty) => (
                    <BountyCard key={bounty.id} bounty={adaptBounty(bounty)} />
                  ))
                )}
              </div>

              {/* Pagination */}
              {filteredBounties.length > itemsPerPage && (
                <div className="mt-8 flex justify-center">
                  <nav className="inline-flex rounded-md shadow-sm">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-l-md bg-white/10 text-white border border-white/20 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 border border-white/20 ${
                            currentPage === page
                              ? 'bg-white text-black'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-r-md bg-white/10 text-white border border-white/20 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
