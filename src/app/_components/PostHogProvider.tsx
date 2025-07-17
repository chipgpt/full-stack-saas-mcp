'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: '/chipgpt',
        ui_host: 'https://us.posthog.com',
        defaults: '2025-05-24',
        capture_exceptions: true, // Enables capturing exceptions using Error Tracking
        debug: process.env.NODE_ENV === 'development',
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
