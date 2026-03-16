import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from './authService';
import { authStorage } from './authStorage';
import { spotifyApi } from './spotifyApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: true
  });

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check for OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = authStorage.getAuthState();

      if (code && state === storedState) {
        // Handle OAuth callback
        console.log('[AuthProvider] Processing OAuth callback');

        const tokens = await authService.exchangeCodeForToken(code);
        authStorage.setTokens(tokens.accessToken, tokens.refreshToken);

        const user = await spotifyApi.getUser(tokens.accessToken, null);
        authStorage.setUser(user);

        setState({
          isAuthenticated: true,
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          loading: false
        });

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('[AuthProvider] OAuth login successful');
      } else {
        // Check for existing tokens
        const accessToken = authStorage.getAccessToken();
        const refreshToken = authStorage.getRefreshToken();
        const user = authStorage.getUser();

        if (accessToken && user) {
          console.log('[AuthProvider] Restoring session from storage');
          setState({
            isAuthenticated: true,
            user,
            accessToken,
            refreshToken,
            loading: false
          });
        } else {
          console.log('[AuthProvider] No existing session');
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    } catch (error) {
      console.error('[AuthProvider] Initialization error:', error);
      authService.clearAuth();
      setState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false
      });
    }
  };

  const handleTokenRefresh = async () => {
    try {
      console.log('[AuthProvider] Refreshing access token');
      const tokens = await authService.refreshAccessToken();

      authStorage.setTokens(tokens.accessToken, tokens.refreshToken);

      setState((prev) => ({
        ...prev,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }));

      return tokens.accessToken;
    } catch (error) {
      console.error('[AuthProvider] Token refresh failed:', error);
      // Token refresh failed, logout
      await logout();
      throw error;
    }
  };

  const login = async () => {
    console.log('[AuthProvider] Initiating login');
    await authService.initiatePKCEFlow();
  };

  const logout = async () => {
    console.log('[AuthProvider] Logging out');
    authService.clearAuth();

    setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false
    });

    console.log('[AuthProvider] Logout complete');
  };

  // API wrapper methods with token refresh built-in
  const api = {
    getUser: () => spotifyApi.getUser(state.accessToken, handleTokenRefresh),
    getLikedSongs: (limit, offset) => spotifyApi.getLikedSongs(state.accessToken, handleTokenRefresh, limit, offset),
    removeLikedTrack: (trackId) => spotifyApi.removeLikedTrack(state.accessToken, handleTokenRefresh, trackId),
    addLikedTrack: (trackId) => spotifyApi.addLikedTrack(state.accessToken, handleTokenRefresh, trackId),
    getUserPlaylists: () => spotifyApi.getUserPlaylists(state.accessToken, handleTokenRefresh),
    getPlaylistTracks: (playlistId) => spotifyApi.getPlaylistTracks(state.accessToken, handleTokenRefresh, playlistId),
    addTrackToPlaylist: (playlistId, trackUri) => spotifyApi.addTrackToPlaylist(state.accessToken, handleTokenRefresh, playlistId, trackUri),
    removeTrackFromPlaylist: (playlistId, trackUri) => spotifyApi.removeTrackFromPlaylist(state.accessToken, handleTokenRefresh, playlistId, trackUri)
  };

  const value = {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    loading: state.loading,
    login,
    logout,
    api
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>);

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}