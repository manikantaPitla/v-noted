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
      <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-[2rem] bg-surface-hover flex items-center justify-center mb-6 border border-surface-border">
          <Search size={24} className="text-text-muted" />
        </div>
        <h3 className="text-base font-bold text-text-primary mb-2 tracking-tight">No results found</h3>
        <p className="text-sm text-text-muted leading-relaxed max-w-[240px] mx-auto">
          {searchQuery
            ? `We couldn't find any notes matching "${searchQuery}"`
            : activeTag
            ? `No notes currently tagged with #${activeTag}`
            : 'No notes found in this selection'}
        </p>
        {searchQuery && (
          <button
            onClick={handleCreate}
            className="mt-6 px-4 py-2 rounded-xl text-xs text-accent hover:bg-accent-subtle transition-all font-bold border border-accent/20"
          >
            Create note as "{searchQuery}"
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-[2.5rem] bg-accent-subtle border border-accent/20 flex items-center justify-center mb-8 relative">
        <div className="absolute inset-0 bg-accent/5 rounded-full blur-2xl animate-pulse-soft" />
        <FileText size={32} className="text-accent relative z-10" />
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">Start Your Journey</h3>
      <p className="text-sm text-text-muted leading-relaxed max-w-[220px] mx-auto mb-8">
        Capture your thoughts, ideas, and tasks in your minimalist workspace.
      </p>
      <button
        id="empty-state-create-btn"
        onClick={handleCreate}
        className="
          px-8 py-3 rounded-2xl text-sm font-bold
          bg-accent hover:bg-accent-hover text-white
          transition-all duration-200 hover:scale-[0.98] active:scale-[0.96]
        "
      >
        Create your first note
      </button>
      <div className="mt-8 flex items-center gap-2 text-xs text-text-muted">
        <span>Quickly add with</span>
        <kbd className="px-2 py-1 rounded-lg border border-surface-border bg-surface-active font-mono font-bold text-[10px]">Ctrl + N</kbd>
      </div>
    </div>
  )
}
