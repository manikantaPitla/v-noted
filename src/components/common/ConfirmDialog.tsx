import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className="
            fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
            w-[90vw] max-w-sm outline-none group
          "
        >
          <div className="opacity-0 group-data-[state=open]:opacity-100 bg-surface-elevated border border-surface-border rounded-2xl shadow-panel p-6 group-data-[state=open]:animate-pop-in">
            <div className="flex gap-4">
            {variant === 'danger' && (
              <div className="w-9 h-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} className="text-destructive" />
              </div>
            )}
            <div className="flex-1">
              <Dialog.Title className="text-sm font-semibold text-text-primary mb-1">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-text-secondary leading-relaxed">
                {description}
              </Dialog.Description>
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-5">
            <button
              onClick={() => onOpenChange(false)}
              className="
                px-4 py-2 text-xs font-medium rounded-xl
                text-text-secondary bg-surface-hover border border-surface-border
                hover:text-text-primary transition-colors
              "
            >
              {cancelLabel}
            </button>
            <button
              id="confirm-dialog-btn"
              onClick={handleConfirm}
              className={`
                px-4 py-2 text-xs font-semibold rounded-xl transition-colors
                ${variant === 'danger'
                  ? 'bg-destructive/90 hover:bg-destructive text-white'
                  : 'bg-accent hover:bg-accent-hover text-white'
                }
              `}
            >
              {confirmLabel}
            </button>
          </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
