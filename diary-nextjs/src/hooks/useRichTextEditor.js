import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  checkFormatting, 
  stripHtmlTags, 
  loadGoogleFont,
  handleFontUrlChange as handleFontUrl
} from '../utils/editorUtils';

export const useRichTextEditor = (entry, originalHtml, setOriginalHtml, setIsDirty) => {
  // Editor state
  const [customFontSize, setCustomFontSize] = useState(16);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [fontSizeSelected, setFontSizeSelected] = useState(16);
  const [selectedFont, setSelectedFont] = useState("inherit");
  const [showFontDialog, setShowFontDialog] = useState(false);
  const [customFontUrl, setCustomFontUrl] = useState("");
  const [customFontName, setCustomFontName] = useState("");
  const [customFonts, setCustomFonts] = useState([]);
  const [recentlyUsedFonts, setRecentlyUsedFonts] = useState([]);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [text, setText] = useState("");

  const editorRef = useRef(null);

  const FONT_SIZES = useMemo(() => [12, 14, 16, 18, 20, 24, 28, 32], []);
  const GOOGLE_FONTS = useMemo(() => ["Roboto", "Open Sans", "Lato"], []);

  // Handle HTML change and update states
  const handleHtmlChange = () => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      setIsDirty(currentHtml !== originalHtml);
      const plainText = stripHtmlTags(currentHtml);
      setText(plainText);
    }
  };

  // Initialize editor content
  useEffect(() => {
    if (entry && editorRef.current) {
      const content = entry.text || "";
      if (entry.isRichText || content.includes('<')) {
        editorRef.current.innerHTML = content;
        setOriginalHtml(content);
      } else {
        const html = content.replace(/\n/g, '<br>');
        editorRef.current.innerHTML = html;
        setOriginalHtml(html);
      }
      setIsDirty(false);
      
      // Set initial text for word count
      const textContent = content ? stripHtmlTags(content) : "";
      setText(textContent);
    }
  }, [entry, setOriginalHtml, setIsDirty]);

  // Handle selection changes to update formatting states
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = document.getSelection();
      if (!selection || !editorRef.current) return;
      if (!editorRef.current.contains(selection.anchorNode)) return;
      
      let node = selection.anchorNode;
      if (node && node.nodeType === 3) node = node.parentNode;
      
      if (node && node.nodeType === 1) {
        const computed = window.getComputedStyle(node);
        
        // Detect font size
        let size = parseInt(computed.fontSize, 10);
        if (FONT_SIZES.includes(size)) {
          setFontSizeSelected(size);
          setShowCustomInput(false);
        } else {
          setFontSizeSelected(size);
          setCustomFontSize(size);
          setShowCustomInput(true);
        }
        
        // Detect font family
        let fontFamily = computed.fontFamily;
        fontFamily = fontFamily.replace(/['"]/g, '').split(',')[0].trim();
        
        const allFonts = ['inherit', ...GOOGLE_FONTS, ...customFonts, ...recentlyUsedFonts];
        const matchedFont = allFonts.find(font => {
          if (font === 'inherit') return fontFamily.includes('inherit') || fontFamily.includes('system');
          return fontFamily.toLowerCase().includes(font.toLowerCase()) || font.toLowerCase().includes(fontFamily.toLowerCase());
        });
        
        if (matchedFont) {
          setSelectedFont(matchedFont);
        } else {
          setSelectedFont(fontFamily);
        }
        
        // Detect formatting states
        setIsBold(checkFormatting(node, 'bold', editorRef));
        setIsItalic(checkFormatting(node, 'italic', editorRef));
        setIsUnderline(checkFormatting(node, 'underline', editorRef));
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [FONT_SIZES, GOOGLE_FONTS, customFonts, recentlyUsedFonts]);

  // Click outside handler for color picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColorPicker && !event.target.closest('.color-picker-container')) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  // Font handling functions
  const handleFontUrlChange = (url) => {
    handleFontUrl(url, setCustomFontUrl, setCustomFontName, loadGoogleFont);
  };

  const handleAddCustomFont = () => {
    let finalUrl = customFontUrl.trim();
    let finalName = customFontName.trim();
    
    if (finalUrl.includes('fonts.google.com/specimen/')) {
      const fontNameFromUrl = finalUrl.split('/specimen/')[1];
      if (fontNameFromUrl) {
        const decodedFontName = decodeURIComponent(fontNameFromUrl).replace(/\+/g, ' ');
        finalName = decodedFontName;
        finalUrl = `https://fonts.googleapis.com/css2?family=${fontNameFromUrl.replace(/\s+/g, '+')}&display=swap`;
        setCustomFontName(finalName);
        setCustomFontUrl(finalUrl);
      }
    }
    
    const linkId = `custom-font-${finalName.replace(/\s+/g, '-').toLowerCase()}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = finalUrl;
      document.head.appendChild(link);
    }
    
    setCustomFonts(prev => [...prev, finalName]);
    setCustomFontUrl("");
    setCustomFontName("");
    setShowFontDialog(false);
  };

  return {
    // Editor ref
    editorRef,
    
    // State
    customFontSize,
    showCustomInput,
    fontSizeSelected,
    selectedFont,
    showFontDialog,
    customFontUrl,
    customFontName,
    customFonts,
    recentlyUsedFonts,
    isBold,
    isItalic,
    isUnderline,
    showColorPicker,
    selectedColor,
    text,
    
    // Constants
    FONT_SIZES,
    GOOGLE_FONTS,
    
    // Setters
    setCustomFontSize,
    setShowCustomInput,
    setFontSizeSelected,
    setSelectedFont,
    setShowFontDialog,
    setCustomFontUrl,
    setCustomFontName,
    setRecentlyUsedFonts,
    setShowColorPicker,
    setSelectedColor,
    
    // Functions
    handleHtmlChange,
    handleFontUrlChange,
    handleAddCustomFont
  };
};
