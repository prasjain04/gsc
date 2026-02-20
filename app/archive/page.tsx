'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase';
import EventCard from '@/components/archive/EventCard';
import type { EventWithCookbook, Profile } from '@/lib/types';

interface ArchiveEvent {
  event: EventWithCookbook;
  attendees: Profile[];
}

export default function ArchivePage() {
  const router = useRouter();
  const [events, setEvents] = useState<ArchiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchive();
  }, []);

  const loadArchive = async () => {
    const supabase = createBrowserSupabase();

    // Get past events (date has passed or is_active = false)
    const { data: eventsData } = await supabase
      .from('events')
      .select('*, cookbook:cookbooks(*)')
      .lt('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (!eventsData || eventsData.length === 0) {
      setLoading(false);
      return;
    }

    // For each event, get attendees
    const archiveEvents: ArchiveEvent[] = [];
    for (const event of eventsData) {
      const { data: rsvps } = await supabase
        .from('rsvps')
        .select('profile:profiles(*)')
        .eq('event_id', event.id)
        .eq('status', 'attending');

      archiveEvents.push({
        event,
        attendees: (rsvps || []).map((r: any) => r.profile).filter(Boolean),
      });
    }

    setEvents(archiveEvents);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((item, i) => (
              <EventCard
                key={item.event.id}
                event={item.event}
                attendees={item.attendees}
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
