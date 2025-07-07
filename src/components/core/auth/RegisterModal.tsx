'use client';

import { PasswordInput } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';
import { registerTalent, signInWithGoogle } from '@/lib/authService';
import { auth } from '@/lib/firebase';
import useUserStore from '@/lib/stores/useUserStore';
import clsx from 'clsx';
import { FirebaseError } from 'firebase/app';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';
import { IoClose } from 'react-icons/io5';

const defaultSkills = [
  'Frontend',
  'Backend',
  'UI/UX Design',
  'Writing',
  'Digital Marketing',
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export type FormDataType = {
  firstName: string;
  lastName: string;
  username: string;
  walletAddress: string;
  location: string;
  skills: string[];
  socials: SocialLink[];
  profileImage: File | null;
  email: string;
  password: string;
  confirmPassword: string;
};

type SocialPlatform = 'twitter' | 'github' | 'linkedin';

type SocialLink = {
  platform: SocialPlatform;
  username: string;
};
type FieldErrors = Partial<Record<keyof FormDataType, string>>;

export default function RegisterModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const location = usePathname();
  const [hasEditedUsername, setHasEditedUsername] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const { connect: connectWallet, isConnected, publicKey } = useWallet();

  const [formData, setFormData] = useState<FormDataType>({
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

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'wallet'>('form');

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

  const validateField = (name: keyof FormDataType, value: any) => {
    let error = '';
    if (
      (name === 'firstName' || name === 'lastName' || name === 'username') &&
      !value.trim()
    ) {
      error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
    }
    if (name === 'skills' && value.length === 0) {
      error = 'Please select at least one skill.';
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      return updated;
    });

    if (name === 'username') {
      setHasEditedUsername(true);
    }

    validateField(name as keyof FormDataType, value);
  };

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => {
      const updatedSkills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      validateField('skills', updatedSkills);
      return { ...prev, skills: updatedSkills };
    });
  };

  const handleAddSocial = () => {
    const platforms: SocialPlatform[] = ['twitter', 'github', 'linkedin'];
    const used = formData.socials.map((s) => s.platform);
    const next = platforms.find((p) => !used.includes(p));
    if (!next) return; // All platforms already added
    setFormData((prev) => ({
      ...prev,
      socials: [...prev.socials, { platform: next, username: '' }],
    }));
  };

  const handleSocialChange = (
    index: number,
    field: 'platform' | 'username',
    value: string
  ) => {
    const updated = [...formData.socials];
    if (field === 'platform') {
      updated[index].platform = value as SocialPlatform;
    } else {
      updated[index].username = value;
    }
    setFormData((prev) => ({ ...prev, socials: updated }));
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <FaXTwitter className="text-gray-500 text-xl" />;
      case 'github':
        return <FaGithub className="text-gray-500 text-xl" />;
      case 'linkedin':
        return <FaLinkedin className="text-gray-500 text-xl" />;
      default:
        return null;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file && file.size <= 5 * 1024 * 1024) {
      setFormData((prev) => ({ ...prev, profileImage: file }));
    } else {
      alert('Image must be under 5MB.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleSubmitting(true);
      const { user, isNewUser } = await signInWithGoogle();

      toast.success('Account created successfully!');
      onClose();

      if (isNewUser) {
        // If it's a new user, prompt them to connect their wallet
        router.push(`/connect-wallet?redirect=${encodeURIComponent(location)}`);
      } else {
        router.push(`/dashboard?redirect=${encodeURIComponent(location)}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const connectUserWallet = async () => {
    if (!isConnected) {
      try {
        await connectWallet({});
        // Update the wallet address in the form data
        if (publicKey) {
          setFormData((prev) => ({
            ...prev,
            walletAddress: publicKey,
          }));
          toast.success('Wallet connected successfully!');

          // Continue with form submission
          setStep('form');
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        toast.error('Failed to connect wallet. Please try again.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (!formData.firstName.trim())
      errors.firstName = 'First Name is required.';
    if (!formData.lastName.trim()) errors.lastName = 'Last Name is required.';
    if (!formData.username.trim()) errors.username = 'Username is required.';
    if (formData.skills.length === 0)
      errors.skills = 'Please select at least one skill.';
    if (!formData.email.trim()) errors.email = 'Email is required.';
    if (!formData.password) errors.password = 'Password is required.';
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    // If wallet isn't connected, prompt to connect first
    if (!formData.walletAddress && !isConnected) {
      setStep('wallet');
      return;
    }

    // If wallet is connected but form data doesn't have the address
    if (isConnected && publicKey && !formData.walletAddress) {
      setFormData((prev) => ({
        ...prev,
        walletAddress: publicKey,
      }));
    }

    setIsSubmitting(true);
    try {
      await registerTalent({
        email: formData.email,
        password: formData.password,
        // profileImageFile: formData.profileImage,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        walletAddress: formData.walletAddress || publicKey || '',
        location: formData.location,
        skills: formData.skills,
        socials: formData.socials.filter((s) => s.username.trim() !== ''),
      });
      const userProfile = {
        uid: auth.currentUser?.uid || '', // fallback
        username: formData.username,
        firstName: formData.firstName,
        role: 'talent',
        walletConnected: !!formData.walletAddress || isConnected,
      };
      useUserStore.getState().setUser(userProfile);
      localStorage.setItem('user', JSON.stringify(userProfile));
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
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setStep('form')}
        />
        <div className="relative w-full max-w-xl shadow-2xl z-[9999] bg-transparent max-h-[90vh]">
          <button
            type="button"
            onClick={() => setStep('form')}
            className="absolute top-4 right-4 text-gray-300 hover:text-white transition z-20"
            aria-label="Back"
          >
            <IoClose className="w-6 h-6" />
          </button>
          <div className="rounded-2xl overflow-hidden">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-8">
              <h2 className="text-2xl font-bold mb-2 text-center text-white">
                Connect Your Wallet
              </h2>
              <p className="text-sm text-gray-300 text-center mb-8">
                Connect your Stellar wallet to complete your registration
              </p>

              <div className="flex flex-col items-center justify-center space-y-4">
                <motion.button
                  onClick={connectUserWallet}
                  className="bg-white text-black font-medium py-3 px-6 rounded-lg hover:bg-white/90 transition-colors w-full flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Connect Wallet
                </motion.button>

                <button
                  onClick={() => setStep('form')}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl shadow-2xl z-[9999] bg-transparent max-h-[90vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-white transition z-20"
          aria-label="Close"
        >
          <IoClose className="w-6 h-6" />
        </button>
        <div className="rounded-2xl overflow-hidden">
          <div className="max-h-[80vh] overflow-y-auto backdrop-blur-xl bg-white/10 border border-white/20 p-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <h2 className="text-2xl font-bold mb-2 text-center text-white">
              Complete your Profile
            </h2>
            <p className="text-sm text-gray-300 text-center mb-6">
              We'll tailor your Earn experience based on your profile
            </p>

            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-center mb-6">
                <label
                  htmlFor="profile-upload"
                  className="cursor-pointer group"
                >
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/40 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    {formData.profileImage ? (
                      <img
                        src={URL.createObjectURL(formData.profileImage)}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <svg
                        className="w-6 h-6 text-white/70 group-hover:text-white transition-colors"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4"
                        />
                      </svg>
                    )}
                  </div>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-300 mt-1 text-center">
                    Upload Photo
                  </p>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <input
                    name="firstName"
                    placeholder="First Name"
                    className="input"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  {fieldErrors.firstName && (
                    <p className="text-red-300 text-sm mt-1">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    name="lastName"
                    placeholder="Last Name"
                    className="input"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-red-300 text-sm mt-1">
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Username Field */}
                <div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                      @
                    </span>
                    <input
                      name="username"
                      className="input pl-8"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Username"
                    />
                  </div>
                  {fieldErrors.username && (
                    <p className="text-red-300 text-sm mt-1">
                      {fieldErrors.username}
                    </p>
                  )}
                </div>

                {/* Location Field */}
                <div>
                  <input
                    name="location"
                    placeholder="Location (e.g. Lagos, NG)"
                    className="input"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Wallet Status */}
              <div className="mb-4">
                <div
                  className={clsx(
                    'p-3 rounded-lg flex items-center',
                    isConnected || formData.walletAddress
                      ? 'bg-green-900/20 border border-green-700/30'
                      : 'bg-white/10 border border-white/20'
                  )}
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {isConnected || formData.walletAddress
                        ? 'Wallet Connected'
                        : 'Connect Your Wallet'}
                    </p>
                    <p className="text-xs text-gray-300">
                      {isConnected || formData.walletAddress
                        ? publicKey || formData.walletAddress
                        : 'You can connect now or after registration'}
                    </p>
                  </div>
                  {!(isConnected || formData.walletAddress) && (
                    <motion.button
                      type="button"
                      onClick={connectUserWallet}
                      className="bg-white text-black text-sm font-medium py-1.5 px-3 rounded-lg hover:bg-white/90 transition-colors"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Connect
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    className="input"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {fieldErrors.email && (
                    <p className="text-red-300 text-sm mt-1">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <PasswordInput
                    name="password"
                    placeholder="Password"
                    className="input"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {fieldErrors.password && (
                    <p className="text-red-300 text-sm mt-1">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
                <div>
                  <PasswordInput
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    className="input"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-red-300 text-sm mt-1">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-white">
                  Your Skills *
                </label>
                <div className="flex flex-wrap gap-2">
                  {defaultSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={clsx(
                        'text-sm px-3 py-1 rounded-full border transition-all',
                        formData.skills.includes(skill)
                          ? 'bg-blue-500/30 text-blue-200 border-blue-500/50'
                          : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                      )}
                    >
                      {skill} {formData.skills.includes(skill) ? '✓' : '+'}
                    </button>
                  ))}
                </div>
                {fieldErrors.skills && (
                  <p className="text-red-300 text-sm mt-1">
                    {fieldErrors.skills}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-white">
                  Socials
                </label>

                {formData.socials.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    {getPlatformIcon(link.platform)}
                    <input
                      placeholder={`Enter your ${link.platform} username`}
                      className="input flex-1"
                      value={link.username}
                      onChange={(e) =>
                        handleSocialChange(idx, 'username', e.target.value)
                      }
                    />
                  </div>
                ))}

                {formData.socials.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddSocial}
                    className="text-sm text-white mt-2 font-medium hover:underline"
                  >
                    + ADD MORE
                  </button>
                )}
              </div>

              <motion.button
                type="submit"
                className="bg-white text-black font-medium py-3 px-4 rounded-lg hover:bg-white/90 transition-colors w-full flex items-center justify-center"
                disabled={isSubmitting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <span className="flex gap-2 items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-black animate-bounce" />
                  </span>
                ) : (
                  'Create Profile'
                )}
              </motion.button>

              <div className="mt-6 relative flex items-center justify-center">
                <div className="absolute left-0 w-full border-t border-white/10"></div>
                <div className="relative bg-[#070708] px-4 text-sm text-gray-300">
                  or register with
                </div>
              </div>

              <motion.button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting}
                className="mt-6 w-full flex items-center justify-center gap-2 border border-white/20 bg-white/10 hover:bg-white/15 text-white py-3 px-4 rounded-lg transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {isGoogleSubmitting ? (
                  <span className="flex gap-2 items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 rounded-full bg-white animate-bounce"></span>
                  </span>
                ) : (
                  <>
                    <FcGoogle className="w-5 h-5" />
                    <span>Google</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
