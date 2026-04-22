import React, { createContext, useContext, useEffect } from 'react'

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

function applyTheme() {
  const root = document.documentElement
  root.classList.add('dark')
  root.classList.remove('light')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = 'dark'
  const resolvedTheme = 'dark'
  const setTheme = () => {}

  // Always enforce dark on mount
  useEffect(() => {
    applyTheme()
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
