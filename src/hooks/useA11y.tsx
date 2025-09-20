import React, { createContext, useContext, useEffect, useState } from 'react';

interface A11yContextType {
  reduceMotion: boolean;
  highContrast: boolean;
  screenReaderEnabled: boolean;
  toggleReduceMotion: () => void;
  toggleHighContrast: () => void;
}

const A11yContext = createContext<A11yContextType | undefined>(undefined);

interface A11yProviderProps {
  children: React.ReactNode;
}

export function A11yProvider({ children }: A11yProviderProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  useEffect(() => {
    // Check user's system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduceMotion(prefersReducedMotion);

    // Check for high contrast mode
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
    setHighContrast(prefersHighContrast);

    // Check if screen reader is enabled (approximate detection)
    const hasScreenReader = document.querySelector('[role="alert"]') !== null;
    setScreenReaderEnabled(hasScreenReader);
  }, []);

  useEffect(() => {
    // Apply accessibility classes to root element
    const root = document.documentElement;
    if (reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [reduceMotion, highContrast]);

  const toggleReduceMotion = () => setReduceMotion((prev) => !prev);
  const toggleHighContrast = () => setHighContrast((prev) => !prev);

  return (
    <A11yContext.Provider
      value={{
        reduceMotion,
        highContrast,
        screenReaderEnabled,
        toggleReduceMotion,
        toggleHighContrast,
      }}
    >
      {children}
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const context = useContext(A11yContext);
  if (context === undefined) {
    throw new Error('useA11y must be used within an A11yProvider');
  }
  return context;
}

// Utility hook for handling focus trapping in modals
export function useFocusTrap(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstFocusable?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, [ref]);
}

// Utility hook for handling keyboard shortcuts
export function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key) {
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback]);
}

// Utility hook for announcing messages to screen readers
export function useAnnounce() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!message) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'alert');
    announcement.setAttribute('aria-live', 'polite');
    announcement.style.position = 'absolute';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.padding = '0';
    announcement.style.margin = '-1px';
    announcement.style.overflow = 'hidden';
    announcement.style.clip = 'rect(0, 0, 0, 0)';
    announcement.style.whiteSpace = 'nowrap';
    announcement.style.border = '0';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement is made
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [message]);

  return setMessage;
}
