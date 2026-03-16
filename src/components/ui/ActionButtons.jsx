import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Undo2, Star, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger } from
'@/components/ui/tooltip';

export default function ActionButtons({ onRemove, onKeep, onStar, onStarRelease, onUndo, onRefresh, canUndo, isStarredToDefault }) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex justify-center items-center gap-3 px-6 max-w-md mx-auto">
        {/* Undo - Far Left */}
        <motion.div whileHover={canUndo ? { scale: 1.1 } : {}} whileTap={canUndo ? { scale: 0.9 } : {}}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
              onClick={canUndo ? onUndo : undefined}
              disabled={!canUndo}
              size="lg"
              className={`w-12 h-12 rounded-full shadow-lg transition-all ${
              canUndo ?
              'bg-zinc-700 hover:bg-zinc-600' :
              'bg-zinc-800/50 opacity-50 cursor-not-allowed'}`
              }>

                <Undo2 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{canUndo ? 'Undo last action' : 'No action to undo'}</p>
            </TooltipContent>
          </Tooltip>
        </motion.div>

        {/* Dislike - Left of Center */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
              onClick={onRemove}
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-xl shadow-rose-500/30">

                <X size={28} strokeWidth={2.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove from library</p>
            </TooltipContent>
          </Tooltip>
        </motion.div>

        {/* Star - Center */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
              onMouseDown={onStar}
              onMouseUp={onStarRelease}
              onTouchStart={onStar}
              onTouchEnd={onStarRelease}
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-xl shadow-amber-500/40 text-white">

                {isStarredToDefault ? <Check size={28} strokeWidth={3} /> : <Star size={26} fill="currentColor" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isStarredToDefault ? 'Already starred' : 'Tap to star • Hold for playlists'}</p>
            </TooltipContent>
          </Tooltip>
        </motion.div>

        {/* Like - Right of Center */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
              onClick={onKeep}
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-xl shadow-emerald-500/30">

                <Heart size={28} strokeWidth={2.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Keep in library</p>
            </TooltipContent>
          </Tooltip>
        </motion.div>

        {/* Refresh - Far Right */}
        {onRefresh &&
        <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
              onClick={onRefresh}
              size="lg"
              className="w-12 h-12 rounded-full bg-zinc-700 hover:bg-zinc-600 shadow-lg">

                  <RotateCcw size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset progress</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        }
      </div>
    </TooltipProvider>);

}