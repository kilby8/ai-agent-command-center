import { Agent } from './types.js';
import { v4 as uuid } from 'uuid';

const ARENA_SIZE = 100;
const AGENT_SPEED = 0.3;
const AGENT_RADIUS = 2;
const COLLISION_DISTANCE = AGENT_RADIUS * 2;

export interface AgentMemory {
  interactions: Array<{ agentId: string; agentName: string; timestamp: number; message: string }>;
  discoveries: Array<{ position: { x: number; z: number }; timestamp: number; type: string }>;
}

export interface EnhancedAgent extends Agent {
  memory: AgentMemory;
  velocity: { x: number; z: number };
  direction: number;
  lastInteraction: string;
  resourcesCollected: number;
  range: number;
}

export class AgentManager {
  private agents: Map<string, EnhancedAgent> = new Map();
  private environmentalObjects: Array<{ id: string; position: { x: number; z: number }; type: string; value: number }> = [];

  constructor() {
    this.initializeEnvironment();
  }

  private initializeEnvironment(): void {
    for (let i = 0; i < 5; i++) {
      this.environmentalObjects.push({
        id: uuid(),
        position: {
          x: Math.random() * ARENA_SIZE,
          z: Math.random() * ARENA_SIZE,
        },
        type: 'resource',
        value: Math.random() * 100,
      });
    }
  }

  createAgent(name: string, goal: string): EnhancedAgent {
    const agent: EnhancedAgent = {
      id: uuid(),
      name,
      position: {
        x: Math.random() * ARENA_SIZE,
        y: 0,
        z: Math.random() * ARENA_SIZE,
      },
      thinking: '',
      lastThought: '',
      energy: 100,
      goal,
      velocity: { x: 0, z: 0 },
      direction: Math.random() * Math.PI * 2,
      lastInteraction: '',
      resourcesCollected: 0,
      range: 25,
      memory: {
        interactions: [],
        discoveries: [],
      },
    };
    this.agents.set(agent.id, agent);
    return agent;
  }

  getAgent(id: string): EnhancedAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): EnhancedAgent[] {
    return Array.from(this.agents.values());
  }

  updateAgentThought(id: string, thought: string): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.lastThought = agent.thinking;
      agent.thinking = thought;
    }
  }

  moveAgent(id: string, direction: { x: number; z: number }): void {
    const agent = this.agents.get(id);
    if (agent && agent.energy > 0) {
      agent.velocity.x = direction.x * AGENT_SPEED;
      agent.velocity.z = direction.z * AGENT_SPEED;

      agent.position.x = Math.max(
        AGENT_RADIUS,
        Math.min(ARENA_SIZE - AGENT_RADIUS, agent.position.x + agent.velocity.x)
      );
      agent.position.z = Math.max(
        AGENT_RADIUS,
        Math.min(ARENA_SIZE - AGENT_RADIUS, agent.position.z + agent.velocity.z)
      );

      agent.energy = Math.max(0, agent.energy - 0.5);

      if (agent.velocity.x !== 0 || agent.velocity.z !== 0) {
        agent.direction = Math.atan2(agent.velocity.z, agent.velocity.x);
      }

      this.checkCollisions(id);
      this.checkResourceCollection(id);
    }
  }

  private checkCollisions(id: string): void {
    const agent = this.agents.get(id);
    if (!agent) return;

    for (const [otherId, other] of this.agents) {
      if (otherId === id) continue;
      const dist = Math.hypot(
        other.position.x - agent.position.x,
        other.position.z - agent.position.z
      );

      if (dist < COLLISION_DISTANCE) {
        const angle = Math.atan2(
          other.position.z - agent.position.z,
          other.position.x - agent.position.x
        );
        agent.position.x -= Math.cos(angle) * 0.5;
        agent.position.z -= Math.sin(angle) * 0.5;
        agent.energy -= 0.1;
      }
    }
  }

  private checkResourceCollection(id: string): void {
    const agent = this.agents.get(id);
    if (!agent) return;

    this.environmentalObjects = this.environmentalObjects.filter((obj) => {
      const dist = Math.hypot(obj.position.x - agent.position.x, obj.position.z - agent.position.z);
      if (dist < AGENT_RADIUS + 2) {
        agent.resourcesCollected += obj.value;
        agent.energy = Math.min(100, agent.energy + 20);
        agent.memory.discoveries.push({
          position: obj.position,
          timestamp: Date.now(),
          type: obj.type,
        });
        return false;
      }
      return true;
    });

    if (this.environmentalObjects.length < 5) {
      this.environmentalObjects.push({
        id: uuid(),
        position: {
          x: Math.random() * ARENA_SIZE,
          z: Math.random() * ARENA_SIZE,
        },
        type: 'resource',
        value: Math.random() * 100,
      });
    }
  }

  getNearbyAgents(id: string, radius: number = 25): Array<{ id: string; name: string; distance: number }> {
    const agent = this.agents.get(id);
    if (!agent) return [];

    return Array.from(this.agents.values())
      .filter((other) => {
        if (other.id === id) return false;
        const dist = Math.hypot(
          other.position.x - agent.position.x,
          other.position.z - agent.position.z
        );
        return dist < radius;
      })
      .map((a) => ({
        id: a.id,
        name: a.name,
        distance: Math.hypot(
          a.position.x - agent.position.x,
          a.position.z - agent.position.z
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  getEnvironmentalObjects() {
    return this.environmentalObjects;
  }

  recordInteraction(agentId: string, targetName: string, message: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.memory.interactions.push({
        agentId: targetName,
        agentName: targetName,
        timestamp: Date.now(),
        message,
      });
      agent.lastInteraction = message;
    }
  }

  removeAgent(id: string): void {
    this.agents.delete(id);
  }

  getStats() {
    const agents = this.getAllAgents();
    return {
      totalAgents: agents.length,
      avgEnergy: agents.reduce((sum, a) => sum + a.energy, 0) / (agents.length || 1),
      totalResourcesCollected: agents.reduce((sum, a) => sum + a.resourcesCollected, 0),
      resourcesInArena: this.environmentalObjects.length,
      agentsThinking: agents.filter((a) => a.thinking.length > 0).length,
    };
  }
}

export const agentManager = new AgentManager();
