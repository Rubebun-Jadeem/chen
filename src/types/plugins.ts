export interface PluginSetting {
  key: string;
  label: string;
  type: 'boolean' | 'string' | 'select';
  value: any;
  options?: string[];
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: '核心体验' | '编辑器增强' | '效率助手' | '数据可视化' | '实用工具';
  downloads: number;
  stars: number;
  enabled: boolean;
  installed: boolean;
  iconName: string; // Lucide icon or identifier
  settings?: PluginSetting[];
}
