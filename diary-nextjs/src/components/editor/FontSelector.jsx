'use client';
import React from 'react';

export default function FontSelector({
  selectedFont,
  onFontChange,
  GOOGLE_FONTS,
  customFonts,
  recentlyUsedFonts,
  onShowFontDialog,
  onRemoveCustomFont
}) {
  const getFontName = (font) => {
    return typeof font === 'string' ? font : font.name;
  };

  const handleFontChange = (value) => {
    if (value.startsWith('remove-')) {
      const fontToRemove = value.replace('remove-', '');
      const fontObject = customFonts.find(font => getFontName(font) === fontToRemove);
      if (fontObject && window.confirm(`Remove "${getFontName(fontObject)}" from custom fonts?`)) {
        onRemoveCustomFont(fontObject);
      }
      return;
    }
    onFontChange(value);
  };

  return (
    <select
      className="px-2 py-1 rounded border border-gray-300"
      onChange={e => handleFontChange(e.target.value)}
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
          {customFonts.map(font => {
            const fontName = getFontName(font);
            return (
              <optgroup key={`custom-group-${fontName}`} label={`${fontName} (Custom)`}>
                <option 
                  key={`custom-${fontName}`} 
                  value={fontName} 
                  style={{ fontFamily: fontName }}
                >
                  {fontName}
                </option>
                <option 
                  key={`remove-${fontName}`} 
                  value={`remove-${fontName}`}
                  style={{ color: '#dc2626', fontSize: '0.9em' }}
                >
                  🗑️ Remove {fontName}
                </option>
              </optgroup>
            );
          })}
        </>
      )}
      
      <option disabled>────────</option>
      <option value="add-new-font">Add new font...</option>
    </select>
  );
}
