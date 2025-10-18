
# 自定义侧边栏示例

本文演示如何为新增的 Markdown 文档指定一个友好的路由名称和侧边栏结构。

## 目标

我们在 `docs/examples/custom-sidebar.md` 新增了本文。如果希望它以“示例 > 自定义侧边栏”出现在导航树中，可以按以下步骤操作：

1. 在 `docs/examples` 目录写好 Markdown 文件（本文就是一个例子）。
2. 打开 `src/sidebarConfig.js`，为新的分支和页面配置显示文本以及排序。

## 配置示例

```js
export default {
  labels: {
    // 目录名称 => 侧边栏显示名称
    examples: '示例',
    'examples/custom-sidebar': '自定义侧边栏',
  },
  order: ['guide', 'api', 'examples'],
  childrenOrder: {
    examples: ['examples/custom-sidebar'],
  },
}
```

- `labels` 中的键使用文档的相对路径（不带 `.md` 后缀）。
- `order` 控制顶级分支排序，`childrenOrder` 控制分支内部的文档顺序。

保存后刷新页面，即可在左侧导航看到新的“示例”分支。
