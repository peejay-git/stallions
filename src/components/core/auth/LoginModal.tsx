'use client';

import { useWallet } from '@/hooks/useWallet';
import { forgotPassword, walletToAccount } from '@/lib/authService';
import { auth } from '@/lib/firebase';
import useAuthStore from '@/lib/stores/auth.store';
import { getWalletKit } from '@/lib/wallet';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { IoClose } from 'react-icons/io5';
import { 
  EmailPasswordForm, 
  ForgotPasswordForm,
  WalletLoginForm,
  EmailPasswordFormData,
  EmailPasswordFieldErrors 
} from './login';

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
  const { publicKey, isConnected, connect } = useWallet();
  
  // Form state for email/password login
  const [formData, setFormData] = useState<EmailPasswordFormData>({ 
    email: '', 
    password: '' 
  });
  const [fieldErrors, setFieldErrors] = useState<EmailPasswordFieldErrors>({
    email: '', 
    password: '' 
  });
  const [formError, setFormError] = useState<string | null>(null);
  
  // Login submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWalletSubmitting, setIsWalletSubmitting] = useState(false);
  
  // Wallet login state
  const [walletEmail, setWalletEmail] = useState('');
  
  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  
  // View state
  const [currentView, setCurrentView] = useState<LoginView>('main');
  const [animationComplete, setAnimationComplete] = useState(false);

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
    if (isConnected) {
      handleWalletLogin();
    } else {
      await connect({
        onWalletSelected: async () => {
          // Wait for user to be set, then check if user exists
          while (useAuthStore.getState().loading) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          if (!useAuthStore.getState().user) {
            handleWalletLogin();
          }
        },
      });
    }
  };

  const handleWalletLogin = async () => {
    // Wait for public key to be set
    while (!publicKey) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!publicKey) {
      toast.error('Wallet not connected. Please connect your wallet first.');
      return;
    }

    if (!walletEmail) {
      toast.error('Please enter your email address.');
      return;
    }

    try {
      setIsWalletSubmitting(true);

      // Try to link wallet to account or login
      const result = await walletToAccount(publicKey, walletEmail);

      if (result.success) {
        toast.success('Login successful!');
        onClose();
        router.push(`/dashboard?redirect=${encodeURIComponent(location)}`);
      } else {
        // Account not found, prompt to create one
        toast.error(
          result.message || 'Account not found. Please register first.'
        );
        onClose();
        onSwitchToRegister?.();
      }
    } catch (err) {
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

  // Renders form content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'main':
        return (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <EmailPasswordForm
              formData={formData}
              fieldErrors={fieldErrors}
              formError={formError}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onChange={handleChange}
              onForgotPassword={() => setCurrentView('forgot-password')}
              onSwitchToRegister={() => {
                onClose();
                onSwitchToRegister?.();
              }}
            />
            
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#070708] text-gray-400">Or</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setCurrentView('wallet-selector')}
              className="mt-6 w-full bg-white/5 hover:bg-white/10 text-white py-2 px-4 rounded transition duration-200 border border-white/10 flex justify-center items-center"
            >
              Continue with Wallet
            </button>
            
            {/* Google login button - currently disabled 
            <button
              type="button"
              className="mt-3 w-full bg-white hover:bg-gray-100 text-gray-900 py-2 px-4 rounded transition duration-200 flex justify-center items-center"
            >
              <FcGoogle className="mr-2 text-xl" />
              Continue with Google
            </button> */}
          </motion.div>
        );
        
      case 'wallet-selector':
        return (
          <motion.div
            key="wallet-selector"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <WalletLoginForm
              isConnected={isConnected}
              publicKey={publicKey}
              email={walletEmail}
              isSubmitting={isWalletSubmitting}
              onEmailChange={(e) => setWalletEmail(e.target.value)}
              onWalletConnect={handleWalletConnect}
              onWalletLogin={handleWalletLogin}
              onBack={() => setCurrentView('main')}
            />
          </motion.div>
        );
        
      case 'forgot-password':
        return (
          <motion.div
            key="forgot-password"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ForgotPasswordForm
              email={resetEmail}
              isSubmitting={isResettingPassword}
              error={resetError}
              success={resetSuccess}
              onChange={(e) => setResetEmail(e.target.value)}
              onSubmit={handleForgotPassword}
              onBack={() => setCurrentView('main')}
            />
          </motion.div>
        );
        
      default:
        return null;
    }
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
                  {currentView === 'main' && (
                    <>
                      <h2 className="text-3xl font-bold mb-2 text-white text-center">
                        Welcome Back
                      </h2>
                      <p className="text-gray-300 text-center mb-8">
                        Sign in to your account
                      </p>
                    </>
                  )}
                  
                  {currentView === 'wallet-selector' && (
                    <>
                      <h2 className="text-3xl font-bold mb-2 text-white text-center">
                        Connect Wallet
                      </h2>
                      <p className="text-gray-300 text-center mb-8">
                        Sign in with your blockchain wallet
                      </p>
                    </>
                  )}
                  
                  {currentView === 'forgot-password' && (
                    <>
                      <h2 className="text-3xl font-bold mb-2 text-white text-center">
                        Reset Password
                      </h2>
                      <p className="text-gray-300 text-center mb-8">
                        We'll send you a reset link
                      </p>
                    </>
                  )}
                </motion.div>
                
                <AnimatePresence mode="wait">
                  {renderContent()}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
