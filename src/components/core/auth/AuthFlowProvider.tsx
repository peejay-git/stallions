'use client';

import ChooseRoleModal from '@/components/core/auth/ChooseRoleModal';
import LoginModal from '@/components/core/auth/LoginModal';
import OnboardModal from '@/components/core/auth/OnboardModal';
import RegisterModal from '@/components/core/auth/RegisterModal';
import useAuthStore from '@/lib/stores/auth.store';
import { usePathname } from 'next/navigation';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type AuthRole = 'talent' | 'sponsor';

type StartOptions = {
  role?: AuthRole | null;
  redirect?: string | null;
};

interface AuthFlowContextType {
  startRegister: (opts?: StartOptions) => void;
  startLogin: (opts?: StartOptions) => void;
  startOnboarding: (opts?: StartOptions) => void;
  chooseRole: (opts?: StartOptions) => void;
}

const AuthFlowContext = createContext<AuthFlowContextType | null>(null);

export function AuthFlowProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const [showChooseRole, setShowChooseRole] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AuthRole | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const resetModals = useCallback(() => {
    setShowChooseRole(false);
    setShowLogin(false);
    setShowRegister(false);
    setShowOnboard(false);
  }, []);

  const startRegister = useCallback(
    (opts?: StartOptions) => {
      const role = opts?.role ?? null;
      const redirect = opts?.redirect ?? pathname;
      setRedirectTo(redirect || null);

      if (!role) {
        // Ask for role first, then open register
        setSelectedRole(null);
        setShowChooseRole(true);
        setShowRegister(false);
      } else {
        setSelectedRole(role);
        setShowRegister(true);
      }
    },
    [pathname]
  );

  const startLogin = useCallback(
    (opts?: StartOptions) => {
      const redirect = opts?.redirect ?? pathname;
      setRedirectTo(redirect || null);
      setShowLogin(true);
    },
    [pathname]
  );

  const startOnboarding = useCallback(
    (opts?: StartOptions) => {
      const rawRole = (opts?.role ?? user?.role ?? null) as any;
      const role: AuthRole | null =
        rawRole === 'talent' || rawRole === 'sponsor' ? rawRole : null;
      const redirect = opts?.redirect ?? pathname;
      setRedirectTo(redirect || null);
      if (!role) {
        setShowChooseRole(true);
        setSelectedRole(null);
      } else {
        setSelectedRole(role);
        setShowOnboard(true);
      }
    },
    [pathname, user?.role]
  );

  const chooseRole = useCallback(
    (opts?: StartOptions) => {
      const role = opts?.role ?? null;
      const redirect = opts?.redirect ?? pathname;
      setRedirectTo(redirect || null);
      if (role) {
        setSelectedRole(role);
      } else {
        setSelectedRole(null);
      }
      setShowChooseRole(true);
    },
    [pathname]
  );

  const handleRoleChosen = useCallback((role: AuthRole) => {
    setSelectedRole(role);
    setShowChooseRole(false);

    // If we were in a registration intent, proceed to register
    setShowRegister(true);
  }, []);

  const value = useMemo<AuthFlowContextType>(
    () => ({
      startRegister,
      startLogin,
      startOnboarding,
      chooseRole,
    }),
    [startRegister, startLogin, startOnboarding, chooseRole]
  );

  return (
    <AuthFlowContext.Provider value={value}>
      {children}

      {/* Centralized modals */}
      <ChooseRoleModal
        isOpen={showChooseRole}
        onClose={() => setShowChooseRole(false)}
        onChooseRole={handleRoleChosen}
        canCloseModal={true}
      />

      {showLogin && (
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowChooseRole(true);
          }}
          switchToOnboarding={() => {
            setShowLogin(false);
            setShowOnboard(true);
          }}
        />
      )}

      {showRegister && (
        <RegisterModal
          isOpen={showRegister}
          onClose={() => setShowRegister(false)}
          selectedRole={selectedRole ?? undefined}
        />
      )}

      {showOnboard && (selectedRole || user) && (
        <OnboardModal
          isOpen={showOnboard}
          onClose={() => setShowOnboard(false)}
          selectedRole={selectedRole ?? undefined}
          user={user}
        />
      )}
    </AuthFlowContext.Provider>
  );
}

export function useAuthFlow() {
  const ctx = useContext(AuthFlowContext);
  if (!ctx) throw new Error('useAuthFlow must be used within AuthFlowProvider');
  return ctx;
}
