import { useEffect } from 'react'

type KeyCombo = {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
}

export function useKeyboard(combo: KeyCombo, handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const onKeydown = (e: KeyboardEvent) => {
      if (e.isComposing) return

      const ctrlOrMeta = combo.ctrl || combo.meta
      const matchesModifier = ctrlOrMeta ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
      const matchesShift = combo.shift ? e.shiftKey : !e.shiftKey
      const matchesAlt = combo.alt ? e.altKey : !e.altKey
      const matchesKey = e.key.toLowerCase() === combo.key.toLowerCase()

      if (matchesModifier && matchesShift && matchesAlt && matchesKey) {
        e.preventDefault()
        e.stopPropagation()
        handler()
      }
    }

    window.addEventListener('keydown', onKeydown, { capture: true })
    return () => window.removeEventListener('keydown', onKeydown, { capture: true })
  }, [combo.key, combo.ctrl, combo.meta, combo.shift, combo.alt, handler, enabled])
}
