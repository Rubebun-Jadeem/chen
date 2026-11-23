import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Columns2,
  Columns3,
  Edit3,
  Eye,
  FileText,
  Folder,
  FolderOpen,
  Hash,
  Link2,
  ListTodo,
  Maximize2,
  MessageSquare,
  Minimize2,
  Network,
  Plus,
  Quote,
  Search,
  Trash2,
  Wand2,
} from 'lucide-react';
import type {
  ProjectLibrary,
  TodoStatus,
  WorkspaceNote,
  WorkspaceTodo,
} from '../types/knowhub';
import { MarkdownRenderer } from './MarkdownRenderer';

interface NotesAndTodosViewProps {
  projects: ProjectLibrary[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  notes: WorkspaceNote[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
  onCreateNote: (title?: string, content?: string, projectId?: string) => void;
  onUpdateNote: (id: string, patch: Partial<WorkspaceNote>) => void;
  onDeleteNote: (id: string) => void;
  todos: WorkspaceTodo[];
  onToggleTodo: (id: string) => void;
  onUpdateTodoStatus: (id: string, status: TodoStatus) => void;
  onAddTodo: (params: {
    title: string;
    priority: 'high' | 'medium' | 'low';
    status?: TodoStatus;
    dueDate: string;
    dueTime: string;
    projectId: string;
    sourceNote?: string;
  }) => void;
  onDeleteTodo: (id: string) => void;
  onAskAiFromNote: (prompt: string) => void;
}

const TODAY_DATE = '2026-11-22';

function formatDueLabel(dueDate: string, dueTime: string): string {
  if (!dueDate) return dueTime || '待定';
  if (dueDate === TODAY_DATE) return `今天 ${dueTime || '18:00'}`;
  if (dueDate === '2026-11-23') return `明天 ${dueTime || '10:00'}`;
  return `${dueDate} ${dueTime || '18:00'}`;
}

function getTimeBucket(todo: WorkspaceTodo): 'today' | 'upcoming' | 'later' | 'done' {
  if (todo.completed) return 'done';
  if (!todo.dueDate || todo.dueDate <= TODAY_DATE) return 'today';
  if (todo.dueDate <= '2026-11-29') return 'upcoming';
  return 'later';
}

function extractWikiLinks(content: string): string[] {
  const matches = content.match(/\[\[([^\]]+)\]\]/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(2, -2))));
}

