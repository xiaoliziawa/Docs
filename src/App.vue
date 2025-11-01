<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import MarkdownViewer from './components/MarkdownViewer.vue'
import ReadingProgress from './components/ReadingProgress.vue'
import SearchBar from './components/SearchBar.vue'
import SidebarTree from './components/SidebarTree.vue'
import TableOfContents from './components/TableOfContents.vue'
import { useDocHistory } from './composables/useDocHistory'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import type { DocRecord, SidebarGroupNode, SidebarNode } from './docService'
import { loadAllDocs } from './docService'

type ThemeMode = 'light' | 'dark'

const docs = ref<DocRecord[]>([])
const sidebar = ref<SidebarGroupNode[]>([])
const currentDoc = ref<DocRecord | null>(null)
const searchQuery = ref('')
const isLoading = ref(true)
const sidebarCollapsed = ref(false)
const toolbarOpen = ref(false)
const theme = ref<ThemeMode>('light')

const themeStorageKey = 'docs-theme'

// Document history
const currentSlug = computed(() => currentDoc.value?.slug || '')
const currentTitle = computed(() => currentDoc.value?.title || '')
const { history: docHistory, clearHistory } = useDocHistory(
  currentSlug.value,
  currentTitle.value
)

// Keyboard shortcuts
useKeyboardShortcuts([
  {
    key: 'k',
    ctrl: true,
    meta: true,
    handler: () => {
      const searchInput = document.querySelector('.search-bar__input') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    },
    description: 'Focus search'
  },
  {
    key: 'b',
    ctrl: true,
    meta: true,
    handler: () => toggleSidebar(),
    description: 'Toggle sidebar'
  },
  {
    key: 'd',
    ctrl: true,
    meta: true,
    handler: () => toggleThemeMode(),
    description: 'Toggle theme'
  },
  {
    key: 'Escape',
    handler: () => {
      searchQuery.value = ''
      toolbarOpen.value = false
    },
    description: 'Close search/toolbar'
  }
])

const searchableDocs = computed(() =>
  docs.value.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    content: doc.raw,
  })),
)

const hasDocs = computed(() => docs.value.length > 0)
const isDarkMode = computed(() => theme.value === 'dark')
const orderedDocs = computed<DocRecord[]>(() => {
  if (!sidebar.value.length || !docs.value.length) {
    return [...docs.value]
  }

  const docMap = new Map(docs.value.map((doc) => [doc.slug, doc]))
  const collected: DocRecord[] = []

  const visit = (nodes: SidebarNode[]) => {
    nodes.forEach((node) => {
      if (node.type === 'doc') {
        const match = docMap.get(node.slug)
        if (match) {
          collected.push(match)
        }
      } else {
        visit(node.children)
      }
    })
  }

  sidebar.value.forEach((group) => visit(group.children))

  return collected.length ? collected : [...docs.value]
})

const currentIndex = computed(() => {
  const active = currentDoc.value
  if (!active) {
    return -1
  }

  return orderedDocs.value.findIndex((doc) => doc.slug === active.slug)
})

const previousDoc = computed<DocRecord | null>(() => {
  if (currentIndex.value > 0) {
    return orderedDocs.value[currentIndex.value - 1]
  }

  return null
})

const nextDoc = computed<DocRecord | null>(() => {
  if (currentIndex.value >= 0 && currentIndex.value < orderedDocs.value.length - 1) {
    return orderedDocs.value[currentIndex.value + 1]
  }

  return null
})

let cleanupHashListener: (() => void) | null = null
let cleanupThemeListener: (() => void) | null = null

function findDoc(slug: string): DocRecord | undefined {
  return docs.value.find((doc) => doc.slug === slug)
}

function updateHash(slug: string): void {
  const nextHash = `#/${slug}`
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash
  }
}

function selectDoc(slug: string): void {
  const doc = findDoc(slug)
  if (!doc) {
    return
  }

  currentDoc.value = doc
  searchQuery.value = ''
  updateHash(doc.slug)
  if (window.innerWidth <= 960) {
    sidebarCollapsed.value = true
    // 移动端选择文档后滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function applyHash(): void {
  const rawHash = window.location.hash.replace(/^#\/?/, '')

  if (!rawHash) {
    if (!currentDoc.value && docs.value[0]) {
      selectDoc(docs.value[0].slug)
    }
    return
  }

  const doc = findDoc(rawHash)
  if (doc) {
    currentDoc.value = doc
  }
}

function initializeTheme(): void {
  if (typeof window === 'undefined') {
    return
  }

  const storedTheme = window.localStorage.getItem(themeStorageKey)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    theme.value = storedTheme
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme.value = 'dark'
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleChange = (event: MediaQueryListEvent) => {
    const hasManualPreference = window.localStorage.getItem(themeStorageKey)
    if (hasManualPreference === 'light' || hasManualPreference === 'dark') {
      return
    }

    theme.value = event.matches ? 'dark' : 'light'
  }

  mediaQuery.addEventListener('change', handleChange)
  cleanupThemeListener = () => mediaQuery.removeEventListener('change', handleChange)
}

onMounted(async () => {
  initializeTheme()

  const { docs: loadedDocs, sidebar: loadedSidebar } = await loadAllDocs()
  docs.value = loadedDocs
  sidebar.value = loadedSidebar
  isLoading.value = false

  applyHash()
  if (!currentDoc.value && docs.value[0]) {
    currentDoc.value = docs.value[0]
    updateHash(docs.value[0].slug)
  }

  const hashHandler = () => applyHash()
  window.addEventListener('hashchange', hashHandler)
  cleanupHashListener = () => window.removeEventListener('hashchange', hashHandler)
})

onBeforeUnmount(() => {
  if (cleanupHashListener) {
    cleanupHashListener()
    cleanupHashListener = null
  }

  if (cleanupThemeListener) {
    cleanupThemeListener()
    cleanupThemeListener = null
  }
})

watch(
  () => currentDoc.value,
  (doc) => {
    if (doc) {
      document.title = `${doc.title} | 文档中心`
    } else {
      document.title = '文档中心'
    }
  },
  { immediate: true },
)

watch(
  () => theme.value,
  (mode) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode)
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(themeStorageKey, mode)
    }
  },
  { immediate: true },
)

