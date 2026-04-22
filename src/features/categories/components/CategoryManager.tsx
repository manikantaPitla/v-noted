import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CategoryModal } from './CategoryModal'
import { AppCategory } from '../types/category.types'

export function CategoryManager() {
  const { categories, handleDelete } = useCategories()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<AppCategory | null>(null)

  const handleEdit = (category: AppCategory) => {
    setCategoryToEdit(category)
    setShowModal(true)
  }

  const handleAdd = () => {
    setCategoryToEdit(null)
    setShowModal(true)
  }

  const catToDelete = categories.find((c) => c.id === deleteTarget)

  return (
    <div className="space-y-1.5 p-1">
      <button
        id="add-category-btn-settings"
        onClick={handleAdd}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-accent hover:bg-accent/10 transition-colors mb-1"
      >
        <Plus size={14} />
        Add Category
      </button>

      {categories.map((cat) => (
        <div
          key={cat.id}
          className="group flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-hover transition-colors"
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: cat.color }}
          />

          <span className="flex-1 text-sm text-text-primary">{cat.name}</span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleEdit(cat)}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-active transition-colors"
              title="Edit"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => setDeleteTarget(cat.id)}
              disabled={categories.length <= 1}
              className="p-1 rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}

      <CategoryModal 
        open={showModal} 
        onOpenChange={setShowModal} 
        category={categoryToEdit} 
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Category"
        description={`Delete "${catToDelete?.name}"? Notes in this category will be moved to another.`}
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget) }}
      />
    </div>
  )
}
