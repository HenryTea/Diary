"use client";
import React from 'react';

export default function NewEntryPage() {
  return (
    <div className="min-h-screen bg-[#f5fafc] flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 w-full bg-[#e9f3f6] flex flex-col items-center border-b border-gray-200">
        <div className="w-full flex justify-between items-center px-4 py-2">
          <button className="text-2xl">&#8592;</button>
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
        {/* Placeholder for editor */}
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
        <div className="text-xs text-gray-500">Words 0 · Characters 0</div>
      </div>
    </div>
  );
} 