'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface EnvelopeProps {
  children: React.ReactNode;
  onOpen?: () => void;
}

export default function Envelope({ children, onOpen }: EnvelopeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const flapControls = useAnimation();
  const letterControls = useAnimation();

  useEffect(() => {
    const timer = setTimeout(() => {
      openEnvelope();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const openEnvelope = async () => {
    if (isOpen) return;
    setIsOpen(true);

    // Flap opens
    await flapControls.start({
      rotateX: -180,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 15,
        duration: 0.8,
      },
    });

    // Letter slides up
    letterControls.start({
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 20,
        delay: 0,
      },
    });

    onOpen?.();
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen px-4"
      onClick={openEnvelope}
      style={{ cursor: isOpen ? 'default' : 'pointer' }}
    >
      <div className="relative w-full max-w-[420px]">
        {/* Letter that slides up */}
        <motion.div
          animate={letterControls}
          initial={{ y: 60, opacity: 0, scale: 0.95 }}
          className="relative z-10"
        >
          {children}
        </motion.div>

        {/* Envelope body */}
        <motion.div
          className="absolute inset-x-0 bottom-0 z-20 pointer-events-none"
          style={{ height: '55%' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: isOpen ? 0 : 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          {/* Envelope back */}
          <div
            className="absolute inset-0 rounded-b-lg"
            style={{
              background: 'linear-gradient(180deg, #E8E0D4 0%, #DDD5C8 100%)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          />

          {/* Envelope front fold */}
          <div
            className="absolute inset-0 rounded-b-lg"
            style={{
              background: 'linear-gradient(180deg, #F0E8DC 0%, #E8E0D4 100%)',
              clipPath: 'polygon(0 0, 50% 60%, 100% 0, 100% 100%, 0 100%)',
            }}
          />
        </motion.div>

        {/* Envelope flap */}
        <motion.div
          className="absolute inset-x-0 z-30 pointer-events-none"
          style={{
            top: '40%',
            height: '35%',
            transformOrigin: 'top center',
            perspective: '800px',
          }}
          animate={flapControls}
          initial={{ rotateX: 0 }}
        >
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(180deg, #E8E0D4 0%, #DDD5C8 50%)',
              clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          />
        </motion.div>

        {/* Decorative seal */}
        <motion.div
          className="absolute z-40 pointer-events-none"
          style={{
            top: '48%',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.5 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 2px 8px rgba(196, 71, 58, 0.3)',
            }}
          >
            <span className="text-white text-xs font-display italic">GSC</span>
          </div>
        </motion.div>

        {/* Tap hint */}
        {!isOpen && (
          <motion.p
            className="absolute -bottom-12 left-0 right-0 text-center text-sm font-body"
            style={{ color: 'var(--accent-warm)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            tap to open
          </motion.p>
        )}
      </div>
    </div>
  );
}
