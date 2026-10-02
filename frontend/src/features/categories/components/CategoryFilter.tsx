import { useCategoriesStore } from '../store/categories.store'
import { useUIStore } from '@/store/ui.store'
import { useNavigate, useLocation } from 'react-router-dom'

export function CategoryFilter() {
  const { categories, isLoading } = useCategoriesStore()
  const activeCategory = useUIStore((s) => s.activeCategory)
  const setActiveCategory = useUIStore((s) => s.setActiveCategory)
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen)
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = (id: string) => {
    const next = activeCategory === id ? null : id
    setActiveCategory(next as any)
    setMobileSidebarOpen(false)

    const params = new URLSearchParams(location.search)
    if (next) {
      params.set('tab', next)
    } else {
      params.delete('tab')
    }
    const qs = params.toString()
    navigate(qs ? `/?${qs}` : '/')
  }

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 w-full" style={{ opacity: 1 - i * 0.15 }}>
            <div className="skeleton w-2.5 h-2.5 rounded-full flex-shrink-0" />
            <div className="skeleton h-4 w-3/4 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {categories.map((cat) => (
        <button
          key={cat.id}
          id={`category-filter-${cat.id}`}
          onClick={() => handleClick(cat.id)}
          className={`sidebar-item w-full ${activeCategory === cat.id ? 'active' : ''}`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: cat.color }}
          />
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  )
}
