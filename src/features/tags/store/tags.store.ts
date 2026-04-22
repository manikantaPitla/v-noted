import { create } from 'zustand'
import { tagsApi } from '../api/tags.api'

interface TagsStore {
  tags: string[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchTags: () => Promise<void>
  setTags: (tags: string[]) => void
  addTag: (name: string) => Promise<void>
  deleteTag: (name: string) => Promise<void>
}

export const useTagsStore = create<TagsStore>((set, get) => ({
  tags: [],
  isLoading: false,
  error: null,

  setTags: (tags) => set({ tags }),

  fetchTags: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await tagsApi.getAll()
      set({ tags: data.map(t => t.name), isLoading: false })
    } catch (err) {
      set({ error: 'Failed to fetch tags', isLoading: false })
    }
  },

  addTag: async (name) => {
    if (!name || typeof name !== 'string') return
    const clean = name.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')
    if (!clean || get().tags.includes(clean)) return
    
    await tagsApi.create(clean)
    set((s) => ({ tags: [...s.tags, clean] }))
  },

  deleteTag: async (name) => {
    await tagsApi.delete(name)
    set((s) => ({ tags: s.tags.filter((t) => t !== name) }))
  },
}))
