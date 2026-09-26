import { useState } from 'react'
import { Note } from '../types/note.types'
import { useUpdateNote } from '../hooks/useUpdateNote'
import { useTagsStore } from '@/features/tags/store/tags.store'
import { Tag, Plus, X } from 'lucide-react'
import { AddTagModal } from '@/features/tags/components/AddTagModal'

export function TagEditor({ note }: { note: Note }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const { mutate: updateNote } = useUpdateNote()
  const { tags: allTags } = useTagsStore()

  const suggestions = inputValue
    ? allTags.filter((t) => t.includes(inputValue.toLowerCase().replace(/^#/, '')) && !note.tags.includes(t)).slice(0, 5)
    : allTags.filter((t) => !note.tags.includes(t)).slice(0, 5)

  const addNoteTag = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')
    if (!clean || note.tags.includes(clean)) return
    updateNote({ id: note.id, dto: { tags: [...note.tags, clean] } })
    setInputValue('')
    setShowSuggestions(false)
  }

  const removeTag = (tag: string) => {
    updateNote({ id: note.id, dto: { tags: note.tags.filter((t) => t !== tag) } })
  }

  return (
    <div className="relative flex items-center gap-1.5 flex-wrap">
      {note.tags.map((tag) => (
        <span key={tag} className="tag-pill group">
          <Tag size={9} />
          {tag}
          <button onClick={() => removeTag(tag)} className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive">
            <X size={9} />
          </button>
        </span>
      ))}

      <div 
        className="relative"
        onMouseEnter={() => setShowSuggestions(true)}
        onMouseLeave={() => setShowSuggestions(false)}
      >
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 pt-1 z-30 animate-pop-in">
            <div className="bg-surface-elevated border border-surface-border rounded-xl shadow-panel py-1 min-w-[130px]">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onMouseDown={() => addNoteTag(s)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                >
                  <Tag size={10} />#{s}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <button
          onClick={() => setShowAddModal(true)}
          className="tag-pill text-text-muted hover:text-text-primary"
        >
          <Plus size={9} />Add tag
        </button>
      </div>

      <AddTagModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
        onSuccess={addNoteTag}
      />
    </div>
  )
}
