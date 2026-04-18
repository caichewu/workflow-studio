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
  { id: 'agent-docs', name: '文档助手', description: '负责知识库检索、文档整理和摘要生成', coreFiles: ['src/docs/index.ts', 'src/docs/parser.ts'], model: 'gpt-4', dataConnection: '/data/docs', skills: ['文本处理', '摘要生成', '知识检索'], createdAt: now, updatedAt: now },
  { id: 'agent-code', name: '代码助手', description: '负责代码生成、重构和测试建议', coreFiles: ['src/codegen/index.ts', 'src/codegen/templates.ts'], model: 'claude-3', dataConnection: '/data/code', skills: ['代码生成', '重构建议', '单元测试'], createdAt: now, updatedAt: now },
  { id: 'agent-data', name: '数据分析助手', description: '负责数据清洗、分析和可视化建议', coreFiles: ['src/analytics/index.ts', 'src/analytics/chart.ts'], model: 'gpt-4', dataConnection: '/data/warehouse', skills: ['数据分析', '表格处理', '图表生成'], createdAt: now, updatedAt: now },
];

const initialNodes: Node<WorkflowNodeData>[] = [
  { id: '1', type: 'start', position: { x: 120, y: 180 }, data: { title: '开始', description: '工作流起点' } },
  { id: '2', type: 'agent', position: { x: 360, y: 160 }, data: { title: 'AI代理', description: '选择预定义 Agent 执行任务', agentId: 'agent-docs', overrideModel: MODEL_OVERRIDE_DEFAULT, extraOutputs: ['out'] } },
  { id: '3', type: 'condition', position: { x: 620, y: 160 }, data: { title: '条件判断', description: '检查输出结果', condition: 'result.success === true' } },
  { id: '4', type: 'api', position: { x: 900, y: 70 }, data: { title: 'API调用', description: '调用外部 HTTP 接口', method: 'GET', url: 'https://api.example.com/data', extraOutputs: ['out'] } },
  { id: '5', type: 'code', position: { x: 900, y: 260 }, data: { title: '代码执行', description: '执行脚本或转换逻辑', code: 'return input.map(item => item.id)', extraOutputs: ['out'] } },
  { id: '6', type: 'end', position: { x: 1160, y: 170 }, data: { title: '结束', description: '工作流结束', extraOutputs: [] } },
];

const dashedEdge = { style: { stroke: '#3b82f6', strokeWidth: 2.5 }, markerEnd: { type: 'arrowclosed' as const, color: '#3b82f6' } };
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, ...dashedEdge },
  { id: 'e2-3', source: '2', target: '3', animated: true, ...dashedEdge },
  { id: 'e3-4', source: '3', target: '4', label: '通过', sourceHandle: 'yes', targetHandle: 'in', ...dashedEdge },
  { id: 'e3-5', source: '3', target: '5', label: '不通过', sourceHandle: 'no', targetHandle: 'in', ...dashedEdge },
  { id: 'e4-6', source: '4', target: '6', animated: true, ...dashedEdge },
  { id: 'e5-6', source: '5', target: '6', animated: true, ...dashedEdge },
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
