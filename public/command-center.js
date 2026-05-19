// Three.js Scene - Command Center Environment
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000a15, 1);
renderer.shadowMap.enabled = true;
camera.position.set(50, 85, 85);
camera.lookAt(50, 0, 50);

// Scene lighting
const ambientLight = new THREE.AmbientLight(0x0033ff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0x00ff88, 0.8);
directionalLight.position.set(100, 120, 100);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Cyan accent light
const accentLight = new THREE.PointLight(0x00ffff, 0.6, 300);
accentLight.position.set(20, 60, 20);
scene.add(accentLight);

// Arena floor
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x001a33,
    metalness: 0.3,
    roughness: 0.7,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Tactical grid
const gridHelper = new THREE.GridHelper(100, 20, 0x00ff88, 0x002255);
gridHelper.position.y = 0.2;
scene.add(gridHelper);

// Arena border
const borderGeometry = new THREE.BufferGeometry();
const borderVertices = new Float32Array([
    0, 0, 0,    100, 0, 0,
    100, 0, 0,  100, 0, 100,
    100, 0, 100, 0, 0, 100,
    0, 0, 100,  0, 0, 0,
]);
borderGeometry.setAttribute('position', new THREE.BufferAttribute(borderVertices, 3));
const borderMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff88,
    linewidth: 3,
    fog: false,
});
const border = new THREE.LineSegments(borderGeometry, borderMaterial);
scene.add(border);

// Command center hologram
const hologramGeometry = new THREE.IcosahedronGeometry(1, 4);
const hologramMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ffff,
    emissive: 0x00aaff,
    emissiveIntensity: 0.5,
    wireframe: false,
    transparent: true,
    opacity: 0.6,
});
const hologram = new THREE.Mesh(hologramGeometry, hologramMaterial);
hologram.position.set(50, 20, 50);
hologram.castShadow = true;
scene.add(hologram);

// State management
let agents = new Map();
let resourceObjects = [];
let agentMeshes = new Map();
let agentLabels = new Map();
let agentTrails = new Map();
let autoThinking = false;
let missionStartTime = Date.now();
let commsLog = [];
let chatMessages = [];

const API_URL = `http://${window.location.hostname}:3001`;
const WS_URL = `ws://${window.location.hostname}:3001`;
let ws = null;

// Alert system
function showAlert(message) {
    const banner = document.getElementById('alertBanner');
    banner.textContent = message;
    banner.style.display = 'block';
    setTimeout(() => {
        banner.style.display = 'none';
    }, 3000);
}

