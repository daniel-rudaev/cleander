import React from 'react';

export default function SongCardSkeleton() {
  return (
    <div className="h-full w-full max-w-sm mx-auto flex flex-col bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 animate-pulse">
      {/* Album art placeholder */}
      <div className="flex-1 min-h-0 bg-zinc-700/50" />
      {/* Song info placeholder */}
      <div className="p-6 pt-4 space-y-3">
        <div className="h-6 bg-zinc-700/50 rounded-lg w-3/4" />
        <div className="h-4 bg-zinc-700/30 rounded-lg w-1/2" />
        <div className="h-3 bg-zinc-700/20 rounded-lg w-2/3" />
        {/* Player placeholder */}
        <div className="pt-2 space-y-2">
          <div className="h-1 bg-zinc-700/30 rounded-full" />
          <div className="flex justify-between">
            <div className="h-3 bg-zinc-700/20 rounded w-8" />
            <div className="h-8 w-8 bg-zinc-700/30 rounded-full" />
            <div className="h-3 bg-zinc-700/20 rounded w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
