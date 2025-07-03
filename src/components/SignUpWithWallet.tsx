'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { registerTalent } from '@/lib/authService';
import useUserStore from '@/lib/stores/useUserStore';
import { auth } from '@/lib/firebase';
import PasswordInput from './PasswordInput';

type Props = {
    onSuccess?: () => void;
    walletAddress: string;
};

export function SignUpWithWallet({ onSuccess, walletAddress }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when field is edited
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const validate = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.username.trim()) newErrors.username = 'Username is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) return;
        
        setIsSubmitting(true);
        
        try {
            await registerTalent({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                walletAddress: walletAddress,
                location: '',
                skills: ['Wallet User'],
                socials: [],
            });
            
            // Set user in store
            const userProfile = {
                uid: auth.currentUser?.uid || '',
                username: formData.username,
                firstName: formData.firstName,
                role: 'talent',
                walletConnected: true
            };
            
            useUserStore.getState().setUser(userProfile);
            localStorage.setItem('user', JSON.stringify(userProfile));
            
            toast.success('Account created successfully!');
            onSuccess?.();
        } catch (error: any) {
            console.error('Error creating account:', error);
            
            if (error.code === 'auth/email-already-in-use') {
                setErrors(prev => ({ ...prev, email: 'Email already in use' }));
                toast.error('Email already in use. Please try another email or link your existing account.');
            } else {
                toast.error('Failed to create account. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-300 mb-1">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="input w-full"
                                placeholder="John"
                            />
                            {errors.firstName && (
                                <p className="text-red-300 text-xs mt-1">{errors.firstName}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-1">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="input w-full"
                                placeholder="Doe"
                            />
                            {errors.lastName && (
                                <p className="text-red-300 text-xs mt-1">{errors.lastName}</p>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Username</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">@</span>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="input w-full pl-8"
                                placeholder="username"
                            />
                        </div>
                        {errors.username && (
                            <p className="text-red-300 text-xs mt-1">{errors.username}</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input w-full"
                            placeholder="john@example.com"
                        />
                        {errors.email && (
                            <p className="text-red-300 text-xs mt-1">{errors.email}</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Password</label>
                        <PasswordInput
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input w-full"
                            placeholder="******"
                        />
                        {errors.password && (
                            <p className="text-red-300 text-xs mt-1">{errors.password}</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Confirm Password</label>
                        <PasswordInput
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="input w-full"
                            placeholder="******"
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-300 text-xs mt-1">{errors.confirmPassword}</p>
                        )}
                    </div>
                    
                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 text-sm">
                        <p className="text-white font-medium">Wallet will be linked</p>
                        <p className="text-gray-300 break-all text-xs mt-1">{walletAddress}</p>
                    </div>
                    
                    <motion.button
                        type="submit"
                        className="bg-white text-black font-medium py-2.5 px-4 rounded-lg hover:bg-white/90 transition-colors w-full flex items-center justify-center mt-6"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex gap-2 items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 rounded-full bg-black animate-bounce"></span>
                            </span>
                        ) : (
                            'Create Account'
                        )}
                    </motion.button>
                </div>
            </form>
        </div>
    );
} 