import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../app/store/ThemeContext';

export default function ThemeSelector() {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div className="theme-segmented-control" role="group" aria-label="Theme selector">
      <button
        type="button"
        className={`theme-segment-btn ${themeMode === 'light' ? 'active' : ''}`}
        onClick={() => setThemeMode('light')}
        title="Light theme"
        aria-label="Switch to light theme"
        aria-pressed={themeMode === 'light'}
      >
        <Sun size={13} strokeWidth={2} />
      </button>

      <button
        type="button"
        className={`theme-segment-btn ${themeMode === 'system' ? 'active' : ''}`}
        onClick={() => setThemeMode('system')}
        title="Match system theme"
        aria-label="Match system theme"
        aria-pressed={themeMode === 'system'}
      >
        <Monitor size={13} strokeWidth={2} />
      </button>

      <button
        type="button"
        className={`theme-segment-btn ${themeMode === 'dark' ? 'active' : ''}`}
        onClick={() => setThemeMode('dark')}
        title="Dark theme"
        aria-label="Switch to dark theme"
        aria-pressed={themeMode === 'dark'}
      >
        <Moon size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
