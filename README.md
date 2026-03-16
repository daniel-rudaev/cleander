# Cleander

A swipe-based Spotify liked songs reviewer. Tidy up your music library by swiping through your liked songs — keep, remove, or star them into playlists.

## Features

- Swipe through your Spotify liked songs
- **Keep** songs in your library
- **Remove** songs from Spotify
- **Star** songs into playlists (tap for default, long press to choose)
- Review history with filtering and sorting
- Dry run mode (preview changes without affecting Spotify)
- Backup and restore progress
- All data stored locally in your browser

## Tech Stack

- React + Vite
- Tailwind CSS
- Spotify Web API (PKCE OAuth — no backend needed)
- Framer Motion for swipe animations
- localStorage for all data persistence

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and connect your Spotify account.

## Spotify Setup

This app uses Spotify's PKCE OAuth flow. The Spotify app is pre-configured with client ID `45efbe29234a40aea5d48cd269ac1a03`. If you want to use your own:

1. Create an app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Add your redirect URI (e.g., `http://localhost:5173`)
3. Update the client ID in `src/components/auth/authService.jsx`

## License

MIT
