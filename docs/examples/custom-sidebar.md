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

所有 Markdown 文件都位于 `docs/` 下方，路径层级就是侧边栏的层级。新增文件后，需要在 `src/sidebarConfig.js` 中配置它们的显示文本以及顺序。

## 配置步骤

1. **新增 Markdown 文件**：将内容放入目标目录，例如 `docs/guide/architecture/overview.md`。
2. **编辑 `src/sidebarConfig.js`**：使用嵌套树形结构配置侧边栏，数组顺序即为显示顺序。
3. **保存并重新加载页面**，即可以折叠/展开方式看到多级树形分支。

## 配置格式说明

配置采用直观的嵌套树形结构：

- `path`: 对应 docs 目录下的文件夹或文件路径（不含 `.md` 后缀）
- `label`: 显示名称（可选，不填则自动从文档标题或路径推导）
- `children`: 子项数组（可选，有子项则为分组，无则为文档链接）

## 配置示例

```js
export default [
  {
    path: 'guide',
    label: '指南',
    children: [
      { path: 'guide/introduction', label: '简介' },
      { path: 'guide/getting-started', label: '快速上手' },
      {
        path: 'guide/architecture',
        label: '架构专题',
        children: [
          { path: 'guide/architecture/overview', label: '架构概览' },
          {
            path: 'guide/architecture/patterns',
            label: '设计模式',
            children: [
              {
                path: 'guide/architecture/patterns/state-management',
                label: '状态管理',
                children: [
                  { path: 'guide/architecture/patterns/state-management/fundamentals', label: '基础篇' },
                  { path: 'guide/architecture/patterns/state-management/advanced', label: '进阶技巧' },
                ],
              },
              {
                path: 'guide/architecture/patterns/rendering',
                label: '渲染策略',
                children: [
                  { path: 'guide/architecture/patterns/rendering/performance', label: '性能优化' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: 'api',
    label: 'API',
    children: [
      { path: 'api/reference', label: 'API 参考' },
    ],
  },
]
```

## 配置优势

- **一目了然**：树形结构直接反映侧边栏层级关系
- **顺序即配置**：数组顺序就是显示顺序，无需单独配置排序
- **就近维护**：`label` 和 `children` 在同一位置，无需跳转查找
- **可选省略**：`label` 可省略，自动从文档标题或路径推导

## 示例说明

对于路径 `guide/architecture/patterns/state-management/fundamentals`，侧边栏最终会显示层级：

**指南 → 架构专题 → 设计模式 → 状态管理 → 基础篇**

> [!tip]
> 配合组件的自动换行样式，分支名称再长也会优雅换行，展开状态不会被遮挡。
