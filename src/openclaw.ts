import axios from 'axios';
import { chatWithOllama } from './llm.js';

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://localhost:18789';

export async function chatWithOpenClaw(message: string): Promise<string> {
  try {
    const response = await axios.post(
      `${OPENCLAW_URL}/api/chat`,
      { message, sessionId: 'command-center' },
      { timeout: 3000 }
    );
    return response.data.response || response.data.message;
  } catch (error) {
    console.log('OpenClaw unavailable, falling back to Ollama...');
    try {
      const response = await chatWithOllama(message);
      return response;
    } catch (ollama_error) {
      console.error('Ollama error:', ollama_error);
      return 'Unable to generate response.';
    }
  }
}

export async function queryVault(query: string): Promise<Array<{ path: string; content: string; score: number }>> {
  try {
    const response = await axios.get(`${OPENCLAW_URL}/api/memory/search`, {
      params: { query, limit: 5 },
      timeout: 3000,
    });
    return response.data.results || [];
  } catch (error) {
    console.error('Vault query error:', error);
    return [];
  }
}

export async function indexVault(): Promise<boolean> {
  try {
    await axios.post(`${OPENCLAW_URL}/api/memory/index`, {}, { timeout: 3000 });
    return true;
  } catch (error) {
    console.error('Index error:', error);
    return false;
  }
}

export async function getVaultStatus(): Promise<{ indexed: boolean; fileCount: number; lastIndexed: number }> {
  try {
    const response = await axios.get(`${OPENCLAW_URL}/api/memory/status`, { timeout: 3000 });
    return response.data;
  } catch (error) {
    return { indexed: false, fileCount: 0, lastIndexed: 0 };
  }
}
