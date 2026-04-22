import { Note, NotesGroup } from '../types/note.types'
import { getDateGroup, formatDateGroupLabel } from '@/utils/formatDate'

export function groupNotesByDate(notes: Note[]): NotesGroup[] {
  const groups: Record<string, Note[]> = {}

  for (const note of notes) {
    const group = getDateGroup(note.created_at)
    if (!groups[group]) groups[group] = []
    groups[group].push(note)
  }

  const order: Array<'today' | 'yesterday' | 'older'> = ['today', 'yesterday', 'older']
  return order
    .filter((g) => groups[g]?.length > 0)
    .map((g) => ({
      label: formatDateGroupLabel(g),
      notes: groups[g],
    }))
}

export function extractTextFromJson(contentJson: Record<string, unknown>): string {
  let text = ''
  const extract = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const n = node as Record<string, unknown>
    if (n.type === 'text' && typeof n.text === 'string') {
      text += n.text + ' '
    }
    if (Array.isArray(n.content)) {
      n.content.forEach(extract)
    }
  }
  extract(contentJson)
  return text.trim()
}

export function getPreviewSnippet(note: Note, maxLength = 100): string {
  const text = note.content_text || extractTextFromJson(note.content_json)
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}
