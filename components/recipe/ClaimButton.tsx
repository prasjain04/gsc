'use client';

import { motion } from 'framer-motion';

interface ClaimButtonProps {
  isClaimed: boolean;
  isMyClam: boolean;
  isDisabled: boolean;
  disabledMessage?: string;
  onClaim: () => void;
  onUnclaim: () => void;
}

export default function ClaimButton({
  isClaimed,
  isMyClam,
  isDisabled,
  disabledMessage,
  onClaim,
  onUnclaim,
}: ClaimButtonProps) {
  if (isClaimed && !isMyClam) {
    return null; // Claimed by someone else — no button shown
  }

  if (isMyClam) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          onUnclaim();
        }}
        className="text-xs font-body py-1.5 px-4 rounded-full transition-all"
        style={{
          background: 'var(--accent)',
          color: 'var(--surface)',
        }}
      >
        Unclaim
      </motion.button>
    );
  }

  if (isDisabled) {
    return (
      <span className="text-xs font-body italic" style={{ color: 'var(--accent-warm)' }}>
        {disabledMessage || 'Unavailable'}
      </span>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.02 }}
      onClick={(e) => {
        e.stopPropagation();
        onClaim();
      }}
      className="text-xs font-body py-1.5 px-4 rounded-full transition-all"
      style={{
        border: '1.5px solid var(--accent)',
        color: 'var(--accent)',
        background: 'transparent',
      }}
    >
      Claim
    </motion.button>
  );
}
