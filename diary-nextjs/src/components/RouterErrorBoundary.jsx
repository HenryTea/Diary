'use client';
import React from 'react';

class RouterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Router Error Boundary caught an error:', error, errorInfo);
    
    // Check if it's a router-related error
    if (error.message?.includes('Router') || error.message?.includes('navigation')) {
      console.log('Router error detected, attempting recovery...');
      
      // Attempt to recover by redirecting to home or login
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const hasAuth = sessionStorage.getItem('diary_token') || sessionStorage.getItem('diary_user');
          window.location.href = hasAuth ? '/' : '/login';
        }
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="text-center p-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Navigation Error
            </h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Something went wrong with navigation. Redirecting...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouterErrorBoundary;
