import { create } from 'zustand';
import { Edge, Node } from '@xyflow/react';
import { Agent, PanelTab } from './types';

const now = Date.now();
const STORAGE_KEY = 'workflower-demo-state';
const SETTINGS_KEY = 'workflower-demo-settings';

export const MODEL_OVERRIDE_DEFAULT = '__agent_default__';

export type WorkflowNodeData = {
  title: string;
  description: string;
  agentId?: string;
  overrideModel?: string;
  condition?: string;
  method?: string;
  url?: string;
  code?: string;
  extraOutputs?: string[];
};

type PersistedState = {
  agents: Agent[];
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
};

export type AppSettings = {
  ollamaUrl: string;
};

export type WorkflowLog = {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
};

function pruneUnconnectedConditionNodes(state: PersistedState): PersistedState {
  const connectedNodeIds = new Set<string>();
  state.edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  const nodes = state.nodes.filter((node) => node.type !== 'condition' || connectedNodeIds.has(node.id));
  const validNodeIds = new Set(nodes.map((node) => node.id));
  const edges = state.edges.filter((edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target));
  return { ...state, nodes, edges };
}

const initialAgents: Agent[] = [
  { id: 'agent-docs', name: '文案助手', description: '负责文案撰写、标题生成和内容优化', coreFiles: ['src/docs/index.ts', 'src/docs/parser.ts'], model: 'gpt-4', dataConnection: '/data/docs', skills: ['文案撰写', '标题生成', '内容优化'], createdAt: now, updatedAt: now },
  { id: 'agent-data', name: '数据分析助手', description: '负责热点分析、数据清洗和趋势预测', coreFiles: ['src/analytics/index.ts', 'src/analytics/chart.ts'], model: 'gpt-4', dataConnection: '/data/warehouse', skills: ['热点分析', '数据清洗', '趋势预测'], createdAt: now, updatedAt: now },
  { id: 'agent-code', name: '代码助手', description: '负责代码生成、重构和测试建议', coreFiles: ['src/codegen/index.ts', 'src/codegen/templates.ts'], model: 'claude-3', dataConnection: '/data/code', skills: ['代码生成', '重构建议', '单元测试'], createdAt: now, updatedAt: now },
];

// 小红书爆款文案生成工作流
const initialNodes: Node<WorkflowNodeData>[] = [
  { id: '1', type: 'start', position: { x: 100, y: 200 }, data: { title: '开始', description: '输入选题方向' } },
  { id: '2', type: 'agent', position: { x: 350, y: 100 }, data: { title: '选题分析', description: 'AI分析热门话题，推荐3个选题', agentId: 'agent-data', overrideModel: MODEL_OVERRIDE_DEFAULT } },
  { id: '3', type: 'agent', position: { x: 600, y: 100 }, data: { title: '标题生成', description: '生成5个爆款标题', agentId: 'agent-docs', overrideModel: MODEL_OVERRIDE_DEFAULT } },
  { id: '4', type: 'agent', position: { x: 850, y: 100 }, data: { title: '正文撰写', description: '撰写300字小红书正文', agentId: 'agent-docs', overrideModel: MODEL_OVERRIDE_DEFAULT } },
  { id: '5', type: 'end', position: { x: 1100, y: 200 }, data: { title: '结束', description: '文案生成完成' } },
];

const dashedEdge = { style: { stroke: '#3b82f6', strokeWidth: 2.5 }, markerEnd: { type: 'arrowclosed' as const, color: '#3b82f6' } };
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, ...dashedEdge },
  { id: 'e2-3', source: '2', target: '3', animated: true, ...dashedEdge },
  { id: 'e3-4', source: '3', target: '4', animated: true, ...dashedEdge },
  { id: 'e4-5', source: '4', target: '5', animated: true, ...dashedEdge },
];

const fallbackState: PersistedState = { agents: initialAgents, nodes: initialNodes, edges: initialEdges };
const fallbackSettings: AppSettings = { ollamaUrl: 'http://localhost:11434' };

function loadPersistedState(): PersistedState {
  if (typeof window === 'undefined') return fallbackState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallbackState;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return pruneUnconnectedConditionNodes({
      agents: parsed.agents?.length ? parsed.agents : initialAgents,
      nodes: parsed.nodes?.length ? parsed.nodes : initialNodes,
      edges: parsed.edges?.length ? parsed.edges : initialEdges,
    });
  } catch {
    return fallbackState;
  }
}

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return fallbackSettings;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallbackSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ollamaUrl: parsed.ollamaUrl || fallbackSettings.ollamaUrl };
  } catch {
    return fallbackSettings;
  }
}

