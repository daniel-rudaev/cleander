import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/auth/AuthContext';
import { songStorage } from '@/components/storage/songStorage';
import { toast } from 'sonner';

import ReviewStatsDisplay from '@/components/review/ReviewStatsDisplay';
import ReviewFilterSort from '@/components/review/ReviewFilterSort';
import HistorySongCard from '@/components/review/HistorySongCard';

// ─── sorting/filtering utils ──────────────────────────────────────────────────
function applyFilter(history, actionFilter) {
  if (actionFilter === 'all') return history;
  return history.filter((s) => s.action === actionFilter);
}

function applySort(list, sortOrder) {
  const copy = [...list];
  switch (sortOrder) {
    case 'reviewed-asc':return copy.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    case 'title-asc':return copy.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    case 'artist-asc':return copy.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
    case 'liked-desc':return copy.sort((a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0));
    case 'liked-asc':return copy.sort((a, b) => new Date(a.added_at || 0) - new Date(b.added_at || 0));
    case 'popularity-desc':return copy.sort((a, b) => (b.popularity ?? -1) - (a.popularity ?? -1));
    case 'release-desc':return copy.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
    case 'release-asc':return copy.sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
    case 'duration-asc':return copy.sort((a, b) => (a.duration_ms ?? 0) - (b.duration_ms ?? 0));
    case 'decision-asc':return copy.sort((a, b) => (a.decision_duration_ms ?? Infinity) - (b.decision_duration_ms ?? Infinity));
    case 'reviewed-desc':
    default:return copy.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Review() {
  const { api } = useAuth();
  const [history, setHistory] = useState([]);
  const [sortOrder, setSortOrder] = useState('reviewed-desc');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    setHistory(songStorage.getHistory());
  }, []);

  // derived display list
  const displayList = useMemo(
    () => applySort(applyFilter(history, actionFilter), sortOrder),
    [history, actionFilter, sortOrder]
  );

  const handleRestore = async (song) => {
    try {
      if (song.action === 'removed') {
        await api.addLikedTrack(song.spotify_id);
      }
      const data = songStorage.getData();
      // Strip history-only fields before re-queuing
      const { action, playlistName, timestamp, reviewTime, decision_duration_ms, ...songData } = song;
      data.songs.unshift({ ...songData, status: 'pending' });
      songStorage.saveData(data);
      songStorage.removeFromHistory(song.spotify_id);
      setHistory(songStorage.getHistory());
      toast.success(song.action === 'removed' ? 'Restored to Spotify & review queue' : 'Restored to review queue');
    } catch (error) {
      console.error('Failed to restore:', error);
      toast.error('Failed to restore song');
    }
  };

  const handleDelete = (song) => {
    songStorage.removeFromHistory(song.spotify_id);
    setHistory(songStorage.getHistory());
    toast.success('Removed from history');
  };

  // summary counts (always from raw history, not filtered)
  const keptCount = history.filter((s) => s.action === 'kept').length;
  const removedCount = history.filter((s) => s.action === 'removed').length;
  const savedCount = history.filter((s) => s.action === 'saved').length;

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="flex items-center gap-4 px-5 py-4">
          <Link to={createPageUrl('Home')} className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-lg">History</h1>
            <p className="text-xs text-zinc-500">{history.length} songs reviewed</p>
          </div>
        </div>

        {/* Quick badge counts */}
        <div className="flex gap-2 px-5 pb-3 flex-wrap">
          <button
          onClick={() => setActionFilter(actionFilter === 'kept' ? 'all' : 'kept')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${
          actionFilter === 'kept' ?
          'bg-emerald-500/25 border-emerald-500/50 text-emerald-300' :
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`
          }>

            <span>♥</span> {keptCount} kept
          </button>
          <button
          onClick={() => setActionFilter(actionFilter === 'removed' ? 'all' : 'removed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${
          actionFilter === 'removed' ?
          'bg-rose-500/25 border-rose-500/50 text-rose-300' :
          'bg-rose-500/10 border-rose-500/20 text-rose-400'}`
          }>

            <span>✕</span> {removedCount} removed
          </button>
          {savedCount > 0 &&
          <button
          onClick={() => setActionFilter(actionFilter === 'saved' ? 'all' : 'saved')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${
          actionFilter === 'saved' ?
          'bg-blue-500/25 border-blue-500/50 text-blue-300' :
          'bg-blue-500/10 border-blue-500/20 text-blue-400'}`
          }>

              ★ {savedCount} starred
            </button>
          }
        </div>

        {/* Stats */}
        <ReviewStatsDisplay history={history} />

        {/* Sort + Filter controls */}
        <ReviewFilterSort
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter} />

      </header>

      {/* Song list */}
      <main className="px-4 py-4 pb-20">
        {displayList.length === 0 ?
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <Music size={32} className="text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-sm">No songs in this category yet</p>
          </div> :

        <div className="space-y-2">
            {displayList.map((song, index) =>
          <HistorySongCard
          key={song.spotify_id}
          song={song}
          index={index}
          onRestore={handleRestore}
          onDelete={handleDelete} />

          )}
          </div>
        }
      </main>
    </div>);

}