"use client";

import ModalPortal from '@/components/core/auth/ModalPortal';
import { useWallet } from '@/hooks/useWallet';
import { onboardSponsor, onboardTalent } from '@/lib/authService';
import { UserProfile } from '@/types/auth.types';
import { StrKey } from '@stellar/stellar-base';
import clsx from 'clsx';
import { FirebaseError } from 'firebase/app';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from "react-hot-toast";
import { IoClose } from 'react-icons/io5';
import {
  SponsorFieldErrors,
  SponsorOnboardingForm,
  SponsorOnboardingFormDataType,
  TalentFieldErrors,
  TalentOnboardingForm,
  TalentOnboardingFormDataType,
} from './onboard';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  selectedRole?: 'talent' | 'sponsor' | null;
};

type SocialLink = {
  platform: string;
  username: string;
};

export default function OnboardModal({
  isOpen,
  onClose,
  selectedRole,
  user,
}: Props) {
  const router = useRouter();
  const location = usePathname();
  const { connect } = useWallet();

  // For talent form
  const [talentFormData, setTalentFormData] =
    useState<TalentOnboardingFormDataType>({
      username: '',
      walletAddress: '',
      location: '',
      skills: [],
      socials: [{ platform: 'twitter', username: '' }],
    });
  const [talentFieldErrors, setTalentFieldErrors] = useState<TalentFieldErrors>(
    {}
  );

  // For sponsor form
  const [sponsorFormData, setSponsorFormData] =
    useState<SponsorOnboardingFormDataType>({
      username: '',
      telegram: '',
      profileImage: null,
      companyName: '',
      companyUsername: '',
      companyUrl: '',
      companyTwitter: '',
      entityName: '',
      companyLogo: null,
      industry: '',
      shortBio: '',
      walletAddress: '',
    });
  const [sponsorFieldErrors, setSponsorFieldErrors] =
    useState<SponsorFieldErrors>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'wallet'>('form');

  // Determine which role to use
  const role = (selectedRole || user?.role)!;

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  // Talent form handlers
  const handleTalentFieldChange = (name: string, value: any) => {
    setTalentFormData((prev: TalentOnboardingFormDataType) => ({
      ...prev,
      [name]: value,
    }));

    // Basic validation
    let error = '';
    if (['username'].includes(name) && !value.trim()) {
      error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
    }
    if (name === 'skills' && value.length === 0) {
      error = 'Please select at least one skill.';
    }

    setTalentFieldErrors((prev: TalentFieldErrors) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setTalentFormData((prev: TalentOnboardingFormDataType) => {
      const updatedSkills = prev.skills.includes(skill)
        ? prev.skills.filter((s: string) => s !== skill)
        : [...prev.skills, skill];

      return { ...prev, skills: updatedSkills };
    });

    // Clear skill error if skills are selected
    if (talentFieldErrors.skills && talentFormData.skills.length > 0) {
      setTalentFieldErrors((prev: TalentFieldErrors) => ({
        ...prev,
        skills: '',
      }));
    }
  };

  const handleSocialChange = (index: number, field: string, value: string) => {
    setTalentFormData((prev: TalentOnboardingFormDataType) => {
      const updatedSocials = [...prev.socials];
      updatedSocials[index] = {
        ...updatedSocials[index],
        [field]: value,
      };
      return { ...prev, socials: updatedSocials };
    });
  };

  const handleAddSocial = () => {
    const platforms = ['twitter', 'linkedin', 'github'];
    const usedPlatforms = talentFormData.socials.map(
      (s: SocialLink) => s.platform
    );
    const availablePlatforms = platforms.filter(
      (p: string) => !usedPlatforms.includes(p)
    );

    if (availablePlatforms.length > 0) {
      setTalentFormData((prev: TalentOnboardingFormDataType) => ({
        ...prev,
        socials: [
          ...prev.socials,
          { platform: availablePlatforms[0], username: '' },
        ],
      }));
    }
  };

  const handleRemoveSocial = (index: number) => {
    setTalentFormData((prev: TalentOnboardingFormDataType) => {
      const updatedSocials = [...prev.socials];
      updatedSocials.splice(index, 1);
      return { ...prev, socials: updatedSocials };
    });
  };

  // Sponsor form handlers
  const handleSponsorFieldChange = (name: string, value: any) => {
    setSponsorFormData((prev: SponsorOnboardingFormDataType) => ({
      ...prev,
      [name]: value,
    }));

    // Basic validation
    let error = '';
    if (
      ['firstName', 'lastName', 'username', 'email', 'companyName'].includes(
        name
      ) &&
      !value.trim()
    ) {
      error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
    }

    if (
      name === 'companyUrl' &&
      value.trim() &&
      !value.startsWith('https://')
    ) {
      error = 'Company URL must start with https://.';
    }

    setSponsorFieldErrors((prev: SponsorFieldErrors) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSponsorFileChange = (name: string, file: File | null) => {
    setSponsorFormData((prev: SponsorOnboardingFormDataType) => ({
      ...prev,
      [name]: file,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (role === 'talent') {
      // Talent form validation
      const errors: TalentFieldErrors = {};

      if (!talentFormData.username.trim())
        errors.username = 'Username is required.';
      if (talentFormData.skills.length === 0)
        errors.skills = 'Please select at least one skill.';
      if (!StrKey.isValidEd25519PublicKey(talentFormData.walletAddress))
        errors.walletAddress = 'Please enter a valid wallet address.';

      if (Object.keys(errors).length) {
        setTalentFieldErrors(errors);
        return;
      }
    } else {
      // Sponsor form validation
      const errors: SponsorFieldErrors = {};
      if (!sponsorFormData.username.trim())
        errors.username = 'Username is required.';
      if (!sponsorFormData.companyName.trim())
        errors.companyName = 'Company Name is required.';
      if (!sponsorFormData.companyUsername.trim())
        errors.companyUsername = 'Company Username is required.';
      if (
        sponsorFormData.companyUrl &&
        !sponsorFormData.companyUrl.startsWith('https://')
      )
        errors.companyUrl = 'Company URL must start with https://.';
      if (!sponsorFormData.companyLogo)
        errors.companyLogo = 'Company Logo is required.';
      if (!sponsorFormData.industry)
        errors.industry = 'Please select an industry.';

      if (Object.keys(errors).length) {
        setSponsorFieldErrors(errors);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Now store additional data in Firestore via our service functions
      if (role === 'sponsor') {
        // Register as sponsor
        await onboardSponsor({
          username: sponsorFormData.username,
          walletAddress: sponsorFormData.walletAddress || '',
          profileImage: sponsorFormData.profileImage,
          companyLogo: sponsorFormData.companyLogo,
          companyName: sponsorFormData.companyName,
          companyUsername: sponsorFormData.companyUsername,
          companyUrl: sponsorFormData.companyUrl,
          companyTwitter: sponsorFormData.companyTwitter,
          entityName: sponsorFormData.entityName,
          industry: sponsorFormData.industry,
          shortBio: sponsorFormData.shortBio,
          socials: [
            {
              platform: 'twitter',
              username: sponsorFormData.companyTwitter,
            },
          ],
          telegram: sponsorFormData.telegram,
        }).catch(async (error) => {
          // If Firestore save fails, delete the Auth user to prevent orphaned accounts
          //   if (user) await user.delete();
          throw error;
        });
      } else {
        // Register as talent
        await onboardTalent({
          username: talentFormData.username,
          location: talentFormData.location,
          walletAddress: talentFormData.walletAddress || '',
          skills: talentFormData.skills,
          socials: talentFormData.socials,
        }).catch(async (error) => {
          // If Firestore save fails, delete the Auth user to prevent orphaned accounts
          //   if (user) await user.delete();
          throw error;
        });
      }

      toast.success('Profile updated successfully!');

      // Close the modal first, then redirect
      onClose();

      // Use a small timeout to ensure the modal is closed before redirecting
      setTimeout(() => {
        router.push(`/dashboard?redirect=${encodeURIComponent(location)}`);
      }, 100);
    } catch (error: any) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            console.log('THERE IS AN ERROR', error);
            toast.error('Email already in use. Please use another.');
            break;
          case 'auth/invalid-email':
            toast.error('Invalid email address.');
            break;
          case 'auth/weak-password':
            toast.error('Password should be at least 6 characters.');
            break;
          default:
            toast.error(error.message || 'An unexpected error occurred.');
        }
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wallet Connection Screen
  if (step === 'wallet') {
    return (
      <ModalPortal>
        <div
          className={clsx(
            'fixed inset-0 z-[9999] flex items-start justify-center pt-20 transition-all duration-300',
            isOpen
              ? 'visible opacity-100'
              : 'invisible opacity-0 pointer-events-none'
          )}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          ></div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <IoClose size={24} />
            </button>

            <h2 className="mb-6 text-2xl font-bold dark:text-white">
              Connect Wallet
            </h2>

            <div className="space-y-4">
              <button
                onClick={async () => {
                  try {
                    await connect();
                    toast.success('Wallet connected successfully!');
                    setStep('form');
                  } catch (error) {
                    toast.error('Failed to connect wallet. Please try again.');
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white p-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Connect Wallet
              </button>

              <button
                onClick={() => setStep('form')}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </div>
      </ModalPortal>
    );
  }

  return (
    <ModalPortal>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Fixed overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] h-dvh w-dvw"
              onClick={onClose}
            />

            <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="backdrop-blur-xl bg-white/10 w-[min(90%, 400px)] max-w-lg mx-auto max-h-[90vh] border border-white/20 rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="relative p-8 overflow-y-auto max-h-[80vh]">
                  <h2 className="mb-6 text-2xl font-bold dark:text-white">
                    Complete Profile
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {role === 'talent' ? (
                      <TalentOnboardingForm
                        formData={talentFormData}
                        fieldErrors={talentFieldErrors}
                        isSubmitting={isSubmitting}
                        onFieldChange={handleTalentFieldChange}
                        onSkillToggle={handleSkillToggle}
                        onSocialChange={handleSocialChange}
                        onAddSocial={handleAddSocial}
                        onRemoveSocial={handleRemoveSocial}
                      />
                    ) : (
                      <SponsorOnboardingForm
                        formData={sponsorFormData}
                        fieldErrors={sponsorFieldErrors}
                        isSubmitting={isSubmitting}
                        onFieldChange={handleSponsorFieldChange}
                        onFileChange={handleSponsorFileChange}
                      />
                    )}

                    <button
                      type="submit"
                      className="btn-primary w-full py-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Setting up profile...' : 'Continue'}
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
