import * as THREE from 'three';
import { Drone } from './src/drone.js';
import { Package } from './src/package.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -20;
dirLight.shadow.camera.left = -20;
dirLight.shadow.camera.right = 20;
scene.add(dirLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x33aa33 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);

// Packages
const packages = [];
window.packages = packages; // Expose for Drone to access

const pkg1 = new Package(scene, new THREE.Vector3(5, 0.5, 5));
packages.push(pkg1);

const pkg2 = new Package(scene, new THREE.Vector3(-5, 0.5, -5));
packages.push(pkg2);

const pkg3 = new Package(scene, new THREE.Vector3(5, 0.5, -5));
packages.push(pkg3);

// Drop Zone
const zoneGeometry = new THREE.RingGeometry(0.5, 2.5, 32);
const zoneMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
const dropZone = new THREE.Mesh(zoneGeometry, zoneMaterial);
dropZone.rotation.x = -Math.PI / 2;
dropZone.position.set(10, 0.05, 0); // Place it somewhere specific
scene.add(dropZone);

// Score
let score = 0;
const scoreEl = document.getElementById('score');

function updateScore(points) {
    score += points;
    scoreEl.innerText = score;
}

// Drone
const drone = new Drone();
drone.addToScene(scene);

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = Math.min(clock.getDelta(), 0.1); // Cap delta time
    drone.update(deltaTime);
    
    packages.forEach(pkg => {
        pkg.update(deltaTime);

        // Delivery Logic
        if (!pkg.isHeld && !pkg.delivered) {
            const distance = pkg.mesh.position.distanceTo(dropZone.position);
            if (distance < 2.5 && pkg.mesh.position.y < 0.5) {
                // Delivered!
                pkg.delivered = true;
                updateScore(100);
                
                // Visual feedback
                pkg.mesh.traverse(c => {
                    if (c.isMesh) c.material.color.setHex(0x00ff00); // Turn green
                });

                // Optional: Respawn or remove after delay?
                // For now, just leave it as "delivered"
            }
        }
    });

    // Camera follow
    const relativeCameraOffset = new THREE.Vector3(0, 2, 5);
    const cameraOffset = relativeCameraOffset.applyMatrix4(drone.mesh.matrixWorld);
    
    camera.position.lerp(cameraOffset, 0.1);
    camera.lookAt(drone.mesh.position);

    renderer.render(scene, camera);
}

animate();

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
