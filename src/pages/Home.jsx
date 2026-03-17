import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckSquare, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
'@/components/ui/alert-dialog';

import ProgressBar from '@/components/ui/ProgressBar';
import SongCard from '@/components/cards/SongCard';
import ActionButtons from '@/components/ui/ActionButtons';
import EmptyState from '@/components/ui/EmptyState';
import SpotifyAuth from '@/components/spotify/SpotifyAuth';

import { useAuth } from '@/components/auth/AuthContext';
import { songStorage } from '@/components/storage/songStorage';
import { SpotifyPlayerProvider } from '@/components/spotify/SpotifyPlayerProvider';
import TimeStats from '@/components/ui/TimeStats';
import SettingsDialog from '@/components/SettingsDialog';
import SongCardSkeleton from "@/components/ui/SongCardSkeleton";
import Onboarding from "@/components/ui/Onboarding";
import MilestoneToast from "@/components/ui/MilestoneToast";

const BATCH_SIZE = 20;
const BUFFER_SIZE = 15;
const SORT_KEY = 'review_sort_order';

// Track when current top-card was first shown
let cardShownAt = Date.now();

// Sort an array of songs by the given sort order.
// "liked-asc" = original Spotify liked order (index in array, oldest first — default)
// Songs are fetched oldest-first from Spotify already (offset 0 = oldest liked).
function applySorting(songs, order) {
  const pending = songs.filter((s) => s.status === 'pending');
  const rest = songs.filter((s) => s.status !== 'pending');

  const sorted = [...pending].sort((a, b) => {
    switch (order) {
      case 'liked-desc':
        // Reverse the natural order (newest first)
        return 0; // will be reversed below
      case 'title-asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'artist-asc':
        return (a.artist || '').localeCompare(b.artist || '');
      case 'liked-asc':
      default:
        return 0; // keep natural order
    }
  });

  if (order === 'liked-desc') {
    sorted.reverse();
  }

  return [...sorted, ...rest];
}

