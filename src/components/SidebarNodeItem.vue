<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue'

import type { SidebarNode } from '@/docService'

defineOptions({ name: 'SidebarNodeItem' })

const props = defineProps<{ node: SidebarNode; active?: string }>()

const emit = defineEmits<{ (event: 'select', slug: string): void }>()

const { node, active } = toRefs(props)

const isGroup = computed(() => node.value.type === 'group')
const isActive = computed(
  () => node.value.type === 'doc' && active.value === node.value.slug,
)

const childNodes = computed(() => (node.value.type === 'group' ? node.value.children : []))

const collapsed = ref(false)

watch(
  () => active.value,
  (slug) => {
    if (node.value.type === 'group' && slug) {
      if (nodeContainsSlug(node.value, slug)) {
        collapsed.value = false
      }
    }
  },
  { immediate: true },
)

function nodeContainsSlug(target: SidebarNode, slug: string): boolean {
  if (target.type === 'doc') {
    return target.slug === slug
  }

  return target.children.some((child) => nodeContainsSlug(child, slug))
}

function toggleGroup() {
  if (!isGroup.value) {
    return
  }

  collapsed.value = !collapsed.value
}

function handleSelect() {
  if (node.value.type === 'doc') {
    emit('select', node.value.slug)
  }
}
</script>

<template>
  <li class="sidebar-item">
    <button
      v-if="isGroup"
      class="sidebar-item__group"
      type="button"
      @click="toggleGroup"
    >
      <span class="sidebar-item__caret" :class="{ 'is-collapsed': collapsed }" aria-hidden="true"></span>
      <span class="sidebar-item__label">{{ node.label }}</span>
    </button>
    <button
      v-else
      class="sidebar-item__link"
      :class="{ 'is-active': isActive }"
      type="button"
      @click="handleSelect"
    >
      {{ node.label }}
    </button>
    <transition name="accordion">
      <ul v-if="isGroup && !collapsed" class="sidebar-item__children">
        <SidebarNodeItem
          v-for="child in childNodes"
          :key="child.path"
          :node="child"
          :active="active"
          @select="emit('select', $event)"
        />
      </ul>
    </transition>
  </li>
</template>

<style scoped>
.sidebar-item {
  margin: 0;
  list-style: none;
}

.sidebar-item__group,
.sidebar-item__link {
  width: 100%;
  background: transparent;
  border: none;
  padding: 0.4rem 0.35rem 0.4rem 0.35rem;
  text-align: left;
  font: inherit;
  color: #374151;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background 0.2s ease, color 0.2s ease;
}

.sidebar-item__group {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 600;
  color: #1f2937;
}

.sidebar-item__group:hover {
  background: rgba(79, 70, 229, 0.08);
  color: #4338ca;
}

.sidebar-item__link {
  padding-left: 1.6rem;
  font-size: 0.95rem;
  color: #4b5563;
}

.sidebar-item__link:hover {
  background: rgba(99, 102, 241, 0.08);
  color: #4338ca;
}

.sidebar-item__link.is-active {
  background: rgba(99, 102, 241, 0.16);
  color: #312e81;
  font-weight: 600;
}

.sidebar-item__caret {
  width: 0.65rem;
  height: 0.65rem;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  transition: transform 0.2s ease;
}

.sidebar-item__caret.is-collapsed {
  transform: rotate(-45deg);
}

.sidebar-item__children {
  margin: 0.35rem 0 0.35rem 0.35rem;
  padding-left: 0.75rem;
  border-left: 1px solid #e5e7eb;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.18s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
