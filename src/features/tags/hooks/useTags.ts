import { useTagsStore } from '../store/tags.store'
import { useToast } from '@/app/providers/ToastProvider'
import { notesApi } from '@/features/notes/api/notes.api'

export function useTags() {
  const { tags, addTag, deleteTag } = useTagsStore()
  const { success, error } = useToast()

  const handleAdd = async (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')
    if (!clean) { error('Tag name cannot be empty'); return }
    if (tags.includes(clean)) { error('Tag already exists'); return }
    try {
      await addTag(clean)
      success(`Tag #${clean} added`)
    } catch (err) {
      error('Failed to add tag')
    }
  }

  const handleDelete = async (tag: string) => {
    try {
      await deleteTag(tag)
      await notesApi.removeTagGlobal(tag)
      success(`Tag #${tag} deleted from all notes`)
    } catch (err) {
      error('Failed to delete tag')
    }
  }

  const getSuggestions = (query: string): string[] => {
    if (!query) return tags.slice(0, 8)
    const q = query.toLowerCase().replace(/^#/, '')
    return tags.filter((t) => t.includes(q)).slice(0, 6)
  }

  return { tags, handleAdd, handleDelete, getSuggestions }
}