function persistState(state: PersistedState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function persistSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

type WorkflowState = {
  activeTab: PanelTab;
  agents: Agent[];
  selectedAgentId: string | null;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  settings: AppSettings;
  logs: WorkflowLog[];
  setActiveTab: (tab: PanelTab) => void;
  setSettings: (patch: Partial<AppSettings>) => void;
  addLog: (entry: Omit<WorkflowLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, patch: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  selectAgent: (id: string | null) => void;
  setNodes: (nodes: Node<WorkflowNodeData>[] | ((nodes: Node<WorkflowNodeData>[]) => Node<WorkflowNodeData>[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  selectNode: (id: string | null) => void;
  updateNode: (id: string, patch: Partial<WorkflowNodeData>) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  exportJson: () => string;
  importJson: (json: string) => boolean;
};

const persisted = loadPersistedState();
const initialSettings = loadSettings();

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  activeTab: 'workflow',
  agents: persisted.agents,
  selectedAgentId: 'agent-docs',
  nodes: persisted.nodes,
  edges: persisted.edges,
  selectedNodeId: '2',
  settings: initialSettings,
  logs: [],
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSettings: (patch) => set((state) => { const settings = { ...state.settings, ...patch }; persistSettings(settings); return { settings }; }),
  addLog: (entry) => set((state) => ({ logs: [...state.logs, { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, timestamp: Date.now() }].slice(-200) })),
  clearLogs: () => set({ logs: [] }),
  addAgent: (agent) => set((state) => { const next = { agents: [agent, ...state.agents], nodes: state.nodes, edges: state.edges }; persistState(next); return next; }),
  updateAgent: (id, patch) => set((state) => { const next = { agents: state.agents.map((agent) => (agent.id === id ? { ...agent, ...patch, updatedAt: Date.now() } : agent)), nodes: state.nodes, edges: state.edges }; persistState(next); return next; }),
  removeAgent: (id) => set((state) => { const next = { agents: state.agents.filter((agent) => agent.id !== id), selectedAgentId: state.selectedAgentId === id ? state.agents.find((agent) => agent.id !== id)?.id ?? null : state.selectedAgentId, nodes: state.nodes, edges: state.edges }; persistState({ agents: next.agents, nodes: next.nodes, edges: next.edges }); return next; }),
  selectAgent: (id) => set({ selectedAgentId: id }),
  setNodes: (nodes) => set((state) => { const nextNodes = typeof nodes === 'function' ? nodes(state.nodes) : nodes; const next = pruneUnconnectedConditionNodes({ agents: state.agents, nodes: nextNodes, edges: state.edges }); persistState(next); return { nodes: next.nodes, edges: next.edges }; }),
  setEdges: (edges) => set((state) => { const nextEdges = typeof edges === 'function' ? edges(state.edges) : edges; const next = pruneUnconnectedConditionNodes({ agents: state.agents, nodes: state.nodes, edges: nextEdges }); persistState(next); return { edges: next.edges, nodes: next.nodes }; }),
  selectNode: (id) => set({ selectedNodeId: id }),
  updateNode: (id, patch) => set((state) => { const nextNodes = state.nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...patch } } : node)); const next = pruneUnconnectedConditionNodes({ agents: state.agents, nodes: nextNodes, edges: state.edges }); persistState(next); return { nodes: next.nodes, edges: next.edges }; }),
  removeNode: (id) => set((state) => { const nextNodes = state.nodes.filter((node) => node.id !== id); const nextEdges = state.edges.filter((edge) => edge.source !== id && edge.target !== id); const next = pruneUnconnectedConditionNodes({ agents: state.agents, nodes: nextNodes, edges: nextEdges }); persistState(next); return { nodes: next.nodes, edges: next.edges, selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId }; }),
  duplicateNode: (id) => set((state) => { const source = state.nodes.find((node) => node.id === id); if (!source) return state; const newId = `${source.type}-${Date.now()}`; const cloned: Node<WorkflowNodeData> = { ...source, id: newId, position: { x: source.position.x + 40, y: source.position.y + 40 }, data: { ...source.data } }; const nextNodes = [...state.nodes, cloned]; const next = pruneUnconnectedConditionNodes({ agents: state.agents, nodes: nextNodes, edges: state.edges }); persistState(next); return { nodes: next.nodes, edges: next.edges, selectedNodeId: newId }; }),
  exportJson: () => JSON.stringify({ agents: get().agents, nodes: get().nodes, edges: get().edges, settings: get().settings }, null, 2),
  importJson: (json) => {
    try {
      const parsed = JSON.parse(json) as Partial<PersistedState & { settings: AppSettings }>;
      if (!Array.isArray(parsed.agents) || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return false;
      const next = pruneUnconnectedConditionNodes({ agents: parsed.agents, nodes: parsed.nodes, edges: parsed.edges } as PersistedState);
      if (parsed.settings?.ollamaUrl) persistSettings({ ollamaUrl: parsed.settings.ollamaUrl });
      persistState(next);
      set({ agents: next.agents, nodes: next.nodes, edges: next.edges, selectedAgentId: next.agents[0]?.id ?? null, selectedNodeId: next.nodes[0]?.id ?? null, settings: parsed.settings?.ollamaUrl ? { ollamaUrl: parsed.settings.ollamaUrl } : get().settings });
      return true;
    } catch {
      return false;
    }
  },
}));

export function validateWorkflow(nodes: Node<WorkflowNodeData>[], edges: Edge[]) {
  const issues: string[] = [];
  if (!nodes.some((node) => node.type === 'start')) issues.push('缺少开始节点');
  if (!nodes.some((node) => node.type === 'end')) issues.push('缺少结束节点');
  const connected = new Set<string>();
  edges.forEach((edge) => { connected.add(edge.source); connected.add(edge.target); });
  const unconnected = nodes.filter((node) => node.type !== 'start' && node.type !== 'end' && !connected.has(node.id));
  if (unconnected.length) issues.push(`存在未连接节点：${unconnected.map((node) => node.data.title).join('、')}`);
  return { valid: issues.length === 0, issues };
}