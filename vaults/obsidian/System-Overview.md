# AI Command Center Knowledge Base

## System Overview
- **Purpose**: Autonomous AI agent environment with command center UI
- **Architecture**: Three.js 3D visualization + Express.js backend + Ollama LLM
- **Status**: Production Ready

## Agent Framework
- Each agent has local reasoning via Ollama
- Agents can move, collect resources, and interact
- Memory system tracks discoveries and interactions
- Energy system drives behavior

## Command Center Features
- Real-time tactical map showing agent positions
- Mission control with efficiency tracking
- Comms log for all system events
- Live chat interface with OpenClaw integration
- Vault indexing for knowledge base access

## Integration Points
- OpenClaw Gateway (port 18789) for enhanced LLM routing
- Obsidian vault integration for note access
- WebSocket for real-time agent state broadcasts
- REST API for all command operations

## Quick Commands
- Deploy agents: POST /agents
- Query chat: POST /chat
- Search vault: GET /vault/search?query=...
- Index vault: POST /vault/index
