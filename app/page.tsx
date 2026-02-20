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
  const [event, setEvent] = useState<Event | null>(null);
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveEvent();
  }, []);

  const loadActiveEvent = async () => {
    const supabase = createBrowserSupabase();

    // Fetch event first
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (eventData) {
      setEvent(eventData);

      // Fetch cookbook separately to avoid ambiguous FK join
      if (eventData.cookbook_id) {
        const { data: cookbookData } = await supabase
          .from('cookbooks')
          .select('*')
          .eq('id', eventData.cookbook_id)
          .single();
        setCookbook(cookbookData);
      } else {
        // Try finding cookbook by event_id as fallback
        const { data: cookbookData } = await supabase
          .from('cookbooks')
          .select('*')
          .eq('event_id', eventData.id)
          .limit(1)
          .single();
        setCookbook(cookbookData);
      }
    }

    setLoading(false);
  };

  const handleAccept = async (name: string) => {
    sessionStorage.setItem('rsvp_name', name);
    sessionStorage.setItem('rsvp_status', 'attending');
    sessionStorage.setItem('rsvp_event_id', event?.id || '');

    // Check if a user with this name already exists
    const supabase = createBrowserSupabase();
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, name')
      .ilike('name', name.trim())
      .limit(1)
      .maybeSingle();

    if (existingProfile) {
      // Existing user — go to sign in
      router.push('/auth/login');
    } else {
      // New user — go to create account
      router.push('/auth/signup');
    }
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

  const volumeNum = event?.volume_number || 1;
  const volumeStr = `Vol. ${toRoman(volumeNum)}`;
  const dateStr = event?.date
    ? formatInviteDate(event.date)
    : 'Date TBD';
  const cookbookName = cookbook?.name || 'Cookbook TBD';
  const cookbookCover = cookbook?.cover_url || null;
  const eventTime = event?.event_time || null;
  const eventLocation = event?.location || null;

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Envelope>
        <InviteCard
          volumeNumber={volumeStr}
          dateFormatted={dateStr}
          cookbookName={cookbookName}
          cookbookCoverUrl={cookbookCover}
          eventTime={eventTime}
          eventLocation={eventLocation}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onSignIn={handleSignIn}
        />
      </Envelope>
    </main>
  );
}

