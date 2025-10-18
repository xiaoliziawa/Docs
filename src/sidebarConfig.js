export default {
  labels: {
    guide: '指南',
    'guide/introduction': '介绍',
    'guide/getting-started': '快速开始',
    api: 'API',
    'api/reference': 'API 参考',
    examples: '示例',
    'examples/custom-sidebar': '自定义侧边栏示例',
    document: '文章',
    'document/text': "文章1"
  },
  order: ['guide', 'api', 'examples', 'document'],
  childrenOrder: {
    guide: ['guide/introduction', 'guide/getting-started'],
    api: ['api/reference'],
    examples: ['examples/custom-sidebar'],
    document: ['document/text']
  },
}
