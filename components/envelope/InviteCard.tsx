'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface InviteCardProps {
  volumeNumber: string;
  dateFormatted: string;
  cookbookName: string;
  cookbookCoverUrl?: string | null;
  eventTime?: string | null;
  eventLocation?: string | null;
  onAccept: (name: string) => void;
  onDecline: (name: string) => void;
  onSignIn: () => void;
}

export default function InviteCard({
  volumeNumber,
  dateFormatted,
  cookbookName,
  cookbookCoverUrl,
  eventTime,
  eventLocation,
  onAccept,
  onDecline,
  onSignIn,
}: InviteCardProps) {
  const [name, setName] = useState('');
  const [responded, setResponded] = useState<'accepted' | 'declined' | null>(null);

  const handleAccept = () => {
    if (!name.trim()) return;
    setResponded('accepted');
    onAccept(name.trim());
  };

  const handleDecline = () => {
    if (!name.trim()) return;
    setResponded('declined');
    onDecline(name.trim());
  };

  return (
    <div
      className="relative w-full max-w-[400px] mx-auto"
      style={{
        background: 'var(--surface)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Decorative border */}
      <div className="absolute inset-3 pointer-events-none" style={{
        border: '1px solid var(--accent-warm)',
        opacity: 0.5,
      }} />

      {/* Corner flourishes */}
      <svg className="absolute top-2 left-2 w-6 h-6 opacity-30" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warm)" strokeWidth="1">
        <path d="M2 2 C2 12, 12 2, 2 2 M2 2 C2 2, 2 12, 12 12" />
        <path d="M4 2 Q2 2 2 4" />
      </svg>
      <svg className="absolute top-2 right-2 w-6 h-6 opacity-30 scale-x-[-1]" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warm)" strokeWidth="1">
        <path d="M2 2 C2 12, 12 2, 2 2 M2 2 C2 2, 2 12, 12 12" />
        <path d="M4 2 Q2 2 2 4" />
      </svg>
      <svg className="absolute bottom-2 left-2 w-6 h-6 opacity-30 scale-y-[-1]" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warm)" strokeWidth="1">
        <path d="M2 2 C2 12, 12 2, 2 2 M2 2 C2 2, 2 12, 12 12" />
        <path d="M4 2 Q2 2 2 4" />
      </svg>
      <svg className="absolute bottom-2 right-2 w-6 h-6 opacity-30 scale-[-1]" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warm)" strokeWidth="1">
        <path d="M2 2 C2 12, 12 2, 2 2 M2 2 C2 2, 2 12, 12 12" />
        <path d="M4 2 Q2 2 2 4" />
      </svg>

      {/* Card content */}
      <div className="relative px-8 py-10 text-center">
        {/* Decorative top line */}
        <div className="w-12 h-px mx-auto mb-6" style={{ background: 'var(--accent-warm)' }} />

        {/* Title */}
        <h1
          className="font-display italic text-3xl md:text-4xl leading-tight mb-2"
          style={{ color: 'var(--ink)', letterSpacing: '0.02em' }}
        >
          Girls Supper Club
        </h1>

        {/* Subtitle line */}
        <p className="font-display italic text-sm mb-1" style={{ color: 'var(--accent)' }}>
          requests the pleasure of your company
        </p>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 my-5">
          <div className="w-8 h-px" style={{ background: 'var(--accent-warm)' }} />
          <span style={{ color: 'var(--accent)' }}>✦</span>
          <div className="w-8 h-px" style={{ background: 'var(--accent-warm)' }} />
        </div>

        {/* Volume + Date */}
        <p
          className="font-display italic text-base mb-1"
          style={{ color: 'var(--ink)', letterSpacing: '0.05em' }}
        >
          {volumeNumber}
        </p>
        <p
          className="font-display italic text-sm mb-6"
          style={{ color: 'var(--ink)', opacity: 0.7 }}
        >
          {dateFormatted}
        </p>

        {/* Time & Location */}
        {(eventTime || eventLocation) && (
          <div className="mb-6 space-y-1">
            {eventTime && (
              <p className="font-body text-xs" style={{ color: 'var(--ink)', opacity: 0.6 }}>
                {eventTime}
              </p>
            )}
            {eventLocation && (
              <p className="font-body text-xs" style={{ color: 'var(--ink)', opacity: 0.6 }}>
                📍 {eventLocation}
              </p>
            )}
          </div>
        )}

        {/* Cookbook */}
        <div className="mb-6">
          {cookbookCoverUrl && (
            <div className="w-20 h-28 mx-auto mb-3 rounded overflow-hidden shadow-sm">
              <img
                src={cookbookCoverUrl}
                alt={cookbookName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <p className="font-body text-sm" style={{ color: 'var(--ink)', opacity: 0.8 }}>
            from the pages of
          </p>
          <p className="font-display italic text-lg" style={{ color: 'var(--ink)' }}>
            {cookbookName}
          </p>
        </div>

        {/* Divider */}
        <div className="w-16 h-px mx-auto mb-6" style={{ background: 'var(--accent-warm)' }} />

        {responded ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-4"
          >
            <p className="font-display italic text-xl mb-2" style={{ color: 'var(--accent)' }}>
              {responded === 'accepted' ? 'Wonderful!' : 'We\'ll miss you!'}
            </p>
            <p className="font-body text-sm" style={{ color: 'var(--ink)', opacity: 0.6 }}>
              {responded === 'accepted'
                ? 'Please sign up to pick your recipe →'
                : 'Hope to see you at the next one ♡'}
            </p>
            {responded === 'accepted' && (
              <button
                onClick={onSignIn}
                className="btn-elegant-accent mt-4 text-xs"
              >
                Create Account
              </button>
            )}
          </motion.div>
        ) : (
          <>
            {/* Name input */}
            <div className="mb-6">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name..."
                className="w-full text-center font-script text-xl py-2 bg-transparent outline-none"
                style={{
                  borderBottom: '1.5px solid var(--accent-warm)',
                  color: 'var(--ink)',
                }}
              />
            </div>

            {/* RSVP Buttons */}
            <div className="flex gap-3 justify-center mb-6">
              <button
                onClick={handleAccept}
                disabled={!name.trim()}
                className="btn-elegant text-xs px-5 py-3 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ letterSpacing: '0.1em' }}
              >
                Joyfully Accepts
              </button>
              <button
                onClick={handleDecline}
                disabled={!name.trim()}
                className="btn-elegant text-xs px-5 py-3 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  borderColor: 'var(--accent-warm)',
                  color: 'var(--accent-warm)',
                  letterSpacing: '0.1em',
                }}
              >
                Regretfully Declines
              </button>
            </div>
          </>
        )}

        {/* Sign in link */}
        <p className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
          <button
            onClick={onSignIn}
            className="underline hover:opacity-70 transition-opacity"
            style={{ color: 'var(--accent-warm)' }}
          >
            Already have an account? Sign in →
          </button>
        </p>
      </div>
    </div>
  );
}
