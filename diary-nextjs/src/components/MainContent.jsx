'use client';
import React, { useState, useEffect } from 'react';
import { stripHtmlTags } from '../utils/editorUtils';

export default function MainContent() {
  const [sortAsc, setSortAsc] = useState(true);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/entries');
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
    fetchEntries();
  }, []);

  const sortedEntries = [...entries].sort((a, b) => {
    if (sortAsc) return new Date(a.date).getTime() - new Date(b.date).getTime();
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await fetch("/api/entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchEntries();
    }
  };

  return (
    <main className="pt-24 px-8 mx-auto min-h-screen transition-colors duration-300" 
          style={{ backgroundColor: 'var(--bg-primary)', maxWidth: 'none', width: '100%' }}>
      <div className="max-w-3xl mx-auto">
        <div className="sticky top-0 z-30 flex items-center justify-between mb-6 py-4 transition-colors duration-300" 
             style={{marginLeft: 0, marginRight: 0}}>
          <h2 className="text-2xl font-semibold transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>Entries</h2>
          <div className="flex gap-2">
            <button
              className="p-2 rounded flex items-center justify-center bg-transparent hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-colors"
              title="Reload"
              onClick={fetchEntries}
            >
              <img src="/icons8-refresh.svg" alt="Reload" className="w-6 h-6 toolbar-icon" />
            </button>
            <button
              className="p-2 rounded bg-transparent hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-colors flex items-center justify-center"
              title="Search"
            >
              <img src="/icons8-search.svg" alt="Search" className="w-6 h-6 toolbar-icon" />
            </button>
            <button
              className="p-2 rounded bg-transparent hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-colors flex items-center justify-center"
              title="Sort by date"
              onClick={() => setSortAsc((v) => !v)}
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
    </main>
  );
}
