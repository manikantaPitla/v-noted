export function Loader() {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton rounded-2xl p-4 h-[90px]" style={{ opacity: 1 - i * 0.15 }}>
          <div className="skeleton h-3 w-2/3 rounded-full mb-2" />
          <div className="skeleton h-2.5 w-full rounded-full mb-1.5" />
          <div className="skeleton h-2.5 w-4/5 rounded-full mb-3" />
          <div className="flex gap-2">
            <div className="skeleton h-4 w-12 rounded-full" />
            <div className="skeleton h-4 w-10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
