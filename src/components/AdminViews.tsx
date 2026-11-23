import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Gauge,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  UsersRound,
  X,
} from 'lucide-react';
import type { NavSectionId, OrgMember } from '../types/knowhub';
import { FEATURE_THEME } from '../data/featureTheme';
import {
  INITIAL_ORG_MEMBERS,
  ORG_DEPARTMENTS,
  TOKEN_USAGE_DATA,
  USER_PROFILE,
} from '../data/workspaceData';

interface AdminViewsProps {
  section: Extract<NavSectionId, 'usage' | 'organization' | 'settings'>;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const AVATAR_TONE: Record<OrgMember['color'], string> = {
  blue: 'bg-[#2563EB]',
  cyan: 'bg-[#0284C7]',
  violet: 'bg-[#6E56CF]',
  emerald: 'bg-[#0D9488]',
  amber: 'bg-[#D97706]',
};

export const AdminViews: React.FC<AdminViewsProps> = ({
  section,
  darkMode,
  onToggleDarkMode,
}) => {
  const [period, setPeriod] = useState<'all' | '30d' | '7d'>('all');
  const [expandedModel, setExpandedModel] = useState<string | null>(
    TOKEN_USAGE_DATA[0].model
  );

  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [members, setMembers] = useState<OrgMember[]>(INITIAL_ORG_MEMBERS);
  const [newMemberModal, setNewMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAccount, setNewMemberAccount] = useState('');
  const [newMemberDept, setNewMemberDept] = useState('dept-research');

  const [settingsTab, setSettingsTab] = useState<
    'account' | 'voice' | 'models' | 'logs'
  >('account');
  const [autoCite, setAutoCite] = useState(true);
  const [obsidianAutoLink, setObsidianAutoLink] = useState(true);
  const [ttsSpeed, setTtsSpeed] = useState('1.0x');

  const scaleFactor = period === 'all' ? 1 : period === '30d' ? 0.68 : 0.24;

  const totals = useMemo(() => {
    const input = Math.round(
      TOKEN_USAGE_DATA.reduce((acc, m) => acc + m.inputTokens, 0) * scaleFactor
    );
    const output = Math.round(
      TOKEN_USAGE_DATA.reduce((acc, m) => acc + m.outputTokens, 0) * scaleFactor
    );
    const calls = Math.round(
      TOKEN_USAGE_DATA.reduce((acc, m) => acc + m.calls, 0) * scaleFactor
    );
    return { total: input + output, input, output, calls };
  }, [scaleFactor]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    return members.filter((m) => {
      if (selectedDeptId !== 'all' && m.departmentId !== selectedDeptId) {
        return false;
      }
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.account.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [members, selectedDeptId, memberSearch]);

  /* 1. Token 消耗 — Amber Gold */
  if (section === 'usage') {
    const theme = FEATURE_THEME.usage;
    return (
      <div className="apple-workspace-canvas flex-1 overflow-y-auto px-4 py-7 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.06] pb-5 dark:border-white/[0.08]">
            <div>
              <div className={`flex items-center gap-2 text-[12.5px] font-medium ${theme.text}`}>
                <Gauge className="h-4 w-4" />
                <span>模型用量统计</span>
              </div>
              <h1 className="mt-1 font-display text-[24px] font-semibold tracking-tight text-[#1D1D1F] sm:text-[28px] dark:text-white">
                Token 消耗
              </h1>
              <p className="mt-1 text-[13.5px] text-[#6E6E73] dark:text-[#98989D]">
                按实际模型调用记录输入、输出与总用量
              </p>
            </div>

            <div className="flex rounded-xl bg-black/[0.045] p-0.5 dark:bg-white/[0.06]">
              {(
                [
                  { id: 'all', label: '全部期间' },
                  { id: '30d', label: '近 30 天' },
                  { id: '7d', label: '近 7 天' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                    period === p.id
                      ? `bg-white shadow-2xs dark:bg-[#2A2A32] ${theme.text}`
                      : 'text-[#6E6E73] dark:text-[#98989D]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: '总 Token', value: totals.total.toLocaleString(), tone: 'text-[#D97706] dark:text-[#FBBF24]' },
              { label: '输入 Token', value: totals.input.toLocaleString(), tone: 'text-[#2563EB] dark:text-[#60A5FA]' },
              { label: '输出 Token', value: totals.output.toLocaleString(), tone: 'text-[#0D9488] dark:text-[#34D399]' },
              { label: '模型调用', value: totals.calls.toLocaleString(), tone: 'text-[#6E56CF] dark:text-[#A78BFA]' },
            ].map((k) => (
              <div key={k.label} className="apple-glass-card rounded-2xl p-5">
                <div className="text-[12.5px] font-medium text-[#6E6E73] dark:text-[#98989D]">
                  {k.label}
                </div>
                <div className={`mt-2 font-mono text-[24px] font-semibold tracking-tight tabular-nums sm:text-[28px] ${k.tone}`}>
                  {k.value}
                </div>
              </div>
            ))}
          </div>

          <div className="apple-glass-card overflow-x-auto rounded-2xl">
            <div className="border-b border-black/[0.06] px-5 py-3.5 text-[14.5px] font-semibold text-[#1D1D1F] dark:border-white/[0.08] dark:text-white">
              模型用量明细
            </div>
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/[0.06] text-[12px] font-medium text-[#86868B] dark:border-white/[0.08]">
                  <th className="py-3 pl-5 pr-3">模型</th>
                  <th className="px-3 py-3 text-right">输入</th>
                  <th className="px-3 py-3 text-right">输出</th>
                  <th className="px-3 py-3 text-right">总量</th>
                  <th className="py-3 pl-3 pr-5 text-right">明细</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] text-[13.5px] dark:divide-white/[0.06]">
                {TOKEN_USAGE_DATA.map((row) => {
                  const inp = Math.round(row.inputTokens * scaleFactor);
                  const out = Math.round(row.outputTokens * scaleFactor);
                  const tot = inp + out;
                  const isExpanded = expandedModel === row.model;
                  const inputPct = tot > 0 ? Math.round((inp / tot) * 100) : 50;

                  return (
                    <React.Fragment key={row.model}>
                      <tr
                        onClick={() => setExpandedModel(isExpanded ? null : row.model)}
                        className="cursor-pointer hover:bg-white/60 dark:hover:bg-white/[0.02]"
                      >
                        <td className="py-3.5 pl-5 pr-3 font-mono font-medium text-[#1D1D1F] dark:text-white">
                          {row.model}
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono tabular-nums text-[#48484A] dark:text-neutral-300">
                          {inp.toLocaleString()}
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono tabular-nums text-[#48484A] dark:text-neutral-300">
                          {out.toLocaleString()}
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono font-semibold tabular-nums text-[#1D1D1F] dark:text-white">
                          {tot.toLocaleString()}
                        </td>
                        <td className={`py-3.5 pl-3 pr-5 text-right text-[12.5px] ${theme.text}`}>
                          <span className="inline-flex items-center gap-1">
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            <span>{isExpanded ? '收起' : '展开'}</span>
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-white/50 dark:bg-white/[0.02]">
                          <td colSpan={5} className="px-5 py-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-4 text-[12.5px]">
                              <div className="text-[#6E6E73]">
                                服务方：<strong className="text-[#1D1D1F] dark:text-white">{row.provider}</strong> · 累计调用{' '}
                                <span className="font-mono tabular-nums">
                                  {Math.round(row.calls * scaleFactor).toLocaleString()}
                                </span>{' '}
                                次
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[#D97706] tabular-nums dark:text-[#FBBF24]">
                                  输入 {inputPct}%
                                </span>
                                <div className="flex h-2 w-40 overflow-hidden rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E]">
                                  <div style={{ width: `${inputPct}%` }} className="bg-[#D97706]" />
                                  <div style={{ width: `${100 - inputPct}%` }} className="bg-[#0D9488]" />
                                </div>
                                <span className="text-[#0D9488] tabular-nums dark:text-[#34D399]">
                                  输出 {100 - inputPct}%
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* 2. 组织与权限 — Sky Sapphire */
  if (section === 'organization') {
    const theme = FEATURE_THEME.organization;
    return (
      <div className="apple-workspace-canvas flex-1 overflow-y-auto px-4 py-7 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.06] pb-5 dark:border-white/[0.08]">
            <div>
              <div className={`flex items-center gap-2 text-[12.5px] font-medium ${theme.text}`}>
                <UsersRound className="h-4 w-4" />
                <span>团队与空间授权</span>
              </div>
              <h1 className="mt-1 font-display text-[24px] font-semibold tracking-tight text-[#1D1D1F] sm:text-[28px] dark:text-white">
                组织结构与权限
              </h1>
              <p className="mt-1 text-[13.5px] text-[#6E6E73] dark:text-[#98989D]">
                统一管理成员账号、角色、启停及公司知识库和文件夹权限
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNewMemberModal(true)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-[13px] font-medium text-white ${theme.solidBg}`}
            >
              <Plus className="h-4 w-4" />
              <span>新建成员</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            <div className="apple-glass-card lg:col-span-3 rounded-2xl p-3 space-y-1">
              <div className="px-2.5 py-1 text-[11px] font-medium text-[#86868B]">
                组织部门 · 演示投研团队
              </div>
              {ORG_DEPARTMENTS.map((dept) => {
                const active = dept.id === selectedDeptId;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedDeptId(dept.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                      active
                        ? `bg-white shadow-2xs dark:bg-[#2A2A32] ${theme.text}`
                        : 'text-[#48484A] hover:bg-black/[0.04] dark:text-[#AEAEB2]'
                    }`}
                  >
                    <span className="truncate">{dept.name}</span>
                    <span className="font-mono text-[11.5px] tabular-nums text-[#86868B]">
                      {dept.memberCount}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-9 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex h-9 w-full items-center gap-2 rounded-xl border border-black/[0.08] bg-white/85 px-3 sm:w-72 dark:border-white/[0.1] dark:bg-[#1C1C22]">
                  <Search className="h-3.5 w-3.5 text-[#86868B]" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="搜索姓名或账号..."
                    className="w-full bg-transparent text-[13px] focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="apple-glass-card overflow-x-auto rounded-2xl">
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-black/[0.06] text-[12px] font-medium text-[#86868B] dark:border-white/[0.08]">
                      <th className="py-3 pl-5 pr-3">成员</th>
                      <th className="px-3 py-3">账号</th>
                      <th className="px-3 py-3">部门</th>
                      <th className="px-3 py-3">角色</th>
                      <th className="px-3 py-3">状态</th>
                      <th className="py-3 pl-3 pr-5 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.05] text-[13px] dark:divide-white/[0.06]">
                    {filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-white/60 dark:hover:bg-white/[0.02]">
                        <td className="py-3 pl-5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold text-white ${
                                AVATAR_TONE[m.color]
                              }`}
                            >
                              {m.name.slice(0, 1)}
                            </span>
                            <span className="font-medium text-[#1D1D1F] dark:text-white">
                              {m.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-[12.5px] text-[#6E6E73]">
                          {m.account}
                        </td>
                        <td className="px-3 py-3 text-[#48484A] dark:text-neutral-300">
                          {m.departmentName}
                        </td>
                        <td className="px-3 py-3 text-[#48484A] dark:text-neutral-300">
                          {m.role}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`text-[12.5px] font-medium ${
                              m.status === '有效'
                                ? 'text-[#0D9488] dark:text-[#34D399]'
                                : 'text-[#86868B]'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 pl-3 pr-5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setMembers((prev) =>
                                  prev.map((item) =>
                                    item.id === m.id
                                      ? {
                                          ...item,
                                          role:
                                            item.role === '管理员'
                                              ? '普通成员'
                                              : '管理员',
                                        }
                                      : item
                                  )
                                )
                              }
                              className="rounded-lg border border-black/[0.08] px-2.5 py-1 text-[12px] text-[#48484A] hover:bg-black/[0.04] dark:border-white/[0.1] dark:text-neutral-300"
                            >
                              切换角色
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setMembers((prev) =>
                                  prev.map((item) =>
                                    item.id === m.id
                                      ? {
                                          ...item,
                                          status:
                                            item.status === '有效'
                                              ? '已停用'
                                              : '有效',
                                        }
                                      : item
                                  )
                                )
                              }
                              className="rounded-lg border border-black/[0.08] px-2.5 py-1 text-[12px] text-[#48484A] hover:bg-black/[0.04] dark:border-white/[0.1] dark:text-neutral-300"
                            >
                              {m.status === '有效' ? '停用' : '启用'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {newMemberModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
              onClick={() => setNewMemberModal(false)}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newMemberName.trim() || !newMemberAccount.trim()) return;
                  const dept =
                    ORG_DEPARTMENTS.find((d) => d.id === newMemberDept) ??
                    ORG_DEPARTMENTS[1];
                  setMembers((prev) => [
                    ...prev,
                    {
                      id: `u-${Date.now()}`,
                      name: newMemberName.trim(),
                      account: newMemberAccount.trim(),
                      departmentId: dept.id,
                      departmentName: dept.name,
                      role: '普通成员',
                      status: '有效',
                      color: 'cyan',
                    },
                  ]);
                  setNewMemberName('');
                  setNewMemberAccount('');
                  setNewMemberModal(false);
                }}
                onClick={(e) => e.stopPropagation()}
                className="apple-glass-elevated w-full max-w-md rounded-2xl p-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[17px] font-semibold text-[#1D1D1F] dark:text-white">
                    新建团队成员
                  </h3>
                  <button
                    type="button"
                    onClick={() => setNewMemberModal(false)}
                    className="text-[#86868B]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[12px] font-medium text-[#6E6E73]">
                      姓名
                    </label>
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="例如：张若琳"
                      className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white/85 px-3 py-2 text-[13.5px] focus:outline-none dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[#6E6E73]">
                      登录账号
                    </label>
                    <input
                      type="text"
                      required
                      value={newMemberAccount}
                      onChange={(e) => setNewMemberAccount(e.target.value)}
                      placeholder="例如：demo.zhang"
                      className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white/85 px-3 py-2 text-[13.5px] focus:outline-none dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[#6E6E73]">
                      所属部门
                    </label>
                    <select
                      value={newMemberDept}
                      onChange={(e) => setNewMemberDept(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white/85 px-3 py-2 text-[13.5px] focus:outline-none dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
                    >
                      {ORG_DEPARTMENTS.filter((d) => d.id !== 'all').map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMemberModal(false)}
                    className="rounded-xl px-4 py-2 text-[13px] text-[#6E6E73]"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className={`rounded-xl px-4 py-2 text-[13px] font-medium text-white ${theme.solidBg}`}
                  >
                    确认添加
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* 3. 系统设置 — Graphite Slate */
  const settingsTheme = FEATURE_THEME.settings;
  return (
    <div className="apple-workspace-canvas flex-1 overflow-y-auto px-4 py-7 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="border-b border-black/[0.06] pb-5 dark:border-white/[0.08]">
          <div className={`flex items-center gap-2 text-[12.5px] font-medium ${settingsTheme.text}`}>
            <SlidersHorizontal className="h-4 w-4" />
            <span>工作台偏好</span>
          </div>
          <h1 className="mt-1 font-display text-[24px] font-semibold tracking-tight text-[#1D1D1F] sm:text-[28px] dark:text-white">
            系统设置
          </h1>
          <p className="mt-1 text-[13.5px] text-[#6E6E73] dark:text-[#98989D]">
            管理工作台账户、Obsidian 编辑偏好与推理策略
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-black/[0.06] pb-2 dark:border-white/[0.08]">
          {(
            [
              { id: 'account', label: '账户与偏好' },
              { id: 'voice', label: '翻译与朗读' },
              { id: 'models', label: '模型路由' },
              { id: 'logs', label: '运行与操作日志' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSettingsTab(t.id)}
              className={`rounded-xl px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                settingsTab === t.id
                  ? `${settingsTheme.softBg} text-[#1D1D1F] dark:text-white`
                  : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#98989D]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {settingsTab === 'account' && (
          <div className="apple-glass-card divide-y divide-black/[0.06] rounded-2xl dark:divide-white/[0.08]">
            {[
              { label: '姓名', value: USER_PROFILE.name },
              { label: '账号', value: USER_PROFILE.account },
              { label: '公司角色', value: '管理员' },
              { label: '账号状态', value: '已启用' },
              { label: '显示时间', value: `浏览器本地时区 (${USER_PROFILE.timezone})` },
            ].map((row) => (
              <div
                key={row.label}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 text-[13.5px]"
              >
                <span className="text-[#6E6E73] dark:text-[#98989D]">{row.label}</span>
                <span className="font-medium text-[#1D1D1F] dark:text-white">
                  {row.value}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between px-5 py-3.5 text-[13.5px]">
              <span className="text-[#6E6E73] dark:text-[#98989D]">外观主题</span>
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#1D1D1F] dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
              >
                {darkMode ? '当前：深色模式（点击切换）' : '当前：浅色模式（点击切换）'}
              </button>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5 text-[13.5px]">
              <span className="text-[#6E6E73] dark:text-[#98989D]">
                Obsidian 自动补全 [[双链]]
              </span>
              <input
                type="checkbox"
                checked={obsidianAutoLink}
                onChange={(e) => setObsidianAutoLink(e.target.checked)}
                className="h-4 w-4 accent-[#6E56CF]"
              />
            </div>
          </div>
        )}

        {settingsTab === 'voice' && (
          <div className="apple-glass-card space-y-4 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-semibold text-[#1D1D1F] dark:text-white">
                  问答默认引用原文片段
                </div>
                <div className="text-[12.5px] text-[#6E6E73]">
                  启用后所有推理结论均附加 [《文档名》] 可点击溯源标签
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoCite}
                onChange={(e) => setAutoCite(e.target.checked)}
                className="h-4 w-4 accent-[#0071E3]"
              />
            </div>

            <div className="flex items-center justify-between border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
              <div>
                <div className="text-[14px] font-semibold text-[#1D1D1F] dark:text-white">
                  朗读语速偏好
                </div>
                <div className="text-[12.5px] text-[#6E6E73]">
                  用于 Wiki 词条与简报语音播报
                </div>
              </div>
              <select
                value={ttsSpeed}
                onChange={(e) => setTtsSpeed(e.target.value)}
                className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-[13px] dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
              >
                <option value="0.9x">0.9x 舒缓</option>
                <option value="1.0x">1.0x 标准</option>
                <option value="1.25x">1.25x 高效</option>
              </select>
            </div>
          </div>
        )}

        {settingsTab === 'models' && (
          <div className="apple-glass-card space-y-3 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1D1D1F] dark:text-white">
              <Shield className="h-4 w-4 text-[#0D9488]" />
              <span>服务端统一推理路由</span>
            </div>
            <p className="text-[13px] leading-relaxed text-[#6E6E73] dark:text-[#98989D]">
              当前工作台由服务端安全代理统一调度 <code className="font-mono">gemini-4-hydrogen</code> 引擎处理文档问答、Obsidian 笔记整理、DS Bot 产物交付与知识本体抽取。
            </p>
          </div>
        )}

        {settingsTab === 'logs' && (
          <div className="apple-glass-card divide-y divide-black/[0.05] rounded-2xl text-[13px] dark:divide-white/[0.06]">
            {[
              { time: '2026-11-22 19:22:31', action: '知识对话', detail: '检索《星河门店周报提交规范与考核要求.md》并生成回答' },
              { time: '2026-11-22 18:40:12', action: 'DS Bot 产物', detail: '商业方案 Bot 交付《数字员工平台_财务采购解决方案.html》' },
              { time: '2026-11-22 16:40:05', action: 'Obsidian 笔记', detail: '更新《模拟验收：跟进笔记》双链与待办同步' },
            ].map((log, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div>
                  <span className="font-medium text-[#1D1D1F] dark:text-white">{log.action}</span>
                  <span className="mx-2 text-[#86868B]">·</span>
                  <span className="text-[#48484A] dark:text-neutral-300">{log.detail}</span>
                </div>
                <span className="font-mono text-[12px] tabular-nums text-[#86868B]">
                  {log.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
