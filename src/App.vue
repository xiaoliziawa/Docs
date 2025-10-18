<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import MarkdownViewer from './components/MarkdownViewer.vue'
import SearchBar from './components/SearchBar.vue'
import SidebarTree from './components/SidebarTree.vue'
import type { DocRecord, SidebarGroupNode } from './docService'
import { loadAllDocs } from './docService'

const docs = ref<DocRecord[]>([])
const sidebar = ref<SidebarGroupNode[]>([])
const currentDoc = ref<DocRecord | null>(null)
const searchQuery = ref('')
const isLoading = ref(true)

const searchableDocs = computed(() =>
  docs.value.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    content: doc.raw,
  })),
)

const hasDocs = computed(() => docs.value.length > 0)
const toolbarOpen = ref(false)

let cleanupHashListener: (() => void) | null = null

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

onMounted(async () => {
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
</script>

<template>
  <div class="app-shell">
    <header class="top-bar">
      <div class="top-bar__brand">
        <img src="/favicon.svg" alt="" class="top-bar__logo" />
        <span class="top-bar__title">文档中心</span>
      </div>
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

    <div v-if="hasDocs" class="layout">
      <SidebarTree
        class="layout__sidebar"
        :nodes="sidebar"
        :active="currentDoc ? currentDoc.slug : ''"
        @select="selectDoc"
      />
      <main class="layout__content">
        <MarkdownViewer v-if="currentDoc" :content="currentDoc.html" />
        <div v-else class="empty-state">Please choose a document from the sidebar.</div>
      </main>
    </div>

    <main v-else class="layout__content">
      <div class="empty-state">
        {{ isLoading ? 'Loading documents...' : 'No docs found. Add Markdown files under docs.' }}
      </div>
    </main>

    <div
      class="floating-toolbar"
      @mouseenter="openToolbar"
      @mouseleave="closeToolbar"
    >
      <div class="floating-toolbar__actions" :class="{ 'is-open': toolbarOpen }">
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
