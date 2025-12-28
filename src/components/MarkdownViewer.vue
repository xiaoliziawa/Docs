<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  content: string
  highlightKeyword?: string
}>()

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

function addHeadingIds() {
  if (!container.value) {
    return
  }

  const root = container.value
  const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6')

  headings.forEach((heading: Element, index: number) => {
    if (!heading.id) {
      heading.id = `heading-${index}`
    }
  })
}

function clearHighlights() {
  if (!container.value) {
    return
  }

  const root = container.value
  const marks = root.querySelectorAll('mark.search-highlight')
  marks.forEach((mark) => {
    const parent = mark.parentNode
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark)
      parent.normalize()
    }
  })
}

function highlightText(keyword: string) {
  if (!container.value || !keyword) {
    return
  }

  const root = container.value
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        const tagName = parent.tagName.toLowerCase()
        if (['script', 'style', 'code', 'pre', 'mark'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  const textNodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text)
  }

  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  let firstMatch: HTMLElement | null = null

  textNodes.forEach((textNode) => {
    const text = textNode.textContent || ''
    if (!regex.test(text)) {
      return
    }
    regex.lastIndex = 0

    const fragment = document.createDocumentFragment()
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)))
      }

      const mark = document.createElement('mark')
      mark.className = 'search-highlight'
      mark.textContent = match[1]
      fragment.appendChild(mark)

      if (!firstMatch) {
        firstMatch = mark
      }

      lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
    }

    textNode.parentNode?.replaceChild(fragment, textNode)
  })

  if (firstMatch) {
    setTimeout(() => {
      firstMatch?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }
}

watch(
  () => props.highlightKeyword,
  (keyword) => {
    nextTick(() => {
      clearHighlights()
      if (keyword) {
        highlightText(keyword)
      }
    })
  }
)

watch(
  () => props.content,
  () => {
    nextTick(() => {
      addHeadingIds()
      attachCopyButtons()
      typesetMath()
      renderMermaid()
    })
  },
)

onMounted(() => {
  addHeadingIds()
  attachCopyButtons()
  typesetMath()
  renderMermaid()
})
</script>

<template>
  <article ref="container" class="markdown" v-html="props.content"></article>
</template>

<style scoped>
/* 移动端优化 */
@media (max-width: 640px) {
  .markdown :deep(img) {
    max-width: 100%;
    height: auto;
  }

  .markdown :deep(.mermaid) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .markdown :deep(ul),
  .markdown :deep(ol) {
    margin-left: 1.2rem;
  }

  .markdown :deep(blockquote) {
    margin-left: 0;
    margin-right: 0;
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

@media (max-width: 375px) {
  .markdown :deep(ul),
  .markdown :deep(ol) {
    margin-left: 1rem;
  }
}
</style>
