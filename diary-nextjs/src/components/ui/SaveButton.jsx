'use client';
import React from 'react';

export default function SaveButton({ isDirty, onSave, onBack, saveText = "Save" }) {
  return (
    <button className="relative w-70 h-8 overflow-hidden group bg-transparent border-none p-0 flex items-center justify-center" style={{boxShadow: 'none'}}>
      <span
        className={
          `absolute inset-0 flex items-center justify-center transition-transform duration-300 ${isDirty ? '-translate-y-full' : 'translate-y-0'}`
        }
      >
        <span className="mr-18 flex items-center hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors px-2 py-1" onClick={onBack} title="Back to main page">
          <span className="text-2xl">&#8592;</span>
          <span className="ml-2 mr-1 font-medium mt-1.5 transition-colors duration-300" 
                style={{ marginRight: "5px", color: 'var(--text-primary)' }}>
            Back to Entries
          </span>
        </span>
      </span>
      <span
        className={
          `absolute inset-0 flex items-center justify-center transition-transform duration-300 ${isDirty ? '-translate-y-4' : 'translate-y-full'}`
        }
      >
        <span className="flex items-center hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors px-2 py-1 mt-10" onClick={onSave} title="Save and back to Entries">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-7 h-7 text-green-600 dark:text-green-400 mb-1 mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
          <span className="mr-1 text-green-600 dark:text-green-400 font-medium" style={{ marginRight: "5px" }}>
            {saveText} and back to Entries
          </span>
        </span>
      </span>
    </button>
  );
}
