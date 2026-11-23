import React, { useState } from 'react';
import {
  BotMessageSquare,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  Code,
  Download,
  FileText,
  Globe,
  Network,
  Palette,
  Plus,
  Puzzle,
  Search,
  Settings,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type { Plugin, PluginSetting } from '../types/plugins';
import { FEATURE_THEME } from '../data/featureTheme';

interface PluginsViewProps {
  plugins: Plugin[];
  onTogglePlugin: (pluginId: string) => void;
  onInstallPlugin: (pluginId: string) => void;
  onUninstallPlugin: (pluginId: string) => void;
  onUpdateSettings: (pluginId: string, settings: PluginSetting[]) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Network,
  Calculator,
  Clock,
  Bot: BotMessageSquare,
  FileText,
  Globe,
  Code,
  Palette,
  Puzzle,
};

const CATEGORY_GRADIENT: Record<string, string> = {
  核心体验: 'from-[#6E56CF] to-[#8B5CF6]',
  编辑器增强: 'from-[#0D9488] to-[#10B981]',
  效率助手: 'from-[#0284C7] to-[#38BDF8]',
  数据可视化: 'from-[#EA580C] to-[#F97316]',
  实用工具: 'from-[#E11D48] to-[#F43F5E]',
};

export const PluginsView: React.FC<PluginsViewProps> = ({
  plugins,
  onTogglePlugin,
  onInstallPlugin,
  onUninstallPlugin,
  onUpdateSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'installed' | 'market'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [configuringPlugin, setConfiguringPlugin] = useState<Plugin | null>(null);
  const [tempSettings, setTempSettings] = useState<PluginSetting[]>([]);

  const theme = FEATURE_THEME.plugins;
  const categories = ['全部', '核心体验', '编辑器增强', '效率助手', '数据可视化', '实用工具'];

  const filteredPlugins = plugins.filter((plugin) => {
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'installed'
          ? plugin.installed
          : !plugin.installed;

    const matchesCategory =
      selectedCategory === 'all' || selectedCategory === '全部'
        ? true
        : plugin.category === selectedCategory;

    return matchesSearch && matchesTab && matchesCategory;
  });

  const installedCount = plugins.filter((p) => p.installed).length;
  const activeCount = plugins.filter((p) => p.installed && p.enabled).length;

  const handleOpenSettings = (plugin: Plugin) => {
    setConfiguringPlugin(plugin);
    setTempSettings(plugin.settings ? JSON.parse(JSON.stringify(plugin.settings)) : []);
  };

  const handleSaveSettings = () => {
    if (configuringPlugin) {
      onUpdateSettings(configuringPlugin.id, tempSettings);
      setConfiguringPlugin(null);
    }
  };

  return (
    <div className="apple-workspace-canvas flex h-full flex-1 flex-col overflow-hidden">
      {/* Top Header Banner */}
      <div className="apple-glass-panel border-b px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${theme.activeBadge}`}>
                <Puzzle className="h-5 w-5" />
              </div>
              <h1 className="font-display text-[22px] font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
                插件市场与拔插中心
              </h1>
            </div>
            <p className="mt-1 text-[13px] text-[#6E6E73] dark:text-[#98989D]">
              热插拔架构：随时安装、启用或停用扩展，按需扩展 Obsidian 知识库与工作流。
            </p>
          </div>

          <div className="flex items-center gap-2 text-[12.5px] font-medium text-[#48484A] tabular-nums dark:text-[#AEAEB2]">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            <span>已安装 {installedCount} 个 · 运行中 {activeCount} 个</span>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: 'all', label: `全部插件 (${plugins.length})` },
                { id: 'installed', label: `已安装 (${installedCount})` },
                { id: 'market', label: '社区探索' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`rounded-xl px-3.5 py-1.5 text-[12.5px] font-medium transition-all whitespace-nowrap ${
                  activeTab === t.id
                    ? `${theme.solidBg} text-white shadow-xs`
                    : 'bg-black/[0.04] text-[#48484A] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-[#AEAEB2]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索插件名称、作者或功能..."
              className="w-full rounded-xl border border-black/[0.08] bg-white/85 py-1.5 pl-9 pr-3 text-[12.5px] text-[#1D1D1F] outline-none transition-all placeholder:text-[#86868B] focus:border-[#E11D48] dark:border-white/[0.1] dark:bg-[#1C1C22] dark:text-white"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F]'
                  : 'text-[#6E6E73] hover:bg-black/[0.04] dark:text-[#98989D] dark:hover:bg-white/[0.06]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Plugin Cards Grid */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        {filteredPlugins.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Puzzle className="h-12 w-12 text-[#86868B] opacity-50" />
            <p className="mt-3 text-sm font-medium text-[#1D1D1F] dark:text-white">
              未找到匹配的插件
            </p>
            <p className="mt-1 text-xs text-[#86868B]">
              尝试调整搜索关键词或切换分类标签。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlugins.map((plugin) => {
              const IconComp = ICON_MAP[plugin.iconName] || Puzzle;
              const gradient = CATEGORY_GRADIENT[plugin.category] ?? 'from-[#E11D48] to-[#F43F5E]';
              return (
                <div
                  key={plugin.id}
                  className={`apple-glass-card group relative flex flex-col justify-between rounded-2xl p-5 transition-all duration-200 ${
                    plugin.installed && plugin.enabled
                      ? 'ring-1 ring-[#E11D48]/25 dark:ring-[#FB7185]/30'
                      : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-xs ${
                            plugin.installed && plugin.enabled
                              ? `bg-gradient-to-br ${gradient} text-white`
                              : 'bg-black/[0.05] text-[#6E6E73] dark:bg-white/[0.08] dark:text-[#AEAEB2]'
                          }`}
                        >
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-semibold text-[#1D1D1F] dark:text-white">
                            {plugin.name}
                          </h3>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[#86868B] dark:text-[#98989D]">
                            <span className="font-mono">v{plugin.version}</span>
                            <span>·</span>
                            <span>{plugin.author}</span>
                          </div>
                        </div>
                      </div>

                      {plugin.installed && (
                        <button
                          type="button"
                          onClick={() => onTogglePlugin(plugin.id)}
                          title={plugin.enabled ? '点击停用插件' : '点击启用插件'}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                            plugin.enabled ? 'bg-[#10B981]' : 'bg-[#D1D1D6] dark:bg-[#3A3A3C]'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              plugin.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    <p className="mt-3.5 text-[12.5px] leading-relaxed text-[#48484A] dark:text-[#C7C7CC]">
                      {plugin.description}
                    </p>

                    <div className="mt-3.5 flex items-center gap-3 text-[11.5px] text-[#86868B] tabular-nums dark:text-[#98989D]">
                      <span className="flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" />
                        {plugin.downloads.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                        {plugin.stars}
                      </span>
                      <span>· {plugin.category}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-black/[0.05] pt-3.5 dark:border-white/[0.07]">
                    {plugin.installed ? (
                      <div className="flex w-full items-center justify-between gap-2">
                        <span
                          className={`flex items-center gap-1 text-[11.5px] font-medium ${
                            plugin.enabled
                              ? 'text-[#059669] dark:text-[#34D399]'
                              : 'text-[#86868B]'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {plugin.enabled ? '已热插拔运行' : '已安装 (已停用)'}
                        </span>

                        <div className="flex items-center gap-1">
                          {plugin.settings && plugin.settings.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenSettings(plugin)}
                              className="flex items-center gap-1 rounded-lg bg-black/[0.04] px-2.5 py-1.5 text-[12px] font-medium text-[#1D1D1F] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:text-white"
                            >
                              <Settings className="h-3.5 w-3.5" />
                              配置
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onUninstallPlugin(plugin.id)}
                            title="卸载拔出插件"
                            className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            拔出
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onInstallPlugin(plugin.id)}
                        className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12.5px] font-medium text-white shadow-xs transition-all ${theme.solidBg}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        一键安装插件
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {configuringPlugin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="apple-glass-elevated w-full max-w-lg rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${theme.softBg} ${theme.text}`}>
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                    插件配置：{configuringPlugin.name}
                  </h3>
                  <p className="text-[11px] text-[#86868B]">
                    调整热插拔插件的底层运行参数
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfiguringPlugin(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6E6E73] hover:bg-black/[0.05] dark:text-[#98989D] dark:hover:bg-white/[0.08]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {tempSettings.map((setting, idx) => (
                <div key={setting.key} className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-[#1D1D1F] dark:text-white">
                    {setting.label}
                  </label>
                  {setting.type === 'boolean' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...tempSettings];
                        updated[idx].value = !updated[idx].value;
                        setTempSettings(updated);
                      }}
                      className={`flex w-fit items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                        setting.value
                          ? 'border border-[#10B981]/30 bg-[#10B981]/15 text-[#059669] dark:text-[#34D399]'
                          : 'bg-black/[0.04] text-[#86868B] dark:bg-white/[0.06]'
                      }`}
                    >
                      <Check className={`h-3.5 w-3.5 ${setting.value ? 'opacity-100' : 'opacity-0'}`} />
                      {setting.value ? '已开启' : '已关闭'}
                    </button>
                  ) : setting.type === 'select' ? (
                    <select
                      value={setting.value}
                      onChange={(e) => {
                        const updated = [...tempSettings];
                        updated[idx].value = e.target.value;
                        setTempSettings(updated);
                      }}
                      className="rounded-xl border border-black/[0.08] bg-white/85 px-3 py-2 text-xs text-[#1D1D1F] outline-none dark:border-white/[0.1] dark:bg-[#1C1C22] dark:text-white"
                    >
                      {setting.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={setting.value}
                      onChange={(e) => {
                        const updated = [...tempSettings];
                        updated[idx].value = e.target.value;
                        setTempSettings(updated);
                      }}
                      className="rounded-xl border border-black/[0.08] bg-white/85 px-3 py-2 text-xs text-[#1D1D1F] outline-none dark:border-white/[0.1] dark:bg-[#1C1C22] dark:text-white"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setConfiguringPlugin(null)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-[#6E6E73] hover:bg-black/[0.04] dark:text-[#98989D] dark:hover:bg-white/[0.08]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className={`rounded-xl px-5 py-2 text-xs font-medium text-white shadow-xs ${theme.solidBg}`}
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
