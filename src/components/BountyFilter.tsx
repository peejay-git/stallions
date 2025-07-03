'use client';

import { useState } from 'react';
import { BountyCategory, BountyStatus } from '@/types/bounty';
import { motion } from 'framer-motion';
import { FiFilter, FiCheckSquare, FiDollarSign, FiTag, FiCpu } from 'react-icons/fi';

type Props = {
  statusFilters: BountyStatus[];
  categoryFilters: BountyCategory[];
  rewardRange: { min: number; max: number | null };
  skills: string[];
  setStatusFilters: React.Dispatch<React.SetStateAction<BountyStatus[]>>;
  setCategoryFilters: React.Dispatch<React.SetStateAction<BountyCategory[]>>;
  setRewardRange: React.Dispatch<React.SetStateAction<{ min: number; max: number | null }>>;
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
  onApply: () => void;
  onReset: () => void;
};

export function BountyFilter({
  statusFilters,
  categoryFilters,
  rewardRange,
  skills,
  setStatusFilters,
  setCategoryFilters,
  setRewardRange,
  setSkills,
  onApply,
  onReset,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>("status");

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
    setStatusFilters([BountyStatus.OPEN]);
    setCategoryFilters([]);
    setRewardRange({ min: 0, max: null });
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
    
    let baseStyle = "flex-1 py-2 px-3 rounded-lg text-center transition-all duration-200 font-medium text-sm border ";
    
    switch (status) {
      case BountyStatus.OPEN:
        return baseStyle + (isActive 
          ? "bg-green-900/40 text-green-300 border-green-700/30"
          : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10");
      case BountyStatus.COMPLETED:
        return baseStyle + (isActive 
          ? "bg-purple-900/40 text-purple-300 border-purple-700/30"
          : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10");
      default:
        return baseStyle + (isActive 
          ? "bg-gray-700/40 text-gray-300 border-gray-600/30"
          : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10");
    }
  };

  // Get status display name
  const getStatusDisplayName = (status: BountyStatus) => {
    switch (status) {
      case BountyStatus.OPEN:
        return "Active";
      case BountyStatus.COMPLETED:
        return "Completed";
      default:
        return status;
    }
  };

  // Only display selected status filters for UI simplicity
  const mainStatusFilters = [BountyStatus.OPEN, BountyStatus.COMPLETED];

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
            onClick={() => setExpanded(expanded === "category" ? null : "category")}
          >
            <span className="font-medium flex items-center">
              <FiTag className="mr-2 text-white/70" />
              Category
            </span>
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${expanded === "category" ? "transform rotate-180" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <motion.div 
            initial={expanded === "category" ? "open" : "closed"}
            animate={expanded === "category" ? "open" : "closed"}
            variants={{
              open: { height: "auto", opacity: 1, marginTop: 8 },
              closed: { height: 0, opacity: 0, marginTop: 0 }
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
                  <label htmlFor={`category-${category}`} className="ml-2 text-gray-300 text-sm">
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </label>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reward range filter */}
        <div className="mb-4">
          <button 
            className="w-full flex items-center justify-between py-2 px-1 text-left focus:outline-none"
            onClick={() => setExpanded(expanded === "reward" ? null : "reward")}
          >
            <span className="font-medium flex items-center">
              <FiDollarSign className="mr-2 text-white/70" />
              Reward Range
            </span>
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${expanded === "reward" ? "transform rotate-180" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <motion.div 
            initial={expanded === "reward" ? "open" : "closed"}
            animate={expanded === "reward" ? "open" : "closed"}
            variants={{
              open: { height: "auto", opacity: 1, marginTop: 8 },
              closed: { height: 0, opacity: 0, marginTop: 0 }
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pl-7 pt-1">
              <div>
                <label htmlFor="min-reward" className="block text-sm text-gray-300 mb-1">
                  Min Reward ($)
                </label>
                <input
                  type="number"
                  id="min-reward"
                  min="0"
                  value={rewardRange.min}
                  onChange={(e) => setRewardRange({ ...rewardRange, min: Number(e.target.value) })}
                  className="input py-1.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="max-reward" className="block text-sm text-gray-300 mb-1">
                  Max Reward ($)
                </label>
                <input
                  type="number"
                  id="max-reward"
                  min="0"
                  value={rewardRange.max || ''}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setRewardRange({ ...rewardRange, max: value });
                  }}
                  className="input py-1.5 text-sm"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Skills filter */}
        <div className="mb-4">
          <button 
            className="w-full flex items-center justify-between py-2 px-1 text-left focus:outline-none"
            onClick={() => setExpanded(expanded === "skills" ? null : "skills")}
          >
            <span className="font-medium flex items-center">
              <FiCpu className="mr-2 text-white/70" />
              Skills
            </span>
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${expanded === "skills" ? "transform rotate-180" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <motion.div 
            initial={expanded === "skills" ? "open" : "closed"}
            animate={expanded === "skills" ? "open" : "closed"}
            variants={{
              open: { height: "auto", opacity: 1, marginTop: 8 },
              closed: { height: 0, opacity: 0, marginTop: 0 }
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
                {['Rust', 'JavaScript', 'React', 'Soroban', 'Smart Contracts', 'Solidity', 'Design'].map((skill) => {
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
                      className={`cursor-pointer px-2 py-1 rounded-full text-xs ${isSelected
                        ? 'bg-white text-black font-medium'
                        : 'bg-white/10 text-gray-200 hover:bg-white/20 border border-white/10'
                        }`}
                    >
                      {skill} {isSelected && "✓"}
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