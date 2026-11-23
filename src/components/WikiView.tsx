import React, { useMemo, useState } from 'react';
import {
  BookOpenText,
  Edit3,
  Eye,
  GitFork,
  MessageSquare,
  PenLine,
  Plus,
  RotateCcw,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { GraphNode, WikiPage } from '../types/knowhub';
import { FEATURE_THEME } from '../data/featureTheme';
import { WIKI_GRAPH_EDGES, WIKI_GRAPH_NODES } from '../data/workspaceData';
import { MarkdownRenderer } from './MarkdownRenderer';

interface WikiViewProps {
  pages: WikiPage[];
  activePageId: string;
  onSelectPage: (id: string) => void;
  onCreatePage: () => void;
  onUpdatePage: (id: string, patch: Partial<WikiPage>) => void;
  onAskAiAboutWiki: (prompt: string) => void;
}

const NODE_COLORS: Record<GraphNode['group'], string> = {
  core: '#16A34A',
  metric: '#0D9488',
  source: '#6E56CF',
  concept: '#EA580C',
};

export const WikiView: React.FC<WikiViewProps> = ({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onUpdatePage,
  onAskAiAboutWiki,
}) => {
  const [viewMode, setViewMode] = useState<'graph' | 'docs'>('graph');
  const [editing, setEditing] = useState(false);
  const [aiExpanding, setAiExpanding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodeSearch, setNodeSearch] = useState('');
  const [zoom, setZoom] = useState(100);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(WIKI_GRAPH_NODES[0].id);

  const wikiTheme = FEATURE_THEME.wiki;

  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];
  const selectedNode =
    WIKI_GRAPH_NODES.find((n) => n.id === selectedNodeId) ?? WIKI_GRAPH_NODES[0];

  const matchedNodeIds = useMemo(() => {
    const q = nodeSearch.trim().toLowerCase();
    if (!q) return new Set<string>();
    return new Set(
      WIKI_GRAPH_NODES.filter((n) => n.label.toLowerCase().includes(q)).map(
        (n) => n.id
      )
    );
  }, [nodeSearch]);

  const handleAiExpand = async () => {
    if (!activePage || aiExpanding) return;
    setAiExpanding(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'expand',
          title: activePage.title,
          content: activePage.content,
          knowledgeContext: activePage.category,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '扩写失败');
      onUpdatePage(activePage.id, {
        content: data.result,
        updatedAt: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '扩写失败');
    } finally {
      setAiExpanding(false);
    }
  };

  return (
    <div className="apple-workspace-canvas flex h-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      {/* Left Directory */}
      <aside className="apple-glass-panel flex w-full shrink-0 flex-col border-b md:w-[250px] md:border-r md:border-b-0">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.08]">
          <span className="text-[12.5px] font-semibold text-[#1D1D1F] dark:text-white">
            Wiki 主题与词条
          </span>
          <button
            type="button"
            onClick={() => {
              onCreatePage();
              setViewMode('docs');
            }}
            title="新建词条"
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-white transition-colors ${wikiTheme.solidBg}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="max-h-[160px] flex-1 overflow-y-auto p-2 space-y-1 md:max-h-none">
          {pages.map((page) => {
            const active = page.id === activePage?.id;
            return (
              <button
                key={page.id}
                type="button"
                onClick={() => {
                  onSelectPage(page.id);
                  setEditing(false);
                }}
                className={`w-full rounded-xl p-2.5 text-left transition-all ${
                  active
                    ? 'apple-glass-card ring-1 ring-[#16A34A]/30 dark:ring-[#22C55E]/35'
                    : 'hover:bg-white/60 dark:hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpenText className={`h-3.5 w-3.5 shrink-0 ${wikiTheme.text}`} />
                  <span className="truncate text-[13px] font-medium text-[#1D1D1F] dark:text-white">
                    {page.title}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-[#86868B] tabular-nums">
                  {page.category} · {page.readTime}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="apple-glass-panel flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
          <div>
            <h1 className="font-display text-[17px] font-semibold text-[#1D1D1F] dark:text-white">
              Wiki · 从资料到观点，每条结论可回溯原文
            </h1>
          </div>

          <div className="flex rounded-xl bg-black/[0.045] p-0.5 dark:bg-white/[0.06]">
            <button
              type="button"
              onClick={() => setViewMode('docs')}
              className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                viewMode === 'docs'
                  ? 'bg-white text-[#1D1D1F] shadow-2xs dark:bg-[#2A2A32] dark:text-white'
                  : 'text-[#6E6E73] dark:text-[#98989D]'
              }`}
            >
              词条阅读
            </button>
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                viewMode === 'graph'
                  ? `bg-white shadow-2xs dark:bg-[#2A2A32] ${wikiTheme.text}`
                  : 'text-[#6E6E73] dark:text-[#98989D]'
              }`}
            >
              <GitFork className="h-3.5 w-3.5" />
              <span>Wiki 图谱</span>
            </button>
          </div>
        </div>

        {viewMode === 'graph' ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
            {/* Graph Canvas */}
            <div className="relative flex min-w-0 flex-1 flex-col p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white/85 px-3 py-1.5 dark:border-white/[0.1] dark:bg-[#1C1C22]">
                  <Search className="h-3.5 w-3.5 text-[#86868B]" />
                  <input
                    type="text"
                    value={nodeSearch}
                    onChange={(e) => setNodeSearch(e.target.value)}
                    placeholder="搜索并定位节点..."
                    className="w-40 bg-transparent text-[12.5px] focus:outline-none dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-[12px]">
                  <button
                    type="button"
                    aria-label="缩小图谱"
                    onClick={() => setZoom((z) => Math.max(60, z - 15))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-white/85 text-[#48484A] dark:border-white/[0.1] dark:bg-[#1C1C22] dark:text-white"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-12 text-center font-mono text-[12px] tabular-nums text-[#6E6E73]">
                    {zoom}%
                  </span>
                  <button
                    type="button"
                    aria-label="放大图谱"
                    onClick={() => setZoom((z) => Math.min(150, z + 15))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-white/85 text-[#48484A] dark:border-white/[0.1] dark:bg-[#1C1C22] dark:text-white"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(100)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-black/[0.08] bg-white/85 px-2.5 text-[#48484A] dark:border-white/[0.1] dark:bg-[#1C1C22] dark:text-white"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>重置</span>
                  </button>
                </div>
              </div>

              {/* Interactive SVG Network */}
              <div className="apple-glass-card relative flex-1 overflow-hidden rounded-2xl">
                <svg
                  viewBox="0 0 720 380"
                  className="h-full w-full transition-transform duration-200"
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  {WIKI_GRAPH_EDGES.map((edge, idx) => {
                    const s = WIKI_GRAPH_NODES.find((n) => n.id === edge.source);
                    const t = WIKI_GRAPH_NODES.find((n) => n.id === edge.target);
                    if (!s || !t) return null;
                    const highlighted =
                      s.id === selectedNode.id || t.id === selectedNode.id;
                    return (
                      <line
                        key={idx}
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke={highlighted ? '#16A34A' : '#94A3B8'}
                        strokeOpacity={highlighted ? 0.72 : 0.25}
                        strokeWidth={highlighted ? 2 : 1.1}
                      />
                    );
                  })}

                  {WIKI_GRAPH_NODES.map((node) => {
                    const isSelected = node.id === selectedNode.id;
                    const isMatched = matchedNodeIds.has(node.id);
                    const fill = NODE_COLORS[node.group];
                    return (
                      <g
                        key={node.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedNodeId(node.id)}
                      >
                        {(isSelected || isMatched) && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={18}
                            fill={fill}
                            fillOpacity={0.16}
                          />
                        )}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isSelected ? 11 : 8.5}
                          fill={fill}
                          stroke="#FFFFFF"
                          strokeWidth={2}
                        />
                        <text
                          x={node.x}
                          y={node.y + 22}
                          textAnchor="middle"
                          className={`text-[10.5px] ${
                            isSelected
                              ? 'fill-[#1D1D1F] font-semibold dark:fill-white'
                              : 'fill-[#6E6E73] dark:fill-[#AEAEB2]'
                          }`}
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute bottom-3 left-4 text-[11.5px] text-[#86868B] tabular-nums">
                  {WIKI_GRAPH_NODES.length} 个核心节点 · {WIKI_GRAPH_EDGES.length} 条实证关系（点击节点查看详情）
                </div>
              </div>
            </div>

            {/* Right Node Details Inspector */}
            <aside className="apple-glass-panel w-full shrink-0 border-t p-5 xl:w-[290px] xl:border-t-0 xl:border-l">
              <div className="text-[13px] font-semibold text-[#1D1D1F] dark:text-white">
                节点详情
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="apple-glass-card rounded-xl p-3">
                  <div className="text-[11px] text-[#86868B]">证据节点</div>
                  <div className={`mt-1 font-mono text-[20px] font-semibold tabular-nums ${wikiTheme.text}`}>
                    {selectedNode.evidenceCount}
                  </div>
                </div>
                <div className="apple-glass-card rounded-xl p-3">
                  <div className="text-[11px] text-[#86868B]">全库总关系</div>
                  <div className="mt-1 font-mono text-[20px] font-semibold tabular-nums text-[#0D9488] dark:text-[#34D399]">
                    561
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <div className="text-[15px] font-semibold text-[#1D1D1F] dark:text-white">
                  {selectedNode.label}
                </div>
                <p className="text-[13px] leading-relaxed text-[#6E6E73] dark:text-[#98989D]">
                  {selectedNode.summary}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onAskAiAboutWiki(
                    `围绕 Wiki 节点「${selectedNode.label}」，梳理它在所有关联文件中的证据链条和具体数值口径。`
                  )
                }
                className={`mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-medium text-white ${wikiTheme.solidBg}`}
              >
                <GitFork className="h-3.5 w-3.5" />
                <span>追溯节点原文</span>
              </button>
            </aside>
          </div>
        ) : (
          activePage && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="apple-glass-panel flex flex-wrap items-center justify-between gap-2 border-b px-6 py-2.5">
                <div className="text-[12px] text-[#86868B] tabular-nums">
                  {activePage.category} · 作者：{activePage.author} · {activePage.updatedAt}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={aiExpanding}
                    onClick={() => void handleAiExpand()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white/85 px-3 text-[12.5px] font-medium text-[#1D1D1F] dark:border-white/[0.1] dark:bg-[#1C1C22] dark:text-white"
                  >
                    <PenLine className={`h-3.5 w-3.5 ${wikiTheme.text}`} />
                    <span>{aiExpanding ? '扩写中...' : '扩写完善'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onAskAiAboutWiki(
                        `针对 Wiki 文档《${activePage.title}》，请总结员工最常混淆的 3 个口径问题。`
                      )
                    }
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white/85 px-3 text-[12.5px] font-medium text-[#1D1D1F] dark:border-white/[0.1] dark:bg-[#1C1C22] dark:text-white"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>生成 FAQ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing((prev) => !prev)}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium text-white ${wikiTheme.solidBg}`}
                  >
                    {editing ? <Eye className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                    <span>{editing ? '阅读视图' : '编辑词条'}</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
                <div className="apple-glass-card mx-auto max-w-[70ch] rounded-2xl p-6 sm:p-8 space-y-5">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-[13px] text-red-700">
                      {error}
                    </div>
                  )}
                  {editing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={activePage.title}
                        onChange={(e) =>
                          onUpdatePage(activePage.id, { title: e.target.value })
                        }
                        className="w-full bg-transparent font-display text-[26px] font-semibold focus:outline-none dark:text-white"
                      />
                      <textarea
                        rows={16}
                        value={activePage.content}
                        onChange={(e) =>
                          onUpdatePage(activePage.id, { content: e.target.value })
                        }
                        className="w-full resize-none rounded-2xl border border-black/[0.08] bg-white/75 p-4 font-mono text-[13.5px] leading-relaxed focus:outline-none dark:border-white/[0.1] dark:bg-[#161618] dark:text-neutral-200"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="font-display text-[26px] font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
                        {activePage.title}
                      </h2>
                      <div className="border-t border-black/[0.06] pt-5 dark:border-white/[0.08]">
                        <MarkdownRenderer content={activePage.content} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
