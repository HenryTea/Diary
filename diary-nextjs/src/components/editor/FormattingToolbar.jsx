'use client';
import React from 'react';
import FontSelector from './FontSelector';
import FontSizeSelector from './FontSizeSelector';
import TextFormattingButtons from './TextFormattingButtons';
import ColorPicker from './ColorPicker';

export default function FormattingToolbar({
  // Font props
  selectedFont,
  onFontChange,
  GOOGLE_FONTS,
  customFonts,
  recentlyUsedFonts,
  onShowFontDialog,
  
  // Font size props
  fontSizeSelected,
  showCustomInput,
  customFontSize,
  FONT_SIZES,
  onFontSizeChange,
  onCustomFontSizeChange,
  
  // Formatting props
  isBold,
  isItalic,
  isUnderline,
  onBold,
  onItalic,
  onUnderline,
  
  // Color props
  selectedColor,
  showColorPicker,
  onToggleColorPicker,
  onColorChange
}) {
  return (
    <div className="flex items-center gap-2 py-2">
      <FontSelector
        selectedFont={selectedFont}
        onFontChange={onFontChange}
        GOOGLE_FONTS={GOOGLE_FONTS}
        customFonts={customFonts}
        recentlyUsedFonts={recentlyUsedFonts}
        onShowFontDialog={onShowFontDialog}
      />
      
      <FontSizeSelector
        fontSizeSelected={fontSizeSelected}
        showCustomInput={showCustomInput}
        customFontSize={customFontSize}
        FONT_SIZES={FONT_SIZES}
        onFontSizeChange={onFontSizeChange}
        onCustomFontSizeChange={onCustomFontSizeChange}
      />
      
      <TextFormattingButtons
        isBold={isBold}
        isItalic={isItalic}
        isUnderline={isUnderline}
        onBold={onBold}
        onItalic={onItalic}
        onUnderline={onUnderline}
      />
      
      <ColorPicker
        selectedColor={selectedColor}
        showColorPicker={showColorPicker}
        onToggleColorPicker={onToggleColorPicker}
        onColorChange={onColorChange}
      />
      
      <button className="px-2 py-1 rounded hover:bg-gray-200">✏️</button>
      <button className="px-2 py-1 rounded hover:bg-gray-200">👁️</button>
    </div>
  );
}
