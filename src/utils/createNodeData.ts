import { MODEL_OVERRIDE_DEFAULT, type WorkflowNodeData } from '../store';

export function createNodeData(type: string): WorkflowNodeData {
  switch (type) {
    case 'start':
      return { title: '开始', description: '工作流起点' };
    case 'end':
      return { title: '结束', description: '工作流终点' };
    case 'agent':
      return { title: 'AI代理', description: '选择预定义 Agent 执行任务', agentId: 'agent-docs', overrideModel: MODEL_OVERRIDE_DEFAULT };
    case 'condition':
      return { title: '条件判断', description: '检查输出结果', condition: 'result.success === true' };
    case 'api':
      return { title: 'API调用', description: '调用外部 HTTP 接口', method: 'GET', url: 'https://api.example.com/data' };
    case 'code':
      return { title: '代码执行', description: '执行脚本或转换逻辑', code: 'return input.map(item => item.id)' };
    default:
      return { title: '节点', description: '自定义节点' };
  }
}
