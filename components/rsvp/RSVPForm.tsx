import { useState, useEffect } from 'react';
import { Course, Profile, COURSE_QUOTAS, COURSE_LABELS, COURSE_ORDER, RSVP } from '@/lib/types';
import { createBrowserSupabase } from '@/lib/supabase';

interface RSVPFormProps {
    eventId: string;
    userId: string;
    userRsvpStatus: 'attending' | 'declined';
    onComplete: () => void;
}

export default function RSVPForm({
    eventId,
    userId,
    userRsvpStatus,
    onComplete
}: RSVPFormProps) {
    const [status, setStatus] = useState(userRsvpStatus);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setStatus(userRsvpStatus);
    }, [userRsvpStatus]);
    useEffect(() => {
        setStatus(userRsvpStatus);
    }, [userRsvpStatus]);

    const handleSave = async (newStatus: 'attending' | 'declined') => {
        setSaving(true);
        setStatus(newStatus);
        const supabase = createBrowserSupabase();

        // Remove old claims if declined
        if (newStatus === 'declined') {
            await supabase.from('claims').delete().eq('event_id', eventId).eq('user_id', userId);
            await supabase.from('rsvps').upsert({
                event_id: eventId,
                user_id: userId,
                status: 'declined',
                course_preference: null,
                partner_ids: [],
            }, { onConflict: 'event_id,user_id' });
        } else {
            // Fetch existing to preserve course preference / partners if any
            const { data: existing } = await supabase.from('rsvps').select('*').eq('event_id', eventId).eq('user_id', userId).single();
            await supabase.from('rsvps').upsert({
                event_id: eventId,
                user_id: userId,
                status: 'attending',
                course_preference: existing?.course_preference,
                partner_ids: existing?.partner_ids || [],
            }, { onConflict: 'event_id,user_id' });
        }

        setSaving(false);
        onComplete();
    };

    return (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(212, 184, 150, 0.2)' }}>
            <p className="font-body text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--accent-warm)' }}>
                Your RSVP
            </p>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => handleSave('attending')}
                    disabled={saving}
                    className="flex items-center gap-2 py-1.5 px-4 rounded-full text-xs font-body transition-all"
                    style={{
                        background: status === 'attending' ? 'var(--accent)' : 'transparent',
                        color: status === 'attending' ? 'var(--surface)' : 'var(--accent-warm)',
                        border: `1.5px solid ${status === 'attending' ? 'var(--accent)' : 'var(--accent-warm)'}`,
                        opacity: saving ? 0.5 : 1
                    }}
                >
                    {status === 'attending' ? '✓ Attending' : 'Attend'}
                </button>
                <button
                    onClick={() => handleSave('declined')}
                    disabled={saving}
                    className="flex items-center gap-2 py-1.5 px-4 rounded-full text-xs font-body transition-all"
                    style={{
                        background: status === 'declined' ? 'var(--accent-warm)' : 'transparent',
                        color: status === 'declined' ? 'var(--surface)' : 'var(--accent-warm)',
                        border: `1.5px solid var(--accent-warm)`,
                        opacity: saving ? 0.5 : 1
                    }}
                >
                    {status === 'declined' ? '✗ Can\'t make it' : 'Can\'t make it'}
                </button>
            </div>
        </div>
    );
}
