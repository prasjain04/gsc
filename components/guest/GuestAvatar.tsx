'use client';

import { getDietaryEmoji } from '@/lib/theme';
import type { GuestInfo } from '@/lib/types';

interface GuestAvatarProps {
  guest: GuestInfo;
  size?: 'sm' | 'md';
}

export default function GuestAvatar({ guest, size = 'md' }: GuestAvatarProps) {
  const { profile, claim } = guest;
  const emoji = getDietaryEmoji(profile.dietary_restrictions);
  const sizeClass = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const recipeName = claim?.is_suggestion
    ? claim.suggestion_name
    : claim?.recipe?.name;

  return (
    <div className="flex flex-col items-center gap-1 min-w-[70px]">
      {/* Avatar circle */}
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0`}
        style={{
          border: '2px solid var(--accent-warm)',
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
          <div className="w-full h-full flex items-center justify-center font-display italic text-lg" style={{ color: 'var(--accent-warm)' }}>
            {profile.name?.charAt(0) || '?'}
          </div>
        )}
      </div>

      {/* Name + emoji */}
      <p className={`${textSize} font-body text-center leading-tight`} style={{ color: 'var(--ink)' }}>
        {profile.name} {emoji}
      </p>

      {/* What they're making */}
      <p className="text-xs font-body text-center leading-tight" style={{ color: 'var(--accent-warm)' }}>
        {recipeName || "Hasn't picked yet 👀"}
      </p>
    </div>
  );
}
