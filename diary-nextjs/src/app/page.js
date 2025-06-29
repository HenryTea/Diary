'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import NewEntryButton from '../components/NewEntryButton';

export default function Home() {
  const { loading, requiresAuth, token, user } = useAuth();
  const router = useRouter();

  // Immediate redirect check - don't wait for auth loading
  useEffect(() => {
    // Check if we have any auth indicators immediately
    const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('token'));
    const hasUser = user || (typeof window !== 'undefined' && localStorage.getItem('user'));
    
    // If no immediate auth indicators and not currently loading, redirect immediately
    if (!hasToken && !hasUser && !loading) {
      console.log('No authentication found, redirecting to login immediately');
      router.replace('/login');
      return;
    }
    
    // Also redirect if auth loading completed and requires auth
    if (!loading && requiresAuth) {
      console.log('Authentication required, redirecting to login');
      router.replace('/login');
      return;
    }
  }, [token, user, loading, requiresAuth, router]);

  // Show immediate redirect if no auth indicators
  const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('token'));
  const hasUser = user || (typeof window !== 'undefined' && localStorage.getItem('user'));
  
  if (!hasToken && !hasUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>Redirecting to login...</div>
      </div>
    );
  }

  // Show loading screen while checking authentication or if authentication required
  if (loading || requiresAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>
          {loading ? 'Checking access...' : 'Redirecting to login...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />
      <Header />
      <MainContent />
      <NewEntryButton />
    </div>
  );
}
