import type { Plugin } from '../types/plugins';

export const INITIAL_PLUGINS: Plugin[] = [
  {
    id: 'obsidian-graph-enhancer',
    name: 'Obsidian 知识图谱增强器',
    version: '2.4.1',
    author: 'Knowhub Graph Team',
    description: '为 Wiki 知识图谱提供 3D 渲染、聚类高亮、标签过滤以及动态物理引擎交互。',
    category: '数据可视化',
    downloads: 48920,
    stars: 1240,
    enabled: true,
    installed: true,
    iconName: 'Network',
    settings: [
      { key: 'physicsEngine', label: '启用物理弹簧模拟', type: 'boolean', value: true },
      { key: 'nodeLimit', label: '最大渲染节点数', type: 'select', value: '250', options: ['100', '250', '500', '1000'] },
      { key: 'colorScheme', label: '图谱配色方案', type: 'select', value: 'obsidian-neon', options: ['obsidian-neon', 'minimal-light', 'cyberpunk'] }
    ]
  },
  {
    id: 'latex-math-renderer',
    name: 'LaTeX 数学与化学公式高级渲染',
    version: '1.9.0',
    author: 'TeX Studio',
    description: '支持 KaTeX / MathJax 实时数学公式渲染、化学方程式排版及内联公式补全。',
    category: '编辑器增强',
    downloads: 32150,
    stars: 890,
    enabled: true,
    installed: true,
    iconName: 'Calculator',
    settings: [
      { key: 'autoNumber', label: '公式自动编号', type: 'boolean', value: true },
      { key: 'macroPackage', label: '宏包预设', type: 'select', value: 'standard', options: ['standard', 'physics', 'advanced'] }
    ]
  },
  {
    id: 'pomodoro-focus-timer',
    name: '沉浸式番茄钟工作法',
    version: '1.2.4',
    author: 'Productivity Labs',
    description: '结合笔记与待办的番茄专注计时器，自动记录每次深度思考的时长与产出。',
    category: '实用工具',
    downloads: 19800,
    stars: 645,
    enabled: true,
    installed: true,
    iconName: 'Clock',
    settings: [
      { key: 'workDuration', label: '专注时长 (分钟)', type: 'select', value: '25', options: ['15', '25', '45', '60'] },
      { key: 'breakDuration', label: '休息时长 (分钟)', type: 'select', value: '5', options: ['5', '10', '15'] },
      { key: 'soundAlert', label: '完成时提示音', type: 'boolean', value: true }
    ]
  },
  {
    id: 'ds-prompt-booster',
    name: '行业提示词模板锦囊',
    version: '3.0.2',
    author: 'Workflow Group',
    description: '一键注入专业行业提示词模板，优化对话上下文与结构化文档输出。',
    category: '效率助手',
    downloads: 67400,
    stars: 2150,
    enabled: true,
    installed: true,
    iconName: 'Bot',
    settings: [
      { key: 'temperature', label: '默认创意温度', type: 'select', value: '0.7', options: ['0.2', '0.5', '0.7', '1.0'] },
      { key: 'autoSummarize', label: '对话结束自动生成摘要', type: 'boolean', value: true }
    ]
  },
  {
    id: 'pdf-markdown-exporter',
    name: 'PDF 与 Markdown 专业导出工具',
    version: '1.5.3',
    author: 'DocCraft',
    description: '将知识库文档、笔记一键导出为高品质 PDF、Word 或精美排版 Markdown。',
    category: '实用工具',
    downloads: 25400,
    stars: 710,
    enabled: false,
    installed: true,
    iconName: 'FileText',
    settings: [
      { key: 'defaultTemplate', label: '默认导出模板', type: 'select', value: 'corporate', options: ['corporate', 'minimal', 'academic'] },
      { key: 'watermark', label: '添加水印', type: 'boolean', value: false }
    ]
  },
  {
    id: 'web-search-accelerator',
    name: '全球全网实时搜索加速器',
    version: '2.1.0',
    author: 'SearchPlus',
    description: '增强知识对话中的联网搜索深度，自动抓取多源权威资讯并进行交叉验证。',
    category: '效率助手',
    downloads: 41200,
    stars: 1320,
    enabled: true,
    installed: true,
    iconName: 'Globe',
    settings: [
      { key: 'maxSources', label: '单次检索最大源数量', type: 'select', value: '10', options: ['5', '10', '20'] },
      { key: 'strictMode', label: '严格事实校验', type: 'boolean', value: true }
    ]
  },
  {
    id: 'code-sandbox-runner',
    name: '在线代码沙箱与图表运行器',
    version: '1.1.8',
    author: 'DevTools Corp',
    description: '在笔记与知识库中直接运行 JavaScript、Python 及 Mermaid 图表代码。',
    category: '编辑器增强',
    downloads: 15600,
    stars: 520,
    enabled: false,
    installed: false,
    iconName: 'Code',
    settings: [
      { key: 'timeout', label: '执行超时限制 (秒)', type: 'select', value: '5', options: ['3', '5', '10'] }
    ]
  },
  {
    id: 'custom-theme-accent',
    name: '苹果极简与 Obsidian 动态主题皮肤',
    version: '2.0.4',
    author: 'UI Master',
    description: '提供苹果玻璃拟态、Obsidian 深邃暗黑及多款高级艺术配色方案。',
    category: '核心体验',
    downloads: 53100,
    stars: 1890,
    enabled: true,
    installed: true,
    iconName: 'Palette',
    settings: [
      { key: 'blurIntensity', label: '背景高斯模糊强度', type: 'select', value: 'high', options: ['low', 'medium', 'high'] },
      { key: 'fontFamily', label: '全局字体族', type: 'select', value: 'system', options: ['system', 'inter', 'mono'] }
    ]
  }
];
