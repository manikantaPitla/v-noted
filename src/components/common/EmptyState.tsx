import { FileText, Search, Tag } from 'lucide-react'
import { useCreateNote } from '@/features/notes/hooks/useCreateNote'
import { usePreferences } from '@/store/preferences.store'

interface EmptyStateProps {
  searchQuery?: string
  activeCategory?: string | null
  activeTag?: string | null
}

export function EmptyState({ searchQuery, activeCategory, activeTag }: EmptyStateProps) {
  const { mutate: createNote } = useCreateNote()
  const { defaultCategory } = usePreferences()

  const isFiltered = searchQuery || activeCategory || activeTag

  const handleCreate = () => {
    createNote({
      title: searchQuery ? searchQuery : '',
      content_json: { type: 'doc', content: [{ type: 'paragraph' }] },
      content_text: '',
      category: activeCategory || defaultCategory,
      tags: activeTag ? [activeTag] : [],
    })
  }

  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center mb-4 border border-surface-border">
          <Search size={20} className="text-text-muted" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">No results found</h3>
        <p className="text-xs text-text-muted leading-relaxed max-w-[200px]">
          {searchQuery
            ? `No notes matching "${searchQuery}"`
            : activeTag
            ? `No notes tagged #${activeTag}`
            : 'No notes found'}
        </p>
        {searchQuery && (
          <button
            onClick={handleCreate}
            className="mt-4 text-xs text-accent hover:text-accent-hover transition-colors font-medium"
          >
            + Create note with this title
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-3xl bg-accent-subtle border border-accent/20 flex items-center justify-center mb-5 shadow-glow">
        <FileText size={24} className="text-accent" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1.5">No notes yet</h3>
      <p className="text-xs text-text-muted leading-relaxed max-w-[180px] mb-5">
        Start capturing your thoughts instantly
      </p>
      <button
        id="empty-state-create-btn"
        onClick={handleCreate}
        className="
          px-5 py-2.5 rounded-xl text-sm font-semibold
          bg-accent hover:bg-accent-hover text-white
          transition-all duration-150 shadow-glow hover:shadow-none hover:scale-[0.98]
        "
      >
        Create first note
      </button>
      <p className="mt-4 text-[10px] text-text-muted">
        or press <kbd className="px-1.5 py-0.5 rounded border border-surface-border bg-surface-active font-mono">Ctrl+N</kbd>
      </p>
    </div>
  )
}
