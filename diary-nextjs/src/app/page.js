'use client';
import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import NewEntryButton from '../components/NewEntryButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#e9f3f6]">
      <Sidebar />
      <Header />
      <MainContent />
      <NewEntryButton />
    </div>
  );
}
