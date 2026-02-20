'use client';

import GuestAvatar from './GuestAvatar';
import type { GuestInfo } from '@/lib/types';

interface GuestRailProps {
  guests: GuestInfo[];
  layout?: 'horizontal' | 'vertical';
}

export default function GuestRail({ guests, layout = 'vertical' }: GuestRailProps) {
  const attendingCount = guests.length;

  if (layout === 'horizontal') {
    return (
      <div className="w-full">
        <p className="font-body text-sm mb-3" style={{ color: 'var(--ink)' }}>
          <span className="font-medium">{attendingCount} girlies coming</span> 🍴
        </p>
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
          {guests.map(guest => (
            <GuestAvatar key={guest.profile.id} guest={guest} size="sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="font-display italic text-lg" style={{ color: 'var(--ink)' }}>
        {attendingCount} girlies coming 🍴
      </p>
      <div className="divider-fine" />
      <div className="space-y-4">
        {guests.map(guest => (
          <div key={guest.profile.id} className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
              style={{
                border: '1.5px solid var(--accent-warm)',
                background: 'var(--surface)',
              }}
            >
              {guest.profile.avatar_url ? (
                <img src={guest.profile.avatar_url} alt={guest.profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display italic text-sm" style={{ color: 'var(--accent-warm)' }}>
                  {guest.profile.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-body text-sm truncate" style={{ color: 'var(--ink)' }}>
                {guest.profile.name} {getDietaryEmojiInline(guest.profile.dietary_restrictions)}
              </p>
              <p className="font-body text-xs truncate" style={{ color: 'var(--accent-warm)' }}>
                {getClaimText(guest)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
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

function getClaimText(guest: GuestInfo): string {
  if (!guest.claim) return "Hasn't picked yet 👀";
  if (guest.claim.is_suggestion) return `✨ ${guest.claim.suggestion_name}`;
  return guest.claim.recipe?.name || "Hasn't picked yet 👀";
}
