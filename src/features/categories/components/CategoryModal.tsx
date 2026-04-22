import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { useCategories } from '../hooks/useCategories'
import { AppCategory } from '../types/category.types'

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
]

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: AppCategory | null
}

export function CategoryModal({ open, onOpenChange, category }: CategoryModalProps) {
  const [errorText, setErrorText] = useState('')
  const { categories, handleAdd, handleUpdate } = useCategories()
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const isEditing = !!category

  useEffect(() => {
    if (open) {
      setErrorText('')
      if (category) {
        setName(category.name)
        setColor(category.color)
      } else {
        setName('')
        setColor(PRESET_COLORS[0])
      }
    }
  }, [open, category])

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const exists = categories.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== category?.id
    )

    if (exists) {
      setErrorText('duplicate')
      return
    }

    if (isEditing && category) {
      await handleUpdate(category.id, trimmedName, color)
      onOpenChange(false)
    } else {
      const result = await handleAdd(trimmedName, color)
      if (result) {
        onOpenChange(false)
      }
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Category' : 'Add Category'}
      description={isEditing ? 'Update the category details.' : 'Create a new category to organize your notes.'}
    >
      <div className="space-y-4 mt-4">
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1.5">Category Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errorText) setErrorText('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Research, Ideas…"
            className={`
              w-full px-3 py-2.5 rounded-xl text-sm text-text-primary
              bg-surface border outline-none
              transition-all placeholder:text-text-placeholder
              ${errorText ? 'border-destructive ring-1 ring-destructive/20' : 'border-surface-border focus:border-accent/60'}
            `}
          />
          {errorText && (
            <p className="text-[11px] text-destructive mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">
              category with name <span className="font-bold">{name.trim()}</span> already exists
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary block mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <span className="w-2.5 h-2.5 rounded-full bg-white/80 shadow block" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary bg-surface-hover border border-surface-border hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            id="category-modal-submit-btn"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-accent hover:bg-accent-hover transition-colors disabled:opacity-50 shadow-glow"
          >
            {isEditing ? 'Save Changes' : 'Add Category'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
