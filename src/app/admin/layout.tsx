'use client';

import { useAdminProtectedRoute } from '@/hooks/useAdminProtectedRoute';
import useAuthStore from '@/lib/stores/auth.store';
import { AuthState } from '@/types/auth.types';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminProtectedRoute();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state: AuthState) => state.user);
  const logout = useAuthStore((state: AuthState) => state.logout);

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Signed out successfully');
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/bounties', label: 'Bounties' },
    { href: '/admin/submissions', label: 'Submissions' },
    { href: '/admin/users', label: 'Users' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar Toggle Button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white/10 rounded-lg md:hidden"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isSidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="h-full backdrop-blur-xl bg-white/10 border-r border-white/20 flex flex-col">
          <div className="p-6 border-b border-white/20">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-white/20 text-white'
                    : 'hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-white/20">
            <div className="mb-4">
              <p className="text-sm text-white/60">Logged in as</p>
              <p className="font-medium">{user?.email || 'Admin'}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all ${isSidebarOpen ? 'md:ml-64' : ''} p-8`}>
        {children}
      </main>
    </div>
  );
}
