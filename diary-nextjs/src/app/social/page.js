'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { stripHtmlTags } from '../../utils/editorUtils';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';

export default function SocialPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentDialogs, setCommentDialogs] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const { token, isAuthenticated, loading: authLoading, requiresAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if authentication is required
    if (!authLoading && requiresAuth) {
      router.replace('/login');
    }
  }, [requiresAuth, authLoading, router]);

  const fetchSocialEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/social');
      if (!res.ok) throw new Error('Failed to fetch social entries');
      const data = await res.json();
      setEntries(data);
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
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          entryId,
          comment: comment.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update comments in state
        setComments(prev => ({
          ...prev,
          [entryId]: [...(prev[entryId] || []), data.comment]
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
    if (isAuthenticated && token) {
      fetchSocialEntries();
    }
  }, [isAuthenticated, token]);

  // Show loading screen while checking authentication or if authentication required
  if (authLoading || requiresAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>
          {authLoading ? 'Checking access...' : 'Redirecting to login...'}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        <Header />
        <div className="pt-24 px-8 mx-auto min-h-screen flex items-center justify-center transition-colors duration-300" 
             style={{ backgroundColor: 'var(--bg-primary)', maxWidth: 'none', width: '100%' }}>
          <div style={{ color: 'var(--text-primary)' }}>Loading social feed...</div>
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
          <h2 className="text-2xl font-semibold transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
            Social Feed
          </h2>
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
                              {comment.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="font-medium text-sm transition-colors duration-300" 
                                  style={{ color: 'var(--text-primary)' }}>
                              {comment.username}
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
