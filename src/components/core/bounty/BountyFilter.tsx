'use client';

import { BountyCategory, BountyStatus } from '@/types/bounty';
import { SKILLS_OPTIONS } from '@/utils/constants/bounty';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  FiCheckSquare,
  FiCpu,
  FiDollarSign,
  FiFilter,
  FiTag,
} from 'react-icons/fi';

interface Props {
  statusFilters: BountyStatus[];
  categoryFilters: BountyCategory[];
  assetFilters: string[];
  skills: string[];
  setStatusFilters: (filters: BountyStatus[]) => void;
  setCategoryFilters: (filters: BountyCategory[]) => void;
  setAssetFilters: (assets: string[]) => void;
  setSkills: (skills: string[]) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function BountyFilter({
  statusFilters,
  categoryFilters,
  assetFilters,
  skills,
  setStatusFilters,
  setCategoryFilters,
  setAssetFilters,
  setSkills,
  onApply,
  onReset,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>('status');

  // Toggle status filter
  const toggleStatus = (status: BountyStatus) => {
    if (statusFilters.includes(status)) {
      setStatusFilters(statusFilters.filter((s) => s !== status));
    } else {
      setStatusFilters([...statusFilters, status]);
    }
  };

  // Toggle category filter
  const toggleCategory = (category: BountyCategory) => {
    if (categoryFilters.includes(category)) {
      setCategoryFilters(categoryFilters.filter((c) => c !== category));
    } else {
      setCategoryFilters([...categoryFilters, category]);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setStatusFilters([]);
    setCategoryFilters([]);
    setAssetFilters([]);
    setSkills([]);
    onReset();
  };

  // Handle status filter button
  const handleStatusFilter = (status: BountyStatus) => {
    // If it's the only one selected, don't unselect it
    if (statusFilters.length === 1 && statusFilters.includes(status)) {
      return;
    }
    toggleStatus(status);
  };

  // Get status button styles
  const getStatusButtonStyle = (status: BountyStatus) => {
    const isActive = statusFilters.includes(status);

    let baseStyle =
      'flex-1 py-2 px-3 rounded-lg text-center transition-all duration-200 font-medium text-sm border ';

    switch (status) {
      case BountyStatus.OPEN:
        return (
          baseStyle +
          (isActive
            ? 'bg-green-900/40 text-green-300 border-green-700/30'
            : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10')
        );
      case BountyStatus.IN_PROGRESS:
        return (
          baseStyle +
          (isActive
            ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700/30'
            : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10')
        );
      case BountyStatus.REVIEW:
        return (
          baseStyle +
          (isActive
            ? 'bg-indigo-900/40 text-indigo-300 border-indigo-700/30'
            : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10')
        );
      case BountyStatus.COMPLETED:
        return (
          baseStyle +
          (isActive
            ? 'bg-purple-900/40 text-purple-300 border-purple-700/30'
            : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10')
        );
      case BountyStatus.CANCELLED:
        return (
          baseStyle +
          (isActive
            ? 'bg-red-900/40 text-red-300 border-red-700/30'
            : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10')
        );
      default:
        return (
          baseStyle +
          (isActive
            ? 'bg-gray-700/40 text-gray-300 border-gray-600/30'
            : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10')
        );
    }
  };

  // Get status display name
  const getStatusDisplayName = (status: BountyStatus) => {
    switch (status) {
      case BountyStatus.OPEN:
        return 'Active';
      case BountyStatus.IN_PROGRESS:
        return 'In Progress';
      case BountyStatus.REVIEW:
        return 'In Review';
      case BountyStatus.COMPLETED:
        return 'Completed';
      case BountyStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Only display selected status filters for UI simplicity
  const mainStatusFilters = [
    BountyStatus.OPEN,
    BountyStatus.REVIEW,
    BountyStatus.COMPLETED,


  ];

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden text-white">
      <div className="border-b border-white/10 p-4 flex justify-between items-center">
        <h3 className="font-bold text-lg flex items-center">
          <FiFilter className="mr-2 text-white/70" />
          Filters
        </h3>
        <button
          onClick={resetFilters}
          className="text-sm text-gray-300 hover:text-white transition-colors border border-white/10 py-1 px-3 rounded-lg hover:bg-white/10 bg-white/5"
        >
          Reset All
        </button>
      </div>

      {/* Status filter buttons */}
      <div className="p-4 border-b border-white/10">
        <div className="flex gap-2">
          {mainStatusFilters.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={getStatusButtonStyle(status)}
            >
              {getStatusDisplayName(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion filters */}
      <div className="p-4">
        {/* Category filter */}
        <div className="mb-4">
          <button
            className="w-full flex items-center justify-between py-2 px-1 text-left focus:outline-none"
            onClick={() =>
              setExpanded(expanded === 'category' ? null : 'category')
            }
          >
            <span className="font-medium flex items-center">
              <FiTag className="mr-2 text-white/70" />
              Category
            </span>
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                expanded === 'category' ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <motion.div
            initial={expanded === 'category' ? 'open' : 'closed'}
            animate={expanded === 'category' ? 'open' : 'closed'}
            variants={{
              open: { height: 'auto', opacity: 1, marginTop: 8 },
              closed: { height: 0, opacity: 0, marginTop: 0 },
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pl-7 pt-1">
              {Object.values(BountyCategory).map((category) => (
                <div key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category}`}
                    checked={categoryFilters.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-white focus:ring-white"
                  />
                  <label
                    htmlFor={`category-${category}`}
                    className="ml-2 text-gray-300 text-sm"
                  >
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </label>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Asset filter */}
        <div className="mb-4">
          <button
            className="w-full flex items-center justify-between py-2 px-1 text-left focus:outline-none"
            onClick={() => setExpanded(expanded === 'asset' ? null : 'asset')}
          >
            <span className="font-medium flex items-center">
              <FiDollarSign className="mr-2 text-white/70" />
              Reward Asset
            </span>
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                expanded === 'asset' ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <motion.div
            initial={expanded === 'asset' ? 'open' : 'closed'}
            animate={expanded === 'asset' ? 'open' : 'closed'}
            variants={{
              open: { height: 'auto', opacity: 1, marginTop: 16 },
              closed: { height: 0, opacity: 0, marginTop: 0 },
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {/* Common assets */}
              {['XLM', 'USDC', 'EURC'].map((asset) => (
                <div key={asset} className="flex items-center">
                  <input
                    id={`asset-${asset}`}
                    type="checkbox"
                    className="w-4 h-4 rounded bg-black/30 border-white/20 text-primary-600 focus:ring-primary-500"
                    checked={assetFilters.includes(asset)}
                    onChange={() => {
                      if (assetFilters.includes(asset)) {
                        setAssetFilters(
                          assetFilters.filter((a) => a !== asset)
                        );
                      } else {
                        setAssetFilters([...assetFilters, asset]);
                      }
                    }}
                  />
                  <label
                    htmlFor={`asset-${asset}`}
                    className="ml-2 text-sm font-medium text-gray-200"
                  >
                    {asset}
                  </label>
                </div>
              ))}

              {/* Custom asset input */}
              <div className="pt-2">
                <label className="block mb-1 text-sm font-medium text-gray-200">
                  Other Asset
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="custom-asset"
                    placeholder="Enter asset code"
                    className="bg-black/30 border border-white/20 text-white rounded-lg flex-grow p-2 text-sm focus:ring-primary-600 focus:border-primary-600"
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        (e.target as HTMLInputElement).value
                      ) {
                        const customAsset = (
                          e.target as HTMLInputElement
                        ).value.toUpperCase();
                        if (!assetFilters.includes(customAsset)) {
                          setAssetFilters([...assetFilters, customAsset]);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <button
                    className="bg-white/10 hover:bg-white/20 text-white px-3 rounded-lg"
                    onClick={() => {
                      const input = document.getElementById(
                        'custom-asset'
                      ) as HTMLInputElement;
                      if (input.value) {
                        const customAsset = input.value.toUpperCase();
                        if (!assetFilters.includes(customAsset)) {
                          setAssetFilters([...assetFilters, customAsset]);
                          input.value = '';
                        }
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Selected custom assets */}
              {assetFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {assetFilters.map((asset) => (
                    <div
                      key={asset}
                      className="bg-white/10 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1"
                    >
                      {asset}
                      <button
                        onClick={() =>
                          setAssetFilters(
                            assetFilters.filter((a) => a !== asset)
                          )
                        }
                        className="text-white/70 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Skills filter */}
        <div className="mb-4">
          <button
            className="w-full flex items-center justify-between py-2 px-1 text-left focus:outline-none"
            onClick={() => setExpanded(expanded === 'skills' ? null : 'skills')}
          >
            <span className="font-medium flex items-center">
              <FiCpu className="mr-2 text-white/70" />
              Skills
            </span>
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                expanded === 'skills' ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <motion.div
            initial={expanded === 'skills' ? 'open' : 'closed'}
            animate={expanded === 'skills' ? 'open' : 'closed'}
            variants={{
              open: { height: 'auto', opacity: 1, marginTop: 8 },
              closed: { height: 0, opacity: 0, marginTop: 0 },
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pl-7 pt-1">
              <input
                type="text"
                placeholder="Search skills..."
                className="input py-1.5 text-sm mb-3 w-full"
              />
              <div className="flex flex-wrap gap-2">
                {SKILLS_OPTIONS.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <motion.span
                      key={skill}
                      onClick={() =>
                        setSkills(
                          isSelected
                            ? skills.filter((s) => s !== skill)
                            : [...skills, skill]
                        )
                      }
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`cursor-pointer px-2 py-1 rounded-full text-xs ${
                        isSelected
                          ? 'bg-white text-black font-medium'
                          : 'bg-white/10 text-gray-200 hover:bg-white/20 border border-white/10'
                      }`}
                    >
                      {skill} {isSelected && '✓'}
                    </motion.span>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Apply filters button */}
      <div className="p-4 bg-white/5 border-t border-white/10">
        <motion.button
          className="bg-white text-black font-medium py-2.5 px-4 rounded-lg hover:bg-white/90 transition-colors w-full flex items-center justify-center shadow-lg"
          onClick={onApply}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiCheckSquare className="mr-2" />
          Apply Filters
        </motion.button>
      </div>
    </div>
  );
}
