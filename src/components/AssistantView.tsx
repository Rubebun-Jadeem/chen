import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  AudioLines,
  BotMessageSquare,
  Check,
  Download,
  Eye,
  FileCode2,
  FileText,
  Loader2,
  Mic,
  NotebookPen,
  Plus,
  Star,
  X,
} from 'lucide-react';
import type {
  DsBotAgent,
  DsBotDeliverable,
  DsBotMessage,
  KnowledgeBase,
  KnowledgeDoc,
} from '../types/knowhub';
import { FEATURE_THEME } from '../data/featureTheme';
import { MarkdownRenderer } from './MarkdownRenderer';

interface AssistantViewProps {
  bots: DsBotAgent[];
  activeBotId: string;
  onSelectBot: (id: string) => void;
  onUpdateBotMessages: (botId: string, messages: DsBotMessage[]) => void;
  onCreateBot: (name: string, roleTitle: string) => void;
  docs: KnowledgeDoc[];
  knowledgeBases: KnowledgeBase[];
  onSaveDeliverableToKnowledge: (title: string, content: string) => void;
  onSaveDeliverableToNote: (title: string, content: string) => void;
}

const BOT_AVATAR_BG: Record<DsBotAgent['color'], string> = {
  blue: 'bg-[#2563EB] text-white',
  cyan: 'bg-[#0EA5E9] text-white',
  amber: 'bg-[#F97316] text-white',
  slate: 'bg-[#1D1D1F] text-white dark:bg-[#3A3A3C]',
  violet: 'bg-[#6E56CF] text-white',
};

