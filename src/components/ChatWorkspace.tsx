import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  BookOpenCheck,
  Compass,
  FileSpreadsheet,
  FileText,
  Globe,
  Lightbulb,
  Loader2,
  MessagesSquare,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  PenLine,
  Search,
  X,
} from 'lucide-react';
import type {
  ChatAttachment,
  ChatMessage,
  ChatMode,
  ChatSession,
  KnowledgeBase,
  KnowledgeDoc,
} from '../types/knowhub';
import { USER_PROFILE } from '../data/workspaceData';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatWorkspaceProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onUpdateSessionMessages: (
    sessionId: string,
    messages: ChatMessage[],
    newTitle?: string
  ) => void;
  knowledgeBases: KnowledgeBase[];
  selectedLibraryId: string;
  docs: KnowledgeDoc[];
  onSaveAiToNote: (title: string, content: string) => void;
  pendingQuickPrompt: string | null;
  onClearPendingQuickPrompt: () => void;
}

const CAPABILITY_CARDS: {
  mode: ChatMode;
  title: string;
  desc: string;
  prompt: string;
  colorClass: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  {
    mode: 'analyze',
    title: '分析问题',
    desc: '梳理复杂规则，定位原文依据',
    prompt: '物语的人力职级和薪资计算公式是什么？净薪额怎么核算？',
    colorClass: 'bg-[#6E56CF]/12 text-[#6E56CF] dark:bg-[#8E75FF]/18 dark:text-[#A78BFA]',
    icon: Compass,
  },
  {
    mode: 'draft',
    title: '撰写内容',
    desc: '根据内部资料起草研究与汇报',
    prompt: '基于星河门店周报提交规范，帮我起草一份本周门店运营周报模板。',
    colorClass: 'bg-[#0071E3]/12 text-[#0071E3] dark:bg-[#2997FF]/18 dark:text-[#60A5FA]',
    icon: PenLine,
  },
  {
    mode: 'data',
    title: '数据分析',
    desc: '比对报表字段、公式与对账口径',
    prompt: '采购对账汇总.xlsx 中“每日明细”有哪些字段？差异超 ±50 元如何处理？',
    colorClass: 'bg-[#0D9488]/12 text-[#0D9488] dark:bg-[#10B981]/18 dark:text-[#34D399]',
    icon: FileSpreadsheet,
  },
  {
    mode: 'brainstorm',
    title: '头脑风暴',
    desc: '关联多库上下文，推演业务路径',
    prompt: '如何把星河门店周报评分与 A 级门店合伙人分红机制结合起来激励店长？',
    colorClass: 'bg-[#D97706]/12 text-[#D97706] dark:bg-[#F59E0B]/18 dark:text-[#FBBF24]',
    icon: Lightbulb,
  },
];

const MODE_LABELS: Record<ChatMode, string> = {
  general: '标准对话',
  analyze: '深度分析',
  draft: '撰写起草',
  data: '数据口径',
  brainstorm: '脑暴推演',
};

