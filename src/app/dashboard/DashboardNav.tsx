'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, useLayoutEffect, useRef } from 'react';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}

export default function DashboardNav({ navigationItems }: { navigationItems: NavigationItem[] }) {
  const navRefs = useRef<(HTMLDivElement | null)[]>([]);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={navContainerRef}
      className="flex items-center gap-1 rounded-lg p-1 relative"
      style={{ overflow: 'hidden' }}
    >
      <div className="font-bold mr-5">
        <Link href="/">ChipGPT</Link>
      </div>
      {navigationItems.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.href}
            className="relative"
            ref={el => {
              navRefs.current[idx] = el;
            }}
          >
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300',
                'relative z-10',
                item.active ? '' : 'text-gray-400'
              )}
              style={{ overflow: 'hidden' }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <IconComponent className="w-4 h-4" />
                <span>{item.label}</span>
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
