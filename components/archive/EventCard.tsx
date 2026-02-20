'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { toRoman, formatInviteDate, parseTheme } from '@/lib/theme';
import type { EventWithCookbook, Profile } from '@/lib/types';

interface EventCardProps {
  event: EventWithCookbook;
  attendees: Profile[];
  index: number;
}

export default function EventCard({ event, attendees, index }: EventCardProps) {
  const theme = parseTheme(event.color_theme);

  // Slight random rotation for scrapbook feel
  const rotations = [-1.5, 0.8, -0.5, 1.2, -0.8, 1, -1, 0.5];
  const rotation = rotations[index % rotations.length];

  return (
    <Link href={`/archive/${event.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02, rotate: 0 }}
        className="relative rounded-lg overflow-hidden cursor-pointer"
        style={{
          background: theme.surface,
          border: `1px solid ${theme.accentWarm}40`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {/* Color accent bar */}
        <div className="h-1.5" style={{ background: theme.accent }} />

        <div className="p-5">
          {/* Volume + Date */}
          <p className="font-display italic text-lg mb-0.5" style={{ color: theme.ink }}>
            Vol. {toRoman(event.volume_number)}
          </p>
          <p className="font-body text-xs mb-4" style={{ color: theme.accentWarm }}>
            {formatInviteDate(event.date)}
          </p>

          {/* Cookbook */}
          <div className="flex items-center gap-3 mb-4">
            {event.cookbook?.cover_url && (
              <img
                src={event.cookbook.cover_url}
                alt={event.cookbook?.name}
                className="w-10 h-14 object-cover rounded shadow-sm"
              />
            )}
            <p className="font-display italic text-sm" style={{ color: theme.ink }}>
              {event.cookbook?.name || 'Cookbook'}
            </p>
          </div>

          {/* Attendee avatars */}
          <div className="flex -space-x-2">
            {attendees.slice(0, 8).map(a => (
              <div
                key={a.id}
                className="w-7 h-7 rounded-full overflow-hidden"
                style={{
                  border: `2px solid ${theme.surface}`,
                  background: theme.bg,
                }}
              >
                {a.avatar_url ? (
                  <img src={a.avatar_url} alt={a.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-display italic" style={{ color: theme.accentWarm }}>
                    {a.name?.charAt(0)}
                  </div>
                )}
              </div>
            ))}
            {attendees.length > 8 && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-body"
                style={{ border: `2px solid ${theme.surface}`, background: theme.bg, color: theme.accentWarm }}
              >
                +{attendees.length - 8}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
