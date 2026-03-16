// Robust client-side song storage using localStorage

const STORAGE_KEY = 'spotify_songs_v2';
const HISTORY_KEY = 'spotify_history_v2';
const SESSION_KEY = 'spotify_session_v3';
const TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const USER_KEY = 'spotify_user';
const PLAYLISTS_KEY = 'spotify_playlists_cache';

export const songStorage = {
  // Get all song data
  getData: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {
        songs: [],
        nextOffset: 0,
        totalSpotifyLikes: 0,
        lastSync: null
      };
    } catch (error) {
      console.error('Failed to parse song data:', error);
      return { songs: [], nextOffset: 0, totalSpotifyLikes: 0, lastSync: null };
    }
  },

  // Save all song data
  saveData: (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save song data:', error);
    }
  },

  // ========== SESSION MANAGEMENT ==========
  // CRITICAL: session_start_time is ONLY set once per session
  // accumulated_time_ms stores all previous time
  // Total time = accumulated_time_ms + (now - session_start_time)

  getSession: () => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : {
        session_start_time: null,
        accumulated_time_ms: 0
      };
    } catch (error) {
      console.error('Failed to parse session:', error);
      return { session_start_time: null, accumulated_time_ms: 0 };
    }
  },

  // Start a new session (only called on app load)
  startSession: () => {
    const session = songStorage.getSession();
    if (!session.session_start_time) {
      session.session_start_time = Date.now();
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return session;
  },

  // Checkpoint: Save current total time and reset session start
  // This allows continuous counting while persisting progress
  checkpointSession: () => {
    const session = songStorage.getSession();
    if (!session.session_start_time) return;

    const currentSessionTime = Date.now() - session.session_start_time;
    const totalTime = session.accumulated_time_ms + currentSessionTime;

    // Save total and reset start time for next interval
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      session_start_time: Date.now(),
      accumulated_time_ms: totalTime
    }));
  },

  // Calculate current total time (without saving)
  getTotalTimeMs: () => {
    const session = songStorage.getSession();
    if (!session.session_start_time) return session.accumulated_time_ms;

    const currentSessionTime = Date.now() - session.session_start_time;
    return session.accumulated_time_ms + currentSessionTime;
  },

  // Clear session (start fresh)
  clearSession: () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      session_start_time: Date.now(),
      accumulated_time_ms: 0
    }));
  },

  // ========== HISTORY MANAGEMENT ==========

  // Get history data
  getHistory: () => {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to parse history data:', error);
      return [];
    }
  },

  // Save history
  saveHistory: (history) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  },

  // Add to history with optional decision duration
  addToHistory: (song, action, playlistName = null, decisionDurationMs = null) => {
    const history = songStorage.getHistory();
    const now = new Date().toISOString();
    history.unshift({
      ...song,
      action,
      playlistName,
      timestamp: now,
      reviewTime: Date.now(),
      decision_duration_ms: decisionDurationMs && decisionDurationMs > 0 ? Math.round(decisionDurationMs) : null
    });
    songStorage.saveHistory(history);
  },

  // Remove from history
  removeFromHistory: (spotifyId) => {
    const history = songStorage.getHistory();
    const updated = history.filter((s) => s.spotify_id !== spotifyId);
    songStorage.saveHistory(updated);
  },

  // Clear history
  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY);
  },

  // ========== SONG MANAGEMENT ==========

  // Delete song from active songs
  deleteSong: (spotifyId) => {
    const data = songStorage.getData();
    data.songs = data.songs.filter((s) => s.spotify_id !== spotifyId);
    songStorage.saveData(data);
  },

  // Add new songs (from Spotify fetch)
  addSongs: (newSongs) => {
    const data = songStorage.getData();
    const existingIds = new Set(data.songs.map((s) => s.spotify_id));
    const songsToAdd = newSongs.filter((s) => !existingIds.has(s.spotify_id));

    data.songs = [...data.songs, ...songsToAdd];
    songStorage.saveData(data);
    return songsToAdd.length;
  },

  // Update offset
  setNextOffset: (offset) => {
    const data = songStorage.getData();
    data.nextOffset = offset;
    songStorage.saveData(data);
  },

  // Set total likes count
  setTotalLikes: (total) => {
    const data = songStorage.getData();
    data.totalSpotifyLikes = total;
    songStorage.saveData(data);
  },

  // Mark sync time
  markSynced: () => {
    const data = songStorage.getData();
    data.lastSync = new Date().toISOString();
    songStorage.saveData(data);
  },

  // Clear all song data
  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // ========== PLAYLISTS CACHE ==========

  getPlaylists: () => {
    try {
      const data = localStorage.getItem(PLAYLISTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to parse playlists:', error);
      return [];
    }
  },

  savePlaylists: (playlists) => {
    try {
      localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    } catch (error) {
      console.error('Failed to save playlists:', error);
    }
  },

  // Check if track is in a specific playlist (by ID)
  isTrackInPlaylist: (playlistId, trackId) => {
    const playlists = songStorage.getPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    return playlist ? playlist.trackIds.includes(trackId) : false;
  },

  // Get all playlist names that contain this track
  getPlaylistsForTrack: (trackId) => {
    const playlists = songStorage.getPlaylists();
    return playlists.
    filter((p) => p.trackIds.includes(trackId)).
    map((p) => ({ id: p.id, name: p.name }));
  },

  // Add track to playlist cache
  addTrackToPlaylistCache: (playlistId, trackId) => {
    const playlists = songStorage.getPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist && !playlist.trackIds.includes(trackId)) {
      playlist.trackIds.push(trackId);
      songStorage.savePlaylists(playlists);
    }
  },

  // Remove track from playlist cache
  removeTrackFromPlaylistCache: (playlistId, trackId) => {
    const playlists = songStorage.getPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist) {
      playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
      songStorage.savePlaylists(playlists);
    }
  },

  clearPlaylists: () => {
    localStorage.removeItem(PLAYLISTS_KEY);
  },

  // Get stats
  getStats: () => {
    const data = songStorage.getData();
    const history = songStorage.getHistory();

    return {
      total: data.songs.length,
      pending: data.songs.filter((s) => s.status === 'pending').length,
      needsMoreFetch: data.nextOffset < data.totalSpotifyLikes,
      reviewedCount: history.length
    };
  },

  // ========== BACKUP/RESTORE ==========

  // Export all data for backup
  exportBackup: () => {
    // Checkpoint to save current session time before export
    songStorage.checkpointSession();

    return {
      songs: songStorage.getData(),
      history: songStorage.getHistory(),
      session: songStorage.getSession(),
      tokens: {
        access: localStorage.getItem(TOKEN_KEY),
        refresh: localStorage.getItem(REFRESH_TOKEN_KEY),
        user: localStorage.getItem(USER_KEY)
      },
      exportedAt: new Date().toISOString(),
      version: '3.0'
    };
  },

  // Import data from backup
  importBackup: (backup) => {
    try {
      // Validate backup structure
      if (!backup || !backup.version || !backup.songs || !backup.history) {
        throw new Error('Invalid backup format');
      }

      // Import songs
      if (backup.songs) {
        songStorage.saveData(backup.songs);
      }

      // Import history
      if (backup.history) {
        songStorage.saveHistory(backup.history);
      }

      // Import session (v3.0+)
      if (backup.session && backup.session.accumulated_time_ms !== undefined) {
        // CRITICAL: Start new session with accumulated time from backup
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          session_start_time: Date.now(), // New session starts NOW
          accumulated_time_ms: backup.session.accumulated_time_ms
        }));
      } else {
        // Legacy backup - start fresh
        songStorage.clearSession();
      }

      // Import tokens (optional)
      if (backup.tokens) {
        if (backup.tokens.access) localStorage.setItem(TOKEN_KEY, backup.tokens.access);
        if (backup.tokens.refresh) localStorage.setItem(REFRESH_TOKEN_KEY, backup.tokens.refresh);
        if (backup.tokens.user) localStorage.setItem(USER_KEY, backup.tokens.user);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};