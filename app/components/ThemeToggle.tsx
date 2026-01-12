'use client';

import { useEffect, useState, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemePreference, useSaveThemePreference } from '@/lib/firebase';

interface ThemeToggleProps {
  userId: string | null;
}

export function ThemeToggle({ userId }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [themePreference, themeLoading] = useThemePreference(userId);
  const [saveTheme] = useSaveThemePreference(userId);
  const hasInitialized = useRef(false);

  // Determine theme: Firebase preference, or system preference
  const prefersDark = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  const isDark = themePreference?.theme === 'dark' || (!themePreference && prefersDark);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize theme from Firebase or system preference
  useEffect(() => {
    if (!mounted || themeLoading) return;

    // Determine theme: Firebase preference, or system preference
    const currentIsDark = themePreference?.theme === 'dark' || (!themePreference && prefersDark);
    
    if (currentIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (!hasInitialized.current) {
      hasInitialized.current = true;
    }
  }, [mounted, themePreference, themeLoading, prefersDark]);

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    
    // Update DOM immediately for responsive UI
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to Firebase if user is authenticated
    if (userId) {
      try {
        await saveTheme(newTheme);
      } catch (err) {
        console.error('Failed to save theme preference:', err);
        // Revert on error
        if (newTheme === 'dark') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      }
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}