function toggleToolbar(): void {
  toolbarOpen.value = !toolbarOpen.value
}

function openToolbar(): void {
  toolbarOpen.value = true
}

function closeToolbar(): void {
  toolbarOpen.value = false
}

function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  closeToolbar()
}

function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function toggleThemeMode(): void {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

function handleThemeToggle(): void {
  toggleThemeMode()
  closeToolbar()
}
</script>

<template>
  <div class="app-shell">
    <ReadingProgress />
    <header class="top-bar">
      <div class="top-bar__brand">
        <img src="/favicon.svg" alt="" class="top-bar__logo" />
        <span class="top-bar__title">文档中心</span>
      </div>
      <button
        v-if="hasDocs"
        type="button"
        class="top-bar__sidebar-toggle"
        :aria-expanded="!sidebarCollapsed"
        @click="toggleSidebar"
      >
        {{ sidebarCollapsed ? '展开导航' : '收起导航' }}
      </button>
      <SearchBar
        v-if="hasDocs"
        class="top-bar__search"
        :docs="searchableDocs"
        :model-value="searchQuery"
        placeholder="搜索文档..."
        @update:model-value="(value) => (searchQuery = value)"
        @select="selectDoc"
      />
    </header>

    <div v-if="hasDocs" class="layout" :class="{ 'layout--sidebar-collapsed': sidebarCollapsed }">
      <aside class="layout__sidebar" :class="{ 'is-collapsed': sidebarCollapsed }">
        <SidebarTree
          class="layout__sidebar-tree"
          :nodes="sidebar"
          :active="currentDoc ? currentDoc.slug : ''"
          @select="selectDoc"
          v-show="!sidebarCollapsed"
          :aria-hidden="sidebarCollapsed"
        />
      </aside>
      <main class="layout__content">
        <div v-if="currentDoc" class="doc-view">
          <TableOfContents v-if="currentDoc" :content="currentDoc.html" />
          <MarkdownViewer :content="currentDoc.html" />
          <nav
            v-if="previousDoc || nextDoc"
            class="doc-pager"
            aria-label="Document navigation"
          >
            <button
              v-if="previousDoc"
              type="button"
              class="doc-pager__item doc-pager__item--previous"
              @click="selectDoc(previousDoc.slug)"
            >
              <span class="doc-pager__hint">Previous page</span>
              <span class="doc-pager__title">{{ previousDoc.title }}</span>
            </button>
            <button
              v-if="nextDoc"
              type="button"
              class="doc-pager__item doc-pager__item--next"
              @click="selectDoc(nextDoc.slug)"
            >
              <span class="doc-pager__hint">Next page</span>
              <span class="doc-pager__title">{{ nextDoc.title }}</span>
            </button>
          </nav>
        </div>
        <div v-else class="empty-state">请选择左侧的文档查看内容。</div>
      </main>
    </div>

    <main v-else class="layout__content">
      <div class="empty-state">
        {{ isLoading ? '正在加载文档...' : '暂未找到任何文档，请在 docs 目录中添加 Markdown 文件。' }}
      </div>
    </main>

    <div
      class="floating-toolbar"
      @mouseenter="openToolbar"
      @mouseleave="closeToolbar"
    >
      <div class="floating-toolbar__actions" :class="{ 'is-open': toolbarOpen }">
        <button type="button" class="floating-toolbar__action" @click="handleThemeToggle">
          {{ isDarkMode ? '切换到亮色模式' : '切换到夜间模式' }}
        </button>
        <button type="button" class="floating-toolbar__action" @click="scrollToTop">
          返回顶部
        </button>
      </div>
      <button
        type="button"
        class="floating-toolbar__trigger"
        :class="{ 'is-open': toolbarOpen }"
        @click="toggleToolbar"
        aria-label="Toggle toolbar"
      >
        <span class="floating-toolbar__blade"></span>
        <span class="floating-toolbar__blade second"></span>
        <span class="floating-toolbar__blade third"></span>
      </button>
    </div>
  </div>
</template>
