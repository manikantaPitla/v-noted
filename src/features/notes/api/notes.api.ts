import { apiClient } from '@/services/apiClient'
import { Note, CreateNoteDto, UpdateNoteDto } from '../types/note.types'

export const notesApi = {
  getAll: async (params?: { category?: string; search?: string; tags?: string[] }): Promise<Note[]> => {
    // Convert tags array to comma-separated string for the API
    const apiParams = {
      ...params,
      tags: params?.tags?.join(','),
    }
    const response = await apiClient.get<Note[]>('/notes', { params: apiParams })
    return response.data
  },

  getById: async (id: string): Promise<Note> => {
    const response = await apiClient.get<Note>(`/notes/${id}`)
    return response.data
  },

  getShared: async (id: string, userId: string): Promise<Note> => {
    const response = await apiClient.get<Note>(`/notes/${id}`, {
      params: { u: userId },
    })
    return response.data
  },

  create: async (dto: CreateNoteDto): Promise<Note> => {
    const response = await apiClient.post<Note>('/notes', dto)
    return response.data
  },

  update: async (id: string, dto: UpdateNoteDto): Promise<Note> => {
    const response = await apiClient.put<Note>(`/notes/${id}`, dto)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`)
  },

  removeTagGlobal: async (tag: string): Promise<void> => {
    // Frontend-side implementation: fetch all notes and update those containing the tag
    const notes = await notesApi.getAll()
    const notesWithTag = notes.filter((n) => n.tags?.includes(tag))
    
    await Promise.all(
      notesWithTag.map((note) =>
        notesApi.update(note.id, {
          tags: note.tags.filter((t) => t !== tag),
        })
      )
    )
  },

  resetAccount: async (): Promise<void> => {
    await apiClient.post('/auth/reset')
  },
}
