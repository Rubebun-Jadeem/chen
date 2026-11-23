export type NavSectionId =
  | 'chat'
  | 'assistant'
  | 'knowledge'
  | 'notes'
  | 'wiki'
  | 'hotspots'
  | 'summary'
  | 'clusters'
  | 'ontology'
  | 'plugins'
  | 'usage'
  | 'organization'
  | 'settings';

export type ChatMode = 'general' | 'analyze' | 'draft' | 'data' | 'brainstorm';

export interface KnowledgeBase {
  id: string;
  name: string;
  shortName: string;
  scope: 'company' | 'personal';
  description: string;
  docCount: number;
  updatedAt: string;
  accentColor: 'blue' | 'violet' | 'emerald' | 'amber' | 'cyan';
}

export interface KnowledgeDoc {
  id: string;
  libraryId: string;
  libraryName: string;
  title: string;
  fileType: 'md' | 'xlsx' | 'pdf' | 'docx';
  sizeLabel: string;
  wordCount: number;
  updatedAt: string;
  author: string;
  excerpt: string;
  aiSummary?: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  sizeLabel: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: string[];
  followUps?: string[];
  groundingUrls?: { title: string; uri: string }[];
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  group: '今天' | '更早';
  timeLabel: string;
  libraryId: string;
  messages: ChatMessage[];
}

export interface DsBotDeliverable {
  id: string;
  fileName: string;
  subtitle: string;
  format: 'html' | 'pdf' | 'md';
  content: string;
}

export interface DsBotMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  deliverables?: DsBotDeliverable[];
  isError?: boolean;
}

export interface DsBotAgent {
  id: string;
  name: string;
  roleTitle: string;
  color: 'blue' | 'cyan' | 'amber' | 'slate' | 'violet';
  starred?: boolean;
  targetLibraryId: string;
  description: string;
  quickPrompts: string[];
  messages: DsBotMessage[];
}

export interface ProjectLibrary {
  id: string;
  name: string;
  shortName: string;
  description: string;
  owner: string;
  accentColor: 'blue' | 'violet' | 'emerald' | 'amber' | 'cyan';
}

export interface WorkspaceNote {
  id: string;
  title: string;
  folder: string;
  tags: string[];
  content: string;
  updatedAt: string;
  projectId: string;
  projectName: string;
  libraryName: string;
  aiSummary?: string;
}

export type TodoStatus = 'waiting' | 'in_progress' | 'completed';

export interface WorkspaceTodo {
  id: string;
  title: string;
  completed: boolean;
  status: TodoStatus;
  priority: 'high' | 'medium' | 'low';
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  dueLabel: string;
  projectId: string;
  projectName: string;
  sourceNote?: string;
  tag?: string;
}

export interface WikiPage {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  author: string;
  readTime: string;
  content: string;
}

export interface GraphNode {
  id: string;
  label: string;
  group: 'core' | 'metric' | 'source' | 'concept';
  x: number;
  y: number;
  evidenceCount: number;
  summary: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

export interface IndustryHotspot {
  id: string;
  title: string;
  category: '模型' | '产品' | '行业' | '论文' | '教程' | '观点';
  source: string;
  publishedAt: string;
  impactLevel: '高关注' | '行业动态' | '政策解读';
  summary: string;
  relatedLibrary: string;
  unread?: boolean;
  bookmarked?: boolean;
}

export interface KnowledgeCluster {
  id: string;
  name: string;
  lifecycle: '新形成' | '稳定' | '演化中';
  confidence: number | null;
  docCount: number;
  updatedAt: string;
  coreConcepts: string[];
  description: string;
}

export interface OntologyConcept {
  id: string;
  name: string;
  namespace: string;
  parent?: string;
  description: string;
  attributes: { name: string; type: string; inheritedFrom?: string }[];
  x: number;
  y: number;
}

export interface OntologyRelation {
  id: string;
  source: string;
  relation: string;
  target: string;
  evidence: string;
  isInheritance?: boolean;
}

export interface TokenModelUsage {
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  calls: number;
}

export interface OrgDepartment {
  id: string;
  name: string;
  memberCount: number;
}

export interface OrgMember {
  id: string;
  name: string;
  account: string;
  departmentId: string;
  departmentName: string;
  role: '管理员' | '普通成员' | '只读访客';
  status: '有效' | '已停用';
  color: 'blue' | 'cyan' | 'violet' | 'emerald' | 'amber';
}
