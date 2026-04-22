export const APP_NAME = 'Vnoted'

export const ACCENT_COLORS = [
  { name: 'Indigo', value: '#818CF8' },
  { name: 'Rose', value: '#FB7185' },
  { name: 'Emerald', value: '#34D399' },
  { name: 'Amber', value: '#FBBF24' },
  { name: 'Sky', value: '#38BDF8' },
  { name: 'Violet', value: '#A78BFA' },
  { name: 'Orange', value: '#FB923C' },
  { name: 'Teal', value: '#2DD4BF' },
]

export const CATEGORIES = [
  { value: 'work' as const, label: 'Work', color: '#3B82F6' },
  { value: 'personal' as const, label: 'Personal', color: '#10B981' },
  { value: 'other' as const, label: 'Other', color: '#F59E0B' },
]

export const AUTOSAVE_DELAY = 2000 // ms

export const SEARCH_DEBOUNCE = 300 // ms

export const STORAGE_KEYS = {
  TOKEN: 'vnoted_token',
  USER: 'vnoted_user',
  ACTIVE_NOTE: 'vnoted_active_note',
}

export const QUERY_KEYS = {
  NOTES: 'vnoted-notes',
  NOTE: 'vnoted-note',
  USER: 'vnoted-user',
}

export const IS_DEV = import.meta.env.DEV
