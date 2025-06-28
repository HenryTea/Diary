'use client';
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsDialog({ isOpen, onClose }) {
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div 
        className="rounded-lg p-6 w-96 max-w-[90vw] shadow-xl transition-colors duration-300 border"
        style={{ 
          backgroundColor: 'var(--bg-content)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>Settings</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>Theme</span>
            <div className="flex items-center space-x-3">
              <span className={`text-sm transition-colors duration-300 ${theme === 'light' ? 'font-medium' : 'opacity-60'}`} style={{ color: 'var(--text-primary)' }}>
                Light
              </span>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-[#72b3c8]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'font-medium' : 'opacity-60'}`} style={{ color: 'var(--text-primary)' }}>
                Dark
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#72b3c8] text-white rounded-lg hover:bg-[#5a9cb5] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
