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
      const ctrlOrMeta = combo.ctrl || combo.meta
      const matchesModifier = ctrlOrMeta ? (e.ctrlKey || e.metaKey) : true
      const matchesShift = combo.shift ? e.shiftKey : true
      const matchesAlt = combo.alt ? e.altKey : true
      const matchesKey = e.key.toLowerCase() === combo.key.toLowerCase()

      if (matchesModifier && matchesShift && matchesAlt && matchesKey) {
        e.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [combo.key, combo.ctrl, combo.meta, combo.shift, combo.alt, handler, enabled])
}
