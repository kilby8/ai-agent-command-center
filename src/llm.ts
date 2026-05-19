import axios from 'axios';
import { LLMResponse } from './types.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.MODEL || 'mistral';

export async function generateAgentThought(
  agentName: string,
  currentState: string,
  goals: string,
  nearbyAgents: string[]
): Promise<LLMResponse> {
  const prompt = `You are an AI agent named "${agentName}" in a virtual environment.

Current State:
${currentState}

Your Goals:
${goals}

Nearby agents: ${nearbyAgents.length > 0 ? nearbyAgents.join(', ') : 'None'}

Respond with ONE next action. Be concise. Options: move forward, turn left, turn right, think about goal, or interact with nearby agent.
Keep it under 50 words.`;

  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL,
      prompt,
      stream: false,
      temperature: 0.7,
    });

    return {
      text: response.data.response,
    };
  } catch (error) {
    console.error('LLM Error:', error);
    return { text: 'Waiting...' };
  }
}

export async function isOllamaReady(): Promise<boolean> {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, {
      timeout: 2000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}
