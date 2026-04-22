import { create } from 'zustand'
import type { Category } from '@/features/notes/types/note.types'

interface UIStore {
  // Selected note
  selectedNoteId: string | null
  setSelectedNoteId: (id: string | null) => void

  // Search
  searchQuery: string
  setSearchQuery: (q: string) => void
  isSearchOpen: boolean
  setIsSearchOpen: (open: boolean) => void

  // Category filter
  activeCategory: Category | null
  setActiveCategory: (cat: Category | null) => void

  // Active tag filter
  activeTag: string | null
  setActiveTag: (tag: string | null) => void

  // Mobile panel
  mobilePanelView: 'list' | 'editor'
  setMobilePanelView: (view: 'list' | 'editor') => void

  // Mobile sidebar
  isMobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void

  // Sidebar collapsed
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // New note in progress
  isCreatingNote: boolean
  setIsCreatingNote: (v: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedNoteId: null,
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  isSearchOpen: false,
  setIsSearchOpen: (open) => set({ isSearchOpen: open }),

  activeCategory: null,
  setActiveCategory: (cat) => set({ activeCategory: cat }),

  activeTag: null,
  setActiveTag: (tag) => set({ activeTag: tag }),

  mobilePanelView: 'list',
  setMobilePanelView: (view) => set({ mobilePanelView: view }),

  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  isCreatingNote: false,
  setIsCreatingNote: (v) => set({ isCreatingNote: v }),
}))
