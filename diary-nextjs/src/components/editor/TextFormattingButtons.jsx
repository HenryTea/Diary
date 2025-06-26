'use client';
import React from 'react';

export default function TextFormattingButtons({
  isBold,
  isItalic,
  isUnderline,
  onBold,
  onItalic,
  onUnderline
}) {
  return (
    <>
      <button 
        className={`px-2 py-1 rounded font-bold transition-colors ${
          isBold 
            ? 'bg-blue-200 hover:bg-blue-300 text-blue-800 border border-blue-400' 
            : 'hover:bg-gray-200'
        }`}
        onClick={onBold}
        title={isBold ? "Remove Bold" : "Make Bold"}
      >
        B
      </button>
      
      <button 
        className={`px-2 py-1 rounded italic transition-colors ${
          isItalic 
            ? 'bg-blue-200 hover:bg-blue-300 text-blue-800 border border-blue-400' 
            : 'hover:bg-gray-200'
        }`}
        onClick={onItalic}
        title={isItalic ? "Remove Italic" : "Make Italic"}
      >
        I
      </button>
      
      <button 
        className={`px-2 py-1 rounded underline transition-colors ${
          isUnderline 
            ? 'bg-blue-200 hover:bg-blue-300 text-blue-800 border border-blue-400' 
            : 'hover:bg-gray-200'
        }`}
        onClick={onUnderline}
        title={isUnderline ? "Remove Underline" : "Add Underline"}
      >
        U
      </button>
    </>
  );
}
