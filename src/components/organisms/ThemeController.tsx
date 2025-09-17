'use client';

import { useState, useEffect } from 'react';

const themes = [
  { value: 'light', name: '라이트' },
  { value: 'dark', name: '다크' },
  { value: 'emerald', name: '에메랄드' },
  { value: 'forest', name: '포레스트' },
  { value: 'garden', name: '가든' },
];

export default function ThemeController() {
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost">
        <svg
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="inline-block h-5 w-5 stroke-current md:h-6 md:w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
          />
        </svg>
        <span className="hidden sm:inline">테마</span>
      </div>
      <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-32 p-2 shadow">
        {themes.map((theme) => (
          <li key={theme.value}>
            <button
              className={`${currentTheme === theme.value ? 'active' : ''}`}
              onClick={() => handleThemeChange(theme.value)}
            >
              {theme.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}