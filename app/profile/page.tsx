'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase';
import ProfileForm from '@/components/profile/ProfileForm';
import type { Profile } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const supabase = createBrowserSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    setUserId(user.id);

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(data);
    setLoading(false);
  };

  const handleSave = () => {
    router.push('/event');
  };

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="font-display italic text-lg" style={{ color: 'var(--accent-warm)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: 'var(--bg)' }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display italic text-3xl mb-2" style={{ color: 'var(--ink)' }}>
            Your Profile
          </h1>
          <p className="font-body text-sm" style={{ color: 'var(--accent-warm)' }}>
            Tell us a little about yourself
          </p>
        </div>

        <ProfileForm
          userId={userId}
          initialName={profile?.name || sessionStorage.getItem('rsvp_name') || ''}
          initialAvatarUrl={profile?.avatar_url}
          initialDietary={profile?.dietary_restrictions || []}
          onSave={handleSave}
        />
      </div>
    </main>
  );
}
