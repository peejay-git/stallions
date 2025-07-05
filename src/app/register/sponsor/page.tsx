'use client';

import { PasswordInput } from '@/components';
import { registerSponsor } from '@/lib/authService';
import { auth } from '@/lib/firebase';
import useUserStore from '@/lib/stores/useUserStore';
import { FirebaseError } from 'firebase/app';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaTelegram, FaXTwitter } from 'react-icons/fa6';
import { FiUpload } from 'react-icons/fi';

export default function SponsorRegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    telegram: '',
    profileImage: null as File | null,
    companyName: '',
    companyUsername: '',
    companyUrl: '',
    companyTwitter: '',
    entityName: '',
    companyLogo: null as File | null,
    industry: '',
    shortBio: '',
    walletAddress: '',
  });

  type FieldErrors = Partial<Record<keyof typeof formData, string>>;
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const requiredFields = [
    'firstName',
    'lastName',
    'username',
    'email',
    'password',
    'confirmPassword',
    'telegram',
    'companyName',
    'companyUsername',
  ];
  const formatField = (field: string) =>
    field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate only if it's a required field
    if (requiredFields.includes(name) && value.trim() === '') {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: `${formatField(name)} is required.`,
      }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Custom validation for companyUrl (only if user entered a value)
    if (name === 'companyUrl') {
      if (value.trim() && !value.startsWith('https://')) {
        setFieldErrors((prev) => ({
          ...prev,
          companyUrl: 'Company URL must start with https://.',
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, companyUrl: '' }));
      }
    }
  };

  const handleFileChange = (name: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [name]: file }));
    // setFieldErrors((prev) => ({ ...prev, [name]: file ? '' : `${formatField(name)} is required.` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newErrors: FieldErrors = {};
    [
      'firstName',
      'lastName',
      'username',
      'email',
      'password',
      'confirmPassword',
      'companyName',
    ].forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field as keyof typeof formData] = `${formatField(
          field
        )} is required.`;
      }
    });

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    // if (!formData.profileImage) newErrors.profileImage = 'Profile Picture is required.';
    // if (!formData.companyLogo) newErrors.companyLogo = 'Company Logo is required.';
    if (!formData.industry) newErrors.industry = 'Please select an industry.';

    setFieldErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      setIsSubmitting(false);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await registerSponsor({
        email: formData.email,
        password: formData.password,
        profileImageFile: formData.profileImage,
        companyLogoFile: formData.companyLogo,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        telegram: formData.telegram,
        companyName: formData.companyName,
        companyUsername: formData.companyUsername,
        companyUrl: formData.companyUrl,
        companyTwitter: formData.companyTwitter,
        entityName: formData.entityName,
        industry: formData.industry,
        shortBio: formData.shortBio,
      });

      const userProfile = {
        uid: auth.currentUser?.uid || '',
        username: formData.username,
        firstName: formData.firstName,
        role: 'sponsor',
      };

      useUserStore.getState().setUser(userProfile);
      localStorage.setItem('user', JSON.stringify(userProfile));

      toast.success('Sponsor profile created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            toast.error('Email already in use.');
            break;
          case 'auth/invalid-email':
            toast.error('Invalid email address.');
            break;
          case 'auth/weak-password':
            toast.error('Password must be at least 6 characters.');
            break;
          default:
            toast.error(error.message || 'Something went wrong.');
        }
      } else {
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className=" relative bg-gradient-to-r from-stellar-blue to-stellar-navy  sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-4 md:py-6">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="flex items-center space-x-2">
                  <Image
                    src="/images/unicorn-logo.svg"
                    alt="Stallion Logo"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-xl font-bold text-white">Stallion</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-2 text-center">
          Complete Your Sponsor Profile
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Help us personalize your experience and match you with the right
          talents and opportunities.
        </p>
        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">About You</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="input"
                />
                {fieldErrors.firstName && (
                  <p className="text-sm text-red-500 mt-1">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="input"
                />
                {fieldErrors.lastName && (
                  <p className="text-sm text-red-500 mt-1">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
              <div>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="input"
                />
                {fieldErrors.username && (
                  <p className="text-sm text-red-500 mt-1">
                    {fieldErrors.username}
                  </p>
                )}
              </div>
              <div className="">
                <div className="flex items-center gap-2">
                  <FaTelegram className="text-gray-500 text-xl mt-[2px]" />
                  <input
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                    placeholder="Telegram Username"
                    className="input flex-1 py-2"
                  />
                </div>

                {fieldErrors.telegram && (
                  <p className="text-sm text-red-500 mt-1 col-span-2">
                    {fieldErrors.telegram}
                  </p>
                )}
              </div>
            </div>
            <div className="my-4">
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="input"
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="input"
                />
                {fieldErrors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
              <div>
                <PasswordInput
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="input"
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(
                      'profileImage',
                      e.target.files?.[0] || null
                    )
                  }
                  className="hidden"
                  id="profileImage"
                />
                <label
                  htmlFor="profileImage"
                  className="cursor-pointer space-y-2 flex flex-col items-center"
                >
                  {formData.profileImage ? (
                    <img
                      src={URL.createObjectURL(formData.profileImage)}
                      alt="Profile Preview"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <FiUpload className="text-xl" />
                      <span>Choose or drag and drop media</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-400">Maximum size 5 MB</div>
                </label>
                {/* {fieldErrors.profileImage && <p className="text-sm text-red-500 mt-2">{fieldErrors.profileImage}</p>} */}
              </div>
            </div>
          </section>

          <hr />

          <section>
            <h2 className="text-xl font-semibold mb-4">About Your Company</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Company Name"
                  className="input"
                />
                {fieldErrors.companyName && (
                  <p className="text-sm text-red-500 mt-1">
                    {fieldErrors.companyName}
                  </p>
                )}
              </div>
              <div>
                <input
                  name="companyUsername"
                  value={formData.companyUsername}
                  onChange={handleChange}
                  placeholder="Company Username"
                  className="input"
                />
              </div>
              <div className="flex flex-col">
                <input
                  name="companyUrl"
                  value={formData.companyUrl}
                  onChange={handleChange}
                  placeholder="https://company.com"
                  className="input"
                />
                {fieldErrors.companyUrl && (
                  <p className="text-sm text-red-500 mt-1">
                    {fieldErrors.companyUrl}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <FaXTwitter className="text-gray-500 text-xl mt-[2px]" />
                  <input
                    name="companyTwitter"
                    value={formData.companyTwitter}
                    onChange={handleChange}
                    placeholder="Twitter Handle"
                    className="input flex-1"
                  />
                </div>
              </div>

              <input
                name="entityName"
                value={formData.entityName}
                onChange={handleChange}
                placeholder="Full Entity Name"
                className="input md:col-span-2"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange('companyLogo', e.target.files?.[0] || null)
                  }
                  className="hidden"
                  id="companyLogo"
                />
                <label
                  htmlFor="companyLogo"
                  className="cursor-pointer space-y-2 flex flex-col items-center"
                >
                  {formData.companyLogo ? (
                    <img
                      src={URL.createObjectURL(formData.companyLogo)}
                      alt="Logo Preview"
                      className="w-24 h-24 rounded object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <FiUpload className="text-xl" />
                      <span>Choose or drag and drop media</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-400">Maximum size 5 MB</div>
                </label>
                {/* {fieldErrors.companyLogo && <p className="text-sm text-red-500 mt-2">{fieldErrors.companyLogo}</p>} */}
              </div>
            </div>

            <div className="mt-4">
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="">Select Industry</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
              </select>
              {fieldErrors.industry && (
                <p className="text-sm text-red-500 mt-1">
                  {fieldErrors.industry}
                </p>
              )}
            </div>

            <div className="mt-4">
              <textarea
                name="shortBio"
                value={formData.shortBio}
                onChange={handleChange}
                maxLength={180}
                placeholder="What does your company do?"
                className="input w-full h-24"
              />
              <p className="text-xs text-gray-400 text-right">
                {180 - formData.shortBio.length} characters left
              </p>
            </div>
          </section>

          <button
            type="submit"
            className="btn-primary w-full py-2 mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Sponsor'}
          </button>
        </form>
      </div>
    </>
  );
}
