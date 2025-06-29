'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import SettingsDialog from './SettingsDialog';

const menuItems = [
  { name: 'Home', icon: '/home.svg', active: true },
  { name: 'Media', icon: '/media.svg', active: false },
  { name: 'Setting', icon: '/setting.svg', active: false },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleMenuClick = (itemName) => {
    if (itemName === 'Setting') {
      setShowSettings(true);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full transition-all duration-300 border-r z-50 ${expanded ? 'w-[20vw]' : 'w-[4vw]'}`}
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--border-color)'
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <nav className="flex flex-col items-center py-8 gap-2 h-full">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleMenuClick(item.name);
              }}
              className={`relative flex items-center w-full px-2 py-3 my-1 rounded-lg transition-colors group mx-auto
                ${item.active ? 'border-l-4 border-gray-400 dark:border-gray-300 mx-auto mt-7' : 'hover:border-l-4 hover:border-gray-400 dark:hover:border-gray-300 border-l-4 border-transparent'}`}
              style={{
                backgroundColor: item.active ? 'var(--sidebar-hover)' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!item.active) {
                  e.target.style.backgroundColor = 'var(--sidebar-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!item.active) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span className="flex items-center justify-center w-10">
                <img 
                  src={item.icon} 
                  alt={item.name} 
                  className="w-7 h-7 sidebar-icon" 
                />
              </span>
              <span
                className={`overflow-hidden transition-all duration-300 ml-0 ${expanded ? 'opacity-100 w-32 ml-4' : 'opacity-0 w-0'}`}
                style={{ 
                  display: 'inline-block', 
                  whiteSpace: 'nowrap',
                  color: 'var(--sidebar-text)'
                }}
              >
                {item.name}
              </span>
            </a>
          ))}
          
          {/* Spacer to push bottom items to the bottom */}
          <div className="flex-1"></div>
          
          {/* User info - moved to bottom with original hover style */}
          <div
            className="relative flex items-center w-full px-2 py-3 my-1 rounded-lg transition-colors group mx-auto"
            style={{
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--sidebar-hover)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <span className="flex items-center justify-center w-10">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                   style={{ 
                     backgroundColor: 'var(--new-button-bg, #b3e6fa)', 
                     color: 'var(--new-button-text, #000000)' 
                   }}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </span>
            <span
              className={`overflow-hidden transition-all duration-300 ml-0 ${expanded ? 'opacity-100 w-32 ml-4' : 'opacity-0 w-0'}`}
              style={{ 
                display: 'inline-block', 
                whiteSpace: 'nowrap',
                color: 'var(--sidebar-text)'
              }}
            >
              {user?.username || 'User'}
            </span>
          </div>
            
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="relative flex items-center w-full px-2 py-3 my-1 rounded-lg transition-colors group mx-auto hover:border-l-4 hover:border-red-400 border-l-4 border-transparent"
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
            title="Logout"
          >
            <span className="flex items-center justify-center w-10">
              <img src="/logout.svg" alt="Logout" className="w-7 h-7 mr-1.5" />
            </span>
            <span
              className={`overflow-hidden transition-all duration-300 ml-0 ${expanded ? 'opacity-100 w-32 ml-4' : 'opacity-0 w-0'}`}
              style={{ 
                display: 'inline-block', 
                whiteSpace: 'nowrap',
                color: '#dc2626'
              }}
            >
              Logout
            </span>
          </button>
        </nav>
      </div>
      
      <SettingsDialog 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
}
