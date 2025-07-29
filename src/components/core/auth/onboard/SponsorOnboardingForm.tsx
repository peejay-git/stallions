"use client";

import WalletConnectButton from "../WalletConnectButton";
import React from "react";
import {FaTelegram, FaXTwitter} from "react-icons/fa6";
import {FiUpload} from "react-icons/fi";

export type SponsorOnboardingFormDataType = {
    username: string;
    telegram: string;
    profileImage: File | null;
    companyName: string;
    companyUsername: string;
    companyUrl: string;
    companyTwitter: string;
    entityName: string;
    companyLogo: File | null;
    industry: string;
    shortBio: string;
    walletAddress: string;
};

export type SponsorFieldErrors = Partial<
    Record<keyof SponsorOnboardingFormDataType, string>
>;

interface SponsorOnboardingFormProps {
    formData: SponsorOnboardingFormDataType;
    fieldErrors: SponsorFieldErrors;
    isSubmitting: boolean;
    onFieldChange: (name: string, value: any) => void;
    onFileChange: (name: string, file: File | null) => void;
}

const industries = [
    "Finance",
    "Healthcare",
    "Education",
    "Technology",
    "Entertainment",
    "Real Estate",
    "Retail",
    "Manufacturing",
    "Other",
];

export const SponsorOnboardingForm: React.FC<SponsorOnboardingFormProps> = ({
                                                                                formData,
                                                                                fieldErrors,
                                                                                isSubmitting,
                                                                                onFieldChange,
                                                                                onFileChange,
                                                                            }) => {
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const {name, value} = e.target;
        onFieldChange(name, value);
    };

    return (
        <div className="space-y-4">
            <section>
                <h3 className="font-medium text-lg text-white mb-4">
                    Personal Information
                </h3>

                <div className="mt-4">
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Username"
                        className="w-full p-2 border border-white/20 bg-white/10 backdrop-blur-xl text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {fieldErrors.username && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors.username}</p>
                    )}
                </div>

                <div className="mt-4">
                    <WalletConnectButton
                        onAddressChange={(address) =>
                            onFieldChange("walletAddress", address)
                        }
                        currentAddress={formData.walletAddress}
                    />
                </div>

                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <FaTelegram className="text-gray-500 text-xl mt-[2px]"/>
                        <input
                            name="telegram"
                            value={formData.telegram}
                            onChange={handleChange}
                            placeholder="Telegram Handle"
                            className="w-full p-2 border border-white/20 bg-white/10 backdrop-blur-xl text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    {fieldErrors.telegram && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors.telegram}</p>
                    )}
                </div>
            </section>

            <section className="mt-8">
                <h3 className="font-medium text-lg text-white mb-4">
                    Company Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <input
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            placeholder="Company Name"
                            className="w-full p-2 border border-white/20 bg-white/10 backdrop-blur-xl text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                            className="w-full p-2 border border-white/20 bg-white/10 backdrop-blur-xl text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        {fieldErrors.companyUsername && (
                            <p className="text-sm text-red-500 mt-1">
                                {fieldErrors.companyUsername}
                            </p>
                        )}
                    </div>
                    <div>
                        <input
                            name="companyUrl"
                            value={formData.companyUrl}
                            onChange={handleChange}
                            placeholder="Company URL (https://...)"
                            className="w-full p-2 border border-white/20 bg-white/10 backdrop-blur-xl text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        {fieldErrors.companyUrl && (
                            <p className="text-sm text-red-500 mt-1">
                                {fieldErrors.companyUrl}
                            </p>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <FaXTwitter className="text-gray-500 text-xl mt-[2px]"/>
                            <input
                                name="companyTwitter"
                                value={formData.companyTwitter}
                                onChange={handleChange}
                                placeholder="Twitter Handle"
                                className="w-full p-2 border border-white/20 bg-white/10 backdrop-blur-xl text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-white mb-2">
                        Company Logo
                    </label>
                    <div
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer border-white/20 bg-white/10 backdrop-blur-xl text-white">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                onFileChange("companyLogo", e.target.files?.[0] || null)
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
                                    <FiUpload className="text-xl"/>
                                    <span>Choose or drag and drop media</span>
                                </div>
                            )}
                            <div className="text-xs text-gray-400">Maximum size 5 MB</div>
                        </label>
                        {fieldErrors.companyLogo && (
                            <p className="text-sm text-red-500 mt-2">
                                {fieldErrors.companyLogo}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-4">
                    <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full p-2 border border-white/20 bg-white/10 backdrop-blur-xl text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="" className={"text-gray-700"}>Select Industry</option>
                        {industries.map((industry) => (
                            <option key={industry} value={industry.toLowerCase()} className={"text-gray-700"}>
                                {industry}
                            </option>
                        ))}
                    </select>
                    {fieldErrors.industry && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors.industry}</p>
                    )}
                </div>

                <div className="mt-4">
                    <textarea
                        name="shortBio"
                        value={formData.shortBio}
                        onChange={handleChange}
                        maxLength={180}
                        placeholder="What does your company do?"
                        className="w-full p-2 border border-white/20 bg-white/10 backdrop-blur-xl text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 h-24"
                    />
                    <p className="text-xs text-gray-400 text-right">
                        {180 - formData.shortBio.length} characters left
                    </p>
                </div>
            </section>
        </div>
    );
};
