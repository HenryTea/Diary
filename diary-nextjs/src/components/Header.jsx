import React from 'react';

export default function Header({ onBurgerClick }) {
  return (
    <header 
      className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-6 py-4 shadow transition-colors duration-300"
      style={{ 
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)'
      }}
    >
      <button onClick={onBurgerClick} className="md:hidden flex flex-col gap-1 focus:outline-none">
        <span className="block w-6 h-1 rounded transition-colors duration-300" style={{ backgroundColor: 'var(--text-secondary)' }}></span>
        <span className="block w-6 h-1 rounded transition-colors duration-300" style={{ backgroundColor: 'var(--text-secondary)' }}></span>
        <span className="block w-6 h-1 rounded transition-colors duration-300" style={{ backgroundColor: 'var(--text-secondary)' }}></span>
      </button>
      <div className="flex mx-auto gap-2">
          <img src="/header-icon.svg" alt="Diary" className="w-8 h-8 mt--1 sidebar-icon" />
          <h1 className="text-xl font-bold transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>Diary</h1>
      </div>
      <div className="w-8" /> {/* Spacer for symmetry */}
    </header>
  );
}
