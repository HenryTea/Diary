'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { secureStorage } from '../utils/security';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ipCheckRequired, setIpCheckRequired] = useState(false);

  // Check cookie-based authentication
  const checkCookieAuth = async () => {
    try {
      // Always start by requiring auth until proven otherwise
      setIpCheckRequired(true);
      
      // Check authentication cookie
      const authResponse = await fetch('/api/auth-check');
      const authData = await authResponse.json();
      
      console.log('Cookie auth check result:', authData);
      
      // Only allow access if explicitly authenticated with valid cookie
      if (authData.isAuthenticated && authData.user && !authData.requiresAuth) {
        setUser(authData.user);
        setIpCheckRequired(false);
        // Store user data locally for faster access
        secureStorage.setUser(authData.user);
        console.log('Valid authentication found, user logged in');
      } else {
        // Force login for any invalid/missing authentication
        console.log('Invalid or missing authentication, forcing login');
        setUser(null);
        setIpCheckRequired(true);
        secureStorage.removeUser();
      }
      
    } catch (error) {
      console.error('Error checking cookie auth:', error);
      // On any error, force authentication
      console.log('Auth check error, forcing login');
      setUser(null);
      setIpCheckRequired(true);
      secureStorage.removeUser();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check cookie-based authentication on mount
    checkCookieAuth();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    setIpCheckRequired(false);
    
    try {
      // Use secure storage for faster access
      secureStorage.setUser(userData);
      
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  const logout = async () => {
    console.log('AuthContext: Starting logout process...');
    
    try {
      setLoading(true);
      
      // Clear authentication cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Clear secure storage
      secureStorage.removeUser();
      
      // Clear state
      setUser(null);
      setIpCheckRequired(true);
      
      console.log('AuthContext: Logout completed successfully');
      
    } catch (error) {
      console.error('AuthContext: Error during logout:', error);
      
      // Still clear local state even if server call fails
      secureStorage.removeUser();
      setUser(null);
      setIpCheckRequired(true);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
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
