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
  height: 2px;
  background: transparent;
  z-index: 100;
  pointer-events: none;
}

.reading-progress__bar {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.1s ease;
}
</style>
