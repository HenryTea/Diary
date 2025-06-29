'use client';
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import FormattingToolbar from "../../../components/editor/FormattingToolbar";
import CustomFontDialog from "../../../components/editor/CustomFontDialog";
import SaveButton from "../../../components/ui/SaveButton";
import { useRichTextEditor } from "../../../hooks/useRichTextEditor";
import { 
  applyFontSize, 
  applyFont, 
  applyBold, 
  applyItalic, 
  applyUnderline, 
  applyTextColor,
  checkFormatting,
  loadGoogleFont
} from "../../../utils/editorUtils";
import { 
  sanitizeHtml, 
  sanitizeInput, 
  validateEntryId, 
  validateHtmlContent, 
  RateLimiter,
  secureStorage,
  escapeHtml
} from "../../../utils/security";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { token, isAuthenticated, loading: authLoading, user, requiresAuth } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Security: Rate limiter for save operations
  const [saveLimiter] = useState(() => new RateLimiter(10, 60000)); // 10 saves per minute
  
  // Security: Validate entry ID on mount
  useEffect(() => {
    if (id && id !== 'new' && !validateEntryId(id)) {
      console.error('Invalid entry ID detected:', id);
      router.replace('/');
      return;
    }
  }, [id, router]);
  
  // Ensure component is mounted before checking client-side auth
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Immediate redirect check - only after component is mounted
  useEffect(() => {
    if (!mounted) return;
    
    // Security: Use secure storage instead of direct localStorage access
    const hasToken = token || secureStorage.getToken();
    const hasUser = user || secureStorage.getUser();
    
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
  
  // Basic state
  const [entry, setEntry] = useState(id === 'new' ? {
    id: 'new',
    text: '',
    date: new Date().toISOString(),
    isRichText: true
  } : null);
  const [loading, setLoading] = useState(id !== 'new'); // Don't show loading for new entries
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [originalHtml, setOriginalHtml] = useState("");

  // Rich text editor hook
  const editor = useRichTextEditor(entry, originalHtml, setOriginalHtml, setIsDirty);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        // Handle new entry case - immediate setup, no API call needed
        if (id === 'new') {
          setEntry({
            id: 'new',
            text: '',
            date: new Date().toISOString(),
            isRichText: true
          });
          setOriginalHtml('');
          setLoading(false);
          return;
        }

        // For existing entries, fetch only if we have auth
        if (!isAuthenticated && !token) {
          console.log('Not authenticated, skipping fetch');
          return;
        }
        
        console.log('Fetching entry with ID:', id);
        setLoading(true);
        const startTime = performance.now();
        
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Add token if available
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // Optimized: Fetch specific entry directly instead of all entries
        const res = await fetch(`/api/entries?id=${encodeURIComponent(id)}`, { 
          headers,
          credentials: 'include',
          // Add performance optimizations
          cache: 'no-store', // Ensure fresh data for editing
          priority: 'high'
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API Error:', res.status, errorText);
          throw new Error(`Failed to fetch entry: ${res.status}`);
        }
        
        const data = await res.json();
        const fetchTime = performance.now() - startTime;
        console.log(`API Response received in ${fetchTime.toFixed(2)}ms:`, data);
        
        // Handle the response - it should have entries array with single entry
        const entries = data.entries || data;
        console.log('Processing entries:', entries?.length, 'entries found');
        
        if (!entries || entries.length === 0) {
          console.error('Entry not found. Looking for ID:', sanitizeInput(id));
          setError(`Entry with ID "${escapeHtml(id)}" not found.`);
          return;
        }
        
        const found = entries[0]; // Should be the only entry returned
        console.log(`Found entry in ${fetchTime.toFixed(2)}ms:`, found);
        
        // Security: Sanitize HTML content from server
        const sanitizedEntry = {
          ...found,
          text: sanitizeHtml(found.text || '')
        };
        setEntry(sanitizedEntry);
        setOriginalHtml(sanitizedEntry.text);
      } catch (e) {
        console.error('Fetch error:', e);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch when we have proper auth state
    if (!authLoading) {
      fetchEntry();
    }
  }, [id, token, isAuthenticated, authLoading]);

  const handleSaveAndBack = async () => {
    // Security: Rate limiting check
    const userId = user?.id || 'anonymous';
    if (!saveLimiter.isAllowed(userId)) {
      alert('Too many save attempts. Please wait before trying again.');
      return;
    }
    
    // Security: Validate entry ID
    if (!validateEntryId(id)) {
      alert('Invalid entry ID');
      return;
    }
    
    if (editor.editorRef.current) {
      const startTime = performance.now();
      const rawHtml = editor.editorRef.current.innerHTML;
      
      // Security: Validate and sanitize HTML content
      if (!validateHtmlContent(rawHtml)) {
        alert('Invalid content detected. Please check your entry.');
        return;
      }
      
      const sanitizedHtml = sanitizeHtml(rawHtml);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      try {
        if (id === 'new') {
          // Create new entry
          console.log('Creating new entry...');
          const res = await fetch("/api/entries", {
            method: "POST",
            headers,
            body: JSON.stringify({ 
              text: sanitizedHtml, // Use sanitized HTML
            }),
            credentials: 'include'
          });
          
          if (res.ok) {
            const newEntry = await res.json();
            const saveTime = performance.now() - startTime;
            console.log(`Entry created in ${saveTime.toFixed(2)}ms:`, newEntry);
            
            // Security: Sanitize response data
            const sanitizedNewEntry = {
              ...newEntry,
              text: sanitizeHtml(newEntry.text || '')
            };
            
            setEntry(sanitizedNewEntry);
            setOriginalHtml(sanitizedHtml);
            setIsDirty(false);
            // Update the URL to reflect the new entry ID without navigation
            if (validateEntryId(newEntry.id)) {
              window.history.replaceState(null, '', `/entries/${newEntry.id}`);
            }
          } else {
            const error = await res.text();
            console.error('Failed to create entry:', error);
            alert('Failed to save entry: ' + sanitizeInput(error));
            return;
          }
        } else {
          // Update existing entry
          console.log('Updating existing entry:', id);
          const res = await fetch("/api/entries", {
            method: "PUT",
            headers,
            body: JSON.stringify({ 
              id: sanitizeInput(id), 
              text: sanitizedHtml,
              isRichText: true
            }),
            credentials: 'include'
          });
          
          if (res.ok) {
            const saveTime = performance.now() - startTime;
            console.log(`Entry updated in ${saveTime.toFixed(2)}ms`);
            
            setEntry((prev) => (prev ? { ...prev, text: sanitizedHtml } : prev));
            setOriginalHtml(sanitizedHtml);
            setIsDirty(false);
          } else {
            const error = await res.text();
            console.error('Failed to update entry:', error);
            alert('Failed to save entry: ' + sanitizeInput(error));
            return;
          }
        }
      } catch (error) {
        const saveTime = performance.now() - startTime;
        console.error(`Save failed after ${saveTime.toFixed(2)}ms:`, error);
        alert('Failed to save entry: ' + sanitizeInput(error.message || String(error)));
        return;
      }
    }
    router.push("/");
  };

  const handleDelete = async () => {
    // Security: Validate entry ID
    if (!validateEntryId(id)) {
      alert('Invalid entry ID');
      return;
    }
    
    if (id === 'new') {
      // Can't delete a new entry that hasn't been saved yet
      if (window.confirm("Discard this new entry?")) {
        router.push("/");
      }
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this entry?")) {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      try {
        await fetch("/api/entries", {
          method: "DELETE",
          headers,
          body: JSON.stringify({ id: sanitizeInput(id) }),
          credentials: 'include'
        });
        router.push("/");
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete entry: ' + sanitizeInput(error.message || String(error)));
      }
    }
  };

  // Formatting handlers - MEMOIZED for better performance
  const handleFontSizeChange = useCallback((value) => {
    if (value === 'custom') {
      editor.setShowCustomInput(true);
    } else {
      editor.setShowCustomInput(false);
      editor.setFontSizeSelected(Number(value));
      applyFontSize(Number(value), editor.editorRef, editor.handleHtmlChange);
    }
  }, [editor]);

  const handleCustomFontSizeChange = useCallback((size) => {
    editor.setCustomFontSize(size);
    applyFontSize(size, editor.editorRef, editor.handleHtmlChange);
  }, [editor]);

  const handleFontChange = useCallback((fontFamily) => {
    if (fontFamily === 'add-new-font') {
      editor.setShowFontDialog(true);
      return;
    }
    
    applyFont(fontFamily, editor.editorRef, loadGoogleFont, editor.handleHtmlChange);
    editor.setSelectedFont(fontFamily);
    
    // Add to recently used fonts
    if (fontFamily !== 'inherit') {
      editor.setRecentlyUsedFonts(prev => {
        const filtered = prev.filter(f => f !== fontFamily);
        return [fontFamily, ...filtered].slice(0, 2);
      });
    }
  }, [editor]);

  const handleBold = useCallback(() => {
    applyBold(editor.editorRef, checkFormatting, editor.handleHtmlChange);
  }, [editor]);

  const handleItalic = useCallback(() => {
    applyItalic(editor.editorRef, checkFormatting, editor.handleHtmlChange);
  }, [editor]);

  const handleUnderline = useCallback(() => {
    applyUnderline(editor.editorRef, checkFormatting, editor.handleHtmlChange);
  }, [editor]);

  const handleColorChange = useCallback((color) => {
    applyTextColor(color, editor.editorRef, editor.handleHtmlChange);
    editor.setSelectedColor(color);
    editor.setShowColorPicker(false);
  }, [editor]);

  const handleToggleColorPicker = useCallback(() => {
    editor.setShowColorPicker(!editor.showColorPicker);
  }, [editor]);

  // Memoize toolbar props to prevent unnecessary re-renders
  const toolbarProps = useMemo(() => ({
    // Font props
    selectedFont: editor.selectedFont,
    onFontChange: handleFontChange,
    GOOGLE_FONTS: editor.GOOGLE_FONTS,
    customFonts: editor.customFonts,
    recentlyUsedFonts: editor.recentlyUsedFonts,
    onShowFontDialog: () => editor.setShowFontDialog(true),
    
    // Font size props
    fontSizeSelected: editor.fontSizeSelected,
    showCustomInput: editor.showCustomInput,
    customFontSize: editor.customFontSize,
    FONT_SIZES: editor.FONT_SIZES,
    onFontSizeChange: handleFontSizeChange,
    onCustomFontSizeChange: handleCustomFontSizeChange,
    
    // Formatting props
    isBold: editor.isBold,
    isItalic: editor.isItalic,
    isUnderline: editor.isUnderline,
    onBold: handleBold,
    onItalic: handleItalic,
    onUnderline: handleUnderline,
    
    // Color props
    selectedColor: editor.selectedColor,
    showColorPicker: editor.showColorPicker,
    onToggleColorPicker: handleToggleColorPicker,
    onColorChange: handleColorChange,
  }), [editor, handleFontSizeChange, handleCustomFontSizeChange, handleFontChange, 
       handleBold, handleItalic, handleUnderline, handleColorChange, handleToggleColorPicker]);

  // Show consistent loading until mounted and auth is determined
  if (!mounted || authLoading || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>
          Checking authentication...
        </div>
      </div>
    );
  }

  // After mounting, check if we still need to redirect (additional safety check)
  const hasToken = token || secureStorage.getToken();
  const hasUser = user || secureStorage.getUser();
  
  if (!hasToken && !hasUser) {
    // This should rarely be hit due to the useEffect above, but provides safety
    router.replace('/login');
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>Checking authentication...</div>
      </div>
    );
  }

  // Fast loading for new entries - don't show loading spinner
  if (loading && id !== 'new') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>Loading entry...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-red-500">Error: {error}</div>
        <button 
          onClick={() => router.push("/")}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  if (!entry && id !== 'new') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>Entry not found.</div>
        <button 
          onClick={() => router.push("/")}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-40 w-full flex flex-col items-center border-b transition-colors duration-300" 
           style={{ 
             backgroundColor: 'var(--bg-secondary)',
             borderColor: 'var(--border-color)'
           }}>
        <div className="w-full flex justify-between items-center px-4 py-2 relative h-12 overflow-hidden">
          <SaveButton 
            isDirty={isDirty}
            onSave={handleSaveAndBack}
            onBack={() => router.push("/")}
            saveText={id === 'new' ? "Create" : "Save"}
          />
          
          <span className="text-xs font-semibold tracking-widest ml-50 transition-colors duration-300" 
                style={{ color: 'var(--text-primary)' }}>
            {new Date(entry.date).toLocaleString("en-US")}
          </span>
          
          <div className="w-8" />
          
          <button
            className="text-2xl text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors px-2 py-1 mr-2"
            onClick={handleDelete}
            title="Delete entry"
          >
            🗑️
          </button>
        </div>
        
        <FormattingToolbar {...toolbarProps} />
      </div>
      
      {/* Editor Area - Secured */}
      <div className="flex-1 mx-2 my-4 rounded shadow-sm p-4 min-h-[60vh] transition-colors duration-300" 
           style={{ backgroundColor: 'var(--bg-content)' }}>
        <div
          ref={editor.editorRef}
          className="w-full h-full min-h-[50vh] resize-none outline-none bg-transparent text-base placeholder-gray-400 transition-colors duration-300"
          contentEditable
          suppressContentEditableWarning
          style={{ 
            fontFamily: "inherit", 
            fontSize: 16, 
            whiteSpace: 'pre-wrap',
            color: 'var(--text-primary)'
          }}
          onInput={(e) => {
            // Security: Sanitize input in real-time
            const content = e.target.innerHTML;
            const sanitized = sanitizeHtml(content);
            
            // Only update if content changed to prevent infinite loops
            if (sanitized !== content) {
              e.target.innerHTML = sanitized;
              // Set cursor to end
              const range = document.createRange();
              const sel = window.getSelection();
              range.selectNodeContents(e.target);
              range.collapse(false);
              sel.removeAllRanges();
              sel.addRange(range);
            }
            
            editor.handleHtmlChange(e);
          }}
          onPaste={(e) => {
            // Security: Sanitize pasted content
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            const sanitizedText = sanitizeInput(text);
            
            // Insert sanitized text
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(document.createTextNode(sanitizedText));
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }
            
            // Trigger change event
            editor.handleHtmlChange({ target: e.target });
          }}
          onKeyDown={(e) => {
            // Security: Block dangerous key combinations
            if (e.ctrlKey || e.metaKey) {
              // Allow common editing shortcuts but block potentially dangerous ones
              const allowedKeys = ['a', 'c', 'v', 'x', 'z', 'y', 'b', 'i', 'u'];
              if (!allowedKeys.includes(e.key.toLowerCase())) {
                // Allow arrow keys, delete, backspace, etc.
                if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Backspace', 'Enter', 'Tab'].includes(e.key)) {
                  e.preventDefault();
                }
              }
            }
          }}
        />
      </div>
      
      {/* Bottom Bar */}
      <div className="sticky bottom-0 z-30 w-full border-t flex items-center justify-between px-4 py-2 transition-colors duration-300" 
           style={{ 
             backgroundColor: 'var(--bg-primary)',
             borderColor: 'var(--border-color)'
           }}>
        <div className="flex gap-3 items-center">
          <button className="text-xl">🖼️</button>
          <button className="text-xl">📍</button>
          <button className="text-xl">☀️</button>
          <button className="text-xl">🏃</button>
          <button className="text-xl">🏷️</button>
        </div>
        <div className="text-xs transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
          Words {editor.text.trim().split(/\s+/).filter(Boolean).length} · Characters {editor.text.length}
        </div>
      </div>
      
      {/* Custom Font Dialog */}
      <CustomFontDialog
        showFontDialog={editor.showFontDialog}
        customFontName={editor.customFontName}
        customFontUrl={editor.customFontUrl}
        onFontNameChange={editor.setCustomFontName}
        onFontUrlChange={editor.handleFontUrlChange}
        onAddFont={editor.handleAddCustomFont}
        onClose={() => editor.setShowFontDialog(false)}
      />
    </div>
  );
}
