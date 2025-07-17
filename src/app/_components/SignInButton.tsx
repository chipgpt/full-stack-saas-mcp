'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { LogOutIcon, UserIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

export function HeaderButton() {
  const session = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position when opening
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 192, // 192px is the dropdown width (w-48)
        width: rect.width,
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update position on scroll and resize
  useEffect(() => {
    if (isDropdownOpen) {
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();

      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isDropdownOpen]);

  const handleToggleDropdown = () => {
    if (!isDropdownOpen) {
      updateDropdownPosition();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Don't render anything while session is loading
  if (session.status === 'loading') {
    return null;
  }

  return session.data?.user ? (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
          <UserIcon className="w-4 h-4 text-white" />
        </div>
        <ChevronDownIcon
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isDropdownOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu - Rendered via Portal */}
      {isDropdownOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] w-48 rounded-xl shadow-xl overflow-hidden"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            <div className="p-2">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to log out?')) {
                    signOut();
                  }
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200"
              >
                <LogOutIcon className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  ) : (
    <SignInButton />
  );
}

export function SignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn()}
      className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-orange-500/25"
    >
      Sign in
    </button>
  );
}

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm('Are you sure you want to log out?')) {
          signOut();
        }
      }}
      className="px-4 py-2 bg-black text-white rounded-lg font-medium transition-all duration-200"
    >
      Log out
    </button>
  );
}
