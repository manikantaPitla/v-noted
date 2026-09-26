import { apiClient } from '@/services/apiClient'
import { GoogleAuthPayload, AuthResponse } from '../types/auth.types'

export const authApi = {
  googleLogin: async (payload: GoogleAuthPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/google', {
      credential: payload.credential,
    })
    return response.data
  },

  updateProfile: async (data: { accent_color?: string; theme?: string }): Promise<any> => {
    const response = await apiClient.put('/auth/profile', data)
    return response.data
  },
}
