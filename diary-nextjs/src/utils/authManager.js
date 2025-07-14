// Enhanced authentication hook with debouncing and caching
'use client';
import { useCallback, useRef, useState } from 'react';

class AuthManager {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.lastCheck = 0;
    this.CACHE_DURATION = 30000; // 30 seconds cache
    this.DEBOUNCE_DELAY = 200; // 200ms debounce
    this.REQUEST_COOLDOWN = 1000; // 1 second between requests
  }

  // Debounced auth check with caching
  async checkAuth(forceRefresh = false) {
    const now = Date.now();
    const cacheKey = 'auth_status';

    // Check cache first (unless force refresh)
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < this.CACHE_DURATION) {
        console.log('🎯 Auth: Using cached result');
        return cached.data;
      }
    }

    // Prevent rapid-fire requests
    if (now - this.lastCheck < this.REQUEST_COOLDOWN) {
      console.log('⏱️ Auth: Request too soon, using cache or waiting...');
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
    }

    // Check if there's already a pending request
    if (this.pendingRequests.has(cacheKey)) {
      console.log('🔄 Auth: Request already pending, waiting for result...');
      return this.pendingRequests.get(cacheKey);
    }

    // Create new request
    const authPromise = this.performAuthCheck();
    this.pendingRequests.set(cacheKey, authPromise);
    this.lastCheck = now;

    try {
      const result = await authPromise;
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: now
      });

      console.log('✅ Auth: New check completed and cached');
      return result;

    } catch (error) {
      console.error('❌ Auth: Check failed:', error);
      throw error;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);
    }
  }

  async performAuthCheck() {
    const response = await fetch('/api/auth-check', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Auth check failed: ${response.status}`);
    }

    return response.json();
  }

  // Clear cache when user logs out
  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache stats for debugging
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      lastCheck: this.lastCheck
    };
  }
}

// Singleton instance
const authManager = new AuthManager();

export { authManager };
