'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function NewEntryButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/entries/new')}
      className="fixed bottom-6 right-6 shadow-lg rounded-full px-6 py-3 flex items-center text-lg font-bold 
                 hover:shadow-xl hover:scale-105 hover:opacity-95 
                 active:scale-95 
                 transition-all duration-300 ease-in-out
                 transform hover:-translate-y-1"
      style={{ 
        backgroundColor: 'var(--new-button-bg)',
        color: 'var(--new-button-text)'
      }}
    >
      <span className="mr-2 text-2xl transition-transform duration-300 hover:rotate-90">+</span> NEW
    </button>
  );
}
