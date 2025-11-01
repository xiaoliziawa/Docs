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
  background: linear-gradient(
    90deg,
    var(--color-accent) 0%,
    var(--color-accent-strong) 100%
  );
  transition: width 0.2s ease-out;
  box-shadow: 0 0 8px var(--color-accent);
}

[data-theme='dark'] .reading-progress__bar {
  background: linear-gradient(
    90deg,
    var(--color-accent) 0%,
    #4ade80 100%
  );
  box-shadow: 0 0 12px var(--color-accent);
}
</style>
