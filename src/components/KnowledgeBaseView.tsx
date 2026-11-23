import React, { useMemo, useRef, useState } from 'react';
import {
  FileCode2,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  LibraryBig,
  MessageSquare,
  Search,
  Upload,
} from 'lucide-react';
import type { KnowledgeBase, KnowledgeDoc } from '../types/knowhub';
import { FEATURE_THEME } from '../data/featureTheme';
import { MarkdownRenderer } from './MarkdownRenderer';

interface KnowledgeBaseViewProps {
  knowledgeBases: KnowledgeBase[];
  selectedLibraryId: string;
  onSelectLibrary: (id: string) => void;
  docs: KnowledgeDoc[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onUpdateDocInsight: (docId: string, aiSummary: string) => void;
  onUploadDoc: (doc: KnowledgeDoc) => void;
  onAskAiAboutDoc: (prompt: string) => void;
}

const FOLDER_TONE: Record<KnowledgeBase['accentColor'], string> = {
  blue: 'bg-[#0071E3]/12 text-[#0071E3] dark:bg-[#2997FF]/18 dark:text-[#60A5FA]',
  violet: 'bg-[#6E56CF]/12 text-[#6E56CF] dark:bg-[#8E75FF]/18 dark:text-[#A78BFA]',
  emerald: 'bg-[#0D9488]/12 text-[#0D9488] dark:bg-[#10B981]/18 dark:text-[#34D399]',
  amber: 'bg-[#D97706]/12 text-[#D97706] dark:bg-[#F59E0B]/18 dark:text-[#FBBF24]',
  cyan: 'bg-[#0284C7]/12 text-[#0284C7] dark:bg-[#38BDF8]/18 dark:text-[#38BDF8]',
};

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  knowledgeBases,
  selectedLibraryId,
  onSelectLibrary,
  docs,
  activeDocId,
  onSelectDoc,
  onUpdateDocInsight,
  onUploadDoc,
  onAskAiAboutDoc,
}) => {
  const [search, setSearch] = useState('');
  const [scopeTab, setScopeTab] = useState<'all' | 'company' | 'personal'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const kbTheme = FEATURE_THEME.knowledge;

  const filteredLibraries = useMemo(
    () =>
      knowledgeBases.filter((kb) => {
        if (kb.id === 'all') return false;
        if (scopeTab !== 'all' && kb.scope !== scopeTab) return false;
        return true;
      }),
    [knowledgeBases, scopeTab]
  );

  const activeKb =
    knowledgeBases.find((k) => k.id === selectedLibraryId) ?? knowledgeBases[0];

  const visibleDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter((d) => {
      if (selectedLibraryId !== 'all' && d.libraryId !== selectedLibraryId) {
        return false;
      }
      const kb = knowledgeBases.find((k) => k.id === d.libraryId);
      if (scopeTab !== 'all' && kb?.scope !== scopeTab) {
        return false;
      }
      if (
        q &&
        !d.title.toLowerCase().includes(q) &&
        !d.excerpt.toLowerCase().includes(q) &&
        !d.libraryName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [docs, selectedLibraryId, scopeTab, search, knowledgeBases]);

  const activeDoc =
    visibleDocs.find((d) => d.id === activeDocId) ?? visibleDocs[0] ?? null;

  const scopeAllCount = useMemo(() => {
    return docs.filter((d) => {
      if (scopeTab === 'all') return true;
      const kb = knowledgeBases.find((k) => k.id === d.libraryId);
      return kb?.scope === scopeTab;
    }).length;
  }, [docs, scopeTab, knowledgeBases]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      const content = await file
        .text()
        .catch(() => `文件 ${file.name} 已导入知识库。`);
      const ext = file.name.split('.').pop()?.toLowerCase();
      const fileType: KnowledgeDoc['fileType'] =
        ext === 'xlsx' || ext === 'csv'
          ? 'xlsx'
          : ext === 'pdf'
            ? 'pdf'
            : ext === 'docx'
              ? 'docx'
              : 'md';
      const targetKb =
        knowledgeBases.find((k) => k.id === selectedLibraryId && k.id !== 'all') ??
        filteredLibraries[0] ??
        knowledgeBases[1];
      const newDoc: KnowledgeDoc = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        libraryId: targetKb.id,
        libraryName: targetKb.name,
        title: file.name,
        fileType,
        sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        wordCount: content.length,
        updatedAt: new Date().toISOString().slice(0, 10),
        author: '演示管理员',
        excerpt: content.slice(0, 3500),
      };
      onUploadDoc(newDoc);
      onSelectDoc(newDoc.id);
    }
  };

  const handleGenerateDocInsight = async () => {
    if (!activeDoc || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'doc_insight',
          scopeName: activeDoc.libraryName,
          documents: [
            {
              id: activeDoc.id,
              title: activeDoc.title,
              libraryName: activeDoc.libraryName,
              excerpt: activeDoc.excerpt,
            },
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '生成洞察失败');
      onUpdateDocInsight(activeDoc.id, data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成洞察失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="apple-workspace-canvas flex h-full min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      {/* Unified Streamlined Knowledge Directory Sidebar */}
      <aside className="apple-glass-panel hidden lg:flex w-[264px] shrink-0 flex-col border-r p-3.5">
        <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white/85 px-2.5 py-1.5 dark:border-white/[0.08] dark:bg-[#1C1C22]/90">
          <Search className="h-3.5 w-3.5 shrink-0 text-[#86868B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索当前文档..."
            className="w-full bg-transparent text-[12.5px] text-[#1D1D1F] placeholder-[#86868B] focus:outline-none dark:text-white"
          />
        </div>

        {/* Compact Segmented Scope Filter */}
        <div className="mt-3 grid grid-cols-3 rounded-xl bg-black/[0.045] p-0.5 dark:bg-white/[0.06]">
          {(
            [
              { id: 'all', label: '全部' },
              { id: 'company', label: '公司' },
              { id: 'personal', label: '个人' },
            ] as const
          ).map((tab) => {
            const active = scopeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setScopeTab(tab.id);
                  onSelectLibrary('all');
                }}
                className={`rounded-lg py-1.5 text-[12px] font-medium transition-all ${
                  active
                    ? 'bg-white text-[#1D1D1F] shadow-2xs dark:bg-[#2A2A32] dark:text-white'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#98989D] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Single Unified Directory List */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-1 pr-0.5">
          <button
            type="button"
            onClick={() => onSelectLibrary('all')}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[12.5px] font-medium transition-all ${
              selectedLibraryId === 'all'
                ? 'apple-glass-card text-[#1D1D1F] ring-1 ring-[#0D9488]/30 dark:text-white dark:ring-[#10B981]/35'
                : 'text-[#48484A] hover:bg-white/60 dark:text-[#AEAEB2] dark:hover:bg-white/[0.05]'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${kbTheme.softBg} ${kbTheme.text}`}>
                <LibraryBig className="h-3.5 w-3.5" />
              </span>
              <span className="truncate">
                {scopeTab === 'all'
                  ? '全部知识空间'
                  : scopeTab === 'company'
                    ? '全部公司空间'
                    : '全部个人空间'}
              </span>
            </span>
            <span className="font-mono text-[11px] tabular-nums text-[#86868B]">
              {scopeAllCount}
            </span>
          </button>

          <div className="pt-1 space-y-0.5">
            {filteredLibraries.map((kb) => {
              const active = kb.id === selectedLibraryId;
              const matchedCount = docs.filter((d) => d.libraryId === kb.id).length;
              return (
                <button
                  key={kb.id}
                  type="button"
                  onClick={() => onSelectLibrary(kb.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[12.5px] font-medium transition-all ${
                    active
                      ? 'apple-glass-card text-[#1D1D1F] ring-1 ring-[#0D9488]/30 dark:text-white dark:ring-[#10B981]/35'
                      : 'text-[#48484A] hover:bg-white/60 dark:text-[#AEAEB2] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${FOLDER_TONE[kb.accentColor]}`}
                    >
                      {active ? (
                        <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.9} />
                      ) : (
                        <Folder className="h-3.5 w-3.5" strokeWidth={1.8} />
                      )}
                    </span>
                    <span className="truncate">{kb.shortName}</span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[#86868B]">
                    {matchedCount > 0 ? matchedCount : kb.docCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Center File List Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-b border-black/[0.06] lg:border-b-0 lg:border-r dark:border-white/[0.08]">
        <div className="apple-glass-panel flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-display text-[15.5px] font-semibold text-[#1D1D1F] dark:text-white">
                {selectedLibraryId === 'all'
                  ? scopeTab === 'company'
                    ? '公司知识库 · 全部资料'
                    : scopeTab === 'personal'
                      ? '个人知识库 · 全部资料'
                      : '全部知识文档'
                  : activeKb.shortName}
              </h2>
              <span className="font-mono text-[12px] tabular-nums text-[#86868B]">
                · {visibleDocs.length} 份
              </span>
            </div>
            <p className="mt-0.5 truncate text-[12px] text-[#6E6E73] dark:text-[#98989D]">
              {selectedLibraryId === 'all'
                ? '点击左侧知识空间筛选对应资料，支持上传本地文件即时解析'
                : activeKb.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Compact Mobile Space Switcher (hidden on lg where sidebar is visible) */}
            <select
              aria-label="切换知识空间"
              value={selectedLibraryId}
              onChange={(e) => onSelectLibrary(e.target.value)}
              className="lg:hidden h-8 max-w-[160px] rounded-xl border border-black/[0.08] bg-white/90 px-2.5 text-[12px] text-[#1D1D1F] focus:outline-none dark:border-white/[0.1] dark:bg-[#1C1C22] dark:text-white"
            >
              <option value="all">全部空间</option>
              {filteredLibraries.map((kb) => (
                <option key={kb.id} value={kb.id}>
                  {kb.shortName}
                </option>
              ))}
            </select>

            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.json"
              className="hidden"
              onChange={(e) => void handleFileChange(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`inline-flex h-8.5 items-center gap-1.5 rounded-xl px-3.5 text-[12.5px] font-medium text-white transition-all whitespace-nowrap ${kbTheme.solidBg}`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>上传资料</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {visibleDocs.length === 0 ? (
            <div className="apple-glass-card flex h-48 flex-col items-center justify-center rounded-2xl text-center p-6">
              <LibraryBig className="h-8 w-8 text-[#0D9488] opacity-60" />
              <div className="mt-2 text-[13.5px] font-medium text-[#1D1D1F] dark:text-white">
                当前空间暂无匹配文档
              </div>
              <p className="mt-1 text-[12px] text-[#86868B]">
                点击右上角「上传资料」导入本地文件，或切换左侧知识空间
              </p>
            </div>
          ) : (
            <div className="apple-glass-card overflow-x-auto rounded-2xl">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-black/[0.06] text-[11.5px] font-medium text-[#86868B] dark:border-white/[0.08]">
                    <th className="py-3 pl-4 pr-3 font-medium">文档名称</th>
                    <th className="px-3 py-3 font-medium">所属空间</th>
                    <th className="px-3 py-3 text-right font-medium">字数</th>
                    <th className="px-3 py-3 text-right font-medium">大小</th>
                    <th className="py-3 pl-3 pr-4 text-right font-medium">更新日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.045] dark:divide-white/[0.06]">
                  {visibleDocs.map((doc) => {
                    const selected = doc.id === activeDoc?.id;
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => onSelectDoc(doc.id)}
                        className={`cursor-pointer transition-colors ${
                          selected
                            ? 'bg-[#0D9488]/[0.08] dark:bg-[#10B981]/14'
                            : 'hover:bg-white/70 dark:hover:bg-white/[0.03]'
                        }`}
                      >
                        <td className="py-3 pl-4 pr-3">
                          <div className="flex items-center gap-2.5">
                            {doc.fileType === 'xlsx' ? (
                              <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#16A34A] dark:text-[#4ADE80]" />
                            ) : doc.fileType === 'pdf' ? (
                              <FileText className="h-4 w-4 shrink-0 text-[#E11D48] dark:text-[#FB7185]" />
                            ) : doc.fileType === 'docx' ? (
                              <FileCode2 className="h-4 w-4 shrink-0 text-[#0071E3] dark:text-[#60A5FA]" />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0 text-[#0D9488] dark:text-[#34D399]" />
                            )}
                            <span className="truncate text-[13.5px] font-medium text-[#1D1D1F] dark:text-white">
                              {doc.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[12.5px] text-[#6E6E73] dark:text-[#98989D]">
                          {doc.libraryName}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums text-[#86868B]">
                          {doc.wordCount.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums text-[#86868B]">
                          {doc.sizeLabel}
                        </td>
                        <td className="py-3 pl-3 pr-4 text-right font-mono text-[12px] tabular-nums text-[#86868B]">
                          {doc.updatedAt}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Right Document & Summary Inspector */}
      <aside className="apple-glass-panel flex w-full shrink-0 flex-col lg:w-[360px] xl:w-[400px]">
        {activeDoc ? (
          <div className="flex flex-1 flex-col overflow-y-auto p-5 space-y-4">
            <div>
              <div className="text-[12px] text-[#86868B] tabular-nums">
                {activeDoc.libraryName} · {activeDoc.author} · {activeDoc.updatedAt}
              </div>
              <h2 className="mt-1 font-display text-[17px] font-semibold leading-snug text-[#1D1D1F] dark:text-white">
                {activeDoc.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => void handleGenerateDocInsight()}
                className={`inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-[12.5px] font-medium text-white transition-colors disabled:opacity-50 ${kbTheme.solidBg}`}
              >
                <FileSearch className="h-3.5 w-3.5" />
                <span>{isAnalyzing ? '解析中...' : '提炼文档摘要'}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onAskAiAboutDoc(
                    `请基于《${activeDoc.title}》的原文内容，帮我提炼关键规则并解答执行盲区。`
                  )
                }
                className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white/85 px-3 text-[12.5px] font-medium text-[#1D1D1F] hover:bg-white dark:border-white/[0.1] dark:bg-[#1C1C22] dark:text-white"
              >
                <MessageSquare className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#60A5FA]" />
                <span>对话提问</span>
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50/70 px-3 py-2 text-[12.5px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            {activeDoc.aiSummary && (
              <div className="apple-glass-card rounded-2xl border-[#0D9488]/25 p-4 dark:border-[#10B981]/30">
                <div className={`mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold ${kbTheme.text}`}>
                  <FileSearch className="h-3.5 w-3.5" />
                  <span>文档核心摘要</span>
                </div>
                <MarkdownRenderer content={activeDoc.aiSummary} />
              </div>
            )}

            <div className="border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
              <div className="mb-2 text-[11.5px] font-medium text-[#86868B]">
                原文内容预览
              </div>
              <div className="whitespace-pre-wrap text-[13px] leading-[1.7] text-[#3A3A3C] dark:text-neutral-300">
                {activeDoc.excerpt}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-[13px] text-[#86868B]">
            选择左侧文档查看原文与文档摘要
          </div>
        )}
      </aside>
    </div>
  );
};
