import React from 'react';

export default function LivePreview({ text }) {
  if (!text.trim()) return null;
  const firstLine = text.split('\n')[0];
  let display = firstLine;
  if (firstLine.length < text.length) display += ' ...';
  return (
    <div
      style={{
        position: 'fixed',
        top: 2,
        left: 2,
        background: '#7fc8de',
        color: '#222',
        padding: '8px 16px',
        borderRadius: '8px',
        zIndex: 1000,
        fontWeight: 600,
        fontSize: '1rem',
        maxWidth: '90vw',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      {display}
    </div>
  );
}
