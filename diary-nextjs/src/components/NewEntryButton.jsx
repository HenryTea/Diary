'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function NewEntryButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/entries/new')}
      className="fixed bottom-6 right-6 shadow-lg rounded-full px-6 py-3 flex items-center text-lg font-bold hover:opacity-90 transition-all duration-300"
      style={{ 
        backgroundColor: 'var(--new-button-bg)',
        color: 'var(--new-button-text)'
      }}
    >
      <span className="mr-2 text-2xl">+</span> NEW
    </button>
  );
}
