'use client';
import React, { useState, useRef } from 'react';

export default function FontSizeSelector({
  fontSizeSelected,
  FONT_SIZES,
  onFontSizeChange
}) {
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const handleDoubleClick = () => {
    setIsInputMode(true);
    setInputValue(fontSizeSelected.toString());
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
    setInputValue(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      applyFontSize();
    } else if (e.key === 'Escape') {
      setIsInputMode(false);
      setInputValue('');
    }
  };

  const applyFontSize = () => {
    const size = parseInt(inputValue, 10);
    if (size && size >= 8 && size <= 128) {
      onFontSizeChange(size);
    }
    setIsInputMode(false);
    setInputValue('');
  };

  const handleBlur = () => {
    applyFontSize();
  };

  if (isInputMode) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="px-2 py-1 rounded border border-gray-300 w-16"
        style={{ 
          backgroundColor: 'var(--bg-content)', 
          color: 'var(--text-primary)',
          borderColor: 'var(--border-color)'
        }}
        placeholder="Size"
      />
    );
  }

  return (
    <select
      className="px-0 py-1 rounded border border-gray-300"
      style={{ 
        backgroundColor: 'var(--bg-content)', 
        color: 'var(--text-primary)',
        width: 60 
      }}
      onChange={e => onFontSizeChange(Number(e.target.value))}
      onDoubleClick={handleDoubleClick}
      value={fontSizeSelected}
    >
      {FONT_SIZES.map(size => (
        <option key={size} value={size}>{size}px</option>
      ))}
    </select>
  );
}
