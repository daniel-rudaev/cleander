# Cleander

Swipe through your Spotify liked songs. Keep what you love, remove the rest.

**[Try it live](https://daniel-rudaev.github.io/cleander/)**

## What is this?

Cleander is a Tinder-style interface for your Spotify library. Connect your account, and it presents your liked songs one at a time as swipeable cards. Swipe right to keep, left to remove, or star to save to a playlist.

## Features

- Swipe cards to keep or remove songs from your library
- Star songs to add them to playlists (tap for default, long-press to choose)
- Audio playback (Spotify Premium uses full playback, free uses preview clips)
- Review history with filtering and sorting
- Keyboard shortcuts (arrow keys, space for play/pause, Cmd+Z to undo)
- Session time tracking with ETA
- Backup and restore your progress
- Milestone celebrations at 10, 50, 100, 250, 500, 1000 songs
- Works entirely in your browser — no server, no data collection

## Privacy

All data stays in your browser's localStorage. No analytics, no tracking, no server-side storage. Authentication uses Spotify's standard PKCE OAuth flow. Tokens never leave your browser.

## Tech Stack

- React 18 + Vite
- Tailwind CSS + shadcn/ui components
- Framer Motion for animations
- Spotify Web API + Web Playback SDK
- Deployed on GitHub Pages

## Development

```bash
npm install
npm run dev
```

You'll need a Spotify app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) with the appropriate redirect URI.

## License

MIT
