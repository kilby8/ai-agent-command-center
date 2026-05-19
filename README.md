# AI Agent Environment

A containerized AI agent simulation powered by local LLMs (Ollama) with a 3D web visualization built with Three.js.

## Features

- **Local LLM Reasoning**: Each agent thinks using Ollama (Mistral by default)
- **3D Visualization**: Three.js rendering of agents in an interactive arena
- **Real-time Updates**: Polling-based state updates and WebGL animation
- **Full Docker Stack**: Ollama + Node.js API + static frontend, all containerized
- **Agent Physics**: Simple movement, energy system, nearby agent sensing

## Quick Start

```bash
cd ai-agent-env
docker compose up
```

Once running (5-10 minutes on first run):
- **Frontend**: http://localhost:3001
- **Spawn agents** via the UI control panel
- **Click Auto-Think** to start agent reasoning cycles
- **Watch** them move and think in 3D space

## Stack

- **Frontend**: Three.js + Vanilla JS (public/index.html, public/client.js)
- **Backend**: Express.js + TypeScript (src/server.ts)
- **Agent Engine**: State manager + physics (src/agents.ts)
- **LLM**: Ollama with Mistral (src/llm.ts)
- **Orchestration**: Docker Compose (Ollama + API)

## API Endpoints

```
POST   /agents              Create a new agent
GET    /agents              List all agents
GET    /agents/:id          Get agent state
POST   /agents/:id/think    Run one think cycle
DELETE /agents/:id          Remove agent
GET    /health              Health check (Ollama status)
```

## Architecture

See [QUICKSTART.md](./QUICKSTART.md) for detailed architecture and troubleshooting.

## Development

```bash
npm install
npm run dev        # TypeScript with auto-reload
npm run build      # Build for production
npm start          # Run built JS
```

## Customization

- Change LLM model: Edit `MODEL` in src/llm.ts
- Adjust agent speed/physics: Edit src/agents.ts
- 3D visualization: Edit public/client.js (Three.js scene)

## License

MIT
