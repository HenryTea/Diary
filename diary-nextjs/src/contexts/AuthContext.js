'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { secureStorage } from '../utils/security';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ipCheckRequired, setIpCheckRequired] = useState(false);

  // Check cookie-based authentication
  const checkCookieAuth = async () => {
    try {
      // Check authentication cookie
      const authResponse = await fetch('/api/auth-check');
      const authData = await authResponse.json();
      
      console.log('Cookie auth check result:', authData);
      
      if (authData.requiresAuth) {
        setIpCheckRequired(true);
        // Clear any existing auth data for expired/invalid cookies
        setUser(null);
        setToken(null);
        secureStorage.removeUser();
        secureStorage.removeToken();
        setLoading(false);
        return;
      }
      
      // If cookie is valid, use the data from cookie or fall back to localStorage
      if (authData.isAuthenticated && authData.user) {
        setUser(authData.user);
        setToken(authData.user.token || null);
        setIpCheckRequired(false);
      } else {
        // Fall back to secure storage if cookie doesn't have full user data
        const storedUser = secureStorage.getUser();
        const storedToken = secureStorage.getToken();
        
        if (storedUser && storedToken) {
          setUser(storedUser);
          setToken(storedToken);
          setIpCheckRequired(false);
        } else {
          setIpCheckRequired(true);
        }
      }
      
    } catch (error) {
      console.error('Error checking cookie auth:', error);
      // On error, require authentication to be safe
      setIpCheckRequired(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check cookie-based authentication on mount
    checkCookieAuth();
  }, []);

  const login = async (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setIpCheckRequired(false);
    
    try {
      // Use secure storage instead of localStorage
      secureStorage.setUser(userData);
      secureStorage.setToken(authToken);
      
      // Set authentication cookie
      await fetch('/api/auth-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'set_auth_cookie', 
          user: userData, 
          token: authToken 
        })
      });
      
    } catch (error) {
      console.error('Error storing auth or setting cookie:', error);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    try {
      // Clear secure storage
      secureStorage.removeUser();
      secureStorage.removeToken();
      
      // Clear authentication cookie
      await fetch('/api/auth-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_auth_cookie' })
      });
      
    } catch (error) {
      console.error('Error clearing auth or cookie:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !ipCheckRequired,
    requiresAuth: ipCheckRequired || !user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
