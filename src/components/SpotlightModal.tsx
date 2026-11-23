import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  FileText,
  MessagesSquare,
  NotebookPen,
  Search,
  X,
} from 'lucide-react';
import type { KnowledgeDoc, NavSectionId, WikiPage, WorkspaceNote } from '../types/knowhub';

interface SpotlightModalProps {
  open: boolean;
  onClose: () => void;
  docs: KnowledgeDoc[];
  notes: WorkspaceNote[];
  wikiPages: WikiPage[];
  onAskAiDirect: (query: string) => void;
  onNavigateItem: (section: NavSectionId, itemId?: string) => void;
}

export const SpotlightModal: React.FC<SpotlightModalProps> = ({
  open,
  onClose,
  docs,
  notes,
  wikiPages,
  onAskAiDirect,
  onNavigateItem,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
      } else if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchedDocs = docs
      .filter(
        (d) =>
          !q ||
          d.title.toLowerCase().includes(q) ||
          d.excerpt.toLowerCase().includes(q) ||
          d.libraryName.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedNotes = notes
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedWiki = wikiPages
      .filter(
        (w) =>
          !q ||
          w.title.toLowerCase().includes(q) ||
          w.content.toLowerCase().includes(q)
      )
      .slice(0, 3);

    return { matchedDocs, matchedNotes, matchedWiki };
  }, [query, docs, notes, wikiPages]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 px-4 pt-[12vh] backdrop-blur-sm dark:bg-black/55"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-black/[0.08] bg-white/95 shadow-[0_24px_64px_rgba(0,0,0,0.18)] backdrop-blur-2xl dark:border-white/[0.12] dark:bg-[#1C1C1E]/95 dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3.5 dark:border-white/[0.08]">
          <Search className="h-5 w-5 shrink-0 text-[#0071E3] dark:text-[#2997FF]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                onAskAiDirect(query.trim());
                onClose();
              }
            }}
            placeholder="搜索知识库文档、Wiki、笔记，或直接输入问题发起检索..."
            className="flex-1 bg-transparent text-[15px] text-[#1D1D1F] placeholder-[#86868B] focus:outline-none dark:text-white dark:placeholder-[#8E8E93]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭搜索"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Direct AI Action Row */}
        {query.trim() && (
          <div className="border-b border-black/[0.06] p-2 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                onAskAiDirect(query.trim());
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-xl bg-[#0071E3]/[0.08] px-3.5 py-2.5 text-left transition-colors hover:bg-[#0071E3]/[0.14] dark:bg-[#2997FF]/15 dark:hover:bg-[#2997FF]/22"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <MessagesSquare className="h-4 w-4 shrink-0 text-[#0071E3] dark:text-[#2997FF]" />
                <span className="truncate text-[13.5px] font-medium text-[#1D1D1F] dark:text-white">
                  直接发起知识对话查询：“{query.trim()}”
                </span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#0071E3] dark:text-[#2997FF]" />
            </button>
          </div>
        )}

        {/* Search Results */}
        <div className="max-h-[400px] overflow-y-auto p-3 space-y-4">
          {results.matchedDocs.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-medium text-[#86868B]">
                知识库文档
              </div>
              <div className="space-y-0.5">
                {results.matchedDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      onNavigateItem('knowledge', doc.id);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-[#86868B]" />
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-medium text-[#1D1D1F] dark:text-white">
                          {doc.title}
                        </div>
                        <div className="truncate text-[11.5px] text-[#86868B]">
                          {doc.libraryName} · {doc.sizeLabel} · {doc.updatedAt}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.matchedWiki.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-medium text-[#86868B]">
                Wiki 词条
              </div>
              <div className="space-y-0.5">
                {results.matchedWiki.map((wiki) => (
                  <button
                    key={wiki.id}
                    type="button"
                    onClick={() => {
                      onNavigateItem('wiki', wiki.id);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <BookOpen className="h-4 w-4 shrink-0 text-[#86868B]" />
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-medium text-[#1D1D1F] dark:text-white">
                          {wiki.title}
                        </div>
                        <div className="truncate text-[11.5px] text-[#86868B]">
                          {wiki.category} · {wiki.readTime}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.matchedNotes.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-medium text-[#86868B]">
                笔记
              </div>
              <div className="space-y-0.5">
                {results.matchedNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => {
                      onNavigateItem('notes', note.id);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <NotebookPen className="h-4 w-4 shrink-0 text-[#86868B]" />
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-medium text-[#1D1D1F] dark:text-white">
                          {note.title}
                        </div>
                        <div className="truncate text-[11.5px] text-[#86868B]">
                          {note.libraryName} · {note.updatedAt}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.matchedDocs.length === 0 &&
            results.matchedNotes.length === 0 &&
            results.matchedWiki.length === 0 && (
              <div className="py-8 text-center text-[13px] text-[#86868B]">
                未找到匹配的本地记录，按 Enter 直接发起对话查询。
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
