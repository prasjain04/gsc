import { useState, useEffect } from 'react';
import { Course, Profile, COURSE_QUOTAS, COURSE_LABELS, COURSE_ORDER, RSVP } from '@/lib/types';
import { createBrowserSupabase } from '@/lib/supabase';

interface RSVPFormProps {
    eventId: string;
    userId: string;
    userRsvpStatus: 'attending' | 'declined';
    currentCourse: Course | null;
    currentPartners: string[];
    allProfiles: Profile[];
    courseCounts: Record<Course, number>;
    onComplete: () => void;
}

export default function RSVPForm({
    eventId,
    userId,
    userRsvpStatus,
    currentCourse,
    currentPartners,
    allProfiles,
    courseCounts,
    onComplete
}: RSVPFormProps) {
    const [status, setStatus] = useState(userRsvpStatus);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(currentCourse);
    const [selectedPartners, setSelectedPartners] = useState<string[]>(currentPartners);
    const [saving, setSaving] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        setStatus(userRsvpStatus);
        setSelectedCourse(currentCourse);
        setSelectedPartners(currentPartners);
    }, [userRsvpStatus, currentCourse, currentPartners]);

    const togglePartner = (pid: string) => {
        if (selectedPartners.includes(pid)) {
            setSelectedPartners(selectedPartners.filter(p => p !== pid));
        } else if (selectedPartners.length < 2) {
            setSelectedPartners([...selectedPartners, pid]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const supabase = createBrowserSupabase();

        // Remove old claims if declined
        if (status === 'declined') {
            await supabase.from('claims').delete().eq('event_id', eventId).eq('user_id', userId);
            await supabase.from('rsvps').upsert({
                event_id: eventId,
                user_id: userId,
                status: 'declined',
                course_preference: null,
                partner_ids: [],
            }, { onConflict: 'event_id,user_id' });
        } else {
            // Upsert current user RSVP
            await supabase.from('rsvps').upsert({
                event_id: eventId,
                user_id: userId,
                status: 'attending',
                course_preference: selectedCourse,
                partner_ids: selectedPartners,
            }, { onConflict: 'event_id,user_id' });

            // Sync partners
            for (const pid of selectedPartners) {
                const { data: existing } = await supabase
                    .from('rsvps')
                    .select('*')
                    .eq('event_id', eventId)
                    .eq('user_id', pid)
                    .single();

                await supabase.from('rsvps').upsert({
                    event_id: eventId,
                    user_id: pid,
                    status: 'attending',
                    course_preference: selectedCourse,
                    partner_ids: existing && existing.partner_ids ? existing.partner_ids : [],
                }, { onConflict: 'event_id,user_id' });
            }
        }

        setSaving(false);
        onComplete();
    };

    const partnerProfiles = allProfiles.filter(p => p.id !== userId);

    return (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(212, 184, 150, 0.2)' }}>
            <p className="font-body text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--accent-warm)' }}>
                Your RSVP
            </p>

            <div className="flex items-center gap-3 mb-4">
                <button
                    onClick={() => setStatus('attending')}
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
                    onClick={() => setStatus('declined')}
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

            {status === 'attending' && (
                <div className="space-y-4 p-4 rounded-lg mb-4" style={{ background: 'rgba(212, 184, 150, 0.05)' }}>
                    <div>
                        <p className="font-body text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--ink)' }}>
                            Course Preference
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {COURSE_ORDER.map(course => {
                                const count = courseCounts[course] || 0;
                                // If it's selected by the user, they don't count towards the remaining logic preventing them from keeping it
                                const isSelected = selectedCourse === course;
                                const quota = COURSE_QUOTAS[course];
                                const isFull = !isSelected && count >= quota;

                                return (
                                    <button
                                        key={course}
                                        disabled={isFull && !isSelected}
                                        onClick={() => setSelectedCourse(course)}
                                        className="py-1.5 px-2 rounded text-xs font-body transition-all text-left flex justify-between items-center"
                                        style={{
                                            background: isSelected ? 'var(--accent)' : 'transparent',
                                            color: isSelected ? 'var(--surface)' : (isFull ? 'gray' : 'var(--ink)'),
                                            border: `1px solid ${isSelected ? 'var(--accent)' : (isFull ? '#e5e7eb' : 'rgba(212, 184, 150, 0.5)')}`,
                                            opacity: (isFull && !isSelected) ? 0.5 : 1,
                                        }}
                                    >
                                        <span>{COURSE_LABELS[course]}</span>
                                        <span className="text-[10px] ml-1 opacity-70">({count}/{quota})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="relative">
                        <p className="font-body text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--ink)' }}>
                            Cooking Partner(s) <span className="opacity-60 lowercase font-normal">(optional, max 2)</span>
                        </p>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="w-full text-left py-2 px-3 rounded text-xs font-body flex justify-between items-center"
                            style={{ border: '1px solid rgba(212, 184, 150, 0.5)', background: 'var(--surface)' }}
                        >
                            <span style={{ color: selectedPartners.length > 0 ? 'var(--ink)' : 'var(--accent-warm)' }}>
                                {selectedPartners.length > 0
                                    ? `${selectedPartners.length} partner(s) selected`
                                    : 'Select partners...'}
                            </span>
                            <span>▼</span>
                        </button>

                        {showDropdown && (
                            <div className="absolute z-10 w-full mt-1 rounded shadow-lg max-h-48 overflow-y-auto" style={{ background: 'var(--surface)', border: '1px solid rgba(212, 184, 150, 0.3)' }}>
                                {partnerProfiles.map(p => {
                                    const isChecked = selectedPartners.includes(p.id);
                                    const isDisabled = !isChecked && selectedPartners.length >= 2;
                                    return (
                                        <label key={p.id} className="flex items-center gap-2 p-2 px-3 text-sm font-body cursor-pointer hover:bg-gray-50" style={{ opacity: isDisabled ? 0.5 : 1 }}>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                disabled={isDisabled}
                                                onChange={() => togglePartner(p.id)}
                                                className="rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                                            />
                                            <span style={{ color: 'var(--ink)' }}>{p.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {(status !== userRsvpStatus || selectedCourse !== currentCourse || JSON.stringify(selectedPartners) !== JSON.stringify(currentPartners)) && (
                <button
                    onClick={handleSave}
                    disabled={saving || (status === 'attending' && !selectedCourse)}
                    className="w-full py-2 rounded font-body text-sm transition-opacity"
                    style={{
                        background: 'var(--ink)',
                        color: 'var(--bg)',
                        opacity: (saving || (status === 'attending' && !selectedCourse)) ? 0.5 : 1
                    }}
                >
                    {saving ? 'Saving...' : 'Save RSVP'}
                </button>
            )}
        </div>
    );
}
