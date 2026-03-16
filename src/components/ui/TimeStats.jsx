import React, { useState, useEffect } from 'react';
import { Clock, Timer } from 'lucide-react';
import { songStorage } from '../storage/songStorage';

export default function TimeStats({ reviewedCount, totalCount }) {
  // Dummy state to trigger re-render every second
  const [, setTick] = useState(0);

  useEffect(() => {
    // Update UI every second
    const interval = setInterval(() => {
      setTick((t) => t + 1);

      // Checkpoint session every 5 seconds to save progress
      const now = Date.now();
      if (Math.floor(now / 1000) % 5 === 0) {
        songStorage.checkpointSession();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get current total time (reads directly from localStorage)
  const totalTimeMs = songStorage.getTotalTimeMs();

  // Calculate average and estimate remaining
  const avgTimePerSong = reviewedCount > 0 ? totalTimeMs / reviewedCount : 10000;
  const remaining = totalCount - reviewedCount;
  const estimatedRemainingMs = remaining * avgTimePerSong;

  return (
    <div className="flex items-center gap-4 text-xs text-zinc-500">
      <div className="flex items-center gap-1.5">
        <Clock size={14} />
        <span>{formatTime(totalTimeMs)}</span>
      </div>
      
      {remaining > 0 && reviewedCount > 0 &&
      <div className="flex items-center gap-1.5">
          <Timer size={14} />
          <span>{formatTime(estimatedRemainingMs)} left</span>
        </div>
      }
    </div>);

}