import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Browser client — use in client components
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Server client — use in server components and API routes
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Helper: get current user or null
export async function getCurrentUser() {
  const supabase = createBrowserSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper: get current user's profile
export async function getCurrentProfile() {
  const supabase = createBrowserSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

// Helper: get the active event
export async function getActiveEvent() {
  const supabase = createBrowserSupabase();
  const { data } = await supabase
    .from('events')
    .select('*, cookbook:cookbooks(*)')
    .eq('is_active', true)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  return data;
}
