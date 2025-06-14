"use client";

import React, { useState } from 'react';

const MainContent: React.FC = () => {
  const [sortAsc, setSortAsc] = useState(true);

  return (
    <main className="pt-24 px-8 max-w-3xl mx-auto">
      <div className="sticky top-0 bg-[#e9f3f6] z-30 flex items-center justify-between mb-6 py-4" style={{marginLeft: 0, marginRight: 0}}>
        <h2 className="text-2xl font-semibold text-gray-800">Entries</h2>
        <div className="flex gap-2">
          <button
            className="p-2 rounded flex items-center justify-center bg-transparent hover:bg-gray-300 active:bg-gray-400 transition-colors"
            title="Reload"
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
    </main>
  );
};

export default MainContent; 