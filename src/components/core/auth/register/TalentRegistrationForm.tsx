'use client';

import { PasswordInput } from '@/components/ui';
import { SKILLS_OPTIONS } from '@/constants/bounty';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { CheckmarkIcon } from 'react-hot-toast';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import WalletConnectButton from '../WalletConnectButton';

export type TalentFormDataType = {
  firstName: string;
  lastName: string;
  username: string;
  walletAddress: string;
  location: string;
  skills: string[];
  socials: { platform: string; username: string }[];
  profileImage: File | null;
  email: string;
  password: string;
  confirmPassword: string;
};

export type TalentFieldErrors = Partial<
  Record<keyof TalentFormDataType, string>
>;

interface TalentRegistrationFormProps {
  formData: TalentFormDataType;
  fieldErrors: TalentFieldErrors;
  isSubmitting: boolean;
  onFieldChange: (name: string, value: any) => void;
  onSkillToggle: (skill: string) => void;
  onSocialChange: (index: number, field: string, value: string) => void;
  onAddSocial: () => void;
  onRemoveSocial: (index: number) => void;
}

const TalentRegistrationForm: React.FC<TalentRegistrationFormProps> = ({
  formData,
  fieldErrors,
  onFieldChange,
  onSkillToggle,
  onSocialChange,
  onAddSocial,
  onRemoveSocial,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFieldChange(name, value);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First Name"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {fieldErrors.firstName && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.firstName}</p>
          )}
        </div>

        <div>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {fieldErrors.lastName && (
            <p className="text-sm text-red-500 mt-1">{fieldErrors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {fieldErrors.username && (
          <p className="text-sm text-red-500 mt-1">{fieldErrors.username}</p>
        )}
      </div>

      <div>
        <WalletConnectButton
          onAddressChange={(address) => onFieldChange('walletAddress', address)}
          currentAddress={formData.walletAddress}
        />
      </div>

      <div>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Location (City, Country)"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-white mb-2">Skills</p>
        <div className="flex flex-wrap gap-2">
          {SKILLS_OPTIONS.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => onSkillToggle(skill)}
              className={`flex items-center gap-2 px-3 py-1 text-sm rounded-full bg-primary text-white`}
            >
              {skill}{' '}
              {formData.skills.includes(skill) ? (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CheckmarkIcon />
                  </motion.div>
                </AnimatePresence>
              ) : null}
            </button>
          ))}
        </div>
        {fieldErrors.skills && (
          <p className="text-sm text-red-500 mt-1">{fieldErrors.skills}</p>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm text-white font-medium">Social Media</p>
        {formData.socials.map((social, index) => (
          <div key={index} className="flex items-center gap-2">
            {social.platform === 'twitter' && (
              <FaXTwitter className="text-gray-500" />
            )}
            {social.platform === 'linkedin' && (
              <FaLinkedin className="text-gray-500" />
            )}
            {social.platform === 'github' && (
              <FaGithub className="text-gray-500" />
            )}
            <input
              type="text"
              value={social.username}
              onChange={(e) =>
                onSocialChange(index, 'username', e.target.value)
              }
              placeholder={`${
                social.platform.charAt(0).toUpperCase() +
                social.platform.slice(1)
              } username`}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {formData.socials.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveSocial(index)}
                className="text-sm text-red-500 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {formData.socials.length < 3 && (
          <button
            type="button"
            onClick={onAddSocial}
            className="text-sm text-white hover:underline"
          >
            + Add {formData.socials.length === 0 ? 'Social Media' : 'Another'}
          </button>
        )}
      </div>

      <div>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email Address"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {fieldErrors.email && (
          <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <PasswordInput
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          name="password"
        />
        {fieldErrors.password && (
          <p className="text-sm text-red-500 mt-1">{fieldErrors.password}</p>
        )}
      </div>

      <div>
        <PasswordInput
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          name="confirmPassword"
        />
        {fieldErrors.confirmPassword && (
          <p className="text-sm text-red-500 mt-1">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>
    </div>
  );
};

export default TalentRegistrationForm;
