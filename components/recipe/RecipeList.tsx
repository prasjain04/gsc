'use client';

import { useMemo } from 'react';
import RecipeRow from './RecipeRow';
import { COURSE_ORDER, COURSE_LABELS } from '@/lib/types';
import type { RecipeWithClaim, Course, ClaimWithDetails } from '@/lib/types';

interface RecipeListProps {
  recipes: RecipeWithClaim[];
  suggestions: ClaimWithDetails[];
  currentUserId: string;
  isLocked: boolean;
  onClaim: (recipeId: string) => void;
  onUnclaim: (claimId: string) => void;
}

export default function RecipeList({
  recipes,
  suggestions,
  currentUserId,
  isLocked,
  onClaim,
  onUnclaim,
}: RecipeListProps) {
  // Group recipes by course
  const grouped = useMemo(() => {
    const groups: Record<Course, RecipeWithClaim[]> = {
      appetizer: [],
      main: [],
      side: [],
      dessert: [],
    };
    recipes.forEach(r => {
      if (groups[r.course]) {
        groups[r.course].push(r);
      }
    });
    return groups;
  }, [recipes]);

  // Compute claim rules
  const rules = useMemo(() => {
    const allClaims = recipes.filter(r => r.claim);
    const dessertClaims = allClaims.filter(r => r.course === 'dessert');
    const vegClaims = allClaims.filter(r => r.claim && (r.is_vegetarian || r.is_vegan));
    const totalUnclaimed = recipes.filter(r => !r.claim).length;
    const userClaim = recipes.find(r => r.claim?.user_id === currentUserId);
    const userSuggestion = suggestions.find(s => s.user_id === currentUserId);

    return {
      dessertsFull: dessertClaims.length >= 2,
      needsVeg: vegClaims.length < 2 && totalUnclaimed <= 3,
      userHasClaim: !!userClaim || !!userSuggestion,
    };
  }, [recipes, suggestions, currentUserId]);

  return (
    <div className="space-y-8">
      {COURSE_ORDER.map(course => {
        const courseRecipes = grouped[course];
        if (courseRecipes.length === 0) return null;

        const isDessertLocked = course === 'dessert' && rules.dessertsFull;

        return (
          <div key={course}>
            {/* Course header */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-display italic text-xl" style={{ color: 'var(--ink)' }}>
                {COURSE_LABELS[course]}
              </h2>
              <div className="flex-1 h-px" style={{ background: 'var(--accent-warm)', opacity: 0.3 }} />
            </div>

            {/* Dessert locked message */}
            {isDessertLocked && (
              <p className="text-sm font-body mb-3 py-2 px-3 rounded" style={{
                background: 'rgba(212, 184, 150, 0.15)',
                color: 'var(--accent-warm)',
              }}>
                Dessert is sorted! 🍰
              </p>
            )}

            {/* Recipe rows */}
            <div>
              {courseRecipes.map(recipe => {
                const isClaimed = !!recipe.claim;
                const isMyClam = recipe.claim?.user_id === currentUserId;

                // Determine if this row should be disabled
                let isDisabled = false;
                let disabledMessage = '';

                if (isDessertLocked && !isMyClam && !isClaimed) {
                  isDisabled = true;
                  disabledMessage = 'Dessert slots are full';
                }

                if (rules.needsVeg && !recipe.is_vegetarian && !recipe.is_vegan && !isMyClam && !isClaimed) {
                  isDisabled = true;
                  disabledMessage = "We'd love a veggie dish!";
                }

                return (
                  <RecipeRow
                    key={recipe.id}
                    recipe={recipe}
                    currentUserId={currentUserId}
                    userHasClaim={rules.userHasClaim}
                    isDisabled={isDisabled}
                    disabledMessage={disabledMessage}
                    isLocked={isLocked}
                    onClaim={onClaim}
                    onUnclaim={onUnclaim}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Member suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-display italic text-xl" style={{ color: 'var(--ink)' }}>
              ✨ Member Picks
            </h2>
            <div className="flex-1 h-px" style={{ background: 'var(--accent-warm)', opacity: 0.3 }} />
          </div>
          {suggestions.map(sug => (
            <div key={sug.id} className={`recipe-row ${sug.user_id === currentUserId ? 'my-claim' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-body font-medium text-sm" style={{ color: 'var(--ink)' }}>
                    {sug.suggestion_name}
                  </span>
                  <span className="text-sm ml-1">
                    {sug.suggestion_is_vegetarian ? '🌱' : '🍖'}
                  </span>
                  <br />
                  <span className="text-xs font-body" style={{ color: 'var(--accent)' }}>
                    ✨ Member Pick
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
                    {sug.profile?.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
