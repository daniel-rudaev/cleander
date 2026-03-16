// Pure authentication logic - no React, no direct localStorage access
// All state and storage managed externally

import { authStorage } from './authStorage';

const SPOTIFY_CLIENT_ID = '45efbe29234a40aea5d48cd269ac1a03';
const REDIRECT_URI = window.location.origin;

export const SCOPES = [
'user-library-read',
'user-library-modify',
'user-read-email',
'user-read-private',
'playlist-modify-public',
'playlist-modify-private',
'streaming',
'user-read-playback-state',
'user-modify-playback-state'].
join(' ');

// Crypto utilities
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input))).
  replace(/=/g, '').
  replace(/\+/g, '-').
  replace(/\//g, '_');
};

export const authService = {
  // Initiate PKCE OAuth flow
  async initiatePKCEFlow() {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);
    const state = generateRandomString(16);

    authStorage.setCodeVerifier(codeVerifier);
    authStorage.setAuthState(state);

    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      state: state,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      show_dialog: 'false'
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  },

  // Exchange authorization code for tokens
  async exchangeCodeForToken(code) {
    const codeVerifier = authStorage.getCodeVerifier();

    if (!codeVerifier) {
      throw new Error('No code verifier found');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('No access token in response');
    }

    // Clean up temporary OAuth data
    authStorage.setCodeVerifier(null);
    authStorage.setAuthState(null);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresIn: data.expires_in
    };
  },

  // Refresh access token
  async refreshAccessToken() {
    const refreshToken = authStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('No access token in refresh response');
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in
    };
  },

  // Clear all authentication data
  clearAuth() {
    authStorage.clearAll();
  }
};