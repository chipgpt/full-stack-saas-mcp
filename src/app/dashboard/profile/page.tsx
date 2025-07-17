'use client';

import {
  DEFAULT_PROFILE_INFO,
  ProfileForm,
  userFormSchema,
  UserFormSchemaType,
} from '@/app/_components/Profile/Form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { IUser } from '@/server/models/user';
import { useMutation } from '@tanstack/react-query';
import { DEFAULT_MUTATION_ERROR, handleAxiosError } from '@/app/lib/axios';
import { saveProfile } from '@/app/lib/user';
import { CheckCircleIcon } from 'lucide-react';
import { redirect } from 'next/navigation';

export default function DashboardProfilePage() {
  const session = useSession();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<UserFormSchemaType>({
    resolver: zodResolver(userFormSchema),
    defaultValues: DEFAULT_PROFILE_INFO,
  });

  useEffect(() => {
    if (session.data?.user) {
      form.setValue('context', (session.data?.user as IUser).profile.context || '');
    }
  }, [form, session]);

  const saveProfileMutation = useMutation({
    mutationFn: saveProfile,
    onSuccess() {
      setLoading(false);
      setShowSuccess(true);
      session.update();
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: handleAxiosError(DEFAULT_MUTATION_ERROR),
  });

  if (session.status === 'unauthenticated') {
    redirect('/api/auth/signin');
  }

  if (session.status === 'loading') {
    return <div>Logging in...</div>;
  }

  if (!session?.data?.user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2"></div>
        </div>
      </div>
    );
  }

  const onSubmit = async () => {
    setLoading(true);
    saveProfileMutation.mutate(form.getValues());
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Profile</h1>
              <p className="text-gray-400">Configure your profile</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-500/10 backdrop-blur-md border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Profile updated successfully!</span>
          </div>
        )}

        {/* Profile Form Section */}
        <section className="rounded-2xl p-8 mb-6 border">
          <ProfileForm form={form} onSubmit={onSubmit} loading={loading} />
        </section>
      </div>
    </div>
  );
}
