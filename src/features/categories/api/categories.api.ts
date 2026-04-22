import { apiClient } from '@/services/apiClient'
import { AppCategory } from '../types/category.types'

export const categoriesApi = {
  getAll: async (): Promise<AppCategory[]> => {
    const response = await apiClient.get<AppCategory[]>('/categories')
    return response.data
  },

  create: async (dto: Partial<AppCategory>): Promise<AppCategory> => {
    const response = await apiClient.post<AppCategory>('/categories', dto)
    return response.data
  },

  update: async (id: string, dto: Partial<AppCategory>): Promise<AppCategory> => {
    const response = await apiClient.put<AppCategory>(`/categories/${id}`, dto)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`)
  },
}
