import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiUsers, 
  FiSettings, 
  FiLifeBuoy, 
  FiFileText, 
  FiActivity, 
  FiMenu, 
  FiX,
  FiLogOut
} from 'react-icons/fi';
import useUserStore from '@/lib/stores/useUserStore';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);

  const navigationItems = [
    { name: 'Dashboard', icon: FiHome, href: '/admin/dashboard' },
    { name: 'Bounties', icon: FiLifeBuoy, href: '/admin/bounties' },
    { name: 'Submissions', icon: FiFileText, href: '/admin/submissions' },
    { name: 'Users', icon: FiUsers, href: '/admin/users' },
    { name: 'Analytics', icon: FiActivity, href: '/admin/analytics' },
    { name: 'Settings', icon: FiSettings, href: '/admin/settings' },
  ];

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      clearUser();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-[#070708]">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-gray-800 text-white"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Sidebar backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-gray-900 text-white transform transition-transform ease-in-out duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <img src="/images/unicorn-logo.svg" alt="Logo" className="w-8 h-8" />
            <span className="text-xl font-bold">Admin Panel</span>
          </Link>
        </div>

        <div className="px-3 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-md ${
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                {user?.firstName?.[0] || 'A'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.firstName || 'Admin'}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2 text-sm text-red-400 rounded-md hover:bg-gray-800"
          >
            <FiLogOut className="w-5 h-5 mr-3" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`md:pl-64 transition-all duration-300`}>
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 