// Comms log
function addCommsLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    commsLog.push({ timestamp, message, type });
    if (commsLog.length > 50) commsLog.shift();
    
    const container = document.getElementById('commsLogContent');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${timestamp}] ${message}`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

// Chat functions
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    
    // Display user message
    displayChatMessage(message, 'user');
    addCommsLog(`User: ${message}`, 'info');
    
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });
        
        if (response.ok) {
            const data = await response.json();
            displayChatMessage(data.content, 'assistant');
            addCommsLog(`AI: ${data.content.substring(0, 50)}...`, 'success');
        } else {
            displayChatMessage('Error: Failed to get response', 'assistant');
        }
    } catch (e) {
        console.error('Chat error:', e);
        displayChatMessage('Error: Connection failed', 'assistant');
        addCommsLog('Chat connection error', 'alert');
    }
}

function displayChatMessage(content, role) {
    const container = document.getElementById('chatMessages');
    const message = document.createElement('div');
    message.className = `message ${role}`;
    message.textContent = content;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    message.appendChild(timestamp);
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
}

function handleChatKeypress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

// WebSocket connection
function connectWebSocket() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        addCommsLog('Command center connected to network', 'success');
        document.getElementById('systemStatus').classList.remove('alert');
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'state') {
                updateScene(message.data);
                updateUI(message.data);
            }
        } catch (e) {
            console.error('WS error:', e);
        }
    };

    ws.onerror = () => {
        addCommsLog('Connection lost - attempting reconnect', 'alert');
        document.getElementById('systemStatus').classList.add('alert');
    };

    ws.onclose = () => {
        setTimeout(connectWebSocket, 3000);
    };
}

// Update 3D scene
function updateScene(data) {
    data.agents.forEach((agentData) => {
        if (!agents.has(agentData.id)) {
            createAgentVisual(agentData);
            addCommsLog(`Agent ${agentData.name} deployed`, 'success');
        } else {
            updateAgentVisual(agentData);
        }
    });

    agents.forEach((_, id) => {
        if (!data.agents.find((a) => a.id === id)) {
            removeAgentVisual(id);
            addCommsLog(`Agent terminated`, 'alert');
        }
    });

    updateResources(data.objects);
}

function createAgentVisual(agentData) {
    agents.set(agentData.id, agentData);

    const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.6);
    
    const geometry = new THREE.OctahedronGeometry(1.5, 3);
    const material = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
        shininess: 100,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(agentData.position.x, 2, agentData.position.z);
    mesh.castShadow = true;
    scene.add(mesh);
    agentMeshes.set(agentData.id, mesh);

    const auraGeometry = new THREE.IcosahedronGeometry(2.5, 2);
    const auraMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.2,
        wireframe: true,
    });
    const auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
    auraMesh.position.copy(mesh.position);
    scene.add(auraMesh);
    agentMeshes.set(agentData.id + '_aura', auraMesh);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 15;
    ctx.fillText(agentData.name, 128, 50);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#a8edea';
    ctx.fillText(agentData.goal.substring(0, 20), 128, 90);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(12, 6, 1);
    sprite.position.set(agentData.position.x, 5.5, agentData.position.z);
    scene.add(sprite);
    agentLabels.set(agentData.id, sprite);

    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({ color, linewidth: 2, transparent: true, opacity: 0.5 });
    const trailLine = new THREE.Line(trailGeometry, trailMaterial);
    scene.add(trailLine);
    agentTrails.set(agentData.id, { line: trailLine, positions: [agentData.position] });
}

function updateAgentVisual(agentData) {
    const mesh = agentMeshes.get(agentData.id);
    const aura = agentMeshes.get(agentData.id + '_aura');
    const label = agentLabels.get(agentData.id);
    const trail = agentTrails.get(agentData.id);

    if (mesh) {
        mesh.position.set(agentData.position.x, 2, agentData.position.z);
        mesh.rotation.x += 0.02;
        mesh.rotation.y += 0.03;
        const energyIntensity = agentData.energy / 100;
        mesh.material.emissiveIntensity = 0.3 + energyIntensity * 0.7;
        mesh.scale.set(1 + energyIntensity * 0.2, 1 + energyIntensity * 0.2, 1 + energyIntensity * 0.2);
    }

    if (aura) aura.position.copy(mesh.position);
    if (label) label.position.set(agentData.position.x, 5.8, agentData.position.z);

    if (trail) {
        trail.positions.push(agentData.position);
        if (trail.positions.length > 60) trail.positions.shift();
        const positions = new Float32Array(trail.positions.flatMap((p) => [p.x, 1.5, p.z]));
        trail.line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }

    agents.set(agentData.id, agentData);
}

function removeAgentVisual(id) {
    const mesh = agentMeshes.get(id);
    const aura = agentMeshes.get(id + '_aura');
    const label = agentLabels.get(id);
    const trail = agentTrails.get(id);

    if (mesh) scene.remove(mesh);
    if (aura) scene.remove(aura);
    if (label) scene.remove(label);
    if (trail) scene.remove(trail.line);

    agents.delete(id);
    agentMeshes.delete(id);
    agentMeshes.delete(id + '_aura');
    agentLabels.delete(id);
    agentTrails.delete(id);
}

function updateResources(objects) {
    resourceObjects.forEach((obj) => scene.remove(obj));
    resourceObjects = [];

    objects.forEach((obj) => {
        const geom = new THREE.OctahedronGeometry(0.8, 2);
        const mat = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.8,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(obj.position.x, 1, obj.position.z);
        mesh.castShadow = true;
        scene.add(mesh);
        resourceObjects.push(mesh);
    });
}

// UI Updates
function updateUI(data) {
    document.getElementById('agentCount').textContent = data.stats.totalAgents;
    document.getElementById('arenaEnergy').textContent = data.stats.avgEnergy.toFixed(1) + '%';
    document.getElementById('resourceCount').textContent = data.stats.resourcesInArena;
    document.getElementById('totalCollected').textContent = data.stats.totalResourcesCollected.toFixed(0);

    const elapsed = Math.floor((Date.now() - missionStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    document.getElementById('missionTime').textContent = 
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const efficiency = data.stats.totalAgents > 0 
        ? ((data.stats.totalResourcesCollected / (data.stats.totalAgents * 10)) * 100).toFixed(0)
        : 0;
    document.getElementById('efficiency').textContent = efficiency + '%';

    updateTacticalMap(data);
    updateAgentList(data.agents);
}

function updateTacticalMap(data) {
    const mapGrid = document.getElementById('mapGrid');
    mapGrid.innerHTML = '';

    data.agents.forEach((agent) => {
        const dot = document.createElement('div');
        dot.className = 'map-agent';
        dot.style.left = (agent.position.x / 100 * 250) + 'px';
        dot.style.top = (agent.position.z / 100 * 250) + 'px';
        mapGrid.appendChild(dot);
    });

    data.objects.forEach((obj) => {
        const dot = document.createElement('div');
        dot.className = 'map-resource';
        dot.style.left = (obj.position.x / 100 * 250) + 'px';
        dot.style.top = (obj.position.z / 100 * 250) + 'px';
        mapGrid.appendChild(dot);
    });
}

function updateAgentList(agentList) {
    const list = document.getElementById('agentList');
    if (agentList.length === 0) {
        list.innerHTML = '<div class="log-entry">NO AGENTS DEPLOYED</div>';
        return;
    }

    list.innerHTML = agentList
        .map((a) => `
            <div class="log-entry">
                <span style="color: #a8edea;">${a.name}</span> | 
                ⚡${a.energy.toFixed(0)}% | 
                📍${a.position.x.toFixed(0)},${a.position.z.toFixed(0)}
            </div>
        `)
        .join('');
}

// Command functions
async function spawnAgent() {
    const name = document.getElementById('agentName').value || 'AGENT-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    const goal = document.getElementById('agentGoal').value || 'EXPLORE MISSION';

    try {
        const response = await fetch(`${API_URL}/agents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, goal }),
        });
        if (response.ok) {
            showAlert(`✓ AGENT ${name.toUpperCase()} DEPLOYED`);
            document.getElementById('agentName').value = '';
            document.getElementById('agentGoal').value = '';
            addCommsLog(`Agent ${name} deployed successfully`, 'success');
        } else {
            addCommsLog('Failed to deploy agent', 'alert');
        }
    } catch (e) {
        console.error('Spawn error:', e);
        addCommsLog('Deployment failed', 'alert');
    }
}

