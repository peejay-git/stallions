"use client";

import {SKILLS_OPTIONS} from "@/utils/constants/bounty";
import {AnimatePresence, motion} from "framer-motion";
import React from "react";
import {CheckmarkIcon} from "react-hot-toast";
import {FaGithub, FaLinkedin, FaXTwitter} from "react-icons/fa6";

export type TalentOnboardingFormDataType = {
    username: string;
    walletAddress: string;
    location: string;
    skills: string[];
    socials: { platform: string; username: string }[];
};

export type TalentFieldErrors = Partial<
    Record<keyof TalentOnboardingFormDataType, string>
>;

interface TalentOnboardingFormProps {
    formData: TalentOnboardingFormDataType;
    fieldErrors: TalentFieldErrors;
    isSubmitting: boolean;
    onFieldChange: (name: string, value: any) => void;
    onSkillToggle: (skill: string) => void;
    onSocialChange: (index: number, field: string, value: string) => void;
    onAddSocial: () => void;
    onRemoveSocial: (index: number) => void;
}

export const TalentOnboardingForm: React.FC<TalentOnboardingFormProps> = ({
                                                                              formData,
                                                                              fieldErrors,
                                                                              onFieldChange,
                                                                              onSkillToggle,
                                                                              onSocialChange,
                                                                              onAddSocial,
                                                                              onRemoveSocial,
                                                                          }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        onFieldChange(name, value);
    };

    return (
        <div className="space-y-4">
            <div>
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

            <div>
                <input
                    type="text"
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleChange}
                    placeholder="Stellar wallet address"
                    className="w-full p-2 border border-white/20 bg-white/10 backdrop-blur-xl text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                />
                {fieldErrors.walletAddress && (
                    <p className="text-sm text-red-500 mt-1">
                        {fieldErrors.walletAddress}
                    </p>
                )}
            </div>

            <div>
                <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Location (City, Country)"
                    className="w-full p-2 border border-white/20 bg-white/10 backdrop-blur-xl text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                            {skill}{" "}
                            {formData.skills.includes(skill) ? (
                                <AnimatePresence>
                                    <motion.div
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        exit={{opacity: 0}}
                                    >
                                        <CheckmarkIcon/>
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
                        {social.platform === "twitter" && (
                            <FaXTwitter className="text-gray-500"/>
                        )}
                        {social.platform === "linkedin" && (
                            <FaLinkedin className="text-gray-500"/>
                        )}
                        {social.platform === "github" && (
                            <FaGithub className="text-gray-500"/>
                        )}
                        <input
                            type="text"
                            value={social.username}
                            onChange={(e) =>
                                onSocialChange(index, "username", e.target.value)
                            }
                            placeholder={`${
                                social.platform.charAt(0).toUpperCase() +
                                social.platform.slice(1)
                            } username`}
                            className="flex-1 p-2 border border-white/20 bg-white/10 backdrop-blur-xl text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                        + Add {formData.socials.length === 0 ? "Social Media" : "Another"}
                    </button>
                )}
            </div>
        </div>
    );
};
