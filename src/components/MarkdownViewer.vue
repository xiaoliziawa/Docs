<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps<{ content: string }>()

const container = ref<HTMLElement | null>(null)

async function handleCopy(button: HTMLButtonElement, text: string) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    button.classList.add('is-success')
    button.textContent = 'Copied'
    window.setTimeout(() => {
      button.classList.remove('is-success')
      button.textContent = 'Copy code'
    }, 1200)
  } catch (error) {
    console.warn('Copy failed', error)
    button.textContent = 'Copy failed'
    window.setTimeout(() => {
      button.textContent = 'Copy code'
    }, 1400)
  }
}

type MathJaxController = { typesetPromise?: (elements?: (HTMLElement | string)[]) => Promise<unknown> }
type MermaidApi = {
  initialize?: (config?: Record<string, unknown>) => void
  run?: (options: { nodes: Element[] }) => Promise<unknown> | void
}

let mermaidInitialized = false
let mermaidRetryCount = 0

function typesetMath(): void {
  const root = container.value
  const mathJax = (window as typeof window & { MathJax?: MathJaxController }).MathJax

  if (!root || !mathJax?.typesetPromise) {
    return
  }

  mathJax.typesetPromise([root]).catch((error: unknown) => {
    console.warn('MathJax typeset failed', error)
  })
}

function renderMermaid(): void {
  const root = container.value
  const mermaid = (window as typeof window & { mermaid?: MermaidApi }).mermaid

  if (!root) {
    return
  }

  if (!mermaid) {
    if (mermaidRetryCount < 10) {
      mermaidRetryCount += 1
      window.setTimeout(renderMermaid, 150 * mermaidRetryCount)
    }
    return
  }

  mermaidRetryCount = 0

  if (!mermaidInitialized && mermaid.initialize) {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })
    mermaidInitialized = true
  }

  const nodes = Array.from(root.querySelectorAll<HTMLElement>('.mermaid'))
  if (nodes.length === 0 || !mermaid.run) {
    return
  }

  try {
    mermaid.run({ nodes })
  } catch (error) {
    console.warn('Mermaid render failed', error)
  }
}

function attachCopyButtons() {
  if (!container.value) {
    return
  }

  const root = container.value
  root.querySelectorAll('.copy-button').forEach((button) => {
    button.remove()
  })

  const codeBlocks = root.querySelectorAll('pre')

  codeBlocks.forEach((block) => {
    const code = block.querySelector('code')
    if (!code) {
      return
    }

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'copy-button'
    button.textContent = 'Copy code'
    button.addEventListener('click', () => handleCopy(button, code.textContent ?? ''))
    block.appendChild(button)
  })
}

watch(
  () => props.content,
  () => {
    nextTick(() => {
      attachCopyButtons()
      typesetMath()
      renderMermaid()
    })
  },
)

onMounted(() => {
  attachCopyButtons()
  typesetMath()
  renderMermaid()
})
</script>

<template>
  <article ref="container" class="markdown" v-html="props.content"></article>
</template>
