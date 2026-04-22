export const ENDPOINTS = {
  AUTH: {
    GOOGLE: '/auth/google',
  },
  NOTES: {
    BASE: '/notes',
    BY_ID: (id: string) => `/notes/${id}`,
  },
}
