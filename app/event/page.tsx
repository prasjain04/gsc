'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase';
import { toRoman, formatInviteDate } from '@/lib/theme';
import GuestCard from '@/components/guest/GuestCard';
import RecipeSelectionForm from '@/components/recipe/RecipeSelectionForm';
import { ALLERGEN_EMOJI } from '@/lib/types';
import type {
  Event, Cookbook, RecipeWithClaim, ClaimWithDetails,
  GuestInfo, Profile, Claim, Recipe, Course, Allergen,
} from '@/lib/types';

export default function EventPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<string>('member');
  const [event, setEvent] = useState<Event | null>(null);
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [recipes, setRecipes] = useState<RecipeWithClaim[]>([]);
  const [suggestions, setSuggestions] = useState<ClaimWithDetails[]>([]);
  const [guests, setGuests] = useState<GuestInfo[]>([]);
  const [declinedGuests, setDeclinedGuests] = useState<{ profile: Profile }[]>([]);
  const [userRsvpStatus, setUserRsvpStatus] = useState<'attending' | 'declined'>('attending');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createBrowserSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) { router.push('/auth/login'); return; }
    setUserId(user.id);

    // Get current user's profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setUserProfile(profileData);
    setUserRole(profileData?.role || 'member');

    // Get active event
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (!eventData) {
      setLoading(false);
      return;
    }
    setEvent(eventData);

    // Get cookbook
    const { data: cookbookData } = await supabase
      .from('cookbooks')
      .select('*')
      .eq('event_id', eventData.id)
      .single();
    setCookbook(cookbookData);

    // Get recipes
    const { data: recipesData } = await supabase
      .from('recipes')
      .select('*')
      .eq('cookbook_id', cookbookData?.id)
      .order('course')
      .order('name');

    // Get claims with profiles
    const { data: claimsData } = await supabase
      .from('claims')
      .select('*, profile:profiles(*), recipe:recipes(*)')
      .eq('event_id', eventData.id);

    // Merge claims into recipes
    const claimsMap: Record<string, ClaimWithDetails> = {};
    const suggestionsList: ClaimWithDetails[] = [];

    (claimsData || []).forEach((c: any) => {
      if (c.is_suggestion) {
        suggestionsList.push(c);
      } else if (c.recipe_id) {
        claimsMap[c.recipe_id] = c;
      }
    });

    const recipesWithClaims: RecipeWithClaim[] = (recipesData || []).map((r: Recipe) => ({
      ...r,
      claim: claimsMap[r.id] || null,
    }));

    setRecipes(recipesWithClaims);
    setSuggestions(suggestionsList);

    // Get ALL RSVPs + profiles (attending AND declined)
    const { data: rsvpsData } = await supabase
      .from('rsvps')
      .select('*, profile:profiles(*)')
      .eq('event_id', eventData.id);

    // Split attending vs declined
    const attendingRsvps = (rsvpsData || []).filter((r: any) => r.status === 'attending');
    const declinedRsvps = (rsvpsData || []).filter((r: any) => r.status === 'declined');

    // Set current user's RSVP status
    const userRsvp = (rsvpsData || []).find((r: any) => r.user_id === user.id);
    if (userRsvp) {
      setUserRsvpStatus(userRsvp.status);
    }

    const guestList: GuestInfo[] = attendingRsvps.map((r: any) => ({
      profile: r.profile,
      rsvp: r,
      claim: (claimsData || []).find((c: any) => c.user_id === r.user_id),
    }));

    const declinedList = declinedRsvps.map((r: any) => ({
      profile: r.profile,
    }));

    // If the current user has no RSVP for this event, create one automatically
    const currentUserInList = guestList.some(g => g.profile.id === user.id);
    const currentUserDeclined = declinedList.some(g => g.profile.id === user.id);
    if (!currentUserInList && !currentUserDeclined && profileData) {
      // Auto-create RSVP
      await supabase.from('rsvps').upsert({
        event_id: eventData.id,
        user_id: user.id,
        status: 'attending',
      }, { onConflict: 'event_id,user_id' });

      const userClaim = (claimsData || []).find((c: any) => c.user_id === user.id);
      guestList.unshift({
        profile: profileData,
        rsvp: { id: '', event_id: eventData.id, user_id: user.id, status: 'attending', created_at: '' } as any,
        claim: userClaim || undefined,
      });
    }

    setGuests(guestList);
    setDeclinedGuests(declinedList);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClaim = async (recipeId: string) => {
    if (!userId || !event) return;
    const supabase = createBrowserSupabase();

    // Remove any existing claim first
    await supabase.from('claims').delete().eq('event_id', event.id).eq('user_id', userId);

    await supabase.from('claims').insert({
      event_id: event.id,
      recipe_id: recipeId,
      user_id: userId,
      is_suggestion: false,
    });

    loadData();
  };

  const handleUnclaim = async (claimId: string) => {
    const supabase = createBrowserSupabase();
    await supabase.from('claims').delete().eq('id', claimId);
    loadData();
  };

  const handleToggleRsvp = async () => {
    if (!userId || !event) return;
    const supabase = createBrowserSupabase();
    const newStatus = userRsvpStatus === 'attending' ? 'declined' : 'attending';

    await supabase.from('rsvps').upsert({
      event_id: event.id,
      user_id: userId,
      status: newStatus,
    }, { onConflict: 'event_id,user_id' });

    // If declining, also remove any claims
    if (newStatus === 'declined') {
      await supabase.from('claims').delete().eq('event_id', event.id).eq('user_id', userId);
    }

    setUserRsvpStatus(newStatus);
    loadData();
  };

  const isLocked = event?.lock_time
    ? new Date(event.lock_time) < new Date()
    : false;

  // Current user's claim info for the form
  const currentUserClaim = useMemo(() => {
    const recipeClaim = recipes.find(r => r.claim?.user_id === userId);
    if (recipeClaim?.claim) {
      return {
        claimId: recipeClaim.claim.id,
        recipe: recipeClaim,
        isSuggestion: false,
      };
    }
    const suggestion = suggestions.find(s => s.user_id === userId);
    if (suggestion) {
      return {
        claimId: suggestion.id,
        isSuggestion: true,
        suggestionName: suggestion.suggestion_name || undefined,
      };
    }
    return null;
  }, [recipes, suggestions, userId]);

  // Sort guests: current user first
  const sortedGuests = useMemo(() => {
    return [...guests].sort((a, b) => {
      if (a.profile.id === userId) return -1;
      if (b.profile.id === userId) return 1;
      return 0;
    });
  }, [guests, userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="font-display italic text-lg" style={{ color: 'var(--accent-warm)' }}>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <p className="font-display italic text-2xl mb-2" style={{ color: 'var(--ink)' }}>
            No upcoming supper club
          </p>
          <p className="font-body text-sm" style={{ color: 'var(--accent-warm)' }}>
            Check back soon — the next event will appear here ♡
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Compact top header */}
      <header className="px-4 pt-6 pb-2 text-center">
        <h1 className="font-display italic text-xl" style={{ color: 'var(--ink)' }}>
          Girls Supper Club
        </h1>
      </header>

      {/* Main two-column layout */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ════════ LEFT COLUMN ════════ */}
          <div className="lg:w-[340px] flex-shrink-0 lg:sticky lg:top-6 lg:self-start space-y-6">

            {/* Event details */}
            <div className="event-info-block">
              <p className="font-body text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--accent-warm)' }}>
                Vol. {toRoman(event.volume_number)}
              </p>
              <h2 className="font-display italic text-2xl mb-3" style={{ color: 'var(--ink)' }}>
                {event.title || 'Supper Club'}
              </h2>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📅</span>
                  <span className="font-body text-sm" style={{ color: 'var(--ink)' }}>
                    {formatInviteDate(event.date)}
                  </span>
                </div>
                {event.event_time && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🕖</span>
                    <span className="font-body text-sm" style={{ color: 'var(--ink)' }}>
                      {event.event_time}
                    </span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📍</span>
                    <span className="font-body text-sm" style={{ color: 'var(--ink)' }}>
                      {event.location}
                    </span>
                  </div>
                )}
              </div>

              {cookbook && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(212, 184, 150, 0.2)' }}>
                  <p className="font-body text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--accent-warm)' }}>
                    Cookbook
                  </p>
                  <p className="font-display italic text-base" style={{ color: 'var(--ink)' }}>
                    {cookbook.name}
                  </p>
                </div>
              )}

              {/* Admin edit button */}
              {(userRole === 'admin' || userRole === 'super_admin') && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(212, 184, 150, 0.2)' }}>
                  <button
                    onClick={() => router.push('/admin')}
                    className="text-xs font-body flex items-center gap-1.5 transition-opacity hover:opacity-70"
                    style={{ color: 'var(--accent)' }}
                  >
                    ✏️ Edit Event
                  </button>
                </div>
              )}

              {/* RSVP toggle */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(212, 184, 150, 0.2)' }}>
                <p className="font-body text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--accent-warm)' }}>
                  Your RSVP
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleRsvp}
                    className="flex items-center gap-2 py-1.5 px-4 rounded-full text-xs font-body transition-all"
                    style={{
                      background: userRsvpStatus === 'attending' ? 'var(--accent)' : 'transparent',
                      color: userRsvpStatus === 'attending' ? 'var(--surface)' : 'var(--accent-warm)',
                      border: `1.5px solid ${userRsvpStatus === 'attending' ? 'var(--accent)' : 'var(--accent-warm)'}`,
                    }}
                  >
                    {userRsvpStatus === 'attending' ? '✓ Attending' : 'Attend'}
                  </button>
                  <button
                    onClick={handleToggleRsvp}
                    className="flex items-center gap-2 py-1.5 px-4 rounded-full text-xs font-body transition-all"
                    style={{
                      background: userRsvpStatus === 'declined' ? 'var(--accent-warm)' : 'transparent',
                      color: userRsvpStatus === 'declined' ? 'var(--surface)' : 'var(--accent-warm)',
                      border: `1.5px solid var(--accent-warm)`,
                    }}
                  >
                    {userRsvpStatus === 'declined' ? '✗ Can\'t make it' : 'Can\'t make it'}
                  </button>
                </div>
              </div>
            </div>

            {/* Cookbook cover image */}
            {cookbook?.cover_url && (
              <a
                href="https://drive.google.com/file/d/1jhak8Njmp9kDRDU4DGKDEm_cXAm7M7VH/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="cookbook-cover relative overflow-hidden" style={{ cursor: 'pointer' }}>
                  <img
                    src={cookbook.cover_url}
                    alt={cookbook.name}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                <p className="text-center font-body text-xs mt-2 transition-opacity group-hover:opacity-100"
                  style={{ color: 'var(--accent)' }}>
                  Tap to view cookbook →
                </p>
              </a>
            )}

            {/* Cookbook placeholder if no cover */}
            {cookbook && !cookbook.cover_url && (
              <div
                className="cookbook-cover flex items-center justify-center py-12"
                style={{ background: 'rgba(212, 184, 150, 0.1)' }}
              >
                <div className="text-center">
                  <span className="text-4xl mb-2 block">📖</span>
                  <p className="font-display italic text-base" style={{ color: 'var(--accent-warm)' }}>
                    {cookbook.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ════════ RIGHT COLUMN ════════ */}
          <div className="flex-1 min-w-0">

            {/* Recipe selection form — first thing people see */}
            <div className="mb-6">
              <RecipeSelectionForm
                recipes={recipes}
                currentClaim={currentUserClaim}
                isLocked={isLocked}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
              />
            </div>

            {/* Guest count */}
            <div className="flex items-center justify-between mb-4">
              <p className="font-display italic text-lg" style={{ color: 'var(--ink)' }}>
                {guests.length} {guests.length === 1 ? 'girlie' : 'girlies'} coming 🍴
              </p>
            </div>

            {/* Guest cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedGuests.map(guest => (
                <GuestCard
                  key={guest.profile.id}
                  guest={guest}
                  isCurrentUser={guest.profile.id === userId}
                />
              ))}
            </div>

            {/* Declined guests section */}
            {declinedGuests.length > 0 && (
              <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(212, 184, 150, 0.2)' }}>
                <p className="font-display italic text-sm mb-3" style={{ color: 'var(--accent-warm)' }}>
                  Can’t make it this time 💔
                </p>
                <div className="flex flex-wrap gap-3">
                  {declinedGuests.map(g => (
                    <div
                      key={g.profile.id}
                      className="flex items-center gap-2 py-1.5 px-3 rounded-full"
                      style={{
                        background: 'rgba(212, 184, 150, 0.1)',
                        border: '1px solid rgba(212, 184, 150, 0.2)',
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0"
                        style={{ background: 'var(--surface)', border: '1px solid var(--accent-warm)' }}
                      >
                        {g.profile.avatar_url ? (
                          <img src={g.profile.avatar_url} alt={g.profile.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-display italic text-[10px]"
                            style={{ color: 'var(--accent-warm)' }}>
                            {g.profile.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <span className="font-body text-xs" style={{ color: 'var(--accent-warm)' }}>
                        {g.profile.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 py-3 px-4 flex justify-center gap-6" style={{
        background: 'var(--surface)',
        borderTop: '1px solid rgba(212, 184, 150, 0.3)',
      }}>
        <button onClick={() => router.push('/event')} className="text-xs font-body font-medium" style={{ color: 'var(--accent)' }}>
          Menu
        </button>
        <button onClick={() => router.push('/archive')} className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
          Archive
        </button>
        <button onClick={() => router.push('/profile')} className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
          Profile
        </button>
      </nav>
    </main >
  );
}
