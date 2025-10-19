# 多层嵌套侧边栏教程

下列示例演示如何让 Markdown 文档在侧边栏中按多级树状结构展示，并且拥有友好的中文标题。

## 目标目录结构

```text
docs/
└─ guide/
   └─ architecture/
      ├─ overview.md
      └─ patterns/
         ├─ rendering/
         │  └─ performance.md
         └─ state-management/
            ├─ advanced.md
            └─ fundamentals.md
```

所有 Markdown 文件都位于 `docs/` 下方，路径层级就是侧边栏的层级。新增文件后，需要在 `src/sidebarConfig.js` 中描述它们的显示文本以及顺序。

## 配置步骤

1. **新增 Markdown 文件**：将内容放入目标目录，例如 `docs/guide/architecture/overview.md`。
2. **编辑 `src/sidebarConfig.js`**：
   - 在 `labels` 中为每个文档或分组指定展示名称；键名使用相对路径（不含 `.md`）。
   - 在 `childrenOrder` 中声明每个分组下子节点的顺序，顶层排序仍由 `order` 控制。
3. **保存并重新加载页面**，即可以折叠/展开方式看到多级树形分支。

## 配置示例

```js
export default {
  labels: {
    guide: '指南',
    'guide/architecture': '架构专题',
    'guide/architecture/overview': '架构概览',
    'guide/architecture/patterns': '设计模式',
    'guide/architecture/patterns/state-management': '状态管理',
    'guide/architecture/patterns/state-management/fundamentals': '基础篇',
    'guide/architecture/patterns/state-management/advanced': '进阶技巧',
    'guide/architecture/patterns/rendering': '渲染策略',
    'guide/architecture/patterns/rendering/performance': '性能优化',
  },
  order: ['guide', 'api', 'examples', 'document'],
  childrenOrder: {
    guide: ['guide/introduction', 'guide/getting-started', 'guide/architecture'],
    'guide/architecture': ['guide/architecture/overview', 'guide/architecture/patterns'],
    'guide/architecture/patterns': [
      'guide/architecture/patterns/state-management',
      'guide/architecture/patterns/rendering',
    ],
    'guide/architecture/patterns/state-management': [
      'guide/architecture/patterns/state-management/fundamentals',
      'guide/architecture/patterns/state-management/advanced',
    ],
    'guide/architecture/patterns/rendering': [
      'guide/architecture/patterns/rendering/performance',
    ],
  },
}
```

- 对于路径 `guide/architecture/patterns/state-management/fundamentals`，侧边栏最终会显示“指南 → 架构专题 → 设计模式 → 状态管理 → 基础篇”。
- 如果没有在 `labels` 中配置，将使用路径片段的默认驼峰/首字母大写形式。

> 小贴士：配合组件的自动换行样式，分支名称再长也会优雅换行，展开状态不会被遮挡。
