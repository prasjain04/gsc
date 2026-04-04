'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALLERGEN_EMOJI, COURSE_ORDER, COURSE_LABELS, COURSE_QUOTAS } from '@/lib/types';
import type { RecipeWithClaim, Recipe, Allergen, Course, Profile } from '@/lib/types';

interface RecipeSelectionFormProps {
    recipes: RecipeWithClaim[];
    currentClaim?: { claimId: string; recipe?: Recipe; isSuggestion?: boolean; suggestionName?: string } | null;
    isLocked: boolean;
    currentCourse: Course | null;
    currentPartners: string[];
    allProfiles: Profile[];
    userId: string | null;
    courseCounts: Record<Course, number>;
    onClaim: (recipeId: string, course: Course, partnerIds: string[]) => void;
    onUnclaim: (claimId: string) => void;
}

export default function RecipeSelectionForm({
    recipes,
    currentClaim,
    isLocked,
    currentCourse,
    currentPartners,
    allProfiles,
    userId,
    courseCounts,
    onClaim,
    onUnclaim,
}: RecipeSelectionFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
    const [allergensAcknowledged, setAllergensAcknowledged] = useState(false);

    // Internal state for RSVP fields tied to this claim
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(currentCourse);
    const [selectedPartners, setSelectedPartners] = useState<string[]>(currentPartners);
    const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);

    const togglePartner = (pid: string) => {
        if (selectedPartners.includes(pid)) {
            setSelectedPartners(selectedPartners.filter(p => p !== pid));
        } else if (selectedPartners.length < 2) {
            setSelectedPartners([...selectedPartners, pid]);
        }
    };

    const partnerProfiles = allProfiles?.filter(p => p.id !== userId) || [];

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
        if (!selectedRecipeId || !allergensAcknowledged || !selectedCourse) return;

        // If user already has a claim, unclaim first
        if (currentClaim?.claimId) {
            onUnclaim(currentClaim.claimId);
        }

        onClaim(selectedRecipeId, selectedCourse, selectedPartners);
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
                <div className="mt-2">
                    <p className="font-body text-sm" style={{ color: 'var(--ink)' }}>
                        You're making: <strong>{currentDishName}</strong>
                    </p>
                    {currentCourse && (
                        <div className="flex gap-2 mt-2">
                            <span className="text-[10px] uppercase font-body px-1.5 py-0.5 rounded" style={{ background: 'var(--accent)', color: 'var(--surface)' }}>
                                {COURSE_LABELS[currentCourse]}
                            </span>
                            {currentPartners.length > 0 && (
                                <span className="text-[10px] font-body px-1.5 py-0.5 rounded" style={{ border: '1px solid var(--accent-warm)', color: 'var(--ink)' }}>
                                    with {allProfiles.filter(p => currentPartners.includes(p.id)).map(p => p.name).join(' & ')}
                                </span>
                            )}
                        </div>
                    )}
                </div>
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
                                {currentCourse && (
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-[10px] uppercase font-body px-1.5 py-0.5 rounded" style={{ background: 'var(--accent)', color: 'var(--surface)' }}>
                                            {COURSE_LABELS[currentCourse]}
                                        </span>
                                        {currentPartners.length > 0 && (
                                            <span className="text-[10px] font-body px-1.5 py-0.5 rounded" style={{ border: '1px solid var(--accent-warm)', color: 'var(--ink)' }}>
                                                with {allProfiles.filter(p => currentPartners.includes(p.id)).map(p => p.name).join(' & ')}
                                            </span>
                                        )}
                                    </div>
                                )}
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

                        {/* Course Distribution Summary */}
                        <div className="mb-4 p-3 rounded-lg flex flex-wrap gap-x-4 gap-y-2" style={{ background: 'rgba(212, 184, 150, 0.05)' }}>
                            {COURSE_ORDER.map(course => {
                                const count = courseCounts[course] || 0;
                                const quota = COURSE_QUOTAS[course];
                                return (
                                    <div key={course} className="flex items-center gap-1.5 text-xs font-body" style={{ color: 'var(--ink)' }}>
                                        <span className="opacity-80">{COURSE_LABELS[course]}</span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px]" style={{
                                            background: count >= quota ? 'var(--accent-warm)' : 'rgba(212, 184, 150, 0.2)',
                                            color: count >= quota ? 'var(--surface)' : 'inherit'
                                        }}>
                                            {count}/{quota}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

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

                        {/* Course Selection component */}
                        {selectedRecipe && (
                            <div className="mb-4">
                                <p className="font-body text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--ink)' }}>
                                    What course is this?
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {COURSE_ORDER.map(course => {
                                        const count = courseCounts[course] || 0;
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
                        )}

                        {/* Cooking Partners component */}
                        {selectedRecipe && (
                            <div className="relative mb-4">
                                <p className="font-body text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--ink)' }}>
                                    Cooking Partner(s) <span className="opacity-60 lowercase font-normal">(optional, max 2)</span>
                                </p>
                                <button
                                    onClick={() => setShowPartnerDropdown(!showPartnerDropdown)}
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

                                {showPartnerDropdown && (
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
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleConfirm}
                                disabled={!selectedRecipeId || !allergensAcknowledged || !selectedCourse}
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
