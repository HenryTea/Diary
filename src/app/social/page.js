'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';

export default function SocialPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false); // Changed from true to false for faster perceived loading
  const [error, setError] = useState(null);
  const [commentDialogs, setCommentDialogs] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [mounted, setMounted] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [userLikes, setUserLikes] = useState(new Set()); // Track which entries the user has liked
  const [expandedEntries, setExpandedEntries] = useState(new Set()); // Track which entries are expanded
  const { token, isAuthenticated, loading: authLoading, requiresAuth, user } = useAuth();
  const router = useRouter();
  
  // Use ref to track loading state without causing dependency loops
  const loadingRef = useRef(false);

  // Ensure component is mounted before checking client-side auth
  useEffect(() => {
    setMounted(true);
    
    // Add global error handlers to catch unhandled rejections
    const handleUnhandledRejection = (event) => {
      console.error('Social: Unhandled promise rejection:', event.reason);
      // Prevent the error from bubbling up and causing the app to crash
      event.preventDefault();
    };

    const handleError = (event) => {
      console.error('Social: Global error:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Immediate redirect check - only after component is mounted
  useEffect(() => {
    if (!mounted) return;
    
    // Check if we have any auth indicators immediately
    const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('token'));
    const hasUser = user || (typeof window !== 'undefined' && localStorage.getItem('user'));
    
    // If no immediate auth indicators and not currently loading, redirect immediately
    if (!hasToken && !hasUser && !authLoading) {
      console.log('No authentication found, redirecting to login immediately');
      setShouldRedirect(true);
      router.replace('/login');
      return;
    }
    
    // Also redirect if auth loading completed and requires auth
    if (!authLoading && requiresAuth) {
      console.log('Authentication required, redirecting to login');
      setShouldRedirect(true);
      router.replace('/login');
      return;
    }
  }, [mounted, token, user, authLoading, requiresAuth, router]);

  // Function definitions that are used in hooks - moved before useEffect to fix initialization order
  const fetchSocialEntries = useCallback(async (useCache = true) => {
    // Use a ref to prevent multiple simultaneous requests without depending on loading state
    if (loadingRef.current) {
      console.log('Social: Skipping fetch - already loading');
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const cacheHeader = useCache ? {} : { 'Cache-Control': 'no-cache' };
      const headers = { ...cacheHeader };
      
      // Add authorization if available to get user's like status
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/social?page=1&limit=20', {
        headers,
        credentials: 'include' // Include cookies for authentication
      });
      if (!res.ok) throw new Error('Failed to fetch social entries');
      const data = await res.json();
      const socialEntries = data.entries || data;
      setEntries(socialEntries);
      
      // Extract user likes from the response if available
      if (socialEntries.length > 0) {
        const newUserLikes = new Set();
        socialEntries.forEach(entry => {
          if (entry.user_liked) {
            newUserLikes.add(entry.id);
          }
        });
        setUserLikes(newUserLikes);
      }
      
      // Preserve expansion state for existing entries and reset for new ones
      setExpandedEntries(prev => {
        const newExpanded = new Set();
        prev.forEach(entryId => {
          // Only keep expanded state if the entry still exists
          if (socialEntries.some(entry => entry.id === entryId)) {
            newExpanded.add(entryId);
          }
        });
        return newExpanded;
      });
      
    } catch (err) {
      setError('Could not load social entries.');
      console.error(err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []); // Remove loading dependency to prevent infinite loops

  const handleShowComments = useCallback(async (entryId) => {
    setCommentDialogs(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));

    // Fetch comments if not already loaded and dialog is being opened
    const isOpening = !commentDialogs[entryId];
    if (isOpening && !comments[entryId]) {
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
  }, [commentDialogs, comments]); // Keep necessary dependencies but optimize logic

  // Function to toggle entry expansion
  const toggleEntryExpansion = useCallback((entryId) => {
    setExpandedEntries(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(entryId)) {
        newExpanded.delete(entryId);
      } else {
        newExpanded.add(entryId);
      }
      return newExpanded;
    });
  }, []);

  // Helper function to detect if text contains HTML (rich text)
  const isRichText = useCallback((text) => {
    if (!text) return false;
    // Check if text contains HTML tags
    return /<[^>]+>/.test(text);
  }, []);

  // Helper function to truncate text to first 3 lines
  const getTruncatedText = useCallback((text) => {
    if (!text) return '';
    
    const isRich = isRichText(text);
    
    if (isRich) {
      // For rich text, we need to preserve formatting while truncating
      // The content structure is: <span style="color: rgb(255, 0, 0);">hehe</span><div>i love this</div><div>this is good</div><div>can i use this too</div><div>yeah this is good</div>
      
      // Strategy: Split by <div> tags but preserve inline formatting in the first part
      const parts = text.split(/<div[^>]*>/i);
      
      if (parts.length <= 1) {
        // No div tags, treat as single line
        return text;
      }
      
      // First part might contain inline elements (like the span)
      let firstPart = parts[0];
      
      // Take next 2 parts (to make total 3 lines)
      const nextParts = parts.slice(1, 3);
      
      // Reconstruct with div tags for the additional parts
      let result = firstPart;
      
      nextParts.forEach(part => {
        // Remove closing </div> if present and add opening <div>
        const cleanPart = part.replace(/<\/div>.*$/, '');
        if (cleanPart.trim()) {
          result += '<div>' + cleanPart + '</div>';
        }
      });
      
      return result;
    } else {
      // For plain text, split by newlines and take first 3 lines
      const lines = text.split('\n');
      
      if (lines.length <= 3) return text;
      return lines.slice(0, 3).join('\n');
    }
  }, [isRichText]);

  // Helper function to check if text needs truncation
  const needsTruncation = useCallback((text) => {
    if (!text) return false;
    
    const isRich = isRichText(text);
    
    if (isRich) {
      // For rich text, convert HTML line breaks to newlines first
      const htmlWithNewlines = text
        .replace(/<br\s*\/?>/gi, '\n')           // <br> tags to \n
        .replace(/<\/div>/gi, '\n')              // </div> to \n
        .replace(/<\/p>/gi, '\n')                // </p> to \n
        .replace(/<div[^>]*>/gi, '\n')           // <div> to \n
        .replace(/<p[^>]*>/gi, '\n');            // <p> to \n
      
      // Strip HTML tags to get plain text
      const plainText = htmlWithNewlines.replace(/<[^>]*>/g, '')
                                        .replace(/&nbsp;/g, ' ')
                                        .replace(/&lt;/g, '<')
                                        .replace(/&gt;/g, '>')
                                        .replace(/&amp;/g, '&');
      
      // Count non-empty lines
      const lines = plainText.split('\n').filter(line => line.trim() !== '');
      return lines.length > 3;
    } else {
      // For plain text, count newlines
      const lines = text.split('\n');
      return lines.length > 3;
    }
  }, [isRichText]);

  // Cross-tab synchronization for social entries
  useEffect(() => {
    let refreshTimeout = null;
    let pendingUpdates = new Set();
    
    // Debounced refresh function to prevent excessive API calls
    const debouncedRefresh = () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      refreshTimeout = setTimeout(async () => {
        if (pendingUpdates.size > 0) {
          console.log('Social: Processing batched updates:', Array.from(pendingUpdates));
          try {
            await fetchSocialEntries(false);
          } catch (error) {
            console.error('Social: Error in batched refresh:', error);
          }
          pendingUpdates.clear();
        }
      }, 500); // Wait 500ms before refreshing to batch multiple updates
    };

    // BroadcastChannel for modern browsers
    let channel;
    if (window.BroadcastChannel) {
      channel = new BroadcastChannel('diary-updates');
      channel.onmessage = (event) => {
        try {
          const { type, entryId, timestamp } = event.data;
          
          if (type === 'ENTRY_DELETED' && entryId) {
            console.log('Social: Received delete notification from another tab:', entryId);
            // Immediate removal for deletes (no batching needed)
            setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
          } else if (type === 'ENTRY_CREATED' || type === 'ENTRY_UPDATED') {
            console.log('Social: Received update notification from another tab:', { type, entryId });
            // Batch these updates
            pendingUpdates.add(`${type}_${entryId || 'all'}`);
            try {
              debouncedRefresh();
            } catch (error) {
              console.error('Social: Error in debouncedRefresh:', error);
            }
          } else if (type === 'SOCIAL_LIKE_TOGGLED' && entryId) {
            console.log('Social: Received like toggle notification:', entryId);
            // If we have the new count and like status, update directly instead of refreshing
            if (event.data.newCount !== undefined) {
              setEntries(prevEntries => prevEntries.map(entry => 
                entry.id === entryId 
                  ? { ...entry, likes_count: event.data.newCount }
                  : entry
              ));
              
              // Update user's like status if provided
              if (event.data.liked !== undefined) {
                setUserLikes(prev => {
                  const newLikes = new Set(prev);
                  if (event.data.liked) {
                    newLikes.add(entryId);
                  } else {
                    newLikes.delete(entryId);
                  }
                  return newLikes;
                });
              }
            } else {
              // Fallback to batched refresh if no count provided
              pendingUpdates.add(`LIKE_${entryId}`);
              try {
                debouncedRefresh();
              } catch (error) {
                console.error('Social: Error in like debouncedRefresh:', error);
              }
            }
          } else if (type === 'SOCIAL_COMMENT_ADDED' && entryId) {
            console.log('Social: Received comment notification:', entryId);
            // For comments, refresh the specific entry's comments if dialog is open
            if (commentDialogs[entryId]) {
              handleShowComments(entryId).catch(error => {
                console.error('Social: Error refreshing comments:', error);
              });
            }
            // Batch the entry count update
            pendingUpdates.add(`COMMENT_${entryId}`);
            try {
              debouncedRefresh();
            } catch (error) {
              console.error('Social: Error in comment debouncedRefresh:', error);
            }
          }
        } catch (error) {
          console.error('Social: Error processing broadcast message:', error);
        }
      };
    }

    // localStorage fallback for older browsers
    const handleStorageChange = (event) => {
      if (event.key === 'diary-last-action' && event.newValue) {
        try {
          const action = JSON.parse(event.newValue);
          const { type, entryId, timestamp } = action;
          
          // Avoid processing our own actions (same timestamp within 1 second)
          if (Math.abs(Date.now() - timestamp) < 1000) return;
          
          if (type === 'ENTRY_DELETED' && entryId) {
            console.log('Social: Received delete notification via localStorage:', entryId);
            setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
          } else if (type === 'ENTRY_CREATED' || type === 'ENTRY_UPDATED') {
            console.log('Social: Received update notification via localStorage');
            pendingUpdates.add(`${type}_${entryId || 'all'}`);
            try {
              debouncedRefresh();
            } catch (error) {
              console.error('Social: Error in localStorage debouncedRefresh:', error);
            }
          } else if (type === 'SOCIAL_LIKE_TOGGLED' || type === 'SOCIAL_COMMENT_ADDED') {
            console.log('Social: Received social interaction notification via localStorage');
            // Handle like updates with direct count update if available
            if (type === 'SOCIAL_LIKE_TOGGLED' && action.newCount !== undefined && entryId) {
              setEntries(prevEntries => prevEntries.map(entry => 
                entry.id === entryId 
                  ? { ...entry, likes_count: action.newCount }
                  : entry
              ));
              
              // Update user's like status if provided
              if (action.liked !== undefined) {
                setUserLikes(prev => {
                  const newLikes = new Set(prev);
                  if (action.liked) {
                    newLikes.add(entryId);
                  } else {
                    newLikes.delete(entryId);
                  }
                  return newLikes;
                });
              }
            } else {
              // Fallback to batched refresh
              pendingUpdates.add(`${type}_${entryId || 'all'}`);
              try {
                debouncedRefresh();
              } catch (error) {
                console.error('Social: Error in localStorage fallback debouncedRefresh:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error parsing localStorage diary action:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [commentDialogs, fetchSocialEntries, handleShowComments]); // Dependencies for the cross-tab sync

  // Load entries immediately if we have a token, don't wait for full auth check
  useEffect(() => {
    if (mounted && (token || (!authLoading && isAuthenticated))) {
      fetchSocialEntries().catch(error => {
        console.error('Social: Error in initial load:', error);
      });
    }
  }, [mounted, token, isAuthenticated, authLoading, fetchSocialEntries]);

  // Separate effect for auth redirects to avoid blocking data loading
  useEffect(() => {
    if (!authLoading && requiresAuth) {
      router.replace('/login');
    }
  }, [requiresAuth, authLoading, router]);

  // Periodic refresh for social feed (every 45 seconds when tab is visible)
  useEffect(() => {
    // Only set up interval if user is authenticated
    if (!mounted || authLoading || !token && !isAuthenticated) return;
    
    let lastUserActivity = Date.now();
    
    // Track user activity to avoid refreshing when user is actively interacting
    const trackActivity = () => {
      lastUserActivity = Date.now();
    };
    
    // Add event listeners for user activity
    window.addEventListener('click', trackActivity);
    window.addEventListener('keydown', trackActivity);
    window.addEventListener('scroll', trackActivity);
    
    const intervalId = setInterval(() => {
      // Only refresh if:
      // 1. Tab is visible
      // 2. User is authenticated
      // 3. User hasn't been active in the last 10 seconds (to avoid disrupting active usage)
      if (!document.hidden && 
          !authLoading && 
          (token || isAuthenticated) &&
          (Date.now() - lastUserActivity) > 10000) {
        console.log('Social: Periodic refresh (user inactive)');
        fetchSocialEntries(false).catch(error => {
          console.error('Social: Error in periodic refresh:', error);
        });
      }
    }, 45000); // 45 seconds - slightly longer than main entries

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('scroll', trackActivity);
    };
  }, [mounted, authLoading, token, isAuthenticated, fetchSocialEntries]);

  // Refresh on window focus and visibility change
  useEffect(() => {
    // Only set up listeners if user is authenticated
    if (!mounted || authLoading || !token && !isAuthenticated) return;
    
    const handleFocus = () => {
      if (!authLoading && (token || isAuthenticated)) {
        fetchSocialEntries(false).catch(error => {
          console.error('Social: Error in focus refresh:', error);
        });
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !authLoading && (token || isAuthenticated)) {
        fetchSocialEntries(false).catch(error => {
          console.error('Social: Error in visibility refresh:', error);
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mounted, authLoading, token, isAuthenticated, fetchSocialEntries]);

  const handleLike = async (entryId) => {
    // Check current like status
    const isCurrentlyLiked = userLikes.has(entryId);
    const currentEntry = entries.find(entry => entry.id === entryId);
    if (!currentEntry) return;
    
    // Optimistic update - immediately update UI
    const optimisticLikeCount = isCurrentlyLiked 
      ? Math.max(0, (currentEntry.likes_count || 0) - 1)
      : (currentEntry.likes_count || 0) + 1;
    
    // Update UI immediately for better user experience
    setEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, likes_count: optimisticLikeCount }
        : entry
    ));
    
    // Update user's like status optimistically
    setUserLikes(prev => {
      const newLikes = new Set(prev);
      if (isCurrentlyLiked) {
        newLikes.delete(entryId);
      } else {
        newLikes.add(entryId);
      }
      return newLikes;
    });

    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          entryId,
          action: 'toggle_like'
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Update with actual server response (in case our optimistic update was wrong)
        setEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, likes_count: data.likes_count }
            : entry
        ));
        
        // Update user's like status with server response
        setUserLikes(prev => {
          const newLikes = new Set(prev);
          if (data.liked) {
            newLikes.add(entryId);
          } else {
            newLikes.delete(entryId);
          }
          return newLikes;
        });

        // Only broadcast if the like count actually changed (avoid spam)
        if (data.likes_count !== currentEntry.likes_count) {
          // Throttle broadcasts to prevent spam
          const lastBroadcast = localStorage.getItem(`last-like-broadcast-${entryId}`);
          const now = Date.now();
          
          if (!lastBroadcast || (now - parseInt(lastBroadcast)) > 1000) { // 1 second throttle
            localStorage.setItem(`last-like-broadcast-${entryId}`, now.toString());
            
            // Broadcast like toggle to other tabs
            if (window.BroadcastChannel) {
              const channel = new BroadcastChannel('diary-updates');
              channel.postMessage({ 
                type: 'SOCIAL_LIKE_TOGGLED', 
                entryId: entryId,
                newCount: data.likes_count,
                liked: data.liked,
                timestamp: now 
              });
              channel.close();
            }

            // Also use localStorage as fallback
            localStorage.setItem('diary-last-action', JSON.stringify({
              type: 'SOCIAL_LIKE_TOGGLED',
              entryId: entryId,
              newCount: data.likes_count,
              liked: data.liked,
              timestamp: now
            }));
          }
        }
      } else {
        // Revert optimistic updates on error
        setEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, likes_count: currentEntry.likes_count }
            : entry
        ));
        setUserLikes(prev => {
          const newLikes = new Set(prev);
          if (isCurrentlyLiked) {
            newLikes.add(entryId);
          } else {
            newLikes.delete(entryId);
          }
          return newLikes;
        });
      }
    } catch (error) {
      console.error('Like error:', error);
      // Revert optimistic updates on error
      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, likes_count: currentEntry.likes_count }
          : entry
      ));
      setUserLikes(prev => {
        const newLikes = new Set(prev);
        if (isCurrentlyLiked) {
          newLikes.add(entryId);
        } else {
          newLikes.delete(entryId);
        }
        return newLikes;
      });
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

        // Broadcast comment addition to other tabs
        if (window.BroadcastChannel) {
          const channel = new BroadcastChannel('diary-updates');
          channel.postMessage({ 
            type: 'SOCIAL_COMMENT_ADDED', 
            entryId: entryId,
            timestamp: Date.now() 
          });
          channel.close();
        }

        // Also use localStorage as fallback
        localStorage.setItem('diary-last-action', JSON.stringify({
          type: 'SOCIAL_COMMENT_ADDED',
          entryId: entryId,
          timestamp: Date.now()
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

  // Show consistent loading until mounted and auth is determined
  if (!mounted || authLoading || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }} className="text-sm sm:text-base text-center">
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }} className="text-sm sm:text-base text-center">Checking access...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        <Header />
        <div className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 mx-auto min-h-screen flex items-center justify-center transition-colors duration-300" 
             style={{ backgroundColor: 'var(--bg-primary)', maxWidth: 'none', width: '100%' }}>
          <div className="text-red-500 text-center text-sm sm:text-base px-4">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />
      <Header />
      <main className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 mx-auto min-h-screen transition-colors duration-300" 
            style={{ backgroundColor: 'var(--bg-primary)', maxWidth: 'none', width: '100%' }}>
      <div className="max-w-3xl mx-auto">
        <div className="sticky top-20 sm:top-24 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 py-3 sm:py-4 transition-colors duration-300 bg-opacity-95 backdrop-blur-sm gap-4 sm:gap-0"
             style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl font-semibold transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
              Social Feed
            </h2>
            {loading && (
              <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading...
              </div>
            )}
          </div>
          <button
            onClick={() => fetchSocialEntries(false)}
            disabled={loading}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80 disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
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
              className="w-3 h-3 sm:w-4 sm:h-4"
              style={{ 
                filter: 'var(--icon-filter)' 
              }}
            />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="flex flex-col gap-4 sm:gap-6">
          {entries.length === 0 ? (
            <div className="text-center py-8 sm:py-12 transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
              <p className="text-sm sm:text-base">No shared entries yet.</p>
            </div>
          ) : (
            entries.map(entry => (
              <div
                key={entry.id}
                className="rounded-lg p-4 sm:p-6 transition-all duration-300"
                style={{ backgroundColor: 'var(--entries-bg)' }}
              >
                {/* User Info */}
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3"
                       style={{ backgroundColor: 'var(--new-button-bg)', color: 'var(--new-button-text)' }}>
                    {entry.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base transition-colors duration-300 truncate" 
                         style={{ color: 'var(--text-primary)' }}>
                      {entry.username}
                    </div>
                    <div className="text-xs sm:text-sm transition-colors duration-300" 
                         style={{ color: 'var(--text-secondary)' }}>
                      {new Date(entry.date).toLocaleString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', weekday: 'short'
                      })}
                    </div>
                  </div>
                </div>

                {/* Entry Content */}
                <div className="mb-3 sm:mb-4">
                  <div 
                    className={`p-3 sm:p-4 rounded transition-all duration-300 ${
                      needsTruncation(entry.text, entry.is_rich_text) 
                        ? 'cursor-pointer hover:opacity-90 hover:shadow-sm' 
                        : ''
                    }`}
                    style={{ backgroundColor: 'var(--entries-text-bg)', color: 'var(--entries-text)' }}
                    onClick={() => needsTruncation(entry.text) && toggleEntryExpansion(entry.id)}
                  >
                    <div 
                      className="whitespace-pre-wrap prose prose-xs sm:prose-sm max-w-none text-sm sm:text-base leading-relaxed"
                      style={{ color: 'var(--entries-text)' }}
                      dangerouslySetInnerHTML={{ 
                        __html: expandedEntries.has(entry.id) 
                          ? (entry.text || 'Empty entry')
                          : getTruncatedText(entry.text || 'Empty entry')
                      }}
                    />
                    {needsTruncation(entry.text) && (
                      <div 
                        className="mt-2 text-xs sm:text-sm font-medium transition-colors duration-300 flex items-center gap-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span>
                          {expandedEntries.has(entry.id) ? 'Show less' : 'Show more'}
                        </span>
                        <span className="text-xs">
                          {expandedEntries.has(entry.id) ? '▲' : '▼'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleLike(entry.id)}
                    className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                  >
                    <span className={`text-base sm:text-lg ${userLikes.has(entry.id) ? 'text-red-500' : 'text-gray-400'}`}>
                      {userLikes.has(entry.id) ? '❤️' : '🤍'}
                    </span>
                    <span className="text-xs sm:text-sm transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
                      {entry.likes_count || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => handleShowComments(entry.id)}
                    className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                  >
                    <span className="text-base sm:text-lg">💬</span>
                    <span className="text-xs sm:text-sm transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
                      {entry.comments_count || 0}
                    </span>
                  </button>
                </div>

                {/* Comments Section */}
                {commentDialogs[entry.id] && (
                  <div className="mt-3 sm:mt-4 border-t pt-3 sm:pt-4" style={{ borderColor: 'var(--border-color)' }}>
                    {/* Existing Comments */}
                    <div className="mb-3 sm:mb-4 max-h-48 sm:max-h-60 overflow-y-auto">
                      {comments[entry.id]?.map(comment => (
                        <div key={comment.id} className="mb-2 sm:mb-3 p-2 sm:p-3 rounded transition-colors duration-300"
                             style={{ backgroundColor: 'var(--bg-content)' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                 style={{ backgroundColor: 'var(--new-button-bg)', color: 'var(--new-button-text)' }}>
                              {(comment.username || 'Unknown')?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="font-medium text-xs sm:text-sm transition-colors duration-300 truncate flex-1" 
                                  style={{ color: 'var(--text-primary)' }}>
                              {comment.username || 'Unknown User'}
                            </span>
                            <span className="text-xs transition-colors duration-300 flex-shrink-0" 
                                  style={{ color: 'var(--text-secondary)' }}>
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm transition-colors duration-300 leading-relaxed" 
                               style={{ color: 'var(--text-primary)' }}>
                            {comment.comment_text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newComment[entry.id] || ''}
                        onChange={(e) => setNewComment(prev => ({
                          ...prev,
                          [entry.id]: e.target.value
                        }))}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 rounded border transition-colors duration-300 text-sm sm:text-base"
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
                        className="px-3 sm:px-4 py-2 rounded text-white transition-colors duration-300 hover:opacity-80 text-sm sm:text-base whitespace-nowrap touch-manipulation"
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
