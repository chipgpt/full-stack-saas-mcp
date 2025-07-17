'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const session = useSession();

  if (session.status === 'unauthenticated') {
    redirect('/api/auth/signin');
  }

  if (session.status === 'loading') {
    return <div>Logging in...</div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 p-6">
        {/* Header */}
        <section className="flex flex-row gap-4 items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Welcome to the dashboard, you are logged in as {session.data?.user?.email}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
