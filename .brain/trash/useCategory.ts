import { useUIStore } from '@/store/ui.store'
import type { Category } from '@/features/notes/types/note.types'

export function useCategory() {
  const activeCategory = useUIStore((s) => s.activeCategory)
  const setActiveCategory = useUIStore((s) => s.setActiveCategory)

  const selectCategory = (cat: Category | null) => {
    setActiveCategory(cat === activeCategory ? null : cat)
  }

  return { activeCategory, selectCategory }
}
