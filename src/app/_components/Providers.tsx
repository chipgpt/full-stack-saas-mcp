'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from './PostHogProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export default function Providers(props: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
      </SessionProvider>
    </PostHogProvider>
  );
}
