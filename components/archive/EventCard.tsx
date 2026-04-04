'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { toRoman, formatInviteDate } from '@/lib/theme';
import type { EventWithCookbook } from '@/lib/types';

interface EventCardProps {
  event: EventWithCookbook;
  index: number;
}

export default function EventCard({ event, index }: EventCardProps) {
  const coverUrl = event.cookbook?.cover_url;

  return (
    <Link href={`/archive/${event.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.03 }}
        className="relative cursor-pointer group"
      >
        {/* Cookbook cover */}
        <div
          className="rounded-lg overflow-hidden shadow-md aspect-[3/4] flex items-center justify-center"
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(212, 184, 150, 0.3)',
          }}
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={event.cookbook?.name || 'Cookbook'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="text-center px-4">
              <p className="font-display italic text-lg" style={{ color: 'var(--ink)' }}>
                Vol. {toRoman(event.volume_number)}
              </p>
              <p className="font-body text-xs mt-1" style={{ color: 'var(--accent-warm)' }}>
                {event.cookbook?.name || 'Cookbook'}
              </p>
            </div>
          )}
        </div>

        {/* Caption below */}
        <div className="text-center mt-3">
          <p className="font-display italic text-sm" style={{ color: 'var(--ink)' }}>
            Vol. {toRoman(event.volume_number)}
          </p>
          <p className="font-body text-xs mt-0.5" style={{ color: 'var(--accent-warm)', opacity: 0.8 }}>
            {formatInviteDate(event.date)}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
