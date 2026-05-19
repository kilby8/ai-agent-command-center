# AI Agent Environment - Quick Start

## Running

```bash
cd ai-agent-env
docker compose up
```

**First run takes 5-10 minutes** — Ollama pulls the Mistral model (~4GB).

Once running:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3001/agents (via JSON)
- **Ollama**: http://localhost:11435 (not typically accessed directly)

## How It Works

1. **Create agents** via the web UI (top-left panel)
2. **Click "Spawn Agent"** to add a new agent to the 3D arena
3. **Click "Auto-Think"** to enable continuous agent reasoning
4. **Watch agents** think, move, and interact in real-time
5. **View agent states** in the right panel (position, energy, thoughts)

## Architecture

```
┌─────────────────┐
│  Three.js UI    │  (public/client.js)
│  3D Visualization
└────────┬────────┘
         │
┌────────▼────────┐
│  Express API    │  (src/server.ts)
│  Port 3000      │
├─────────────────┤
│ Agent Manager   │  (src/agents.ts)
│ State & Physics │
└────────┬────────┘
         │
┌────────▼────────┐
│  Ollama LLM     │  (src/llm.ts)
│  Port 11434     │  Mistral Model
│  Local Reasoning│
└─────────────────┘
```

## Files

- **Dockerfile** — Multi-stage Node.js build, TypeScript → ES modules
- **docker-compose.yml** — Ollama + API orchestration
- **src/server.ts** — Express app, REST API, static file serving
- **src/agents.ts** — Agent physics, movement, state management
- **src/llm.ts** — Ollama integration for agent thinking
- **public/index.html** — UI with controls and agent list
- **public/client.js** — Three.js scene, polling loop, interactions

## Environment Variables

```
NODE_ENV=production
OLLAMA_URL=http://ollama:11434
PORT=3000
```

## What Agents Do

Each agent:
1. **Thinks** via Ollama (LLM generates next action)
2. **Moves** based on thought (forward/left/right)
3. **Senses** nearby agents
4. **Updates** position and energy

Thoughts are visible in the UI as quotes under each agent.

## Extending

- **Add more models**: Modify `MODEL` in src/llm.ts (llama2, neural-chat, etc.)
- **WebSocket for real-time**: Replace polling with WebSocket in client.js
- **Multi-agent collision**: Add physics in agents.ts
- **Persistence**: Save agent states to a database
- **Visualization upgrades**: Add trails, labels, particle effects

## Troubleshooting

**"Connection refused"** — Ollama still downloading. Wait 5-10 minutes.

**"Ollama not ready"** — Check `docker compose logs ollama` for model pull progress.

**"Port 3001 already in use"** — Edit `docker-compose.yml` ports or stop existing containers.

**"Agents not moving"** — Enable Auto-Think; agents think on demand only.
