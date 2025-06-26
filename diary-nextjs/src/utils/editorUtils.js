/**
 * Rich Text Editor Utilities
 * Contains all the formatting logic for the editor
 */

export const checkFormatting = (node, type, editorRef) => {
  let currentNode = node;
  while (currentNode && currentNode !== editorRef.current) {
    const tagName = currentNode.tagName?.toLowerCase();
    const computed = window.getComputedStyle(currentNode);
    
    switch (type) {
      case 'bold':
        if (tagName === 'strong' || tagName === 'b' || 
            computed.fontWeight === 'bold' || 
            parseInt(computed.fontWeight) >= 700) {
          return true;
        }
        break;
      case 'italic':
        if (tagName === 'em' || tagName === 'i' || 
            computed.fontStyle === 'italic') {
          return true;
        }
        break;
      case 'underline':
        if (tagName === 'u' || 
            computed.textDecoration.includes('underline')) {
          return true;
        }
        break;
    }
    currentNode = currentNode.parentNode;
  }
  return false;
};

export const applyFontSize = (size, editorRef, onHtmlChange) => {
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
  
  // Remove legacy font tags
  const fonts = editorRef.current.getElementsByTagName('font');
  while (fonts.length) {
    const font = fonts[0];
    const parent = font.parentNode;
    while (font.firstChild) parent.insertBefore(font.firstChild, font);
    parent.removeChild(font);
  }
  
  onHtmlChange();
};

export const applyFont = (fontFamily, editorRef, loadGoogleFont, onHtmlChange) => {
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
  
  // Load Google Font if needed
  if (fontFamily !== 'inherit') {
    loadGoogleFont(fontFamily);
  }

  onHtmlChange();
};

export const applyBold = (editorRef, checkFormatting, onHtmlChange) => {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!editorRef.current.contains(range.commonAncestorContainer)) return;
  
  let node = selection.anchorNode;
  if (node && node.nodeType === 3) node = node.parentNode;
  
  if (checkFormatting(node, 'bold', editorRef)) {
    document.execCommand('bold', false, null);
  } else {
    const strong = document.createElement('strong');
    strong.appendChild(range.extractContents());
    range.insertNode(strong);
    
    range.setStartAfter(strong);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  onHtmlChange();
};

export const applyItalic = (editorRef, checkFormatting, onHtmlChange) => {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!editorRef.current.contains(range.commonAncestorContainer)) return;
  
  let node = selection.anchorNode;
  if (node && node.nodeType === 3) node = node.parentNode;
  
  if (checkFormatting(node, 'italic', editorRef)) {
    document.execCommand('italic', false, null);
  } else {
    const em = document.createElement('em');
    em.appendChild(range.extractContents());
    range.insertNode(em);
    
    range.setStartAfter(em);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  onHtmlChange();
};

export const applyUnderline = (editorRef, checkFormatting, onHtmlChange) => {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!editorRef.current.contains(range.commonAncestorContainer)) return;
  
  let node = selection.anchorNode;
  if (node && node.nodeType === 3) node = node.parentNode;
  
  if (checkFormatting(node, 'underline', editorRef)) {
    document.execCommand('underline', false, null);
  } else {
    const u = document.createElement('u');
    u.appendChild(range.extractContents());
    range.insertNode(u);
    
    range.setStartAfter(u);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  onHtmlChange();
};

export const applyTextColor = (color, editorRef, onHtmlChange) => {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!editorRef.current.contains(range.commonAncestorContainer)) return;
  
  const span = document.createElement('span');
  span.style.color = color;
  span.appendChild(range.extractContents());
  range.insertNode(span);
  
  range.setStartAfter(span);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  
  onHtmlChange();
};

export const loadGoogleFont = (fontName) => {
  const linkId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(linkId)) return;
  
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}&display=swap`;
  document.head.appendChild(link);
};

export const handleFontUrlChange = (url, setCustomFontUrl, setCustomFontName, loadGoogleFont) => {
  setCustomFontUrl(url);
  
  // Auto-detect and convert Google Fonts URLs
  if (url.includes('fonts.google.com')) {
    const specimenMatch = url.match(/fonts\.google\.com\/specimen\/([^/?]+)/);
    if (specimenMatch) {
      const fontName = specimenMatch[1].replace(/\+/g, ' ');
      const cssUrl = `https://fonts.googleapis.com/css2?family=${specimenMatch[1]}&display=swap`;
      setCustomFontName(fontName);
      setCustomFontUrl(cssUrl);
      loadGoogleFont(fontName);
      return;
    }
    
    const cssMatch = url.match(/family=([^&:]+)/);
    if (cssMatch) {
      const fontName = cssMatch[1].replace(/\+/g, ' ').replace(/:.*/, '');
      setCustomFontName(fontName);
      loadGoogleFont(fontName);
      return;
    }
  }
  
  if (url.includes('fonts.googleapis.com')) {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart !== 'css' && lastPart !== 'css2') {
      setCustomFontName(lastPart.replace(/\+/g, ' ').replace(/\?.*/, ''));
    }
  }
};

export const stripHtmlTags = (html) => {
  return html.replace(/<[^>]*>/g, '') // Remove HTML tags
             .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
             .replace(/&lt;/g, '<')   // Decode HTML entities
             .replace(/&gt;/g, '>')
             .replace(/&amp;/g, '&');
};
