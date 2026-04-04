'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Envelope from '@/components/envelope/Envelope';
import InviteCard from '@/components/envelope/InviteCard';
import { createBrowserSupabase } from '@/lib/supabase';
import { toRoman, formatInviteDate } from '@/lib/theme';
import type { Event, Cookbook } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [event, setEvent] = useState<(Event & { cookbook?: Cookbook }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveEvent();
  }, []);

  const loadActiveEvent = async () => {
    const supabase = createBrowserSupabase();

    const { data } = await supabase
      .from('events')
      .select('*, cookbook:cookbooks(*)')
      .eq('is_active', true)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    setEvent(data);
    setLoading(false);
  };

  const handleAccept = async (name: string) => {
    // Store name in sessionStorage for signup pre-fill
    sessionStorage.setItem('rsvp_name', name);
    sessionStorage.setItem('rsvp_status', 'attending');
    sessionStorage.setItem('rsvp_event_id', event?.id || '');
  };

  const handleDecline = async (name: string) => {
    sessionStorage.setItem('rsvp_name', name);
    sessionStorage.setItem('rsvp_status', 'declined');
    sessionStorage.setItem('rsvp_event_id', event?.id || '');
  };

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="font-display italic text-lg" style={{ color: 'var(--accent-warm)' }}>
          ...
        </p>
      </div>
    );
  }

  // Fallback if no active event
  const volumeNum = event?.volume_number || 1;
  const volumeStr = `Vol. ${toRoman(volumeNum)}`;
  const dateStr = event?.date
    ? formatInviteDate(event.date)
    : 'Saturday, the 1st of March';
  const cookbookName = (event as any)?.cookbook?.name || 'Ottolenghi Simple';
  const cookbookCover = (event as any)?.cookbook?.cover_url || null;

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Envelope>
        <InviteCard
          volumeNumber={volumeStr}
          dateFormatted={dateStr}
          cookbookName={cookbookName}
          cookbookCoverUrl={cookbookCover}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onSignIn={handleSignIn}
        />
      </Envelope>
    </main>
  );
}
