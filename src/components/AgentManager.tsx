import { useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { MODEL_OVERRIDE_DEFAULT, useWorkflowStore } from '../store';
import type { Agent } from '../types';
import { modelOptions, sampleAgents } from '../constants/models';

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function AgentManager({ draft, setDraft, agents }: { draft: Partial<Agent>; setDraft: (v: Partial<Agent>) => void; agents: Agent[] }) {
  const addAgent = useWorkflowStore((s) => s.addAgent);
  const removeAgent = useWorkflowStore((s) => s.removeAgent);
  const selectedAgentId = useWorkflowStore((s) => s.selectedAgentId);
  const selectAgent = useWorkflowStore((s) => s.selectAgent);

  useEffect(() => {
    if (!agents.length) {
      sampleAgents.forEach((a) => addAgent({ id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, name: a.name!, description: a.description!, coreFiles: a.coreFiles!, model: a.model!, dataConnection: a.dataConnection!, skills: a.skills!, createdAt: Date.now(), updatedAt: Date.now() }));
    }
  }, [agents.length, addAgent]);

  const createAgent = () => {
    if (!draft.name || !draft.description) return;
    const now = Date.now();
    addAgent({ id: `agent-${now}`, name: draft.name, description: draft.description, coreFiles: draft.coreFiles ?? [], model: draft.model ?? 'gpt-4', dataConnection: draft.dataConnection ?? '', skills: draft.skills ?? [], createdAt: now, updatedAt: now });
    setDraft({ name: '', description: '', model: 'gpt-4', dataConnection: '', coreFiles: [], skills: [] });
  };

  return <div className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center gap-2 text-sm font-medium"><Plus className="h-4 w-4" /> 新建 Agent</div><div className="space-y-2 text-sm"><input className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Agent 名称" value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /><textarea className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="职责描述" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /><select className="w-full rounded-xl border border-slate-200 px-3 py-2" value={draft.model ?? 'gpt-4'} onChange={(e) => setDraft({ ...draft, model: e.target.value })}>{modelOptions.filter((item) => item !== MODEL_OVERRIDE_DEFAULT).map((m) => <option key={m} value={m}>{m}</option>)}</select><input className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="数据连接 / 文件目录" value={draft.dataConnection ?? ''} onChange={(e) => setDraft({ ...draft, dataConnection: e.target.value })} /><input className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="核心文件，逗号分隔" value={(draft.coreFiles ?? []).join(', ')} onChange={(e) => setDraft({ ...draft, coreFiles: splitList(e.target.value) })} /><input className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="技能，逗号分隔" value={(draft.skills ?? []).join(', ')} onChange={(e) => setDraft({ ...draft, skills: splitList(e.target.value) })} /><button onClick={createAgent} className="w-full rounded-xl bg-cyan-500 px-3 py-2 font-medium text-white">保存 Agent</button></div></div><div className="space-y-3">{agents.map((agent) => <div key={agent.id} className={`rounded-2xl border p-4 shadow-sm ${selectedAgentId === agent.id ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white'}`}><div className="flex items-start justify-between"><div><div className="font-medium">{agent.name}</div><div className="text-xs text-slate-500">{agent.model}</div></div><div className="flex gap-1"><button onClick={() => selectAgent(agent.id)} className="rounded-md bg-slate-100 px-2 py-1 text-xs">查看</button><button onClick={() => removeAgent(agent.id)} className="rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-600"><Trash2 className="h-3 w-3" /></button></div></div><p className="mt-2 text-sm text-slate-600">{agent.description}</p><div className="mt-3 flex flex-wrap gap-2">{agent.skills.map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{skill}</span>)}</div></div>)}</div></div>;
}
