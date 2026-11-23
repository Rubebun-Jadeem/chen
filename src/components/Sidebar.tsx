import React from 'react';
import { Moon, Network, Sun, X } from 'lucide-react';
import type { NavSectionId } from '../types/knowhub';
import { FEATURE_THEME } from '../data/featureTheme';
import { USER_PROFILE } from '../data/workspaceData';

interface SidebarProps {
  activeSection: NavSectionId;
  onSelectSection: (section: NavSectionId) => void;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  unreadTodosCount: number;
}

interface NavGroup {
  label: string;
  items: NavSectionId[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: '工作中心',
    items: ['chat', 'assistant'],
  },
  {
    label: '知识资产',
    items: ['knowledge', 'notes', 'wiki'],
  },
  {
    label: '洞察与图谱',
    items: ['hotspots', 'summary', 'clusters', 'ontology'],
  },
  {
    label: '系统管理',
    items: ['plugins', 'usage', 'organization', 'settings'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  collapsed,
  mobileOpen,
  onCloseMobile,
  darkMode,
  onToggleDarkMode,
  unreadTodosCount,
}) => {
  const renderSidebarBody = (isMobile: boolean) => (
    <div className="flex h-full w-[244px] flex-col border-r border-black/[0.06] bg-[#F4F5F9]/95 backdrop-blur-xl select-none dark:border-white/[0.08] dark:bg-[#131418]/95">
      {/* Brand Lockup */}
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#0071E3] via-[#6E56CF] to-[#0D9488] text-white shadow-sm">
            <Network className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="font-display text-[15.5px] font-semibold tracking-tight text-[#1D1D1F] whitespace-nowrap dark:text-white">
            Knowhub
          </span>
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="关闭导航菜单"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6E6E73] hover:bg-black/[0.05] dark:text-[#98989D] dark:hover:bg-white/[0.08]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-1.5 px-2.5 text-[11px] font-medium tracking-wide text-[#86868B] dark:text-[#98989D]">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((id) => {
                const theme = FEATURE_THEME[id];
                const Icon = theme.icon;
                const isActive = activeSection === id;
                const badge = id === 'notes' && unreadTodosCount > 0 ? unreadTodosCount : undefined;

                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSection(id);
                        if (isMobile) onCloseMobile();
                      }}
                      className={`group flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-[13.5px] font-medium transition-all duration-150 whitespace-nowrap ${
                        isActive
                          ? `bg-white/95 text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ${theme.ring} dark:bg-[#23242B] dark:text-white`
                          : 'text-[#48484A] hover:bg-white/60 hover:text-[#1D1D1F] dark:text-[#AEAEB2] dark:hover:bg-white/[0.06] dark:hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
                            isActive
                              ? theme.activeBadge
                              : `${theme.inactiveBadge} group-hover:scale-105`
                          }`}
                        >
                          <Icon strokeWidth={1.9} className="h-3.5 w-3.5" />
                        </span>
                        <span className={isActive ? 'font-semibold' : ''}>{theme.label}</span>
                      </span>
                      {badge !== undefined && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums ${theme.softBg} ${theme.text}`}
                        >
                          {badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom Profile & Appearance */}
      <div className="border-t border-black/[0.06] p-3 dark:border-white/[0.08]">
        <div className="flex items-center justify-between rounded-xl px-2 py-1.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={USER_PROFILE.avatarUrl}
              alt={USER_PROFILE.name}
              referrerPolicy="no-referrer"
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/15"
            />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-[#1D1D1F] dark:text-white">
                {USER_PROFILE.name}
              </div>
              <div className="truncate text-[11px] text-[#86868B] dark:text-[#98989D]">
                管理员
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? '切换至浅色外观' : '切换至深色外观'}
            aria-label="切换主题外观"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6E6E73] transition-colors hover:bg-black/[0.06] hover:text-[#1D1D1F] dark:text-[#98989D] dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-[#F59E0B]" strokeWidth={1.8} />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!collapsed && (
        <aside aria-label="主导航栏" className="hidden h-full shrink-0 lg:block">
          {renderSidebarBody(false)}
        </aside>
      )}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-black/30 backdrop-blur-xs"
          onClick={onCloseMobile}
        >
          <aside
            aria-label="移动导航栏"
            className="h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebarBody(true)}
          </aside>
        </div>
      )}
    </>
  );
};
