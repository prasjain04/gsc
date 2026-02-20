'use client';

import { DIETARY_OPTIONS } from '@/lib/types';

interface DietaryPickerProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function DietaryPicker({ selected, onChange }: DietaryPickerProps) {
  const toggle = (value: string) => {
    // If "no-restrictions" is selected, clear everything else
    if (value === 'no-restrictions') {
      onChange(selected.includes(value) ? [] : ['no-restrictions']);
      return;
    }

    // Remove "no-restrictions" if selecting something else
    let newSelection = selected.filter(s => s !== 'no-restrictions');

    if (newSelection.includes(value)) {
      newSelection = newSelection.filter(s => s !== value);
    } else {
      newSelection = [...newSelection, value];
    }

    onChange(newSelection);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {DIETARY_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={`pill ${selected.includes(opt.value) ? 'selected' : ''}`}
        >
          <span>{opt.emoji}</span>
          <span className="font-body text-sm">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
