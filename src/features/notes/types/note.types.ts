export type Category = string

export interface Note {
  id: string
  user_id: string
  title: string
  content_json: Record<string, unknown>
  content_text: string
  category: string
  tags: string[]
  created_at: string
  updated_at: string
  isPinned?: boolean
  is_public?: boolean
}

export interface CreateNoteDto {
  title?: string
  content_json?: Record<string, unknown>
  content_text?: string
  category?: string
  tags?: string[]
  is_public?: boolean
}

export interface UpdateNoteDto {
  title?: string
  content_json?: Record<string, unknown>
  content_text?: string
  category?: string
  tags?: string[]
  is_public?: boolean
}

export interface NotesGroup {
  label: string
  notes: Note[]
}
