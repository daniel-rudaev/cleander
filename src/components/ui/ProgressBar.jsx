import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressBar({ reviewed, total, id }) {
  const percentage = total > 0 ? Math.round(reviewed / total * 100) : 0;
  const remaining = Math.max(0, total - reviewed);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-zinc-400">
          {remaining} remaining
        </span>
        <span className="text-zinc-400">
          {reviewed} reviewed
        </span>
      </div>
      
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }} />

      </div>
      
      <div className="text-center">
        <span className="text-2xl font-bold text-white">{percentage}%</span>
        <span className="text-sm text-zinc-500 ml-2">complete</span>
      </div>
    </div>);

}