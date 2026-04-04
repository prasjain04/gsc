'use client';

import { motion } from 'framer-motion';
import { ALLERGEN_EMOJI, COURSE_LABELS } from '@/lib/types';
import type { GuestInfo, Allergen, Profile, Course } from '@/lib/types';

interface GuestCardProps {
    guest: GuestInfo;
    isCurrentUser: boolean;
    allProfiles?: Profile[];
    allGuests?: GuestInfo[];
    onSelectDish?: () => void;
}

export default function GuestCard({ guest, isCurrentUser, allProfiles = [], allGuests = [], onSelectDish }: GuestCardProps) {
    const { profile, claim, rsvp } = guest;

    // If this guest has no claim, check if another guest listed them as a partner
    // and inherit that guest's recipe info
    let effectiveClaim = claim;
    let pairedWith: GuestInfo | undefined;

    if (!claim) {
        // Find someone who listed this guest as their cooking partner
        pairedWith = allGuests.find(
            g => g.profile.id !== profile.id &&
                g.rsvp?.partner_ids?.includes(profile.id) &&
                g.claim
        );
        if (pairedWith) {
            effectiveClaim = pairedWith.claim;
        }
    }

    const recipeName = effectiveClaim?.is_suggestion
        ? effectiveClaim.suggestion_name
        : effectiveClaim?.recipe?.name;

    // Get allergens from the recipe or suggestion
    const allergens: string[] = effectiveClaim?.is_suggestion
        ? (effectiveClaim.suggestion_allergens || [])
        : (effectiveClaim?.recipe?.allergens || []);

    // Find cooking partner names
    const partnerNames: string[] = [];
    if (recipeName) {
        const partnerIdSet = new Set<string>();

        // From this guest's RSVP partner_ids
        (rsvp?.partner_ids || []).forEach((pid: string) => partnerIdSet.add(pid));

        // Reverse: who listed this guest as their partner
        allGuests.forEach(g => {
            if (g.profile.id !== profile.id && g.rsvp?.partner_ids?.includes(profile.id)) {
                partnerIdSet.add(g.profile.id);
            }
        });

        // If this guest inherited a recipe from someone, that person is a partner
        if (pairedWith) {
            partnerIdSet.add(pairedWith.profile.id);
        }

        partnerIdSet.forEach(pid => {
            const p = allProfiles.find(pr => pr.id === pid);
            if (p) partnerNames.push(p.name);
        });
    }

    const cardClass = isCurrentUser ? 'guest-card guest-card-you' : 'guest-card';

    return (
        <motion.div
            className={cardClass}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
        >
            {/* You badge */}
            {isCurrentUser && (
                <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-body font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                            background: 'var(--accent)',
                            color: 'var(--surface)',
                        }}
                    >
                        You
                    </span>
                </div>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                    style={{
                        border: `2px solid ${isCurrentUser ? 'var(--accent)' : 'var(--accent-warm)'}`,
                        background: 'var(--surface)',
                    }}
                >
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div
                            className="w-full h-full flex items-center justify-center font-display italic text-lg"
                            style={{ color: isCurrentUser ? 'var(--accent)' : 'var(--accent-warm)' }}
                        >
                            {profile.name?.charAt(0) || '?'}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-body font-medium text-sm truncate" style={{ color: 'var(--ink)' }}>
                        {profile.name}
                    </p>
                    {getDietaryEmojiInline(profile.dietary_restrictions) && (
                        <p className="text-xs">{getDietaryEmojiInline(profile.dietary_restrictions)}</p>
                    )}
                </div>
            </div>

            {/* Temporary debug — remove after fixing */}
            {isCurrentUser && (
                <div className="mb-2 p-2 rounded text-[9px] font-mono leading-relaxed" style={{ background: '#f0f0f0', color: '#333', wordBreak: 'break-all' }}>
                    <div>partner_ids: {JSON.stringify(rsvp?.partner_ids)}</div>
                    <div>course_pref: {JSON.stringify(rsvp?.course_preference)}</div>
                    <div>has_claim: {String(!!claim)}</div>
                    <div>partnerNames: {JSON.stringify(partnerNames)}</div>
                </div>
            )}

            {/* Dish info */}
            {recipeName ? (
                <div>
                    <p className="font-body text-sm leading-snug mb-1" style={{ color: 'var(--ink)' }}>
                        {recipeName}
                    </p>
                    {partnerNames.length > 0 && (
                        <p className="font-body text-xs mb-1.5" style={{ color: 'var(--accent)' }}>
                            with {partnerNames.join(' & ')}
                        </p>
                    )}
                    {(rsvp?.course_preference || effectiveClaim?.recipe?.course) && (
                        <div className="flex flex-wrap gap-2 mb-2 items-center">
                            <span className="text-[10px] uppercase font-body px-1.5 py-0.5 rounded" style={{ background: 'var(--accent)', color: 'var(--surface)' }}>
                                {COURSE_LABELS[(rsvp?.course_preference || effectiveClaim?.recipe?.course) as Course]}
                            </span>
                        </div>
                    )}
                    {allergens.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {allergens.map(allergen => (
                                <span
                                    key={allergen}
                                    className="text-sm"
                                    title={allergen}
                                >
                                    {ALLERGEN_EMOJI[allergen as Allergen] || allergen}
                                </span>
                            ))}
                        </div>
                    )}
                    {claim?.is_suggestion && (
                        <span className="text-[10px] font-body mt-1 inline-block" style={{ color: 'var(--accent)' }}>
                            ✨ Custom Pick
                        </span>
                    )}
                </div>
            ) : (
                <div>
                    <p className="font-body text-xs italic" style={{ color: 'var(--accent-warm)' }}>
                        Hasn't picked yet 💭
                    </p>
                    {isCurrentUser && onSelectDish && (
                        <button
                            onClick={onSelectDish}
                            className="mt-2 text-xs font-body py-1.5 px-4 rounded-full transition-all"
                            style={{
                                border: '1.5px solid var(--accent)',
                                color: 'var(--accent)',
                                background: 'transparent',
                            }}
                        >
                            Select Your Dish
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}

function getDietaryEmojiInline(restrictions: string[]): string {
    const map: Record<string, string> = {
        'vegetarian': '🥦', 'vegan': '🌱', 'pescatarian': '🐟',
        'gluten-free': '🌾', 'dairy-free': '🥛', 'nut-allergy': '🥜',
        'egg-free': '🍳', 'halal': '🐄', 'kosher': '✡️', 'no-restrictions': '',
    };
    return restrictions?.map(r => map[r] || '').join('') || '';
}
