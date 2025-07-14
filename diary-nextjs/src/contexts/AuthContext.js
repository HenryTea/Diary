'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { secureStorage } from '../utils/security';
import { authManager } from '../utils/authManager';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ipCheckRequired, setIpCheckRequired] = useState(false);
  const mountedRef = useRef(true);

  // Debounced auth check using the auth manager
  const checkCookieAuth = useCallback(async (forceRefresh = false) => {
    if (!mountedRef.current) return;

    try {
      setIpCheckRequired(true);
      
      console.log('🔍 Auth: Starting debounced check...');
      const authData = await authManager.checkAuth(forceRefresh);
      
      if (!mountedRef.current) return; // Component unmounted during async operation
      
      console.log('📊 Auth cache stats:', authManager.getCacheStats());
      
      // Only allow access if explicitly authenticated with valid cookie
      if (authData.isAuthenticated && authData.user && !authData.requiresAuth) {
        setUser(authData.user);
        setIpCheckRequired(false);
        secureStorage.setUser(authData.user);
        console.log('✅ Auth: Valid authentication found');
      } else {
        console.log('🚫 Auth: Invalid/missing authentication');
        setUser(null);
        setIpCheckRequired(true);
        secureStorage.removeUser();
      }
      
    } catch (error) {
      console.error('❌ Auth: Error during check:', error);
      if (mountedRef.current) {
        setUser(null);
        setIpCheckRequired(true);
        secureStorage.removeUser();
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Single auth check on mount with debouncing
    checkCookieAuth();
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, [checkCookieAuth]);

  const login = async (userData) => {
    setUser(userData);
    setIpCheckRequired(false);
    
    try {
      secureStorage.setUser(userData);
      // Clear auth cache since user state changed
      authManager.clearCache();
      console.log('🔄 Auth: Cache cleared after login');
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  const logout = async () => {
    console.log('🚪 Auth: Starting logout process...');
    
    try {
      setLoading(true);
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      secureStorage.removeUser();
      authManager.clearCache(); // Clear auth cache on logout
      
      setUser(null);
      setIpCheckRequired(true);
      
      console.log('✅ Auth: Logout completed, cache cleared');
      
    } catch (error) {
      console.error('❌ Auth: Error during logout:', error);
      
      // Still clear local state even if server call fails
      secureStorage.removeUser();
      authManager.clearCache();
      setUser(null);
      setIpCheckRequired(true);
    } finally {
      setLoading(false);
    }
  };

  // Force refresh auth check (bypasses cache)
  const refreshAuth = useCallback(() => {
    console.log('🔄 Auth: Force refresh requested');
    return checkCookieAuth(true);
  }, [checkCookieAuth]);

  const value = {
    user,
    loading,
    login,
    logout,
    refreshAuth, // New method to force refresh
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
