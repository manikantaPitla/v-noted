import { Note } from '../types/note.types'
import { getPreviewSnippet } from '../utils/note.utils'
import { formatTimestamp } from '@/utils/formatDate'
import { useUIStore } from '@/store/ui.store'
import { useCategoriesStore } from '@/features/categories/store/categories.store'
import { Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface NoteCardProps {
  note: Note
}

export function NoteCard({ note }: NoteCardProps) {
  const selectedNoteId = useUIStore((s) => s.selectedNoteId)
  const setSelectedNoteId = useUIStore((s) => s.setSelectedNoteId)
  const setMobilePanelView = useUIStore((s) => s.setMobilePanelView)
  const setActiveTag = useUIStore((s) => s.setActiveTag)
  const navigate = useNavigate()
  const { categories } = useCategoriesStore()

  const isActive = selectedNoteId === note.id
  const preview = getPreviewSnippet(note, 110)
  const category = categories.find((c) => c.id === note.category)

  const handleClick = () => {
    setSelectedNoteId(note.id)
    setMobilePanelView('editor')
    const params = new URLSearchParams(window.location.search)
    navigate(`/notes/${note.id}${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation()
    setActiveTag(tag)
  }

  return (
    <article
      id={`note-card-${note.id}`}
      onClick={handleClick}
      className={`
        note-card group relative flex flex-col p-4 rounded-2xl cursor-pointer transition-all duration-200 border
        ${isActive 
          ? 'bg-accent-subtle border-accent/20 shadow-soft' 
          : 'bg-surface border-surface-border hover:bg-surface-hover hover:shadow-soft hover:border-surface-active'
        }
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={`font-bold text-sm tracking-tight line-clamp-1 flex-1 ${isActive ? 'text-accent' : 'text-text-primary'}`}>
          {note.title || 'Untitled'}
        </h3>
        <span className="text-[10px] font-medium text-text-muted flex-shrink-0 mt-0.5">
          {formatTimestamp(note.updated_at)}
        </span>
      </div>

      {/* Preview */}
      {preview && (
        <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${isActive ? 'text-text-secondary' : 'text-text-secondary/80'}`}>
          {preview}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
        {category && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
            style={{
              backgroundColor: `${category.color}12`,
              color: category.color,
              borderColor: `${category.color}25`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
            {category.name}
          </span>
        )}
        {note.tags.slice(0, 3).map((tag) => (
          <button
            key={tag}
            onClick={(e) => handleTagClick(e, tag)}
            className="tag-pill"
          >
            <Tag size={9} strokeWidth={3} />
            {tag}
          </button>
        ))}
        {note.tags.length > 3 && (
          <span className="text-[10px] font-semibold text-text-muted">+{note.tags.length - 3}</span>
        )}
      </div>
    </article>
  )
}
