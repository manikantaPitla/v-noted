import { useState } from 'react'
import { Plus, Trash2, Hash } from 'lucide-react'
import { useTags } from '../hooks/useTags'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AddTagModal } from './AddTagModal'

export function TagManager() {
  const { tags, handleDelete } = useTags()
  const [showAdd, setShowAdd] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  return (
    <div className="space-y-1 p-1">
      <button
        id="add-tag-btn-settings"
        onClick={() => setShowAdd(true)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-accent hover:bg-accent/10 transition-colors mb-1"
      >
        <Plus size={14} />
        Add Tag
      </button>

      {tags.map((tag) => (
        <div
          key={tag}
          className="group flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-hover transition-colors"
        >
          <Hash size={12} className="text-text-muted flex-shrink-0" />
          <span className="flex-1 text-sm text-text-primary">{tag}</span>
          <button
            onClick={() => setDeleteTarget(tag)}
            className="p-1 rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete tag"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      {tags.length === 0 && (
        <p className="px-3 py-2 text-xs text-text-muted">No tags yet. Create tags while editing notes.</p>
      )}

      <AddTagModal open={showAdd} onOpenChange={setShowAdd} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Tag"
        description={`Delete #${deleteTarget}? It will be removed from all notes.`}
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget) }}
      />
    </div>
  )
}
