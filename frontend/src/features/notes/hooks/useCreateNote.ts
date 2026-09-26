import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '../api/notes.api'
import { QUERY_KEYS } from '@/utils/constants'
import { CreateNoteDto } from '../types/note.types'
import { useUIStore } from '@/store/ui.store'
import { useNavigate } from 'react-router-dom'

export function useCreateNote() {
  const queryClient = useQueryClient()
  const setSelectedNoteId = useUIStore((s) => s.setSelectedNoteId)
  const setMobilePanelView = useUIStore((s) => s.setMobilePanelView)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (dto: CreateNoteDto) => notesApi.create(dto),
    onSuccess: (note) => {
      // Invalidate ALL notes queries (regardless of filters) so every cached
      // variant gets refreshed and the new note appears everywhere.
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTES] })

      setSelectedNoteId(note.id)
      setMobilePanelView('editor')

      const params = new URLSearchParams(window.location.search)
      navigate(`/notes/${note.id}?${params.toString()}`)
    },
    onError: () => {
    },
  })
}
