'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase';
import { toRoman, formatInviteDate } from '@/lib/theme';
import RecipeList from '@/components/recipe/RecipeList';
import GuestRail from '@/components/guest/GuestRail';
import { COURSE_ORDER, ALLERGEN_EMOJI } from '@/lib/types';
import type {
  Event, Cookbook, RecipeWithClaim, ClaimWithDetails,
  GuestInfo, Profile, Claim, Recipe, Course, Allergen,
} from '@/lib/types';

export default function EventPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [recipes, setRecipes] = useState<RecipeWithClaim[]>([]);
  const [suggestions, setSuggestions] = useState<ClaimWithDetails[]>([]);
  const [guests, setGuests] = useState<GuestInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);

  // Suggestion form state
  const [sugName, setSugName] = useState('');
  const [sugCourse, setSugCourse] = useState<Course>('main');
  const [sugAllergens, setSugAllergens] = useState<Allergen[]>([]);
  const [sugVeg, setSugVeg] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createBrowserSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) { router.push('/auth/login'); return; }
    setUserId(user.id);

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

    // Get RSVPs + profiles for guest rail
    const { data: rsvpsData } = await supabase
      .from('rsvps')
      .select('*, profile:profiles(*)')
      .eq('event_id', eventData.id)
      .eq('status', 'attending');

    const guestList: GuestInfo[] = (rsvpsData || []).map((r: any) => ({
      profile: r.profile,
      rsvp: r,
      claim: (claimsData || []).find((c: any) => c.user_id === r.user_id),
    }));

    setGuests(guestList);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClaim = async (recipeId: string) => {
    if (!userId || !event) return;
    const supabase = createBrowserSupabase();

    await supabase.from('claims').insert({
      event_id: event.id,
      recipe_id: recipeId,
      user_id: userId,
      is_suggestion: false,
    });

    loadData(); // Refresh
  };

  const handleUnclaim = async (claimId: string) => {
    const supabase = createBrowserSupabase();
    await supabase.from('claims').delete().eq('id', claimId);
    loadData(); // Refresh
  };

  const handleSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !event || !sugName.trim()) return;
    const supabase = createBrowserSupabase();

    await supabase.from('claims').insert({
      event_id: event.id,
      user_id: userId,
      is_suggestion: true,
      suggestion_name: sugName.trim(),
      suggestion_course: sugCourse,
      suggestion_allergens: sugAllergens,
      suggestion_is_vegetarian: sugVeg,
    });

    setSugName('');
    setSugCourse('main');
    setSugAllergens([]);
    setSugVeg(false);
    setShowSuggestionForm(false);
    loadData();
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
      {/* Header */}
      <header className="px-4 pt-8 pb-4 text-center">
        <h1 className="font-display italic text-2xl mb-1" style={{ color: 'var(--ink)' }}>
          Girls Supper Club
        </h1>
        <p className="font-display italic text-sm" style={{ color: 'var(--accent)' }}>
          Vol. {toRoman(event.volume_number)} · {formatInviteDate(event.date)}
        </p>
        {cookbook && (
          <p className="font-body text-xs mt-1" style={{ color: 'var(--accent-warm)' }}>
            {cookbook.name}
          </p>
        )}
        <div className="divider-fine max-w-xs mx-auto" />
      </header>

      {/* Main layout */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        {/* Mobile: horizontal guest rail */}
        <div className="md:hidden mb-6">
          <GuestRail guests={guests} layout="horizontal" />
          <div className="divider-fine" />
        </div>

        <div className="flex gap-8">
          {/* Desktop: sidebar guest rail */}
          <aside className="hidden md:block w-64 flex-shrink-0 sticky top-8 self-start">
            <GuestRail guests={guests} layout="vertical" />
          </aside>

          {/* Recipe list */}
          <div className="flex-1 min-w-0">
            <RecipeList
              recipes={recipes}
              suggestions={suggestions}
              currentUserId={userId || ''}
              onClaim={handleClaim}
              onUnclaim={handleUnclaim}
            />

            {/* Member suggestion section */}
            <div className="mt-10">
              <div className="divider-fine" />
              {!showSuggestionForm ? (
                <button
                  onClick={() => setShowSuggestionForm(true)}
                  className="font-body text-sm underline transition-opacity hover:opacity-70"
                  style={{ color: 'var(--accent)' }}
                >
                  Want to make something not in the book? ✨
                </button>
              ) : (
                <form onSubmit={handleSuggestion} className="space-y-4 mt-4">
                  <h3 className="font-display italic text-lg" style={{ color: 'var(--ink)' }}>
                    Suggest a Dish
                  </h3>

                  <input
                    type="text"
                    value={sugName}
                    onChange={(e) => setSugName(e.target.value)}
                    placeholder="Dish name..."
                    className="input-elegant font-body"
                    required
                  />

                  <div className="flex gap-4 flex-wrap">
                    <div>
                      <label className="block text-xs font-body mb-1" style={{ color: 'var(--accent-warm)' }}>Course</label>
                      <select
                        value={sugCourse}
                        onChange={(e) => setSugCourse(e.target.value as Course)}
                        className="font-body text-sm py-1 px-2 rounded"
                        style={{ border: '1px solid var(--accent-warm)', background: 'var(--surface)' }}
                      >
                        {COURSE_ORDER.map(c => (
                          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer self-end">
                      <input
                        type="checkbox"
                        checked={sugVeg}
                        onChange={(e) => setSugVeg(e.target.checked)}
                        className="accent-[var(--accent)]"
                      />
                      <span className="text-sm font-body">🌱 Vegetarian</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="btn-elegant-accent text-xs">
                      Submit Suggestion
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSuggestionForm(false)}
                      className="text-xs font-body underline"
                      style={{ color: 'var(--accent-warm)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
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
    </main>
  );
}
