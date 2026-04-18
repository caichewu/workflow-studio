import { useState } from 'react';
import { useWorkflowStore } from '../store';

export function SettingsPanel() {
  const settings = useWorkflowStore((s) => s.settings);
  const setSettings = useWorkflowStore((s) => s.setSettings);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState('');

  const testConnection = async () => {
    setTesting(true);
    setResult('');
    try {
      const res = await fetch(`${settings.ollamaUrl.replace(/\/$/, '')}/api/tags`);
      setResult(res.ok ? '连接成功' : '连接失败');
    } catch {
      setResult('连接失败');
    }
    setTesting(false);
  };

  return <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm"><div className="font-medium">工作台设置</div><div><div className="mb-1 text-xs text-slate-400">Ollama 地址</div><div className="flex gap-2"><input className="w-full rounded-xl border border-slate-200 px-3 py-2" value={settings.ollamaUrl} onChange={(e) => setSettings({ ollamaUrl: e.target.value })} /><button onClick={testConnection} className="rounded-xl bg-cyan-500 px-3 py-2 text-white" disabled={testing}>{testing ? '测试中...' : '连接测试'}</button></div>{result && <div className="mt-2 text-xs text-slate-500">{result}</div>}</div></div>;
}
