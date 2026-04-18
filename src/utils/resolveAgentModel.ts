import { MODEL_OVERRIDE_DEFAULT, type WorkflowNodeData } from '../store';
import type { Agent } from '../types';

export function resolveAgentModel(data: WorkflowNodeData, agent?: Agent | null) {
  if (data.overrideModel && data.overrideModel !== MODEL_OVERRIDE_DEFAULT) {
    return data.overrideModel;
  }
  return agent?.model ?? 'gpt-4';
}
