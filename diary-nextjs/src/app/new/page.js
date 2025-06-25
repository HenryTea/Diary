'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewEntryPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [customFontSize, setCustomFontSize] = useState(16);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [fontSizeSelected, setFontSizeSelected] = useState(16);
  const editorRef = useRef(null);
  const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  }, []);

  const handleSaveAndBack = async () => {
    if (text.trim() !== "") {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    }
    router.push('/');
  };

  const applyFontSize = (size) => {
    if (!size) return;
    document.execCommand('fontSize', false, 7);
    const editor = editorRef.current;
    if (editor) {
      const fonts = editor.getElementsByTagName('font');
      for (let i = 0; i < fonts.length; i++) {
        if (fonts[i].size === "7") {
          fonts[i].removeAttribute('size');
          fonts[i].style.fontSize = size + 'px';
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f5fafc] flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 w-full bg-[#e9f3f6] flex flex-col items-center border-b border-gray-200">
        <div className="w-full flex justify-between items-center px-4 py-2 relative h-12 overflow-hidden">
          <button className="relative w-70 h-8 overflow-hidden group bg-transparent border-none p-0 flex items-center justify-center" style={{boxShadow: 'none'}}>
            <span
              className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${text.trim() !== '' ? '-translate-y-full' : 'translate-y-0'}`}
            >
              <span className="mr-18 flex items-center hover:bg-gray-300 rounded transition-colors px-2 py-1" onClick={() => router.push("/")} title="Back to main page">
                <span className="text-2xl">&#8592;</span>
                <span className="ml-2 mr-1 text-black font-medium mt-1.5" style={{ marginRight: "5px" }}>
                  Back to Entries
                </span>
              </span>
            </span>
            <span
              className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${text.trim() !== '' ? '-translate-y-4' : 'translate-y-full'}`}
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
          <span className="text-xs font-semibold tracking-widest">{new Date().toLocaleString("en-US")}</span>
          <div className="w-8" />
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
            let html = e.currentTarget.innerHTML;
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
