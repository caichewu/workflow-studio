import { MODEL_OVERRIDE_DEFAULT } from '../store';
import type { Agent } from '../types';

export const paletteItems = [
  { type: 'start', title: '开始', description: '工作流入口' },
  { type: 'end', title: '结束', description: '工作流出口' },
  { type: 'agent', title: 'AI代理', description: '绑定预定义 Agent' },
  { type: 'condition', title: '条件判断', description: '双分支判断' },
  { type: 'api', title: 'API调用', description: 'HTTP 请求' },
  { type: 'code', title: '代码执行', description: '脚本处理' },
] as const;

export const modelOptions = [
  MODEL_OVERRIDE_DEFAULT,
  'llama3:8b',
  'qwen2.5:1.5b',
  'qwen2.5:0.5b',
  'myai:latest',
  'myassistant:latest',
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3',
] as const;

export const modelLabelMap: Record<string, string> = {
  [MODEL_OVERRIDE_DEFAULT]: '使用 Agent 默认',
};

export const sampleAgents: Partial<Agent>[] = [
  { name: '文案助手', description: '负责营销文案、标题优化与摘要生成', model: 'qwen2.5:1.5b', dataConnection: '/data/copy', coreFiles: ['src/agents/copy.ts'], skills: ['写作', '润色', '摘要'] },
  { name: '代码助手', description: '负责代码生成、重构建议与测试辅助', model: 'llama3:8b', dataConnection: '/data/code', coreFiles: ['src/agents/code.ts'], skills: ['代码生成', '重构', '测试'] },
  { name: '客服机器人', description: '负责问题答疑、工单分流与上下文回复', model: 'myassistant:latest', dataConnection: '/data/support', coreFiles: ['src/agents/support.ts'], skills: ['答疑', '分流', '客服'] },
];
