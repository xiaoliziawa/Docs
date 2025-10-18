# API 参考

下表汇总了在前端渲染过程中可能会用到的几个工具函数。

## `loadAllDocs`

```ts
import { loadAllDocs } from '@/docService'

const { docs, sidebar } = await loadAllDocs()
```

- **返回**：当前所有 Markdown 文档和侧边栏节点。
- **用途**：初始化应用时批量获取文档结构。

## `sidebarConfig.js`

`sidebarConfig.js` 可以自定义显示文本和树形结构：

```js
export default {
  labels: {
    guide: '指南',
    'guide/introduction': '介绍'
  },
  order: ['guide']
}
```

为任意分支或文档设置条目，就能让侧边栏显示更友好的名称。
