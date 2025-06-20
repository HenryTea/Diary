"use client";

import React, { useState, useEffect } from 'react';

interface Entry {
  id: string;
  date: string;
  text: string;
}

const MainContent: React.FC = () => {
  const [sortAsc, setSortAsc] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
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
    <main className="pt-24 px-8 max-w-3xl mx-auto">
      <div className="sticky top-0 bg-[#e9f3f6] z-30 flex items-center justify-between mb-6 py-4" style={{marginLeft: 0, marginRight: 0}}>
        <h2 className="text-2xl font-semibold text-gray-800">Entries</h2>
        <div className="flex gap-2">
          <button
            className="p-2 rounded flex items-center justify-center bg-transparent hover:bg-gray-300 active:bg-gray-400 transition-colors"
            title="Reload"
            onClick={fetchEntries}
          >
            <img src="/icons8-refresh.svg" alt="Reload" className="w-6 h-6" />
          </button>
          <button
            className="p-2 rounded bg-transparent hover:bg-gray-300 active:bg-gray-400 transition-colors flex items-center justify-center"
            title="Search"
          >
            <img src="/icons8-search.svg" alt="Search" className="w-6 h-6" />
          </button>
          <button
            className="p-2 rounded bg-transparent hover:bg-gray-300 active:bg-gray-400 transition-colors flex items-center justify-center"
            title="Sort by date"
            onClick={() => setSortAsc((v) => !v)}
          >
            <img
              src={sortAsc ? "/sort-amount-up-svgrepo-com.svg" : "/sort-amount-down-svgrepo-com.svg"}
              alt={sortAsc ? "Sort Ascending" : "Sort Descending"}
              className="w-6 h-6"
            />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-gray-500 text-center">Loading entries...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : sortedEntries.length === 0 ? (
          <div className="text-gray-500 text-center">No entries yet.</div>
        ) : (
          sortedEntries.map(entry => (
            <div
              key={entry.id}
              className="bg-[#f5fafc] text-white rounded p-4 cursor-pointer hover:bg-[#e0e7ef] transition-colors relative"
              onClick={() => window.location.href = `/entries/${entry.id}`}
            >
              <button
                className="absolute top-2 right-2 text-red-600 hover:bg-red-100 rounded p-1 z-10"
                title="Delete entry"
                onClick={e => { e.stopPropagation(); handleDelete(entry.id); }}
              >
                🗑️
              </button>
              <div className="font-bold mb-1 text-[#7fc8de]">
                {new Date(entry.date).toLocaleString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit', weekday: 'short'
                })}
              </div>
              <div
                className="bg-[#7fc8de] text-[#222] rounded px-2 py-1 mt-2"
                style={{
                  marginLeft: '2px',
                  marginRight: '2px',
                  width: 'calc(100% - 4px)',
                  boxSizing: 'border-box',
                  display: 'block',
                }}
              >
                {(() => {
                  const firstLine = entry.text.split('\n')[0];
                  if (firstLine.length > 30) {
                    return firstLine.slice(0, 30) + '...';
                  }
                  return firstLine;
                })()}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
};

export default MainContent;