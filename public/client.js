// Three.js Scene Setup with enhanced visuals
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0609, 0.1);
renderer.shadowMap.enabled = true;
camera.position.set(50, 85, 85);
camera.lookAt(50, 0, 50);

// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Main directional light with glow
const directionalLight = new THREE.DirectionalLight(0xc8b6ff, 1);
directionalLight.position.set(100, 120, 100);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.far = 500;
scene.add(directionalLight);

// Add point lights for glow effect
const pointLight1 = new THREE.PointLight(0xa8edea, 0.5, 200);
pointLight1.position.set(20, 50, 20);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xfed6e3, 0.5, 200);
pointLight2.position.set(80, 50, 80);
scene.add(pointLight2);

// Arena floor with gradient
const arenaGeometry = new THREE.PlaneGeometry(100, 100);
const arenaMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a3a,
    metalness: 0.1,
    roughness: 0.8,
    envMapIntensity: 0.5,
});
const arena = new THREE.Mesh(arenaGeometry, arenaMaterial);
arena.rotation.x = -Math.PI / 2;
arena.receiveShadow = true;
scene.add(arena);

// Arena grid helper
const gridHelper = new THREE.GridHelper(100, 20, 0x4a4a7f, 0x2a2a4f);
gridHelper.position.y = 0.1;
scene.add(gridHelper);

// Enhanced border with glow
const borderGeometry = new THREE.BufferGeometry();
const borderVertices = new Float32Array([
    0, 0, 0,    100, 0, 0,
    100, 0, 0,  100, 0, 100,
    100, 0, 100, 0, 0, 100,
    0, 0, 100,  0, 0, 0,
]);
borderGeometry.setAttribute('position', new THREE.BufferAttribute(borderVertices, 3));
const borderMaterial = new THREE.LineBasicMaterial({
    color: 0xa8edea,
    linewidth: 2,
    fog: false,
});
const border = new THREE.LineSegments(borderGeometry, borderMaterial);
scene.add(border);

// State
let agents = new Map();
let resourceObjects = [];
let agentMeshes = new Map();
let agentLabels = new Map();
let agentTrails = new Map();
let autoThinking = false;
let simulationSpeed = 1;
const API_URL = `http://${window.location.hostname}:3001`;
const WS_URL = `ws://${window.location.hostname}:3001`;
let ws = null;

function updateStatus(text, error = false) {
    document.getElementById('statusText').textContent = text;
    const dot = document.getElementById('statusDot');
    if (error) {
        dot.classList.add('error');
    } else {
        dot.classList.remove('error');
    }
}

function connectWebSocket() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('WebSocket connected');
        updateStatus('Connected');
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'state') {
                updateScene(message.data);
                updateStats(message.data.stats);
            }
        } catch (e) {
            console.error('WebSocket parse error:', e);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateStatus('Connection error', true);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected, retrying...');
        setTimeout(connectWebSocket, 3000);
    };
}

function updateScene(data) {
    data.agents.forEach((agentData) => {
        if (!agents.has(agentData.id)) {
            createAgentVisual(agentData);
        } else {
            updateAgentVisual(agentData);
        }
    });

    agents.forEach((_, id) => {
        if (!data.agents.find((a) => a.id === id)) {
            removeAgentVisual(id);
        }
    });

    updateResources(data.objects);
}

function createAgentVisual(agentData) {
    agents.set(agentData.id, agentData);

    const hue = Math.random();
    const color = new THREE.Color().setHSL(hue, 0.8, 0.55);
    
    // Agent icosphere
    const geometry = new THREE.IcosahedronGeometry(1.5, 4);
    const material = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        shininess: 100,
        wireframe: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(agentData.position.x, 2, agentData.position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    agentMeshes.set(agentData.id, mesh);

    // Glow sphere around agent
    const glowGeometry = new THREE.IcosahedronGeometry(2.5, 2);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.15,
        wireframe: true,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(mesh.position);
    scene.add(glowMesh);
    agentMeshes.set(agentData.id + '_glow', glowMesh);

    // Canvas label
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(168, 237, 234, 0.9)';
    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(agentData.name, 128, 50);
    ctx.font = '18px system-ui';
    ctx.fillStyle = 'rgba(254, 214, 227, 0.8)';
    ctx.fillText(agentData.goal.substring(0, 24), 128, 90);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, sizeAttenuation: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(10, 5, 1);
    sprite.position.set(agentData.position.x, 5.5, agentData.position.z);
    scene.add(sprite);
    agentLabels.set(agentData.id, sprite);

    // Trail
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
        color,
        linewidth: 2,
        transparent: true,
        opacity: 0.6,
    });
    const trailLine = new THREE.Line(trailGeometry, trailMaterial);
    scene.add(trailLine);
    agentTrails.set(agentData.id, { line: trailLine, positions: [agentData.position] });

    renderAgentList();
}

