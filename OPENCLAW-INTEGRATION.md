# OpenClaw + Command Center Integration Guide

## Setup

Your AI Command Center now integrates with OpenClaw for enhanced LLM routing and Obsidian vault access.

### 1. Install OpenClaw Locally

```bash
# macOS / Linux
bash <(curl -s https://openclaw.ai/install.sh)

# Windows PowerShell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

### 2. Onboard OpenClaw

```bash
openclaw onboard --install-daemon
# Walk through: model provider, API key, gateway config
# Should complete in ~2 minutes
```

### 3. Verify Gateway is Running

```bash
openclaw gateway status
# Should show: Gateway listening on port 18789
```

### 4. Start Your Command Center

```bash
cd ai-agent-env
docker compose up -d
```

### 5. Open Dashboard

Open http://localhost:3001 in your browser.

---

## Features

### Command Center UI
- **3D Arena**: Real-time visualization of agents, resources, and collisions
- **Tactical Map**: Bird's-eye view of the arena
- **Mission Control**: Timer, efficiency metrics, log export
- **Agent Status**: Real-time energy, position, and thoughts
- **Comms Log**: All system events timestamped

### OpenClaw Integration
- **Chat Interface**: Talk to an AI powered by your local LLM
- **Vault Search**: Query your Obsidian notes directly from chat
- **Agent Commands**: Direct agents to search your vault for context
- **Memory Index**: Automatic indexing of markdown files

### Vault Setup

Place your Obsidian vault files in `./vaults/obsidian/`:

```
ai-agent-env/
├── vaults/
│   └── obsidian/
│       ├── System-Overview.md
│       ├── Agent-Strategies.md
│       ├── Knowledge-Base/
│       │   ├── Docker.md
│       │   ├── LLM-Setup.md
│       │   └── Architecture.md
```

### API Endpoints

```
# Chat
POST /chat                      Send message to LLM
GET  /chat/history              Get chat history
POST /chat/clear                Clear conversation

# Vault
GET  /vault/search?query=...    Search vault
POST /vault/index               Reindex vault
GET  /vault/status              Check indexing status

# Agents
POST /agents                    Deploy new agent
GET  /agents                    List all agents
POST /agents/:id/think          Trigger agent reasoning

# Health
GET  /health                    System health check
```

---

## Examples

### Deploy an Agent
```bash
curl -X POST http://localhost:3001/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Scout","goal":"Search vault for Docker best practices"}'
```

### Query Vault from Chat
```bash
# In chat interface, type:
"Search my vault for information about Docker and provide a summary"
```

### Check Vault Status
```bash
curl http://localhost:3001/vault/status
```

---

## Troubleshooting

**OpenClaw gateway not found?**
- Make sure `openclaw gateway status` shows it running on port 18789
- If not running: `openclaw gateway start`

**Chat returns empty?**
- Check Ollama is pulling the model: `docker logs ai-agent-env-ollama-1`
- Wait 5-10 minutes for Mistral model download

**Vault not indexed?**
- Place .md files in `./vaults/obsidian/`
- Call `POST /vault/index`
- Check `GET /vault/status` for indexing progress

---

## Architecture

```
┌─────────────────────────────────────────┐
│    Command Center UI (localhost:3001)   │
│  - 3D Arena Visualization               │
│  - Chat Interface                       │
│  - Mission Control Dashboard            │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐    ┌───▼────┐  ┌───▼────┐
│ API   │    │Ollama  │  │OpenClaw│
│(3000) │    │(11434) │  │Gateway │
└───┬───┘    └────────┘  │(18789) │
    │                    └────┬───┘
    │                         │
    └─────────────┬───────────┘
                  │
           ┌──────▼───────┐
           │ Obsidian     │
           │ Vault        │
           │ (./vaults)   │
           └──────────────┘
```

---

## Next Steps

1. **Add your Obsidian vault** to `./vaults/obsidian/`
2. **Deploy agents** with goals related to your knowledge base
3. **Enable Auto-Think** to watch agents autonomously explore
4. **Use chat** to query your vault and get AI insights
5. **Monitor mission** via the command center dashboard

Enjoy your AI agent command center!