function parseFollowUps(rawText: string): {
  cleanContent: string;
  followUps: string[];
} {
  const marker = '---FOLLOWUPS---';
  const idx = rawText.indexOf(marker);
  if (idx === -1) {
    return { cleanContent: rawText, followUps: [] };
  }
  const cleanContent = rawText.slice(0, idx).trim();
  const tail = rawText.slice(idx + marker.length).trim();
  const followUps = tail
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
  return { cleanContent, followUps };
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onUpdateSessionMessages,
  knowledgeBases,
  selectedLibraryId,
  docs,
  onSaveAiToNote,
  pendingQuickPrompt,
  onClearPendingQuickPrompt,
}) => {
  const [historyOpen, setHistoryOpen] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<ChatMode>('general');
  const [webSearch, setWebSearch] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inspectedDoc, setInspectedDoc] = useState<KnowledgeDoc | null>(null);
  const [savedNoticeId, setSavedNoticeId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) ?? sessions[0];

  const activeKb =
    knowledgeBases.find((kb) => kb.id === selectedLibraryId) ?? knowledgeBases[0];

  const scopedDocs = useMemo(() => {
    if (selectedLibraryId === 'all') return docs;
    return docs.filter((d) => d.libraryId === selectedLibraryId);
  }, [docs, selectedLibraryId]);

  const filteredSessions = useMemo(() => {
    const q = historyFilter.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, historyFilter]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length, isStreaming]);

  useEffect(() => {
    if (pendingQuickPrompt && !isStreaming) {
      const prompt = pendingQuickPrompt;
      onClearPendingQuickPrompt();
      void handleSend(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuickPrompt]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const loaded: ChatAttachment[] = [];
    for (const file of Array.from(files)) {
      const text = await file
        .text()
        .catch(() => `[附件: ${file.name}，${Math.round(file.size / 1024)} KB]`);
      loaded.push({
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        content: text,
      });
    }
    setAttachments((prev) => [...prev, ...loaded]);
  };

  const handleCitationClick = (title: string) => {
    const found =
      docs.find(
        (d) =>
          d.title === title ||
          d.title.includes(title) ||
          title.includes(d.title.replace(/\.[^.]+$/, ''))
      ) ?? null;
    if (found) {
      setInspectedDoc(found);
    }
  };

  const handleSend = async (overrideText?: string, overrideMode?: ChatMode) => {
    const queryText = (overrideText ?? inputValue).trim();
    if (!queryText || isStreaming || !activeSession) return;

    const currentMode = overrideMode ?? mode;
    const nowLabel = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content:
        attachments.length > 0
          ? `${queryText}\n\n（已附带 ${attachments.map((a) => a.name).join('、')}）`
          : queryText,
      timestamp: nowLabel,
    };

    const assistantMsgId = `a-${Date.now() + 1}`;
    const placeholderAi: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: nowLabel,
    };

    const nextTitle =
      activeSession.messages.length === 0
        ? queryText.slice(0, 26)
        : activeSession.title;

    const baseMessages = [...activeSession.messages, userMsg];
    onUpdateSessionMessages(activeSession.id, [...baseMessages, placeholderAi], nextTitle);

    if (!overrideText) setInputValue('');
    const usedAttachments = [...attachments];
    setAttachments([]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: baseMessages.map((m) => ({ role: m.role, content: m.content })),
          scopeLabel: activeKb.name,
          documents: scopedDocs.map((d) => ({
            id: d.id,
            title: d.title,
            libraryName: d.libraryName,
            excerpt: d.excerpt,
          })),
          webSearch,
          mode: currentMode,
          attachedFiles: usedAttachments.map((a) => ({
            name: a.name,
            content: a.content,
          })),
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || `请求失败 (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';
      let groundingUrls: { title: string; uri: string }[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const block of lines) {
          const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
          if (!dataLine) continue;

          const json = JSON.parse(dataLine.slice(6));
          if (json.type === 'delta' && json.text) {
            accumulated += json.text;
            const { cleanContent } = parseFollowUps(accumulated);
            onUpdateSessionMessages(
              activeSession.id,
              [
                ...baseMessages,
                {
                  id: assistantMsgId,
                  role: 'assistant',
                  content: cleanContent,
                  timestamp: nowLabel,
                  groundingUrls,
                },
              ],
              nextTitle
            );
          } else if (json.type === 'grounding' && Array.isArray(json.urls)) {
            groundingUrls = json.urls;
          } else if (json.type === 'error') {
            throw new Error(json.message || '响应流中断');
          }
        }
      }

      const { cleanContent, followUps } = parseFollowUps(accumulated);
      onUpdateSessionMessages(
        activeSession.id,
        [
          ...baseMessages,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: cleanContent,
            timestamp: nowLabel,
            followUps,
            groundingUrls,
          },
        ],
        nextTitle
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求服务失败';
      onUpdateSessionMessages(
        activeSession.id,
        [
          ...baseMessages,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: msg,
            timestamp: nowLabel,
            isError: true,
          },
        ],
        nextTitle
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const renderComposer = (compact: boolean) => (
    <div
      className={`ai-composer-shell apple-glass-elevated rounded-2xl transition-all ${
        compact ? 'p-3.5' : 'p-4 sm:p-5'
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void handleFileUpload(e.dataTransfer.files);
      }}
    >
      {attachments.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-[#F5F5F7] px-2.5 py-1 text-[12px] text-[#1D1D1F] dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
            >
              <FileText className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF]" />
              <span className="max-w-[160px] truncate font-medium">{att.name}</span>
              <span className="font-mono text-[11px] text-[#86868B]">{att.sizeLabel}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                }
                aria-label="移除附件"
                className="ml-0.5 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        rows={compact ? 2 : 3}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
          }
        }}
        placeholder="输入你的问题，基于知识库精准检索与推理（Enter 发送，Shift + Enter 换行）..."
        className="w-full resize-none bg-transparent text-[14.5px] leading-relaxed text-[#1D1D1F] placeholder-[#86868B] focus:outline-none dark:text-white dark:placeholder-[#8E8E93]"
      />

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2.5 border-t border-black/[0.05] pt-2.5 dark:border-white/[0.07]">
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.csv,.json,.log"
            className="hidden"
            onChange={(e) => void handleFileUpload(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-[#48484A] transition-colors hover:bg-black/[0.05] hover:text-[#1D1D1F] whitespace-nowrap dark:text-[#AEAEB2] dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            <Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>上传文件</span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={webSearch}
            onClick={() => setWebSearch((prev) => !prev)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium transition-colors whitespace-nowrap ${
              webSearch
                ? 'bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#2997FF]/15 dark:text-[#47A3FF]'
                : 'text-[#48484A] hover:bg-black/[0.05] dark:text-[#AEAEB2] dark:hover:bg-white/[0.08]'
            }`}
          >
            <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>联网搜索</span>
            <span
              className={`ml-0.5 inline-flex h-4 w-7 items-center rounded-full p-0.5 transition-colors ${
                webSearch
                  ? 'bg-[#0071E3] dark:bg-[#2997FF]'
                  : 'bg-[#D1D1D6] dark:bg-[#3A3A3C]'
              }`}
            >
              <span
                className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
                  webSearch ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </span>
          </button>

          <div className="hidden md:flex items-center rounded-lg bg-[#F5F5F7] p-0.5 dark:bg-[#2C2C2E]">
            {(['general', 'analyze', 'draft', 'data'] as ChatMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md px-2 py-1 text-[11.5px] font-medium transition-colors whitespace-nowrap ${
                  mode === m
                    ? 'bg-white text-[#1D1D1F] shadow-xs dark:bg-[#3A3A3C] dark:text-white'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#98989D] dark:hover:text-white'
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden xl:inline text-[12px] text-[#86868B] truncate max-w-[180px]">
            {activeKb.shortName}
          </span>
          <button
            type="button"
            disabled={!inputValue.trim() || isStreaming}
            onClick={() => void handleSend()}
            aria-label="发送问题"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0071E3] text-white transition-all hover:bg-[#0077ED] disabled:cursor-not-allowed disabled:opacity-35 dark:bg-[#2997FF] dark:hover:bg-[#40A3FF]"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );

  const isWelcomeState = !activeSession || activeSession.messages.length === 0;

  return (
    <div className="apple-workspace-canvas flex h-full min-h-0 flex-1 overflow-hidden">
      {/* Left History Drawer (Hidden on mobile by default, responsive on md+) */}
      {historyOpen && (
        <aside className="apple-glass-panel hidden md:flex w-[252px] shrink-0 flex-col border-r">
          <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
            <span className="text-[12px] font-medium text-[#86868B] dark:text-[#98989D]">
              历史对话
            </span>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              title="收起对话列表"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#86868B] hover:bg-black/[0.05] hover:text-[#1D1D1F] dark:hover:bg-white/[0.08] dark:hover:text-white"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="px-3 pb-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-2.5 py-1.5 dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <Search className="h-3.5 w-3.5 shrink-0 text-[#86868B]" />
              <input
                type="text"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                placeholder="搜索对话记录"
                className="w-full bg-transparent text-[12.5px] text-[#1D1D1F] placeholder-[#86868B] focus:outline-none dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
            {(['今天', '更早'] as const).map((groupName) => {
              const items = filteredSessions.filter((s) => s.group === groupName);
              if (items.length === 0) return null;
              return (
                <div key={groupName}>
                  <div className="px-2.5 pb-1 text-[11px] font-medium text-[#86868B]">
                    {groupName}
                  </div>
                  <div className="space-y-0.5">
                    {items.map((session) => {
                      const active = session.id === activeSession?.id;
                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => onSelectSession(session.id)}
                          className={`w-full rounded-xl px-2.5 py-2 text-left transition-colors ${
                            active
                              ? 'bg-white text-[#1D1D1F] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] dark:bg-[#2C2C2E] dark:text-white'
                              : 'text-[#48484A] hover:bg-black/[0.04] dark:text-[#AEAEB2] dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="truncate text-[13px] font-medium leading-snug">
                            {session.title}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] tabular-nums text-[#86868B]">
                            {session.timeLabel}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* Main AI Canvas */}
      <div className="relative flex min-w-0 flex-1 flex-col bg-transparent">
        {!historyOpen && (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            title="展开历史对话"
            className="apple-glass-card hidden md:flex absolute left-4 top-4 z-10 h-8 w-8 items-center justify-center rounded-lg text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#98989D] dark:hover:text-white"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}

        {isWelcomeState ? (
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8 sm:px-6">
            <div className="w-full max-w-3xl">
              {/* Clean Cobalt Workspace Emblem */}
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0071E3]/10 text-[#0071E3] ring-1 ring-[#0071E3]/15 dark:bg-[#2997FF]/15 dark:text-[#60A5FA] dark:ring-[#2997FF]/25">
                <MessagesSquare className="h-5 w-5" strokeWidth={1.85} />
              </div>

              <div className="text-center">
                <h1 className="font-display text-[24px] font-semibold tracking-tight text-[#1D1D1F] text-balance sm:text-[32px] dark:text-white">
                  你好，{USER_PROFILE.name}，今天想聊点什么？
                </h1>
                <p className="mx-auto mt-2 max-w-xl text-[14px] leading-relaxed text-[#6E6E73] dark:text-[#98989D]">
                  基于当前 {scopedDocs.length} 份核心资料与 11 个知识库，为你提供有据可查的研究支持。
                </p>
              </div>

              {/* Focal Composer */}
              <div className="mt-7">{renderComposer(false)}</div>

              {/* 4 Domain-Colored Capability Cards */}
              <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {CAPABILITY_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.title}
                      type="button"
                      onClick={() => {
                        setMode(card.mode);
                        setInputValue(card.prompt);
                        textareaRef.current?.focus();
                      }}
                      className="apple-glass-card group flex flex-col justify-between rounded-2xl p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[#0071E3]/25 dark:hover:border-[#2997FF]/35"
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.colorClass}`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.85} />
                      </div>
                      <div className="mt-4">
                        <div className="text-[14px] font-semibold text-[#1D1D1F] dark:text-white">
                          {card.title}
                        </div>
                        <div className="mt-1 text-[12.5px] leading-snug text-[#6E6E73] dark:text-[#98989D]">
                          {card.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-7 sm:px-6">
              <div className="mx-auto max-w-3xl space-y-8">
                {activeSession.messages.map((msg, index) => {
                  const isLast = index === activeSession.messages.length - 1;
                  if (msg.role === 'user') {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl bg-[#0071E3]/10 px-4 py-3 text-[14.5px] leading-relaxed text-[#1D1D1F] dark:bg-[#2997FF]/18 dark:text-white">
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="apple-glass-card rounded-2xl p-5 sm:p-6 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-black/[0.05] pb-3 text-[12px] text-[#86868B] dark:border-white/[0.07]">
                        <div className="flex items-center gap-2">
                          <MessagesSquare className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF]" />
                          <span className="font-medium text-[#1D1D1F] dark:text-white">
                            Knowhub 知识助手
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{msg.timestamp}</span>
                        </div>
                        {msg.content && !msg.isError && (
                          <button
                            type="button"
                            onClick={() => {
                              onSaveAiToNote(activeSession.title, msg.content);
                              setSavedNoticeId(msg.id);
                              setTimeout(() => setSavedNoticeId(null), 2000);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-[#6E56CF] transition-colors hover:bg-[#6E56CF]/10 dark:text-[#A78BFA]"
                          >
                            <NotebookPen className="h-3.5 w-3.5" />
                            <span>
                              {savedNoticeId === msg.id ? '已存入笔记' : '存为笔记'}
                            </span>
                          </button>
                        )}
                      </div>

                      {msg.isError ? (
                        <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-[13.5px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                          {msg.content}
                        </div>
                      ) : msg.content ? (
                        <div className="pl-0.5">
                          <MarkdownRenderer
                            content={msg.content}
                            onCitationClick={handleCitationClick}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-2 text-[13.5px] text-[#86868B]">
                          <Loader2 className="h-4 w-4 animate-spin text-[#0071E3] dark:text-[#2997FF]" />
                          <span>正在检索知识库并整理回答...</span>
                        </div>
                      )}

                      {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-black/[0.05] pt-3 text-[12px] text-[#6E6E73] dark:border-white/[0.07] dark:text-[#98989D]">
                          <span className="font-medium">公开网页依据：</span>
                          {msg.groundingUrls.slice(0, 3).map((u) => (
                            <a
                              key={u.uri}
                              href={u.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-black/20 underline-offset-2 hover:text-[#0071E3] dark:decoration-white/20 dark:hover:text-[#47A3FF]"
                            >
                              {u.title}
                            </a>
                          ))}
                        </div>
                      )}

                      {isLast && !isStreaming && msg.followUps && msg.followUps.length > 0 && (
                        <div className="flex flex-wrap gap-2 border-t border-black/[0.05] pt-3 dark:border-white/[0.07]">
                          {msg.followUps.map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => void handleSend(f)}
                              className="rounded-xl border border-black/[0.08] bg-white/70 px-3 py-1.5 text-[12.5px] text-[#48484A] transition-colors hover:border-[#0071E3]/40 hover:text-[#0071E3] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#AEAEB2] dark:hover:border-[#2997FF]/50 dark:hover:text-[#47A3FF]"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="apple-glass-panel border-t px-4 py-4 sm:px-6">
              <div className="mx-auto max-w-3xl">
                {renderComposer(true)}
                <div className="mt-2 flex items-center justify-between text-[11.5px] text-[#86868B]">
                  <span>依据当前知识范围检索原文与 Wiki · Enter 发送</span>
                  <button
                    type="button"
                    onClick={onNewChat}
                    className="hover:text-[#1D1D1F] dark:hover:text-white"
                  >
                    开启新对话
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Citation Evidence Drawer */}
      {inspectedDoc && (
        <aside className="apple-glass-panel hidden lg:flex w-[320px] shrink-0 flex-col border-l">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3.5 dark:border-white/[0.08]">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1D1D1F] dark:text-white">
              <BookOpenCheck className="h-4 w-4 text-[#0D9488] dark:text-[#34D399]" />
              <span>原文依据</span>
            </div>
            <button
              type="button"
              onClick={() => setInspectedDoc(null)}
              aria-label="关闭原文依据"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <h3 className="font-display text-[15px] font-semibold leading-snug text-[#1D1D1F] dark:text-white">
                {inspectedDoc.title}
              </h3>
              <div className="mt-1.5 text-[12px] text-[#86868B] tabular-nums">
                {inspectedDoc.libraryName} · {inspectedDoc.sizeLabel} · {inspectedDoc.updatedAt}
              </div>
            </div>
            <div className="border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
              <div className="whitespace-pre-wrap text-[13.5px] leading-[1.7] text-[#3A3A3C] dark:text-neutral-300">
                {inspectedDoc.excerpt}
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
