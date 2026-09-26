import { Note } from '../types/note.types'
import { useUpdateNote } from '../hooks/useUpdateNote'
import { useCategoriesStore } from '@/features/categories/store/categories.store'
import { ChevronDown } from 'lucide-react'
import * as DD from '@/components/ui/dropdown-menu'

export function CategorySelector({ note }: { note: Note }) {
  const { mutate: updateNote } = useUpdateNote()
  const { categories } = useCategoriesStore()

  const current = categories.find((c) => c.id === note.category) || categories[0]

  return (
    <DD.Root>
      <DD.Trigger asChild>
        <button
          id="category-selector-btn"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-90 outline-none"
          style={{
            backgroundColor: current ? `${current.color}18` : undefined,
            color: current?.color,
            borderColor: `${current?.color}40`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: current?.color }} />
          {current?.name || 'Uncategorized'}
          <ChevronDown size={10} />
        </button>
      </DD.Trigger>

      <DD.Content align="start" side="bottom" sideOffset={8} className="min-w-[160px]">
        {categories.map((cat) => (
          <DD.Item key={cat.id} onClick={() => updateNote({ id: note.id, dto: { category: cat.id } })}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
            <span className={note.category === cat.id ? 'text-accent font-medium' : ''}>{cat.name}</span>
          </DD.Item>
        ))}
      </DD.Content>
    </DD.Root>
  )
}
