'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { formatRM } from '@/lib/formatters';

interface Props {
  open: boolean;
  tier: string;
  amount: number;
  matchedNumber: string;
  invoiceCode: string;
  matchLength: number;
  supplierName: string;
  onClose: () => void;
}

export function WinAnimation({ open, tier, amount, matchedNumber, invoiceCode, matchLength, supplierName, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const duration = 2800;
    const end = Date.now() + duration;
    const colors = ['#f97316', '#fbbf24', '#ef4444', '#ec4899', '#a855f7'];

    confetti({ particleCount: 160, spread: 110, origin: { y: 0.5 }, colors });

    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 p-8 text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              initial={{ rotate: -8, scale: 0.5 }}
              animate={{ rotate: [0, 8, -8, 6, 0], scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="text-6xl"
            >
              🎉
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow-md"
            >
              中獎了！
            </motion.div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.55, type: 'spring', stiffness: 200 }}
              className="mt-3 inline-block rounded-full bg-white/95 px-5 py-1.5 text-sm font-bold text-rose-600 shadow-md"
            >
              {tier}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.75, type: 'spring', stiffness: 200 }}
              className="mt-3"
            >
              <div className="text-5xl font-black tabular-nums text-white drop-shadow-lg">
                {formatRM(amount)}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/80">獎金</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95 }}
              className="mt-5 rounded-xl bg-white/15 p-3 backdrop-blur-md"
            >
              <div className="text-[10px] text-white/80">{supplierName}</div>
              <DigitReveal code={invoiceCode} matchLength={matchLength} />
              <div className="mt-1 text-[10px] text-white/70">
                {tier} 號碼：{matchedNumber.slice(-matchLength)}
              </div>
            </motion.div>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-white py-2.5 font-semibold text-rose-600 shadow hover:bg-white/90"
            >
              好喔！
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DigitReveal({ code, matchLength }: { code: string; matchLength: number }) {
  const chars = code.split('');
  return (
    <div className="mt-1 flex justify-center gap-1 font-mono text-2xl font-black">
      {chars.map((c, i) => {
        const matched = i >= chars.length - matchLength;
        return (
          <motion.span
            key={i}
            initial={{ y: -20, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              backgroundColor: matched ? '#16a34a' : 'rgba(255,255,255,0.12)',
              color: matched ? '#fff' : 'rgba(255,255,255,0.85)',
              boxShadow: matched ? '0 0 16px rgba(34,197,94,0.7)' : 'none',
            }}
            transition={{ delay: 1.1 + i * 0.07 }}
            className="grid h-9 w-7 place-items-center rounded-md"
          >
            {c}
          </motion.span>
        );
      })}
    </div>
  );
}
