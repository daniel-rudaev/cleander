import React from 'react';
import { motion } from 'framer-motion';
import { Music, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function EmptyState({ type }) {
  if (type === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={48} className="text-emerald-500 mb-4" />
        </motion.div>
        <p className="text-zinc-400 mt-4">Loading your songs...</p>
        <p className="text-zinc-600 text-sm mt-1">This might take a moment</p>
      </div>
    );
  }

  if (type === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-6">
            <CheckCircle2 size={48} className="text-emerald-400" />
          </div>
          {/* Celebration sparkles */}
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles size={20} className="text-amber-400" />
          </motion.div>
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-2">All Caught Up!</h3>
        <p className="text-zinc-400 max-w-xs">
          You've reviewed all loaded songs. More will load automatically if there are any left in your library.
        </p>
      </div>
    );
  }

  // Empty / not connected state
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center mb-6 ring-1 ring-zinc-700">
          <Music size={48} className="text-zinc-500" />
        </div>
      </motion.div>
      <h3 className="text-2xl font-bold text-white mb-2">No Songs Yet</h3>
      <p className="text-zinc-400 max-w-xs">
        Connect your Spotify account to start reviewing your liked songs.
      </p>
    </div>
  );
}
