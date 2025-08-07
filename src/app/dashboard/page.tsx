'use client';

import { CreditCardIcon, CrownIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const session = useSession();

  if (session.status === 'unauthenticated') {
    redirect('/api/auth/signin');
  }

  if (session.status === 'loading') {
    return <div>Logging in...</div>;
  }

  // Get current plan information
  const currentPlan = session.data?.user?.plan || null;
  const getPlanInfo = (plan: string | null) => {
    switch (plan) {
      case 'starter':
        return { name: 'Starter', price: '$9/mo', gradient: 'from-green-500 to-emerald-500' };
      default:
        return { name: 'Free', price: '$0/mo', gradient: 'from-gray-500 to-slate-500' };
    }
  };

  const planInfo = getPlanInfo(currentPlan);

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

        {/* Subscription Plan Section */}
        <section className="mb-8">
          <div className="border rounded-2xl p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${planInfo.gradient}`}>
                  <CrownIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{planInfo.name} Plan</h3>
                  <p className="text-gray-400 text-sm">{planInfo.price}</p>
                </div>
              </div>
              <Link
                href="/api/billing"
                className="group flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-300 hover:scale-105"
              >
                <CreditCardIcon className="w-4 h-4" />
                <span className="text-sm">Manage</span>
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
