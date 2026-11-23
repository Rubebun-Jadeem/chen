import { useEffect, useState } from 'react';
import type {
  ChatMessage,
  ChatSession,
  DsBotAgent,
  DsBotMessage,
  KnowledgeDoc,
  NavSectionId,
  TodoStatus,
  WikiPage,
  WorkspaceNote,
  WorkspaceTodo,
} from './types/knowhub';
import {
  INITIAL_CHAT_SESSIONS,
  INITIAL_DOCS,
  INITIAL_DS_BOTS,
  INITIAL_NOTES,
  INITIAL_TODOS,
  INITIAL_WIKI_PAGES,
  KNOWLEDGE_BASES,
  PROJECT_LIBRARIES,
} from './data/workspaceData';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SpotlightModal } from './components/SpotlightModal';
import { ChatWorkspace } from './components/ChatWorkspace';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { NotesAndTodosView } from './components/NotesAndTodosView';
import { AssistantView } from './components/AssistantView';
import { WikiView } from './components/WikiView';
import { IntelligenceViews } from './components/IntelligenceViews';
import { AdminViews } from './components/AdminViews';
import type { Plugin, PluginSetting } from './types/plugins';
import { INITIAL_PLUGINS } from './data/pluginsData';
import { PluginsView } from './components/PluginsView';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSectionId>('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('all');
  const [docs, setDocs] = useState<KnowledgeDoc[]>(INITIAL_DOCS);
  const [activeDocId, setActiveDocId] = useState<string>(INITIAL_DOCS[0].id);

  const [sessions, setSessions] = useState<ChatSession[]>(INITIAL_CHAT_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>(
    INITIAL_CHAT_SESSIONS[2].id
  );
  const [pendingQuickPrompt, setPendingQuickPrompt] = useState<string | null>(null);

  const [dsBots, setDsBots] = useState<DsBotAgent[]>(INITIAL_DS_BOTS);
  const [activeBotId, setActiveBotId] = useState<string>(INITIAL_DS_BOTS[0].id);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-all');
  const [notes, setNotes] = useState<WorkspaceNote[]>(INITIAL_NOTES);
  const [activeNoteId, setActiveNoteId] = useState<string>(INITIAL_NOTES[0].id);

  const [todos, setTodos] = useState<WorkspaceTodo[]>(INITIAL_TODOS);

  const [wikiPages, setWikiPages] = useState<WikiPage[]>(INITIAL_WIKI_PAGES);
  const [activeWikiId, setActiveWikiId] = useState<string>(INITIAL_WIKI_PAGES[0].id);

  const [plugins, setPlugins] = useState<Plugin[]>(INITIAL_PLUGINS);

  const handleTogglePlugin = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleInstallPlugin = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, installed: true, enabled: true } : p))
    );
  };

  const handleUninstallPlugin = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, installed: false, enabled: false } : p))
    );
  };

  const handleUpdatePluginSettings = (pluginId: string, settings: PluginSetting[]) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, settings } : p))
    );
  };

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleNewChat = (initialPrompt?: string) => {
    const newId = `chat-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: initialPrompt ? initialPrompt.slice(0, 24) : '新探索对话',
      group: '今天',
      timeLabel: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      libraryId: selectedLibraryId,
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setActiveSection('chat');
    if (initialPrompt) {
      setPendingQuickPrompt(initialPrompt);
    }
  };

  const handleCreateNote = (title?: string, content?: string, projectIdOverride?: string) => {
    const resolvedProjectId =
      projectIdOverride && projectIdOverride !== 'proj-all'
        ? projectIdOverride
        : selectedProjectId !== 'proj-all'
          ? selectedProjectId
          : 'proj-qa';
    const proj =
      PROJECT_LIBRARIES.find((p) => p.id === resolvedProjectId) ??
      PROJECT_LIBRARIES[4];

    const newNote: WorkspaceNote = {
      id: `note-${Date.now()}`,
      title: title || '未命名笔记',
      folder: '功能验收',
      tags: ['#工作记录'],
      content:
        content ||
        '# 新建 Obsidian 笔记\n\n> [!info] 提示\n> 可输入 `[[笔记标题]]` 建立双向链接，或输入 `- [ ]` 创建同步待办。\n',
      updatedAt: '刚刚',
      projectId: proj.id,
      projectName: proj.name,
      libraryName: proj.name,
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setActiveSection('notes');
  };

  const handleCreateWiki = () => {
    const newWiki: WikiPage = {
      id: `wiki-${Date.now()}`,
      title: '新建业务规范词条',
      category: '公司 / 企业规范',
      updatedAt: new Date().toISOString().slice(0, 10),
      author: '演示管理员',
      readTime: '2 分钟阅读',
      content: '## 概述\n在此撰写标准化业务口径与流程规范。',
    };
    setWikiPages((prev) => [newWiki, ...prev]);
    setActiveWikiId(newWiki.id);
    setActiveSection('wiki');
  };

  const handleSaveDeliverableToKnowledge = (title: string, content: string) => {
    const newDoc: KnowledgeDoc = {
      id: `doc-${Date.now()}`,
      libraryId: 'kb-personal-qa',
      libraryName: '个人库 · 本地功能验收-笔记待办与DSBot',
      title,
      fileType: title.endsWith('.html') ? 'md' : 'md',
      sizeLabel: `${Math.max(1, Math.round(content.length / 1024))} KB`,
      wordCount: content.length,
      updatedAt: new Date().toISOString().slice(0, 10),
      author: 'DS Bot 交付',
      excerpt: content.slice(0, 3500),
    };
    setDocs((prev) => [newDoc, ...prev]);
  };

  const handlePrimaryAction = () => {
    handleNewChat();
  };

  const unreadTodosCount = todos.filter((t) => !t.completed).length;
  const activeProject =
    PROJECT_LIBRARIES.find((p) => p.id === selectedProjectId) ??
    PROJECT_LIBRARIES[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#1D1D1F] dark:bg-[#0D0D0F] dark:text-[#F5F5F7]">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        unreadTodosCount={unreadTodosCount}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          activeSection={activeSection}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          knowledgeBases={KNOWLEDGE_BASES}
          selectedLibraryId={selectedLibraryId}
          onSelectLibrary={setSelectedLibraryId}
          activeProject={activeProject}
          onOpenSpotlight={() => setSpotlightOpen(true)}
          onPrimaryAction={handlePrimaryAction}
        />

        <main className="flex min-h-0 flex-1 overflow-hidden">
          {activeSection === 'chat' && (
            <ChatWorkspace
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={setActiveSessionId}
              onNewChat={() => handleNewChat()}
              onUpdateSessionMessages={(
                sessionId,
                messages: ChatMessage[],
                newTitle
              ) => {
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === sessionId
                      ? {
                          ...s,
                          messages,
                          title: newTitle ?? s.title,
                        }
                      : s
                  )
                );
              }}
              knowledgeBases={KNOWLEDGE_BASES}
              selectedLibraryId={selectedLibraryId}
              docs={docs}
              onSaveAiToNote={(title, content) => {
                handleCreateNote(`整理笔记：${title}`, content);
              }}
              pendingQuickPrompt={pendingQuickPrompt}
              onClearPendingQuickPrompt={() => setPendingQuickPrompt(null)}
            />
          )}

          {activeSection === 'assistant' && (
            <AssistantView
              bots={dsBots}
              activeBotId={activeBotId}
              onSelectBot={setActiveBotId}
              onUpdateBotMessages={(botId, messages: DsBotMessage[]) => {
                setDsBots((prev) =>
                  prev.map((b) => (b.id === botId ? { ...b, messages } : b))
                );
              }}
              onCreateBot={(name, roleTitle) => {
                const newId = `bot-${Date.now()}`;
                setDsBots((prev) => [
                  ...prev,
                  {
                    id: newId,
                    name,
                    roleTitle,
                    color: 'violet',
                    targetLibraryId: selectedLibraryId,
                    description: `${name}：${roleTitle}`,
                    quickPrompts: [
                      `请以 ${name} 的专业视角，基于知识库输出结构化方案与风险核查清单。`,
                    ],
                    messages: [],
                  },
                ]);
                setActiveBotId(newId);
              }}
              docs={docs}
              knowledgeBases={KNOWLEDGE_BASES}
              onSaveDeliverableToKnowledge={handleSaveDeliverableToKnowledge}
              onSaveDeliverableToNote={(title, content) => {
                handleCreateNote(title, content);
              }}
            />
          )}

          {activeSection === 'knowledge' && (
            <KnowledgeBaseView
              knowledgeBases={KNOWLEDGE_BASES}
              selectedLibraryId={selectedLibraryId}
              onSelectLibrary={setSelectedLibraryId}
              docs={docs}
              activeDocId={activeDocId}
              onSelectDoc={setActiveDocId}
              onUpdateDocInsight={(docId, aiSummary) => {
                setDocs((prev) =>
                  prev.map((d) => (d.id === docId ? { ...d, aiSummary } : d))
                );
              }}
              onUploadDoc={(newDoc) => {
                setDocs((prev) => [newDoc, ...prev]);
              }}
              onAskAiAboutDoc={(prompt) => handleNewChat(prompt)}
            />
          )}

          {activeSection === 'wiki' && (
            <WikiView
              pages={wikiPages}
              activePageId={activeWikiId}
              onSelectPage={setActiveWikiId}
              onCreatePage={handleCreateWiki}
              onUpdatePage={(id, patch) => {
                setWikiPages((prev) =>
                  prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
                );
              }}
              onAskAiAboutWiki={(prompt) => handleNewChat(prompt)}
            />
          )}

          {activeSection === 'notes' && (
            <NotesAndTodosView
              projects={PROJECT_LIBRARIES}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              notes={notes}
              activeNoteId={activeNoteId}
              onSelectNote={setActiveNoteId}
              onCreateNote={(title, content, projectId) =>
                handleCreateNote(title, content, projectId)
              }
              onUpdateNote={(id, patch) => {
                setNotes((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, ...patch } : n))
                );
              }}
              onDeleteNote={(id) => {
                setNotes((prev) => {
                  const next = prev.filter((n) => n.id !== id);
                  if (activeNoteId === id) {
                    setActiveNoteId(next[0]?.id ?? '');
                  }
                  return next;
                });
              }}
              todos={todos}
              onToggleTodo={(id) => {
                setTodos((prev) =>
                  prev.map((t) => {
                    if (t.id !== id) return t;
                    const nextCompleted = !t.completed;
                    return {
                      ...t,
                      completed: nextCompleted,
                      status: nextCompleted ? 'completed' : 'in_progress',
                    };
                  })
                );
              }}
              onUpdateTodoStatus={(id, status: TodoStatus) => {
                setTodos((prev) =>
                  prev.map((t) =>
                    t.id === id
                      ? { ...t, status, completed: status === 'completed' }
                      : t
                  )
                );
              }}
              onAddTodo={({
                title,
                priority,
                status = 'in_progress',
                dueDate,
                dueTime,
                projectId,
                sourceNote,
              }) => {
                const proj =
                  PROJECT_LIBRARIES.find((p) => p.id === projectId) ??
                  PROJECT_LIBRARIES[1];
                setTodos((prev) => [
                  {
                    id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                    title,
                    completed: status === 'completed',
                    status,
                    priority,
                    dueDate,
                    dueTime,
                    dueLabel: `${dueDate} ${dueTime}`,
                    projectId: proj.id,
                    projectName: proj.name,
                    sourceNote,
                  },
                  ...prev,
                ]);
              }}
              onDeleteTodo={(id) => {
                setTodos((prev) => prev.filter((t) => t.id !== id));
              }}
              onAskAiFromNote={(prompt) => handleNewChat(prompt)}
            />
          )}

          {(activeSection === 'hotspots' ||
            activeSection === 'summary' ||
            activeSection === 'clusters' ||
            activeSection === 'ontology') && (
            <IntelligenceViews
              section={activeSection}
              docs={docs}
              knowledgeBases={KNOWLEDGE_BASES}
              selectedLibraryId={selectedLibraryId}
              onAskAi={(prompt) => handleNewChat(prompt)}
            />
          )}

          {activeSection === 'plugins' && (
            <PluginsView
              plugins={plugins}
              onTogglePlugin={handleTogglePlugin}
              onInstallPlugin={handleInstallPlugin}
              onUninstallPlugin={handleUninstallPlugin}
              onUpdateSettings={handleUpdatePluginSettings}
            />
          )}

          {(activeSection === 'usage' ||
            activeSection === 'organization' ||
            activeSection === 'settings') && (
            <AdminViews
              section={activeSection}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode((prev) => !prev)}
            />
          )}
        </main>
      </div>

      <SpotlightModal
        open={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        docs={docs}
        notes={notes}
        wikiPages={wikiPages}
        onAskAiDirect={(query) => handleNewChat(query)}
        onNavigateItem={(section, itemId) => {
          setActiveSection(section);
          if (section === 'knowledge' && itemId) setActiveDocId(itemId);
          if (section === 'notes' && itemId) setActiveNoteId(itemId);
          if (section === 'wiki' && itemId) setActiveWikiId(itemId);
        }}
      />
    </div>
  );
}
