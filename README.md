# 🤖 AI Agent Command Center

A fully containerized AI agent simulation environment with a sci-fi command center UI. Deploy autonomous agents powered by local LLMs, watch them explore a 3D arena, collect resources, and interact with each other—all through a real-time tactical dashboard.

Built with **Three.js**, **Express.js**, **Ollama**, and **OpenClaw**.

![License](https://img.shields.io/badge/license-MIT-blue)
![Docker](https://img.shields.io/badge/docker-enabled-blue)
![Node.js](https://img.shields.io/badge/node.js-22-green)

---

## ✨ Features

### 🎮 Command Center UI
- **3D Arena Visualization**: Real-time rendering of agents, resources, and movement trails
- **Tactical Map**: Bird's-eye view with agent/resource positioning
- **Mission Control**: Timer, efficiency metrics, log export
- **Agent Status Panel**: Real-time energy, position, and AI thoughts
- **Comms Log**: Timestamped system events and alerts
- **Live Chat**: Direct LLM interaction with vault search integration

### 🤖 Autonomous Agents
- **Local LLM Reasoning**: Each agent thinks using Ollama (Mistral by default)
- **Resource Collection**: Agents autonomously search and gather resources
- **Energy System**: Movement and actions drain energy, resources restore it
- **Collision Detection**: Physics-based agent interactions
- **Memory System**: Agents track discoveries and past interactions
- **Nearby Sensing**: Agents detect and respond to neighboring agents

### 🔧 Infrastructure
- **Fully Containerized**: Docker Compose orchestration (Ollama + API + UI)
- **WebSocket Real-time**: 500ms state broadcasts for smooth updates
- **REST API**: Full agent control and vault querying
- **OpenClaw Integration**: Enhanced LLM routing and Obsidian vault access
- **TypeScript Backend**: Type-safe agent engine and LLM communication

### 📚 Knowledge Integration
- **Obsidian Vault Support**: Index and search your markdown knowledge base
- **Vector Search**: Semantic querying of vault contents
- **Agent Context**: Agents can access vault data for intelligent decisions
- **Memory Persistence**: Chat history and mission logs

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- ~8GB disk space (for Ollama model)
- Modern browser (Chrome, Firefox, Safari, Edge)

### 1. Clone & Setup
```bash
git clone https://github.com/yourusername/ai-agent-command-center.git
cd ai-agent-command-center
```

### 2. Start Services
```bash
docker compose up -d
```

**First run takes 5-10 minutes** as Ollama downloads the Mistral model (~4GB).

### 3. Open Command Center
```
http://localhost:3001
```

### 4. Deploy Your First Agent
- Enter agent name: `Scout`
- Enter goal: `Explore and collect resources`
- Click **▶ DEPLOY**
- Click **⚙ AUTO** to enable autonomous thinking

---

## 📖 Architecture

```
┌─────────────────────────────────────────────┐
│     Web Browser (localhost:3001)            │
│  ┌─────────────────────────────────────┐   │
│  │  Three.js 3D Arena Visualization    │   │
│  │  - Agent rendering & trails         │   │
│  │  - Resource visualization           │   │
│  │  - Real-time animation              │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  Command Center UI                  │   │
│  │  - Tactical map                     │   │
│  │  - Mission control                  │   │
│  │  - Agent status                     │   │
│  │  - Live chat                        │   │
│  │  - Comms log                        │   │
│  └────────────┬────────────────────────┘   │
└───────────────┼──────────────────────────────┘
                │ HTTP/WebSocket
    ┌───────────┼───────────┐
    │           │           │
┌───▼───┐   ┌───▼────┐ ┌────▼────┐
│ API   │   │Ollama  │ │OpenClaw │
│ Srv   │   │ LLM    │ │Gateway  │
└───┬───┘   └────┬───┘ └────┬────┘
    │            │          │
    │     ┌──────┘          │
    │     │                 │
    │  ┌──▼────────────────┐│
    │  │ Agent Engine      ││
    │  │ - State mgmt      ││
    │  │ - Physics         ││
    │  │ - Memory          ││
    │  └───┬────────────────┘│
    │      │                 │
    └──────┼─────────────────┘
           │
    ┌──────▼──────┐
    │  Obsidian   │
    │  Vault      │
    │  (./vaults) │
    └─────────────┘
```

### Components

| Component | Port | Purpose |
|-----------|------|---------|
| **API Server** | 3001 | Express.js backend, WebSocket, REST endpoints |
| **Ollama** | 11435 | Local LLM (Mistral, accessible at 11434 internal) |
| **OpenClaw** | 18789 | Optional - LLM gateway & vault indexing |

---

## 🎮 Usage

### Deploy Agents
```bash
curl -X POST http://localhost:3001/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Scout","goal":"Search vault for Docker info"}'
```

### Chat with AI
```bash
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is the best way to containerize a Node app?"}'
```

### Search Vault
```bash
curl "http://localhost:3001/vault/search?query=docker+best+practices"
```

### Check System Health
```bash
curl http://localhost:3001/health
```

### Get Agent List
```bash
curl http://localhost:3001/agents
```

---

## 📝 Configuration

### Environment Variables
```bash
# .env or docker-compose.yml
NODE_ENV=production
OLLAMA_URL=http://ollama:11434
OPENCLAW_URL=http://localhost:18789
PORT=3000
MODEL=mistral
```

### Ollama Model Selection
Edit `src/llm.ts` `MODEL` constant:
```typescript
const MODEL = process.env.MODEL || 'mistral';
// Options: mistral, llama2, neural-chat, qwen2.5-coder, etc.
```

### Agent Configuration
Edit `src/agents.ts`:
```typescript
const ARENA_SIZE = 100;          // Arena dimensions
const AGENT_SPEED = 0.3;         // Movement speed
const COLLISION_DISTANCE = 4;    // Collision radius
const AGENT_RADIUS = 2;          // Visual size
```

---

## 🧠 Adding Your Obsidian Vault

1. **Create vault directory**:
   ```bash
   mkdir -p ai-agent-env/vaults/obsidian
   ```

2. **Copy your markdown files**:
   ```bash
   cp -r ~/Obsidian/MyVault/*.md ai-agent-env/vaults/obsidian/
   ```

3. **Index vault** (once via OpenClaw or auto-indexed on startup):
   ```bash
   curl -X POST http://localhost:3001/vault/index
   ```

4. **Query from chat**:
   - Type in chat: "Search my vault for information about Docker"
   - Agent can now reference your knowledge base

### Supported File Types
- `.md` (Markdown) - Fully supported
- `.txt` (Text) - Indexed as plain text
- Nested directories supported
- Ignores `.obsidian/`, `.git/`, `node_modules/`

---

## 🔌 OpenClaw Integration

### Setup OpenClaw (Optional)

1. **Install locally** (not in Docker):
   ```bash
   # macOS/Linux
   bash <(curl -s https://openclaw.ai/install.sh)
   
   # Windows PowerShell
   iwr -useb https://openclaw.ai/install.ps1 | iex
   ```

2. **Onboard**:
   ```bash
   openclaw onboard --install-daemon
   # Select Ollama as provider, use http://localhost:11434
   ```

3. **Start gateway**:
   ```bash
   openclaw gateway start
   ```

4. **Verify**:
   ```bash
   openclaw gateway status
   # Should show: Gateway listening on port 18789
   ```

### With OpenClaw enabled:
- Enhanced LLM routing through OpenClaw
- Native Obsidian indexing
- Better semantic search
- Channel integration (Telegram, Discord, WhatsApp)

See [OPENCLAW-INTEGRATION.md](./OPENCLAW-INTEGRATION.md) for details.

---

## 📊 API Reference

### Agents

```
POST   /agents                    Create agent
GET    /agents                    List all agents
GET    /agents/:id                Get single agent
POST   /agents/:id/think          Trigger reasoning cycle
DELETE /agents/:id                Remove agent
```

### Chat

```
POST   /chat                      Send message to LLM
GET    /chat/history              Get conversation history
POST   /chat/clear                Clear history
```

### Vault

```
GET    /vault/search?query=...    Search vault
POST   /vault/index               Reindex vault
GET    /vault/status              Indexing status
```

### System

```
GET    /health                    System health & Ollama status
GET    /stats                     Arena statistics
```

---

## 🐛 Troubleshooting

### Buttons not responding?
```bash
# Check browser console (F12) for errors
# Verify API is running:
curl http://localhost:3001/health

# View API logs:
docker logs ai-agent-env-api-1
```

### Ollama model not loading?
```bash
# Check Ollama logs:
docker logs ai-agent-env-ollama-1

# Manually pull model:
docker exec ai-agent-env-ollama-1 ollama pull mistral
```

### WebSocket connection failing?
```bash
# Verify containers are running:
docker ps | grep ai-agent-env

# Restart services:
docker compose restart
```

### Port already in use?
```bash
# Check what's using port 3001:
lsof -i :3001  # Linux/macOS
netstat -ano | findstr :3001  # Windows

# Use different port in docker-compose.yml:
# ports:
#   - "3002:3000"  # Changed from 3001
```

---

## 🚀 Performance Tips

1. **Reduce agent count** for smoother 60fps:
   ```javascript
   // In command-center.js, limit deployments to 5-10 agents
   ```

2. **Lower simulation speed** for debugging:
   - Use the Speed dropdown: 0.5x

3. **Monitor system resources**:
   ```bash
   docker stats ai-agent-env-api-1 ai-agent-env-ollama-1
   ```

4. **Use smaller LLM model**:
   - Change `MODEL=neural-chat` or `MODEL=qwen2.5-1.5b` for faster inference

---

## 📦 Deployment

### Docker Hub
```bash
docker build -t yourname/ai-agent-env .
docker push yourname/ai-agent-env
```

### Docker Compose (Production)
```bash
docker compose -f docker-compose.yml up -d
```

### Kubernetes (Advanced)
See [K8s deployment guide](./docs/kubernetes.md) (optional)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m "Add amazing feature"`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file

---

## 🎯 Roadmap

- [ ] WebSocket state compression for better performance
- [ ] Multi-arena support (multiple isolated environments)
- [ ] Agent reproduction/mutation system
- [ ] Persistent agent state database
- [ ] Mobile companion app
- [ ] Real-time video streaming of arena
- [ ] Custom LLM fine-tuning pipeline
- [ ] Advanced vault linking (backlinks, transclusion)
- [ ] Agent trading/economy system
- [ ] Kubernetes Helm charts

---

## 🙏 Acknowledgments

Built with:
- **Three.js** - 3D visualization
- **Ollama** - Local LLM runtime
- **Express.js** - Backend framework
- **Docker** - Containerization
- **OpenClaw** - AI agent framework
- **TypeScript** - Type safety

---

## 📮 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-agent-command-center/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-agent-command-center/discussions)
- **Email**: dev@example.com

---

## 🎬 Demo

[Video Demo Link] (coming soon)

---

**Made with ❤️ by [Your Name]**

⭐ **If you find this useful, please star the repo!**
