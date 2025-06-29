'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { stripHtmlTags } from '../../utils/editorUtils';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';

export default function SocialPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false); // Changed from true to false for faster perceived loading
  const [error, setError] = useState(null);
  const [commentDialogs, setCommentDialogs] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const { token, isAuthenticated, loading: authLoading, requiresAuth, user } = useAuth();
  const router = useRouter();

  // Immediate redirect check - don't wait for auth loading
  useEffect(() => {
    // Check if we have any auth indicators immediately
    const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('token'));
    const hasUser = user || (typeof window !== 'undefined' && localStorage.getItem('user'));
    
    // If no immediate auth indicators and not currently loading, redirect immediately
    if (!hasToken && !hasUser && !authLoading) {
      console.log('No authentication found, redirecting to login immediately');
      router.replace('/login');
      return;
    }
    
    // Also redirect if auth loading completed and requires auth
    if (!authLoading && requiresAuth) {
      console.log('Authentication required, redirecting to login');
      router.replace('/login');
      return;
    }
  }, [token, user, authLoading, requiresAuth, router]);

  const fetchSocialEntries = async (useCache = true) => {
    setLoading(true);
    setError(null);
    try {
      const cacheHeader = useCache ? {} : { 'Cache-Control': 'no-cache' };
      const res = await fetch('/api/social?page=1&limit=20', {
        headers: {
          ...cacheHeader
        }
      });
      if (!res.ok) throw new Error('Failed to fetch social entries');
      const data = await res.json();
      setEntries(data.entries || data); // Support both old and new format
    } catch (err) {
      setError('Could not load social entries.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (entryId) => {
    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          entryId,
          action: 'toggle_like'
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update the entry's like count in the state
        setEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, likes_count: data.likes_count }
            : entry
        ));
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleShowComments = async (entryId) => {
    setCommentDialogs(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));

    // Fetch comments if not already loaded
    if (!comments[entryId]) {
      try {
        const res = await fetch(`/api/comments?entryId=${entryId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(prev => ({
            ...prev,
            [entryId]: data
          }));
        }
      } catch (error) {
        console.error('Comments fetch error:', error);
      }
    }
  };

  const handleAddComment = async (entryId) => {
    const comment = newComment[entryId];
    if (!comment?.trim()) return;

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if token exists
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers,
        credentials: 'include', // Important: include cookies for authentication
        body: JSON.stringify({
          entryId,
          comment: comment.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Comment API response:', data); // Debug log
        
        // The API returns the comment object directly, not wrapped in a 'comment' property
        const newCommentData = data.comment || data;
        
        // Ensure the comment has a username field
        if (!newCommentData.username) {
          console.warn('Comment missing username, using fallback');
          newCommentData.username = 'Unknown User';
        }
        
        // Update comments in state
        setComments(prev => ({
          ...prev,
          [entryId]: [...(prev[entryId] || []), newCommentData]
        }));
        // Update comment count
        setEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, comments_count: entry.comments_count + 1 }
            : entry
        ));
        // Clear input
        setNewComment(prev => ({
          ...prev,
          [entryId]: ''
        }));
      } else {
        const errorData = await res.json();
        console.error('Comment creation failed:', errorData);
        alert('Failed to add comment: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Comment add error:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  useEffect(() => {
    // Load entries immediately if we have a token, don't wait for full auth check
    if (token || (!authLoading && isAuthenticated)) {
      fetchSocialEntries();
    }
  }, [token, isAuthenticated, authLoading]);

  // Separate effect for auth redirects to avoid blocking data loading
  useEffect(() => {
    if (!authLoading && requiresAuth) {
      router.replace('/login');
    }
  }, [requiresAuth, authLoading, router]);

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

  // Show loading screen only while checking authentication
  if (authLoading || requiresAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>
          {authLoading ? 'Checking access...' : 'Redirecting to login...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        <Header />
        <div className="pt-24 px-8 mx-auto min-h-screen flex items-center justify-center transition-colors duration-300" 
             style={{ backgroundColor: 'var(--bg-primary)', maxWidth: 'none', width: '100%' }}>
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />
      <Header />
      <main className="pt-24 px-8 mx-auto min-h-screen transition-colors duration-300" 
            style={{ backgroundColor: 'var(--bg-primary)', maxWidth: 'none', width: '100%' }}>
      <div className="max-w-3xl mx-auto">
        <div className="sticky top-0 z-30 flex items-center justify-between mb-6 py-4 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
              Social Feed
            </h2>
            {loading && (
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading...
              </div>
            )}
          </div>
          <button
            onClick={() => fetchSocialEntries(false)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80 disabled:opacity-50"
            style={{ 
              backgroundColor: 'var(--new-button-bg)', 
              color: 'var(--new-button-text)' 
            }}
          >
            <Image 
              src="/icons8-refresh.svg" 
              alt="Refresh" 
              width={16}
              height={16}
              className="w-4 h-4"
              style={{ 
                filter: 'var(--icon-filter)' 
              }}
            />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {entries.length === 0 ? (
            <div className="text-center transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
              No shared entries yet.
            </div>
          ) : (
            entries.map(entry => (
              <div
                key={entry.id}
                className="rounded-lg p-6 transition-all duration-300"
                style={{ backgroundColor: 'var(--entries-bg)' }}
              >
                {/* User Info */}
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3"
                       style={{ backgroundColor: 'var(--new-button-bg)', color: 'var(--new-button-text)' }}>
                    {entry.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold transition-colors duration-300" 
                         style={{ color: 'var(--text-primary)' }}>
                      {entry.username}
                    </div>
                    <div className="text-sm transition-colors duration-300" 
                         style={{ color: 'var(--text-secondary)' }}>
                      {new Date(entry.date).toLocaleString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', weekday: 'short'
                      })}
                    </div>
                  </div>
                </div>

                {/* Entry Content */}
                <div className="mb-4 p-4 rounded transition-colors duration-300"
                     style={{ backgroundColor: 'var(--entries-text-bg)', color: 'var(--entries-text)' }}>
                  <div className="whitespace-pre-wrap">
                    {entry.is_rich_text ? stripHtmlTags(entry.text || '') : entry.text || 'Empty entry'}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleLike(entry.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-red-500">❤️</span>
                    <span className="text-sm transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
                      {entry.likes_count || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => handleShowComments(entry.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span>💬</span>
                    <span className="text-sm transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
                      {entry.comments_count || 0}
                    </span>
                  </button>
                </div>

                {/* Comments Section */}
                {commentDialogs[entry.id] && (
                  <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                    {/* Existing Comments */}
                    <div className="mb-4 max-h-60 overflow-y-auto">
                      {comments[entry.id]?.map(comment => (
                        <div key={comment.id} className="mb-3 p-3 rounded transition-colors duration-300"
                             style={{ backgroundColor: 'var(--bg-content)' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                 style={{ backgroundColor: 'var(--new-button-bg)', color: 'var(--new-button-text)' }}>
                              {(comment.username || 'Unknown')?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="font-medium text-sm transition-colors duration-300" 
                                  style={{ color: 'var(--text-primary)' }}>
                              {comment.username || 'Unknown User'}
                            </span>
                            <span className="text-xs transition-colors duration-300" 
                                  style={{ color: 'var(--text-secondary)' }}>
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm transition-colors duration-300" 
                               style={{ color: 'var(--text-primary)' }}>
                            {comment.comment_text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment[entry.id] || ''}
                        onChange={(e) => setNewComment(prev => ({
                          ...prev,
                          [entry.id]: e.target.value
                        }))}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 rounded border transition-colors duration-300"
                        style={{
                          backgroundColor: 'var(--bg-content)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(entry.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(entry.id)}
                        className="px-4 py-2 rounded text-white transition-colors duration-300 hover:opacity-80"
                        style={{ backgroundColor: 'var(--new-button-bg)', color: 'var(--new-button-text)' }}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      </main>
    </div>
  );
}
