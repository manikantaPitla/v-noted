import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '../api/notes.api'
import { QUERY_KEYS } from '@/utils/constants'
import { UpdateNoteDto, Note } from '../types/note.types'

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateNoteDto }) =>
      notesApi.update(id, dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.NOTES] })

      const prev = queryClient.getQueryData<Note[]>([QUERY_KEYS.NOTES])

      queryClient.setQueryData<Note[]>([QUERY_KEYS.NOTES], (old = []) =>
        old.map((n) =>
          n.id === id ? { ...n, ...dto, updated_at: new Date().toISOString() } : n
        )
      )

      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTES] })
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData([QUERY_KEYS.NOTES], ctx.prev)
      }
    },
  })
}
