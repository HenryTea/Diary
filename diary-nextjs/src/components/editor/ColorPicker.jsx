'use client';
import React from 'react';

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
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-3 z-50" style={{ width: '240px' }}>
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-2">Theme Colors</div>
            <div className="grid grid-cols-10 gap-1">
              {themeColors.map((color, index) => (
                <button
                  key={`theme-${index}`}
                  className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-2">Standard Colors</div>
            <div className="grid grid-cols-10 gap-1">
              {standardColors.map((color, index) => (
                <button
                  key={`standard-${index}`}
                  className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          <div className="border-t pt-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Custom Color</div>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-full h-8 rounded border border-gray-300 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
