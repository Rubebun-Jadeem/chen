import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Boxes,
  ChartPie,
  Flame,
  List,
  Network,
  RefreshCw,
  Search,
  Waypoints,
} from 'lucide-react';
import type {
  KnowledgeBase,
  KnowledgeDoc,
  NavSectionId,
  OntologyConcept,
  OntologyRelation,
} from '../types/knowhub';
import { FEATURE_THEME } from '../data/featureTheme';
import {
  ANALYTICS_TREND_POINTS,
  INDUSTRY_HOTSPOTS,
  INITIAL_ONTOLOGY,
  INITIAL_ONTOLOGY_CONCEPTS,
  KNOWLEDGE_CLUSTERS,
} from '../data/workspaceData';
import { MarkdownRenderer } from './MarkdownRenderer';

interface IntelligenceViewsProps {
  section: Extract<NavSectionId, 'hotspots' | 'summary' | 'clusters' | 'ontology'>;
  docs: KnowledgeDoc[];
  knowledgeBases: KnowledgeBase[];
  selectedLibraryId: string;
  onAskAi: (prompt: string) => void;
}

export const IntelligenceViews: React.FC<IntelligenceViewsProps> = ({
  section,
  docs,
  knowledgeBases,
  selectedLibraryId,
  onAskAi,
}) => {
  const [digestText, setDigestText] = useState<string>('');
  const [hotspotBrief, setHotspotBrief] = useState<string>('');
  const [hotspotCat, setHotspotCat] = useState<string>('全部分类');

  const [clusterMode, setClusterMode] = useState<'graph' | 'list'>('graph');
  const [selectedClusterId, setSelectedClusterId] = useState<string>(
    KNOWLEDGE_CLUSTERS[0].id
  );

  const [ontologyConcepts] = useState<OntologyConcept[]>(INITIAL_ONTOLOGY_CONCEPTS);
  const [selectedConceptId, setSelectedConceptId] = useState<string>(
    INITIAL_ONTOLOGY_CONCEPTS[1].id
  );
  const [ontologyRelations, setOntologyRelations] =
    useState<OntologyRelation[]>(INITIAL_ONTOLOGY);
  const [ontologyInsight, setOntologyInsight] = useState<string>(
    '金融基础本体 Mini · 概念说明类型，关系连接对象，属性定义字段。'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeKb =
    knowledgeBases.find((kb) => kb.id === selectedLibraryId) ?? knowledgeBases[0];

  const scopedDocs =
    selectedLibraryId === 'all'
      ? docs
      : docs.filter((d) => d.libraryId === selectedLibraryId);

  const filteredHotspots = useMemo(() => {
    return INDUSTRY_HOTSPOTS.filter((h) => {
      if (hotspotCat !== '全部分类' && h.category !== hotspotCat) return false;
      return true;
    });
  }, [hotspotCat]);

  const runAnalysis = async (
    kind: 'knowledge_digest' | 'hotspot_brief' | 'ontology_extract',
    promptInput?: string
  ) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          scopeName: activeKb.name,
          promptInput,
          documents: scopedDocs.map((d) => ({
            id: d.id,
            title: d.title,
            libraryName: d.libraryName,
            excerpt: d.excerpt,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '分析请求失败');

      if (kind === 'knowledge_digest') {
        setDigestText(data.result || '');
      } else if (kind === 'hotspot_brief') {
        setHotspotBrief(data.result || '');
      } else if (kind === 'ontology_extract') {
        if (data.insight) setOntologyInsight(data.insight);
        if (Array.isArray(data.relations) && data.relations.length > 0) {
          setOntologyRelations(
            data.relations.map(
              (
                r: {
                  source: string;
                  relation: string;
                  target: string;
                  evidence: string;
                },
                idx: number
              ) => ({
                id: `ont-ai-${Date.now()}-${idx}`,
                source: r.source,
                relation: r.relation,
                target: r.target,
                evidence: r.evidence || activeKb.name,
              })
            )
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析请求失败');
    } finally {
      setLoading(false);
    }
  };

  /* 1. 行业热点 — Flame Orange */
  if (section === 'hotspots') {
    const theme = FEATURE_THEME.hotspots;
    return (
      <div className="apple-workspace-canvas flex-1 overflow-y-auto px-4 py-7 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.06] pb-5 dark:border-white/[0.08]">
            <div>
              <div className={`flex items-center gap-2 text-[12.5px] font-medium ${theme.text}`}>
                <Flame className="h-4 w-4" />
                <span>情报采编工作台</span>
              </div>
              <h1 className="mt-1 font-display text-[24px] font-semibold tracking-tight text-[#1D1D1F] sm:text-[28px] dark:text-white">
                行业热点 · 发现变化并将线索沉淀为知识
              </h1>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                void runAnalysis(
                  'hotspot_brief',
                  INDUSTRY_HOTSPOTS.map((h) => `${h.title}：${h.summary}`).join('\n')
                )
              }
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-[13px] font-medium text-white disabled:opacity-50 ${theme.solidBg}`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>{loading ? '分析中...' : '生成影响简报'}</span>
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {['全部分类', '模型', '产品', '行业', '观点'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setHotspotCat(cat)}
                    className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                      hotspotCat === cat
                        ? `${theme.solidBg} text-white`
                        : 'bg-white/75 text-[#48484A] hover:text-[#1D1D1F] dark:bg-white/[0.06] dark:text-[#AEAEB2]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {hotspotBrief && (
                <div className={`apple-glass-card rounded-2xl p-5 ring-1 ${theme.ring}`}>
                  <div className={`mb-2 flex items-center gap-1.5 text-[13px] font-semibold ${theme.text}`}>
                    <Flame className="h-4 w-4" />
                    <span>行业影响研判简报</span>
                  </div>
                  <MarkdownRenderer content={hotspotBrief} />
                </div>
              )}

              <div className="apple-glass-card divide-y divide-black/[0.06] rounded-2xl dark:divide-white/[0.08]">
                {filteredHotspots.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 transition-colors hover:bg-white/60 dark:hover:bg-white/[0.03]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#86868B] tabular-nums">
                      <span>
                        {item.category} · {item.impactLevel} · {item.source} · {item.publishedAt}
                      </span>
                      <span className={theme.text}>
                        关联：{item.relatedLibrary}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-[16px] font-semibold text-[#1D1D1F] dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6E6E73] dark:text-[#98989D]">
                      {item.summary}
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          onAskAi(
                            `结合行业动态「${item.title}」，对比分析我们「${item.relatedLibrary}」现有规则有哪些可优化空间？`
                          )
                        }
                        className={`inline-flex items-center gap-1 text-[12.5px] font-medium hover:underline ${theme.text}`}
                      >
                        <span>转入对话讨论</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-4">
              <div className="apple-glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 text-[13.5px] font-semibold text-[#1D1D1F] dark:text-white">
                  <Bookmark className={`h-4 w-4 ${theme.text}`} />
                  <span>最新行业简报</span>
                </div>
                <div className="mt-2 text-[12px] text-[#86868B] tabular-nums">
                  同步于 2026/11/22 12:20
                </div>
                <div className="mt-2 font-semibold text-[14px] text-[#1D1D1F] dark:text-white">
                  AIHOT-日报-AI-2026-11-22
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#6E6E73] dark:text-[#98989D]">
                  汇总多模态督导、财税合规与检索增强实战洞察，已关联至企业知识库。
                </p>
              </div>

              <div className="apple-glass-card rounded-2xl p-5">
                <div className="text-[13.5px] font-semibold text-[#1D1D1F] dark:text-white">
                  从情报到知识
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6E6E73] dark:text-[#98989D]">
                  支持将热点线索与企业规则交叉对比，沉淀为结构化 Wiki 词条并在知识对话中直接引用。
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  /* 2. 知识总结 — Royal Indigo */
  if (section === 'summary') {
    const theme = FEATURE_THEME.summary;
    const maxTrend = 55;
    const svgPoints = ANALYTICS_TREND_POINTS.map((pt, idx) => {
      const x = 30 + (idx / (ANALYTICS_TREND_POINTS.length - 1)) * 520;
      const y = 160 - (pt.total / maxTrend) * 130;
      return { ...pt, x, y };
    });
    const polylinePoints = svgPoints.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPoints = `30,160 ${polylinePoints} 550,160`;

    return (
      <div className="apple-workspace-canvas flex-1 overflow-y-auto px-4 py-7 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.06] pb-5 dark:border-white/[0.08]">
            <div>
              <div className={`flex items-center gap-2 text-[12.5px] font-medium ${theme.text}`}>
                <ChartPie className="h-4 w-4" />
                <span>全局知识洞察</span>
              </div>
              <h1 className="mt-1 font-display text-[24px] font-semibold tracking-tight text-[#1D1D1F] sm:text-[28px] dark:text-white">
                分析中心 · 知识总结
              </h1>
              <p className="mt-1 text-[13.5px] text-[#6E6E73] dark:text-[#98989D]">
                了解知识积累与使用情况，查看有权知识的生命周期分布与近期更新
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => void runAnalysis('knowledge_digest')}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-[13px] font-medium text-white disabled:opacity-50 ${theme.solidBg}`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? '正在生成综述...' : '生成全局综述'}</span>
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          )}

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: '知识簇总数', value: '51', sub: '当前可读知识簇', tone: 'text-[#4F46E5] dark:text-[#818CF8]' },
              { label: '稳定知识簇', value: '6', sub: '生命周期为稳定', tone: 'text-[#0D9488] dark:text-[#34D399]' },
              { label: '平均置信度', value: '0.84', sub: '有效样本 16', tone: 'text-[#C026D3] dark:text-[#E879F9]' },
              { label: '最高热度', value: '0.88', sub: '有效样本 16', tone: 'text-[#EA580C] dark:text-[#FB923C]' },
            ].map((kpi) => (
              <div key={kpi.label} className="apple-glass-card rounded-2xl p-5">
                <div className="text-[12.5px] font-medium text-[#6E6E73] dark:text-[#98989D]">
                  {kpi.label}
                </div>
                <div className={`mt-2 font-mono text-[30px] font-semibold tracking-tight tabular-nums ${kpi.tone}`}>
                  {kpi.value}
                </div>
                <div className="mt-1 text-[12px] text-[#86868B]">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {digestText && (
            <div className={`apple-glass-card rounded-2xl p-6 ring-1 ${theme.ring}`}>
              <div className={`mb-2 flex items-center gap-2 text-[13px] font-semibold ${theme.text}`}>
                <ChartPie className="h-4 w-4" />
                <span>实时全局综述（{activeKb.shortName}）</span>
              </div>
              <MarkdownRenderer content={digestText} />
            </div>
          )}

          {/* Middle Charts Row */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="apple-glass-card lg:col-span-7 rounded-2xl p-5">
              <div className="text-[14.5px] font-semibold text-[#1D1D1F] dark:text-white">
                知识积累趋势
              </div>
              <svg viewBox="0 0 580 190" className="mt-4 w-full">
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#trendGrad)" />
                <polyline
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2.5"
                  points={polylinePoints}
                />
                {svgPoints.map((p) => (
                  <g key={p.date}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={4}
                      fill="#FFFFFF"
                      stroke="#4F46E5"
                      strokeWidth={2}
                    />
                    <text
                      x={p.x}
                      y={180}
                      textAnchor="middle"
                      className="fill-[#86868B] font-mono text-[10px]"
                    >
                      {p.date}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="apple-glass-card lg:col-span-5 rounded-2xl p-5">
              <div className="text-[14.5px] font-semibold text-[#1D1D1F] dark:text-white">
                生命周期分布
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-around gap-4">
                <svg viewBox="0 0 140 140" className="h-36 w-36">
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="18"
                    strokeDasharray="255 327"
                    transform="rotate(-90 70 70)"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="none"
                    stroke="#0D9488"
                    strokeWidth="18"
                    strokeDasharray="39 327"
                    strokeDashoffset="-255"
                    transform="rotate(-90 70 70)"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="none"
                    stroke="#C026D3"
                    strokeWidth="18"
                    strokeDasharray="33 327"
                    strokeDashoffset="-294"
                    transform="rotate(-90 70 70)"
                  />
                  <text
                    x="70"
                    y="68"
                    textAnchor="middle"
                    className="fill-[#1D1D1F] font-mono text-[20px] font-bold dark:fill-white"
                  >
                    51
                  </text>
                  <text
                    x="70"
                    y="84"
                    textAnchor="middle"
                    className="fill-[#86868B] text-[10px]"
                  >
                    知识簇总数
                  </text>
                </svg>

                <div className="space-y-2.5 text-[13px] tabular-nums">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#4F46E5]" />
                    <span className="text-[#48484A] dark:text-neutral-300">新形成</span>
                    <span className="ml-auto font-mono font-semibold text-[#1D1D1F] dark:text-white">
                      40 · 78%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#0D9488]" />
                    <span className="text-[#48484A] dark:text-neutral-300">稳定</span>
                    <span className="ml-auto font-mono font-semibold text-[#1D1D1F] dark:text-white">
                      6 · 12%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#C026D3]" />
                    <span className="text-[#48484A] dark:text-neutral-300">演化中</span>
                    <span className="ml-auto font-mono font-semibold text-[#1D1D1F] dark:text-white">
                      5 · 10%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="apple-glass-card overflow-x-auto rounded-2xl">
            <div className="border-b border-black/[0.06] px-5 py-3.5 text-[14px] font-semibold text-[#1D1D1F] dark:border-white/[0.08] dark:text-white">
              近期知识积累
            </div>
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/[0.06] text-[12px] font-medium text-[#86868B] dark:border-white/[0.08]">
                  <th className="py-2.5 pl-5 pr-3">更新时间</th>
                  <th className="px-3 py-2.5">知识簇</th>
                  <th className="px-3 py-2.5">生命周期</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">置信度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] text-[13px] dark:divide-white/[0.06]">
                {KNOWLEDGE_CLUSTERS.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-white/60 dark:hover:bg-white/[0.02]"
                  >
                    <td className="py-3 pl-5 pr-3 font-mono text-[12px] tabular-nums text-[#86868B]">
                      {c.updatedAt}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => onAskAi(c.name)}
                        className={`text-left font-medium hover:underline ${theme.text}`}
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-[#48484A] dark:text-neutral-300">
                      {c.lifecycle}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right font-mono tabular-nums text-[#86868B]">
                      {c.confidence !== null ? c.confidence.toFixed(2) : '暂无数据'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* 3. 知识簇 — Orchid Magenta */
  if (section === 'clusters') {
    const theme = FEATURE_THEME.clusters;
    const selectedCluster =
      KNOWLEDGE_CLUSTERS.find((c) => c.id === selectedClusterId) ??
      KNOWLEDGE_CLUSTERS[0];

    return (
      <div className="apple-workspace-canvas flex-1 overflow-y-auto px-4 py-7 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.06] pb-5 dark:border-white/[0.08]">
            <div>
              <div className={`flex items-center gap-2 text-[12.5px] font-medium ${theme.text}`}>
                <Boxes className="h-4 w-4" />
                <span>语义聚类关系图</span>
              </div>
              <h1 className="mt-1 font-display text-[24px] font-semibold tracking-tight text-[#1D1D1F] sm:text-[28px] dark:text-white">
                知识簇 · 演化关系与概念聚合
              </h1>
            </div>

            <div className="flex rounded-xl bg-black/[0.045] p-0.5 dark:bg-white/[0.06]">
              <button
                type="button"
                onClick={() => setClusterMode('list')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium ${
                  clusterMode === 'list'
                    ? 'bg-white text-[#1D1D1F] shadow-2xs dark:bg-[#2A2A32] dark:text-white'
                    : 'text-[#6E6E73]'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>列表</span>
              </button>
              <button
                type="button"
                onClick={() => setClusterMode('graph')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium ${
                  clusterMode === 'graph'
                    ? `bg-white shadow-2xs dark:bg-[#2A2A32] ${theme.text}`
                    : 'text-[#6E6E73]'
                }`}
              >
                <Network className="h-3.5 w-3.5" />
                <span>关系图</span>
              </button>
            </div>
          </div>

          {clusterMode === 'graph' ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
              <div className="apple-glass-card lg:col-span-8 rounded-2xl p-4">
                <svg viewBox="0 0 640 340" className="w-full rounded-xl bg-white/80 dark:bg-[#121218]">
                  {KNOWLEDGE_CLUSTERS.map((c, idx) => {
                    const angle = (idx / KNOWLEDGE_CLUSTERS.length) * Math.PI * 2;
                    const cx = 320 + Math.cos(angle) * 180;
                    const cy = 170 + Math.sin(angle) * 110;
                    const active = c.id === selectedCluster.id;
                    return (
                      <g
                        key={c.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedClusterId(c.id)}
                      >
                        <line
                          x1={320}
                          y1={170}
                          x2={cx}
                          y2={cy}
                          stroke={active ? '#C026D3' : '#CBD5E1'}
                          strokeWidth={active ? 2 : 1.2}
                        />
                        {active && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={18}
                            fill="#C026D3"
                            fillOpacity={0.16}
                          />
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={active ? 10 : 7.5}
                          fill={
                            c.lifecycle === '稳定'
                              ? '#0D9488'
                              : c.lifecycle === '演化中'
                                ? '#C026D3'
                                : '#4F46E5'
                          }
                        />
                        <text
                          x={cx}
                          y={cy + 20}
                          textAnchor="middle"
                          className="fill-[#48484A] text-[10px] dark:fill-neutral-300"
                        >
                          {c.name.slice(0, 13)}...
                        </text>
                      </g>
                    );
                  })}
                  <circle cx={320} cy={170} r={12} fill="#C026D3" />
                  <text
                    x={320}
                    y={150}
                    textAnchor="middle"
                    className="fill-[#1D1D1F] text-[11px] font-semibold dark:fill-white"
                  >
                    知识簇中心
                  </text>
                </svg>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div className="apple-glass-card rounded-2xl p-5">
                  <div className="text-[13.5px] font-semibold text-[#1D1D1F] dark:text-white">
                    知识簇统计
                  </div>
                  <div className="mt-4 space-y-2.5 text-[13px] tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-[#6E6E73]">知识簇总数</span>
                      <span className={`font-mono font-semibold ${theme.text}`}>51</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E6E73]">关联关系</span>
                      <span className="font-mono font-semibold text-[#4F46E5] dark:text-[#818CF8]">38</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E6E73]">来源文件</span>
                      <span className="font-mono font-semibold text-[#0D9488] dark:text-[#34D399]">26</span>
                    </div>
                  </div>
                </div>

                <div className={`apple-glass-card rounded-2xl p-5 ring-1 ${theme.ring}`}>
                  <div className={`text-[12px] font-medium ${theme.text}`}>
                    {selectedCluster.lifecycle} · {selectedCluster.docCount} 份文档
                  </div>
                  <h3 className="mt-1.5 font-display text-[15.5px] font-semibold text-[#1D1D1F] dark:text-white">
                    {selectedCluster.name}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6E6E73] dark:text-[#98989D]">
                    {selectedCluster.description}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      onAskAi(
                        `请深入解读「${selectedCluster.name}」涉及的核心概念（${selectedCluster.coreConcepts.join('、')}）。`
                      )
                    }
                    className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-medium text-white ${theme.solidBg}`}
                  >
                    <Boxes className="h-3.5 w-3.5" />
                    <span>解析此知识簇</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {KNOWLEDGE_CLUSTERS.map((cluster) => (
                <div key={cluster.id} className="apple-glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between text-[12px] text-[#86868B] tabular-nums">
                    <span className={theme.text}>{cluster.lifecycle}</span>
                    <span>{cluster.docCount} 份文档</span>
                  </div>
                  <h3 className="mt-2 font-display text-[15.5px] font-semibold text-[#1D1D1F] dark:text-white">
                    {cluster.name}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#6E6E73] dark:text-[#98989D]">
                    {cluster.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* 4. 本体建模 — Jade Mint */
  const ontTheme = FEATURE_THEME.ontology;
  const selectedConcept =
    ontologyConcepts.find((c) => c.id === selectedConceptId) ?? ontologyConcepts[0];

  return (
    <div className="apple-workspace-canvas flex-1 overflow-y-auto px-4 py-7 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.06] pb-5 dark:border-white/[0.08]">
          <div>
            <div className={`flex items-center gap-2 text-[12.5px] font-medium ${ontTheme.text}`}>
              <Waypoints className="h-4 w-4" />
              <span>本体建模（Ontology Workbench）</span>
            </div>
            <h1 className="mt-1 font-display text-[24px] font-semibold tracking-tight text-[#1D1D1F] sm:text-[28px] dark:text-white">
              金融基础本体 Mini & 企业知识三元组
            </h1>
            <p className="mt-1 text-[13.5px] text-[#6E6E73] dark:text-[#98989D]">
              {ontologyInsight}
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void runAnalysis('ontology_extract')}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-[13px] font-medium text-white disabled:opacity-50 ${ontTheme.solidBg}`}
          >
            <Waypoints className="h-3.5 w-3.5" />
            <span>{loading ? '抽取中...' : '自动抽取业务本体'}</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="apple-glass-card lg:col-span-3 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white/85 px-2.5 py-1.5 dark:border-white/[0.08] dark:bg-[#1C1C22]">
              <Search className="h-3.5 w-3.5 text-[#86868B]" />
              <span className="text-[12px] text-[#86868B]">owl:Thing · 所有事物</span>
            </div>
            <div className="space-y-1">
              {ontologyConcepts.map((c) => {
                const active = c.id === selectedConcept.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedConceptId(c.id)}
                    style={{ paddingLeft: c.parent ? '20px' : '10px' }}
                    className={`w-full rounded-xl py-2 pr-3 text-left transition-colors ${
                      active
                        ? `${ontTheme.softBg} ${ontTheme.text} font-semibold`
                        : 'text-[#48484A] hover:bg-black/[0.04] dark:text-neutral-300'
                    }`}
                  >
                    <div className="text-[13px]">{c.name}</div>
                    <div className="text-[11px] opacity-75">{c.namespace}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="apple-glass-card lg:col-span-6 rounded-2xl p-4">
            <div className="mb-2 text-[12.5px] font-medium text-[#86868B]">
              点击概念查看定义；虚线表示“是一种”继承，实线表示对象关系
            </div>
            <svg viewBox="0 0 640 320" className="w-full rounded-xl bg-white/80 dark:bg-[#121218]">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B" />
                </marker>
              </defs>

              <line
                x1={270}
                y1={90}
                x2={386}
                y2={90}
                stroke="#64748B"
                strokeWidth={1.5}
                markerEnd="url(#arrow)"
              />
              <text x={328} y={80} textAnchor="middle" className="fill-[#64748B] text-[11px]">
                账户持有人
              </text>

              <line
                x1={190}
                y1={218}
                x2={190}
                y2={125}
                stroke="#059669"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                markerEnd="url(#arrow)"
              />
              <text x={190} y={175} textAnchor="middle" className="fill-[#059669] text-[10.5px]">
                是一种
              </text>

              <line
                x1={470}
                y1={218}
                x2={470}
                y2={125}
                stroke="#059669"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                markerEnd="url(#arrow)"
              />
              <text x={470} y={175} textAnchor="middle" className="fill-[#059669] text-[10.5px]">
                是一种
              </text>

              {ontologyConcepts.map((c) => {
                const active = c.id === selectedConcept.id;
                return (
                  <g
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedConceptId(c.id)}
                  >
                    <rect
                      x={c.x - 80}
                      y={c.y - 30}
                      width={160}
                      height={60}
                      rx={12}
                      fill={active ? '#ECFDF5' : '#FFFFFF'}
                      stroke={active ? '#059669' : '#CBD5E1'}
                      strokeWidth={active ? 2 : 1.2}
                    />
                    <text
                      x={c.x}
                      y={c.y - 3}
                      textAnchor="middle"
                      className="fill-[#1D1D1F] text-[13px] font-semibold"
                    >
                      {c.name}
                    </text>
                    <text
                      x={c.x}
                      y={c.y + 16}
                      textAnchor="middle"
                      className="fill-[#6E6E73] text-[10.5px]"
                    >
                      {c.namespace}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="apple-glass-card lg:col-span-3 rounded-2xl p-4 space-y-4">
            <div className="text-[13px] font-semibold text-[#1D1D1F] dark:text-white">
              对象详情
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#86868B]">概念</div>
              <div className="mt-1 text-[16px] font-semibold text-[#1D1D1F] dark:text-white">
                {selectedConcept.name}
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6E6E73] dark:text-[#98989D]">
                {selectedConcept.description}
              </p>
            </div>
            {selectedConcept.parent && (
              <div>
                <div className="text-[11px] font-medium text-[#86868B]">上位概念</div>
                <div className={`mt-1 text-[13px] font-medium ${ontTheme.text}`}>
                  {selectedConcept.parent}
                </div>
              </div>
            )}
            <div>
              <div className="text-[11px] font-medium text-[#86868B]">属性定义</div>
              <div className="mt-1.5 space-y-2">
                {selectedConcept.attributes.map((attr) => (
                  <div
                    key={attr.name}
                    className="rounded-xl border border-black/[0.06] bg-white/85 p-2.5 text-[12px] dark:border-white/[0.08] dark:bg-[#1C1C22]"
                  >
                    <div className="font-semibold text-[#1D1D1F] dark:text-white">
                      {attr.name}
                    </div>
                    <div className="mt-0.5 text-[#86868B]">
                      数据类型：{attr.type}
                      {attr.inheritedFrom ? ` · 继承自 ${attr.inheritedFrom}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="apple-glass-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[540px] border-collapse text-left">
            <thead>
              <tr className="border-b border-black/[0.06] text-[12px] font-medium text-[#86868B] dark:border-white/[0.08]">
                <th className="py-3 pl-6 pr-3">源实体 (Subject)</th>
                <th className="px-3 py-3">语义关系 (Predicate)</th>
                <th className="px-3 py-3">目标实体 (Object)</th>
                <th className="py-3 pl-3 pr-6">依据来源</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] text-[13.5px] dark:divide-white/[0.06]">
              {ontologyRelations.map((rel) => (
                <tr key={rel.id} className="hover:bg-white/60 dark:hover:bg-white/[0.02]">
                  <td className="py-3 pl-6 pr-3 font-medium text-[#1D1D1F] dark:text-white">
                    {rel.source}
                  </td>
                  <td className={`px-3 py-3 font-medium ${ontTheme.text}`}>
                    {rel.relation}
                  </td>
                  <td className="px-3 py-3 font-medium text-[#1D1D1F] dark:text-white">
                    {rel.target}
                  </td>
                  <td className="py-3 pl-3 pr-6 text-[12.5px] text-[#86868B]">
                    {rel.evidence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
