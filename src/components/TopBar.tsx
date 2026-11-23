import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Menu,
  PanelLeft,
  Plus,
  Search,
} from 'lucide-react';
import type { KnowledgeBase, NavSectionId, ProjectLibrary } from '../types/knowhub';
import { FEATURE_THEME } from '../data/featureTheme';

interface TopBarProps {
  activeSection: NavSectionId;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  knowledgeBases: KnowledgeBase[];
  selectedLibraryId: string;
  onSelectLibrary: (id: string) => void;
  activeProject?: ProjectLibrary;
  onOpenSpotlight: () => void;
  onPrimaryAction: () => void;
}

const KNOWLEDGE_SCOPED_SECTIONS: NavSectionId[] = [
  'chat',
  'assistant',
  'wiki',
  'hotspots',
  'summary',
  'clusters',
  'ontology',
];

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onToggleSidebar,
  onOpenMobileSidebar,
  knowledgeBases,
  selectedLibraryId,
  onSelectLibrary,
  activeProject,
  onOpenSpotlight,
  onPrimaryAction,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const theme = FEATURE_THEME[activeSection];
  const ActiveIcon = theme.icon;

  const currentKb =
    knowledgeBases.find((kb) => kb.id === selectedLibraryId) ?? knowledgeBases[0];
  const showKbSelector = KNOWLEDGE_SCOPED_SECTIONS.includes(activeSection);
  const showPrimaryAction = activeSection === 'chat';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="apple-glass-panel flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-5">
      {/* Zone 1: Sidebar Toggle + Feature Badge + Context Scope */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="打开菜单"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6E6E73] hover:bg-black/[0.05] lg:hidden dark:text-[#98989D] dark:hover:bg-white/[0.08]"
        >
          <Menu className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="切换侧边栏"
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6E6E73] transition-colors hover:bg-black/[0.05] hover:text-[#1D1D1F] lg:flex dark:text-[#98989D] dark:hover:bg-white/[0.08] dark:hover:text-white"
        >
          <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div className="flex min-w-0 items-center gap-2.5 text-[13.5px] whitespace-nowrap">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${theme.activeBadge}`}
          >
            <ActiveIcon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>

          <span className="font-display font-semibold text-[#1D1D1F] dark:text-white">
            {theme.label}
          </span>

          {showKbSelector && (
            <>
              <span
                className="hidden text-[#D1D1D6] sm:inline dark:text-[#3A3A3C]"
                aria-hidden="true"
              >
                /
              </span>

              <div className="relative hidden sm:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium text-[#48484A] transition-colors hover:bg-black/[0.04] hover:text-[#1D1D1F] dark:text-[#AEAEB2] dark:hover:bg-white/[0.06] dark:hover:text-white"
                >
                  <span className="max-w-[160px] truncate md:max-w-[240px]">
                    {currentKb.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#86868B]" strokeWidth={1.75} />
                </button>

                {menuOpen && (
                  <div className="apple-glass-elevated absolute left-0 top-full z-40 mt-1.5 w-80 rounded-2xl p-1.5">
                    <div className="px-3 py-1.5 text-[11px] font-medium text-[#86868B] dark:text-[#98989D]">
                      切换当前知识范围
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {knowledgeBases.map((kb) => {
                        const selected = kb.id === selectedLibraryId;
                        return (
                          <button
                            key={kb.id}
                            type="button"
                            onClick={() => {
                              onSelectLibrary(kb.id);
                              setMenuOpen(false);
                            }}
                            className={`flex w-full items-start justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
                              selected
                                ? `${theme.softBg} ${theme.text}`
                                : 'text-[#1D1D1F] hover:bg-black/[0.04] dark:text-white dark:hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate text-[13px] font-medium">{kb.name}</div>
                              <div className="mt-0.5 truncate text-[11.5px] text-[#86868B] tabular-nums dark:text-[#98989D]">
                                {kb.docCount} 份文档 · 更新于 {kb.updatedAt}
                              </div>
                            </div>
                            {selected && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'notes' && activeProject && (
            <>
              <span
                className="hidden text-[#D1D1D6] sm:inline dark:text-[#3A3A3C]"
                aria-hidden="true"
              >
                /
              </span>
              <span className={`hidden sm:inline text-[13px] font-medium truncate max-w-[200px] ${theme.text}`}>
                {activeProject.shortName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2 & 3: Spotlight Search + Contextual Primary Action (Only where non-duplicate) */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpenSpotlight}
          className="flex h-9 items-center justify-between rounded-xl border border-black/[0.08] bg-[#F5F5F7]/80 px-2.5 text-[13px] text-[#86868B] transition-all hover:border-black/[0.15] hover:bg-[#F5F5F7] sm:w-52 md:w-60 sm:px-3 dark:border-white/[0.1] dark:bg-[#1C1C1E] dark:text-[#98989D]"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            <span className="hidden truncate sm:inline">搜索文档或提问...</span>
          </span>
          <kbd className="hidden rounded bg-white px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-[#6E6E73] shadow-[0_1px_1px_rgba(0,0,0,0.06)] sm:inline dark:bg-[#2C2C2E] dark:text-[#AEAEB2]">
            ⌘K
          </kbd>
        </button>

        {showPrimaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium text-white transition-all active:scale-[0.98] whitespace-nowrap shrink-0 sm:px-3.5 ${theme.solidBg}`}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
            <span>新建对话</span>
          </button>
        )}
      </div>
    </header>
  );
};
