import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Crown, Zap } from 'lucide-react';

const MILESTONES = [
  { count: 10, icon: Zap, label: 'Getting Started!', color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/20' },
  { count: 50, icon: Flame, label: 'On Fire!', color: 'text-orange-400', bg: 'from-orange-500/20 to-orange-600/20' },
  { count: 100, icon: Trophy, label: 'Century!', color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-600/20' },
  { count: 250, icon: Trophy, label: 'Quarter Thousand!', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/20' },
  { count: 500, icon: Crown, label: 'Halfway Hero!', color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/20' },
  { count: 1000, icon: Crown, label: 'Legendary!', color: 'text-yellow-400', bg: 'from-yellow-500/20 to-yellow-600/20' },
];

// Confetti particle
function Particle({ delay }) {
  const colors = ['#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa', '#fb923c'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const x = (Math.random() - 0.5) * 300;
  const startX = (Math.random() - 0.5) * 40;

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color, left: '50%', top: '50%' }}
      initial={{ x: startX, y: 0, scale: 1, opacity: 1 }}
      animate={{ x, y: -200 + Math.random() * -100, scale: 0, opacity: 0, rotate: Math.random() * 720 }}
      transition={{ duration: 1 + Math.random() * 0.5, delay, ease: 'easeOut' }}
    />
  );
}

export default function MilestoneToast({ reviewedCount }) {
  const [activeMilestone, setActiveMilestone] = useState(null);
  const [shownMilestones, setShownMilestones] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cleander_milestones_shown') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const milestone = MILESTONES.find(
      (m) => reviewedCount === m.count && !shownMilestones.includes(m.count)
    );

    if (milestone) {
      setActiveMilestone(milestone);
      const updated = [...shownMilestones, milestone.count];
      setShownMilestones(updated);
      localStorage.setItem('cleander_milestones_shown', JSON.stringify(updated));

      setTimeout(() => setActiveMilestone(null), 3500);
    }
  }, [reviewedCount]);

  return (
    <AnimatePresence>
      {activeMilestone && (() => {
        const Icon = activeMilestone.icon;
        return (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <Particle key={i} delay={i * 0.03} />
              ))}
            </div>

            {/* Badge */}
            <motion.div
              className={`bg-gradient-to-br ${activeMilestone.bg} backdrop-blur-xl border border-white/10 rounded-3xl px-8 py-6 text-center shadow-2xl`}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Icon size={48} className={`${activeMilestone.color} mx-auto mb-3`} />
              <p className="text-3xl font-black text-white">{activeMilestone.count}</p>
              <p className="text-sm font-semibold text-zinc-300 mt-1">songs reviewed</p>
              <p className={`text-lg font-bold ${activeMilestone.color} mt-2`}>{activeMilestone.label}</p>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}
