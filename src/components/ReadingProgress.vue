<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const progress = ref(0)

function updateProgress() {
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  
  const totalScroll = documentHeight - windowHeight
  
  if (totalScroll > 0) {
    progress.value = (scrollTop / totalScroll) * 100
  } else {
    progress.value = 0
  }
}

let scrollHandler: (() => void) | null = null
let resizeHandler: (() => void) | null = null

onMounted(() => {
  scrollHandler = () => updateProgress()
  resizeHandler = () => updateProgress()
  
  window.addEventListener('scroll', scrollHandler, { passive: true })
  window.addEventListener('resize', resizeHandler, { passive: true })
  
  updateProgress()
})

onBeforeUnmount(() => {
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
})
</script>

<template>
  <div class="reading-progress">
    <div 
      class="reading-progress__bar" 
      :style="{ width: `${progress}%` }"
    ></div>
  </div>
</template>

<style scoped>
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  z-index: 100;
  pointer-events: none;
}

.reading-progress__bar {
  height: 100%;
  background: var(--color-accent-gradient, linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%));
  transition: width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 0 10px var(--color-accent, #6366f1),
    0 0 20px rgba(99, 102, 241, 0.3);
  border-radius: 0 2px 2px 0;
}

[data-theme='dark'] .reading-progress__bar {
  background: var(--color-accent-gradient, linear-gradient(90deg, #a78bfa 0%, #f472b6 100%));
  box-shadow:
    0 0 12px var(--color-accent, #a78bfa),
    0 0 24px rgba(167, 139, 250, 0.4);
}
</style>
