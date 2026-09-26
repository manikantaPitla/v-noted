import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '../api/notes.api'
import { QUERY_KEYS } from '@/utils/constants'
import { Note } from '../types/note.types'
import { useUIStore } from '@/store/ui.store'

export function useDeleteNote() {
  const queryClient = useQueryClient()
  const { selectedNoteId, setSelectedNoteId } = useUIStore()

  return useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.NOTES] })
      const prev = queryClient.getQueriesData<Note[]>({ queryKey: [QUERY_KEYS.NOTES] })

      queryClient.setQueriesData<Note[]>({ queryKey: [QUERY_KEYS.NOTES] }, (old = []) =>
        old.filter((n) => n.id !== id)
      )

      if (selectedNoteId === id) setSelectedNoteId(null)

      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTES] })
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        ctx.prev.forEach(([queryKey, data]: [QueryKey, Note[] | undefined]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
  })
}
