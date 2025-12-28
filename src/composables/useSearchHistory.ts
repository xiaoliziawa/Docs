import { ref, watch } from 'vue'

const STORAGE_KEY = 'docs-search-history'
const MAX_HISTORY = 10

export interface SearchHistoryItem {
  query: string
  timestamp: number
}

const history = ref<SearchHistoryItem[]>([])

function loadHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load search history', error)
  }

  return []
}

function saveHistory(items: SearchHistoryItem[]): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    console.warn('Failed to save search history', error)
  }
}

export function useSearchHistory() {
  if (history.value.length === 0) {
    history.value = loadHistory()
  }

  function addToHistory(query: string): void {
    const trimmed = query.trim()
    if (!trimmed) {
      return
    }

    const filtered = history.value.filter(
      (item) => item.query.toLowerCase() !== trimmed.toLowerCase()
    )

    const newItem: SearchHistoryItem = {
      query: trimmed,
      timestamp: Date.now()
    }

    history.value = [newItem, ...filtered].slice(0, MAX_HISTORY)
    saveHistory(history.value)
  }

  function removeFromHistory(query: string): void {
    history.value = history.value.filter(
      (item) => item.query.toLowerCase() !== query.toLowerCase()
    )
    saveHistory(history.value)
  }

  function clearHistory(): void {
    history.value = []
    saveHistory([])
  }

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  }
}
