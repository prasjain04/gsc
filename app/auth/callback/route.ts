import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options });
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (data?.user && !error) {
            // Ensure profile exists (the trigger might have created it, but let's be safe)
            await supabase.from('profiles').upsert({
                id: data.user.id,
                name: data.user.user_metadata?.name || '',
                dietary_restrictions: [],
                role: 'member',
            }, { onConflict: 'id' });

            // Auto-create RSVP for the active event
            const { data: activeEvent } = await supabase
                .from('events')
                .select('id')
                .eq('is_active', true)
                .order('date', { ascending: false })
                .limit(1)
                .single();

            if (activeEvent) {
                await supabase.from('rsvps').upsert({
                    event_id: activeEvent.id,
                    user_id: data.user.id,
                    status: 'attending',
                }, { onConflict: 'event_id,user_id' });
            }
        }
    }

    // Redirect to the event page after email confirmation
    return NextResponse.redirect(new URL('/event', request.url));
}