export const AssistantView: React.FC<AssistantViewProps> = ({
  bots,
  activeBotId,
  onSelectBot,
  onUpdateBotMessages,
  onCreateBot,
  docs,
  knowledgeBases,
  onSaveDeliverableToKnowledge,
  onSaveDeliverableToNote,
}) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [skillsMenuOpen, setSkillsMenuOpen] = useState(false);
  const [previewDeliverable, setPreviewDeliverable] =
    useState<DsBotDeliverable | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [newBotModalOpen, setNewBotModalOpen] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotRole, setNewBotRole] = useState('');

  const endRef = useRef<HTMLDivElement>(null);

  const activeBot = bots.find((b) => b.id === activeBotId) ?? bots[0];
  const targetKb =
    knowledgeBases.find((kb) => kb.id === activeBot?.targetLibraryId) ??
    knowledgeBases[0];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeBot?.messages.length, isStreaming]);

  const handleSend = async (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? input).trim();
    if (!prompt || isStreaming || !activeBot) return;

    const nowLabel = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const userMsg: DsBotMessage = {
      id: `bu-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: nowLabel,
    };

    const botMsgId = `bb-${Date.now() + 1}`;
    const placeholderBot: DsBotMessage = {
      id: botMsgId,
      role: 'bot',
      content: '',
      timestamp: nowLabel,
    };

    const baseMessages = [...activeBot.messages, userMsg];
    onUpdateBotMessages(activeBot.id, [...baseMessages, placeholderBot]);
    if (!overridePrompt) setInput('');
    setSkillsMenuOpen(false);
    setIsStreaming(true);

    const scopedDocs = docs.filter(
      (d) =>
        activeBot.targetLibraryId === 'all' ||
        d.libraryId === activeBot.targetLibraryId
    );

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: baseMessages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
          scopeLabel: `${activeBot.name}（${targetKb.name}）`,
          documents: scopedDocs.map((d) => ({
            id: d.id,
            title: d.title,
            libraryName: d.libraryName,
            excerpt: d.excerpt,
          })),
          mode: 'draft',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `请求失败 (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取 DS Bot 响应流');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';

        for (const block of blocks) {
          const line = block.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          const json = JSON.parse(line.slice(6));
          if (json.type === 'delta' && json.text) {
            accumulated += json.text;
            const cleanText = accumulated.split('---FOLLOWUPS---')[0].trim();
            onUpdateBotMessages(activeBot.id, [
              ...baseMessages,
              {
                id: botMsgId,
                role: 'bot',
                content: cleanText,
                timestamp: nowLabel,
              },
            ]);
          } else if (json.type === 'error') {
            throw new Error(json.message);
          }
        }
      }

      const finalClean = accumulated.split('---FOLLOWUPS---')[0].trim();
      const deliverable: DsBotDeliverable = {
        id: `deliv-${Date.now()}`,
        fileName: `${activeBot.name}_${prompt.slice(0, 12).replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '')}.md`,
        subtitle: `${activeBot.name} 自动生成交付件 · Markdown`,
        format: 'md',
        content: finalClean,
      };

      onUpdateBotMessages(activeBot.id, [
        ...baseMessages,
        {
          id: botMsgId,
          role: 'bot',
          content: finalClean,
          timestamp: nowLabel,
          deliverables: finalClean.length > 120 ? [deliverable] : undefined,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'DS Bot 连接失败';
      onUpdateBotMessages(activeBot.id, [
        ...baseMessages,
        {
          id: botMsgId,
          role: 'bot',
          content: msg,
          timestamp: nowLabel,
          isError: true,
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleDownloadDeliverable = (deliv: DsBotDeliverable) => {
    const blob = new Blob([deliv.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = deliv.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const botTheme = FEATURE_THEME.assistant;

  return (
    <div className="apple-workspace-canvas flex h-full min-h-0 flex-1 overflow-hidden">
      {/* DS Bot Vertical Agent Rail */}
      <aside className="apple-glass-panel flex w-[64px] shrink-0 flex-col items-center justify-between border-r py-4">
        <div className="flex flex-col items-center gap-3">
          {bots.map((bot) => {
            const isSelected = bot.id === activeBot?.id;
            return (
              <button
                key={bot.id}
                type="button"
                onClick={() => onSelectBot(bot.id)}
                title={`${bot.name} · ${bot.roleTitle}`}
                className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                  BOT_AVATAR_BG[bot.color]
                } ${
                  isSelected
                    ? 'ring-2 ring-[#0284C7] ring-offset-2 ring-offset-[#F4F5F9] scale-105 dark:ring-[#38BDF8] dark:ring-offset-[#141417]'
                    : 'opacity-80 hover:opacity-100'
                }`}
              >
                <BotMessageSquare className="h-5 w-5" strokeWidth={2} />
                {bot.starred && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-xs dark:bg-[#1C1C1E]">
                    <Star className="h-2.5 w-2.5 fill-[#F59E0B] text-[#F59E0B]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={() => setNewBotModalOpen(true)}
            title="新建专业 Bot"
            className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-xs transition-transform hover:scale-105 ${botTheme.solidBg}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main DS Bot Workspace */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="apple-glass-panel flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-6">
          <div className="text-[12px] text-[#86868B] hidden md:block">
            当前授权范围：<span className="font-medium text-[#1D1D1F] dark:text-white">{targetKb.shortName}</span>
          </div>

          <div className="apple-glass-card mx-auto flex items-center gap-2 rounded-full px-3.5 py-1.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                BOT_AVATAR_BG[activeBot.color]
              }`}
            >
              <BotMessageSquare className="h-3 w-3" />
            </span>
            <span className="text-[13.5px] font-semibold text-[#1D1D1F] dark:text-white">
              {activeBot.name}
            </span>
            <span className="hidden text-[12px] text-[#86868B] sm:inline">
              · {activeBot.roleTitle}
            </span>
          </div>

          <div className={`hidden md:flex items-center gap-2 text-[12px] ${botTheme.text}`}>
            <span>DS Bot 已就绪 · 原文件版本隔离</span>
          </div>
        </div>

        {/* Conversation / Deliverable Canvas */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {activeBot.messages.length === 0 ? (
              <div className="py-12 text-center space-y-6">
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${
                    BOT_AVATAR_BG[activeBot.color]
                  }`}
                >
                  <BotMessageSquare className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="font-display text-[22px] font-semibold text-[#1D1D1F] dark:text-white">
                    {activeBot.name}
                  </h2>
                  <p className="mx-auto mt-1.5 max-w-lg text-[13.5px] leading-relaxed text-[#6E6E73] dark:text-[#98989D]">
                    {activeBot.description}
                  </p>
                </div>

                <div className="mx-auto max-w-xl space-y-2 text-left">
                  <div className="text-[12px] font-medium text-[#86868B]">
                    快速触发 {activeBot.name} 技能
                  </div>
                  {activeBot.quickPrompts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void handleSend(q)}
                      className="apple-glass-card flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-[13.5px] text-[#1D1D1F] transition-all hover:ring-1 hover:ring-[#0284C7]/35 dark:text-white"
                    >
                      <span>{q}</span>
                      <ArrowRight className={`h-4 w-4 shrink-0 ${botTheme.text}`} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeBot.messages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[82%] rounded-2xl bg-[#0071E3]/10 px-4 py-3 text-[14px] leading-relaxed text-[#1D1D1F] dark:bg-[#2997FF]/20 dark:text-white">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="space-y-3">
                    {msg.isError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-[13.5px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                        {msg.content}
                      </div>
                    ) : msg.content ? (
                      <div className="rounded-2xl border border-black/[0.06] bg-[#FAFAFC]/70 p-5 dark:border-white/[0.08] dark:bg-[#161618]">
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-2 text-[13px] text-[#86868B]">
                        <Loader2 className="h-4 w-4 animate-spin text-[#0284C7]" />
                        <span>{activeBot.name} 正在读取授权原文并生成交付物...</span>
                      </div>
                    )}

                    <div className="text-[11.5px] text-[#86868B] tabular-nums">
                      {msg.timestamp}
                    </div>

                    {/* Deliverable File Attachment Cards (Like image_456f807c.png) */}
                    {msg.deliverables && msg.deliverables.length > 0 && (
                      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                        {msg.deliverables.map((deliv) => {
                          const isSaved = savedIds[deliv.id];
                          return (
                            <div
                              key={deliv.id}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-white/[0.1] dark:bg-[#1C1C1E]"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    deliv.format === 'pdf'
                                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                      : deliv.format === 'html'
                                        ? 'bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8]'
                                        : 'bg-[#6E56CF]/10 text-[#6E56CF] dark:text-[#A78BFA]'
                                  }`}
                                >
                                  {deliv.format === 'html' ? (
                                    <FileCode2 className="h-5 w-5" />
                                  ) : (
                                    <FileText className="h-5 w-5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-[13px] font-semibold text-[#1D1D1F] dark:text-white">
                                    {deliv.fileName}
                                  </div>
                                  <div className="truncate text-[11.5px] text-[#86868B]">
                                    {deliv.subtitle}
                                  </div>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDeliverable(deliv)}
                                  title="预览产物"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.06] text-[#48484A] hover:bg-[#F5F5F7] dark:border-white/[0.1] dark:text-[#AEAEB2] dark:hover:bg-[#2C2C2E]"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDeliverable(deliv)}
                                  title="下载文件"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.06] text-[#48484A] hover:bg-[#F5F5F7] dark:border-white/[0.1] dark:text-[#AEAEB2] dark:hover:bg-[#2C2C2E]"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSaveDeliverableToKnowledge(
                                      deliv.fileName,
                                      deliv.content
                                    );
                                    onSaveDeliverableToNote(
                                      `DS Bot 产物：${deliv.fileName}`,
                                      deliv.content
                                    );
                                    setSavedIds((prev) => ({
                                      ...prev,
                                      [deliv.id]: true,
                                    }));
                                  }}
                                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-black/[0.08] bg-[#FAFAFC] px-2.5 text-[12px] font-medium text-[#1D1D1F] hover:bg-[#F0F0F5] whitespace-nowrap dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
                                >
                                  {isSaved ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-[#0D9488]" />
                                      <span>已保存</span>
                                    </>
                                  ) : (
                                    <span>保存</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Floating Quick Skills Popover */}
        {skillsMenuOpen && (
          <div className="mx-auto mb-2 w-full max-w-3xl px-4">
            <div className="rounded-2xl border border-black/[0.08] bg-white/95 p-3 shadow-lg backdrop-blur-xl dark:border-white/[0.1] dark:bg-[#1C1C1E]/95">
              <div className="mb-2 flex items-center justify-between text-[12px] font-medium text-[#86868B]">
                <span>选择 {activeBot.name} 快捷指令</span>
                <button
                  type="button"
                  onClick={() => setSkillsMenuOpen(false)}
                  className="text-[#86868B] hover:text-[#1D1D1F]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeBot.quickPrompts.map((qp) => (
                  <button
                    key={qp}
                    type="button"
                    onClick={() => void handleSend(qp)}
                    className="rounded-xl border border-black/[0.06] bg-[#FAFAFC] px-3 py-1.5 text-left text-[12.5px] text-[#1D1D1F] hover:border-[#0071E3]/40 dark:border-white/[0.08] dark:bg-[#2C2C2E] dark:text-white"
                  >
                    {qp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DS Bot Sleek Pill Composer */}
        <div className="px-4 pb-5 pt-2 sm:px-8">
          <div className="apple-glass-elevated mx-auto flex max-w-3xl items-center gap-2 rounded-full p-1.5 transition-shadow focus-within:ring-2 focus-within:ring-[#0284C7]/25">
            <button
              type="button"
              onClick={() => setSkillsMenuOpen((prev) => !prev)}
              title="插入技能指令"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#48484A] shadow-2xs transition-colors hover:bg-[#F0F0F5] dark:bg-[#2C2C2E] dark:text-white"
            >
              <Plus className="h-4 w-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={`给 ${activeBot.name} 发消息`}
              className="min-w-0 flex-1 bg-transparent px-2 text-[14px] text-[#1D1D1F] placeholder-[#86868B] focus:outline-none dark:text-white"
            />

            <button
              type="button"
              onClick={() =>
                void handleSend(
                  activeBot.quickPrompts[0] || '请根据知识库生成当前工作汇报'
                )
              }
              title="快捷执行"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105 ${botTheme.solidBg}`}
            >
              <AudioLines className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={isStreaming}
              onClick={() => void handleSend()}
              aria-label="发送消息"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#1D1D1F] shadow-2xs transition-colors hover:bg-[#0284C7] hover:text-white disabled:opacity-40 dark:bg-[#2C2C2E] dark:text-white dark:hover:bg-[#38BDF8]"
            >
              {input.trim() ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Deliverable Preview Drawer/Modal */}
      {previewDeliverable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={() => setPreviewDeliverable(null)}
        >
          <div
            className="flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3.5 dark:border-white/[0.08]">
              <div>
                <div className="text-[14px] font-semibold text-[#1D1D1F] dark:text-white">
                  {previewDeliverable.fileName}
                </div>
                <div className="text-[11.5px] text-[#86868B]">
                  {previewDeliverable.subtitle}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSaveDeliverableToNote(
                      `DS Bot 产物：${previewDeliverable.fileName}`,
                      previewDeliverable.content
                    );
                    setPreviewDeliverable(null);
                  }}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-white ${botTheme.solidBg}`}
                >
                  <NotebookPen className="h-3.5 w-3.5" />
                  <span>存入笔记</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDeliverable(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#86868B] hover:bg-black/[0.05]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <MarkdownRenderer content={previewDeliverable.content} />
            </div>
          </div>
        </div>
      )}

      {/* New Bot Modal */}
      {newBotModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={() => setNewBotModalOpen(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newBotName.trim()) return;
              onCreateBot(
                newBotName.trim(),
                newBotRole.trim() || '自定义知识库助手'
              );
              setNewBotName('');
              setNewBotRole('');
              setNewBotModalOpen(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="apple-glass-elevated w-full max-w-md rounded-2xl p-5"
          >
            <h3 className="font-display text-[17px] font-semibold text-[#1D1D1F] dark:text-white">
              新建专业 DS Bot
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[12px] font-medium text-[#6E6E73]">
                  Bot 名称
                </label>
                <input
                  type="text"
                  required
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  placeholder="例如：法务合同审查 Bot"
                  className="mt-1 w-full rounded-xl border border-black/[0.08] bg-[#FAFAFC] px-3 py-2 text-[13.5px] focus:border-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6E6E73]">
                  职责定位
                </label>
                <input
                  type="text"
                  value={newBotRole}
                  onChange={(e) => setNewBotRole(e.target.value)}
                  placeholder="例如：自动核查供应商条款与风险"
                  className="mt-1 w-full rounded-xl border border-black/[0.08] bg-[#FAFAFC] px-3 py-2 text-[13.5px] focus:border-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewBotModalOpen(false)}
                className="rounded-xl px-4 py-2 text-[13px] text-[#6E6E73] hover:bg-black/[0.04]"
              >
                取消
              </button>
              <button
                type="submit"
                className={`rounded-xl px-4 py-2 text-[13px] font-medium text-white ${botTheme.solidBg}`}
              >
                创建 Bot
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