function toggleAutoThink() {
    autoThinking = !autoThinking;
    if (autoThinking) {
        addCommsLog('Autonomous thinking enabled', 'success');
        thinkLoop();
    } else {
        addCommsLog('Autonomous thinking disabled', 'info');
    }
}

async function thinkLoop() {
    while (autoThinking) {
        const agentList = Array.from(agents.values());
        for (const agent of agentList) {
            try {
                await fetch(`${API_URL}/agents/${agent.id}/think`, { method: 'POST' });
            } catch (e) {
                console.error('Think error:', e);
            }
        }
        await new Promise((r) => setTimeout(r, 2000));
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    hologram.rotation.x += 0.003;
    hologram.rotation.y += 0.005;
    hologram.position.y = 20 + Math.sin(Date.now() * 0.001) * 2;

    const time = Date.now() * 0.00002;
    camera.position.x = 50 + Math.sin(time) * 80;
    camera.position.z = 50 + Math.cos(time) * 80;
    camera.lookAt(50, 15, 50);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

async function init() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const health = await response.json();
        if (health.ollama) {
            addCommsLog('All systems operational', 'success');
        } else {
            addCommsLog('Awaiting Ollama initialization', 'info');
        }
    } catch (error) {
        console.error('Health check error:', error);
        addCommsLog('Connection error', 'alert');
    }

    connectWebSocket();
    animate();
}

init();
