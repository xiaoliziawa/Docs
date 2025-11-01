import { onMounted, ref, watch } from 'vue'

const STORAGE_KEY = 'doc-history'
const MAX_HISTORY = 10

export interface HistoryItem {
  slug: string
  title: string
  timestamp: number
}

export function useDocHistory(currentSlug: string, currentTitle: string) {
  const history = ref<HistoryItem[]>([])

  function loadHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        history.value = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load document history:', error)
      history.value = []
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
    } catch (error) {
      console.warn('Failed to save document history:', error)
    }
  }

  function addToHistory(slug: string, title: string) {
    if (!slug || !title) return

    // Remove existing entry if present
    history.value = history.value.filter((item) => item.slug !== slug)

    // Add new entry at the beginning
    history.value.unshift({
      slug,
      title,
      timestamp: Date.now(),
    })

    // Keep only MAX_HISTORY items
    if (history.value.length > MAX_HISTORY) {
      history.value = history.value.slice(0, MAX_HISTORY)
    }

    saveHistory()
  }

  function clearHistory() {
    history.value = []
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear document history:', error)
    }
  }

  onMounted(() => {
    loadHistory()
  })

  watch(
    () => [currentSlug, currentTitle] as const,
    ([slug, title]) => {
      if (slug && title) {
        // Delay adding to history to ensure it's intentional navigation
        setTimeout(() => {
          addToHistory(slug, title)
        }, 1000)
      }
    }
  )

  return {
    history,
    addToHistory,
    clearHistory,
  }
}