function updateAgentVisual(agentData) {
    const mesh = agentMeshes.get(agentData.id);
    const glow = agentMeshes.get(agentData.id + '_glow');
    const label = agentLabels.get(agentData.id);
    const trail = agentTrails.get(agentData.id);

    if (mesh) {
        mesh.position.set(agentData.position.x, 2, agentData.position.z);
        mesh.rotation.x += 0.025;
        mesh.rotation.y += 0.035;

        const energyIntensity = agentData.energy / 100;
        mesh.material.emissiveIntensity = 0.3 + energyIntensity * 0.7;
        mesh.scale.set(1 + energyIntensity * 0.3, 1 + energyIntensity * 0.3, 1 + energyIntensity * 0.3);
    }

    if (glow) {
        glow.position.copy(mesh.position);
        glow.rotation.copy(mesh.rotation);
    }

    if (label) {
        label.position.set(agentData.position.x, 5.8, agentData.position.z);
    }

    if (trail) {
        trail.positions.push(agentData.position);
        if (trail.positions.length > 80) trail.positions.shift();

        const positions = new Float32Array(trail.positions.flatMap((p) => [p.x, 1.5, p.z]));
        trail.line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }

    agents.set(agentData.id, agentData);
}

function removeAgentVisual(id) {
    const mesh = agentMeshes.get(id);
    const glow = agentMeshes.get(id + '_glow');
    const label = agentLabels.get(id);
    const trail = agentTrails.get(id);

    if (mesh) scene.remove(mesh);
    if (glow) scene.remove(glow);
    if (label) scene.remove(label);
    if (trail) scene.remove(trail.line);

    agents.delete(id);
    agentMeshes.delete(id);
    agentMeshes.delete(id + '_glow');
    agentLabels.delete(id);
    agentTrails.delete(id);
    renderAgentList();
}

function updateResources(objects) {
    resourceObjects.forEach((obj) => scene.remove(obj));
    resourceObjects = [];

    objects.forEach((obj) => {
        const geom = new THREE.OctahedronGeometry(0.8, 2);
        const mat = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            emissive: 0xffa500,
            emissiveIntensity: 0.8,
            shininess: 100,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(obj.position.x, 1, obj.position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        resourceObjects.push(mesh);
    });
}

function updateStats(stats) {
    document.getElementById('statsText').innerHTML = `
        <div>👥 Agents: <span style="color: #a8edea;">${stats.totalAgents}</span></div>
        <div>⚡ Avg Energy: <span style="color: #fed6e3;">${stats.avgEnergy.toFixed(1)}%</span></div>
        <div>💎 Resources: <span style="color: #a8edea;">${stats.resourcesInArena}</span></div>
        <div>🎯 Collected: <span style="color: #fed6e3;">${stats.totalResourcesCollected.toFixed(0)}</span></div>
    `;
}

async function createAgent() {
    const name = document.getElementById('agentName').value || 'Agent';
    const goal = document.getElementById('agentGoal').value || 'Explore';

    try {
        const response = await fetch(`${API_URL}/agents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, goal }),
        });
        await response.json();
        updateStatus(`Agent "${name}" spawned`);
    } catch (error) {
        console.error('Create agent error:', error);
        updateStatus('Failed to create agent', true);
    }
}

function autoThink() {
    autoThinking = !autoThinking;
    const btn = event.target;
    btn.textContent = autoThinking ? '⏸ Stop Thinking' : '⚡ Auto-Think';
    btn.style.background = autoThinking
        ? 'linear-gradient(135deg, rgba(255, 107, 157, 0.3) 0%, rgba(255, 107, 157, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(168, 237, 234, 0.2) 0%, rgba(254, 214, 227, 0.2) 100%)';

    if (autoThinking) {
        thinkLoop();
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
        await new Promise((r) => setTimeout(r, 2000 / simulationSpeed));
    }
}

function changeSimulationSpeed(speed) {
    simulationSpeed = parseFloat(speed);
}

function renderAgentList() {
    const list = document.getElementById('agentList');
    if (agents.size === 0) {
        list.innerHTML = '<div style="color: rgba(255, 255, 255, 0.4); text-align: center; padding: 16px;">No agents spawned yet</div>';
        return;
    }

    list.innerHTML = Array.from(agents.values())
        .map((a) => `
            <div class="agent-item">
                <div class="name">● ${a.name}</div>
                <div class="pos">📍 (${a.position.x.toFixed(0)}, ${a.position.z.toFixed(0)})</div>
                <div class="pos">⚡ ${a.energy.toFixed(0)}% | 💎 ${a.resourcesCollected}</div>
                <div class="thought">"${a.thinking.substring(0, 40)}${a.thinking.length > 40 ? '...' : ''}"</div>
            </div>
        `)
        .join('');
}

function animate() {
    requestAnimationFrame(animate);

    // Smooth camera rotation
    const time = Date.now() * 0.00002;
    camera.position.x = 50 + Math.sin(time) * 75;
    camera.position.z = 50 + Math.cos(time) * 75;
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
        updateStatus(health.ollama ? 'Ready' : 'Waiting for Ollama...', !health.ollama);
    } catch (error) {
        console.error('Health check error:', error);
        updateStatus('API unreachable', true);
    }

    connectWebSocket();
    animate();
}

init();
