import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}
export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
    return (
      <button
        onClick={onToggle}
        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-gray-100" />
        ) : (
          <Sun className="w-5 h-5 text-gray-700" />
        )}
      </button>
    );
  }