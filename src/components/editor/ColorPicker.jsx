'use client';
import React, { useRef, useEffect } from 'react';

const themeColors = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EEEEEE', '#F3F3F3', '#FFFFFF',
  '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#9900FF', '#FF00FF'
];

const standardColors = [
  '#C00000', '#FF0000', '#FFC000', '#FFFF00', '#92D050', '#00B050', '#00B0F0', '#0070C0', '#002060', '#7030A0'
];

export default function ColorPicker({
  selectedColor,
  showColorPicker,
  onToggleColorPicker,
  onColorChange
}) {
  const colorPickerRef = useRef(null);

  // Close color picker when clicking outside (but not in editor area)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target) && showColorPicker) {
        // Check if the click was on the color picker button itself
        const colorPickerButton = event.target.closest('.color-picker-container');
        if (!colorPickerButton) {
          // Don't close if clicking in the editor area
          const editorArea = event.target.closest('[contenteditable]');
          if (!editorArea) {
            onToggleColorPicker();
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker, onToggleColorPicker]);

  return (
    <div className="relative color-picker-container">
      <button 
        className="px-2 py-1 rounded hover:bg-gray-200 relative"
        onClick={onToggleColorPicker}
        title="Text Color"
      >
        🎨
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 rounded-b"
          style={{ backgroundColor: selectedColor }}
        />
      </button>
      
      {/* Color Picker Dialog */}
      {showColorPicker && (
        <div 
          ref={colorPickerRef}
          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-3 z-50" 
          style={{ 
            width: '240px',
            backgroundColor: 'var(--bg-content)',
            borderColor: 'var(--border-color)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3">
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Theme Colors</div>
            <div className="grid grid-cols-10 gap-1">
              {themeColors.map((color, index) => (
                <button
                  key={`theme-${index}`}
                  className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: color,
                    borderColor: 'var(--border-color)'
                  }}
                  onClick={() => onColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-3">
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Standard Colors</div>
            <div className="grid grid-cols-10 gap-1">
              {standardColors.map((color, index) => (
                <button
                  key={`standard-${index}`}
                  className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: color,
                    borderColor: 'var(--border-color)'
                  }}
                  onClick={() => onColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          <div className="border-t pt-2" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Custom Color</div>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-full h-8 rounded border cursor-pointer"
              style={{ borderColor: 'var(--border-color)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
