import { useEffect } from 'react';

export default function useKeyboardShortcuts({ onKeep, onRemove, onUndo, onTogglePlay, enabled = true }) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          onKeep?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onRemove?.();
          break;
        case 'z':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onUndo?.();
          }
          break;
        case ' ':
          e.preventDefault();
          onTogglePlay?.();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onKeep, onRemove, onUndo, onTogglePlay, enabled]);
}
