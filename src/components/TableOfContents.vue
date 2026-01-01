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
const isCollapsed = ref(false)

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

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
  <div v-if="hasToc" class="toc-container" :class="{ 'is-visible': isVisible, 'is-collapsed': isCollapsed }">
    <button
      type="button"
      class="toc-toggle"
      @click="toggleToc"
      aria-label="Toggle table of contents"
    >
      <span class="toc-toggle-icon">☰</span>
      <span class="toc-toggle-text">目录</span>
    </button>

    <nav class="toc" :class="{ 'is-visible': isVisible, 'is-collapsed': isCollapsed }">
      <div class="toc-header-desktop">
        <span class="toc-title">目录</span>
        <button
          type="button"
          class="toc-collapse-btn"
          @click="toggleCollapse"
          :aria-label="isCollapsed ? '展开目录' : '收起目录'"
          :title="isCollapsed ? '展开目录' : '收起目录'"
        >
          <span class="collapse-icon">{{ isCollapsed ? '◀' : '▶' }}</span>
        </button>
      </div>
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
  transition: all var(--transition-normal, 0.25s ease);
}

.toc-container.is-collapsed {
  right: 0;
}

.toc-toggle {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.125rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm, 0.5rem);
  background: var(--color-toolbar-surface, rgba(255, 255, 255, 0.95));
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px var(--color-shadow-lg, rgba(0, 0, 0, 0.08));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all var(--transition-fast, 0.15s ease);
  -webkit-tap-highlight-color: transparent;
}

.toc-toggle:hover {
  background: var(--color-accent-light, rgba(99, 102, 241, 0.1));
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.toc-toggle-icon {
  font-size: 1rem;
}

.toc {
  width: 260px;
  max-height: calc(100vh - 8rem);
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md, 0.75rem);
  background: var(--color-toolbar-surface, rgba(255, 255, 255, 0.95));
  box-shadow:
    0 4px 16px var(--color-shadow-lg, rgba(0, 0, 0, 0.08)),
    0 8px 32px var(--color-shadow-xl, rgba(0, 0, 0, 0.04));
  overflow-y: auto;
  overflow-x: hidden;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all var(--transition-normal, 0.25s ease);
}

.toc.is-collapsed {
  width: 48px;
  padding: 0.625rem;
  border-radius: var(--border-radius-sm, 0.5rem) 0 0 var(--border-radius-sm, 0.5rem);
}

.toc.is-collapsed .toc-list {
  display: none;
}

.toc.is-collapsed .toc-header-desktop .toc-title {
  display: none;
}

.toc-header-desktop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.875rem;
  border-bottom: 2px solid var(--color-border);
}

.toc.is-collapsed .toc-header-desktop {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
  justify-content: center;
}

.toc-collapse-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-muted, #94a3b8);
  font-size: 0.75rem;
  cursor: pointer;
  border-radius: var(--border-radius-sm, 0.5rem);
  transition: all var(--transition-fast, 0.15s ease);
  flex-shrink: 0;
}

.toc-collapse-btn:hover {
  background: var(--color-accent-light, rgba(99, 102, 241, 0.1));
  color: var(--color-accent);
}

.collapse-icon {
  display: inline-block;
  transition: transform var(--transition-normal, 0.25s ease);
}

.toc-header {
  display: none;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.875rem;
  padding-bottom: 0.875rem;
  border-bottom: 2px solid var(--color-border);
}

.toc-title {
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: -0.01em;
  background: var(--color-accent-gradient, var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.toc-close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-muted, #94a3b8);
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: var(--border-radius-sm, 0.5rem);
  transition: all var(--transition-fast, 0.15s ease);
}

.toc-close:hover {
  background: var(--color-accent-light, rgba(99, 102, 241, 0.1));
  color: var(--color-accent);
}

.toc-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.toc-item {
  margin: 0.375rem 0;
}

.toc-item--level-1 {
  margin-left: 0;
}

.toc-item--level-2 {
  margin-left: 0.875rem;
}

.toc-item--level-3 {
  margin-left: 1.75rem;
}

.toc-item--level-4 {
  margin-left: 2.5rem;
}

.toc-item--level-5,
.toc-item--level-6 {
  margin-left: 3.25rem;
}

.toc-link {
  display: block;
  padding: 0.4rem 0.625rem;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  line-height: 1.45;
  border-radius: var(--border-radius-sm, 0.5rem);
  transition: all var(--transition-fast, 0.15s ease);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
}

.toc-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: var(--color-accent-gradient, var(--color-accent));
  border-radius: 2px;
  transition: height var(--transition-fast, 0.15s ease);
}

.toc-link:hover {
  color: var(--color-accent);
  background: var(--color-accent-light, rgba(99, 102, 241, 0.1));
  padding-left: 0.875rem;
}

.toc-link:hover::before {
  height: 60%;
}

.toc-item.is-active .toc-link {
  color: var(--color-accent);
  background: var(--color-accent-light, rgba(99, 102, 241, 0.1));
  font-weight: 600;
  padding-left: 0.875rem;
}

.toc-item.is-active .toc-link::before {
  height: 60%;
}

/* Tablet and mobile */
@media (max-width: 1200px) {
  .toc-container {
    right: 1.25rem;
    top: 5.5rem;
  }

  .toc-container.is-collapsed {
    right: 0;
  }

  .toc {
    width: 240px;
  }

  .toc.is-collapsed {
    width: 44px;
  }
}

@media (max-width: 960px) {
  .toc-container {
    right: 1.25rem;
    bottom: 6rem;
    top: auto;
  }

  .toc-container.is-collapsed {
    right: 1.25rem;
  }

  .toc-toggle {
    display: flex;
  }

  .toc-header-desktop {
    display: none;
  }

  .toc {
    position: fixed;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 360px;
    max-height: 60vh;
    border-radius: var(--border-radius-lg, 1rem) var(--border-radius-lg, 1rem) 0 0;
    transform: translateY(100%);
    opacity: 0;
    pointer-events: none;
    box-shadow:
      0 -4px 24px var(--color-shadow-lg, rgba(0, 0, 0, 0.1)),
      0 -8px 48px var(--color-shadow-xl, rgba(0, 0, 0, 0.15));
  }

  .toc.is-collapsed {
    width: 100%;
    max-width: 360px;
    padding: 1.25rem;
    border-radius: var(--border-radius-lg, 1rem) var(--border-radius-lg, 1rem) 0 0;
  }

  .toc.is-visible {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .toc.is-collapsed .toc-list {
    display: block;
  }

  .toc-header {
    display: flex;
  }
}

@media (max-width: 640px) {
  .toc-toggle {
    padding: 0.5rem 0.875rem;
    font-size: 0.8rem;
  }

  .toc {
    max-width: 100%;
    border-radius: 0;
  }
}
</style>
