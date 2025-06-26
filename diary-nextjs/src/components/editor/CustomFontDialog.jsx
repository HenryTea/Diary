'use client';
import React from 'react';

export default function CustomFontDialog({
  showFontDialog,
  customFontName,
  customFontUrl,
  onFontNameChange,
  onFontUrlChange,
  onAddFont,
  onClose
}) {
  if (!showFontDialog) return null;

  return (
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
              onChange={e => onFontNameChange(e.target.value)}
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
              onChange={e => onFontUrlChange(e.target.value)}
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
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onAddFont}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
          >
            Add Font
          </button>
        </div>
      </div>
    </div>
  );
}
