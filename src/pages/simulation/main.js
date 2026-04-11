import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Drone } from '../../modules/entities/drone.js';
import { Package } from '../../modules/entities/package.js';
import { createWorld } from '../../modules/core/world.js';
import { MissionManager } from '../../modules/systems/mission.js';
import { MapSystem } from '../../modules/core/MapSystem.js';
import cityRegistry from '../../assets/city_registry.json';
import mapUrl from '../../assets/city_map.svg';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 10, 150); // Increased fog distance for larger city

// Physics setup
const physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
});

// Default material
const defaultMaterial = new CANNON.Material('default');
const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 0.1,
    restitution: 0.5, // Bounciness
});
physicsWorld.addContactMaterial(defaultContactMaterial);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 20); // Higher starting position
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50, 100, 50); // Higher light for city
dirLight.castShadow = true;
dirLight.shadow.camera.top = 100;
dirLight.shadow.camera.bottom = -100;
dirLight.shadow.camera.left = -100;
dirLight.shadow.camera.right = 100;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// World Generation
const { dockedDrones, conveyorPackages, deliveryZones } = createWorld(scene, physicsWorld);

// Packages
const packages = [];
window.packages = packages; // Expose for Drone to access

// Add conveyor packages
packages.push(...conveyorPackages);

const pkg1 = new Package(scene, physicsWorld, new THREE.Vector3(5, 5, 5)); // Drop from height to test physics
packages.push(pkg1);

const pkg2 = new Package(scene, physicsWorld, new THREE.Vector3(-5, 5, -5));
packages.push(pkg2);

const pkg3 = new Package(scene, physicsWorld, new THREE.Vector3(5, 5, -5));
packages.push(pkg3);

// Mission System
const missionManager = new MissionManager(scene, packages, deliveryZones);
missionManager.registerDrones(dockedDrones); // Starts autonomous delivery dispatch

// Drone
const drone = new Drone(scene, physicsWorld, true); // Pass scene and physicsWorld
drone.addToScene(scene);

// --- Map System ---
const mapSystem = new MapSystem({
    bounds: [[-110, -110], [110, 110]], // Approximate world bounds based on 5x5 grid
    imagePath: mapUrl,
    registry: cityRegistry
});

// Add Trackables
mapSystem.addTrackable(drone.mesh, 'player');
dockedDrones.forEach(d => mapSystem.addTrackable(d.mesh, 'ally'));

// --- Console Helpers ---
window.playerDrone    = drone;
window.dockedDrones   = dockedDrones;
window.missionStates  = missionManager.droneStates; // Admin fleet panel reads this

window.spawnDrone = (x, y, z) => {
    const startPos = new THREE.Vector3(x, y, z);
    const newDrone = new Drone(scene, physicsWorld, false, startPos);
    newDrone.addToScene(scene);
    dockedDrones.push(newDrone); // Add to array so it gets updated in animate()
    mapSystem.addTrackable(newDrone.mesh, 'ally'); // Add to map
    console.log(`Spawned drone at (${x}, ${y}, ${z})`);
    return newDrone;
};

window.countDrones = () => {
    const count = 1 + dockedDrones.length; // Player + Docked
    console.log(`Total Drones: ${count} (1 Player + ${dockedDrones.length} AI)`);
    return count;
};

window.moveDrone = (index, x, y, z) => {
    if (index >= 0 && index < dockedDrones.length) {
        dockedDrones[index].moveTo(x, y, z);
        console.log(`Drone ${index} moving to (${x}, ${y}, ${z})`);
    } else {
        console.error(`Drone index ${index} out of bounds (0-${dockedDrones.length-1})`);
    }
};

window.commandAllDrones = (x, y, z) => {
    dockedDrones.forEach((d, i) => {
        // Add some random offset so they don't stack
        const offset = new THREE.Vector3((Math.random()-0.5)*5, 0, (Math.random()-0.5)*5);
        d.moveTo(x + offset.x, y, z + offset.z);
    });
    console.log(`All drones moving to area (${x}, ${y}, ${z})`);
};

window.drawRoute = (points) => {
    // Expects array of objects or arrays: [{x:0, z:0}, ...] or [[0,0], ...]
    // Helper to normalize input
    const normalizedPoints = points.map(p => {
        if (Array.isArray(p)) return { x: p[0], z: p[1] };
        return p;
    });
    mapSystem.drawRoute(normalizedPoints);
    console.log("Route drawn on map.");
};

window.clearRoutes = () => {
    mapSystem.clearRoutes();
    console.log("Routes cleared.");
};
// -----------------------

// ── Onboarding ──────────────────────────────────────────────────────────────
const onboarding    = document.getElementById('onboarding');
const startBtn      = document.getElementById('start-sim');
const skipBtn       = document.getElementById('skip-onboard');
const hudEl         = document.getElementById('hud');
const controlsHint  = document.getElementById('controls-hint');

