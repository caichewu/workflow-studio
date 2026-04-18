export interface Agent {
  id: string;
  name: string;
  description: string;
  coreFiles: string[];
  model: string;
  dataConnection: string;
  skills: string[];
  createdAt: number;
  updatedAt: number;
}

export type PanelTab = 'workflow' | 'agent' | 'settings';
