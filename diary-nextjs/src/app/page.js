'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import NewEntryButton from '../components/NewEntryButton';

export default function Home() {
  const { loading, requiresAuth, token, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Ensure component is mounted before checking client-side auth
  useEffect(() => {
    setMounted(true);
  }, []);

  // Immediate redirect check - only after component is mounted
  useEffect(() => {
    if (!mounted) return;
    
    // Check if we have any auth indicators immediately
    const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('token'));
    const hasUser = user || (typeof window !== 'undefined' && localStorage.getItem('user'));
    
    // If no immediate auth indicators and not currently loading, redirect immediately
    if (!hasToken && !hasUser && !loading) {
      console.log('No authentication found, redirecting to login immediately');
      setShouldRedirect(true);
      router.replace('/login');
      return;
    }
    
    // Also redirect if auth loading completed and requires auth
    if (!loading && requiresAuth) {
      console.log('Authentication required, redirecting to login');
      setShouldRedirect(true);
      router.replace('/login');
      return;
    }
  }, [mounted, token, user, loading, requiresAuth, router]);

  // Show consistent loading until mounted and auth is determined
  if (!mounted || loading || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>
          Checking access...
        </div>
      </div>
    );
  }

  // After mounting, check if we still need to redirect (additional safety check)
  const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('token'));
  const hasUser = user || (typeof window !== 'undefined' && localStorage.getItem('user'));
  
  if (!hasToken && !hasUser) {
    // This should rarely be hit due to the useEffect above, but provides safety
    router.replace('/login');
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>Checking access...</div>
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
