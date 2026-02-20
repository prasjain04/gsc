'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase';
import { toRoman, formatInviteDate, parseTheme, applyTheme, resetTheme } from '@/lib/theme';
import { COURSE_ORDER, COURSE_LABELS, ALLERGEN_EMOJI } from '@/lib/types';
import type { Event, Cookbook, Recipe, ClaimWithDetails, Profile, Course, Allergen } from '@/lib/types';

export default function ArchivedEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [recipes, setRecipes] = useState<(Recipe & { claim?: ClaimWithDetails })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
    return () => resetTheme();
  }, [eventId]);

  const loadEvent = async () => {
    const supabase = createBrowserSupabase();

    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!eventData) { setLoading(false); return; }
    setEvent(eventData);

    // Apply event theme
    const theme = parseTheme(eventData.color_theme);
    applyTheme(theme);

    const { data: cookbookData } = await supabase
      .from('cookbooks')
      .select('*')
      .eq('event_id', eventId)
      .single();
    setCookbook(cookbookData);

    if (cookbookData) {
      const { data: recipesData } = await supabase
        .from('recipes')
        .select('*')
        .eq('cookbook_id', cookbookData.id)
        .order('course')
        .order('name');

      const { data: claimsData } = await supabase
        .from('claims')
        .select('*, profile:profiles(*), recipe:recipes(*)')
        .eq('event_id', eventId);

      const claimsMap: Record<string, ClaimWithDetails> = {};
      (claimsData || []).forEach((c: any) => {
        if (c.recipe_id) claimsMap[c.recipe_id] = c;
      });

      const merged = (recipesData || []).map(r => ({
        ...r,
        claim: claimsMap[r.id] || null,
      }));

      setRecipes(merged);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="font-display italic text-lg" style={{ color: 'var(--accent-warm)' }}>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="font-display italic text-lg" style={{ color: 'var(--accent-warm)' }}>Event not found</p>
      </div>
    );
  }

  // Group recipes by course
  const grouped: Record<Course, typeof recipes> = {
    appetizer: [], main: [], side: [], dessert: [],
  };
  recipes.forEach(r => {
    if (grouped[r.course as Course]) grouped[r.course as Course].push(r);
  });

  return (
    <main className="min-h-screen px-4 py-8 pb-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.push('/archive')}
          className="text-sm font-body mb-8 underline"
          style={{ color: 'var(--accent-warm)' }}
        >
          ← Back to archive
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display italic text-2xl mb-1" style={{ color: 'var(--ink)' }}>
            Vol. {toRoman(event.volume_number)} · {formatInviteDate(event.date)}
          </h1>
          <p className="font-display italic text-sm" style={{ color: 'var(--accent)' }}>
            A beautiful evening 🍷
          </p>
          {cookbook && (
            <div className="mt-4">
              {cookbook.cover_url && (
                <img
                  src={cookbook.cover_url}
                  alt={cookbook.name}
                  className="w-20 h-28 mx-auto rounded shadow-sm object-cover mb-2"
                />
              )}
              <p className="font-display italic text-base" style={{ color: 'var(--ink)' }}>
                {cookbook.name}
              </p>
            </div>
          )}
        </div>

        <div className="divider-fine" />

        {/* Recipe list (read-only) */}
        <div className="space-y-6 mt-6">
          {COURSE_ORDER.map(course => {
            const courseRecipes = grouped[course];
            if (courseRecipes.length === 0) return null;

            return (
              <div key={course}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="font-display italic text-lg" style={{ color: 'var(--ink)' }}>
                    {COURSE_LABELS[course]}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: 'var(--accent-warm)', opacity: 0.3 }} />
                </div>

                {courseRecipes.map(r => (
                  <div key={r.id} className="py-2 flex items-center justify-between" style={{
                    borderBottom: '1px solid rgba(212, 184, 150, 0.2)',
                  }}>
                    <div>
                      <span className="font-body text-sm font-medium" style={{ color: 'var(--ink)' }}>
                        {r.name}
                      </span>
                      <span className="ml-1 text-sm">{r.is_vegetarian ? '🌱' : '🍖'}</span>
                      {r.page_number && (
                        <span className="ml-2 text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
                          p. {r.page_number}
                        </span>
                      )}
                    </div>
                    {r.claim?.profile && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full overflow-hidden" style={{ border: '1px solid var(--accent-warm)' }}>
                          {r.claim.profile.avatar_url ? (
                            <img src={r.claim.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-display italic" style={{ color: 'var(--accent-warm)' }}>
                              {r.claim.profile.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
                          {r.claim.profile.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
