import { useQuery } from '@tanstack/react-query'
import { notesApi } from '../api/notes.api'
import { QUERY_KEYS } from '@/utils/constants'
import { useUIStore } from '@/store/ui.store'

export function useNotes() {
  const searchQuery = useUIStore((s) => s.searchQuery)
  const activeCategory = useUIStore((s) => s.activeCategory)
  const activeTag = useUIStore((s) => s.activeTag)

  return useQuery({
    queryKey: [QUERY_KEYS.NOTES, { searchQuery, activeCategory, activeTag }],
    queryFn: () =>
      notesApi.getAll({
        search: searchQuery || undefined,
        category: activeCategory || undefined,
        tags: activeTag ? [activeTag] : undefined,
      }),
  })
}
