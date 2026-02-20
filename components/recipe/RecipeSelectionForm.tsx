'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALLERGEN_EMOJI, COURSE_ORDER, COURSE_LABELS } from '@/lib/types';
import type { RecipeWithClaim, Recipe, Allergen, Course } from '@/lib/types';

interface RecipeSelectionFormProps {
    recipes: RecipeWithClaim[];
    currentClaim?: { claimId: string; recipe?: Recipe; isSuggestion?: boolean; suggestionName?: string } | null;
    isLocked: boolean;
    onClaim: (recipeId: string) => void;
    onUnclaim: (claimId: string) => void;
}

export default function RecipeSelectionForm({
    recipes,
    currentClaim,
    isLocked,
    onClaim,
    onUnclaim,
}: RecipeSelectionFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
    const [allergensAcknowledged, setAllergensAcknowledged] = useState(false);

    // Find the selected recipe from the list
    const selectedRecipe = useMemo(
        () => recipes.find(r => r.id === selectedRecipeId),
        [recipes, selectedRecipeId]
    );

    // Available recipes (unclaimed or claimed by me)
    const availableRecipes = useMemo(() => {
        return recipes.filter(r => !r.claim || r.claim?.user_id === currentClaim?.claimId);
    }, [recipes, currentClaim]);

    // Group available recipes by course
    const groupedRecipes = useMemo(() => {
        const groups: Record<Course, RecipeWithClaim[]> = {
            appetizer: [], main: [], side: [], dessert: [],
        };
        availableRecipes.forEach(r => {
            if (groups[r.course]) groups[r.course].push(r);
        });
        return groups;
    }, [availableRecipes]);

    const handleRecipeChange = (recipeId: string) => {
        setSelectedRecipeId(recipeId);
        setAllergensAcknowledged(false);
    };

    const handleConfirm = () => {
        if (!selectedRecipeId || !allergensAcknowledged) return;

        // If user already has a claim, unclaim first
        if (currentClaim?.claimId) {
            onUnclaim(currentClaim.claimId);
        }

        onClaim(selectedRecipeId);
        setIsOpen(false);
        setSelectedRecipeId('');
        setAllergensAcknowledged(false);
    };

    const currentDishName = currentClaim?.isSuggestion
        ? currentClaim.suggestionName
        : currentClaim?.recipe?.name;

    if (isLocked) {
        return (
            <div className="recipe-selection-panel">
                <p className="font-body text-xs" style={{ color: 'var(--accent-warm)' }}>
                    🔒 Selections are locked
                </p>
                {currentDishName && (
                    <p className="font-body text-sm mt-1" style={{ color: 'var(--ink)' }}>
                        You're making: <strong>{currentDishName}</strong>
                    </p>
                )}
            </div>
        );
    }

    const LEGEND_ITEMS = [
        ['🥜', 'Nuts'], ['🥛', 'Dairy'], ['🌾', 'Gluten'],
        ['🍳', 'Eggs'], ['🦐', 'Shellfish'], ['🫘', 'Soy'],
        ['🥦', 'Veg'], ['🌱', 'Vegan'],
    ] as const;

    return (
        <div className="recipe-selection-panel">
            {/* Compact icon legend */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mb-3 pb-3" style={{ borderBottom: '1px solid rgba(212, 184, 150, 0.2)' }}>
                {LEGEND_ITEMS.map(([emoji, label]) => (
                    <span key={label} className="text-[10px] font-body whitespace-nowrap" style={{ color: 'var(--accent-warm)' }}>
                        {emoji} {label}
                    </span>
                ))}
            </div>
            {/* Current selection / trigger */}
            {!isOpen ? (
                <div>
                    {currentDishName ? (
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="font-body text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--accent-warm)' }}>
                                    Your Dish
                                </p>
                                <p className="font-body font-medium text-sm" style={{ color: 'var(--ink)' }}>
                                    {currentDishName}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        if (currentClaim?.claimId) {
                                            onUnclaim(currentClaim.claimId);
                                        }
                                    }}
                                    className="text-xs font-body py-1.5 px-3 rounded-full transition-all"
                                    style={{
                                        border: '1.5px solid var(--accent-warm)',
                                        color: 'var(--accent-warm)',
                                        background: 'transparent',
                                    }}
                                >
                                    Still thinking
                                </button>
                                <button
                                    onClick={() => setIsOpen(true)}
                                    className="text-xs font-body py-1.5 px-3 rounded-full transition-all"
                                    style={{
                                        border: '1.5px solid var(--accent)',
                                        color: 'var(--accent)',
                                        background: 'transparent',
                                    }}
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsOpen(true)}
                            className="btn-elegant-filled text-xs w-full"
                        >
                            🍳 Select Your Recipe
                        </button>
                    )}
                </div>
            ) : (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <h3 className="font-display italic text-lg mb-3" style={{ color: 'var(--ink)' }}>
                            Choose a Recipe
                        </h3>

                        {/* Recipe dropdown */}
                        <div className="mb-4">
                            <select
                                value={selectedRecipeId}
                                onChange={(e) => handleRecipeChange(e.target.value)}
                                className="recipe-select font-body text-sm w-full"
                            >
                                <option value="">— Select a recipe —</option>
                                {COURSE_ORDER.map(course => {
                                    const courseRecipes = groupedRecipes[course];
                                    if (courseRecipes.length === 0) return null;
                                    return (
                                        <optgroup key={course} label={COURSE_LABELS[course]}>
                                            {courseRecipes.map(r => (
                                                <option key={r.id} value={r.id} disabled={!!r.claim}>
                                                    {r.name} {r.allergens.map(a => ALLERGEN_EMOJI[a as Allergen] || '').join('')}
                                                    {r.claim ? ' (taken)' : ''}
                                                </option>
                                            ))}
                                        </optgroup>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Selected recipe preview */}
                        {selectedRecipe && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mb-4 p-3 rounded-lg"
                                style={{ background: 'rgba(212, 184, 150, 0.1)' }}
                            >
                                <p className="font-body font-medium text-sm mb-1" style={{ color: 'var(--ink)' }}>
                                    {selectedRecipe.name}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedRecipe.is_vegetarian && (
                                        <span className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>🌱 Vegetarian</span>
                                    )}
                                    {selectedRecipe.is_vegan && (
                                        <span className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>🌿 Vegan</span>
                                    )}
                                    {selectedRecipe.page_number && (
                                        <span className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>p. {selectedRecipe.page_number}</span>
                                    )}
                                </div>

                                {/* Allergen display */}
                                {selectedRecipe.allergens.length > 0 && (
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>Contains:</span>
                                        {selectedRecipe.allergens.map(a => (
                                            <span key={a} className="text-sm" title={a}>
                                                {ALLERGEN_EMOJI[a as Allergen] || a}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Allergen confirmation */}
                                <div className="allergen-confirm mt-3">
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={allergensAcknowledged}
                                            onChange={(e) => setAllergensAcknowledged(e.target.checked)}
                                            className="mt-0.5 accent-[var(--accent)]"
                                        />
                                        <span className="text-xs font-body leading-relaxed" style={{ color: 'var(--ink)' }}>
                                            {selectedRecipe.allergens.length > 0
                                                ? `I confirm this recipe contains ${selectedRecipe.allergens.join(', ')}. I've reviewed the group's dietary needs and will prepare this dish with these allergens accounted for.`
                                                : `I confirm I've reviewed this recipe and the group's dietary needs.`
                                            }
                                        </span>
                                    </label>
                                </div>
                            </motion.div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleConfirm}
                                disabled={!selectedRecipeId || !allergensAcknowledged}
                                className="btn-elegant-filled text-xs flex-1"
                                style={{
                                    opacity: (!selectedRecipeId || !allergensAcknowledged) ? 0.4 : 1,
                                    cursor: (!selectedRecipeId || !allergensAcknowledged) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                ✓ Confirm Selection
                            </button>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setSelectedRecipeId('');
                                    setAllergensAcknowledged(false);
                                }}
                                className="text-xs font-body underline px-3"
                                style={{ color: 'var(--accent-warm)' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}
