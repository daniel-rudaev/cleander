import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const SpotifyPlayerContext = createContext(null);

export function SpotifyPlayerProvider({ children, isAuthenticated }) {
  const [spotifyToken, setSpotifyToken] = useState(null);

  // Get token from localStorage
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('spotify_access_token');
      setSpotifyToken(token);
    } else {
      setSpotifyToken(null);
    }
  }, [isAuthenticated]);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    position: 0,
    duration: 0,
    volume: 1.0
  });

  // Fallback audio for preview URLs or non-premium users
  const fallbackAudioRef = useRef(null);
  const [fallbackState, setFallbackState] = useState({
    isPlaying: false,
    position: 0,
    duration: 0
  });

  // Load Spotify Web Playback SDK
  useEffect(() => {
    if (!isAuthenticated || !spotifyToken) {
      // Disconnect existing player if user logs out
      if (player) {
        player.disconnect();
        setPlayer(null);
        setIsReady(false);
        setCurrentTrack(null);
      }
      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.pause();
        fallbackAudioRef.current = null;
      }
      return;
    }

    // Check if SDK already loaded
    if (window.Spotify) {
      initializePlayer(spotifyToken);
      return;
    }

    // Load SDK script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      initializePlayer(spotifyToken);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.pause();
        fallbackAudioRef.current = null;
      }
    };
  }, [isAuthenticated, spotifyToken]);

  const initializePlayer = (token) => {
    const spotifyPlayer = new window.Spotify.Player({
      name: 'Spotify Library Cleaner',
      getOAuthToken: (cb) => {cb(token);},
      volume: 1.0
    });

    // Player ready
    spotifyPlayer.addListener('ready', ({ device_id }) => {
      console.log('[SpotifyPlayer] Ready with Device ID', device_id);
      setDeviceId(device_id);
      setIsReady(true);
    });

    // Player not ready
    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('[SpotifyPlayer] Device has gone offline', device_id);
      setIsReady(false);
    });

    // Player state changed
    spotifyPlayer.addListener('player_state_changed', (state) => {
      if (!state) return;

      setPlayerState({
        isPlaying: !state.paused,
        position: state.position,
        duration: state.duration,
        volume: state.volume
      });

      setCurrentTrack({
        id: state.track_window.current_track.id,
        uri: state.track_window.current_track.uri,
        name: state.track_window.current_track.name,
        artists: state.track_window.current_track.artists,
        album: state.track_window.current_track.album
      });
    });

    // Error handling
    spotifyPlayer.addListener('initialization_error', ({ message }) => {
      console.error('[SpotifyPlayer] Init error:', message);
    });

    spotifyPlayer.addListener('authentication_error', ({ message }) => {
      console.error('[SpotifyPlayer] Auth error:', message);
      setIsPremium(false);
    });

    spotifyPlayer.addListener('account_error', ({ message }) => {
      console.error('[SpotifyPlayer] Account error:', message);
      setIsPremium(false);
    });

    spotifyPlayer.addListener('playback_error', ({ message }) => {
      console.error('[SpotifyPlayer] Playback error:', message);
    });

    // Connect player
    spotifyPlayer.connect().then((success) => {
      if (success) {
        console.log('[SpotifyPlayer] Connected successfully');
        setIsPremium(true);
        setPlayer(spotifyPlayer);
      } else {
        console.log('[SpotifyPlayer] Connection failed');
        setIsPremium(false);
      }
    });
  };

  // Play track using Web Playback SDK (Premium only)
  const playTrackWithSDK = async (trackUri) => {
    if (!deviceId || !isPremium) return false;

    const token = spotifyToken;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [trackUri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return true;
    } catch (error) {
      console.error('[SpotifyPlayer] Failed to play track:', error);
      return false;
    }
  };

  // Fallback: Play preview URL
  const playPreviewURL = (previewUrl) => {
    if (!previewUrl) return false;

    // Stop any SDK playback
    if (player && playerState.isPlaying) {
      player.pause();
    }

    // Stop previous fallback audio
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.pause();
      fallbackAudioRef.current = null;
    }

    // Create new audio
    const audio = new Audio(previewUrl);
    fallbackAudioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setFallbackState((prev) => ({ ...prev, duration: audio.duration }));
    });

    audio.addEventListener('timeupdate', () => {
      setFallbackState((prev) => ({ ...prev, position: audio.currentTime * 1000 }));
    });

    audio.addEventListener('ended', () => {
      setFallbackState({ isPlaying: false, position: 0, duration: 0 });
    });

    audio.play().
    then(() => {
      setFallbackState((prev) => ({ ...prev, isPlaying: true }));
    }).
    catch((err) => {
      console.error('[SpotifyPlayer] Fallback play failed:', err);
    });

    return true;
  };

  // Unified play function
  const play = async (trackUri, previewUrl) => {
    // Try SDK first (Premium users)
    if (isPremium && isReady) {
      const success = await playTrackWithSDK(trackUri);
      if (success) return { method: 'sdk', success: true };
    }

    // Fallback to preview URL
    const success = playPreviewURL(previewUrl);
    if (success) return { method: 'preview', success: true };

    // No playback available
    return { method: 'none', success: false };
  };

  // Pause
  const pause = () => {
    if (player && playerState.isPlaying) {
      player.pause();
    }
    if (fallbackAudioRef.current && fallbackState.isPlaying) {
      fallbackAudioRef.current.pause();
      setFallbackState((prev) => ({ ...prev, isPlaying: false }));
    }
  };

  // Resume
  const resume = () => {
    if (player && currentTrack) {
      player.resume();
    }
    if (fallbackAudioRef.current && !fallbackState.isPlaying) {
      fallbackAudioRef.current.play();
      setFallbackState((prev) => ({ ...prev, isPlaying: true }));
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (player && currentTrack) {
      player.togglePlay();
    } else if (fallbackAudioRef.current) {
      if (fallbackState.isPlaying) {
        pause();
      } else {
        resume();
      }
    }
  };

  // Seek
  const seek = async (positionMs) => {
    if (player && currentTrack) {
      await player.seek(positionMs);
    } else if (fallbackAudioRef.current) {
      fallbackAudioRef.current.currentTime = positionMs / 1000;
    }
  };

  // Set volume
  const setVolume = async (volume) => {
    if (player) {
      await player.setVolume(volume);
    }
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.volume = volume;
    }
  };

  // Get current state
  const getCurrentState = () => {
    if (currentTrack) {
      return { ...playerState, currentTrack, method: 'sdk' };
    }
    if (fallbackAudioRef.current) {
      return { ...fallbackState, currentTrack: null, method: 'preview' };
    }
    return { isPlaying: false, position: 0, duration: 0, currentTrack: null, method: 'none' };
  };

  const value = {
    player,
    deviceId,
    isPremium,
    isReady,
    play,
    pause,
    resume,
    togglePlayPause,
    seek,
    setVolume,
    getCurrentState,
    currentTrack,
    isPlaying: currentTrack ? playerState.isPlaying : fallbackState.isPlaying,
    position: currentTrack ? playerState.position : fallbackState.position,
    duration: currentTrack ? playerState.duration : fallbackState.duration
  };

  return (
    <SpotifyPlayerContext.Provider value={value}>
      {children}
    </SpotifyPlayerContext.Provider>);

}

export function useSpotifyPlayer() {
  const context = useContext(SpotifyPlayerContext);
  if (!context) {
    throw new Error('useSpotifyPlayer must be used within SpotifyPlayerProvider');
  }
  return context;
}