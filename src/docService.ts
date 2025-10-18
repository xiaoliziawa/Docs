import { marked } from 'marked'
import hljs from 'highlight.js'

import sidebarConfig from './sidebarConfig.js'

const markdownModules = import.meta.glob('../docs/**/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

const renderer = new marked.Renderer()

renderer.code = ({ text, lang }) => {
  const language = (lang ?? '').trim()
  const validLanguage = language && hljs.getLanguage(language) ? language : ''
  const highlighted = validLanguage
    ? hljs.highlight(text, { language: validLanguage }).value
    : hljs.highlightAuto(text).value
  const languageClass = validLanguage ? ` language-${validLanguage}` : ''

  return `<pre><code class="hljs${languageClass}">${highlighted}</code></pre>`
}

marked.setOptions({ renderer })

export interface DocRecord {
  slug: string
  section: string
  title: string
  raw: string
  html: string
}

export interface SidebarDocNode {
  type: 'doc'
  path: string
  label: string
  slug: string
}

export interface SidebarGroupNode {
  type: 'group'
  path: string
  label: string
  children: SidebarNode[]
}

export type SidebarNode = SidebarDocNode | SidebarGroupNode

interface SidebarConfig {
  labels?: Record<string, string>
  order?: string[]
  childrenOrder?: Record<string, string[]>
}

const config: SidebarConfig = sidebarConfig

let cachedDocs: DocRecord[] | null = null
let cachedSidebar: SidebarGroupNode[] | null = null

export async function loadAllDocs(): Promise<{
  docs: DocRecord[]
  sidebar: SidebarGroupNode[]
}> {
  if (cachedDocs && cachedSidebar) {
    return { docs: cachedDocs, sidebar: cachedSidebar }
  }

  const docs: DocRecord[] = []

  for (const [path, loader] of Object.entries(markdownModules)) {
    const raw = await loader()
    const slug = path.replace('../docs/', '').replace(/\.md$/i, '')
    const section = slug.includes('/') ? slug.split('/')[0] : slug
    const title = extractTitle(raw) ?? deriveTitle(slug.split('/').pop() ?? slug)
    const html = await marked.parse(raw)

    docs.push({ slug, section, title, raw, html })
  }

  docs.sort((a, b) => a.slug.localeCompare(b.slug, 'en'))

  cachedDocs = docs
  cachedSidebar = buildSidebar(docs)

  return { docs, sidebar: cachedSidebar }
}

export function resetDocCache(): void {
  cachedDocs = null
  cachedSidebar = null
}

function buildSidebar(docs: DocRecord[]): SidebarGroupNode[] {
  const root: SidebarGroupNode = {
    type: 'group',
    path: '',
    label: '',
    children: [],
  }

  for (const doc of docs) {
    insertDocNode(root, doc)
  }

  applyConfig(root)
  sortChildren(root, config.order ?? [])

  return root.children.filter((node): node is SidebarGroupNode => node.type === 'group')
}

function insertDocNode(root: SidebarGroupNode, doc: DocRecord): void {
  const segments = doc.slug.split('/')
  let current = root
  let accumulated = ''

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index]
    accumulated = accumulated ? `${accumulated}/${segment}` : segment

    let group = current.children.find(
      (child): child is SidebarGroupNode => child.type === 'group' && child.path === accumulated,
    )

    if (!group) {
      group = {
        type: 'group',
        path: accumulated,
        label: deriveTitle(segment),
        children: [],
      }

      current.children.push(group)
    }

    current = group
  }

  const docNode: SidebarDocNode = {
    type: 'doc',
    path: doc.slug,
    label: doc.title,
    slug: doc.slug,
  }

  current.children.push(docNode)
}

function applyConfig(group: SidebarGroupNode): void {
  if (group.path && config.labels?.[group.path]) {
    group.label = config.labels[group.path]
  } else if (!group.label && group.path) {
    group.label = deriveTitle(group.path.split('/').pop() ?? group.path)
  }

  for (const child of group.children) {
    if (child.type === 'group') {
      applyConfig(child)
    } else if (config.labels?.[child.path]) {
      child.label = config.labels[child.path]
    }
  }
}

function sortChildren(group: SidebarGroupNode, topLevelOrder: string[]): void {
  const baseOrder = group.path ? config.childrenOrder?.[group.path] ?? [] : topLevelOrder
  const orderMap = new Map<string, number>()

  baseOrder.forEach((path, index) => {
    orderMap.set(path, index)
  })

  group.children.sort((a, b) => {
    const orderA = orderMap.get(a.path)
    const orderB = orderMap.get(b.path)

    if (orderA !== undefined || orderB !== undefined) {
      return (orderA ?? Number.MAX_SAFE_INTEGER) - (orderB ?? Number.MAX_SAFE_INTEGER)
    }

    return a.label.localeCompare(b.label, 'zh-Hans', { sensitivity: 'base' })
  })

  for (const child of group.children) {
    if (child.type === 'group') {
      sortChildren(child, topLevelOrder)
    }
  }
}

function extractTitle(raw: string): string | null {
  const headingMatch = raw.match(/^#\s+(.+)$/m)

  if (headingMatch) {
    return headingMatch[1].trim()
  }

  return null
}

function deriveTitle(value: string): string {
  return value
    .split(/[\\/_-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}
