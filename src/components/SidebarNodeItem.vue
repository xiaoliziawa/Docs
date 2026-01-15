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
  padding: 0.5rem 0.625rem;
  text-align: left;
  font: inherit;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  transition: all var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  position: relative;
}

.sidebar-item__group:active,
.sidebar-item__link:active {
  transform: scale(0.98);
}

.sidebar-item__group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-serif);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.125rem;
}

.sidebar-item__label {
  flex: 1;
  word-break: break-word;
}

.sidebar-item__group:hover {
  background: var(--color-toolbar-hover);
  color: var(--color-accent);
}

.sidebar-item__link {
  padding-left: 1.5rem;
  font-size: 0.875rem;
  margin: 0.125rem 0;
}

.sidebar-item__link::before {
  content: '';
  position: absolute;
  left: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-text-muted);
  opacity: 0.4;
  transition: all var(--transition-fast);
}

.sidebar-item__link:hover {
  background: var(--color-toolbar-hover);
  color: var(--color-accent);
}

.sidebar-item__link:hover::before {
  background: var(--color-accent);
  opacity: 1;
}

.sidebar-item__link.is-active {
  background: var(--color-accent);
  color: #ffffff;
  font-weight: 500;
}

.sidebar-item__link.is-active::before {
  background: #ffffff;
  opacity: 1;
}

.sidebar-item__caret {
  width: 0.4rem;
  height: 0.4rem;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg);
  transition: transform 0.15s ease;
  opacity: 0.5;
}

.sidebar-item__caret.is-collapsed {
  transform: rotate(-45deg);
}

.sidebar-item__children {
  margin: 0.25rem 0 0.375rem 0.5rem;
  padding-left: 0.75rem;
  border-left: 1px solid var(--color-divider);
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.15s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 移动端优化 */
@media (max-width: 640px) {
  .sidebar-item__group,
  .sidebar-item__link {
    padding: 0.625rem 0.5rem;
    font-size: 0.875rem;
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  .sidebar-item__link {
    padding-left: 1.375rem;
  }

  .sidebar-item__link::before {
    left: 0.5rem;
  }

  .sidebar-item__caret {
    width: 0.4rem;
    height: 0.4rem;
  }

  .sidebar-item__children {
    margin: 0.2rem 0 0.3rem 0.375rem;
    padding-left: 0.625rem;
  }
}

@media (max-width: 375px) {
  .sidebar-item__group,
  .sidebar-item__link {
    padding: 0.5rem 0.4rem;
    font-size: 0.85rem;
  }

  .sidebar-item__link {
    padding-left: 1.125rem;
  }
}
</style>
