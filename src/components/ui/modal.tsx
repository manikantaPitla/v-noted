import * as Dialog from '@radix-ui/react-dialog'
import React from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
}

export function Modal({ open, onOpenChange, title, description, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className="
            fixed left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2
            w-[90vw] max-w-md outline-none group
          "
        >
          <div className="opacity-0 group-data-[state=open]:opacity-100 bg-surface-elevated border border-surface-border rounded-2xl shadow-panel p-6 group-data-[state=open]:animate-pop-in">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-bold text-text-primary">
                {title}
              </Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>
            
            {description && (
              <Dialog.Description className="text-xs text-text-secondary mb-4 leading-relaxed">
                {description}
              </Dialog.Description>
            )}

            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
