<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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
  (event: 'select', slug: string): void
}>()

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

const showDropdown = computed(() => isFocused.value && query.value.trim().length > 0)

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
  emit('select', entry.slug)
  isFocused.value = false
  keyboardIndex.value = -1
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
        <template v-if="filteredResults.length">
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
        <li v-else class="search-bar__empty">未找到匹配的文档</li>
      </ul>
    </transition>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  width: min(460px, 100%);
}

.search-bar__input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  padding: 0.5rem 0.9rem 0.5rem 2.35rem;
  transition: border-color var(--transition-fast), background 0.3s ease;
}

.search-bar__input-wrapper:focus-within {
  border-color: var(--color-accent);
  background: var(--color-bg-surface);
}

.search-bar__icon {
  position: absolute;
  left: 0.85rem;
  font-size: 1rem;
  opacity: 0.6;
}

.search-bar__input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  color: var(--color-text-primary);
}

.search-bar__input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.search-bar__results {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.5rem 0;
  list-style: none;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px var(--color-shadow);
  max-height: 320px;
  overflow-y: auto;
  z-index: 12;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.search-bar__result {
  display: block;
}

.search-bar__result button {
  width: 100%;
  padding: 0.6rem 1rem;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--color-text-primary);
  transition: color var(--transition-fast), background-color var(--transition-fast), transform 0.1s ease;
  /* 移动端触摸优化 */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.search-bar__result button:active {
  transform: scale(0.98);
}

.search-bar__result-title {
  display: block;
  font-weight: 600;
}

.search-bar__result-snippet {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
}

.search-bar__result:hover,
.search-bar__result.is-active {
  background: var(--color-toolbar-hover);
}

.search-bar__result:hover button,
.search-bar__result.is-active button {
  color: var(--color-accent);
}

.search-bar__empty {
  padding: 0.75rem 1rem;
  color: var(--color-text-secondary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .search-bar {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .search-bar__results {
    right: auto;
    width: calc(100vw - 2.5rem);
    max-height: 280px;
  }

  .search-bar__input-wrapper {
    padding: 0.45rem 0.8rem 0.45rem 2.2rem;
  }

  .search-bar__icon {
    left: 0.75rem;
    font-size: 0.9rem;
  }

  .search-bar__input {
    font-size: 0.9rem;
  }

  .search-bar__result button {
    padding: 0.55rem 0.85rem;
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
    padding: 0.4rem 0.7rem 0.4rem 2rem;
  }

  .search-bar__icon {
    left: 0.65rem;
  }
}
</style>
