import React from 'react';
import { Heart, X, Star, Clock, TrendingUp } from 'lucide-react';

function StatPill({ icon, label, count, total, colorClass, bgClass, borderClass, id }) {
  const pct = total > 0 ? Math.round(count / total * 100) : 0;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${bgClass} ${borderClass}`}>
      <span className={colorClass}>{icon}</span>
      <div>
        <div className={`text-sm font-semibold ${colorClass}`}>{count}</div>
        <div className="text-xs text-zinc-500">{label} · {pct}%</div>
      </div>
    </div>);

}

export default function ReviewStatsDisplay({ history, id }) {
  const total = history.length;
  const kept = history.filter((s) => s.action === 'kept').length;
  const removed = history.filter((s) => s.action === 'removed').length;
  const saved = history.filter((s) => s.action === 'saved').length;

  // Average decision time (only for entries that have it)
  const withDuration = history.filter((s) => s.decision_duration_ms > 0);
  const avgMs = withDuration.length > 0 ?
  withDuration.reduce((sum, s) => sum + s.decision_duration_ms, 0) / withDuration.length :
  null;
  const avgSec = avgMs ? (avgMs / 1000).toFixed(1) : null;

  if (total === 0) return null;

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center gap-1.5 mb-3">
        <TrendingUp size={14} className="text-zinc-400" />
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your stats</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <StatPill
        icon={<Heart size={14} />}
        label="kept"
        count={kept}
        total={total}
        colorClass="text-emerald-400"
        bgClass="bg-emerald-500/10"
        borderClass="border-emerald-500/20" />

        <StatPill
        icon={<X size={14} />}
        label="removed"
        count={removed}
        total={total}
        colorClass="text-rose-400"
        bgClass="bg-rose-500/10"
        borderClass="border-rose-500/20" />

        <StatPill
        icon={<Star size={14} fill="currentColor" />}
        label="starred"
        count={saved}
        total={total}
        colorClass="text-blue-400"
        bgClass="bg-blue-500/10"
        borderClass="border-blue-500/20" />

        {avgSec &&
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-zinc-800/50 border-zinc-700/50">
            <Clock size={14} className="text-zinc-400" />
            <div>
              <div className="text-sm font-semibold text-zinc-300">{avgSec}s</div>
              <div className="text-xs text-zinc-500">avg/song</div>
            </div>
          </div>
        }
      </div>
    </div>);

}