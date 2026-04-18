import { useWorkflowStore } from '../store';
import { paletteItems } from '../constants/models';
import { createNodeData } from '../utils/createNodeData';

export function WorkflowPalette() {
  const setNodes = useWorkflowStore((s) => s.setNodes);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const insertNode = (type: string) => {
    const id = `${type}-${Date.now()}`;
    setNodes((nds) => nds.concat({ id, type, position: { x: 120 + Math.random() * 160, y: 120 + Math.random() * 160 }, data: createNodeData(type) }));
    selectNode(id);
  };

  return <div className="space-y-4"><div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-xs text-sky-700">从这里拖拽节点到画布，或点击“+”直接插入。</div><div className="grid gap-3">{paletteItems.map((item) => <div key={item.type} className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-300" onClick={() => insertNode(item.type)}><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 ring-1 ring-sky-100">{item.title.slice(0, 1)}</div><div><div className="font-medium">{item.title}</div><div className="mt-0.5 text-xs text-slate-500">{item.description}</div></div></div><button className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-400">+</button></div></div>)}</div></div>;
}
