// Spotify API client - receives token as dependency
// No direct localStorage access, pure API calls

export const spotifyApi = {
  // Fetch with automatic token refresh
  async fetchWithAuth(url, accessToken, onTokenRefresh, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`
      }
    });

    // Token expired, trigger refresh
    if (response.status === 401 && onTokenRefresh) {
      const newToken = await onTokenRefresh();

      // Retry with new token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`
        }
      });

      return retryResponse;
    }

    return response;
  },

  // Get current user profile
  async getUser(accessToken, onTokenRefresh) {
    const response = await spotifyApi.fetchWithAuth(
      'https://api.spotify.com/v1/me',
      accessToken,
      onTokenRefresh
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    return response.json();
  },

  // Get liked songs with pagination
  async getLikedSongs(accessToken, onTokenRefresh, limit = 50, offset = 0) {
    const response = await spotifyApi.fetchWithAuth(
      `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
      accessToken,
      onTokenRefresh
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch liked songs: ${response.status}`);
    }

    return response.json();
  },

  // Remove track from liked songs
  async removeLikedTrack(accessToken, onTokenRefresh, trackId) {
    const response = await spotifyApi.fetchWithAuth(
      'https://api.spotify.com/v1/me/tracks',
      accessToken,
      onTokenRefresh,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [trackId] })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove track: ${response.status}`);
    }

    return response;
  },

  // Add track to liked songs
  async addLikedTrack(accessToken, onTokenRefresh, trackId) {
    const response = await spotifyApi.fetchWithAuth(
      'https://api.spotify.com/v1/me/tracks',
      accessToken,
      onTokenRefresh,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [trackId] })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add track: ${response.status}`);
    }

    return response;
  },

  // Get user's playlists
  async getUserPlaylists(accessToken, onTokenRefresh) {
    const allPlaylists = [];
    let url = 'https://api.spotify.com/v1/me/playlists?limit=50';

    while (url) {
      const response = await spotifyApi.fetchWithAuth(url, accessToken, onTokenRefresh);

      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.status}`);
      }

      const data = await response.json();
      allPlaylists.push(...data.items);
      url = data.next;
    }

    return allPlaylists;
  },

  // Get playlist tracks (just IDs for caching)
  async getPlaylistTracks(accessToken, onTokenRefresh, playlistId) {
    const allTracks = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(id)),next`;

    while (url) {
      const response = await spotifyApi.fetchWithAuth(url, accessToken, onTokenRefresh);

      if (!response.ok) {
        throw new Error(`Failed to fetch playlist tracks: ${response.status}`);
      }

      const data = await response.json();
      const trackIds = data.items.
      map((item) => item.track?.id).
      filter(Boolean);
      allTracks.push(...trackIds);
      url = data.next;
    }

    return allTracks;
  },

  // Add track to playlist
  async addTrackToPlaylist(accessToken, onTokenRefresh, playlistId, trackUri) {
    const response = await spotifyApi.fetchWithAuth(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      accessToken,
      onTokenRefresh,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [trackUri] })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add track to playlist: ${response.status}`);
    }

    return response.json();
  },

  // Remove track from playlist
  async removeTrackFromPlaylist(accessToken, onTokenRefresh, playlistId, trackUri) {
    const response = await spotifyApi.fetchWithAuth(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      accessToken,
      onTokenRefresh,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks: [{ uri: trackUri }] })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove track from playlist: ${response.status}`);
    }

    return response;
  }
};