export default function Home() {
  const { isAuthenticated, user, loading: authLoading, api } = useAuth();
  const [songs, setSongs] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState(null);
  const [selectedPlaylists, setSelectedPlaylists] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [defaultStarPlaylist, setDefaultStarPlaylist] = useState(null);
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem(SORT_KEY) || 'liked-asc');
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("cleander_onboarded"));
  const buttonSwipeRef = React.useRef(null);
  const longPressTimeout = React.useRef(null);
  const isLongPress = React.useRef(false);

  const handleSortOrderChange = useCallback((newOrder) => {
    localStorage.setItem(SORT_KEY, newOrder);
    setSortOrder(newOrder);
    setSongs((prev) => applySorting(prev, newOrder));
    toast.success('Sort order updated');
  }, []);

  // Start session on mount
  useEffect(() => {
    if (isAuthenticated) {
      songStorage.startSession();
    }
  }, [isAuthenticated]);

  // Apply theme on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('app_theme') || 'dark';
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  // Load songs from localStorage on mount
  useEffect(() => {
    if (isAuthenticated) {
      const data = songStorage.getData();
      setSongs(applySorting(data.songs, sortOrder));
    }
  }, [isAuthenticated]);

  // Auto-fetch when buffer is low
  useEffect(() => {
    if (!isAuthenticated || isFetchingMore) return;

    const pendingSongs = songs.filter((s) => s.status === 'pending');
    const stats = songStorage.getStats();

    if (pendingSongs.length < BUFFER_SIZE && stats.needsMoreFetch) {
      fetchMoreSongs();
    }
  }, [songs, isFetchingMore, isAuthenticated]);

  const fetchMoreSongs = async () => {
    setIsFetchingMore(true);
    try {
      const data = songStorage.getData();
      const result = await api.getLikedSongs(BATCH_SIZE, data.nextOffset);

      const formattedSongs = result.items.map((item) => ({
        spotify_id: item.track.id,
        spotify_uri: item.track.uri,
        title: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(', '),
        album: item.track.album.name,
        cover_url: item.track.album.images[0]?.url,
        preview_url: item.track.preview_url,
        duration_ms: item.track.duration_ms,
        // enriched metadata
        added_at: item.added_at,
        release_date: item.track.album.release_date,
        explicit: item.track.explicit,
        popularity: item.track.popularity,
        status: 'pending',
        reviewed_at: null
      }));

      songStorage.addSongs(formattedSongs);
      songStorage.setNextOffset(data.nextOffset + BATCH_SIZE);
      songStorage.setTotalLikes(result.total);

      const updatedSongs = songStorage.getData().songs;
      setSongs(applySorting(updatedSongs, sortOrder));
    } catch (error) {
      console.error('[Home] Failed to fetch songs:', error);
      toast.error('Failed to load more songs');
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleSwipe = useCallback(async (status) => {
    const currentSong = songs.filter((s) => s.status === 'pending')[0];
    if (!currentSong) return;

    const decisionDurationMs = Date.now() - cardShownAt;
    cardShownAt = Date.now(); // reset for next card

    const isDryRun = localStorage.getItem('is_dry_run') === 'true';
    const removeFromPlaylistsSetting = localStorage.getItem('remove_from_playlists');
    const removeFromPlaylists = removeFromPlaylistsSetting === null ? true : removeFromPlaylistsSetting === 'true';
    setLastAction({ song: currentSong, previousStatus: currentSong.status });

    try {
      if (status === 'removed') {
        const playlistsWithTrack = songStorage.getPlaylistsForTrack(currentSong.spotify_id);
        const hasNotifiedBefore = localStorage.getItem('notified_playlist_removal') === 'true';

        if (removeFromPlaylists && playlistsWithTrack.length > 0 && !hasNotifiedBefore) {
          toast.info(`This song will also be removed from ${playlistsWithTrack.length} playlist${playlistsWithTrack.length > 1 ? 's' : ''}`, {
            duration: 4000
          });
          localStorage.setItem('notified_playlist_removal', 'true');
        }

        if (isDryRun) {
          toast.info(`[Dry Run] Would remove "${currentSong.title}"`);
        } else {
          await api.removeLikedTrack(currentSong.spotify_id);

          if (removeFromPlaylists && playlistsWithTrack.length > 0) {
            for (const playlist of playlistsWithTrack) {
              await api.removeTrackFromPlaylist(playlist.id, currentSong.spotify_uri);
              songStorage.removeTrackFromPlaylistCache(playlist.id, currentSong.spotify_id);
            }
          }

          toast.success('Removed from Spotify');
        }
        songStorage.addToHistory(currentSong, 'removed', null, decisionDurationMs);
        songStorage.deleteSong(currentSong.spotify_id);
      } else if (status === 'kept') {
        toast.success('Kept in library');
        songStorage.addToHistory(currentSong, 'kept', null, decisionDurationMs);
        songStorage.deleteSong(currentSong.spotify_id);
      }

      setSongs(applySorting(songStorage.getData().songs, sortOrder));
    } catch (error) {
      console.error('Failed to process song:', error);
      toast.error(status === 'removed' ? 'Failed to remove from Spotify' : 'Failed to process song');
    }
  }, [songs, sortOrder]);

  const handleStarPress = useCallback(() => {
    isLongPress.current = false;
    longPressTimeout.current = setTimeout(() => {
      isLongPress.current = true;
      openManagePlaylistsDialog();
    }, 500);
  }, [songs]);

  const handleStarRelease = useCallback(async () => {
    clearTimeout(longPressTimeout.current);

    if (!isLongPress.current) {
      await handleQuickStar();
    }
    isLongPress.current = false;
  }, [songs, defaultStarPlaylist]);

  const handleQuickStar = async () => {
    const currentSong = songs.filter((s) => s.status === 'pending')[0];
    if (!currentSong) return;

    const playlists = songStorage.getPlaylists();
    if (playlists.length === 0) {
      toast.error('No playlists found. Please wait for playlists to load.');
      return;
    }

    if (!defaultStarPlaylist) {
      setDialogMode('setDefault');
      setSelectedPlaylists([]);
      setShowPlaylistDialog(true);
      return;
    }

    const isInDefault = songStorage.isTrackInPlaylist(defaultStarPlaylist.id, currentSong.spotify_id);

    if (isInDefault) {
      openManagePlaylistsDialog();
      return;
    }

    const isDryRun = localStorage.getItem('is_dry_run') === 'true';
    const decisionDurationMs = Date.now() - cardShownAt;
    cardShownAt = Date.now();
    setLastAction({ song: currentSong, previousStatus: currentSong.status });

    try {
      if (isDryRun) {
        toast.info(`[Dry Run] Would add "${currentSong.title}" to ${defaultStarPlaylist.name}`);
      } else {
        await api.addTrackToPlaylist(defaultStarPlaylist.id, currentSong.spotify_uri);
        toast.success(`Added to ${defaultStarPlaylist.name}`);
      }
      songStorage.addTrackToPlaylistCache(defaultStarPlaylist.id, currentSong.spotify_id);
      songStorage.addToHistory(currentSong, 'saved', defaultStarPlaylist.name, decisionDurationMs);
      songStorage.deleteSong(currentSong.spotify_id);
      setSongs(applySorting(songStorage.getData().songs, sortOrder));
    } catch (error) {
      console.error('Failed to save to playlist:', error);
      toast.error('Failed to add to playlist');
    }
  };

  const openManagePlaylistsDialog = () => {
    const currentSong = songs.filter((s) => s.status === 'pending')[0];
    if (!currentSong) return;

    const playlists = songStorage.getPlaylists();
    if (playlists.length === 0) {
      toast.error('No playlists found. Please wait for playlists to load.');
      return;
    }

    const playlistsWithTrack = songStorage.getPlaylistsForTrack(currentSong.spotify_id);
    const initiallySelected = playlistsWithTrack.map((p) => p.id);

    setSelectedPlaylists(initiallySelected);
    setDialogMode('manage');
    setShowPlaylistDialog(true);
  };

  const handleSaveToPlaylist = useCallback(async () => {
    if (dialogMode === 'setDefault') {
      if (selectedPlaylists.length !== 1) {
        toast.error('Please select one playlist');
        return;
      }
      const playlistId = selectedPlaylists[0];
      const playlists = songStorage.getPlaylists();
      const playlist = playlists.find((p) => p.id === playlistId);
      if (playlist) {
        localStorage.setItem('spotify_default_star_playlist', playlistId);
        setDefaultStarPlaylist(playlist);

        const currentSong = songs.filter((s) => s.status === 'pending')[0];
        if (currentSong) {
          const isDryRun = localStorage.getItem('is_dry_run') === 'true';
          const decisionDurationMs = Date.now() - cardShownAt;
          cardShownAt = Date.now();
          setLastAction({ song: currentSong, previousStatus: currentSong.status });

          try {
            if (isDryRun) {
              toast.info(`[Dry Run] Would add "${currentSong.title}" to ${playlist.name}`);
            } else {
              await api.addTrackToPlaylist(playlist.id, currentSong.spotify_uri);
              toast.success(`Added to ${playlist.name}`);
            }
            songStorage.addTrackToPlaylistCache(playlist.id, currentSong.spotify_id);
            songStorage.addToHistory(currentSong, 'saved', playlist.name, decisionDurationMs);
            songStorage.deleteSong(currentSong.spotify_id);
            setSongs(applySorting(songStorage.getData().songs, sortOrder));
          } catch (error) {
            console.error('Failed to add to playlist:', error);
            toast.error('Failed to add to playlist');
          }
        }
      }
      setShowPlaylistDialog(false);
      setSelectedPlaylists([]);
      return;
    }

    const currentSong = songs.filter((s) => s.status === 'pending')[0];
    if (!currentSong) return;

    const isDryRun = localStorage.getItem('is_dry_run') === 'true';
    const allPlaylists = songStorage.getPlaylists();
    const currentPlaylistsWithTrack = songStorage.getPlaylistsForTrack(currentSong.spotify_id).map((p) => p.id);

    const playlistsToAdd = selectedPlaylists.filter((id) => !currentPlaylistsWithTrack.includes(id));
    const playlistsToRemove = currentPlaylistsWithTrack.filter((id) => !selectedPlaylists.includes(id));

    if (playlistsToAdd.length === 0 && playlistsToRemove.length === 0) {
      setShowPlaylistDialog(false);
      return;
    }

    setLastAction({ song: currentSong, previousStatus: currentSong.status });

    try {
      for (const playlistId of playlistsToAdd) {
        const playlistName = allPlaylists.find((p) => p.id === playlistId)?.name;
        if (isDryRun) {
          toast.info(`[Dry Run] Would add "${currentSong.title}" to ${playlistName}`);
        } else {
          await api.addTrackToPlaylist(playlistId, currentSong.spotify_uri);
          toast.success(`Added to ${playlistName}`);
        }
        songStorage.addTrackToPlaylistCache(playlistId, currentSong.spotify_id);
      }

      for (const playlistId of playlistsToRemove) {
        const playlistName = allPlaylists.find((p) => p.id === playlistId)?.name;
        if (isDryRun) {
          toast.info(`[Dry Run] Would remove "${currentSong.title}" from ${playlistName}`);
        } else {
          await api.removeTrackFromPlaylist(playlistId, currentSong.spotify_uri);
          toast.success(`Removed from ${playlistName}`);
        }
        songStorage.removeTrackFromPlaylistCache(playlistId, currentSong.spotify_id);
      }

      if (playlistsToAdd.length > 0) {
        const firstPlaylistName = allPlaylists.find((p) => p.id === playlistsToAdd[0])?.name;
        const decisionDurationMs = Date.now() - cardShownAt;
        cardShownAt = Date.now();
        songStorage.addToHistory(currentSong, 'saved', firstPlaylistName, decisionDurationMs);
      }

      songStorage.deleteSong(currentSong.spotify_id);
      setSongs(applySorting(songStorage.getData().songs, sortOrder));
      setShowPlaylistDialog(false);
      setSelectedPlaylists([]);

    } catch (error) {
      console.error('Failed to update playlists:', error);
      toast.error('Failed to update playlists');
    }
  }, [songs, selectedPlaylists, dialogMode, sortOrder]);

  const handleUndo = useCallback(async () => {
    if (!lastAction) return;

    const song = lastAction.song;
    const isDryRun = localStorage.getItem('is_dry_run') === 'true';

    try {
      if (lastAction.previousStatus === 'pending') {
        const data = songStorage.getData();
        data.songs.unshift({ ...song, status: 'pending' });
        songStorage.saveData(data);

        const history = songStorage.getHistory();
        const historyEntry = history.find((h) => h.spotify_id === song.spotify_id);

        if (historyEntry?.action === 'removed') {
          if (isDryRun) {
            toast.info(`[Dry Run] Would restore "${song.title}"`);
          } else {
            await api.addLikedTrack(song.spotify_id);
            toast.success('Action undone');
          }
        } else {
          toast.success('Action undone');
        }

        songStorage.removeFromHistory(song.spotify_id);
        setSongs(applySorting(songStorage.getData().songs, sortOrder));
      }
    } catch (error) {
      console.error('Failed to undo:', error);
      toast.error('Failed to undo action');
    }

    setLastAction(null);
  }, [lastAction, sortOrder]);

  // Initialize data when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      initializeData();
    }
  }, [isAuthenticated, authLoading]);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      const currentData = songStorage.getData();

      if (currentData.totalSpotifyLikes === 0) {
        try {
          const data = await api.getLikedSongs(1, 0);
          songStorage.setTotalLikes(data.total);
        } catch (error) {
          console.error('Failed to fetch library count:', error);
        }
      }

      const cachedPlaylists = songStorage.getPlaylists();
      if (cachedPlaylists.length === 0) {
        await fetchAndCachePlaylists();
      }

      const saved = localStorage.getItem('spotify_default_star_playlist');
      if (saved) {
        const playlists = songStorage.getPlaylists();
        const playlist = playlists.find((p) => p.id === saved);
        if (playlist) {
          setDefaultStarPlaylist(playlist);
        }
      }

      setSongs(applySorting(currentData.songs, sortOrder));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAndCachePlaylists = async () => {
    try {
      const currentUser = user || (await api.getUser());
      const allPlaylists = await api.getUserPlaylists();

      const ownedPlaylists = allPlaylists.filter((p) => p.owner.id === currentUser.id);

      const playlistsWithTracks = await Promise.all(
        ownedPlaylists.map(async (playlist) => {
          try {
            const trackIds = await api.getPlaylistTracks(playlist.id);
            return {
              id: playlist.id,
              name: playlist.name,
              trackIds
            };
          } catch (error) {
            console.error(`Failed to fetch tracks for playlist ${playlist.name}:`, error);
            return null;
          }
        })
      );

      const validPlaylists = playlistsWithTracks.filter(Boolean);
      songStorage.savePlaylists(validPlaylists);
    } catch (error) {
      console.error('Failed to cache playlists:', error);
    }
  };

  const handleRefresh = async () => {
    const data = songStorage.getData();
    const totalLikes = data.totalSpotifyLikes;

    songStorage.clear();
    songStorage.clearHistory();
    songStorage.clearSession();
    songStorage.setTotalLikes(totalLikes);
    songStorage.setNextOffset(0);

    setSongs([]);
    setLastAction(null);

    toast.success('Reset complete');

    if (totalLikes > 0) {
      await fetchMoreSongs();
    }
  };

  const pendingSongs = songs.filter((s) => s.status === 'pending');
  const currentSong = pendingSongs[0];
  const nextSong = pendingSongs[1];

  const reviewedCount = songStorage.getHistory().length;

  if (authLoading || isLoading) {
    return (
      <div className="fixed inset-0 h-dvh bg-black text-white flex flex-col items-center justify-center">
        <SongCardSkeleton />
      </div>);

  }

  return (
    <SpotifyPlayerProvider isAuthenticated={isAuthenticated}>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      <MilestoneToast reviewedCount={reviewedCount} />
      <div className="fixed inset-0 h-dvh bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-5 gap-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 
                          flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0 relative">

            <Sparkles size={22} className="text-white" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-xl truncate bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Cleander
            </h1>
            <p className="text-xs text-zinc-500 truncate">Make your library sparkle ✨</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAuthenticated &&
            <>
              <Link to={createPageUrl('Review')}>
                <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-emerald-400 transition-colors"
                title="View History">

                  <CheckSquare size={20} />
                </Button>
              </Link>
              <SettingsDialog
              isOpen={isSettingsOpen}
              onOpenChange={setIsSettingsOpen}
              onSetDefaultPlaylist={setDefaultStarPlaylist}
              sortOrder={sortOrder}
              onSortOrderChange={handleSortOrderChange} />

            </>
            }
        </div>
      </header>

      {/* Spotify Auth */}
      {!isAuthenticated &&
        <div className="flex-shrink-0 px-6 pb-4">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white mb-1">Connect to Spotify</p>
              <p className="text-xs text-zinc-400">Start tidying your music library</p>
            </div>
            <SpotifyAuth />
          </div>
        </div>
        }

      {/* Progress */}
      {isAuthenticated &&
        <div className="flex-shrink-0 px-6 py-4 space-y-3 bg-gradient-to-b from-zinc-900/50 to-transparent">
          <ProgressBar
          reviewed={songStorage.getHistory().length}
          total={songStorage.getData().totalSpotifyLikes} />

          <div className="flex justify-center">
            <TimeStats
            reviewedCount={songStorage.getHistory().length}
            totalCount={songStorage.getData().totalSpotifyLikes} />

          </div>
        </div>
        }

      {/* Main Content */}
      <main className="flex-1 min-h-0 px-4 py-4">
        {!isAuthenticated || songs.length === 0 && songStorage.getHistory().length === 0 ?
          <div className="h-full flex items-center justify-center">
            <EmptyState type="empty" />
          </div> :
          pendingSongs.length === 0 && isFetchingMore ?
          <div className="h-full flex items-center justify-center">
            <EmptyState type="loading" />
          </div> :
          pendingSongs.length === 0 ?
          <div className="h-full flex items-center justify-center">
            <EmptyState type="completed" />
          </div> :

          <div className="relative w-full max-w-sm mx-auto h-full overflow-hidden">
            <AnimatePresence mode="popLayout">
              {nextSong &&
              <SongCard
              key={nextSong.spotify_id}
              song={nextSong}
              onSwipe={() => {}}
              isTop={false} />

              }
              {currentSong &&
              <SongCard
              key={currentSong.spotify_id}
              song={currentSong}
              onSwipe={handleSwipe}
              isTop={true}
              onButtonSwipe={buttonSwipeRef}
              playlistNames={songStorage.getPlaylistsForTrack(currentSong.spotify_id).map((p) => p.name)} />

              }
            </AnimatePresence>
          </div>
          }
      </main>

      {/* Action Buttons */}
      {pendingSongs.length > 0 &&
        <div className="flex-shrink-0 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          <ActionButtons
          onRemove={() => buttonSwipeRef.current?.('left')}
          onKeep={() => buttonSwipeRef.current?.('right')}
          onStar={handleStarPress}
          onStarRelease={handleStarRelease}
          onUndo={handleUndo}
          onRefresh={songs.length > 0 || songStorage.getHistory().length > 0 ? () => {
            if (window.confirm('Reset all progress and history?')) {
              handleRefresh();
            }
          } : null}
          canUndo={!!lastAction}
          isStarredToDefault={currentSong && defaultStarPlaylist ? songStorage.isTrackInPlaylist(defaultStarPlaylist.id, currentSong.spotify_id) : false} />

        </div>
        }

      {/* Playlist Selection Dialog */}
      <AlertDialog open={showPlaylistDialog} onOpenChange={setShowPlaylistDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {dialogMode === 'setDefault' ? 'Select Default Playlist' : 'Manage Playlists'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {dialogMode === 'setDefault' ?
                'Choose one playlist as your default. Tap star to quick add, long press for more options.' :
                'Select which playlists should contain this song'
                }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-3 max-h-96 overflow-y-auto">
            {songStorage.getPlaylists().map((playlist) => {
                const isSelected = selectedPlaylists.includes(playlist.id);
                return (
                  <motion.div
                  key={playlist.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  dialogMode === 'setDefault' ?
                  isSelected ?
                  'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50' :
                  'bg-zinc-800/50 border-2 border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800' :
                  isSelected ?
                  'bg-blue-500/20 border-2 border-blue-500/50' :
                  'bg-zinc-800/50 border-2 border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800'}`
                  }
                  onClick={() => {
                    if (dialogMode === 'setDefault') {
                      setSelectedPlaylists([playlist.id]);
                    } else {
                      if (isSelected) {
                        setSelectedPlaylists((prev) => prev.filter((id) => id !== playlist.id));
                      } else {
                        setSelectedPlaylists((prev) => [...prev, playlist.id]);
                      }
                    }
                  }}>

                  {dialogMode === 'setDefault' ?
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ?
                    'border-emerald-500 bg-emerald-500' :
                    'border-zinc-600'}`
                    }>
                      {isSelected &&
                      <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-white" />

                      }
                    </div> :

                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected ?
                    'border-blue-500 bg-blue-500' :
                    'border-zinc-600'}`
                    }>
                      {isSelected &&
                      <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}>

                          <Check size={14} className="text-white" strokeWidth={3} />
                        </motion.div>
                      }
                    </div>
                    }
                  <span className="text-white text-sm font-medium flex-1">
                    {playlist.name}
                  </span>
                </motion.div>);

              })}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveToPlaylist}
              className="bg-blue-600 hover:bg-blue-700 text-white">

              {dialogMode === 'setDefault' ? 'Set as Default' : 'Update Playlists'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </SpotifyPlayerProvider>);

}