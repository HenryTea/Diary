'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function NewEntryButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/new')}
      className="fixed bottom-6 right-6 bg-[#b3e6fa] shadow-lg rounded-full px-6 py-3 flex items-center text-lg font-bold hover:bg-[#a0d8ef] transition-colors"
    >
      <span className="mr-2 text-2xl">+</span> NEW
    </button>
  );
}
