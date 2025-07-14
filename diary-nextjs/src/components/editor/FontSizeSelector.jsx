'use client';
import React from 'react';

export default function FontSizeSelector({
  fontSizeSelected,
  showCustomInput,
  customFontSize,
  FONT_SIZES,
  onFontSizeChange,
  onCustomFontSizeChange
}) {
  return (
    <>
      <select
        className="px-0 py-1 rounded border border-gray-300"
        onChange={e => onFontSizeChange(e.target.value)}
        style={{ width: showCustomInput ? 90 : 60 }}
        value={showCustomInput ? 'custom' : fontSizeSelected}
      >
        {FONT_SIZES.map(size => (
          <option key={size} value={size}>{size}px</option>
        ))}
        <option value="custom">Custom...</option>
      </select>
      
      {showCustomInput && (
        <input
          type="number"
          min={8}
          max={128}
          value={customFontSize}
          onChange={e => onCustomFontSizeChange(Number(e.target.value))}
          className="px-2 py-1 rounded border border-gray-300 w-16 ml-2 h-7.5"
          placeholder="Custom"
          style={{ marginLeft: 4 }}
          autoFocus
        />
      )}
    </>
  );
}
