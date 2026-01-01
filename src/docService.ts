import MarkdownIt from 'markdown-it'
import markdownItDeflist from 'markdown-it-deflist'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItTaskLists from 'markdown-it-task-lists'
import markdownItMathjax3 from 'markdown-it-mathjax3'
import hljs from 'highlight.js'

import sidebarConfig from './sidebarConfig.js'

const markdownModules = import.meta.glob('../docs/**/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})
  .use(markdownItFootnote)
  .use(markdownItDeflist)
  .use(markdownItTaskLists, { label: true, labelAfter: true })
  .use(markdownItMathjax3)

const escapeHtml = markdown.utils.escapeHtml

function calloutPlugin(md: MarkdownIt) {
  const defaultRender = md.renderer.rules.blockquote_open || function(tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }

  md.renderer.rules.blockquote_open = function(tokens, idx, options, env, self) {
    const nextToken = tokens[idx + 1]
    if (nextToken && nextToken.type === 'paragraph_open') {
      const contentToken = tokens[idx + 2]
      if (contentToken && contentToken.type === 'inline' && contentToken.content) {
        const calloutMatch = contentToken.content.match(/^\[!(tip|info|warning|danger|note)\]\s*/i)
        if (calloutMatch) {
          const type = calloutMatch[1].toLowerCase()
          contentToken.content = contentToken.content.slice(calloutMatch[0].length)

          const icons: Record<string, string> = {
            tip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 22h4M12 2v1M12 6a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V15H10v-1.5C8.8 12.8 8 11.5 8 10a4 4 0 0 1 4-4z"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
          }

          const titles: Record<string, string> = {
            tip: '提示',
            info: '信息',
            warning: '警告',
            danger: '危险',
            note: '注意'
          }

          return `<div class="callout callout--${type}"><div class="callout__icon">${icons[type]}</div><div class="callout__content"><div class="callout__title">${titles[type]}</div>`
        }
      }
    }
    return defaultRender(tokens, idx, options, env, self)
  }

  const defaultCloseRender = md.renderer.rules.blockquote_close || function(tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }

  md.renderer.rules.blockquote_close = function(tokens, idx, options, env, self) {
    let openIdx = idx - 1
    while (openIdx >= 0 && tokens[openIdx].type !== 'blockquote_open') {
      openIdx--
    }

    if (openIdx >= 0) {
      const nextToken = tokens[openIdx + 1]
      if (nextToken && nextToken.type === 'paragraph_open') {
        const contentToken = tokens[openIdx + 2]
        if (contentToken && contentToken.type === 'inline') {
          const originalContent = contentToken.content
          if (originalContent !== undefined) {
            const firstParagraph = tokens[openIdx + 2]
            if (firstParagraph && firstParagraph.meta?.isCallout) {
              return '</div></div>'
            }
            for (let i = openIdx; i < idx; i++) {
              if (tokens[i].type === 'inline' && tokens[i].content) {
                const match = tokens[i].content.match(/^\[!(tip|info|warning|danger|note)\]/i)
                if (match) {
                  return '</div></div>'
                }
              }
            }
          }
        }
      }
    }
    return defaultCloseRender(tokens, idx, options, env, self)
  }
}

markdown.use(calloutPlugin)

function normalizeMarkdown(raw: string): string {
  return raw.replace(/^\uFEFF/, '')
}

interface FrontMatter {
  title?: string
  lastUpdated?: string
  [key: string]: unknown
}

function parseFrontMatter(raw: string): { frontMatter: FrontMatter; content: string } {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
  const match = raw.match(frontMatterRegex)

  if (!match) {
    return { frontMatter: {}, content: raw }
  }

  const frontMatterStr = match[1]
  const content = raw.slice(match[0].length)
  const frontMatter: FrontMatter = {}

  frontMatterStr.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      const value = line.slice(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '')
      frontMatter[key] = value
    }
  })

  return { frontMatter, content }
}