function extractHeadings(content: string): { level: number; text: string }[] {
  return content
    .split('\n')
    .filter((l) => /^#{1,3}\s/.test(l.trim()))
    .map((l) => {
      const m = l.trim().match(/^(#{1,3})\s+(.+)$/);
      return {
        level: m ? m[1].length : 1,
        text: m ? m[2] : l,
      };
    });
}

function getNoteStats(content: string): { chars: number; lines: number; readMins: number } {
  const clean = content.replace(/\s+/g, '');
  const chars = clean.length;
  const lines = content ? content.split('\n').length : 0;
  const readMins = Math.max(1, Math.ceil(chars / 380));
  return { chars, lines, readMins };
}

const PROJECT_ACCENT_DOT: Record<ProjectLibrary['accentColor'], string> = {
  blue: 'text-[#0071E3] dark:text-[#60A5FA]',
  violet: 'text-[#6E56CF] dark:text-[#A78BFA]',
  emerald: 'text-[#0D9488] dark:text-[#34D399]',
  amber: 'text-[#D97706] dark:text-[#FBBF24]',
  cyan: 'text-[#0284C7] dark:text-[#38BDF8]',
};

const PROJECT_TAG_STYLE: Record<
  ProjectLibrary['accentColor'],
  { pill: string; dot: string; strip: string }
> = {
  blue: {
    pill: 'bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#2997FF]/16 dark:text-[#60A5FA]',
    dot: 'bg-[#0071E3] dark:bg-[#60A5FA]',
    strip: 'border-l-[#0071E3] dark:border-l-[#60A5FA]',
  },
  violet: {
    pill: 'bg-[#6E56CF]/10 text-[#6E56CF] dark:bg-[#8E75FF]/16 dark:text-[#A78BFA]',
    dot: 'bg-[#6E56CF] dark:bg-[#A78BFA]',
    strip: 'border-l-[#6E56CF] dark:border-l-[#A78BFA]',
  },
  emerald: {
    pill: 'bg-[#0D9488]/10 text-[#0D9488] dark:bg-[#10B981]/16 dark:text-[#34D399]',
    dot: 'bg-[#0D9488] dark:bg-[#34D399]',
    strip: 'border-l-[#0D9488] dark:border-l-[#34D399]',
  },
  amber: {
    pill: 'bg-[#D97706]/10 text-[#D97706] dark:bg-[#F59E0B]/16 dark:text-[#FBBF24]',
    dot: 'bg-[#D97706] dark:bg-[#FBBF24]',
    strip: 'border-l-[#D97706] dark:border-l-[#FBBF24]',
  },
  cyan: {
    pill: 'bg-[#0284C7]/10 text-[#0284C7] dark:bg-[#38BDF8]/16 dark:text-[#38BDF8]',
    dot: 'bg-[#0284C7] dark:bg-[#38BDF8]',
    strip: 'border-l-[#0284C7] dark:border-l-[#38BDF8]',
  },
};

const KANBAN_COLUMNS: {
  status: TodoStatus;
  label: string;
  dotClass: string;
  headerText: string;
  dropRing: string;
}[] = [
  {
    status: 'waiting',
    label: '等待中',
    dotClass: 'bg-[#D97706] dark:bg-[#FBBF24]',
    headerText: 'text-[#B45309] dark:text-[#FBBF24]',
    dropRing: 'ring-2 ring-[#D97706]/45 dark:ring-[#FBBF24]/45',
  },
  {
    status: 'in_progress',
    label: '进行中',
    dotClass: 'bg-[#0071E3] dark:bg-[#60A5FA]',
    headerText: 'text-[#0071E3] dark:text-[#60A5FA]',
    dropRing: 'ring-2 ring-[#0071E3]/45 dark:ring-[#60A5FA]/45',
  },
  {
    status: 'completed',
    label: '已完成',
    dotClass: 'bg-[#0D9488] dark:bg-[#34D399]',
    headerText: 'text-[#0D9488] dark:text-[#34D399]',
    dropRing: 'ring-2 ring-[#0D9488]/45 dark:ring-[#34D399]/45',
  },
];

export const NotesAndTodosView: React.FC<NotesAndTodosViewProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  todos,
  onToggleTodo,
  onUpdateTodoStatus,
  onAddTodo,
  onDeleteTodo,
  onAskAiFromNote,
}) => {
  const [vaultTab, setVaultTab] = useState<'vault' | 'tasks'>('vault');
  const [editorMode, setEditorMode] = useState<'split' | 'edit' | 'read'>('split');
  const [focusMode, setFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    门店运营: true,
    功能验收: true,
    财务核算: true,
    人力薪酬: true,
  });
  const [inspectorOpen, setInspectorOpen] = useState(true);

  // Todo scheduling & grouping state
  const [todoFilter, setTodoFilter] = useState<'all' | 'active' | 'done'>('all');
  const [todoGroupMode, setTodoGroupMode] = useState<'kanban' | 'time' | 'project'>('kanban');
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoDate, setNewTodoDate] = useState(TODAY_DATE);
  const [newTodoTime, setNewTodoTime] = useState('18:00');
  const [newTodoPriority, setNewTodoPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTodoStatus, setNewTodoStatus] = useState<TodoStatus>('in_progress');
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TodoStatus | null>(null);
  const todoInputRef = useRef<HTMLInputElement>(null);

  const concreteProjects = useMemo(
    () => projects.filter((p) => p.id !== 'proj-all'),
    [projects]
  );

  const [newTodoProjectId, setNewTodoProjectId] = useState<string>(
    selectedProjectId !== 'proj-all'
      ? selectedProjectId
      : concreteProjects[0]?.id ?? 'proj-xinghe'
  );

  useEffect(() => {
    if (selectedProjectId !== 'proj-all') {
      setNewTodoProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const [aiLoadingAction, setAiLoadingAction] = useState<string | null>(null);
  const [aiStatusBanner, setAiStatusBanner] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const activeProject =
    projects.find((p) => p.id === selectedProjectId) ?? projects[0];

  const scopedNotes = useMemo(() => {
    if (selectedProjectId === 'proj-all') return notes;
    return notes.filter((n) => n.projectId === selectedProjectId);
  }, [notes, selectedProjectId]);

  const activeNote =
    scopedNotes.find((n) => n.id === activeNoteId) ?? scopedNotes[0] ?? null;

  const noteStats = useMemo(
    () => (activeNote ? getNoteStats(activeNote.content) : { chars: 0, lines: 0, readMins: 1 }),
    [activeNote]
  );

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of scopedNotes) {
      for (const t of n.tags) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries());
  }, [scopedNotes]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedNotes.filter((n) => {
      if (activeTagFilter && !n.tags.includes(activeTagFilter)) return false;
      if (
        q &&
        !n.title.toLowerCase().includes(q) &&
        !n.content.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [scopedNotes, searchQuery, activeTagFilter]);

  const folders = useMemo(() => {
    const map = new Map<string, WorkspaceNote[]>();
    for (const n of filteredNotes) {
      const folderName = n.folder || '未分类';
      if (!map.has(folderName)) map.set(folderName, []);
      map.get(folderName)!.push(n);
    }
    return Array.from(map.entries());
  }, [filteredNotes]);

  const outgoingLinks = useMemo(
    () => (activeNote ? extractWikiLinks(activeNote.content) : []),
    [activeNote]
  );

  const backlinks = useMemo(() => {
    if (!activeNote) return [];
    return notes.filter(
      (n) =>
        n.id !== activeNote.id &&
        n.content.includes(`[[${activeNote.title}]]`)
    );
  }, [notes, activeNote]);

  const headings = useMemo(
    () => (activeNote ? extractHeadings(activeNote.content) : []),
    [activeNote]
  );

  const scopedTodos = useMemo(() => {
    if (selectedProjectId === 'proj-all') return todos;
    return todos.filter((t) => t.projectId === selectedProjectId);
  }, [todos, selectedProjectId]);

  const filteredTodos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedTodos
      .filter((t) => {
        if (todoFilter === 'active' && t.completed) return false;
        if (todoFilter === 'done' && !t.completed) return false;
        if (
          q &&
          !t.title.toLowerCase().includes(q) &&
          !t.projectName.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const aKey = `${a.dueDate || '9999-12-31'} ${a.dueTime || '23:59'}`;
        const bKey = `${b.dueDate || '9999-12-31'} ${b.dueTime || '23:59'}`;
        return aKey.localeCompare(bKey);
      });
  }, [scopedTodos, todoFilter, searchQuery]);

  const groupedTodosByTime = useMemo(() => {
    const groups: {
      key: 'today' | 'upcoming' | 'later' | 'done';
      label: string;
      items: WorkspaceTodo[];
    }[] = [
      { key: 'today', label: `今日排期 (${TODAY_DATE})`, items: [] },
      { key: 'upcoming', label: '近期 7 天日程', items: [] },
      { key: 'later', label: '后续规划', items: [] },
      { key: 'done', label: '已完成归档', items: [] },
    ];
    for (const todo of filteredTodos) {
      const bucket = getTimeBucket(todo);
      const target = groups.find((g) => g.key === bucket);
      if (target) target.items.push(todo);
    }
    return groups.filter((g) => g.items.length > 0);
  }, [filteredTodos]);

  const groupedTodosByProject = useMemo(() => {
    const map = new Map<string, { projectName: string; items: WorkspaceTodo[] }>();
    for (const todo of filteredTodos) {
      const key = todo.projectId || 'proj-qa';
      if (!map.has(key)) {
        map.set(key, { projectName: todo.projectName, items: [] });
      }
      map.get(key)!.items.push(todo);
    }
    return Array.from(map.entries());
  }, [filteredTodos]);

  const handleJumpByWikiTitle = (title: string) => {
    const target = notes.find(
      (n) =>
        n.title === title ||
        n.title.includes(title) ||
        title.includes(n.title)
    );
    if (target) {
      if (selectedProjectId !== 'proj-all' && target.projectId !== selectedProjectId) {
        onSelectProject('proj-all');
      }
      onSelectNote(target.id);
      setVaultTab('vault');
    }
  };

  const insertSnippet = (snippet: string) => {
    if (!activeNote) return;
    onUpdateNote(activeNote.id, {
      content: `${activeNote.content}${activeNote.content.endsWith('\n') ? '' : '\n'}${snippet}`,
      updatedAt: '刚刚',
    });
  };

  const runNoteAi = async (action: 'summarize' | 'polish' | 'extract_todos') => {
    if (!activeNote || aiLoadingAction) return;
    setAiLoadingAction(action);
    setAiError(null);
    setAiStatusBanner(null);

    try {
      const response = await fetch('/api/ai/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          title: activeNote.title,
          content: activeNote.content,
          knowledgeContext: activeNote.projectName,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '生成处理失败');

      if (action === 'summarize') {
        onUpdateNote(activeNote.id, { aiSummary: data.result });
        setAiStatusBanner('已生成文档摘要卡片');
      } else if (action === 'polish') {
        onUpdateNote(activeNote.id, {
          content: data.result,
          updatedAt: '刚刚',
        });
        setAiStatusBanner('已保留 [[双向链接]] 并完成文本润色');
      } else if (action === 'extract_todos') {
        const extracted = Array.isArray(data.todos) ? data.todos : [];
        for (const item of extracted) {
          if (item.title) {
            onAddTodo({
              title: item.title,
              priority:
                item.priority === 'high' || item.priority === 'low'
                  ? item.priority
                  : 'medium',
              status: 'in_progress',
              dueDate: TODAY_DATE,
              dueTime: '18:00',
              projectId: activeNote.projectId,
              sourceNote: activeNote.title,
            });
          }
        }
        setAiStatusBanner(`已同步抽取 ${extracted.length} 条待办至「${activeNote.projectName}」`);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '生成处理失败');
    } finally {
      setAiLoadingAction(null);
    }
  };

  const handleSubmitTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    onAddTodo({
      title: newTodoText.trim(),
      priority: newTodoPriority,
      status: newTodoStatus,
      dueDate: newTodoDate,
      dueTime: newTodoTime,
      projectId: newTodoProjectId,
    });
    setNewTodoText('');
  };

  const getProjectColorStyle = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    return PROJECT_TAG_STYLE[proj?.accentColor ?? 'blue'];
  };

  const getProjectShortName = (todo: WorkspaceTodo) => {
    const proj = projects.find((p) => p.id === todo.projectId);
    return proj?.shortName || todo.projectName;
  };

  const renderTodoRow = (todo: WorkspaceTodo) => {
    const projStyle = getProjectColorStyle(todo.projectId);
    return (
      <div
        key={todo.id}
        className="group flex items-start justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.03]"
      >
        <div className="flex min-w-0 items-start gap-3.5">
          <button
            type="button"
            onClick={() => onToggleTodo(todo.id)}
            aria-label={todo.completed ? '标记为未完成' : '标记为已完成'}
            className="mt-0.5 shrink-0 text-[#86868B] transition-colors hover:text-[#0D9488]"
          >
            {todo.completed ? (
              <CheckCircle2 className="h-5 w-5 text-[#0D9488] dark:text-[#34D399]" />
            ) : (
              <Circle className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>

          <div className="min-w-0">
            <div
              className={`text-[14px] font-medium leading-snug ${
                todo.completed
                  ? 'line-through text-[#86868B]'
                  : 'text-[#1D1D1F] dark:text-white'
              }`}
            >
              {todo.title}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#6E6E73] tabular-nums dark:text-[#98989D]">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${projStyle.pill}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${projStyle.dot}`} />
                {getProjectShortName(todo)}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[#0071E3] dark:text-[#60A5FA]">
                <Clock className="h-3 w-3" />
                {formatDueLabel(todo.dueDate, todo.dueTime)}
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  todo.priority === 'high' && !todo.completed
                    ? 'font-semibold text-[#D97706] dark:text-[#FBBF24]'
                    : ''
                }
              >
                {todo.priority === 'high'
                  ? '高优先级'
                  : todo.priority === 'medium'
                    ? '常规'
                    : '低优先级'}
              </span>
              {todo.sourceNote && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => handleJumpByWikiTitle(todo.sourceNote!)}
                    className="text-[#6E56CF] hover:underline dark:text-[#A78BFA]"
                  >
                    来源：{todo.sourceNote}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDeleteTodo(todo.id)}
          aria-label="删除待办"
          className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-[#86868B] transition-opacity hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="apple-workspace-canvas flex h-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      {/* Left: Obsidian Vault File Explorer & Project Library Pane */}
      {!focusMode && (
        <aside className="apple-glass-panel flex w-full shrink-0 flex-col border-b md:w-[288px] md:border-r md:border-b-0">
          {/* Project Library Selector */}
          <div className="border-b border-black/[0.06] p-3.5 dark:border-white/[0.08]">
            <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-[#86868B] dark:text-[#98989D]">
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#60A5FA]" />
                负责项目库
              </span>
              <span className="font-mono tabular-nums">
                {concreteProjects.length} 个项目
              </span>
            </div>

            <div className="relative">
              <select
                aria-label="选择负责项目库"
                value={selectedProjectId}
                onChange={(e) => onSelectProject(e.target.value)}
                className="w-full appearance-none rounded-xl border border-black/[0.08] bg-white/85 py-2 pl-3 pr-8 text-[13px] font-semibold text-[#1D1D1F] shadow-2xs outline-none transition-colors focus:border-[#0071E3] dark:border-white/[0.1] dark:bg-[#1C1C1E]/90 dark:text-white dark:focus:border-[#2997FF]"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868B]" />
            </div>

            <div className="mt-2 truncate text-[11.5px] text-[#6E6E73] tabular-nums dark:text-[#98989D]">
              负责人：{activeProject.owner} · {scopedNotes.length} 篇笔记 ·{' '}
              {scopedTodos.filter((t) => !t.completed).length} 项待办
            </div>
          </div>

          {/* Obsidian Vault / Tasks Segmented Control & Search */}
          <div className="space-y-2.5 border-b border-black/[0.06] p-3 dark:border-white/[0.08]">
            <div className="grid grid-cols-2 rounded-xl bg-black/[0.05] p-0.5 dark:bg-white/[0.07]">
              <button
                type="button"
                onClick={() => setVaultTab('vault')}
                className={`rounded-[10px] py-1.5 text-[12.5px] font-semibold transition-all whitespace-nowrap ${
                  vaultTab === 'vault'
                    ? 'bg-white text-[#6E56CF] shadow-xs dark:bg-[#2C2C32] dark:text-[#A78BFA]'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#98989D]'
                }`}
              >
                笔记库 ({scopedNotes.length})
              </button>
              <button
                type="button"
                onClick={() => setVaultTab('tasks')}
                className={`rounded-[10px] py-1.5 text-[12.5px] font-semibold transition-all whitespace-nowrap ${
                  vaultTab === 'tasks'
                    ? 'bg-white text-[#0D9488] shadow-xs dark:bg-[#2C2C32] dark:text-[#34D399]'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#98989D]'
                }`}
              >
                待办 ({scopedTodos.filter((t) => !t.completed).length})
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-black/[0.07] bg-white/80 px-2.5 py-1.5 dark:border-white/[0.09] dark:bg-[#1C1C1E]/80">
                <Search className="h-3.5 w-3.5 shrink-0 text-[#86868B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={vaultTab === 'vault' ? '检索 Vault 笔记...' : '检索时间待办...'}
                  className="w-full bg-transparent text-[12.5px] text-[#1D1D1F] placeholder-[#86868B] focus:outline-none dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setVaultTab('vault');
                  onCreateNote(undefined, undefined, selectedProjectId);
                }}
                title="新建 Obsidian 笔记"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6E56CF] text-white transition-colors hover:bg-[#5B43B8] dark:bg-[#8E75FF]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Obsidian Folder Tree & Glass Note Cards */}
          <div className="max-h-[240px] flex-1 overflow-y-auto p-3 space-y-4 md:max-h-none">
            {vaultTab === 'vault' ? (
              <>
                <div className="space-y-2">
                  {folders.map(([folderName, items]) => {
                    const isOpen = openFolders[folderName] ?? true;
                    return (
                      <div key={folderName}>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFolders((prev) => ({
                              ...prev,
                              [folderName]: !isOpen,
                            }))
                          }
                          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-[#48484A] transition-colors hover:bg-black/[0.04] dark:text-[#AEAEB2] dark:hover:bg-white/[0.05]"
                        >
                          {isOpen ? (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#86868B]" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#86868B]" />
                          )}
                          {isOpen ? (
                            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#6E56CF] dark:text-[#A78BFA]" />
                          ) : (
                            <Folder className="h-3.5 w-3.5 shrink-0 text-[#86868B]" />
                          )}
                          <span className="truncate">{folderName}</span>
                          <span className="ml-auto font-mono text-[11px] tabular-nums text-[#86868B]">
                            {items.length}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="ml-3 mt-1 space-y-1.5 border-l border-black/[0.07] pl-2.5 dark:border-white/[0.09]">
                            {items.map((note) => {
                              const active = note.id === activeNote?.id;
                              const stats = getNoteStats(note.content);
                              return (
                                <button
                                  key={note.id}
                                  type="button"
                                  onClick={() => {
                                    onSelectNote(note.id);
                                    setAiStatusBanner(null);
                                    setAiError(null);
                                  }}
                                  className={`group w-full rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                                    active
                                      ? 'apple-glass-card ring-1 ring-[#6E56CF]/30 text-[#1D1D1F] dark:ring-[#8E75FF]/40 dark:text-white'
                                      : 'border border-transparent text-[#48484A] hover:bg-white/60 hover:border-black/[0.05] dark:text-[#AEAEB2] dark:hover:bg-white/[0.04] dark:hover:border-white/[0.07]'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <FileText
                                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                                        active
                                          ? 'text-[#6E56CF] dark:text-[#A78BFA]'
                                          : 'text-[#86868B] group-hover:text-[#6E56CF]'
                                      }`}
                                      strokeWidth={1.8}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-[13px] font-medium leading-snug">
                                        {note.title || '无标题.md'}
                                      </div>
                                      <div className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-[#86868B] tabular-nums">
                                        <span className="truncate">{note.projectName}</span>
                                        <span aria-hidden="true">·</span>
                                        <span>{stats.chars} 字</span>
                                        <span aria-hidden="true">·</span>
                                        <span>{note.updatedAt}</span>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Obsidian Tags Filter */}
                <div className="border-t border-black/[0.06] pt-3.5 dark:border-white/[0.08]">
                  <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-medium text-[#86868B]">
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      标签索引
                    </span>
                    {activeTagFilter && (
                      <button
                        type="button"
                        onClick={() => setActiveTagFilter(null)}
                        className="text-[#6E56CF] hover:underline"
                      >
                        重置
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map(([tag, count]) => {
                      const selected = activeTagFilter === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setActiveTagFilter(selected ? null : tag)
                          }
                          className={`rounded-lg px-2 py-1 text-[11.5px] font-medium transition-colors ${
                            selected
                              ? 'bg-[#6E56CF] text-white dark:bg-[#8E75FF]'
                              : 'bg-white/75 text-[#6E56CF] ring-1 ring-black/[0.06] hover:bg-white dark:bg-white/[0.05] dark:text-[#A78BFA] dark:ring-white/[0.08]'
                          }`}
                        >
                          {tag} <span className="opacity-70 tabular-nums">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {/* Todo Status Filter */}
                <div className="space-y-1">
                  {(
                    [
                      { id: 'all', label: '全部任务', count: scopedTodos.length },
                      {
                        id: 'active',
                        label: '待完成',
                        count: scopedTodos.filter((t) => !t.completed).length,
                      },
                      {
                        id: 'done',
                        label: '已完成',
                        count: scopedTodos.filter((t) => t.completed).length,
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTodoFilter(f.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
                        todoFilter === f.id
                          ? 'bg-white/95 text-[#1D1D1F] shadow-xs dark:bg-[#282830] dark:text-white'
                          : 'text-[#6E6E73] hover:bg-black/[0.04] dark:text-[#AEAEB2]'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className="font-mono text-[12px] tabular-nums text-[#86868B]">
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Quick Project Library Breakdown */}
                <div className="border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
                  <div className="mb-2 px-1 text-[11px] font-medium text-[#86868B]">
                    按项目库筛选
                  </div>
                  <div className="space-y-1">
                    {projects.map((proj) => {
                      const active = proj.id === selectedProjectId;
                      const openCount =
                        proj.id === 'proj-all'
                          ? todos.filter((t) => !t.completed).length
                          : todos.filter((t) => t.projectId === proj.id && !t.completed)
                              .length;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => onSelectProject(proj.id)}
                          className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[12.5px] transition-colors ${
                            active
                              ? 'bg-white/95 font-semibold text-[#1D1D1F] shadow-xs dark:bg-[#282830] dark:text-white'
                              : 'text-[#6E6E73] hover:bg-black/[0.04] dark:text-[#AEAEB2] dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className={`truncate ${active ? PROJECT_ACCENT_DOT[proj.accentColor] : ''}`}>
                            {proj.shortName}
                          </span>
                          <span className="ml-2 font-mono text-[11px] tabular-nums text-[#86868B]">
                            {openCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Center: Obsidian Split-Pane Glassmorphic Workspace OR Time-Scheduled Project Todos Board */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden p-3.5 sm:p-5 gap-3.5">
        {vaultTab === 'vault' ? (
          activeNote ? (
            <>
              {/* Top Obsidian Ribbon & Document Header Card */}
              <div className="apple-glass-card rounded-2xl px-4 py-3.5 sm:px-6">
                {/* Action Ribbon Row */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-black/[0.05] dark:border-white/[0.07]">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Mode Switcher */}
                    <div className="flex rounded-xl bg-black/[0.05] p-0.5 dark:bg-white/[0.07]">
                      {(
                        [
                          { id: 'edit', label: '源码', icon: Edit3 },
                          { id: 'split', label: '左右分栏', icon: Columns2 },
                          { id: 'read', label: '阅读', icon: Eye },
                        ] as const
                      ).map((m) => {
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setEditorMode(m.id)}
                            className={`inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 text-[12px] font-medium transition-colors whitespace-nowrap ${
                              editorMode === m.id
                                ? 'bg-white text-[#6E56CF] shadow-2xs dark:bg-[#2C2C32] dark:text-[#A78BFA]'
                                : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#98989D]'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Obsidian Syntax Inserts */}
                    <button
                      type="button"
                      onClick={() => insertSnippet('[[关联笔记标题]]')}
                      className="hidden sm:inline-flex h-7 items-center gap-1 rounded-lg border border-black/[0.07] bg-white/60 px-2.5 text-[11.5px] font-medium text-[#6E56CF] transition-colors hover:bg-[#6E56CF]/10 dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-[#A78BFA]"
                    >
                      <Link2 className="h-3 w-3" />
                      <span>双链</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippet('- [ ] 新增待办跟进项')}
                      className="hidden sm:inline-flex h-7 items-center gap-1 rounded-lg border border-black/[0.07] bg-white/60 px-2.5 text-[11.5px] font-medium text-[#0D9488] transition-colors hover:bg-[#0D9488]/10 dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-[#34D399]"
                    >
                      <ListTodo className="h-3 w-3" />
                      <span>任务</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippet('> [!info] 核心提示\n> 在此记录关键结论')}
                      className="hidden md:inline-flex h-7 items-center gap-1 rounded-lg border border-black/[0.07] bg-white/60 px-2.5 text-[11.5px] font-medium text-[#0071E3] transition-colors hover:bg-[#0071E3]/10 dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-[#60A5FA]"
                    >
                      <Quote className="h-3 w-3" />
                      <span>标注</span>
                    </button>
                  </div>

                  {/* Note Actions & Focus Controls */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!!aiLoadingAction}
                      onClick={() => void runNoteAi('summarize')}
                      className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#6E56CF]/10 px-2.5 text-[12px] font-medium text-[#6E56CF] hover:bg-[#6E56CF]/18 disabled:opacity-50 dark:bg-[#8E75FF]/15 dark:text-[#A78BFA]"
                    >
                      <AlignLeft className="h-3 w-3" />
                      <span>{aiLoadingAction === 'summarize' ? '摘要中...' : '生成摘要'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={!!aiLoadingAction}
                      onClick={() => void runNoteAi('polish')}
                      className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#0071E3]/10 px-2.5 text-[12px] font-medium text-[#0071E3] hover:bg-[#0071E3]/18 disabled:opacity-50 dark:bg-[#2997FF]/15 dark:text-[#47A3FF]"
                    >
                      <Wand2 className="h-3 w-3" />
                      <span>{aiLoadingAction === 'polish' ? '润色中...' : '润色文本'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={!!aiLoadingAction}
                      onClick={() => void runNoteAi('extract_todos')}
                      className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#0D9488]/10 px-2.5 text-[12px] font-medium text-[#0D9488] hover:bg-[#0D9488]/18 disabled:opacity-50 dark:bg-[#10B981]/15 dark:text-[#34D399]"
                    >
                      <ListTodo className="h-3 w-3" />
                      <span>{aiLoadingAction === 'extract_todos' ? '抽取中...' : '提取待办'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFocusMode((prev) => !prev)}
                      title={focusMode ? '退出专注模式' : '进入专注写作模式'}
                      className={`inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[12px] font-medium transition-colors ${
                        focusMode
                          ? 'border-[#0071E3]/35 bg-[#0071E3]/12 text-[#0071E3] dark:text-[#60A5FA]'
                          : 'border-black/[0.08] text-[#6E6E73] hover:text-[#1D1D1F] dark:border-white/[0.1] dark:text-[#98989D] dark:hover:text-white'
                      }`}
                    >
                      {focusMode ? (
                        <Minimize2 className="h-3.5 w-3.5" />
                      ) : (
                        <Maximize2 className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden sm:inline">{focusMode ? '退出专注' : '专注'}</span>
                    </button>

                    {!focusMode && (
                      <button
                        type="button"
                        onClick={() => setInspectorOpen((prev) => !prev)}
                        title="显示/隐藏关系图谱与反向链接"
                        className={`hidden xl:inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[12px] font-medium ${
                          inspectorOpen
                            ? 'border-[#6E56CF]/30 bg-[#6E56CF]/10 text-[#6E56CF] dark:text-[#A78BFA]'
                            : 'border-black/[0.08] text-[#6E6E73] dark:border-white/[0.1]'
                        }`}
                      >
                        <Network className="h-3.5 w-3.5" />
                        <span>图谱</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteNote(activeNote.id)}
                      title="删除笔记"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#86868B] hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Note Title & Quiet Metadata Line */}
                <div className="pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#6E6E73] tabular-nums dark:text-[#98989D]">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label="切换笔记所属项目库"
                        value={activeNote.projectId}
                        onChange={(e) => {
                          const proj = concreteProjects.find((p) => p.id === e.target.value);
                          if (proj) {
                            onUpdateNote(activeNote.id, {
                              projectId: proj.id,
                              projectName: proj.name,
                              libraryName: proj.name,
                              updatedAt: '刚刚',
                            });
                          }
                        }}
                        className="rounded-lg border border-black/[0.08] bg-white/75 px-2 py-0.5 text-[12px] font-medium text-[#1D1D1F] outline-none dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-white"
                      >
                        {concreteProjects.map((proj) => (
                          <option key={proj.id} value={proj.id}>
                            {proj.name}
                          </option>
                        ))}
                      </select>
                      <span aria-hidden="true">/</span>
                      <span>{activeNote.folder}</span>
                      <span aria-hidden="true">·</span>
                      <span>更新于 {activeNote.updatedAt}</span>
                      <span aria-hidden="true">·</span>
                      <span>{noteStats.chars} 字 · 约 {noteStats.readMins} 分钟阅读</span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onAskAiFromNote(
                          `请结合企业知识库内容，帮我完善并关联这篇 Obsidian 笔记：\n所属项目：${activeNote.projectName}\n标题：${activeNote.title}\n内容：\n${activeNote.content}`
                        )
                      }
                      className="inline-flex items-center gap-1 font-medium text-[#0071E3] hover:underline dark:text-[#47A3FF]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>转入对话延展</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) =>
                      onUpdateNote(activeNote.id, {
                        title: e.target.value,
                        updatedAt: '刚刚',
                      })
                    }
                    placeholder="输入笔记标题..."
                    className="mt-2.5 w-full bg-transparent font-display text-[24px] font-semibold tracking-[-0.02em] text-[#1D1D1F] focus:outline-none sm:text-[26px] dark:text-white"
                  />

                  {aiStatusBanner && (
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-[#6E56CF]/25 bg-[#6E56CF]/[0.08] px-3.5 py-2 text-[12.5px] text-[#6E56CF] dark:text-[#A78BFA]">
                      <span>{aiStatusBanner}</span>
                      {aiStatusBanner.includes('待办') && (
                        <button
                          type="button"
                          onClick={() => setVaultTab('tasks')}
                          className="font-semibold underline underline-offset-2"
                        >
                          查看待办看板
                        </button>
                      )}
                    </div>
                  )}

                  {aiError && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2 text-[12.5px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                      {aiError}
                    </div>
                  )}

                  {activeNote.aiSummary && (
                    <div className="mt-3.5 rounded-xl border border-[#6E56CF]/20 bg-white/55 p-4 dark:border-[#8E75FF]/25 dark:bg-white/[0.03]">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#6E56CF] dark:text-[#A78BFA]">
                        <AlignLeft className="h-3.5 w-3.5" />
                        <span>文档核心摘要</span>
                      </div>
                      <MarkdownRenderer content={activeNote.aiSummary} />
                    </div>
                  )}
                </div>
              </div>

              {/* Obsidian Split Panes: Dual Apple Glassmorphic Cards */}
              <div
                className={`grid min-h-0 flex-1 gap-3.5 overflow-hidden ${
                  editorMode === 'split'
                    ? 'grid-cols-1 lg:grid-cols-2'
                    : 'grid-cols-1'
                }`}
              >
                {(editorMode === 'edit' || editorMode === 'split') && (
                  <section
                    aria-label="Markdown 源码编辑器"
                    className={`apple-glass-card flex min-h-0 flex-col overflow-hidden rounded-2xl ${
                      editorMode === 'edit' ? 'mx-auto w-full max-w-[840px]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-2.5 text-[11.5px] text-[#6E6E73] tabular-nums dark:border-white/[0.07] dark:text-[#98989D]">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#1D1D1F] dark:text-white">
                        <Edit3 className="h-3.5 w-3.5 text-[#6E56CF] dark:text-[#A78BFA]" />
                        Markdown 编辑
                      </span>
                      <span>{noteStats.lines} 行 · 支持 [[双链]] 与 #标签</span>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
                      <textarea
                        value={activeNote.content}
                        onChange={(e) =>
                          onUpdateNote(activeNote.id, {
                            content: e.target.value,
                            updatedAt: '刚刚',
                          })
                        }
                        placeholder="使用 Markdown 语法写作，输入 [[笔记名]] 建立双向链接，输入 - [ ] 创建任务..."
                        className="mx-auto block h-full min-h-[380px] w-full max-w-[68ch] resize-none bg-transparent font-mono text-[13.5px] leading-[1.85] tracking-[0.005em] text-[#1D1D1F] focus:outline-none dark:text-neutral-200"
                      />
                    </div>
                  </section>
                )}

                {(editorMode === 'read' || editorMode === 'split') && (
                  <section
                    aria-label="Obsidian 实时阅读视图"
                    className={`apple-glass-elevated flex min-h-0 flex-col overflow-hidden rounded-2xl ${
                      editorMode === 'read' ? 'mx-auto w-full max-w-[840px]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-2.5 text-[11.5px] text-[#6E6E73] tabular-nums dark:border-white/[0.07] dark:text-[#98989D]">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#1D1D1F] dark:text-white">
                        <Eye className="h-3.5 w-3.5 text-[#0D9488] dark:text-[#34D399]" />
                        Obsidian 实时阅读
                      </span>
                      <span>
                        {outgoingLinks.length} 出链 · {backlinks.length} 反向引用
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
                      <div className="mx-auto max-w-[68ch]">
                        <MarkdownRenderer
                          content={activeNote.content}
                          onWikiLinkClick={handleJumpByWikiTitle}
                          onTagClick={(tag) => setActiveTagFilter(tag)}
                        />
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </>
          ) : (
            <div className="apple-glass-card flex flex-1 flex-col items-center justify-center rounded-2xl p-8 text-center">
              <p className="text-[14px] text-[#6E6E73] dark:text-[#98989D]">
                当前项目库「{activeProject.name}」暂无笔记，可直接创建第一篇笔记。
              </p>
              <button
                type="button"
                onClick={() => onCreateNote(undefined, undefined, selectedProjectId)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#6E56CF] px-4 py-2 text-[13px] font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                <span>新建项目笔记</span>
              </button>
            </div>
          )
        ) : (
          /* Kanban Board + Time-Scheduled & Project-Linked Tasks Workspace */
          <div className="flex-1 overflow-y-auto px-1 py-2 sm:px-3 sm:py-2">
            <div className="mx-auto max-w-6xl space-y-5">
              {/* Header + View Switcher (Kanban / Time / Project) */}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-[22px] font-semibold tracking-tight text-[#1D1D1F] sm:text-[24px] dark:text-white">
                    项目待办看板
                  </h2>
                  <p className="mt-1 text-[13px] text-[#6E6E73] dark:text-[#98989D]">
                    当前负责：{activeProject.name} · 支持状态看板流转与不同项目色彩区分
                  </p>
                </div>

                <div className="flex items-center rounded-xl bg-black/[0.05] p-0.5 dark:bg-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setTodoGroupMode('kanban')}
                    className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap ${
                      todoGroupMode === 'kanban'
                        ? 'bg-white text-[#6E56CF] shadow-2xs dark:bg-[#2C2C32] dark:text-[#A78BFA]'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#98989D]'
                    }`}
                  >
                    <Columns3 className="h-3.5 w-3.5" />
                    <span>状态看板</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTodoGroupMode('time')}
                    className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap ${
                      todoGroupMode === 'time'
                        ? 'bg-white text-[#0071E3] shadow-2xs dark:bg-[#2C2C32] dark:text-[#60A5FA]'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#98989D]'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>按时间排期</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTodoGroupMode('project')}
                    className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap ${
                      todoGroupMode === 'project'
                        ? 'bg-white text-[#0D9488] shadow-2xs dark:bg-[#2C2C32] dark:text-[#34D399]'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#98989D]'
                    }`}
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>按项目分组</span>
                  </button>
                </div>
              </div>

              {/* Glassmorphic Todo Composer */}
              <form
                onSubmit={handleSubmitTodo}
                className="apple-glass-elevated rounded-2xl p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex items-center gap-3">
                  <Plus className="h-4 w-4 shrink-0 text-[#0D9488] dark:text-[#34D399]" />
                  <input
                    ref={todoInputRef}
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    placeholder="添加待办任务，并选择所属项目库、状态与截止时间..."
                    className="flex-1 bg-transparent text-[14.5px] text-[#1D1D1F] placeholder-[#86868B] focus:outline-none dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!newTodoText.trim()}
                    className="rounded-xl bg-[#6E56CF] px-4 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-[#5B43B8] disabled:opacity-35 whitespace-nowrap dark:bg-[#8E75FF]"
                  >
                    添加待办
                  </button>
                </div>

                {/* Project, Status, Time & Priority Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white/75 px-2.5 py-1.5 text-[12px] dark:border-white/[0.1] dark:bg-white/[0.05]">
                      <Briefcase className="h-3.5 w-3.5 text-[#6E56CF] dark:text-[#A78BFA]" />
                      <span className="text-[#6E6E73] dark:text-[#98989D]">项目</span>
                      <select
                        value={newTodoProjectId}
                        onChange={(e) => setNewTodoProjectId(e.target.value)}
                        className="bg-transparent font-medium text-[#1D1D1F] outline-none dark:text-white"
                      >
                        {concreteProjects.map((proj) => (
                          <option
                            key={proj.id}
                            value={proj.id}
                            className="dark:bg-[#1C1C1E]"
                          >
                            {proj.shortName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex items-center rounded-xl bg-black/[0.04] p-0.5 dark:bg-white/[0.06]">
                      {KANBAN_COLUMNS.map((col) => (
                        <button
                          key={col.status}
                          type="button"
                          onClick={() => setNewTodoStatus(col.status)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                            newTodoStatus === col.status
                              ? 'bg-white text-[#1D1D1F] shadow-2xs dark:bg-[#2C2C32] dark:text-white'
                              : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#98989D]'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${col.dotClass}`} />
                          <span>{col.label}</span>
                        </button>
                      ))}
                    </div>

                    <label className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white/75 px-2.5 py-1.5 text-[12px] dark:border-white/[0.1] dark:bg-white/[0.05]">
                      <Calendar className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#60A5FA]" />
                      <input
                        type="date"
                        value={newTodoDate}
                        onChange={(e) => setNewTodoDate(e.target.value)}
                        className="bg-transparent font-mono text-[12px] tabular-nums text-[#1D1D1F] outline-none dark:text-white"
                      />
                    </label>

                    <label className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white/75 px-2.5 py-1.5 text-[12px] dark:border-white/[0.1] dark:bg-white/[0.05]">
                      <Clock className="h-3.5 w-3.5 text-[#0D9488] dark:text-[#34D399]" />
                      <input
                        type="time"
                        value={newTodoTime}
                        onChange={(e) => setNewTodoTime(e.target.value)}
                        className="bg-transparent font-mono text-[12px] tabular-nums text-[#1D1D1F] outline-none dark:text-white"
                      />
                    </label>

                    <div className="flex items-center rounded-xl bg-black/[0.04] p-0.5 dark:bg-white/[0.06]">
                      {(
                        [
                          { id: 'high', label: '高' },
                          { id: 'medium', label: '常规' },
                          { id: 'low', label: '低' },
                        ] as const
                      ).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setNewTodoPriority(p.id)}
                          className={`rounded-lg px-2 py-1 text-[11.5px] font-medium transition-colors ${
                            newTodoPriority === p.id
                              ? 'bg-white text-[#1D1D1F] shadow-2xs dark:bg-[#2C2C32] dark:text-white'
                              : 'text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#98989D]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Time Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
                    <span className="text-[#86868B]">快捷时间：</span>
                    {[
                      { label: '今天 18:00', date: TODAY_DATE, time: '18:00' },
                      { label: '明天 10:00', date: '2026-11-23', time: '10:00' },
                      { label: '本周五 17:30', date: '2026-11-27', time: '17:30' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setNewTodoDate(preset.date);
                          setNewTodoTime(preset.time);
                        }}
                        className="rounded-lg border border-black/[0.06] bg-white/60 px-2 py-0.5 text-[#48484A] transition-colors hover:border-[#6E56CF]/40 hover:text-[#6E56CF] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-[#AEAEB2] dark:hover:text-[#A78BFA]"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              {/* Project Color Legend Strip */}
              <div className="flex flex-wrap items-center gap-2 px-1 text-[11.5px] text-[#6E6E73] dark:text-[#98989D]">
                <span>项目色彩标识：</span>
                {concreteProjects.map((proj) => {
                  const style = PROJECT_TAG_STYLE[proj.accentColor];
                  const active = selectedProjectId === proj.id;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() =>
                        onSelectProject(active ? 'proj-all' : proj.id)
                      }
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-medium transition-all ${style.pill} ${
                        active ? 'ring-1 ring-current' : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      <span>{proj.shortName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Kanban / Time / Project Views */}
              {todoGroupMode === 'kanban' ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-start">
                  {KANBAN_COLUMNS.map((col) => {
                    const colTodos = filteredTodos.filter(
                      (t) => (t.status ?? (t.completed ? 'completed' : 'in_progress')) === col.status
                    );
                    const isDropTarget = dragOverColumn === col.status;

                    return (
                      <section
                        key={col.status}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverColumn !== col.status) {
                            setDragOverColumn(col.status);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverColumn === col.status) {
                            setDragOverColumn(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverColumn(null);
                          if (draggedTodoId) {
                            onUpdateTodoStatus(draggedTodoId, col.status);
                            setDraggedTodoId(null);
                          }
                        }}
                        className={`apple-glass-panel flex min-h-[340px] flex-col rounded-2xl border p-3.5 transition-all ${
                          isDropTarget ? col.dropRing : ''
                        }`}
                      >
                        {/* Column Header */}
                        <div className="mb-3 flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${col.dotClass}`} />
                            <h3 className={`text-[13.5px] font-semibold ${col.headerText}`}>
                              {col.label}
                            </h3>
                            <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums text-[#6E6E73] dark:bg-white/[0.08] dark:text-[#AEAEB2]">
                              {colTodos.length}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewTodoStatus(col.status);
                              todoInputRef.current?.focus();
                            }}
                            title={`添加到${col.label}`}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#86868B] transition-colors hover:bg-black/[0.05] hover:text-[#1D1D1F] dark:hover:bg-white/[0.08] dark:hover:text-white"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Column Cards */}
                        <div className="flex-1 space-y-2.5">
                          {colTodos.length === 0 ? (
                            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-black/[0.08] text-[12px] text-[#86868B] dark:border-white/[0.1]">
                              暂无「{col.label}」任务，可拖拽卡片至此
                            </div>
                          ) : (
                            colTodos.map((todo) => {
                              const projStyle = getProjectColorStyle(todo.projectId);
                              const currentStatus =
                                todo.status ?? (todo.completed ? 'completed' : 'in_progress');
                              return (
                                <div
                                  key={todo.id}
                                  draggable
                                  onDragStart={() => setDraggedTodoId(todo.id)}
                                  onDragEnd={() => {
                                    setDraggedTodoId(null);
                                    setDragOverColumn(null);
                                  }}
                                  className={`apple-glass-card group cursor-grab active:cursor-grabbing rounded-xl border-l-[3px] p-3.5 transition-all hover:shadow-md ${projStyle.strip}`}
                                >
                                  {/* Card Top: Colored Project Label + Priority + Delete */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${projStyle.pill}`}
                                    >
                                      <span className={`h-1.5 w-1.5 rounded-full ${projStyle.dot}`} />
                                      <span className="truncate max-w-[130px]">
                                        {getProjectShortName(todo)}
                                      </span>
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                      {todo.priority === 'high' && currentStatus !== 'completed' && (
                                        <span className="text-[11px] font-semibold text-[#D97706] dark:text-[#FBBF24]">
                                          高优
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => onDeleteTodo(todo.id)}
                                        aria-label="删除待办"
                                        className="opacity-0 group-hover:opacity-100 rounded p-1 text-[#86868B] transition-opacity hover:bg-red-500/10 hover:text-red-600"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Card Title */}
                                  <div
                                    className={`mt-2.5 text-[13.5px] font-medium leading-snug ${
                                      currentStatus === 'completed'
                                        ? 'line-through text-[#86868B]'
                                        : 'text-[#1D1D1F] dark:text-white'
                                    }`}
                                  >
                                    {todo.title}
                                  </div>

                                  {todo.sourceNote && (
                                    <button
                                      type="button"
                                      onClick={() => handleJumpByWikiTitle(todo.sourceNote!)}
                                      className="mt-2 block truncate text-[11px] text-[#6E56CF] hover:underline dark:text-[#A78BFA]"
                                    >
                                      笔记：{todo.sourceNote}
                                    </button>
                                  )}

                                  {/* Card Footer: Due Time + Quick Status Switcher */}
                                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.05] pt-2.5 dark:border-white/[0.07]">
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-[#6E6E73] dark:text-[#98989D]">
                                      <Clock className="h-3 w-3" />
                                      {formatDueLabel(todo.dueDate, todo.dueTime)}
                                    </span>

                                    <div className="flex items-center gap-1">
                                      {KANBAN_COLUMNS.map((target) => {
                                        const isCurrent = currentStatus === target.status;
                                        return (
                                          <button
                                            key={target.status}
                                            type="button"
                                            onClick={() =>
                                              onUpdateTodoStatus(todo.id, target.status)
                                            }
                                            className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-medium transition-colors ${
                                              isCurrent
                                                ? 'bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F]'
                                                : 'text-[#86868B] hover:bg-black/[0.05] hover:text-[#1D1D1F] dark:hover:bg-white/[0.08] dark:hover:text-white'
                                            }`}
                                          >
                                            {target.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : filteredTodos.length === 0 ? (
                <div className="apple-glass-card rounded-2xl p-10 text-center text-[13.5px] text-[#6E6E73] dark:text-[#98989D]">
                  当前筛选条件下暂无待办事项，可在上方选择项目库与截止时间快速添加。
                </div>
              ) : todoGroupMode === 'time' ? (
                <div className="space-y-4">
                  {groupedTodosByTime.map((group) => (
                    <section
                      key={group.key}
                      className="apple-glass-card overflow-hidden rounded-2xl"
                    >
                      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3 dark:border-white/[0.08]">
                        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-[#1D1D1F] dark:text-white">
                          <Clock className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#60A5FA]" />
                          <span>{group.label}</span>
                        </h3>
                        <span className="font-mono text-[11.5px] tabular-nums text-[#86868B]">
                          {group.items.length} 项
                        </span>
                      </div>
                      <div className="divide-y divide-black/[0.05] dark:divide-white/[0.07]">
                        {group.items.map(renderTodoRow)}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedTodosByProject.map(([projId, group]) => {
                    const projStyle = getProjectColorStyle(projId);
                    return (
                      <section
                        key={projId}
                        className="apple-glass-card overflow-hidden rounded-2xl"
                      >
                        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3 dark:border-white/[0.08]">
                          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-[#1D1D1F] dark:text-white">
                            <span className={`h-2.5 w-2.5 rounded-full ${projStyle.dot}`} />
                            <span>{group.projectName}</span>
                          </h3>
                          <span className="font-mono text-[11.5px] tabular-nums text-[#86868B]">
                            {group.items.length} 项
                          </span>
                        </div>
                        <div className="divide-y divide-black/[0.05] dark:divide-white/[0.07]">
                          {group.items.map(renderTodoRow)}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Obsidian Local Graph, Backlinks & Outline Inspector */}
      {!focusMode && vaultTab === 'vault' && activeNote && inspectorOpen && (
        <aside className="apple-glass-panel hidden xl:flex w-[280px] shrink-0 flex-col border-l p-4 space-y-5 overflow-y-auto">
          {/* Local Graph View */}
          <div>
            <div className="mb-2.5 flex items-center justify-between text-[12px] font-semibold text-[#1D1D1F] dark:text-white">
              <span className="flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5 text-[#6E56CF] dark:text-[#A78BFA]" />
                局部关系图谱
              </span>
              <span className="font-mono text-[11px] tabular-nums text-[#86868B]">
                {outgoingLinks.length + backlinks.length} 关联
              </span>
            </div>
            <div className="apple-glass-card rounded-2xl p-2">
              <svg viewBox="0 0 240 160" className="h-[150px] w-full">
                {[...outgoingLinks, ...backlinks.map((b) => b.title)]
                  .slice(0, 6)
                  .map((label, idx, arr) => {
                    const angle = (idx / Math.max(1, arr.length)) * Math.PI * 2 - Math.PI / 2;
                    const nx = 120 + Math.cos(angle) * 72;
                    const ny = 80 + Math.sin(angle) * 52;
                    return (
                      <g
                        key={`${label}-${idx}`}
                        className="cursor-pointer"
                        onClick={() => handleJumpByWikiTitle(label)}
                      >
                        <line
                          x1={120}
                          y1={80}
                          x2={nx}
                          y2={ny}
                          stroke="#6E56CF"
                          strokeOpacity={0.35}
                          strokeWidth={1.5}
                        />
                        <circle cx={nx} cy={ny} r={5} fill="#0D9488" />
                        <text
                          x={nx}
                          y={ny + 13}
                          textAnchor="middle"
                          className="fill-[#6E6E73] text-[8.5px] dark:fill-[#98989D]"
                        >
                          {label.slice(0, 8)}
                        </text>
                      </g>
                    );
                  })}
                <circle cx={120} cy={80} r={8} fill="#6E56CF" />
                <text
                  x={120}
                  y={66}
                  textAnchor="middle"
                  className="fill-[#1D1D1F] text-[9.5px] font-semibold dark:fill-white"
                >
                  {activeNote.title.slice(0, 10)}
                </text>
              </svg>
            </div>
          </div>

          {/* Backlinks */}
          <div className="border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
            <div className="mb-2 text-[12px] font-semibold text-[#1D1D1F] dark:text-white">
              反向链接 ({backlinks.length})
            </div>
            {backlinks.length > 0 ? (
              <div className="space-y-1.5">
                {backlinks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelectNote(b.id)}
                    className="apple-glass-card w-full rounded-xl p-2.5 text-left transition-colors hover:border-[#6E56CF]/40"
                  >
                    <div className="truncate text-[12.5px] font-medium text-[#6E56CF] dark:text-[#A78BFA]">
                      {b.title}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-[#86868B]">
                      {b.projectName} · {b.folder}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-[#86868B]">暂无其他笔记引用此篇</div>
            )}
          </div>

          {/* Outgoing Links */}
          <div className="border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
            <div className="mb-2 text-[12px] font-semibold text-[#1D1D1F] dark:text-white">
              出链引用 ({outgoingLinks.length})
            </div>
            <div className="space-y-1">
              {outgoingLinks.length > 0 ? (
                outgoingLinks.map((link) => (
                  <button
                    key={link}
                    type="button"
                    onClick={() => handleJumpByWikiTitle(link)}
                    className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-[12.5px] text-[#48484A] hover:bg-black/[0.04] hover:text-[#6E56CF] dark:text-neutral-300 dark:hover:bg-white/[0.05]"
                  >
                    <Link2 className="h-3 w-3 shrink-0 text-[#6E56CF]" />
                    <span className="truncate">{link}</span>
                  </button>
                ))
              ) : (
                <div className="text-[12px] text-[#86868B]">输入 [[笔记名]] 建立链接</div>
              )}
            </div>
          </div>

          {/* Document Outline */}
          <div className="border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
            <div className="mb-2 text-[12px] font-semibold text-[#1D1D1F] dark:text-white">
              文档大纲
            </div>
            <div className="space-y-1">
              {headings.map((h, i) => (
                <div
                  key={i}
                  style={{ paddingLeft: `${(h.level - 1) * 10}px` }}
                  className="truncate text-[12px] text-[#6E6E73] dark:text-[#98989D]"
                >
                  {h.text}
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
