'use client';

import { HeaderButton } from '../_components/SignInButton';
import { usePathname } from 'next/navigation';
import { HomeIcon, UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import DashboardNav from './DashboardNav';
import { useSession } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: any }) {
  const session = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const navigationItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      active: pathname === '/dashboard',
    },
    {
      href: '/dashboard/profile',
      label: 'Profile',
      icon: UserIcon,
      active: pathname === '/dashboard/profile',
    },
    // Future navigation items can be easily added here
    // {
    //   href: '/dashboard/analytics',
    //   label: 'Analytics',
    //   icon: BarChart3Icon,
    //   active: pathname.startsWith('/dashboard/analytics'),
    // },
    // {
    //   href: '/dashboard/calendar',
    //   label: 'Calendar',
    //   icon: CalendarIcon,
    //   active: pathname.startsWith('/dashboard/calendar'),
    // },
    // {
    //   href: '/dashboard/content',
    //   label: 'Content',
    //   icon: BookOpenIcon,
    //   active: pathname.startsWith('/dashboard/content'),
    // },
    // {
    //   href: '/dashboard/settings',
    //   label: 'Settings',
    //   icon: SettingsIcon,
    //   active: pathname.startsWith('/dashboard/settings'),
    // },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 border-b">
        <div className="mx-auto px-4 sm:px-6 py-4">
          <nav className="flex justify-between items-center">
            {/* Desktop Navigation */}
            {session.status === 'authenticated' && (
              <DashboardNav navigationItems={navigationItems} />
            )}

            {/* User Actions */}
            <div className="flex items-center gap-3">
              {session.status === 'authenticated' && <HeaderButton />}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn('relative z-10 transition-all')}>{children}</main>
    </div>
  );
}
