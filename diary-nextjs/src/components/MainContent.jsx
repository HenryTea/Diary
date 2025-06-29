'use client';
import React, { useState, useEffect, useRef } from 'react';
import { stripHtmlTags } from '../utils/editorUtils';
import { useAuth } from '../contexts/AuthContext';
import ShareDialog from './ShareDialog';

export default function MainContent() {
  const [sortAsc, setSortAsc] = useState(true);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('text'); // 'text' or 'date'
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const searchInputRef = useRef(null);
  const { token } = useAuth();

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/entries', { headers });
      if (!res.ok) throw new Error('Failed to fetch entries');
      const data = await res.json();
      setEntries(data);
    } catch {
      setError('Could not load entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEntries();
    }
  }, [token]);

  // Generate suggestions based on search query and type
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    let newSuggestions = [];

    if (searchType === 'text') {
      // Search in entry text content
      const textMatches = entries
        .filter(entry => {
          const plainText = stripHtmlTags(entry.text || '').toLowerCase();
          return plainText.includes(query);
        })
        .slice(0, 3)
        .map(entry => ({
          type: 'text',
          text: stripHtmlTags(entry.text || '').substring(0, 50) + '...',
          entry
        }));
      newSuggestions = textMatches;
    } else if (searchType === 'date') {
      // Search by date
      const dateMatches = entries
        .filter(entry => {
          const dateStr = new Date(entry.date).toLocaleString('en-US').toLowerCase();
          return dateStr.includes(query);
        })
        .slice(0, 3)
        .map(entry => ({
          type: 'date',
          text: new Date(entry.date).toLocaleString('en-US'),
          entry
        }));
      newSuggestions = dateMatches;
    }

    // Add search type option as last suggestion
    newSuggestions.push({
      type: 'setting',
      text: `Search by ${searchType === 'text' ? 'date' : 'text'}`,
      isTypeSwitcher: true
    });

    setSuggestions(newSuggestions);
    setShowSuggestions(true);
  }, [searchQuery, searchType, entries]);

  // Filter entries based on search
  const filteredEntries = searchQuery.trim() 
    ? entries.filter(entry => {
        const query = searchQuery.toLowerCase();
        if (searchType === 'text') {
          const plainText = stripHtmlTags(entry.text || '').toLowerCase();
          return plainText.includes(query);
        } else {
          const dateStr = new Date(entry.date).toLocaleString('en-US').toLowerCase();
          return dateStr.includes(query);
        }
      })
    : entries;

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (sortAsc) return new Date(a.date).getTime() - new Date(b.date).getTime();
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      await fetch("/api/entries", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id }),
      });
      fetchEntries();
    }
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      // Focus the search input when opening
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } else {
      // Clear search when closing
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.isTypeSwitcher) {
      setSearchType(searchType === 'text' ? 'date' : 'text');
      setSearchQuery('');
    } else {
      // Navigate to the entry
      window.location.href = `/entries/${suggestion.entry.id}`;
    }
    setShowSuggestions(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSearch(false);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleShare = (entry, e) => {
    e.stopPropagation();
    setSelectedEntry(entry);
    setShowShareDialog(true);
  };

  const handleCloseShareDialog = () => {
    setShowShareDialog(false);
    setSelectedEntry(null);
  };

  const handleSaveSharing = () => {
    // Refresh entries after sharing settings change
    fetchEntries();
  };

  return (
    <main className="pt-24 px-8 mx-auto min-h-screen transition-colors duration-300" 
          style={{ backgroundColor: 'var(--bg-primary)', maxWidth: 'none', width: '100%' }}>
      <div className="max-w-3xl mx-auto">
        <div className="sticky top-0 z-30 flex items-center justify-between mb-6 py-4 transition-colors duration-300 relative" 
             style={{marginLeft: 0, marginRight: 0}}>
          <h2 className="text-2xl font-semibold transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>Entries</h2>
          
          <div className="flex gap-2 items-center relative">
            {/* Search Input - slides from search button */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showSearch ? 'w-64' : 'w-0'}`}>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={`Search by ${searchType}...`}
                  className="w-64 px-3 py-1 rounded border transition-colors duration-300 outline-none"
                  style={{ 
                    height: '36px', // button height - 2px
                    backgroundColor: 'var(--bg-content)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                
                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-1 rounded border shadow-lg z-50 max-h-40 overflow-y-auto"
                    style={{ 
                      backgroundColor: 'var(--bg-content)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 cursor-pointer hover:opacity-80 transition-colors text-sm border-b last:border-b-0"
                        style={{ 
                          borderColor: 'var(--border-color)',
                          color: suggestion.isTypeSwitcher ? 'var(--text-secondary)' : 'var(--text-primary)',
                          fontStyle: suggestion.isTypeSwitcher ? 'italic' : 'normal'
                        }}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion.isTypeSwitcher ? (
                          <span>⚙️ {suggestion.text}</span>
                        ) : (
                          <div>
                            <div className="font-medium">
                              {suggestion.type === 'date' ? '📅' : '📝'} {suggestion.type === 'date' ? suggestion.text : suggestion.text}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Reload Button */}
            <button
              className="p-2 rounded flex items-center justify-center bg-transparent hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-colors"
              title="Reload"
              onClick={fetchEntries}
              style={{ height: '38px', width: '38px' }}
            >
              <img src="/icons8-refresh.svg" alt="Reload" className="w-6 h-6 toolbar-icon" />
            </button>
            
            {/* Search Button */}
            <button
              className="p-2 rounded bg-transparent hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-colors flex items-center justify-center"
              title="Search"
              onClick={handleSearchToggle}
              style={{ height: '38px', width: '38px' }}
            >
              <img src="/icons8-search.svg" alt="Search" className="w-6 h-6 toolbar-icon" />
            </button>
            
            {/* Sort Button */}
            <button
              className="p-2 rounded bg-transparent hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-colors flex items-center justify-center"
              title="Sort by date"
              onClick={() => setSortAsc((v) => !v)}
              style={{ height: '38px', width: '38px' }}
            >
              <img
                src={sortAsc ? "/sort-amount-up-svgrepo-com.svg" : "/sort-amount-down-svgrepo-com.svg"}
                alt={sortAsc ? "Sort Ascending" : "Sort Descending"}
                className="w-6 h-6 toolbar-icon"
              />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>Loading entries...</div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : sortedEntries.length === 0 ? (
            <div className="text-center transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>No entries yet.</div>
          ) : (
            sortedEntries.map(entry => (
              <div
                key={entry.id}
                className="rounded p-4 cursor-pointer hover:opacity-90 transition-all duration-300 relative"
                style={{ backgroundColor: 'var(--entries-bg)' }}
                onClick={() => window.location.href = `/entries/${entry.id}`}
              >
                <button
                  className="absolute top-2 right-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded p-1 z-10 transition-colors"
                  title="Delete entry"
                  onClick={e => { e.stopPropagation(); handleDelete(entry.id); }}
                >
                  🗑️
                </button>
                <button
                  className="absolute top-2 right-12 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 z-10 transition-colors"
                  title="Share entry"
                  onClick={e => handleShare(entry, e)}
                >
                  <img src="/icon/share.svg" alt="Share" className="w-5 h-5" />
                </button>
                <div className="font-bold mb-1 transition-colors duration-300" style={{ color: '#72b3c8' }}>
                  {new Date(entry.date).toLocaleString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', weekday: 'short'
                  })}
                </div>
                <div
                  className="rounded px-2 py-1 mt-2 transition-colors duration-300"
                  style={{
                    marginLeft: '2px',
                    marginRight: '2px',
                    width: 'calc(100% - 4px)',
                    boxSizing: 'border-box',
                    display: 'block',
                    backgroundColor: 'var(--entries-text-bg)',
                    color: 'var(--entries-text)'
                  }}
                >
                  {(() => {
                    // Strip HTML tags and get plain text
                    const plainText = stripHtmlTags(entry.text || '');
                    const firstLine = plainText.split('\n')[0];
                    if (firstLine.length > 30) {
                      return firstLine.slice(0, 30) + '...';
                    }
                    return firstLine || 'Empty entry';
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={handleCloseShareDialog}
        entry={selectedEntry}
        onSave={handleSaveSharing}
      />
    </main>
  );
}
