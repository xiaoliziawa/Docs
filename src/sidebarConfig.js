export default {
  labels: {
    guide: '指南',
    'guide/introduction': '介绍',
    'guide/getting-started': '快速开始',
    api: 'API',
    'api/reference': 'API 参考',
    examples: '示例',
    'examples/custom-sidebar': '自定义侧边栏',
  },
  order: ['examples', 'api', 'guide'],
  childrenOrder: {
    examples: ['examples/custom-sidebar'],
    guide: ['guide/introduction', 'guide/getting-started'],
    api: ['api/reference']
  },
}
