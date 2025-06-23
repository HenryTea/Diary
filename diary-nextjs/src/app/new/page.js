'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewEntryPage() {
  const router = useRouter();
  const [entry, setEntry] = useState('');
  const handleSaveAndBack = async () => {
    if (entry.trim() !== '') {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: entry }),
      });
    }
    router.push('/');
  };
  return (
    <div className="min-h-screen bg-[#f5fafc] flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 w-full bg-[#e9f3f6] flex flex-col items-center border-b border-gray-200">
        <div className="w-full flex justify-between items-center px-4 py-2">
          {entry.trim() === '' ? (
            <button
              className="text-2xl hover:bg-gray-300 rounded transition-colors px-2 py-1"
              onClick={() => router.push('/')}
              title="Back to main page"
            >
              &#8592;
            </button>
          ) : (
            <button
              className="flex items-center hover:bg-green-100 rounded transition-colors px-2 py-1"
              onClick={handleSaveAndBack}
              title="Save and back to Entries"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="mr-1 text-green-600 font-medium" style={{marginRight: '5px'}}>Save and back to Entries</span>
            </button>
          )}
          <span className="text-xs font-semibold tracking-widest">JUNE 14, 2025 AT 4:54 PM</span>
          <div className="w-8" />
        </div>
        <div className="flex items-center gap-2 py-2">
          <button className="px-2 py-1 rounded hover:bg-gray-200">+</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">T</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">&#8226;&#8226;&#8226;</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200 font-bold">B</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200 italic">I</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200 underline">U</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">🎨</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">✏️</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">👁️</button>
        </div>
      </div>
      {/* Editor Area */}
      <div className="flex-1 bg-white mx-2 my-4 rounded shadow-sm p-4 min-h-[60vh]">
        <textarea
          className="w-full h-full min-h-[50vh] resize-none outline-none bg-transparent text-base text-black placeholder-gray-400"
          placeholder="Write your diary entry here..."
          style={{ fontFamily: 'inherit' }}
          value={entry}
          onChange={e => setEntry(e.target.value)}
        />
      </div>
      {/* Bottom Bar */}
      <div className="sticky bottom-0 z-30 w-full bg-[#f5fafc] border-t border-gray-200 flex items-center justify-between px-4 py-2">
        <div className="flex gap-3 items-center">
          <button className="text-xl">🖼️</button>
          <button className="text-xl">📍</button>
          <button className="text-xl">☀️</button>
          <button className="text-xl">🏃</button>
          <button className="text-xl">🏷️</button>
        </div>
        <div className="text-xs text-gray-500">Words {entry.trim().split(/\s+/).filter(Boolean).length} · Characters {entry.length}</div>
      </div>
    </div>
  );
}
