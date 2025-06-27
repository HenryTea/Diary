'use client';
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import FormattingToolbar from "../../../components/editor/FormattingToolbar";
import CustomFontDialog from "../../../components/editor/CustomFontDialog";
import SaveButton from "../../../components/ui/SaveButton";
import { useRichTextEditor } from "../../../hooks/useRichTextEditor";
import { 
  applyFontSize, 
  applyFont, 
  applyBold, 
  applyItalic, 
  applyUnderline, 
  applyTextColor,
  checkFormatting,
  loadGoogleFont
} from "../../../utils/editorUtils";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  // Basic state
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [originalHtml, setOriginalHtml] = useState("");

  // Rich text editor hook
  const editor = useRichTextEditor(entry, originalHtml, setOriginalHtml, setIsDirty);

  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      try {
        // Handle new entry case
        if (id === 'new') {
          setEntry({
            id: 'new',
            text: '',
            date: new Date().toISOString(),
            isRichText: true
          });
          setOriginalHtml('');
          setLoading(false);
          return;
        }

        const res = await fetch("/api/entries");
        const data = await res.json();
        const found = data.find((e) => e.id.toString() === id);
        if (!found) throw new Error("Entry not found");
        setEntry(found);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    fetchEntry();
  }, [id]);

  const handleSaveAndBack = async () => {
    if (editor.editorRef.current) {
      const htmlContent = editor.editorRef.current.innerHTML;
      
      if (id === 'new') {
        // Create new entry
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: htmlContent,
            isRichText: true
          }),
        });
        if (res.ok) {
          const newEntry = await res.json();
          setEntry(newEntry);
          setOriginalHtml(htmlContent);
          setIsDirty(false);
        }
      } else {
        // Update existing entry
        const res = await fetch("/api/entries", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id, 
            text: htmlContent,
            isRichText: true
          }),
        });
        if (res.ok) {
          setEntry((prev) => (prev ? { ...prev, text: htmlContent } : prev));
          setOriginalHtml(htmlContent);
          setIsDirty(false);
        }
      }
    }
    router.push("/");
  };

  const handleDelete = async () => {
    if (id === 'new') {
      // Can't delete a new entry that hasn't been saved yet
      if (window.confirm("Discard this new entry?")) {
        router.push("/");
      }
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await fetch("/api/entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.push("/");
    }
  };

  // Formatting handlers
  const handleFontSizeChange = (value) => {
    if (value === 'custom') {
      editor.setShowCustomInput(true);
    } else {
      editor.setShowCustomInput(false);
      editor.setFontSizeSelected(Number(value));
      applyFontSize(Number(value), editor.editorRef, editor.handleHtmlChange);
    }
  };

  const handleCustomFontSizeChange = (size) => {
    editor.setCustomFontSize(size);
    applyFontSize(size, editor.editorRef, editor.handleHtmlChange);
  };

  const handleFontChange = (fontFamily) => {
    if (fontFamily === 'add-new-font') {
      editor.setShowFontDialog(true);
      return;
    }
    
    applyFont(fontFamily, editor.editorRef, loadGoogleFont, editor.handleHtmlChange);
    editor.setSelectedFont(fontFamily);
    
    // Add to recently used fonts
    if (fontFamily !== 'inherit') {
      editor.setRecentlyUsedFonts(prev => {
        const filtered = prev.filter(f => f !== fontFamily);
        return [fontFamily, ...filtered].slice(0, 2);
      });
    }
  };

  const handleBold = () => {
    applyBold(editor.editorRef, checkFormatting, editor.handleHtmlChange);
  };

  const handleItalic = () => {
    applyItalic(editor.editorRef, checkFormatting, editor.handleHtmlChange);
  };

  const handleUnderline = () => {
    applyUnderline(editor.editorRef, checkFormatting, editor.handleHtmlChange);
  };

  const handleColorChange = (color) => {
    applyTextColor(color, editor.editorRef, editor.handleHtmlChange);
    editor.setSelectedColor(color);
    editor.setShowColorPicker(false);
  };

  const handleToggleColorPicker = () => {
    editor.setShowColorPicker(!editor.showColorPicker);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!entry) return <div>Entry not found.</div>;

  return (
    <div className="min-h-screen bg-[#f5fafc] flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 w-full bg-[#e9f3f6] flex flex-col items-center border-b border-gray-200">
        <div className="w-full flex justify-between items-center px-4 py-2 relative h-12 overflow-hidden">
          <SaveButton 
            isDirty={isDirty}
            onSave={handleSaveAndBack}
            onBack={() => router.push("/")}
            saveText={id === 'new' ? "Create" : "Save"}
          />
          
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
        
        <FormattingToolbar
          // Font props
          selectedFont={editor.selectedFont}
          onFontChange={handleFontChange}
          GOOGLE_FONTS={editor.GOOGLE_FONTS}
          customFonts={editor.customFonts}
          recentlyUsedFonts={editor.recentlyUsedFonts}
          onShowFontDialog={() => editor.setShowFontDialog(true)}
          
          // Font size props
          fontSizeSelected={editor.fontSizeSelected}
          showCustomInput={editor.showCustomInput}
          customFontSize={editor.customFontSize}
          FONT_SIZES={editor.FONT_SIZES}
          onFontSizeChange={handleFontSizeChange}
          onCustomFontSizeChange={handleCustomFontSizeChange}
          
          // Formatting props
          isBold={editor.isBold}
          isItalic={editor.isItalic}
          isUnderline={editor.isUnderline}
          onBold={handleBold}
          onItalic={handleItalic}
          onUnderline={handleUnderline}
          
          // Color props
          selectedColor={editor.selectedColor}
          showColorPicker={editor.showColorPicker}
          onToggleColorPicker={handleToggleColorPicker}
          onColorChange={handleColorChange}
        />
      </div>
      
      {/* Editor Area */}
      <div className="flex-1 bg-white mx-2 my-4 rounded shadow-sm p-4 min-h-[60vh]">
        <div
          ref={editor.editorRef}
          className="w-full h-full min-h-[50vh] resize-none outline-none bg-transparent text-base text-black placeholder-gray-400"
          contentEditable
          suppressContentEditableWarning
          style={{ fontFamily: "inherit", fontSize: 16, whiteSpace: 'pre-wrap' }}
          onInput={editor.handleHtmlChange}
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
          Words {editor.text.trim().split(/\s+/).filter(Boolean).length} · Characters {editor.text.length}
        </div>
      </div>
      
      {/* Custom Font Dialog */}
      <CustomFontDialog
        showFontDialog={editor.showFontDialog}
        customFontName={editor.customFontName}
        customFontUrl={editor.customFontUrl}
        onFontNameChange={editor.setCustomFontName}
        onFontUrlChange={editor.handleFontUrlChange}
        onAddFont={editor.handleAddCustomFont}
        onClose={() => editor.setShowFontDialog(false)}
      />
    </div>
  );
}
