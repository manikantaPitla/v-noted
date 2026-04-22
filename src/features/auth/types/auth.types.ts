export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  accent_color?: string
  theme?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface GoogleAuthPayload {
  credential: string
}

export interface AuthResponse {
  user: User
  token: string
}
