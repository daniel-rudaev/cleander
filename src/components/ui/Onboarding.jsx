import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Heart, X, Star, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: Music,
    iconColor: 'text-emerald-400',
    iconBg: 'from-emerald-400/20 to-teal-400/20',
    title: 'Your Spotify Library',
    description: 'Cleander loads your liked songs from Spotify and presents them one at a time as cards.',
  },
  {
    icon: Heart,
    iconColor: 'text-emerald-400',
    iconBg: 'from-emerald-400/20 to-emerald-400/20',
    title: 'Swipe Right to Keep',
    description: 'Swipe right or tap the green heart to keep a song in your library.',
    demo: 'right',
  },
  {
    icon: X,
    iconColor: 'text-rose-400',
    iconBg: 'from-rose-400/20 to-rose-400/20',
    title: 'Swipe Left to Remove',
    description: 'Swipe left or tap the red X to unlike the song and remove it from your library.',
    demo: 'left',
  },
  {
    icon: Star,
    iconColor: 'text-amber-400',
    iconBg: 'from-amber-400/20 to-orange-400/20',
    title: 'Star Your Favorites',
    description: 'Tap the star to save a song to a playlist. Long-press to choose which playlist.',
  },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-6"
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${current.iconBg} flex items-center justify-center`}>
                <Icon size={48} className={current.iconColor} />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">{current.title}</h2>
              <p className="text-zinc-400 leading-relaxed">{current.description}</p>
            </div>

            {/* Demo card animation */}
            {current.demo && (
              <div className="flex justify-center py-4">
                <motion.div
                  className="w-16 h-20 rounded-xl bg-zinc-800 border border-zinc-700 shadow-lg"
                  animate={{
                    x: current.demo === 'right' ? [0, 60, 0] : [0, -60, 0],
                    rotate: current.demo === 'right' ? [0, 8, 0] : [0, -8, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-emerald-400' : 'w-2 bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="ghost"
            onClick={() => {
              onComplete();
              localStorage.setItem('cleander_onboarded', 'true');
            }}
            className="text-zinc-500 hover:text-zinc-300"
          >
            Skip
          </Button>

          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep(step - 1)}
                className="text-zinc-400"
              >
                <ArrowLeft size={20} />
              </Button>
            )}
            <Button
              onClick={() => {
                if (step < steps.length - 1) {
                  setStep(step + 1);
                } else {
                  localStorage.setItem('cleander_onboarded', 'true');
                  onComplete();
                }
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6"
            >
              {step < steps.length - 1 ? (
                <>
                  Next <ArrowRight size={16} className="ml-1" />
                </>
              ) : (
                "Let's Go!"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
