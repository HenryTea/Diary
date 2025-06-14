import React from 'react';

interface HeaderProps {
  onBurgerClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBurgerClick }) => (
  <header className="fixed top-0 left-0 w-full bg-[#e9f3f6] z-40 flex items-center justify-between px-6 py-4 shadow">
    <button onClick={onBurgerClick} className="md:hidden flex flex-col gap-1 focus:outline-none">
      <span className="block w-6 h-1 bg-gray-700 rounded"></span>
      <span className="block w-6 h-1 bg-gray-700 rounded"></span>
      <span className="block w-6 h-1 bg-gray-700 rounded"></span>
    </button>
    <div className="flex mx-auto gap-2">
        <img src="/header-icon.svg" alt="Diary" className="w-8 h-8 mt--1" />
        <h1 className="text-xl font-bold">Diary</h1>
    </div>
    <div className="w-8" /> {/* Spacer for symmetry */}
  </header>
);

export default Header; 