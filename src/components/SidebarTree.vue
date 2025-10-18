<script setup lang="ts">
import { toRefs } from 'vue'

import SidebarNodeItem from './SidebarNodeItem.vue'
import type { SidebarGroupNode } from '@/docService'

const props = defineProps<{ nodes: SidebarGroupNode[]; active?: string }>()
const { nodes, active } = toRefs(props)

const emit = defineEmits<{ (event: 'select', slug: string): void }>()

function handleSelect(slug: string) {
  emit('select', slug)
}
</script>

<template>
  <nav class="sidebar">
    <ul class="sidebar__list">
      <SidebarNodeItem
        v-for="node in nodes"
        :key="node.path"
        :node="node"
        :active="active"
        @select="handleSelect"
      />
    </ul>
  </nav>
</template>

<style scoped>
.sidebar {
  height: 100%;
}

.sidebar__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
