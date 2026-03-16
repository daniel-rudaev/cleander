import React from 'react';
import { Music, CheckCircle2, Loader2 } from 'lucide-react';

export default function EmptyState({ type }) {
  if (type === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-zinc-400">Loading songs...</p>
      </div>);

  }

  if (type === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">All Done!</h3>
        <p className="text-zinc-400">You've reviewed all your songs</p>
      </div>);

  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
        <Music size={40} className="text-zinc-600" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No Songs Yet</h3>
      <p className="text-zinc-400">Connect your Spotify account to start</p>
    </div>);

}