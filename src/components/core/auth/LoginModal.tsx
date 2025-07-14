'use client';

import { PasswordInput } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';
import { forgotPassword } from '@/lib/authService';
import { auth } from '@/lib/firebase';
import useAuthStore from '@/lib/stores/auth.store';
import { getWalletKit } from '@/lib/wallet';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiLock, FiMail } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';
import { SiBlockchaindotcom } from 'react-icons/si';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
};

type LoginView = 'main' | 'wallet-selector' | 'forgot-password';

export default function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
}: Props) {
  const router = useRouter();
  const location = usePathname();
  const { publicKey, isConnected, connect, disconnect } = useWallet();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isWalletSubmitting, setIsWalletSubmitting] = useState(false);
  const [walletEmail, setWalletEmail] = useState('');
  const [currentView, setCurrentView] = useState<LoginView>('main');
  const [animationComplete, setAnimationComplete] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnimationComplete(true);
      document.body.classList.add('overflow-hidden');
      // Force scroll to top when modal opens
      window.scrollTo(0, 0);
    } else {
      setAnimationComplete(false);
      document.body.classList.remove('overflow-hidden');
      // Reset view when closing modal
      setCurrentView('main');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'email':
        return !value ? 'Email is required.' : '';
      case 'password':
        return !value ? 'Password is required.' : '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    const errorMsg = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: errorMsg }));

    if (formError) setFormError(null); // Clear global error on typing
  };

  const handleWalletConnect = async () => {
    if (publicKey) {
      handleWalletLogin(publicKey);
    } else {
      await connect({
        onWalletSelected: async (publicKey: string) => {
          // Wait for user to be set, then check if user exists
          while (useAuthStore.getState().loading) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          if (!useAuthStore.getState().user) {
            handleWalletLogin(publicKey);
          }
        },
      });
    }
  };

  const handleWalletLogin = async (publicKey: string) => {
    if (!publicKey) {
      toast.error('Wallet not connected. Please connect your wallet first.');
      return;
    }
    if (!user) {
      disconnect();
      toast.error('User not found. Please register first.');
      onClose();
      onSwitchToRegister?.();
      return;
    }

    try {
      setIsWalletSubmitting(true);
      toast.success('Login successful!');
      onClose();
      router.push(`/dashboard?redirect=${encodeURIComponent(location)}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Wallet login failed. Please try again.');
    } finally {
      setIsWalletSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateField('email', formData.email);
    const passwordError = validateField('password', formData.password);

    setFieldErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    setIsSubmitting(true);

    try {
      // Try direct Firebase auth first
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
      } catch (authError: any) {
        throw authError;
      }

      // Fetch user data from Firestore through auth store
      await useAuthStore.getState().fetchUserFromFirestore();

      // Get the current user from auth store
      const { user } = useAuthStore.getState();

      if (!user) {
        throw new Error('User profile not found or incomplete.');
      }

      toast.success('Login successful!');
      onClose();

      // Check if wallet needs to be connected
      setTimeout(async () => {
        // Get the latest user data from the auth store
        const currentUser = useAuthStore.getState().user;

        // For sponsors, automatically prompt wallet connection if they don't have one
        if (currentUser?.role === 'sponsor' && !currentUser.walletConnected) {
          try {
            const kit = await getWalletKit();
            if (kit) {
              const publicKey = await connect();
              if (publicKey) {
                // Update user's wallet info through the auth store
                await useAuthStore.getState().connectWalletToUser({
                  address: publicKey,
                  publicKey,
                  network: 'TESTNET',
                  connectedAt: new Date().toISOString(),
                });

                toast.success('Wallet connected successfully!');
              }
            }
          } catch (walletError) {
            console.error('Error connecting wallet:', walletError);
            toast.error(
              'Failed to connect wallet. Please try again in your dashboard.'
            );
          }
        }

        // Redirect to dashboard
        router.push('/dashboard');
      }, 100);
    } catch (err: any) {
      if (err.code) {
        switch (err.code) {
          case 'auth/user-not-found':
            toast.error(
              'No user found with this email. Please check your email address.'
            );
            break;
          case 'auth/wrong-password':
            toast.error('Incorrect password. Please try again.');
            break;
          case 'auth/too-many-requests':
            toast.error('Too many attempts. Please try again later.');
            break;
          case 'auth/network-request-failed':
            toast.error(
              'Network error. Please check your internet connection.'
            );
            break;
          case 'auth/invalid-email':
            toast.error(
              'Invalid email format. Please provide a valid email address.'
            );
            break;
          case 'auth/operation-not-allowed':
            toast.error(
              'Email/Password login is not enabled. Please contact support.'
            );
            break;
          case 'auth/user-disabled':
            toast.error(
              'This account has been disabled. Please contact support.'
            );
            break;
          case 'auth/invalid-credential':
            toast.error(
              'Invalid login credentials. Please check your email and password.'
            );
            break;
          case 'auth/invalid-login-credentials':
            toast.error(
              'Invalid login credentials. Please check your email and password.'
            );
            break;
          default:
            console.error('Unhandled Firebase error:', err);
            toast.error(
              `Login error: ${err.code}. Please try again or contact support.`
            );
            break;
        }
      } else {
        toast.error(err.message || 'Login failed. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add forgot password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResettingPassword(true);

    try {
      const result = await forgotPassword(resetEmail);
      if (result.success) {
        toast.success('Password reset email sent. Please check your inbox.');
        // Return to main login view after successful password reset request
        setCurrentView('main');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to send password reset email. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Main content
  const renderMainContent = () => (
    <>
      <motion.button
        onClick={handleWalletConnect}
        disabled={isWalletSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-black/40 text-white py-3 px-4 rounded-lg mb-6 hover:bg-black/60 transition-colors border border-white/10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        {isConnected ? (
          <>
            <SiBlockchaindotcom className="w-5 h-5" />
            {publicKey?.substring(0, 6)}...
            {publicKey?.substring(publicKey?.length - 6)}
          </>
        ) : (
          <>
            <SiBlockchaindotcom className="w-5 h-5" />
            Connect Wallet
          </>
        )}
      </motion.button>

      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute left-0 w-full border-t border-white/10"></div>
        <div className="relative bg-[#070708] px-4 text-sm text-gray-300">
          or
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <motion.div
          className="mb-6"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="input w-full pl-10 transition-all border-white/20 bg-white/10 backdrop-blur-xl text-white"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-sm text-red-300 mt-1">{fieldErrors.email}</p>
          )}
        </motion.div>

        <motion.div
          className="mb-8"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative">
            <PasswordInput
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="input w-full pl-10 transition-all border-white/20 bg-white/10 backdrop-blur-xl text-white"
              icon={<FiLock />}
              required
            />
          </div>
          {fieldErrors.password && (
            <p className="text-sm text-red-300 mt-1">{fieldErrors.password}</p>
          )}
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={() => setCurrentView('forgot-password')}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </motion.div>

        <motion.button
          type="submit"
          className="bg-white text-black font-medium py-3 px-4 rounded-lg hover:bg-white/90 transition-colors w-full"
          disabled={isSubmitting}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSubmitting ? (
            <span className="flex gap-2 items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 rounded-full bg-black animate-bounce"></span>
            </span>
          ) : (
            'Sign In'
          )}
        </motion.button>
      </form>

      <div className="mt-6 relative flex items-center justify-center">
        <div className="absolute left-0 w-full border-t border-white/10"></div>
        <div className="relative bg-[#070708] px-4 text-sm text-gray-300">
          or continue with
        </div>
      </div>

      <motion.div
        className="mt-6 relative"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <span className="absolute -top-2 right-0 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
          Coming Soon
        </span>
        <motion.button
          disabled={true}
          className="w-full flex items-center justify-center gap-2 border border-white/20 bg-white/10 hover:bg-white/10 text-white py-3 px-4 rounded-lg transition-colors opacity-70 cursor-not-allowed"
          whileHover={{ scale: 1 }}
          whileTap={{ scale: 1 }}
        >
          <FcGoogle className="w-5 h-5" />
          <span>Google Sign-in</span>
        </motion.button>
      </motion.div>

      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-gray-300">
          Don't have an account?{' '}
          <button
            onClick={() => {
              onClose();
              onSwitchToRegister?.();
            }}
            className="text-white hover:underline font-medium"
          >
            Register
          </button>
        </p>
      </motion.div>
    </>
  );

  // Add new render function for forgot password view
  const renderForgotPasswordContent = () => {
    return (
      <div className="space-y-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-300 text-center"
        >
          Enter your email address and we'll send you a link to reset your
          password
        </motion.p>

        <form onSubmit={handleForgotPassword}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" />
              <input
                type="email"
                placeholder="Your email address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="input w-full pl-10 transition-all border-white/20 bg-white/10 backdrop-blur-xl text-white"
                required
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col space-y-4"
          >
            <button
              type="submit"
              className="btn-gradient w-full py-3 rounded-xl font-medium text-white"
              disabled={isResettingPassword}
            >
              {isResettingPassword ? 'Sending...' : 'Send Mail'}
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('main')}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Back to Login
            </button>
          </motion.div>
        </form>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fixed overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal container - absolutely positioned in the viewport */}
          <div
            className="fixed inset-0 flex items-start justify-center z-[9999] pt-20"
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="backdrop-blur-xl bg-[#070708] border border-white/20 rounded-xl shadow-2xl w-full max-w-md mx-auto z-[10000]"
              style={{ maxHeight: '80vh', overflowY: 'auto' }}
            >
              <div className="p-8 relative">
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
                  {currentView === 'main' ? (
                    <>
                      <h2 className="text-3xl font-bold mb-2 text-white text-center">
                        Welcome Back
                      </h2>
                      <p className="text-gray-300 text-center mb-8">
                        Sign in to your account
                      </p>
                    </>
                  ) : currentView === 'wallet-selector' ? (
                    <>
                      <h2 className="text-3xl font-bold mb-2 text-white text-center">
                        Select Wallet
                      </h2>
                      <p className="text-gray-300 text-center mb-8">
                        Choose your preferred wallet
                      </p>
                    </>
                  ) : currentView === 'forgot-password' ? (
                    <>
                      <h2 className="text-3xl font-bold mb-2 text-white text-center">
                        Reset Password
                      </h2>
                      <p className="text-gray-300 text-center mb-8">
                        We'll send you a reset link
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-bold mb-2 text-white text-center">
                        Link Your Account
                      </h2>
                      <p className="text-gray-300 text-center mb-8">
                        Enter your email to continue
                      </p>
                    </>
                  )}
                </motion.div>

                {formError && currentView === 'main' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/20 text-red-300 border border-red-700/30 p-4 rounded-lg mb-6 text-sm"
                  >
                    {formError}
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {currentView === 'main' && renderMainContent()}

                  {currentView === 'forgot-password' && (
                    <motion.div
                      key="forgot-password"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      {renderForgotPasswordContent()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