function calculateWordCount(text: string): number {
  const cleanText = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~`>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const chineseChars = (cleanText.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = cleanText
    .replace(/[\u4e00-\u9fa5]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0).length

  return chineseChars + englishWords
}

function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 300
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}



function renderCodeBlock(code: string, info?: string): string {
  const language = (info ?? '').trim()
  if (language === 'mermaid') {
    const safe = escapeHtml(code.trim())
    return `<div class="mermaid">${safe}</div>`
  }
  const validLanguage = language && hljs.getLanguage(language) ? language : ''
  const highlighted = validLanguage
    ? hljs.highlight(code, { language: validLanguage, ignoreIllegals: true }).value
    : hljs.highlightAuto(code).value
  const classNames = ['hljs']

  if (validLanguage) {
    classNames.push(`language-${validLanguage}`)
  }

  const lines = highlighted.split('\n')
  if (lines[lines.length - 1] === '') {
    lines.pop()
  }

  const lineNumbersHtml = lines
    .map((_, index) => `<span class="line-number">${index + 1}</span>`)
    .join('')

  const codeHtml = lines
    .map((line) => `<span class="code-line">${line || ' '}</span>`)
    .join('\n')

  const languageLabel = validLanguage ? `<span class="code-language">${validLanguage}</span>` : ''

  return `<pre class="code-block">${languageLabel}<div class="code-wrapper"><div class="line-numbers">${lineNumbersHtml}</div><code class="${classNames.join(' ')}">${codeHtml}</code></div></pre>`
}

type FenceToken = { content: string; info: string }

markdown.renderer.rules.fence = (tokens: FenceToken[], idx: number): string => renderCodeBlock(tokens[idx].content, tokens[idx].info)
markdown.renderer.rules.code_block = (tokens: FenceToken[], idx: number): string => renderCodeBlock(tokens[idx].content)

export interface DocRecord {
  slug: string
  section: string
  title: string
  raw: string
  html: string
  lastUpdated?: string
  wordCount: number
  readingTime: number
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

interface SidebarConfigItem {
  path: string
  label?: string
  children?: SidebarConfigItem[]
}

type SidebarConfig = SidebarConfigItem[]

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
    const source = await loader()
    const raw = normalizeMarkdown(source)
    const { frontMatter, content } = parseFrontMatter(raw)
    const slug = path.replace('../docs/', '').replace(/\.md$/i, '')
    const section = slug.includes('/') ? slug.split('/')[0] : slug
    const title = (frontMatter.title as string) ?? extractTitle(content) ?? deriveTitle(slug.split('/').pop() ?? slug)
    const html = markdown.render(content)
    const wordCount = calculateWordCount(content)
    const readingTime = calculateReadingTime(wordCount)
    const lastUpdated = frontMatter.lastUpdated as string | undefined

    docs.push({ slug, section, title, raw: content, html, lastUpdated, wordCount, readingTime })
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
  const docMap = new Map<string, DocRecord>()
  for (const doc of docs) {
    docMap.set(doc.slug, doc)
  }

  return config.map((item) => buildSidebarNode(item, docMap)) as SidebarGroupNode[]
}

function buildSidebarNode(
  configItem: SidebarConfigItem,
  docMap: Map<string, DocRecord>,
): SidebarNode {
  const doc = docMap.get(configItem.path)

  if (configItem.children && configItem.children.length > 0) {
    const group: SidebarGroupNode = {
      type: 'group',
      path: configItem.path,
      label: configItem.label ?? doc?.title ?? deriveTitle(configItem.path.split('/').pop() ?? configItem.path),
      children: configItem.children.map((child) => buildSidebarNode(child, docMap)),
    }
    return group
  }

  const docNode: SidebarDocNode = {
    type: 'doc',
    path: configItem.path,
    label: configItem.label ?? doc?.title ?? deriveTitle(configItem.path.split('/').pop() ?? configItem.path),
    slug: configItem.path,
  }
  return docNode
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
