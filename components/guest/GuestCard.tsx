'use client';

import { motion } from 'framer-motion';
import { ALLERGEN_EMOJI } from '@/lib/types';
import type { GuestInfo, Allergen } from '@/lib/types';

interface GuestCardProps {
    guest: GuestInfo;
    isCurrentUser: boolean;
    onSelectDish?: () => void;
}

export default function GuestCard({ guest, isCurrentUser, onSelectDish }: GuestCardProps) {
    const { profile, claim } = guest;

    const recipeName = claim?.is_suggestion
        ? claim.suggestion_name
        : claim?.recipe?.name;

    // Get allergens from the recipe or suggestion
    const allergens: string[] = claim?.is_suggestion
        ? (claim.suggestion_allergens || [])
        : (claim?.recipe?.allergens || []);

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

            {/* Dish info */}
            {recipeName ? (
                <div>
                    <p className="font-body text-sm leading-snug mb-1.5" style={{ color: 'var(--ink)' }}>
                        {recipeName}
                    </p>
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
                        Hasn't picked yet 👀
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
