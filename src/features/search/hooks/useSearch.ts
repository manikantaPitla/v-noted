import { useUIStore } from '@/store/ui.store'
import { useNotes } from '@/features/notes/hooks/useNotes'

export function useSearch() {
  const searchQuery = useUIStore((s) => s.searchQuery)
  const setSearchQuery = useUIStore((s) => s.setSearchQuery)
  const isSearchOpen = useUIStore((s) => s.isSearchOpen)
  const setIsSearchOpen = useUIStore((s) => s.setIsSearchOpen)

  const { data: notes = [] } = useNotes()

  const clearSearch = () => {
    setSearchQuery('')
    setIsSearchOpen(false)
  }

  return {
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    clearSearch,
    resultCount: notes.length,
  }
}
