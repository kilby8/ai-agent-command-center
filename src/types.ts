export interface Agent {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  thinking: string;
  lastThought: string;
  energy: number;
  goal: string;
}

export interface AgentAction {
  type: 'move' | 'think' | 'interact';
  target?: string;
  direction?: { x: number; y: number };
  distance?: number;
}

export interface LLMResponse {
  text: string;
  action?: AgentAction;
}
