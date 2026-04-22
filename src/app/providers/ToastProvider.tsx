import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />,
  error: <AlertCircle size={15} className="text-red-400 flex-shrink-0" />,
  info: <Info size={15} className="text-accent flex-shrink-0" />,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (timerRef.current[id]) clearTimeout(timerRef.current[id])
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
    setToasts((prev) => [...prev.slice(-4), { id, message, type }])
    timerRef.current[id] = setTimeout(() => dismiss(id), 3500)
  }, [dismiss])

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast])
  const error = useCallback((msg: string) => toast(msg, 'error'), [toast])
  const info = useCallback((msg: string) => toast(msg, 'info'), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="
              pointer-events-auto flex items-center gap-3 px-4 py-3
              bg-surface-elevated border border-surface-border rounded-2xl shadow-panel
              text-sm text-text-primary font-medium animate-slide-in
              min-w-[220px] max-w-[340px]
            "
          >
            {ICONS[t.type]}
            <span className="flex-1 text-text-secondary text-xs">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="p-0.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
