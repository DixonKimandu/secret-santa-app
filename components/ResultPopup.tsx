'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface ResultPopupProps {
  isOpen: boolean;
  matchedName: string;
  onClose: () => void;
}

export default function ResultPopup({
  isOpen,
  matchedName,
  onClose,
}: ResultPopupProps) {
  useEffect(() => {
    if (isOpen && matchedName) {
      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Big burst at the start
      confetti({
        ...defaults,
        particleCount: 100,
        origin: { x: 0.5, y: 0.5 },
      });

      return () => clearInterval(interval);
    }
  }, [isOpen, matchedName]);

  if (typeof window === 'undefined') {
    return null;
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && matchedName && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 overflow-hidden border-4 border-red-300 dark:border-red-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative background - Christmas themed */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-red-950 dark:via-gray-900 dark:to-green-950 opacity-50" />
            {/* Christmas decorations */}
            <div className="absolute top-2 right-2 text-2xl">🎄</div>
            <div className="absolute bottom-2 left-2 text-2xl">❄️</div>
            
            <div className="relative z-10">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="text-6xl text-center mb-4"
              >
                🎁
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-center bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent mb-2"
              >
                Your Secret Santa Match!
              </motion.h2>

              {/* Matched Name */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 rounded-2xl p-6 mb-6 mt-4 border-2 border-white shadow-xl"
              >
                <p className="text-center text-white text-sm mb-2 opacity-90">
                  You're buying a gift for:
                </p>
                <p className="text-center text-white text-4xl font-bold">
                  {matchedName}
                </p>
              </motion.div>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-gray-600 dark:text-gray-400 mb-6"
              >
                Happy gift giving! 🎉
              </motion.p>

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all shadow-lg border-2 border-white"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
