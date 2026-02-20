'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface EnvelopeProps {
  children: React.ReactNode;
  onOpen?: () => void;
}

export default function Envelope({ children, onOpen }: EnvelopeProps) {
  const [phase, setPhase] = useState<'closed' | 'opening' | 'pulling' | 'unfolding' | 'done'>('closed');
  const flapControls = useAnimation();
  const letterControls = useAnimation();

  useEffect(() => {
    const timer = setTimeout(() => openEnvelope(), 900);
    return () => clearTimeout(timer);
  }, []);

  const openEnvelope = async () => {
    if (phase !== 'closed') return;

    // Phase 1: Flap lifts open
    setPhase('opening');
    await flapControls.start({
      rotateX: -180,
      opacity: 0,
      transition: { type: 'spring', stiffness: 70, damping: 14, duration: 0.9 },
    });

    // Phase 2: Folded letter slides up
    setPhase('pulling');
    await letterControls.start({
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 80, damping: 16, duration: 0.7 },
    });

    await new Promise(r => setTimeout(r, 400));

    // Phase 3: Unfold
    setPhase('unfolding');
    await new Promise(r => setTimeout(r, 800));

    // Phase 4: Done
    setPhase('done');
    onOpen?.();
  };

  const showEnvelope = phase === 'closed' || phase === 'opening';

  return (
    <div
      className="relative flex items-center justify-center min-h-screen px-4"
      onClick={() => phase === 'closed' && openEnvelope()}
      style={{ cursor: phase === 'closed' ? 'pointer' : 'default' }}
    >
      <div className="relative w-full max-w-[420px]">

        {/* ── THE LETTER (single instance) ── */}
        <motion.div
          animate={letterControls}
          initial={{ y: 120, opacity: 0 }}
          className="relative z-10"
        >
          {/* Card wrapper — scaleY animates from 0.5 (folded) to 1 (open) */}
          <div
            className="relative"
            style={{
              transform: phase === 'pulling'
                ? 'scaleY(0.5) perspective(600px) rotateX(8deg)'
                : phase === 'unfolding'
                  ? 'scaleY(1)'
                  : 'none',
              transformOrigin: 'top center',
              transition: phase === 'unfolding'
                ? 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                : 'none',
            }}
          >
            {/* Hide actual content while folded, show blank paper */}
            {phase === 'pulling' ? (
              <div
                className="w-full rounded-lg"
                style={{
                  height: '600px',
                  background: 'linear-gradient(180deg, var(--surface) 0%, #F2EDE5 100%)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(212, 184, 150, 0.3)',
                  position: 'relative',
                }}
              >
                {/* Center crease line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '10%',
                    right: '10%',
                    top: '50%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, rgba(180,170,155,0.5), rgba(160,150,135,0.6), rgba(180,170,155,0.5), transparent)',
                    transform: 'translateY(-50%)',
                  }}
                />
              </div>
            ) : (
              <>
                {children}
                {/* Fade-in crease line that disappears */}
                {phase === 'unfolding' && (
                  <div
                    className="absolute left-[10%] right-[10%] pointer-events-none"
                    style={{
                      top: '50%',
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(180,170,155,0.4), transparent)',
                      transform: 'translateY(-50%)',
                      zIndex: 5,
                      animation: 'fadeOut 0.8s ease-out forwards',
                    }}
                  />
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* ── ENVELOPE BODY ── */}
        {showEnvelope && (
          <motion.div
            className="absolute inset-x-0 bottom-0 z-20 pointer-events-none"
            style={{ height: '60%' }}
            animate={{ opacity: phase === 'opening' ? 0 : 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {/* Back panel */}
            <div
              className="absolute inset-0 rounded-b-lg"
              style={{
                background: 'linear-gradient(180deg, #E8E0D4 0%, #DDD5C8 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            />
            {/* Front V-fold */}
            <div
              className="absolute inset-0 rounded-b-lg"
              style={{
                background: 'linear-gradient(180deg, #F0E8DC 0%, #E8E0D4 100%)',
                clipPath: 'polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)',
              }}
            />

            {/* GSC seal — centered in the front panel below the V */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '75%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--accent)',
                  boxShadow: '0 2px 10px rgba(196, 71, 58, 0.35)',
                }}
              >
                <span className="text-white text-sm font-display italic">GSC</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ENVELOPE FLAP ── */}
        {showEnvelope && (
          <motion.div
            className="absolute inset-x-0 z-30 pointer-events-none"
            style={{
              top: '36%',
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
              }}
            />
          </motion.div>
        )}

        {/* Tap hint */}
        {phase === 'closed' && (
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

      {/* Keyframe for crease fade */}
      <style jsx>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
