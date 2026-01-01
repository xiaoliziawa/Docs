<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSearchHistory } from '../composables/useSearchHistory'

interface SearchDoc {
  slug: string
  title: string
  content: string
}

const props = defineProps<{
  docs: SearchDoc[]
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'select', slug: string, keyword: string): void
}>()

const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()

const isFocused = ref(false)
const keyboardIndex = ref(-1)

const query = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

const filteredResults = computed(() => {
  const value = query.value.trim().toLowerCase()

  if (!value) {
    return []
  }

  return props.docs
    .map((doc) => {
      const titleHit = doc.title.toLowerCase().includes(value)
      const contentIndex = doc.content.toLowerCase().indexOf(value)

      if (!titleHit && contentIndex === -1) {
        return null
      }

      const snippet = contentIndex >= 0 ? createSnippet(doc.content, contentIndex, value.length) : ''

      return {
        slug: doc.slug,
        title: doc.title,
        snippet,
      }
    })
    .filter((entry): entry is { slug: string; title: string; snippet: string } => Boolean(entry))
    .slice(0, 8)
})

const showDropdown = computed(() => isFocused.value && (query.value.trim().length > 0 || history.value.length > 0))
const showHistory = computed(() => isFocused.value && query.value.trim().length === 0 && history.value.length > 0)

watch(
  () => query.value,
  () => {
    keyboardIndex.value = -1
  },
)

function createSnippet(content: string, index: number, queryLength: number): string {
  const start = Math.max(0, index - 40)
  const end = Math.min(content.length, index + queryLength + 60)
  return content
    .slice(start, end)
    .replace(/\s+/g, ' ')
    .trim()
}

function focus() {
  isFocused.value = true
}

function blur() {
  window.setTimeout(() => {
    isFocused.value = false
    keyboardIndex.value = -1
  }, 120)
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  query.value = target.value
}

function moveSelection(step: number) {
  if (!filteredResults.value.length) {
    return
  }

  const nextIndex = keyboardIndex.value + step
  const maxIndex = filteredResults.value.length - 1

  if (nextIndex < 0) {
    keyboardIndex.value = maxIndex
  } else if (nextIndex > maxIndex) {
    keyboardIndex.value = 0
  } else {
    keyboardIndex.value = nextIndex
  }
}

function submitCurrent() {
  if (keyboardIndex.value >= 0 && filteredResults.value[keyboardIndex.value]) {
    select(filteredResults.value[keyboardIndex.value])
  } else if (filteredResults.value[0]) {
    select(filteredResults.value[0])
  }
}

function select(entry: { slug: string }): void {
  addToHistory(query.value.trim())
  emit('select', entry.slug, query.value.trim())
  isFocused.value = false
  keyboardIndex.value = -1
}

function useHistoryItem(historyQuery: string): void {
  query.value = historyQuery
}

function removeHistoryItem(event: Event, historyQuery: string): void {
  event.stopPropagation()
  removeFromHistory(historyQuery)
}

function handleClearHistory(): void {
  clearHistory()
}

function handleKeydown(event: KeyboardEvent) {
  if (!showDropdown.value) {
    return
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      moveSelection(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveSelection(-1)
      break
    case 'Enter':
      event.preventDefault()
      submitCurrent()
      break
    case 'Escape':
      keyboardIndex.value = -1
      isFocused.value = false
      break
    default:
      break
  }
}
</script>

<template>
  <div class="search-bar" @keydown="handleKeydown">
    <div class="search-bar__input-wrapper">
      <span class="search-bar__icon" aria-hidden="true">🔍</span>
      <input
        :value="query"
        :placeholder="placeholder ?? '搜索文档'"
        class="search-bar__input"
        type="search"
        @focus="focus"
        @blur="blur"
        @input="onInput"
      />
    </div>
    <transition name="fade">
      <ul v-if="showDropdown" class="search-bar__results">
        <template v-if="showHistory">
          <li class="search-bar__history-header">
            <span>搜索历史</span>
            <button type="button" class="search-bar__clear-history" @mousedown.prevent @click="handleClearHistory">
              清除
            </button>
          </li>
          <li
            v-for="item in history"
            :key="item.query"
            class="search-bar__result search-bar__history-item"
          >
            <button type="button" @mousedown.prevent @click="useHistoryItem(item.query)">
              <span class="search-bar__history-icon">🕐</span>
              <span class="search-bar__result-title">{{ item.query }}</span>
            </button>
            <button
              type="button"
              class="search-bar__remove-history"
              @mousedown.prevent
              @click="(e) => removeHistoryItem(e, item.query)"
              aria-label="删除此记录"
            >
              ✕
            </button>
          </li>
        </template>
        <template v-else-if="filteredResults.length">
          <li
            v-for="(entry, index) in filteredResults"
            :key="entry.slug"
            :class="['search-bar__result', { 'is-active': index === keyboardIndex }]"
          >
            <button type="button" @mousedown.prevent @click="select(entry)">
              <span class="search-bar__result-title">{{ entry.title }}</span>
              <span v-if="entry.snippet" class="search-bar__result-snippet">{{ entry.snippet }}…</span>
            </button>
          </li>
        </template>
        <li v-else-if="!showHistory" class="search-bar__empty">未找到匹配的文档</li>
      </ul>
    </transition>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  width: min(480px, 100%);
}

