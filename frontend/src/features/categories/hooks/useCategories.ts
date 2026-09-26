import { useCategoriesStore } from '../store/categories.store'
import { useToast } from '@/app/providers/ToastProvider'
import { useUIStore } from '@/store/ui.store'

export function useCategories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoriesStore()
  const { success, error } = useToast()
  const activeCategory = useUIStore((s) => s.activeCategory)
  const setActiveCategory = useUIStore((s) => s.setActiveCategory)

  const handleAdd = async (name: string, color?: string) => {
    if (!name.trim()) { error('Category name cannot be empty'); return null }
    const exists = categories.find((c) => c.name.toLowerCase() === name.trim().toLowerCase())
    if (exists) { error('A category with that name already exists'); return null }
    try {
      const cat = await addCategory(name, color)
      success(`Category "${cat.name}" added`)
      return cat
    } catch (err) {
      error('Failed to add category')
      return null
    }
  }

  const handleUpdate = async (id: string, name: string, color: string) => {
    if (!name.trim()) { error('Category name cannot be empty'); return }
    try {
      await updateCategory(id, name, color)
      success('Category updated')
    } catch (err) {
      error('Failed to update category')
    }
  }

  const handleDelete = async (id: string) => {
    if (categories.length <= 1) { error('You must have at least one category'); return }
    const cat = categories.find((c) => c.id === id)
    try {
      await deleteCategory(id)
      if (activeCategory === id) setActiveCategory(null)
      success(`Category "${cat?.name}" deleted`)
    } catch (err) {
      error('Failed to delete category')
    }
  }

  return { categories, handleAdd, handleUpdate, handleDelete }
}
