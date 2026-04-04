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

// Animation Loop
const clock = new THREE.Clock();

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
    // Simple 3rd person follow
    const offset = new THREE.Vector3(0, 5, 10); // Behind and up
    
    // Better: Rotate offset by drone's Y rotation
    const yaw = drone.mesh.rotation.y;
    
    if (!isNaN(yaw)) {
        const rotatedOffset = offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        const targetPos = drone.mesh.position.clone().add(rotatedOffset);
        camera.position.lerp(targetPos, 0.1);
        camera.lookAt(drone.mesh.position);
    } else {
        // Fallback if yaw is NaN
        camera.position.set(0, 20, 20);
        camera.lookAt(0, 0, 0);
    }

    // Debug Logging (On Screen)
    const debugEl = document.getElementById('debug-info') || createDebugOverlay();
    
    let droneInfo = `
        Frame: ${renderer.info.render.frame}<br>
        <b>Player:</b> ${formatVec(drone.mesh.position)}<br>
        Yaw: ${drone.yaw !== undefined ? drone.yaw.toFixed(2) : 'NaN'}<br>
        Keys: Q:${drone.keys.q} E:${drone.keys.e}<br>
        FPS: ${(1/deltaTime).toFixed(0)}<br>
        <hr>
        <b>Docked Drones (${dockedDrones.length}):</b><br>
    `;

    dockedDrones.forEach((d, i) => {
        droneInfo += `D${i}: ${formatVec(d.mesh.position)}<br>`;
    });

    debugEl.innerHTML = droneInfo;

    renderer.render(scene, camera);
}

function createDebugOverlay() {
    const div = document.createElement('div');
    div.id = 'debug-info';
    div.style.position = 'absolute';
    div.style.top = '10px';
    div.style.right = '10px';
    div.style.color = 'white';
    div.style.fontFamily = 'monospace';
    div.style.backgroundColor = 'rgba(0,0,0,0.5)';
    div.style.padding = '10px';
    document.body.appendChild(div);
    return div;
}

function formatVec(v) {
    return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;
}

animate();

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

