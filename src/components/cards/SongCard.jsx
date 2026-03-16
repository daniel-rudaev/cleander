import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Music, ListMusic } from 'lucide-react';
import SwipeIndicator from '../ui/SwipeIndicator';
import SpotifyPlayer from '../player/SpotifyPlayer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
'@/components/ui/popover';

const SongCard = React.memo(function SongCard({ song, onSwipe, isTop, onButtonSwipe, playlistNames = [] }) {
  const [exitDirection, setExitDirection] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const indicatorOpacity = useTransform(x, [-100, -50, 0, 50, 100], [1, 0.5, 0, 0.5, 1]);

  // Handle button-triggered swipes
  React.useEffect(() => {
    if (!onButtonSwipe || !isTop) return;

    const handleButtonSwipe = (direction) => {
      const targetX = direction === 'right' ? 500 : -500;
      setSwipeDirection(direction);
      setExitDirection(direction);
      animate(x, targetX, { duration: 0.4 });
      setTimeout(() => {
        onSwipe(direction === 'right' ? 'kept' : 'removed');
      }, 400);
    };

    onButtonSwipe.current = handleButtonSwipe;
  }, [onSwipe, x, isTop, onButtonSwipe]);

  const handleDrag = (_, info) => {
    if (info.offset.x > 30) {
      setSwipeDirection('right');
    } else if (info.offset.x < -30) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleDragEnd = (_, info) => {
    const threshold = 100;

    if (info.offset.x > threshold) {
      setExitDirection('right');
      animate(x, 500, { duration: 0.3 });
      setTimeout(() => onSwipe('kept'), 300);
    } else if (info.offset.x < -threshold) {
      setExitDirection('left');
      animate(x, -500, { duration: 0.3 });
      setTimeout(() => onSwipe('removed'), 300);
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
      setSwipeDirection(null);
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return '--:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor(ms % 60000 / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
    className="absolute inset-0 pt-4 touch-none"
    style={{
      x,
      rotate,
      opacity,
      zIndex: isTop ? 10 : 5,
      pointerEvents: isTop ? 'auto' : 'none'
    }}
    drag={isTop ? "x" : false}
    dragConstraints={{ left: 0, right: 0 }}
    dragElastic={0.9}
    onDrag={handleDrag}
    onDragEnd={handleDragEnd}
    initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
    animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}>

      <div className="h-full flex items-start justify-center">
        <div className="h-full w-full max-w-sm flex flex-col bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
          
          <SwipeIndicator
          direction={swipeDirection}
          opacity={indicatorOpacity.get()} />

          
          {/* Album Art */}
          <div className="relative flex-1 min-h-0 bg-zinc-800">
            {song.cover_url ?
            <img
            src={song.cover_url}
            alt={song.album || song.title}
            className="absolute inset-0 w-full h-full object-cover" /> :


            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                <Music size={80} className="text-zinc-600" />
              </div>
            }
            
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          </div>
          
          {/* Song Info */}
          <div className="p-6 pt-4 flex-shrink-0">
            <div className="flex items-start gap-2 mb-1">
              <h2 className="text-xl font-bold text-white truncate flex-1">
                {song.title}
              </h2>
              {playlistNames.length > 0 &&
              <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <ListMusic size={14} className="text-emerald-400" />
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="left" className="bg-zinc-800 border-zinc-700 text-white max-w-xs w-auto">
                    <p className="font-semibold mb-1 text-xs">In playlists:</p>
                    <ul className="text-xs space-y-0.5">
                      {playlistNames.map((name, idx) =>
                    <li key={idx} className="text-zinc-300">• {name}</li>
                    )}
                    </ul>
                  </PopoverContent>
                </Popover>
              }
            </div>
            <p className="text-zinc-400 truncate mb-1">
              {song.artist}
            </p>
            {song.album &&
            <p className="text-sm text-zinc-500 truncate">
                {song.album}
              </p>
            }
            
            {/* Audio Player */}
            <SpotifyPlayer
            trackUri={song.spotify_uri}
            previewUrl={song.preview_url}
            isActive={isTop}
            trackId={song.spotify_id} />

          </div>
        </div>
      </div>
    </motion.div>);

});

export default SongCard;