function dismissOnboarding() {
    if (onboarding) {
        onboarding.style.opacity = '0';
        onboarding.style.transition = 'opacity 0.35s';
        setTimeout(() => { onboarding.style.display = 'none'; }, 350);
    }
    if (hudEl) hudEl.style.display = 'flex';
    if (controlsHint) controlsHint.style.display = 'block';
}

if (startBtn) startBtn.addEventListener('click', dismissOnboarding);
if (skipBtn)  skipBtn.addEventListener('click', dismissOnboarding);

// H key re-opens onboarding
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH') {
        if (onboarding.style.display === 'none') {
            onboarding.style.display = 'flex';
            onboarding.style.opacity = '1';
        } else {
            dismissOnboarding();
        }
    }
});

// ── Activity Feed ───────────────────────────────────────────────────────────
const DRONE_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];
const feedEl = document.getElementById('activity-feed');
let lastPhases = new Map();

function pushFeedItem(msg) {
    if (!feedEl) return;
    const item = document.createElement('div');
    item.className = 'feed-item';
    item.innerHTML = msg;
    feedEl.appendChild(item);
    // Keep max 5 items
    while (feedEl.children.length > 5) {
        feedEl.removeChild(feedEl.firstChild);
    }
    // Auto-remove after 6s
    setTimeout(() => {
        item.style.opacity = '0';
        setTimeout(() => item.remove(), 400);
    }, 6000);
}

function checkFeedUpdates() {
    if (!missionManager.droneStates) return;
    missionManager.droneStates.forEach((state, drone) => {
        const idx = dockedDrones.indexOf(drone);
        if (idx < 0) return;
        const name = DRONE_NAMES[idx] || `D${idx}`;
        const prev = lastPhases.get(drone);
        const curr = state.phase;

        if (prev !== curr) {
            lastPhases.set(drone, curr);
            // Only announce meaningful transitions
            switch (curr) {
                case 'ascending_to_pickup':
                    pushFeedItem(`<span class="feed-drone">🚁 ${name}</span> dispatched — heading to pickup`);
                    break;
                case 'picking_up':
                    pushFeedItem(`<span class="feed-drone">🚁 ${name}</span> <span class="feed-action">picked up package</span>`);
                    break;
                case 'flying_to_zone':
                    pushFeedItem(`<span class="feed-drone">🚁 ${name}</span> en route to delivery zone`);
                    break;
                case 'dropping':
                    pushFeedItem(`<span class="feed-drone">🚁 ${name}</span> <span class="feed-action">delivered! ✅</span>`);
                    break;
                case 'returning':
                    pushFeedItem(`<span class="feed-drone">🚁 ${name}</span> returning to dock`);
                    break;
            }
        }
    });
}

// ── Animation Loop ──────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let frameCount = 0;

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = Math.min(clock.getDelta(), 0.1); // Cap delta time
    
    // Step physics
    physicsWorld.step(1 / 60, deltaTime, 3);

    drone.update(deltaTime);
    missionManager.update();
    mapSystem.update(); // Update Map Markers
    
    // Update docked drones
    dockedDrones.forEach(d => d.update(deltaTime));
    
    packages.forEach(pkg => {
        pkg.update(deltaTime);
    });

    // Camera follow
    const offset = new THREE.Vector3(0, 5, 10);
    const yaw = drone.mesh.rotation.y;
    
    if (!isNaN(yaw)) {
        const rotatedOffset = offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        const targetPos = drone.mesh.position.clone().add(rotatedOffset);
        camera.position.lerp(targetPos, 0.1);
        camera.lookAt(drone.mesh.position);
    } else {
        camera.position.set(0, 20, 20);
        camera.lookAt(0, 0, 0);
    }

    // ── HUD Updates (every 10 frames for perf) ──
    frameCount++;
    if (frameCount % 10 === 0) {
        const scoreEl = document.getElementById('hud-score');
        const fpsEl   = document.getElementById('hud-fps');
        const fleetEl = document.getElementById('hud-fleet-status');

        if (scoreEl) scoreEl.textContent = missionManager.score || 0;
        if (fpsEl)   fpsEl.textContent = (1 / deltaTime).toFixed(0);

        // Count active missions
        if (fleetEl && missionManager.droneStates) {
            let active = 0;
            missionManager.droneStates.forEach(s => { if (s.phase !== 'idle') active++; });
            fleetEl.textContent = active > 0 ? `${active} drone${active > 1 ? 's' : ''} on mission` : 'All docked — waiting';
        }

        // Sync hidden #score for MissionManager compatibility
        const hiddenScore = document.getElementById('score');
        if (hiddenScore) hiddenScore.textContent = missionManager.score || 0;

        // Check for feed updates
        checkFeedUpdates();
    }

    renderer.render(scene, camera);
}

animate();

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

