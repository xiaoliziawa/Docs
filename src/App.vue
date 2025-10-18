<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import MarkdownViewer from './components/MarkdownViewer.vue'
import SearchBar from './components/SearchBar.vue'
import SidebarTree from './components/SidebarTree.vue'
import type { DocRecord, SidebarGroupNode } from './docService'
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

const searchableDocs = computed(() =>
  docs.value.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    content: doc.raw,
  })),
)

const hasDocs = computed(() => docs.value.length > 0)
const isDarkMode = computed(() => theme.value === 'dark')

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
        <button
          v-if="sidebarCollapsed"
          type="button"
          class="layout__sidebar-expand"
          @click="toggleSidebar"
        >
          展开导航
        </button>
      </aside>
      <main class="layout__content">
        <MarkdownViewer v-if="currentDoc" :content="currentDoc.html" />
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
