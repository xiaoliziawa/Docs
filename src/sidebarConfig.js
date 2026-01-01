/**
 * 侧边栏配置
 *
 * 使用简洁的嵌套树形结构配置侧边栏
 *
 * 配置格式说明:
 * - path: 对应 docs 目录下的文件夹或文件路径（不含 .md 后缀）
 * - label: 显示名称（可选，不填则自动从文档标题或路径推导）
 * - children: 子项数组（可选，有子项则为分组，无则为文档链接）
 *
 * 示例:
 * {
 *   path: 'guide',
 *   label: '指南',
 *   children: [
 *     { path: 'guide/intro', label: '简介' },
 *     { path: 'guide/start' }  // label 可省略，自动推导
 *   ]
 * }
 */
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
  {
    path: 'examples',
    label: '示例',
    children: [
      { path: 'examples/custom-sidebar', label: '自定义侧边栏示例' },
    ],
  },
  {
    path: 'document',
    label: '文档',
    children: [
      { path: 'document/text', label: '文章1' },
      { path: 'document/public_welfare_station', label: '公益站' },
    ],
  },
]
