import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Logs } from 'lucide-react';
import { addEdge, Background, BackgroundVariant, Connection, ConnectionLineType, ConnectionMode, Controls, type Edge, type NodeChange, MiniMap, ReactFlow, reconnectEdge, useEdgesState, useNodesState, useReactFlow } from '@xyflow/react';
import { useWorkflowStore, validateWorkflow } from '../store';
import { paletteItems } from '../constants/models';
import { createNodeData } from '../utils/createNodeData';
import { resolveAgentModel } from '../utils/resolveAgentModel';
import { nodeTypes } from './nodeTypes';

export function FlowCanvas({ isRunning, healthOk, onRunToggle }: { isRunning: boolean; healthOk: boolean; onRunToggle: (v: boolean) => void }) {
  const { screenToFlowPosition, setViewport } = useReactFlow();
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const setNodes = useWorkflowStore((s) => s.setNodes);
  const setEdges = useWorkflowStore((s) => s.setEdges);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const duplicateNode = useWorkflowStore((s) => s.duplicateNode);
  const removeNode = useWorkflowStore((s) => s.removeNode);
  const addLog = useWorkflowStore((s) => s.addLog);
  const clearLogs = useWorkflowStore((s) => s.clearLogs);
  const logs = useWorkflowStore((s) => s.logs);
  const agents = useWorkflowStore((s) => s.agents);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const [localNodes, localSetNodes, onNodesChange] = useNodesState(nodes);
  const [localEdges, localSetEdges, onEdgesChange] = useEdgesState(edges);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; type: 'node' | 'edge' | 'pane'; nodeId?: string; edgeId?: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 }); }, [setViewport]);
  useEffect(() => { localSetNodes(nodes); }, [nodes, localSetNodes]);
  useEffect(() => { localSetEdges(edges); }, [edges, localSetEdges]);

  const edgeTemplate = { type: 'step' as const, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2.5 }, markerEnd: { type: 'arrowclosed' as const, color: '#3b82f6' } };
  const onConnect = (connection: Connection) => {
    if (connection.sourceHandle && connection.sourceHandle !== 'out' && !connection.sourceHandle.startsWith('out-')) return;
    if (connection.targetHandle && connection.targetHandle !== 'in') return;
    setEdges((eds) => addEdge({ ...connection, ...edgeTemplate }, eds));
  };
  const onReconnect = (oldEdge: Edge, newConnection: Connection) => setEdges((eds) => reconnectEdge(oldEdge, { ...newConnection, ...edgeTemplate }, eds));

  const validateAndExecute = async () => {
    const check = validateWorkflow(localNodes, localEdges);
    clearLogs();
    if (check.issues.length) {
      check.issues.forEach((m) => addLog({ level: 'error', message: m }));
      return;
    }
    if (!healthOk) {
      addLog({ level: 'error', message: '后端未连接，无法执行工作流' });
      return;
    }
    addLog({ level: 'info', message: '开始执行工作流...' });
    onRunToggle(true);
    try {
      const executionNodes = localNodes.map((node) => {
        if (node.type !== 'agent') return node;
        const agent = agents.find((item) => item.id === node.data.agentId);
        const resolvedModel = resolveAgentModel(node.data, agent);
        return { ...node, data: { ...node.data, resolvedModel } };
      });
      const res = await fetch('http://localhost:3001/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: executionNodes, edges: localEdges }),
      });
      const data = await res.json();
      (data.logs ?? []).forEach((item: any) => addLog({ level: item.level ?? 'info', message: item.message ?? String(item) }));
      if (!res.ok) throw new Error(data?.message || '执行失败');
      addLog({ level: 'success', message: '工作流执行完成' });
    } catch (e) {
      addLog({ level: 'error', message: e instanceof Error ? e.message : '执行失败' });
    } finally {
      onRunToggle(false);
    }
  };

  const addNodeAt = (type: string, x: number, y: number) => {
    const position = screenToFlowPosition({ x, y });
    const id = `${type}-${Date.now()}`;
    setNodes((nds) => nds.concat({ id, type, position, data: createNodeData(type) }));
    selectNode(id);
  };

  const selectedNode = localNodes.find((n) => n.id === selectedNodeId) ?? null;
  const addOutputToSelectedNode = () => {
    if (!selectedNode) return;
    const current = selectedNode.data.extraOutputs ?? [];
    updateNode(selectedNode.id, { extraOutputs: [...current, `out-${current.length + 1}`] });
  };

  return <div className="relative h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="absolute left-4 top-4 z-10 flex gap-2"><button onClick={validateAndExecute} className="rounded-full bg-sky-500 px-3 py-1 text-xs font-medium text-white shadow-sm">运行工作流</button><button onClick={() => setCollapsed((v) => !v)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs">{collapsed ? '展开日志' : '收起日志'}</button></div>{isRunning && <div className="absolute left-4 top-14 z-10 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white">工作流运行中</div>}{menu && <div className="absolute z-50 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl" style={{ left: menu.x, top: menu.y }}>{menu.type === 'node' && <><button className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { if (menu.nodeId) duplicateNode(menu.nodeId); setMenu(null); }}>复制节点</button><button className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50" onClick={() => { if (menu.nodeId) removeNode(menu.nodeId); setMenu(null); }}>删除节点</button></>}{menu.type === 'edge' && <button className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50" onClick={() => { if (menu.edgeId) setEdges((eds) => eds.filter((edge) => edge.id !== menu.edgeId)); setMenu(null); }}>删除连线</button>}{menu.type === 'pane' && paletteItems.map((item) => <button key={item.type} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { addNodeAt(item.type, menu.x, menu.y); setMenu(null); }}>{item.title}</button>)}</div>}<ReactFlow nodes={localNodes} edges={localEdges} nodeTypes={nodeTypes} connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2.5 }} connectionLineType={ConnectionLineType.Step} connectionMode={ConnectionMode.Strict} snapToGrid snapGrid={[16, 16]} onNodesChange={onNodesChange as (changes: NodeChange[]) => void} onEdgesChange={onEdgesChange} onConnect={onConnect} onReconnect={onReconnect} onNodeClick={(_, node) => selectNode(node.id)} onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)} onNodeContextMenu={(e, node) => { e.preventDefault(); selectNode(node.id); setMenu({ x: e.clientX, y: e.clientY, type: 'node', nodeId: node.id }); }} onEdgeContextMenu={(e, edge) => { e.preventDefault(); setSelectedEdgeId(edge.id); setMenu({ x: e.clientX, y: e.clientY, type: 'edge', edgeId: edge.id }); }} onPaneContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, type: 'pane' }); }} onPaneClick={() => { setSelectedEdgeId(null); setMenu(null); }} fitView fitViewOptions={{ padding: 0.2, minZoom: 0.2, maxZoom: 1.5 }} proOptions={{ hideAttribution: true }} defaultEdgeOptions={{ type: 'step', style: { stroke: '#3b82f6', strokeWidth: 2.5 }, markerEnd: { type: 'arrowclosed', color: '#3b82f6' }, reconnectable: true }} nodeExtent={[[-4000, -4000], [4000, 4000]]}><Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(148,163,184,0.18)" /><Controls /><MiniMap zoomable pannable nodeColor={(node) => node.type === 'agent' ? '#0ea5e9' : node.type === 'condition' ? '#f59e0b' : node.type === 'api' ? '#8b5cf6' : node.type === 'code' ? '#ec4899' : node.type === 'start' ? '#10b981' : node.type === 'end' ? '#ef4444' : '#475569'} /></ReactFlow><div className={`absolute inset-x-4 bottom-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all ${collapsed ? 'h-12' : 'h-52'}`}><button className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-sm font-medium" onClick={() => setCollapsed((v) => !v)}><span className="flex items-center gap-2"><Logs className="h-4 w-4" /> 运行日志</span>{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button><div className="h-[calc(100%-48px)] overflow-y-auto p-4 text-xs text-slate-600">{logs.length ? logs.map((log) => <div key={log.id} className="mb-2 flex items-start gap-2"><span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${log.level === 'error' ? 'bg-rose-500' : log.level === 'success' ? 'bg-emerald-500' : log.level === 'warn' ? 'bg-amber-500' : 'bg-sky-500'}`} /><div><div className="font-medium">{new Date(log.timestamp).toLocaleTimeString()}</div><div>{log.message}</div></div></div>) : <div className="text-slate-400">暂无运行日志</div>}</div></div><div className="absolute right-4 top-4 flex gap-2"><button onClick={() => selectedNode && duplicateNode(selectedNode.id)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><Copy className="mr-1 inline h-3 w-3" />复制节点</button><button onClick={() => selectedNode && removeNode(selectedNode.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">删除节点</button><button onClick={addOutputToSelectedNode} disabled={!selectedNode || selectedNode.type === 'end'} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 disabled:opacity-50">添加输出锚点</button></div></div>;
}
