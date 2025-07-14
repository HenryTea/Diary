'use client';
import React from 'react';

export default function SocialUpdateDialog({ isOpen, onClose, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Update Social Feed?
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This entry is currently shared on the social feed. Would you like to update it on the social feed with your changes?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            No, keep private
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors"
          >
            Yes, update social feed
          </button>
        </div>
      </div>
    </div>
  );
}
