'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClaimButton from './ClaimButton';
import { ALLERGEN_EMOJI } from '@/lib/types';
import type { RecipeWithClaim, Allergen, Profile } from '@/lib/types';

interface RecipeRowProps {
  recipe: RecipeWithClaim;
  currentUserId: string;
  userHasClaim: boolean;
  isDisabled: boolean;
  disabledMessage?: string;
  isLocked: boolean;
  onClaim: (recipeId: string) => void;
  onUnclaim: (claimId: string) => void;
}

export default function RecipeRow({
  recipe,
  currentUserId,
  userHasClaim,
  isDisabled,
  disabledMessage,
  isLocked,
  onClaim,
  onUnclaim,
}: RecipeRowProps) {
  const [expanded, setExpanded] = useState(false);

  const isClaimed = !!recipe.claim;
  const isMyClam = recipe.claim?.user_id === currentUserId;
  const claimer = recipe.claim?.profile;

  const rowClass = isMyClam
    ? 'recipe-row my-claim'
    : isClaimed
    ? 'recipe-row claimed'
    : 'recipe-row';

  return (
    <div>
      <div
        className={rowClass}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left side: recipe info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-body font-medium text-sm" style={{ color: 'var(--ink)' }}>
                {recipe.name}
              </span>
              <span className="text-sm">
                {recipe.is_vegetarian ? '🌱' : '🍖'}
              </span>
            </div>
            {recipe.page_number && (
              <span className="font-body text-xs" style={{ color: 'var(--accent-warm)' }}>
                p. {recipe.page_number}
              </span>
            )}
          </div>

          {/* Right side: claimer or claim button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isClaimed && claimer && !isMyClam && (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full overflow-hidden"
                  style={{ border: '1px solid var(--accent-warm)' }}
                >
                  {claimer.avatar_url ? (
                    <img src={claimer.avatar_url} alt={claimer.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-display italic" style={{ color: 'var(--accent-warm)' }}>
                      {claimer.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
                  {claimer.name}
                </span>
              </div>
            )}

            {(!isClaimed || isMyClam) && (
              <ClaimButton
                isClaimed={isClaimed}
                isMyClam={isMyClam}
                isDisabled={isDisabled || (userHasClaim && !isMyClam)}
                disabledMessage={userHasClaim && !isMyClam ? "You've already claimed a dish" : disabledMessage}
                isLocked={isLocked}
                onClaim={() => onClaim(recipe.id)}
                onUnclaim={() => recipe.claim && onUnclaim(recipe.claim.id)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="py-3 px-4" style={{ background: 'rgba(212, 184, 150, 0.06)' }}>
              {/* Allergens */}
              {recipe.allergens && recipe.allergens.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>Contains:</span>
                  <div className="flex gap-1.5">
                    {recipe.allergens.map(allergen => (
                      <span key={allergen} className="text-sm" title={allergen}>
                        {ALLERGEN_EMOJI[allergen as Allergen] || allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Veg status */}
              <div className="flex gap-3">
                {recipe.is_vegetarian && (
                  <span className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
                    🌱 Vegetarian
                  </span>
                )}
                {recipe.is_vegan && (
                  <span className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
                    🌿 Vegan
                  </span>
                )}
              </div>

              {/* Full claim button if not shown above */}
              {!isClaimed && !userHasClaim && !isDisabled && (
                <div className="mt-3">
                  <button
                    onClick={() => onClaim(recipe.id)}
                    className="btn-elegant-accent text-xs w-full py-2"
                  >
                    Claim This Dish
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
