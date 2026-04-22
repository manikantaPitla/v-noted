import { create } from 'zustand'
import { AppCategory } from '../types/category.types'
import { categoriesApi } from '../api/categories.api'

interface CategoriesStore {
  categories: AppCategory[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchCategories: () => Promise<void>
  setCategories: (categories: AppCategory[]) => void
  addCategory: (name: string, color?: string) => Promise<AppCategory>
  updateCategory: (id: string, name: string, color: string) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
]

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  setCategories: (categories) => set({ categories }),

  fetchCategories: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await categoriesApi.getAll()
      // Sort by SK (which contains 1_, 2_, 3_ for default categories)
      const sorted = [...data].sort((a, b) => (a.SK || '').localeCompare(b.SK || ''))
      set({ categories: sorted, isLoading: false })
    } catch (err) {
      set({ error: 'Failed to fetch categories', isLoading: false })
    }
  },

  addCategory: async (name, color) => {
    const existing = get().categories
    const usedColors = existing.map((c) => c.color)
    const autoColor = CATEGORY_COLORS.find((c) => !usedColors.includes(c)) || CATEGORY_COLORS[0]
    
    const newCat = await categoriesApi.create({
      name: name.trim(),
      color: color || autoColor,
    })
    
    set({ categories: [...existing, newCat] })
    return newCat
  },

  updateCategory: async (id, name, color) => {
    const updated = await categoriesApi.update(id, { name: name.trim(), color })
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? updated : c)),
    }))
  },

  deleteCategory: async (id) => {
    await categoriesApi.delete(id)
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
    }))
  },
}))
