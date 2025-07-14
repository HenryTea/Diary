'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import NewEntryButton from '../components/NewEntryButton';

export default function Home() {
  const { loading, requiresAuth, user } = useAuth();
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
    
    // Strict authentication check - no fallbacks to localStorage
    // Only allow access if user is properly authenticated via cookie
    if (!loading && (requiresAuth || !user)) {
      console.log('No valid authentication found, redirecting to login');
      setShouldRedirect(true);
      router.replace('/login');
      return;
    }
  }, [mounted, user, loading, requiresAuth, router]);

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

  // After mounting, strict authentication check
  const hasValidAuth = user && !requiresAuth;
  
  if (!hasValidAuth) {
    // Force redirect to login for any invalid authentication
    router.replace('/login');
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>Redirecting to login...</div>
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
