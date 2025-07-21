'use client';

import ChooseRoleModal from '@/components/core/auth/ChooseRoleModal';
import LoginModal from '@/components/core/auth/LoginModal';
import RegisterModal from '@/components/core/auth/RegisterModal';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import useAuthStore from '@/lib/stores/auth.store';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Pre-defined nav links to avoid recreation on render
const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Bounties', href: '/bounties' },
];

// Separate Create Bounty link to conditionally show it
const createBountyLink = { name: 'Create', href: '/create' };

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected, disconnect, publicKey, connect } = useWallet();
  const [showRegister, setShowRegister] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'talent' | 'sponsor' | null>(
    null
  );
  const [showLogin, setShowLogin] = useState(false);
  const [chooseRoleOpen, setChooseRoleOpen] = useState(false);
  const router = useRouter();
  const { user, AuthModals, isAuthenticated } = useAuth();
  const { updateUserProfile, updateUserRole } = useAuthStore((state) => state);
  const logout = useAuthStore((state) => state.logout);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Memoized toggle function
  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleWalletConnect = useCallback(() => {
    connect();
  }, []);

  const handleLogout = useCallback(() => {
    // Confirm logout
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (!confirmLogout) return;

    logout();
    if (isConnected) {
      disconnect();
    }
    router.push('/');
  }, [logout, isConnected, disconnect, router]);

  const handleRoleSelection = useCallback(
    async (role: 'talent' | 'sponsor') => {
      if (chooseRoleOpen && !isAuthenticated) {
        // For registration flow
        setSelectedRole(role);
        setChooseRoleOpen(false);
        setShowRegister(true);
      } else {
        // For existing user profile update
        try {
          await updateUserRole(role);
          setChooseRoleOpen(false);
          toast.success(
            `Profile updated as ${role === 'talent' ? 'Talent' : 'Sponsor'}`
          );
        } catch (error) {
          console.error('Error updating role:', error);
          toast.error('Failed to update role. Please try again.');
        }
      }
    },
    [chooseRoleOpen, isAuthenticated, updateUserProfile]
  );

  return (
    <header className="sticky top-0 z-40 bg-[#070708] shadow-md">
      {/* Role Selection Modal */}
      <ChooseRoleModal
        isOpen={chooseRoleOpen}
        onClose={() => setChooseRoleOpen(false)}
        onChooseRole={handleRoleSelection}
      />
      {showRegister && (
        <RegisterModal
          isOpen={showRegister}
          onClose={() => setShowRegister(false)}
          selectedRole={selectedRole}
        />
      )}

      {showLogin && (
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => setChooseRoleOpen(true)}
        />
      )}

      {/* Render auth modals (Profile completion and Wallet prompt) */}
      <AuthModals />

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
                  priority
                />
                <span className="text-xl font-bold text-white">Stallion</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 bg-white/5 p-3 rounded-2xl">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium whitespace-nowrap nav-txt p-3 rounded-[10px] ${
                  pathname === link.href
                    ? 'text-white bg-white/10'
                    : 'text-[#797C86] hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Only show Create link for sponsors */}
            {user && user.role === 'sponsor' && (
              <Link
                href={createBountyLink.href}
                className={`font-medium whitespace-nowrap nav-txt p-3 rounded-[10px] ${
                  pathname === createBountyLink.href
                    ? 'text-white bg-white/10'
                    : 'text-[#797C86] hover:bg-white/10 hover:text-white'
                }`}
              >
                {createBountyLink.name}
              </Link>
            )}

            {user && (
              <Link
                href="/dashboard"
                className={`font-medium whitespace-nowrap nav-txt p-3 rounded-[10px] ${
                  pathname === '/dashboard'
                    ? 'text-white bg-white/10'
                    : 'text-[#797C86] hover:bg-white/10 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Wallet Connect Button (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {isConnected && !user && (
              <button
                onClick={() => setChooseRoleOpen(true)}
                className="bg-white text-black font-medium py-1.5 px-4 rounded-lg hover:bg-white/90"
              >
                Complete Profile
              </button>
            )}

            {/* Auth buttons for desktop */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-x-2 text-sm text-white">
                  {isConnected && publicKey ? (
                    <button
                      onClick={handleLogout}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-mono py-1.5 px-4 rounded-lg flex items-center gap-x-1 transition-colors"
                      title="Disconnect wallet"
                    >
                      {`${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                    </button>
                  ) : null}
                  {/* Only show Connect Wallet for non-talent users */}
                  {!isConnected && !publicKey && user?.role !== 'talent' ? (
                    <>
                      <button
                        onClick={handleWalletConnect}
                        className="bg-white text-black font-medium py-1.5 px-4 rounded-lg hover:bg-white/90"
                      >
                        Connect Wallet
                      </button>
                      <button
                        onClick={handleLogout}
                        className="bg-white text-black font-medium py-1.5 px-4 rounded-lg hover:bg-white/90"
                      >
                        Logout
                      </button>
                    </>
                  ) : null}
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-white text-black font-medium py-1.5 px-4 rounded-lg hover:bg-white/90"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isMenuOpen
                      ? 'M6 18L18 6M6 6l12 12'
                      : 'M4 6h16M4 12h16M4 18h16'
                  }
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div
          className="md:hidden bg-[#070708]/90 border-t border-white/10"
          id="mobile-menu"
        >
          <div className="pt-2 pb-4 space-y-1 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2 font-medium ${
                  pathname === link.href
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={toggleMenu}
              >
                {link.name}
              </Link>
            ))}

            {/* Only show Create link for sponsors */}
            {user && user.role === 'sponsor' && (
              <Link
                href={createBountyLink.href}
                className={`block py-2 font-medium ${
                  pathname === createBountyLink.href
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={toggleMenu}
              >
                {createBountyLink.name}
              </Link>
            )}

            {user && (
              <Link
                href="/dashboard"
                className={`block py-2 font-medium ${
                  pathname === '/dashboard'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={toggleMenu}
              >
                Dashboard
              </Link>
            )}
          </div>

          <div className="pt-4 pb-3 border-t border-white/10">
            {/* Complete Profile button for connected wallets without accounts */}
            {isConnected && !user && (
              <button
                onClick={() => {
                  setChooseRoleOpen(true);
                  setIsMenuOpen(false);
                }}
                className="bg-white text-black font-medium py-1.5 w-full mb-2 rounded-lg hover:bg-white/90"
              >
                Complete Profile
              </button>
            )}

            {/* Authentication/Wallet buttons for mobile */}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="bg-white text-black font-medium py-1.5 w-full rounded-lg hover:bg-white/90"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowLogin(true);
                  setIsMenuOpen(false);
                }}
                className="bg-white text-black font-medium py-1.5 px-4 w-full mb-2 rounded-lg hover:bg-white/90"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
