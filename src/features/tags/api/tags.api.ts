import { apiClient } from '@/services/apiClient'

export interface Tag {
  name: string
  created_at: string
}

export const tagsApi = {
  getAll: async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>('/tags')
    return response.data
  },

  create: async (name: string): Promise<Tag> => {
    const response = await apiClient.post<Tag>('/tags', { name })
    return response.data
  },

  delete: async (name: string): Promise<void> => {
    await apiClient.delete(`/tags/${name}`)
  },
}
