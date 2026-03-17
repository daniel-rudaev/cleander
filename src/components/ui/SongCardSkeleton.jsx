import React from 'react';

export default function SongCardSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto px-4">
      <div className="flex flex-col bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 animate-pulse">
        {/* Album art placeholder - fixed aspect ratio */}
        <div className="aspect-square bg-zinc-700/50" />
        {/* Song info placeholder */}
        <div className="p-6 pt-4 space-y-3">
          <div className="h-6 bg-zinc-700/50 rounded-lg w-3/4" />
          <div className="h-4 bg-zinc-700/30 rounded-lg w-1/2" />
          <div className="h-3 bg-zinc-700/20 rounded-lg w-2/3" />
          {/* Player placeholder */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-700/30 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-1.5 bg-zinc-700/30 rounded-full" />
                <div className="flex justify-between">
                  <div className="h-2 bg-zinc-700/20 rounded w-6" />
                  <div className="h-2 bg-zinc-700/20 rounded w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
