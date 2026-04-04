'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase';
import EventCard from '@/components/archive/EventCard';
import type { EventWithCookbook } from '@/lib/types';

export default function ArchivePage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventWithCookbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchive();
  }, []);

  const loadArchive = async () => {
    const supabase = createBrowserSupabase();

    // Get past events (archived ones)
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', false)
      .order('date', { ascending: false });

    // Filter out Vol 1 from DB just in case it's there
    const filteredEvents = (eventsData || []).filter(e => e.volume_number !== 1);

    // Fetch cookbooks separately (joined via cookbooks.event_id)
    const enriched = await Promise.all(filteredEvents.map(async (event) => {
      const { data: cookbookData } = await supabase
        .from('cookbooks')
        .select('*')
        .eq('event_id', event.id)
        .single();
      return { ...event, cookbook: cookbookData };
    }));

    const HARDCODED_VOL1 = {
      id: 'vol1',
      title: 'Vol. 1',
      volume_number: 1,
      date: '2026-03-08',
      cookbook_id: 'mock',
      color_theme: null,
      lock_time: null,
      is_active: false,
      created_at: '2026-03-01T00:00:00Z',
      cookbook: {
        id: 'mock',
        name: 'The Chutney Life',
        cover_url: 'https://m.media-amazon.com/images/I/81+L0WwK-RL._AC_UF1000,1000_QL80_.jpg',
        pdf_url: 'https://drive.google.com/file/d/1jhak8Njmp9kDRDU4DGKDEm_cXAm7M7VH/view?usp=drive_link',
        event_id: 'vol1',
        created_at: '2026-03-01T00:00:00Z'
      }
    };

    setEvents([...enriched, HARDCODED_VOL1 as any]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="font-display italic text-lg" style={{ color: 'var(--accent-warm)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 pb-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display italic text-3xl mb-2" style={{ color: 'var(--ink)' }}>
            Our Suppers
          </h1>
          <p className="font-body text-sm" style={{ color: 'var(--accent-warm)' }}>
            A scrapbook of evenings shared ♡
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display italic text-xl mb-2" style={{ color: 'var(--accent-warm)' }}>
              No past events yet
            </p>
            <p className="font-body text-sm" style={{ color: 'var(--accent-warm)', opacity: 0.7 }}>
              After your first supper club, memories will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {events.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 py-3 px-4 flex justify-center gap-6" style={{
        background: 'var(--surface)',
        borderTop: '1px solid rgba(212, 184, 150, 0.3)',
      }}>
        <button onClick={() => router.push('/event')} className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
          Menu
        </button>
        <button onClick={() => router.push('/archive')} className="text-xs font-body font-medium" style={{ color: 'var(--accent)' }}>
          Archive
        </button>
        <button onClick={() => router.push('/profile')} className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
          Profile
        </button>
      </nav>
    </main>
  );
}
