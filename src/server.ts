import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { agentManager } from './agents.js';
import { generateAgentThought, isOllamaReady } from './llm.js';
import { chatWithOpenClaw, queryVault, indexVault, getVaultStatus } from './openclaw.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

let chatHistory: Array<{ id: string; role: string; content: string; timestamp: number }> = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

function broadcastState() {
  const state = {
    agents: agentManager.getAllAgents(),
    objects: agentManager.getEnvironmentalObjects(),
    stats: agentManager.getStats(),
    timestamp: Date.now(),
  };

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'state', data: state }));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Client connected');
  broadcastState();

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

setInterval(broadcastState, 500);

app.get('/health', async (req, res) => {
  const ollamaReady = await isOllamaReady();
  const vaultStatus = await getVaultStatus();
  res.json({ 
    status: 'ok', 
    ollama: ollamaReady,
    vault: vaultStatus 
  });
});

app.post('/agents', (req, res) => {
  const { name, goal } = req.body;
  if (!name || !goal) {
    return res.status(400).json({ error: 'name and goal required' });
  }
  const agent = agentManager.createAgent(name, goal);
  res.json(agent);
});

app.get('/agents', (req, res) => {
  res.json(agentManager.getAllAgents());
});

app.get('/agents/:id', (req, res) => {
  const agent = agentManager.getAgent(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

app.post('/agents/:id/think', async (req, res) => {
  const agent = agentManager.getAgent(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const nearby = agentManager.getNearbyAgents(req.params.id);
  const resources = agentManager.getEnvironmentalObjects().filter((obj) => {
    const dist = Math.hypot(obj.position.x - agent.position.x, obj.position.z - agent.position.z);
    return dist < agent.range;
  });

  const state = `Position: (${agent.position.x.toFixed(1)}, ${agent.position.z.toFixed(1)}), Energy: ${agent.energy.toFixed(1)}, Resources: ${agent.resourcesCollected}`;

  const response = await generateAgentThought(agent.name, state, agent.goal, nearby.map((a) => a.name));

  agentManager.updateAgentThought(req.params.id, response.text);

  const text = response.text.toLowerCase();
  if (text.includes('forward') || text.includes('ahead')) {
    agentManager.moveAgent(req.params.id, {
      x: Math.cos(agent.direction),
      z: Math.sin(agent.direction),
    });
  } else if (text.includes('left')) {
    const newDir = agent.direction + Math.PI / 4;
    agentManager.moveAgent(req.params.id, {
      x: Math.cos(newDir),
      z: Math.sin(newDir),
    });
  } else if (text.includes('right')) {
    const newDir = agent.direction - Math.PI / 4;
    agentManager.moveAgent(req.params.id, {
      x: Math.cos(newDir),
      z: Math.sin(newDir),
    });
  } else if (text.includes('collect') && resources.length > 0) {
    const targetResource = resources[0];
    agentManager.moveAgent(req.params.id, {
      x: targetResource.position.x - agent.position.x,
      z: targetResource.position.z - agent.position.z,
    });
  }

  if (nearby.length > 0 && text.includes('interact')) {
    agentManager.recordInteraction(req.params.id, nearby[0].name, response.text);
  }

  broadcastState();

  res.json({
    thought: response.text,
    agent: agentManager.getAgent(req.params.id),
    nearby,
    resources,
  });
});

app.delete('/agents/:id', (req, res) => {
  agentManager.removeAgent(req.params.id);
  broadcastState();
  res.json({ success: true });
});

app.get('/stats', (req, res) => {
  res.json(agentManager.getStats());
});

// Chat with OpenClaw
app.get('/chat/history', (req, res) => {
  res.json(chatHistory);
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  chatHistory.push({
    id: uuid(),
    role: 'user',
    content: message,
    timestamp: Date.now(),
  });

  try {
    // Try OpenClaw first, fallback to Ollama
    const responseText = await chatWithOpenClaw(message);

    const assistantMessage = {
      id: uuid(),
      role: 'assistant',
      content: responseText,
      timestamp: Date.now(),
    };

    chatHistory.push(assistantMessage);
    if (chatHistory.length > 100) chatHistory.shift();

    res.json(assistantMessage);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.post('/chat/clear', (req, res) => {
  chatHistory = [];
  res.json({ success: true });
});

// Vault integration
app.get('/vault/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query required' });

  const results = await queryVault(query as string);
  res.json(results);
});

app.post('/vault/index', async (req, res) => {
  const success = await indexVault();
  res.json({ success });
});

app.get('/vault/status', async (req, res) => {
  const status = await getVaultStatus();
  res.json(status);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Agent Environment API running on port ${PORT}`);
  console.log(`OpenClaw Gateway: ${process.env.OPENCLAW_URL || 'http://localhost:18789'}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
});
