import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);
  const [token, setTokenState] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    } else {
      setAuthToken(null);
    }

    setLoading(false);
  }, [token]);

  const persistAuth = (nextToken, nextUser) => {
    setTokenState(nextToken);
    setUser(nextUser);
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setAuthToken(nextToken);
  };

  const clearAuth = () => {
    setTokenState(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
  };

  const register = async (payload) => {
    try {
      const response = await authAPI.register(payload);
      persistAuth(response.data.token, response.data.user);
      return { success: true, user: response.data.user };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed'
      };
    }
  };

  const login = async (payload) => {
    try {
      const response = await authAPI.login(payload);
      persistAuth(response.data.token, response.data.user);
      return { success: true, user: response.data.user };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    clearAuth();
  };

  const refreshProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return { success: true, user: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to load profile'
      };
    }
  };

  const updateProfile = async (payload) => {
    try {
      const response = await authAPI.updateProfile(payload);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return { success: true, user: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Profile update failed'
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    refreshProfile,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
