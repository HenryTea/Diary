'use client';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ShareDialog({ isOpen, onClose, entry, onSave }) {
  const [shareToSocial, setShareToSocial] = useState(false);
  const { token } = useAuth();

  // Update shareToSocial when entry changes
  React.useEffect(() => {
    if (entry) {
      setShareToSocial(entry.is_shared || false);
    }
  }, [entry]);

  if (!isOpen) return null;

  const handleSaveSharing = async () => {
    try {
      const response = await fetch('/api/entries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: entry?.id,
          is_shared: shareToSocial
        })
      });

      if (response.ok) {
        // Call onSave callback if provided to refresh the parent component
        if (onSave) {
          onSave();
        }
        onClose();
        alert(shareToSocial ? 'Entry will be shared to social page!' : 'Entry sharing disabled');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update sharing settings');
      }
    } catch (error) {
      console.error('Error updating sharing settings:', error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="rounded-lg p-6 w-full max-w-md mx-4 transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-content)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold transition-colors duration-300" 
              style={{ color: 'var(--text-primary)' }}>
            Share Entry
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Entry Preview */}
        <div className="mb-6 p-3 rounded border transition-colors duration-300"
             style={{ 
               backgroundColor: 'var(--entries-bg)', 
               borderColor: 'var(--border-color)' 
             }}>
          <div className="text-sm mb-2 transition-colors duration-300" 
               style={{ color: 'var(--text-secondary)' }}>
            {entry && new Date(entry.date).toLocaleString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit', weekday: 'short'
            })}
          </div>
          <div className="text-sm transition-colors duration-300" 
               style={{ color: 'var(--text-primary)' }}>
            {entry && (entry.text?.length > 100 ? entry.text.substring(0, 100) + '...' : entry.text)}
          </div>
        </div>

        {/* Share Options */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-3 rounded border transition-colors duration-300"
               style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <div className="font-medium transition-colors duration-300" 
                   style={{ color: 'var(--text-primary)' }}>
                Share to Social Page
              </div>
              <div className="text-sm transition-colors duration-300" 
                   style={{ color: 'var(--text-secondary)' }}>
                Make this entry visible on your social feed
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={shareToSocial}
                onChange={(e) => setShareToSocial(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border transition-colors duration-300 hover:opacity-80"
            style={{ 
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSharing}
            className="px-4 py-2 rounded text-white transition-colors duration-300 hover:opacity-80"
            style={{ backgroundColor: 'var(--new-button-bg)', color: 'var(--new-button-text)' }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
