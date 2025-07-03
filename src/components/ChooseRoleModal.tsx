'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FaUserTie, FaUserGraduate } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onChooseRole: (role: 'talent' | 'sponsor') => void;
};

export default function ChooseRoleModal({ isOpen, onClose, onChooseRole }: Props) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-lg mx-auto z-[9999] max-h-[90vh]"
                    >
                        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden shadow-2xl">
                            <div className="relative p-8 overflow-y-auto max-h-[80vh]">
                                <motion.button
                                    whileHover={{ rotate: 90 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                                    onClick={onClose}
                                >
                                    <IoClose className="w-6 h-6" />
                                </motion.button>

                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h2 className="text-3xl font-bold mb-6 text-white text-center">
                                        Choose Your Role
                                    </h2>
                                </motion.div>

                                <div className="flex flex-col sm:flex-row gap-6 justify-between">
                                    <motion.button
                                        onClick={() => onChooseRole('talent')}
                                        className="flex-1 backdrop-blur-xl bg-blue-500/20 border border-blue-500/30 rounded-xl p-6 flex flex-col items-center text-center transition shadow-lg hover:shadow-blue-500/20"
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        whileHover={{ 
                                            scale: 1.03,
                                            boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" 
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="w-16 h-16 bg-blue-500/30 rounded-full flex items-center justify-center mb-4">
                                            <FaUserGraduate className="text-blue-300 text-3xl" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2 text-blue-300">
                                            I'm a Talent
                                        </h3>
                                        <p className="text-sm text-blue-200">
                                            Looking to grow your skills, earn crypto, and work on Web3 projects.
                                        </p>
                                    </motion.button>

                                    <motion.button
                                        onClick={() => onChooseRole('sponsor')}
                                        className="flex-1 backdrop-blur-xl bg-purple-500/20 border border-purple-500/30 rounded-xl p-6 flex flex-col items-center text-center transition shadow-lg hover:shadow-purple-500/20"
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        whileHover={{ 
                                            scale: 1.03,
                                            boxShadow: "0 10px 25px -5px rgba(168, 85, 247, 0.5)" 
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="w-16 h-16 bg-purple-500/30 rounded-full flex items-center justify-center mb-4">
                                            <FaUserTie className="text-purple-300 text-3xl" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2 text-purple-300">
                                            I'm a Sponsor
                                        </h3>
                                        <p className="text-sm text-purple-200">
                                            Want to fund bounties, grow communities, and discover talent in Web3.
                                        </p>
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
