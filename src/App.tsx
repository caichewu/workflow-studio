import { useRef, useState } from 'react';
import { Bot, Download, Layers3, Play, Settings, Sparkles, Upload } from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from './store';
import { useBackendHealth } from './hooks/useBackendHealth';
import type { Agent, PanelTab } from './types';
import { AgentManager } from './components/AgentManager';
import { ConfigPanel } from './components/ConfigPanel';
import { FlowCanvas } from './components/FlowCanvas';
import { SettingsPanel } from './components/SettingsPanel';
import { WorkflowPalette } from './components/WorkflowPalette';

export default function App() {
  return <ReactFlowProvider><Shell /></ReactFlowProvider>;
}

function Shell() {
  const exportJson = useWorkflowStore((s) => s.exportJson);
  const importJson = useWorkflowStore((s) => s.importJson);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const health = useBackendHealth();

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    importJson(await file.text());
  };

  return (
    <div className="flex h-screen bg-[#eef3fb] text-slate-900">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col bg-[#eef3fb]">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Workflower Editor</h1>
            <p className="text-sm text-slate-500">OpenClaw 风格工作流编辑器</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium md:flex ${health === 'connected' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              <span className={`h-2 w-2 rounded-full ${health === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {health === 'connected' ? '已连接' : '未连接'}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"><Upload className="h-4 w-4" /> 导入</button>
            <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-600"><Download className="h-4 w-4" /> 导出</button>
            <button onClick={() => setIsRunning((v) => !v)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm ${isRunning ? 'bg-rose-500 text-white' : 'bg-sky-500 text-white hover:bg-sky-600'}`}><Play className="h-4 w-4" />{isRunning ? '停止运行' : '运行工作流'}</button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFile} />
          </div>
        </header>
        <section className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_360px] gap-4 p-4">
          <FlowCanvas isRunning={isRunning} healthOk={health === 'connected'} onRunToggle={setIsRunning} />
          <ConfigPanel />
        </section>
      </main>
    </div>
  );
}

function Sidebar() {
  const activeTab = useWorkflowStore((s) => s.activeTab);
  const setActiveTab = useWorkflowStore((s) => s.setActiveTab);
  const agents = useWorkflowStore((s) => s.agents);
  const [draft, setDraft] = useState<Partial<Agent>>({ name: '', description: '', model: 'gpt-4', dataConnection: '', coreFiles: [], skills: [] });
  const tabs: { id: PanelTab; label: string; icon: JSX.Element }[] = [
    { id: 'workflow', label: '工作流', icon: <Layers3 className="h-4 w-4" /> },
    { id: 'agent', label: 'Agent 管理', icon: <Bot className="h-4 w-4" /> },
    { id: 'settings', label: '设置', icon: <Settings className="h-4 w-4" /> },
  ];

  return <aside className="flex w-[300px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20"><Sparkles className="h-5 w-5" /></div><div><div className="font-semibold">Workflow Studio</div><div className="text-xs text-slate-500">Agent × Flow Builder</div></div></div></div><div className="grid grid-cols-3 gap-2 border-b border-slate-200 p-3">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-xl px-3 py-2 text-sm ${activeTab === tab.id ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}><div className="flex items-center justify-center gap-2">{tab.icon}<span>{tab.label}</span></div></button>)}</div><div className="min-h-0 flex-1 overflow-y-auto p-4">{activeTab === 'workflow' && <WorkflowPalette />}{activeTab === 'agent' && <AgentManager draft={draft} setDraft={setDraft} agents={agents} />}{activeTab === 'settings' && <SettingsPanel />}</div></aside>;
}
