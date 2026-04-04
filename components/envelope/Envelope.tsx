'use client';

import { motion, useAnimation } from 'framer-motion';
import { useState, useRef } from 'react';

interface EnvelopeProps {
  children: React.ReactNode;
  onOpen?: () => void;
}

export default function Envelope({ children, onOpen }: EnvelopeProps) {
  const [phase, setPhase] = useState<'closed' | 'flap-open' | 'sliding' | 'done'>('closed');
  const flapControls = useAnimation();
  const cardControls = useAnimation();
  const envelopeControls = useAnimation();
  const cardRef = useRef<HTMLDivElement>(null);

  const openEnvelope = async () => {
    if (phase !== 'closed') return;

    // Step 1: Flap opens
    setPhase('flap-open');
    await flapControls.start({
      rotateX: 180,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    });

    // Step 2: One continuous motion — card rises while envelope fades
    setPhase('sliding');

    envelopeControls.start({
      opacity: 0,
      transition: { duration: 0.4, ease: 'easeOut', delay: 0.15 },
    });

    // Single fluid slide all the way to center
    await cardControls.start({
      y: -260,
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
    });

    setPhase('done');
    onOpen?.();
  };

  // ── DONE: card in normal centered layout — instant swap, no motion wrapper ──
  if (phase === 'done') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-[380px]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4"
      onClick={() => phase === 'closed' && openEnvelope()}
      style={{
        cursor: phase === 'closed' ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      <div className="relative w-full max-w-[380px]" style={{ height: '280px' }}>

        <div
          className="absolute inset-x-[4%]"
          style={{
            top: '-460px',
            height: '480px',
            overflow: 'hidden',
            zIndex: 30,
          }}
        >
          <motion.div
            animate={cardControls}
            initial={{ y: 460 }}
            className="absolute bottom-0 inset-x-0"
            style={{ willChange: 'transform' }}
          >
            <div style={{
              opacity: phase === 'closed' ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}>
              {children}
            </div>
          </motion.div>
        </div>

        {/* ── ENVELOPE ── */}
        <motion.div
          className="absolute inset-0"
          animate={envelopeControls}
          initial={{ opacity: 1 }}
          style={{ zIndex: 10, willChange: 'opacity' }}
        >
          <div className="absolute inset-0" style={{
            background: '#E8E0D4',
            borderRadius: '4px 4px 8px 8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.10)',
          }} />

          <div className="absolute inset-x-0 top-0" style={{
            height: '55%', background: '#F5F0E8',
            clipPath: 'polygon(0 0, 50% 80%, 100% 0)',
          }} />

          <div className="absolute top-0 left-0 bottom-0" style={{
            width: '12%', background: 'linear-gradient(90deg, #DFD7CB, #E8E0D4)',
            clipPath: 'polygon(0 0, 100% 12%, 100% 88%, 0 100%)', borderRadius: '4px 0 0 8px',
          }} />

          <div className="absolute top-0 right-0 bottom-0" style={{
            width: '12%', background: 'linear-gradient(270deg, #DFD7CB, #E8E0D4)',
            clipPath: 'polygon(0 12%, 100% 0, 100% 100%, 0 88%)', borderRadius: '0 4px 8px 0',
          }} />

          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, #F0E8DC 0%, #E8E0D4 100%)',
            clipPath: 'polygon(0 0, 50% 45%, 100% 0, 100% 100%, 0 100%)',
            borderRadius: '0 0 8px 8px',
          }} />

          <div className="absolute bottom-0 inset-x-0" style={{
            height: '18%', background: 'linear-gradient(0deg, #E0D8CC, transparent)',
            borderRadius: '0 0 8px 8px',
          }} />

          {/* Flap */}
          <motion.div
            className="absolute inset-x-0 top-0"
            style={{ height: '55%', transformOrigin: 'top center', perspective: '600px', zIndex: 35, willChange: 'transform' }}
            animate={flapControls}
            initial={{ rotateX: 0 }}
          >
            <div className="w-full h-full" style={{
              background: 'linear-gradient(180deg, #EDE6DA 0%, #E4DCD0 100%)',
              clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
              backfaceVisibility: 'hidden',
            }} />
          </motion.div>

          {/* Wax seal */}
          <motion.div
            className="absolute pointer-events-none"
            style={{ left: '43%', top: '45%', transform: 'translate(-50%, -50%)', zIndex: 36 }}
            animate={{ opacity: phase === 'closed' ? 1 : 0, scale: phase === 'closed' ? 1 : 0.5 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(circle at 40% 35%, #D4564A 0%, #B8443A 40%, #9C3830 100%)',
                borderRadius: '47% 53% 52% 48% / 49% 45% 55% 51%',
                boxShadow: '0 3px 8px rgba(156, 56, 48, 0.4), inset 0 1px 2px rgba(255,255,255,0.15)',
              }} />
              <div className="absolute" style={{
                inset: '6px', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '50%',
              }} />
              <span className="relative text-white text-xs font-display italic" style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.3)', letterSpacing: '0.5px',
              }}>GSC</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Tap hint */}
        {phase === 'closed' && (
          <motion.p
            className="absolute left-0 right-0 text-center text-sm font-body"
            style={{ bottom: '-40px', color: 'var(--accent-warm)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5, ease: 'easeInOut' }}
          >
            tap to open
          </motion.p>
        )}
      </div>
    </div>
  );
}
