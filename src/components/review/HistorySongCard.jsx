import React from 'react';
import { motion } from 'framer-motion';
import { Music, Heart, X, Star, Upload, Trash2, Calendar, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

function ActionBadge({ action }) {
  if (action === 'kept')
  return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400"><Heart size={13} /></div>;
  if (action === 'saved')
  return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400"><Star size={13} fill="currentColor" /></div>;
  return <div className="w-7 h-7 rounded-full flex items-center justify-center bg-rose-500/20 text-rose-400"><X size={13} /></div>;
}

function MetaTag({ children, colorClass = 'text-zinc-500' }) {
  return <span className={`text-[10px] ${colorClass}`}>{children}</span>;
}

function PopularityBar({ value, id }) {
  if (value == null) return null;
  // colour based on score
  const color = value >= 70 ? 'bg-emerald-400' : value >= 40 ? 'bg-yellow-400' : 'bg-zinc-600';
  return (
    <div className="flex items-center gap-1">
      <Zap size={10} className="text-zinc-500 flex-shrink-0" />
      <div className="w-12 h-1 rounded-full bg-zinc-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] text-zinc-500">{value}</span>
    </div>);

}

function formatDuration(ms) {
  if (!ms) return null;
  const m = Math.floor(ms / 60000);
  const s = Math.floor(ms % 60000 / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDecision(ms) {
  if (!ms || ms <= 0) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {return format(parseISO(dateStr), 'MMM yyyy');} catch {return null;}
}

export default function HistorySongCard({ song, index, onRestore, onDelete, id }) {
  const releaseYear = song.release_date ? song.release_date.slice(0, 4) : null;
  const likedDate = song.added_at ? formatDate(song.added_at) : null;
  const duration = formatDuration(song.duration_ms);
  const decisionTime = formatDecision(song.decision_duration_ms);

  return (
    <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(index * 0.025, 0.4) }}
    className="flex items-center gap-3 py-3 px-3 rounded-xl bg-zinc-900/60 border border-zinc-800/50">

      {/* Album Art */}
      <div className="w-11 h-11 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
        {song.cover_url ?
        <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" /> :
        <div className="w-full h-full flex items-center justify-center"><Music size={18} className="text-zinc-600" /></div>
        }
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-medium text-white text-sm truncate">{song.title}</h3>
          {song.explicit &&
          <span className="flex-shrink-0 text-[9px] font-bold text-zinc-500 border border-zinc-600 rounded px-0.5 leading-tight">E</span>
          }
        </div>
        <p className="text-xs text-zinc-400 truncate mb-1">{song.artist}</p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {releaseYear && <MetaTag>{releaseYear}</MetaTag>}
          {duration && <MetaTag>· {duration}</MetaTag>}
          {likedDate &&
          <div className="flex items-center gap-0.5">
              <Calendar size={9} className="text-zinc-600" />
              <MetaTag>{likedDate}</MetaTag>
            </div>
          }
          {decisionTime &&
          <div className="flex items-center gap-0.5">
              <Clock size={9} className="text-zinc-600" />
              <MetaTag>{decisionTime}</MetaTag>
            </div>
          }
          {song.action === 'saved' && song.playlistName &&
          <MetaTag colorClass="text-blue-400">→ {song.playlistName}</MetaTag>
          }
        </div>

        {/* Popularity bar */}
        {song.popularity != null &&
        <div className="mt-1">
            <PopularityBar value={song.popularity} />
          </div>
        }
      </div>

      {/* Right side */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <ActionBadge action={song.action} />
        <div className="flex gap-0.5">
          {song.action !== 'saved' &&
          <Button
          size="icon"
          variant="ghost"
          onClick={() => onRestore(song)}
          className="h-7 w-7 text-zinc-600 hover:text-amber-400 hover:bg-amber-400/10"
          title="Restore to review queue">

              <Upload size={13} />
            </Button>
          }
          <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(song)}
          className="h-7 w-7 text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10"
          title="Remove from history">

            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </motion.div>);

}