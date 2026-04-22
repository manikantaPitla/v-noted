import React, { createContext, useState, useCallback, useEffect } from 'react'
import { User, AuthState } from '@/features/auth/types/auth.types'
import { authApi } from '@/features/auth/api/auth.api'
import { STORAGE_KEYS } from '@/utils/constants'
import { useCategoriesStore } from '@/features/categories/store/categories.store'
import { useTagsStore } from '@/features/tags/store/tags.store'
import { categoriesApi } from '@/features/categories/api/categories.api'
import { notesApi } from '@/features/notes/api/notes.api'

interface AuthContextValue extends AuthState {
  login: (credential: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const WELCOME_NOTE = {
  title: 'Welcome to Vnoted! 🚀',
  content_text: 'Welcome to your new digital playground. Create, organize, and retrieve your thoughts with speed.',
  content_json: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Welcome to Vnoted! 🚀' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Vnoted is a fast, minimal note-taking app designed for clarity and speed. Here is a quick guide to get you started:' }
        ]
      },
      {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Try creating your first note using the "+" button in the sidebar.' }] }]
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Add #tags to organize your thoughts (they work just like hashtags!).' }] }]
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Share a note publicly using the "Share" toggle at the top right.' }] }]
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Premium Themes' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Check out the ' },
          { type: 'text', marks: [{ type: 'bold' }], text: 'Settings' },
          { type: 'text', text: ' to manage your Categories and Tags. Everything is synced across your devices automatically.' }
        ]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Happy note-taking!' }]
      }
    ]
  }
}

function loadStoredState(): { user: User | null; token: string | null } {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const userStr = localStorage.getItem(STORAGE_KEYS.USER)
    const user = userStr ? JSON.parse(userStr) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = loadStoredState()

  const [user, setUser] = useState<User | null>(stored.user)
  const [token, setToken] = useState<string | null>(stored.token)
  const [isLoading, setIsLoading] = useState(false)

  const { fetchCategories, setCategories } = useCategoriesStore()
  const { fetchTags } = useTagsStore()

  const isInitializing = React.useRef(false)

  useEffect(() => {
    const initData = async () => {
      if (!user || !token || isInitializing.current) return
      isInitializing.current = true

      try {
        await Promise.all([fetchCategories(), fetchTags()])
      } catch (err) {
        console.error('[Onboarding] Error fetching initial data:', err)
      }
    }

    initData()
  }, [user, token])

  const persistAuth = (u: User, t: string) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, t)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u))
    
    setUser(u)
    setToken(t)
  }

  const login = useCallback(async (credential: string) => {
    setIsLoading(true)
    try {
      const response = await authApi.googleLogin({ credential })
      persistAuth(response.user, response.token)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    useCategoriesStore.getState().setCategories([])
    useTagsStore.getState().setTags([])
    isInitializing.current = false
    setUser(null)
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
