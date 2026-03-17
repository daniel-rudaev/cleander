import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useSpotifyPlayer } from '@/components/spotify/SpotifyPlayerProvider';

export default function SpotifyPlayer({ trackUri, previewUrl, isActive, trackId }) {
  const { play, pause, togglePlayPause, isPlaying, position, duration, seek, isPremium, isReady } = useSpotifyPlayer();
  const [hasStarted, setHasStarted] = useState(false);
  const [localPlaying, setLocalPlaying] = useState(false);
  const progressRef = useRef(null);
  const lastTrackRef = useRef(null);

  // Auto-stop when card is no longer active
  useEffect(() => {
    if (!isActive && localPlaying) {
      pause();
      setLocalPlaying(false);
    }
  }, [isActive]);

  // Reset when track changes
  useEffect(() => {
    if (trackId !== lastTrackRef.current) {
      lastTrackRef.current = trackId;
      setHasStarted(false);
      setLocalPlaying(false);
    }
  }, [trackId]);

  const handlePlayPause = async (e) => {
    e.stopPropagation();

    if (!hasStarted) {
      const result = await play(trackUri, previewUrl);
      if (result.success) {
        setHasStarted(true);
        setLocalPlaying(true);
      }
    } else {
      togglePlayPause();
      setLocalPlaying(!localPlaying);
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(percent * duration);
  };

  const formatTime = (ms) => {
    if (!ms || ms <= 0) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const playing = hasStarted && isPlaying;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-3">
        <button
          onClick={handlePlayPause}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
        >
          {playing ? (
            <Pause size={18} className="text-white" fill="white" />
          ) : (
            <Play size={18} className="text-white ml-0.5" fill="white" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Progress bar */}
          <div
            ref={progressRef}
            onClick={handleSeek}
            className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer group"
          >
            <div
              className="h-full bg-emerald-400 rounded-full transition-all relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Time */}
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-zinc-500">{formatTime(position)}</span>
            <span className="text-[10px] text-zinc-500">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {!previewUrl && !(isPremium && isReady) && !playing && !hasStarted && (
        <p className="text-[10px] text-zinc-600 text-center">Preview not available</p>
      )}
    </div>
  );
}