.search-bar__input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md, 0.75rem);
  padding: 0.625rem 1rem 0.625rem 2.75rem;
  transition: all var(--transition-fast, 0.15s ease);
  box-shadow: 0 1px 3px var(--color-shadow, rgba(0, 0, 0, 0.04));
}

.search-bar__input-wrapper:focus-within {
  border-color: var(--color-accent);
  background: var(--color-bg-surface);
  box-shadow:
    0 0 0 3px var(--color-accent-light, rgba(99, 102, 241, 0.1)),
    0 4px 12px var(--color-shadow-lg, rgba(0, 0, 0, 0.08));
}

.search-bar__icon {
  position: absolute;
  left: 1rem;
  font-size: 1rem;
  opacity: 0.5;
  transition: opacity var(--transition-fast, 0.15s ease);
}

.search-bar__input-wrapper:focus-within .search-bar__icon {
  opacity: 0.8;
}

.search-bar__input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  color: var(--color-text-primary);
  font-weight: 450;
}

.search-bar__input::placeholder {
  color: var(--color-text-muted, #94a3b8);
  font-weight: 400;
}

.search-bar__results {
  position: absolute;
  top: calc(100% + 0.625rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.625rem 0;
  list-style: none;
  background: var(--color-toolbar-surface, rgba(255, 255, 255, 0.95));
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md, 0.75rem);
  box-shadow:
    0 4px 16px var(--color-shadow-lg, rgba(0, 0, 0, 0.08)),
    0 8px 32px var(--color-shadow-xl, rgba(0, 0, 0, 0.12));
  max-height: 360px;
  overflow-y: auto;
  z-index: 12;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all var(--transition-fast, 0.15s ease);
}

.search-bar__result {
  display: block;
}

.search-bar__result button {
  width: 100%;
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--color-text-primary);
  transition: all var(--transition-fast, 0.15s ease);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.search-bar__result button:active {
  transform: scale(0.99);
}

.search-bar__result-title {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
}

.search-bar__result-snippet {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.search-bar__result:hover,
.search-bar__result.is-active {
  background: var(--color-accent-light, rgba(99, 102, 241, 0.1));
}

.search-bar__result:hover button,
.search-bar__result.is-active button {
  color: var(--color-accent);
}

.search-bar__result.is-active {
  border-left: 3px solid var(--color-accent);
}

.search-bar__empty {
  padding: 1rem 1.25rem;
  color: var(--color-text-muted, #94a3b8);
  text-align: center;
  font-size: 0.9rem;
}

.search-bar__history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #94a3b8);
  border-bottom: 1px solid var(--color-border);
}

.search-bar__clear-history {
  background: none;
  border: none;
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm, 0.5rem);
  transition: all var(--transition-fast, 0.15s ease);
}

.search-bar__clear-history:hover {
  background: var(--color-accent-light, rgba(99, 102, 241, 0.1));
}

.search-bar__history-item {
  position: relative;
  display: flex;
  align-items: center;
}

.search-bar__history-item button:first-child {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.search-bar__history-icon {
  font-size: 0.875rem;
  opacity: 0.5;
}

.search-bar__remove-history {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted, #94a3b8);
  font-size: 0.7rem;
  cursor: pointer;
  padding: 0.35rem 0.5rem;
  border-radius: var(--border-radius-sm, 0.5rem);
  opacity: 0;
  transition: all var(--transition-fast, 0.15s ease);
}

.search-bar__history-item:hover .search-bar__remove-history {
  opacity: 1;
}

.search-bar__remove-history:hover {
  background: var(--color-error, #ef4444);
  color: #ffffff;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 960px) {
  .search-bar {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .search-bar__results {
    right: auto;
    width: calc(100vw - 2rem);
    max-height: 300px;
  }

  .search-bar__input-wrapper {
    padding: 0.5rem 0.875rem 0.5rem 2.5rem;
  }

  .search-bar__icon {
    left: 0.875rem;
    font-size: 0.9rem;
  }

  .search-bar__input {
    font-size: 0.9rem;
  }

  .search-bar__result button {
    padding: 0.625rem 1rem;
  }

  .search-bar__result-title {
    font-size: 0.9rem;
  }

  .search-bar__result-snippet {
    font-size: 0.78rem;
  }
}

@media (max-width: 375px) {
  .search-bar__results {
    width: calc(100vw - 1.5rem);
  }

  .search-bar__input-wrapper {
    padding: 0.45rem 0.75rem 0.45rem 2.25rem;
    border-radius: var(--border-radius-sm, 0.5rem);
  }

  .search-bar__icon {
    left: 0.75rem;
  }
}
</style>
