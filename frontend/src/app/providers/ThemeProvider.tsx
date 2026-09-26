import React, { createContext, useContext, useEffect, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { usePreferences } from '@/store/preferences.store'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setTheme: (t: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = usePreferences()

  const resolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme as 'light' | 'dark'
  }, [theme])

  const [coords, setCoords] = React.useState({ x: 50, y: 50 });
  const isFirstRender = React.useRef(true);
  const prevTheme = React.useRef(resolvedTheme);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Only track coordinates for clicks, but don't trigger the transition here
      setCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("click", handleGlobalClick, { capture: true, passive: true });
    return () => window.removeEventListener("click", handleGlobalClick, { capture: true });
  }, []);

  // Update CSS variables separately to avoid triggering theme transition on every click
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--x", `${coords.x}px`);
    root.style.setProperty("--y", `${coords.y}px`);
  }, [coords]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Skip initial render and cases where theme hasn't actually changed
    if (isFirstRender.current) {
      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
      isFirstRender.current = false;
      prevTheme.current = resolvedTheme;
      return;
    }

    if (prevTheme.current === resolvedTheme) return;
    prevTheme.current = resolvedTheme;

    if (!document.startViewTransition) {
      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
      return;
    }

    try {
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          root.classList.remove("light", "dark");
          root.classList.add(resolvedTheme);
        });
      });

      transition.ready.catch(() => {});
      transition.finished.catch(() => {});
    } catch (e) {
      // Fallback for browsers or situations where transition fails to start
      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
    }
  }, [resolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const root = document.documentElement
      const newTheme = mediaQuery.matches ? 'dark' : 'light'
      
      if (!document.startViewTransition) {
        root.classList.remove('light', 'dark')
        root.classList.add(newTheme)
        return
      }

      try {
        const transition = document.startViewTransition(() => {
          flushSync(() => {
            root.classList.remove('light', 'dark')
            root.classList.add(newTheme)
          });
        })
        transition.ready.catch(() => {});
        transition.finished.catch(() => {});
      } catch (e) {
        root.classList.remove('light', 'dark')
        root.classList.add(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
