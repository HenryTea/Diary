'use client';
import React, { useState, useRef, useEffect } from 'react';

export default function FontSelector({
  selectedFont,
  onFontChange,
  GOOGLE_FONTS,
  customFonts,
  recentlyUsedFonts,
  onShowFontDialog
}) {
  const [isInputMode, setIsInputMode] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filteredFonts, setFilteredFonts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);

  const getFontName = (font) => {
    return typeof font === 'string' ? font : font.name;
  };

  // Get all available fonts
  const getAllFonts = () => {
    const customFontNames = customFonts.map(getFontName);
    return [
      'Default',
      ...recentlyUsedFonts.map(font => `${font} (Recent)`),
      ...GOOGLE_FONTS,
      ...customFontNames.map(font => `${font} (Custom)`)
    ];
  };

  // Filter fonts based on search
  useEffect(() => {
    if (searchValue) {
      const allFonts = getAllFonts();
      const filtered = allFonts.filter(font =>
        font.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredFonts(filtered);
      setSelectedIndex(-1);
    } else {
      setFilteredFonts([]);
    }
  }, [searchValue, GOOGLE_FONTS, customFonts, recentlyUsedFonts]);

  const handleDoubleClick = () => {
    setIsInputMode(true);
    setSearchValue(selectedFont === 'inherit' ? '' : selectedFont);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && filteredFonts[selectedIndex]) {
        selectFont(filteredFonts[selectedIndex]);
      } else if (searchValue.trim()) {
        selectFont(searchValue.trim());
      }
    } else if (e.key === 'Escape') {
      setIsInputMode(false);
      setSearchValue('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredFonts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    }
  };

  const selectFont = (font) => {
    // Clean font name (remove (Recent), (Custom) suffixes)
    let cleanFont = font.replace(/ \((Recent|Custom)\)$/, '');
    if (cleanFont === 'Default') cleanFont = 'inherit';
    
    onFontChange(cleanFont);
    setIsInputMode(false);
    setSearchValue('');
    setFilteredFonts([]);
  };

  const handleBlur = () => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      setIsInputMode(false);
      setSearchValue('');
      setFilteredFonts([]);
    }, 150);
  };

  const handleFontChange = (value) => {
    if (value === 'add-new-font') {
      onShowFontDialog();
      return;
    }
    onFontChange(value);
  };

  if (isInputMode) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="px-2 py-1 rounded border border-gray-300"
          style={{ 
            backgroundColor: 'var(--bg-content)', 
            color: 'var(--text-primary)', 
            borderColor: 'var(--border-color)',
            minWidth: 120 
          }}
          placeholder="Search fonts..."
        />
        
        {filteredFonts.length > 0 && (
          <div 
            className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-48 overflow-y-auto"
            style={{ 
              backgroundColor: 'var(--bg-content)', 
              borderColor: 'var(--border-color)',
              minWidth: 200
            }}
          >
            {filteredFonts.map((font, index) => (
              <div
                key={font}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                  index === selectedIndex ? 'bg-blue-100' : ''
                }`}
                style={{ 
                  backgroundColor: index === selectedIndex ? 'var(--sidebar-hover)' : 'transparent',
                  color: searchValue && font.toLowerCase().includes(searchValue.toLowerCase()) 
                    ? 'var(--text-primary)' 
                    : 'var(--text-secondary)',
                  fontFamily: font.replace(/ \((Recent|Custom)\)$/, '')
                }}
                onClick={() => selectFont(font)}
              >
                {font}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <select
      className="px-2 py-1 rounded border border-gray-300"
      style={{ 
        backgroundColor: 'var(--bg-content)', 
        color: 'var(--text-primary)', 
        minWidth: 120 
      }}
      onChange={e => handleFontChange(e.target.value)}
      onDoubleClick={handleDoubleClick}
      value={selectedFont}
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
              <option 
                key={`custom-${fontName}`} 
                value={fontName} 
                style={{ fontFamily: fontName }}
              >
                {fontName} (Custom)
              </option>
            );
          })}
        </>
      )}
      
      <option disabled>────────</option>
      <option value="add-new-font">Add new font...</option>
    </select>
  );
}
