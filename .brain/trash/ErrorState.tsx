import { AlertTriangle } from 'lucide-react'

export function ErrorState({ message = 'Something went wrong. Please try again.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
        <AlertTriangle size={20} className="text-destructive" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">Error</h3>
      <p className="text-xs text-text-muted leading-relaxed max-w-[220px]">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 text-xs text-accent hover:underline font-medium"
      >
        Refresh page
      </button>
    </div>
  )
}
