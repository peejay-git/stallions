'use client';

import useAuthStore from '@/lib/stores/auth.store';
import { motion } from 'framer-motion';
import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileCompletionModal({
  isOpen,
  onClose,
}: ProfileCompletionModalProps) {
  const { user, updateUserProfile } = useAuthStore((state) => state);
  const [formData, setFormData] = useState({
    firstName: user?.profileData?.firstName || '',
    username: user?.profileData?.username || '',
    // Add more fields based on user role
    ...(user?.role === 'sponsor'
      ? {
          companyName: user?.profileData?.companyName || '',
          industry: user?.profileData?.industry || '',
          shortBio: user?.profileData?.shortBio || '',
        }
      : {}),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.profileData?.firstName || '',
        username: user.profileData?.username || '',
        ...(user.role === 'sponsor'
          ? {
              companyName: user.profileData?.companyName || '',
              industry: user.profileData?.industry || '',
              shortBio: user.profileData?.shortBio || '',
            }
          : {}),
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateUserProfile(formData);
      toast.success('Profile updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md p-6 bg-[#0c0c0d] rounded-xl border border-white/10 backdrop-blur-sm shadow-xl overflow-hidden"
      >
        <h2 className="text-2xl font-bold text-white mb-6">
          Complete Your Profile
        </h2>

        <p className="text-gray-400 mb-4">
          Please provide the following information to complete your profile.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-gray-300 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Your first name"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Choose a username"
            />
          </div>

          {/* Sponsor specific fields */}
          {user.role === 'sponsor' && (
            <>
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-gray-300 mb-1"
                >
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={(formData as any).companyName || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label htmlFor="industry" className="block text-gray-300 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  value={(formData as any).industry || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="e.g. Finance, Technology"
                />
              </div>

              <div>
                <label htmlFor="shortBio" className="block text-gray-300 mb-1">
                  Short Bio
                </label>
                <textarea
                  id="shortBio"
                  name="shortBio"
                  value={(formData as any).shortBio || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  rows={3}
                  placeholder="Tell us about your company"
                ></textarea>
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
