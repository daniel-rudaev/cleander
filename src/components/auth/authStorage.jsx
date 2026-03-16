// Pure localStorage abstraction layer
// This is the ONLY module that directly accesses auth-related localStorage

const KEYS = {
  ACCESS_TOKEN: 'spotify_access_token',
  REFRESH_TOKEN: 'spotify_refresh_token',
  USER: 'spotify_user',
  AUTH_STATE: 'spotify_auth_state',
  CODE_VERIFIER: 'spotify_code_verifier'
};

export const authStorage = {
  // Token management
  getAccessToken: () => localStorage.getItem(KEYS.ACCESS_TOKEN),

  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem(KEYS.ACCESS_TOKEN, token);
    } else {
      localStorage.removeItem(KEYS.ACCESS_TOKEN);
    }
  },

  getRefreshToken: () => localStorage.getItem(KEYS.REFRESH_TOKEN),

  setRefreshToken: (token) => {
    if (token) {
      localStorage.setItem(KEYS.REFRESH_TOKEN, token);
    } else {
      localStorage.removeItem(KEYS.REFRESH_TOKEN);
    }
  },

  // User data management
  getUser: () => {
    const user = localStorage.getItem(KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.USER);
    }
  },

  // OAuth flow temporary storage
  getAuthState: () => localStorage.getItem(KEYS.AUTH_STATE),

  setAuthState: (state) => {
    if (state) {
      localStorage.setItem(KEYS.AUTH_STATE, state);
    } else {
      localStorage.removeItem(KEYS.AUTH_STATE);
    }
  },

  getCodeVerifier: () => localStorage.getItem(KEYS.CODE_VERIFIER),

  setCodeVerifier: (verifier) => {
    if (verifier) {
      localStorage.setItem(KEYS.CODE_VERIFIER, verifier);
    } else {
      localStorage.removeItem(KEYS.CODE_VERIFIER);
    }
  },

  // Batch operations
  setTokens: (accessToken, refreshToken) => {
    authStorage.setAccessToken(accessToken);
    if (refreshToken) {
      authStorage.setRefreshToken(refreshToken);
    }
  },

  // Complete auth data check
  hasAuthData: () => {
    return !!(authStorage.getAccessToken() && authStorage.getUser());
  },

  // Clear all auth data
  clearAll: () => {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.AUTH_STATE);
    localStorage.removeItem(KEYS.CODE_VERIFIER);
  }
};