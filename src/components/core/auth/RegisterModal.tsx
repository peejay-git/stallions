'use client';

import { useWallet } from '@/hooks/useWallet';
import { registerSponsor, registerTalent } from '@/lib/authService';
import { auth } from '@/lib/firebase';
import useAuthStore from '@/lib/stores/auth.store';
import { UserRole } from '@/types/auth.types';
import clsx from 'clsx';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { IoClose } from 'react-icons/io5';
import {
  SponsorFieldErrors,
  SponsorFormDataType,
  SponsorRegistrationForm,
  TalentFieldErrors,
  TalentFormDataType,
  TalentRegistrationForm,
} from './register';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  selectedRole?: 'talent' | 'sponsor' | null;
};

type SocialLink = {
  platform: string;
  username: string;
};

export default function RegisterModal({
  isOpen,
  onClose,
  selectedRole,
}: Props) {
  const router = useRouter();
  const location = usePathname();
  const { isConnected, connect } = useWallet();

  // For talent form
  const [talentFormData, setTalentFormData] = useState<TalentFormDataType>({
    firstName: '',
    lastName: '',
    username: '',
    walletAddress: '',
    location: '',
    skills: [],
    socials: [{ platform: 'twitter', username: '' }],
    profileImage: null,
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [talentFieldErrors, setTalentFieldErrors] = useState<TalentFieldErrors>(
    {}
  );

  // For sponsor form
  const [sponsorFormData, setSponsorFormData] = useState<SponsorFormDataType>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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
  const role = selectedRole || 'talent';

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
    setTalentFormData((prev: TalentFormDataType) => ({
      ...prev,
      [name]: value,
    }));

    // Basic validation
    let error = '';
    if (
      ['firstName', 'lastName', 'username', 'email'].includes(name) &&
      !value.trim()
    ) {
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
    setTalentFormData((prev: TalentFormDataType) => {
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
    setTalentFormData((prev: TalentFormDataType) => {
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
      setTalentFormData((prev: TalentFormDataType) => ({
        ...prev,
        socials: [
          ...prev.socials,
          { platform: availablePlatforms[0], username: '' },
        ],
      }));
    }
  };

  const handleRemoveSocial = (index: number) => {
    setTalentFormData((prev: TalentFormDataType) => {
      const updatedSocials = [...prev.socials];
      updatedSocials.splice(index, 1);
      return { ...prev, socials: updatedSocials };
    });
  };

  // Sponsor form handlers
  const handleSponsorFieldChange = (name: string, value: any) => {
    setSponsorFormData((prev: SponsorFormDataType) => ({
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
    setSponsorFormData((prev: SponsorFormDataType) => ({
      ...prev,
      [name]: file,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (role === 'talent') {
      // Talent form validation
      const errors: TalentFieldErrors = {};
      if (!talentFormData.firstName.trim())
        errors.firstName = 'First Name is required.';
      if (!talentFormData.lastName.trim())
        errors.lastName = 'Last Name is required.';
      if (!talentFormData.username.trim())
        errors.username = 'Username is required.';
      if (talentFormData.skills.length === 0)
        errors.skills = 'Please select at least one skill.';
      if (!talentFormData.email.trim()) errors.email = 'Email is required.';
      if (!talentFormData.password) errors.password = 'Password is required.';
      if (talentFormData.password !== talentFormData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }

      if (Object.keys(errors).length) {
        setTalentFieldErrors(errors);
        return;
      }
    } else {
      // Sponsor form validation
      const errors: SponsorFieldErrors = {};
      if (!sponsorFormData.firstName.trim())
        errors.firstName = 'First Name is required.';
      if (!sponsorFormData.lastName.trim())
        errors.lastName = 'Last Name is required.';
      if (!sponsorFormData.username.trim())
        errors.username = 'Username is required.';
      if (!sponsorFormData.email.trim()) errors.email = 'Email is required.';
      if (!sponsorFormData.password) errors.password = 'Password is required.';
      if (sponsorFormData.password !== sponsorFormData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
      if (!sponsorFormData.companyName.trim())
        errors.companyName = 'Company Name is required.';
      if (!sponsorFormData.companyUsername.trim())
        errors.companyUsername = 'Company Username is required.';
      if (
        sponsorFormData.companyUrl &&
        !sponsorFormData.companyUrl.startsWith('https://')
      )
        errors.companyUrl = 'Company URL must start with https://.';
      if (!sponsorFormData.industry)
        errors.industry = 'Please select an industry.';

      if (Object.keys(errors).length) {
        setSponsorFieldErrors(errors);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Create new user with Firebase auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        role === 'talent' ? talentFormData.email : sponsorFormData.email,
        role === 'talent' ? talentFormData.password : sponsorFormData.password
      );
      const user = userCredential.user;

      if (role === 'sponsor') {
        // Register as sponsor
        await registerSponsor({
          email: sponsorFormData.email,
          password: sponsorFormData.password,
          firstName: sponsorFormData.firstName,
          lastName: sponsorFormData.lastName,
          username: sponsorFormData.username,
          location: '',
          walletAddress: sponsorFormData.walletAddress || '',
          profileImageFile: sponsorFormData.profileImage,
          companyLogoFile: sponsorFormData.companyLogo,
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
        });
      } else {
        // Register as talent
        await registerTalent({
          email: talentFormData.email,
          firstName: talentFormData.firstName,
          lastName: talentFormData.lastName,
          username: talentFormData.username,
          location: talentFormData.location,
          walletAddress: talentFormData.walletAddress || '',
          skills: talentFormData.skills,
          password: talentFormData.password,
          socials: talentFormData.socials,
        });
      }

      const userProfile = {
        uid: auth.currentUser?.uid || '',
        username:
          role === 'talent'
            ? talentFormData.username
            : sponsorFormData.username,
        firstName:
          role === 'talent'
            ? talentFormData.firstName
            : sponsorFormData.firstName,
        lastName:
          role === 'talent'
            ? talentFormData.lastName
            : sponsorFormData.lastName,
        email: auth.currentUser?.email || '',
        role: role as UserRole,
        walletConnected:
          role === 'talent'
            ? !!talentFormData.walletAddress || isConnected
            : !!sponsorFormData.walletAddress || isConnected,
        isProfileComplete: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      useAuthStore.getState().setUser(userProfile);
      toast.success('Profile created successfully!');

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
      <div
        className={clsx(
          'fixed inset-0 z-[9999] flex items-start justify-center pt-20 transition-all duration-300',
          isOpen
            ? 'visible opacity-100'
            : 'invisible opacity-0 pointer-events-none'
        )}
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
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
              Connect MetaMask
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
    );
  }

  return (
    <div
      className={clsx(
        'fixed inset-0 z-[9999] flex items-start justify-center pt-20 transition-all duration-300',
        isOpen
          ? 'visible opacity-100'
          : 'invisible opacity-0 pointer-events-none'
      )}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <IoClose size={24} />
        </button>

        <h2 className="mb-6 text-2xl font-bold dark:text-white">
          {role === 'sponsor' ? 'Create Sponsor Account' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {role === 'talent' ? (
            <TalentRegistrationForm
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
            <SponsorRegistrationForm
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
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="my-6 flex items-center justify-center">
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></span>
          <span className="mx-3 text-sm text-gray-500 dark:text-gray-400">
            OR
          </span>
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></span>
        </div>

        <div className="space-y-3">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white p-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
            <FcGoogle size={20} />
            Continue with Google
          </button>
        </div>
      </motion.div>
    </div>
  );
}
