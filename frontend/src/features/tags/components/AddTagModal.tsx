import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { useTags } from '../hooks/useTags'
import { Hash } from 'lucide-react'

interface AddTagModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (tag: string) => void
}

export function AddTagModal({ open, onOpenChange, onSuccess }: AddTagModalProps) {
  const [errorText, setErrorText] = useState('')
  const { tags, handleAdd } = useTags()
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    const clean = value.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')
    if (!clean) return

    if (tags.includes(clean)) {
      setErrorText('duplicate')
      return
    }

    handleAdd(clean)
    onSuccess?.(clean)
    setValue('')
    setErrorText('')
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Tag"
      description="Tags help you find related notes quickly."
    >
      <div className="space-y-4 mt-4">
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1.5">Tag Name</label>
          <div className="relative">
            <Hash size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errorText ? 'text-destructive' : 'text-text-muted'}`} />
            <input
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                if (errorText) setErrorText('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. idea, bug, meeting…"
              className={`
                w-full pl-8 pr-3 py-2.5 rounded-xl text-sm text-text-primary
                bg-surface border outline-none
                transition-all placeholder:text-text-placeholder
                ${errorText ? 'border-destructive ring-1 ring-destructive/20' : 'border-surface-border focus:border-accent/60'}
              `}
            />
          </div>
          {errorText ? (
            <p className="text-[11px] text-destructive mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">
              tag with name <span className="font-bold">{value.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')}</span> already exists
            </p>
          ) : (
            <p className="text-[10px] text-text-muted mt-1.5">Spaces will become dashes</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary bg-surface-hover border border-surface-border hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            id="add-tag-confirm-btn"
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-accent hover:bg-accent-hover transition-colors disabled:opacity-50 shadow-glow"
          >
            Add Tag
          </button>
        </div>
      </div>
    </Modal>
  )
}
