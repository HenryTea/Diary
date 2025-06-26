'use client';
import React from 'react';

export default function FontSelector({
  selectedFont,
  onFontChange,
  GOOGLE_FONTS,
  customFonts,
  recentlyUsedFonts,
  onShowFontDialog
}) {
  return (
    <select
      className="px-2 py-1 rounded border border-gray-300"
      onChange={e => onFontChange(e.target.value)}
      value={selectedFont}
      style={{ minWidth: 120 }}
    >
      <option value="inherit">Default</option>
      
      {/* Recently used fonts */}
      {recentlyUsedFonts.length > 0 && (
        <>
          {recentlyUsedFonts.map(font => (
            <option key={`recent-${font}`} value={font} style={{ fontFamily: font }}>
              {font} (Recent)
            </option>
          ))}
          <option disabled>────────</option>
        </>
      )}
      
      {/* Main 3 Google Fonts */}
      {GOOGLE_FONTS.map(font => (
        <option key={font} value={font} style={{ fontFamily: font }}>
          {font}
        </option>
      ))}
      
      {/* Custom fonts */}
      {customFonts.length > 0 && (
        <>
          <option disabled>────────</option>
          {customFonts.map(font => (
            <option key={`custom-${font}`} value={font} style={{ fontFamily: font }}>
              {font} (Custom)
            </option>
          ))}
        </>
      )}
      
      <option disabled>────────</option>
      <option value="add-new-font">Add new font...</option>
    </select>
  );
}
