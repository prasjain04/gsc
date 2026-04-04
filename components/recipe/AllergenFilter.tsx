'use client';

import { ALLERGEN_EMOJI } from '@/lib/types';
import type { Allergen } from '@/lib/types';

interface AllergenFilterProps {
    selectedAllergens: Allergen[];
    onToggle: (allergen: Allergen) => void;
    onClear: () => void;
}

const ALL_ALLERGENS: Allergen[] = ['nuts', 'dairy', 'gluten', 'eggs', 'shellfish', 'soy'];

export default function AllergenFilter({ selectedAllergens, onToggle, onClear }: AllergenFilterProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <p className="font-body text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--accent-warm)' }}>
                    Filter by Allergen
                </p>
                {selectedAllergens.length > 0 && (
                    <button
                        onClick={onClear}
                        className="font-body text-xs underline transition-opacity hover:opacity-70"
                        style={{ color: 'var(--accent)' }}
                    >
                        Clear
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {ALL_ALLERGENS.map(allergen => {
                    const isSelected = selectedAllergens.includes(allergen);
                    return (
                        <button
                            key={allergen}
                            onClick={() => onToggle(allergen)}
                            className={`pill ${isSelected ? 'selected' : ''}`}
                            style={{ fontSize: '0.8rem' }}
                        >
                            <span>{ALLERGEN_EMOJI[allergen]}</span>
                            <span className="capitalize">{allergen}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
