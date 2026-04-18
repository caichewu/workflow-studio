import type { ReactNode } from 'react';
import { ArrowRight, Bot, CircleDot, Code2, Network, Shuffle } from 'lucide-react';
import { Handle, Position, type NodeTypes } from '@xyflow/react';
import { useWorkflowStore, type WorkflowNodeData } from '../store';
import { resolveAgentModel } from '../utils/resolveAgentModel';

function BaseNode({ title, data, color, icon, selected, allowInput = true, allowOutput = true, onAddOutput }: { title: string; data: WorkflowNodeData; color: string; icon: ReactNode; selected?: boolean; allowInput?: boolean; allowOutput?: boolean; onAddOutput?: () => void; }) {
  return <div className={`group relative min-w-[220px] rounded-2xl border px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition ${selected ? 'border-cyan-300 bg-sky-50' : 'border-slate-200 bg-white'} hover:border-sky-300`}>
    {allowInput && <Handle type="target" id="in" position={Position.Left} isConnectable style={{ top: '50%' }} className="!h-3 !w-3 !border-2 !border-white !bg-blue-500" />}
    {allowOutput && <Handle type="source" id="out" position={Position.Right} isConnectable style={{ top: '50%' }} className="!h-3 !w-3 !border-2 !border-white !bg-emerald-500" />}
    <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${color} text-white`}>{icon}</span><div><div className="text-sm font-semibold">{title}</div><div className="text-xs text-slate-400">{data.description}</div></div></div>
    {data.url && <div className="mt-2 text-xs text-slate-500">{data.method ?? 'GET'} {data.url}</div>}
    {onAddOutput && allowOutput && <button type="button" onClick={onAddOutput} className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-400">+</button>}
  </div>;
}

function NodeCard(props: { title: string; data: WorkflowNodeData; color: string; icon: ReactNode; selected?: boolean; allowInput?: boolean; allowOutput?: boolean; onAddOutput?: () => void }) {
  return <BaseNode {...props} />;
}

function AgentNode({ data, selected }: { data: WorkflowNodeData; selected?: boolean }) {
  const agents = useWorkflowStore((s) => s.agents);
  const selectedAgent = agents.find((agent) => agent.id === data.agentId);
  const actualModel = resolveAgentModel(data, selectedAgent);
  return <div className={`relative min-w-[280px] rounded-2xl border px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] ${selected ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'}`}>
    <Handle type="target" id="in" position={Position.Left} isConnectable style={{ top: '50%' }} className="!h-3 !w-3 !border-2 !border-white !bg-blue-500" />
    <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500 text-white"><Bot className="h-4 w-4" /></span><div><div className="text-sm font-semibold">AI代理</div><div className="text-xs text-slate-400">{selectedAgent ? `${selectedAgent.name} (${actualModel ?? selectedAgent.model})` : data.description}</div></div></div>
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600"><div className="text-slate-500">当前绑定</div><div className="mt-1 font-medium text-cyan-600">{selectedAgent?.name ?? '未绑定 Agent'}</div><div className="mt-1 text-slate-500">实际模型：{actualModel ?? '未设置'}</div></div>
    <Handle type="source" id="out" position={Position.Right} isConnectable style={{ top: '50%' }} className="!h-3 !w-3 !border-2 !border-white !bg-emerald-500" />
    {(data.extraOutputs ?? []).map((key) => <Handle key={key} type="source" id={key} position={Position.Right} isConnectable style={{ top: '50%', transform: 'translateY(18px)' }} className="!h-3 !w-3 !border-2 !border-white !bg-emerald-500" />)}
  </div>;
}

function ConditionNode({ data, selected }: { data: WorkflowNodeData; selected?: boolean }) {
  return <div className={`group relative min-w-[240px] rounded-2xl border px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] ${selected ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'} hover:border-amber-300`}>
    <Handle type="target" id="in" position={Position.Left} style={{ top: '50%' }} className="!h-3 !w-3 !border-2 !border-white !bg-blue-500" />
    <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-slate-950"><Shuffle className="h-4 w-4" /></span><div><div className="text-sm font-semibold">条件判断</div><div className="text-xs text-slate-400">{data.description}</div></div></div>
    <div className="mt-2 text-xs text-amber-600">{data.condition ?? 'condition'}</div>
    <Handle type="source" position={Position.Right} id="yes" isConnectable style={{ top: '35%' }} className="!h-3 !w-3 !border-2 !border-white !bg-emerald-500" />
    <Handle type="source" position={Position.Right} id="no" isConnectable style={{ top: '65%' }} className="!h-3 !w-3 !border-2 !border-white !bg-emerald-500" />
  </div>;
}

export const nodeTypes: NodeTypes = {
  start: ({ data, selected }) => <NodeCard title="开始" color="from-emerald-400 to-cyan-400" icon={<CircleDot className="h-4 w-4" />} data={data as WorkflowNodeData} selected={selected} allowInput={false} allowOutput />,
  end: ({ data, selected }) => <NodeCard title="结束" color="from-rose-400 to-orange-400" icon={<ArrowRight className="h-4 w-4" />} data={data as WorkflowNodeData} selected={selected} allowInput allowOutput={false} />,
  agent: ({ data, selected }) => <AgentNode data={data as WorkflowNodeData} selected={selected} />,
  condition: ({ data, selected }) => <ConditionNode data={data as WorkflowNodeData} selected={selected} />,
  api: ({ data, selected }) => <NodeCard title="API调用" color="from-violet-400 to-fuchsia-500" icon={<Network className="h-4 w-4" />} data={data as WorkflowNodeData} selected={selected} />,
  code: ({ data, selected }) => <NodeCard title="代码执行" color="from-pink-400 to-rose-500" icon={<Code2 className="h-4 w-4" />} data={data as WorkflowNodeData} selected={selected} />,
};
