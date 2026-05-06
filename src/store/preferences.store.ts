import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PreferencesStore {
  autoSave: boolean
  setAutoSave: (v: boolean) => void

  defaultCategory: string
  setDefaultCategory: (cat: string) => void
  
  theme: 'dark' | 'light' | 'system'
  setTheme: (t: 'dark' | 'light' | 'system') => void
}

export const usePreferences = create<PreferencesStore>()(
  persist(
    (set) => ({
      autoSave: true,
      setAutoSave: (v) => set({ autoSave: v }),

      defaultCategory: '',
      setDefaultCategory: (cat) => set({ defaultCategory: cat }),

      theme: 'system',
      setTheme: (t) => set({ theme: t }),
    }),
    { name: 'v_noted_preferences' }
  )
)
