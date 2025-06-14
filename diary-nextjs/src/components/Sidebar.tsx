import React, { useState } from 'react';

const menuItems = [
  {
    name: 'Home',
    icon: '/home.svg',
    active: true,
  },
  {
    name: 'Media',
    icon: '/media.svg',
    active: false,
  },
  {
    name: 'Setting',
    icon: '/setting.svg',
    active: false,
  },
];

const Sidebar: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-[#f5fafc] transition-all duration-300 border-r border-gray-200 ${expanded ? 'w-[20vw]' : 'w-[4vw]'} z-50`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <nav className="flex flex-col items-center py-8 gap-2 h-full">
        {menuItems.map((item) => (
          <a
            key={item.name}
            href="#"
            className={`relative flex items-center w-full px-2 py-3 my-1 rounded-lg transition-colors group mx-auto
              ${item.active ? 'bg-gray-200 border-l-4 border-gray-400 mx-auto mt-7' : 'hover:bg-gray-100 hover:border-l-4 hover:border-gray-400 border-l-4 border-transparent'}`}
          >
            <span className="flex items-center justify-center w-10">
              <img src={item.icon} alt={item.name} className="w-7 h-7" />
            </span>
            <span
              className={`overflow-hidden transition-all duration-300 ml-0 ${expanded ? 'opacity-100 w-32 ml-4' : 'opacity-0 w-0'}`}
              style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
            >
              {item.name}
            </span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar; 