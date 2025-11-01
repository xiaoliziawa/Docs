import { onBeforeUnmount, onMounted } from 'vue'

export interface ShortcutHandler {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  function handleKeydown(event: KeyboardEvent) {
    for (const shortcut of shortcuts) {
      // Check if modifier keys match
      const hasCtrlOrMeta = event.ctrlKey || event.metaKey
      const needsCtrlOrMeta = shortcut.ctrl || shortcut.meta
      
      if (needsCtrlOrMeta && !hasCtrlOrMeta) continue
      if (!needsCtrlOrMeta && hasCtrlOrMeta) continue
      
      if (shortcut.shift && !event.shiftKey) continue
      if (!shortcut.shift && event.shiftKey) continue
      
      if (shortcut.alt && !event.altKey) continue
      if (!shortcut.alt && event.altKey) continue
      
      // Check if key matches (case insensitive)
      if (event.key.toLowerCase() === shortcut.key.toLowerCase()) {
        event.preventDefault()
        shortcut.handler()
        break
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return { shortcuts }
}
