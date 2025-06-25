'use client';
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditEntryPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [entry, setEntry] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customFontSize, setCustomFontSize] = useState(16);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [fontSizeSelected, setFontSizeSelected] = useState(16);
  const [selectedFont, setSelectedFont] = useState("inherit");
  const [showFontDialog, setShowFontDialog] = useState(false);
  const [customFontUrl, setCustomFontUrl] = useState("");
  const [customFontName, setCustomFontName] = useState("");
  const [customFonts, setCustomFonts] = useState([]);
  const [recentlyUsedFonts, setRecentlyUsedFonts] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [originalHtml, setOriginalHtml] = useState("");
  const editorRef = useRef(null);

  const FONT_SIZES = useMemo(() => [12, 14, 16, 18, 20, 24, 28, 32], []);
  
  // Popular Google Fonts (limited to 3)
  const GOOGLE_FONTS = useMemo(() => [
    "Roboto",
    "Open Sans", 
    "Lato"
  ], []);

  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        const found = data.find((e) => e.id.toString() === id);
        if (!found) throw new Error("Entry not found");
        setEntry(found);
        // Set text for word count (strip HTML tags for accurate count)
        const textContent = found.text ? found.text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ') : "";
        setText(textContent);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    fetchEntry();
  }, [id]);

  useEffect(() => {
    if (entry && editorRef.current) {
      // Check if the content is rich text (HTML) or plain text
      const content = entry.text || "";
      if (entry.isRichText || content.includes('<')) {
        // It's rich text, display as HTML
        editorRef.current.innerHTML = content;
        setOriginalHtml(content);
      } else {
        // It's plain text, convert \n to <br> for display
        const html = content.replace(/\n/g, '<br>');
        editorRef.current.innerHTML = html;
        setOriginalHtml(html);
      }
      setIsDirty(false);
    }
  }, [entry]);

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
        // Clean up font family string (remove quotes, split multiple fonts)
        fontFamily = fontFamily.replace(/['"]/g, '').split(',')[0].trim();
        
        // Check if it matches any of our known fonts
        const allFonts = ['inherit', ...GOOGLE_FONTS, ...customFonts, ...recentlyUsedFonts];
        const matchedFont = allFonts.find(font => {
          if (font === 'inherit') return fontFamily.includes('inherit') || fontFamily.includes('system');
          return fontFamily.toLowerCase().includes(font.toLowerCase()) || font.toLowerCase().includes(fontFamily.toLowerCase());
        });
        
        if (matchedFont) {
          setSelectedFont(matchedFont);
        } else {
          // If no match found, show the actual font family name
          setSelectedFont(fontFamily);
        }
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [FONT_SIZES, GOOGLE_FONTS, customFonts, recentlyUsedFonts]);

  const handleSaveAndBack = async () => {
    if (editorRef.current) {
      // Save the rich HTML content instead of plain text
      const htmlContent = editorRef.current.innerHTML;
      const res = await fetch("/api/entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          text: htmlContent, // Save HTML with all formatting
          isRichText: true // Flag to indicate this is rich text content
        }),
      });
      if (res.ok) {
        setEntry((prev) => (prev ? { ...prev, text: htmlContent } : prev));
        setOriginalHtml(htmlContent);
        setIsDirty(false);
      }
    }
    router.push("/");
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await fetch("/api/entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.push("/");
    }
  };

  const applyFontSize = (size) => {
    if (!size) return;
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;
    const span = document.createElement('span');
    span.style.fontSize = size + 'px';
    span.appendChild(range.extractContents());
    range.insertNode(span);
    range.setStartAfter(span);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    const fonts = editorRef.current.getElementsByTagName('font');
    while (fonts.length) {
      const font = fonts[0];
      const parent = font.parentNode;
      while (font.firstChild) parent.insertBefore(font.firstChild, font);
      parent.removeChild(font);
    }
    
    // Manually trigger change detection after font size change
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      setIsDirty(currentHtml !== originalHtml);
      // Update text state for word count (strip HTML tags)
      let plainText = currentHtml;
      plainText = plainText.replace(/<[^>]*>/g, '') // Remove HTML tags
                         .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
                         .replace(/&lt;/g, '<')   // Decode HTML entities
                         .replace(/&gt;/g, '>')
                         .replace(/&amp;/g, '&');
      setText(plainText);
    }
  };

  const applyFont = (fontFamily) => {
    if (fontFamily === 'add-new-font') {
      setShowFontDialog(true);
      return;
    }
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;
    
    // Create a span with the desired font family
    const span = document.createElement('span');
    span.style.fontFamily = fontFamily === 'inherit' ? 'inherit' : `"${fontFamily}", sans-serif`;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    
    // Move cursor after the span
    range.setStartAfter(span);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    setSelectedFont(fontFamily);
    
    // Add to recently used fonts if not already there
    if (fontFamily !== 'inherit') {
      setRecentlyUsedFonts(prev => {
        const filtered = prev.filter(f => f !== fontFamily);
        return [fontFamily, ...filtered].slice(0, 2); // Keep only 2 recent fonts
      });
    }
    
    // Load Google Font if not already loaded
    if (fontFamily !== 'inherit' && !customFonts.includes(fontFamily)) {
      loadGoogleFont(fontFamily);
    }

    // Manually trigger change detection
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      setIsDirty(currentHtml !== originalHtml);
      // Update text state for word count (strip HTML tags)
      let plainText = currentHtml;
      plainText = plainText.replace(/<[^>]*>/g, '') // Remove HTML tags
                         .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
                         .replace(/&lt;/g, '<')   // Decode HTML entities
                         .replace(/&gt;/g, '>')
                         .replace(/&amp;/g, '&');
      setText(plainText);
    }
  };

  const loadGoogleFont = (fontName) => {
    const linkId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(linkId)) return;
    
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}&display=swap`;
    document.head.appendChild(link);
  };

  const handleFontUrlChange = (url) => {
    setCustomFontUrl(url);
    
    // Auto-detect and convert Google Fonts URLs
    if (url.includes('fonts.google.com')) {
      // Handle Google Fonts specimen page URL (e.g., https://fonts.google.com/specimen/Roboto)
      const specimenMatch = url.match(/fonts\.google\.com\/specimen\/([^/?]+)/);
      if (specimenMatch) {
        const fontName = specimenMatch[1].replace(/\+/g, ' ');
        const cssUrl = `https://fonts.googleapis.com/css2?family=${specimenMatch[1]}&display=swap`;
        setCustomFontName(fontName);
        setCustomFontUrl(cssUrl);
        
        // Auto-load the font immediately
        loadGoogleFont(fontName);
        return;
      }
      
      // Handle Google Fonts CSS URL (e.g., https://fonts.googleapis.com/css2?family=Roboto)
      const cssMatch = url.match(/family=([^&:]+)/);
      if (cssMatch) {
        const fontName = cssMatch[1].replace(/\+/g, ' ').replace(/:.*/, '');
        setCustomFontName(fontName);
        
        // Auto-load the font immediately
        loadGoogleFont(fontName);
        return;
      }
    }
    
    // For other URLs, try to extract font name from the URL
    if (url.includes('fonts.googleapis.com')) {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart !== 'css' && lastPart !== 'css2') {
        setCustomFontName(lastPart.replace(/\+/g, ' ').replace(/\?.*/, ''));
      }
    }
  };

  const handleAddCustomFont = () => {
    
    let finalUrl = customFontUrl.trim();
    let finalName = customFontName.trim();
    
    // Auto-detect and convert Google Fonts specimen URLs
    if (finalUrl.includes('fonts.google.com/specimen/')) {
      const fontNameFromUrl = finalUrl.split('/specimen/')[1];
      if (fontNameFromUrl) {
        // Extract font name from URL (decode URI component for spaces)
        const decodedFontName = decodeURIComponent(fontNameFromUrl).replace(/\+/g, ' ');
        finalName = decodedFontName;
        // Convert to CSS import URL
        finalUrl = `https://fonts.googleapis.com/css2?family=${fontNameFromUrl.replace(/\s+/g, '+')}&display=swap`;
        
        // Update the input fields to show the converted values
        setCustomFontName(finalName);
        setCustomFontUrl(finalUrl);
      }
    }
    
    // Load custom font
    const linkId = `custom-font-${finalName.replace(/\s+/g, '-').toLowerCase()}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = finalUrl;
      document.head.appendChild(link);
    }
    
    // Add to custom fonts list
    setCustomFonts(prev => [...prev, finalName]);
    setCustomFontUrl("");
    setCustomFontName("");
    setShowFontDialog(false);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!entry) return <div>Entry not found.</div>;

  return (
    <div className="min-h-screen bg-[#f5fafc] flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 w-full bg-[#e9f3f6] flex flex-col items-center border-b border-gray-200">
        <div className="w-full flex justify-between items-center px-4 py-2 relative h-12 overflow-hidden">
          <button className="relative w-70 h-8 overflow-hidden group bg-transparent border-none p-0 flex items-center justify-center" style={{boxShadow: 'none'}}>
            <span
              className={
                `absolute inset-0 flex items-center justify-center transition-transform duration-300 ${isDirty ? '-translate-y-full' : 'translate-y-0'}`
              }
            >
              <span className="mr-18 flex items-center hover:bg-gray-300 rounded transition-colors px-2 py-1" onClick={() => router.push("/")} title="Back to main page">
                <span className="text-2xl">&#8592;</span>
                <span className="ml-2 mr-1 text-black font-medium mt-1.5" style={{ marginRight: "5px" }}>
                  Back to Entries
                </span>
              </span>
            </span>
            <span
              className={
                `absolute inset-0 flex items-center justify-center transition-transform duration-300 ${isDirty ? '-translate-y-4' : 'translate-y-full'}`
              }
            >
              <span className="flex items-center hover:bg-green-100 rounded transition-colors px-2 py-1 mt-10" onClick={handleSaveAndBack} title="Save and back to Entries">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-7 h-7 text-green-600 mb-1 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                <span className="mr-1 text-green-600 font-medium" style={{ marginRight: "5px" }}>
                  Save and back to Entries
                </span>
              </span>
            </span>
          </button>
          <span className="text-xs font-semibold tracking-widest ml-50">
            {new Date(entry.date).toLocaleString("en-US")}
          </span>
          <div className="w-8" />
          <button
            className="text-2xl text-red-600 hover:bg-red-100 rounded transition-colors px-2 py-1 mr-2"
            onClick={handleDelete}
            title="Delete entry"
          >
            🗑️
          </button>
        </div>
        <div className="flex items-center gap-2 py-2">
          <button className="px-2 py-1 rounded hover:bg-gray-200">+</button>
          
          {/* Font Family Selector */}
          <select
            className="px-2 py-1 rounded border border-gray-300"
            onChange={e => applyFont(e.target.value)}
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
          
          <select
            className="px-0 py-1 rounded border border-gray-300 "
            onChange={e => {
              const val = e.target.value;
              if (val === 'custom') {
                setShowCustomInput(true);
              } else {
                setShowCustomInput(false);
                setFontSizeSelected(Number(val));
                applyFontSize(Number(val));
              }
            }}
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
              onChange={e => {
                setCustomFontSize(Number(e.target.value));
                applyFontSize(Number(e.target.value));
              }}
              className="px-2 py-1 rounded border border-gray-300 w-16 ml-2 h-7.5"
              placeholder="Custom"
              style={{ marginLeft: 4 }}
              autoFocus
            />
          )}
          <button className="px-2 py-1 rounded hover:bg-gray-200 font-bold">B</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200 italic">I</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200 underline">U</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">🎨</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">✏️</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">👁️</button>
        </div>
        
      </div>
      {/* Editor Area */}
      <div className="flex-1 bg-white mx-2 my-4 rounded shadow-sm p-4 min-h-[60vh]">
        <div
          ref={editorRef}
          className="w-full h-full min-h-[50vh] resize-none outline-none bg-transparent text-base text-black placeholder-gray-400"
          contentEditable
          suppressContentEditableWarning
          style={{ fontFamily: "inherit", fontSize: 16, whiteSpace: 'pre-wrap' }}
          onInput={e => {
            const currentHtml = e.currentTarget.innerHTML;
            setIsDirty(currentHtml !== originalHtml);
            // Update text state for word count (strip HTML tags)
            let plainText = currentHtml;
            plainText = plainText.replace(/<[^>]*>/g, '') // Remove HTML tags
                               .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
                               .replace(/&lt;/g, '<')   // Decode HTML entities
                               .replace(/&gt;/g, '>')
                               .replace(/&amp;/g, '&');
            setText(plainText);
          }}
        />
      </div>
      {/* Bottom Bar */}
      <div className="sticky bottom-0 z-30 w-full bg-[#f5fafc] border-t border-gray-200 flex items-center justify-between px-4 py-2">
        <div className="flex gap-3 items-center">
          <button className="text-xl">🖼️</button>
          <button className="text-xl">📍</button>
          <button className="text-xl">☀️</button>
          <button className="text-xl">🏃</button>
          <button className="text-xl">🏷️</button>
        </div>
        <div className="text-xs text-gray-500">
          Words {text.trim().split(/\s+/).filter(Boolean).length} · Characters {text.length}
        </div>
      </div>
      
      {/* Custom Font Dialog */}
      {showFontDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Custom Font</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Name
                </label>
                <input
                  type="text"
                  value={customFontName}
                  onChange={e => setCustomFontName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., My Custom Font"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font URL (Google Fonts or CSS Link)
                </label>
                <input
                  type="url"
                  value={customFontUrl}
                  onChange={e => handleFontUrlChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://fonts.googleapis.com/css2?family=... or https://fonts.google.com/specimen/..."
                />
              </div>
              <div className="text-xs text-gray-500">
                <p>You can get Google Font URLs from <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">fonts.google.com</a></p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowFontDialog(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomFont}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
              >
                Add Font
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
