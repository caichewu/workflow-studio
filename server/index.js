import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const http = axios.create({ timeout: 15000 });

const baseLogs = (message, level = 'info') => [{ level, message }];

app.get('/api/health', async (_req, res) => {
  try {
    const ollama = await http.get(`${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/tags`);
    res.json({ ok: true, message: 'ok', ollama: ollama.data });
  } catch (error) {
    res.status(503).json({ ok: false, message: 'Ollama unavailable', error: error instanceof Error ? error.message : 'unknown error' });
  }
});

app.get('/api/models', async (_req, res) => {
  try {
    const response = await http.get(`${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/tags`);
    const models = Array.isArray(response.data?.models)
      ? response.data.models.map((model) => model?.name).filter(Boolean)
      : [];
    res.json({ ok: true, models });
  } catch (error) {
    res.status(503).json({ ok: false, message: '无法获取模型列表', error: error instanceof Error ? error.message : 'unknown error', models: [] });
  }
});

app.post('/api/chat', async (req, res) => {
  const { model = 'llama3:8b', messages = [] } = req.body ?? {};
  try {
    const response = await http.post(`${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/chat`, {
      model,
      messages,
      stream: false,
    });
    res.json({ ok: true, data: response.data });
  } catch (error) {
    res.status(500).json({ ok: false, message: '聊天调用失败', error: error instanceof Error ? error.message : 'unknown error' });
  }
});

app.post('/api/workflow/execute', async (req, res) => {
  const { nodes = [], edges = [] } = req.body ?? {};
  const logs = [...baseLogs('接收到工作流执行请求')];
  const startNodes = nodes.filter((node) => node.type === 'start');
  const endNodes = nodes.filter((node) => node.type === 'end');
  if (!startNodes.length || !endNodes.length) {
    return res.status(400).json({ ok: false, message: '工作流缺少开始或结束节点', logs: [...logs, { level: 'error', message: '校验失败：缺少开始或结束节点' }] });
  }

  const connected = new Set();
  edges.forEach((edge) => { connected.add(edge.source); connected.add(edge.target); });
  const unconnected = nodes.filter((node) => node.type !== 'start' && node.type !== 'end' && !connected.has(node.id));
  if (unconnected.length) {
    return res.status(400).json({ ok: false, message: '存在未连接节点', logs: [...logs, { level: 'error', message: `未连接节点：${unconnected.map((node) => node.data?.title ?? node.id).join('、')}` }] });
  }

  const executionOrder = nodes.map((node, index) => ({ nodeId: node.id, title: node.data?.title ?? node.id, index }));
  for (const item of executionOrder) {
    logs.push({ level: 'info', message: `执行节点：${item.title}` });
  }
  logs.push({ level: 'success', message: '工作流执行完成' });
  res.json({ ok: true, logs, result: { executed: executionOrder.length } });
});

app.listen(PORT, () => {
  console.log(`Workflower server listening on http://localhost:${PORT}`);
});
