import React from 'react';
import { Heart, X } from 'lucide-react';

export default function SwipeIndicator({ direction, opacity }) {
  if (!direction) return null;

  const isRight = direction === 'right';

  return (
    <div
      className="absolute top-6 z-20 px-4"
      style={{
        opacity: Math.min(1, opacity),
        [isRight ? 'left' : 'right']: '1rem',
      }}
    >
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-bold text-sm ${
          isRight
            ? 'border-emerald-400 text-emerald-400 bg-emerald-400/10'
            : 'border-rose-400 text-rose-400 bg-rose-400/10'
        }`}
      >
        {isRight ? (
          <>
            <Heart size={18} fill="currentColor" />
            KEEP
          </>
        ) : (
          <>
            REMOVE
            <X size={18} />
          </>
        )}
      </div>
    </div>
  );
}
