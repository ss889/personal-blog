'use client';

import { useEffect, useState } from 'react';

export default function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<string>('theme-night');
  const [mounted, setMounted] = useState(false);

  const themes = [
    { id: 'theme-night', color: '#06b6d4', label: 'Night' },
    { id: 'theme-ink', color: '#111111', label: 'Ink' },
    { id: 'theme-terminal', color: '#22c55e', label: 'Terminal' },
  ];

  // Load theme from localStorage on mount and apply to prevent flash
  useEffect(() => {
    const savedTheme = localStorage.getItem('portfolio-theme') || 'theme-night';
    setActiveTheme(savedTheme);
    document.documentElement.className = savedTheme;
    setMounted(true);
  }, []);

  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
    document.documentElement.className = themeId;
    localStorage.setItem('portfolio-theme', themeId);
  };

  if (!mounted) return null;

  return (
    <div className="theme-switcher">
      {themes.map((theme) => (
        <button
          key={theme.id}
          className={`theme-button ${activeTheme === theme.id ? 'active' : ''}`}
          style={{
            backgroundColor: theme.color,
            borderColor: theme.id === 'theme-ink' ? '#cfcfcf' : undefined,
          }}
          onClick={() => handleThemeChange(theme.id)}
          title={theme.label}
          aria-label={`Switch to ${theme.label} theme`}
        />
      ))}
    </div>
  );
}
