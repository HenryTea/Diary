'use client';
import React, { useEffect, useState } from "react";
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
  const [isDirty, setIsDirty] = useState(false);
  const editorRef = React.useRef(null);

  const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        const found = data.find((e) => e.id.toString() === id);
        if (!found) throw new Error("Entry not found");
        setEntry(found);
        setText(found.text);
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
      // Convert \n to <br> for display
      const html = (entry.text || "").replace(/\n/g, '<br>');
      editorRef.current.innerHTML = html;
      setIsDirty(false);
    }
  }, [entry]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = document.getSelection();
      if (!selection || !editorRef.current) return;
      if (!editorRef.current.contains(selection.anchorNode)) return;
      let node = selection.anchorNode;
      if (node && node.nodeType === 3) node = node.parentNode; // text node -> parent
      if (node && node.nodeType === 1) {
        const computed = window.getComputedStyle(node);
        let size = parseInt(computed.fontSize, 10);
        // Snap to closest in FONT_SIZES or use custom
        if (FONT_SIZES.includes(size)) {
          setFontSizeSelected(size);
          setShowCustomInput(false);
        } else {
          setFontSizeSelected(size);
          setCustomFontSize(size);
          setShowCustomInput(true);
        }
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [FONT_SIZES]);

  const handleSaveAndBack = async () => {
    if (text.trim() !== "") {
      const res = await fetch("/api/entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, text }),
      });
      if (res.ok) {
        setEntry((prev) => (prev ? { ...prev, text } : prev));
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
    // Create a span with the desired font size
    const span = document.createElement('span');
    span.style.fontSize = size + 'px';
    span.appendChild(range.extractContents());
    range.insertNode(span);
    // Move cursor after the span
    range.setStartAfter(span);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    // Clean up any <font> tags (legacy)
    const fonts = editorRef.current.getElementsByTagName('font');
    while (fonts.length) {
      const font = fonts[0];
      const parent = font.parentNode;
      while (font.firstChild) parent.insertBefore(font.firstChild, font);
      parent.removeChild(font);
    }
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
          <button className="px-2 py-1 rounded hover:bg-gray-200">T</button>
          
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
            // Compare HTML for isDirty, so font changes also trigger save
            const currentHtml = e.currentTarget.innerHTML;
            const originalHtml = (entry?.text || "").replace(/\n/g, '<br>');
            setIsDirty(currentHtml !== originalHtml);
            let html = currentHtml;
            html = html.replace(/<div><br><\/div>/g, '\n') 
                       .replace(/<div>/g, '\n')
                       .replace(/<\/div>/g, '')
                       .replace(/<br>/g, '\n');
            setText(html);
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
    </div>
  );
}
