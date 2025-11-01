<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface TocItem {
  id: string
  level: number
  text: string
}

const props = defineProps<{ content: string }>()

const tocItems = ref<TocItem[]>([])
const activeId = ref<string>('')
const isVisible = ref(false)

const hasToc = computed(() => tocItems.value.length > 0)

function extractToc() {
  // Extract headings from the actual rendered markdown article
  const article = document.querySelector('.markdown')
  if (!article) return
  
  const headings = article.querySelectorAll('h1, h2, h3, h4, h5, h6')
  
  const items: TocItem[] = []
  headings.forEach((heading: Element) => {
    const level = parseInt(heading.tagName.substring(1))
    const text = heading.textContent || ''
    const id = heading.id
    
    if (id) {
      items.push({ id, level, text })
    }
  })
  
  tocItems.value = items
}

function scrollToHeading(id: string) {
  const element = document.getElementById(id)
  if (element) {
    const offset = 80 // Account for fixed header
    const top = element.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

function updateActiveHeading() {
  if (tocItems.value.length === 0) return
  
  const scrollPosition = window.scrollY + 100
  
  for (let i = tocItems.value.length - 1; i >= 0; i--) {
    const heading = document.getElementById(tocItems.value[i].id)
    if (heading && heading.offsetTop <= scrollPosition) {
      activeId.value = tocItems.value[i].id
      return
    }
  }
  
  activeId.value = tocItems.value[0]?.id || ''
}

function toggleToc() {
  isVisible.value = !isVisible.value
}

let scrollHandler: (() => void) | null = null

watch(
  () => props.content,
  () => {
    // Wait for the MarkdownViewer to render and add IDs
    setTimeout(() => {
      extractToc()
      updateActiveHeading()
    }, 200)
  },
  { immediate: true }
)

onMounted(() => {
  scrollHandler = () => updateActiveHeading()
  window.addEventListener('scroll', scrollHandler, { passive: true })
  
  // Initial extraction after mount
  setTimeout(() => {
    extractToc()
    updateActiveHeading()
  }, 200)
})

onBeforeUnmount(() => {
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
  }
})
</script>

<template>
  <div v-if="hasToc" class="toc-container" :class="{ 'is-visible': isVisible }">
    <button 
      type="button" 
      class="toc-toggle" 
      @click="toggleToc"
      aria-label="Toggle table of contents"
    >
      <span class="toc-toggle-icon">☰</span>
      <span class="toc-toggle-text">目录</span>
    </button>
    
    <nav class="toc" :class="{ 'is-visible': isVisible }">
      <div class="toc-header">
        <span class="toc-title">目录</span>
        <button 
          type="button" 
          class="toc-close" 
          @click="toggleToc"
          aria-label="Close table of contents"
        >
          ×
        </button>
      </div>
      <ul class="toc-list">
        <li
          v-for="item in tocItems"
          :key="item.id"
          class="toc-item"
          :class="[
            `toc-item--level-${item.level}`,
            { 'is-active': activeId === item.id }
          ]"
        >
          <a
            :href="`#${item.id}`"
            class="toc-link"
            @click.prevent="scrollToHeading(item.id)"
          >
            {{ item.text }}
          </a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.toc-container {
  position: fixed;
  right: 2rem;
  top: 6rem;
  z-index: 15;
}

.toc-toggle {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--color-shadow);
  transition: all var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.toc-toggle:hover {
  background: var(--color-toolbar-hover);
  border-color: var(--color-accent);
}

.toc-toggle-icon {
  font-size: 1rem;
}

.toc {
  width: 240px;
  max-height: calc(100vh - 8rem);
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-bg-surface);
  box-shadow: 0 2px 12px var(--color-shadow);
  overflow-y: auto;
  transition: all 0.3s ease;
}

.toc-header {
  display: none;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.toc-title {
  font-weight: 600;
  color: var(--color-text-primary);
}

.toc-close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all var(--transition-fast);
}

.toc-close:hover {
  background: var(--color-toolbar-hover);
  color: var(--color-text-primary);
}

.toc-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.toc-item {
  margin: 0.35rem 0;
}

.toc-item--level-1 {
  margin-left: 0;
}

.toc-item--level-2 {
  margin-left: 0.75rem;
}

.toc-item--level-3 {
  margin-left: 1.5rem;
}

.toc-item--level-4 {
  margin-left: 2.25rem;
}

.toc-item--level-5,
.toc-item--level-6 {
  margin-left: 3rem;
}

.toc-link {
  display: block;
  padding: 0.35rem 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
  border-radius: 0.25rem;
  transition: all var(--transition-fast);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toc-link:hover {
  color: var(--color-accent);
  background: var(--color-toolbar-hover);
}

.toc-item.is-active .toc-link {
  color: var(--color-accent);
  background: var(--color-toolbar-hover);
  font-weight: 600;
}

/* Tablet and mobile */
@media (max-width: 1200px) {
  .toc-container {
    right: 1rem;
    top: 5rem;
  }
  
  .toc {
    width: 220px;
  }
}

@media (max-width: 960px) {
  .toc-container {
    right: 1rem;
    bottom: 6rem;
    top: auto;
  }
  
  .toc-toggle {
    display: flex;
  }
  
  .toc {
    position: fixed;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 320px;
    max-height: 60vh;
    border-radius: 0.5rem 0.5rem 0 0;
    transform: translateY(100%);
    opacity: 0;
    pointer-events: none;
  }
  
  .toc.is-visible {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
  
  .toc-header {
    display: flex;
  }
}

@media (max-width: 640px) {
  .toc-toggle {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
  
  .toc {
    max-width: 100%;
    border-radius: 0;
  }
}
</style>
