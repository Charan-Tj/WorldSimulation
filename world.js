import * as THREE from 'three'
import { Drone } from './src/drone.js'
import { Package } from './src/package.js'

// Configuration
const GRID_SIZE = 5 // 5x5 grid
const BLOCK_SIZE = 30
const ROAD_WIDTH = 10
const CITY_OFFSET = ((GRID_SIZE * (BLOCK_SIZE + ROAD_WIDTH)) - ROAD_WIDTH) / 2

export function createWorld(scene) {
  const collidables = []
  const dockedDrones = []
  const conveyorPackages = []

  // Ground (Base layer)
  const groundGeometry = new THREE.PlaneGeometry(400, 400)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2b2b }) // Darker base
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.1
  ground.receiveShadow = true
  scene.add(ground)

  createCityGrid(scene, collidables, dockedDrones, conveyorPackages)
  
  return { collidables, dockedDrones, conveyorPackages }
}

function createCityGrid(scene, collidables, dockedDrones, conveyorPackages) {
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
      // Calculate center position of this block
      const xPos = (x * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + (BLOCK_SIZE / 2)
      const zPos = (z * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + (BLOCK_SIZE / 2)

      // Determine Block Type
      if (x === 2 && z === 2) {
        createDarkStore(scene, xPos, zPos, collidables, dockedDrones, conveyorPackages)
      } else if ((x === 1 && z === 1) || (x === 3 && z === 3) || (x === 1 && z === 3) || (x === 3 && z === 1)) {
        createPark(scene, xPos, zPos, collidables)
      } else {
        createResidentialBlock(scene, xPos, zPos, collidables)
      }
    }
  }

  createGridRoads(scene)
}

function createGridRoads(scene) {
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })
  const totalSize = GRID_SIZE * (BLOCK_SIZE + ROAD_WIDTH) - ROAD_WIDTH

  // Horizontal Roads (along X)
  for (let z = 0; z < GRID_SIZE - 1; z++) {
    const zPos = (z * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + BLOCK_SIZE + (ROAD_WIDTH / 2)
    const road = new THREE.Mesh(new THREE.PlaneGeometry(totalSize, ROAD_WIDTH), roadMaterial)
    road.rotation.x = -Math.PI / 2
    road.position.set(0, 0.02, zPos)
    road.receiveShadow = true
    scene.add(road)
  }

  // Vertical Roads (along Z)
  for (let x = 0; x < GRID_SIZE - 1; x++) {
    const xPos = (x * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + BLOCK_SIZE + (ROAD_WIDTH / 2)
    const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, totalSize), roadMaterial)
    road.rotation.x = -Math.PI / 2
    road.position.set(xPos, 0.02, 0)
    road.receiveShadow = true
    scene.add(road)
  }
}

function createDarkStore(scene, x, z, collidables, dockedDrones, conveyorPackages) {
  // Plot Base
  const baseGeo = new THREE.BoxGeometry(BLOCK_SIZE, 1, BLOCK_SIZE)
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x555555 })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.set(x, 0.5, z)
  base.receiveShadow = true
  scene.add(base)
  collidables.push(base)

  // Main Building
  const buildingGeo = new THREE.BoxGeometry(BLOCK_SIZE * 0.8, 12, BLOCK_SIZE * 0.6)
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x1a4d6e }) // Dark Blue
  const building = new THREE.Mesh(buildingGeo, buildingMat)
  building.position.set(x, 6.5, z)
  building.castShadow = true
  building.receiveShadow = true
  scene.add(building)
  collidables.push(building)

  // Roof Details (Simple)
  const roofGeo = new THREE.BoxGeometry(BLOCK_SIZE * 0.85, 0.5, BLOCK_SIZE * 0.65)
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2a5d7e })
  const roof = new THREE.Mesh(roofGeo, roofMat)
  roof.position.set(x, 12.75, z)
  scene.add(roof)
  collidables.push(roof)

  // --- ROOF FEATURES ---

  // 1. Conveyor Belt
  const beltWidth = 4;
  const beltLength = BLOCK_SIZE * 0.6;
  const beltGeo = new THREE.BoxGeometry(beltWidth, 0.2, beltLength);
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const belt = new THREE.Mesh(beltGeo, beltMat);
  belt.position.set(x - 5, 13.1, z); // Offset to left side of roof
  scene.add(belt);
  collidables.push(belt);

  // Packages on Belt
  for(let i = 0; i < 5; i++) {
      const zOffset = (i - 2) * 3; 
      const pos = new THREE.Vector3(x - 5, 13.45, z + zOffset); // 13.1 (belt) + 0.1 (half belt) + 0.25 (half box)
      const pkg = new Package(scene, pos, collidables);
      pkg.isStatic = true; // Don't fall through roof
      conveyorPackages.push(pkg);
  }

  // 2. Docked Drones
  // Place them on the right side of the roof
  for(let i = 0; i < 5; i++) {
      const drone = new Drone(collidables, false); // false = not player controlled
      drone.addToScene(scene);
      const zOffset = (i - 2) * 3;
      drone.mesh.position.set(x + 5, 13.5, z + zOffset);
      drone.mesh.rotation.y = -Math.PI / 2; // Face outward
      dockedDrones.push(drone);
  }

  // 3. Screen
  // Create a canvas for the screen texture
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 512, 256);
  
  // Draw Text
  ctx.fillStyle = '#00ff00';
  ctx.font = 'bold 40px Arial';
  ctx.fillText('DARK STORE OPS', 20, 60);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '30px Arial';
  ctx.fillText('Delivery Location: Sector 7', 20, 120);
  ctx.fillText('Active Drones: 6', 20, 170);
  ctx.fillText('Pending Orders: 12', 20, 220);

  const screenTexture = new THREE.CanvasTexture(canvas);
  const screenGeo = new THREE.PlaneGeometry(8, 4);
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  
  // Position screen at the back of the roof, facing forward
  screen.position.set(x, 15, z - (BLOCK_SIZE * 0.3));
  screen.rotation.y = 0; // Face +Z (or check camera angle)
  // Actually, let's make it face the camera's likely start position or just rotate it to be visible
  // If camera is at (0, 20, 20) and looking at 0,0,0. Dark store is at 2,2 (center).
  // Let's make it double sided or place it nicely.
  screenMat.side = THREE.DoubleSide;
  
  scene.add(screen);

  // Signage Text (Keep existing sign too, maybe move it)
  const signGeo = new THREE.BoxGeometry(10, 2, 1)
  const signMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xaaaaaa })
  const sign = new THREE.Mesh(signGeo, signMat)
  sign.position.set(x, 10, z + (BLOCK_SIZE * 0.3) + 0.6)
  scene.add(sign)
  collidables.push(sign)
}

function createResidentialBlock(scene, x, z, collidables) {
  // Plot Grass
  const plotGeo = new THREE.BoxGeometry(BLOCK_SIZE, 1, BLOCK_SIZE)
  const plotMat = new THREE.MeshStandardMaterial({ color: 0x4a6b4a }) // Muted Green
  const plot = new THREE.Mesh(plotGeo, plotMat)
  plot.position.set(x, 0.5, z)
  plot.receiveShadow = true
  scene.add(plot)
  collidables.push(plot)

  // 4 Buildings per block
  const positions = [
    { dx: -0.25, dz: -0.25 },
    { dx: 0.25, dz: -0.25 },
    { dx: -0.25, dz: 0.25 },
    { dx: 0.25, dz: 0.25 }
  ]

  positions.forEach(pos => {
    const bWidth = BLOCK_SIZE * 0.4
    const bDepth = BLOCK_SIZE * 0.4
    const bHeight = Math.random() * 8 + 4 // Random height 4-12

    const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth)
    const bMat = new THREE.MeshStandardMaterial({ color: 0xe0d6c2 }) // Beige
    const building = new THREE.Mesh(bGeo, bMat)
    
    const bx = x + (pos.dx * BLOCK_SIZE)
    const bz = z + (pos.dz * BLOCK_SIZE)
    
    building.position.set(bx, bHeight / 2, bz)
    building.castShadow = true
    building.receiveShadow = true
    scene.add(building)
    collidables.push(building)

    // Windows (Texture simulation with simple geometry if needed, skipping for perf for now)
  })
}

function createPark(scene, x, z, collidables) {
  // Park Grass
  const parkGeo = new THREE.BoxGeometry(BLOCK_SIZE, 0.5, BLOCK_SIZE)
  const parkMat = new THREE.MeshStandardMaterial({ color: 0x228B22 }) // Forest Green
  const park = new THREE.Mesh(parkGeo, parkMat)
  park.position.set(x, 0.25, z)
  park.receiveShadow = true
  scene.add(park)
  collidables.push(park)

  // Trees
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.5)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  const leavesGeo = new THREE.ConeGeometry(1.5, 3, 8)
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x32CD32 })

  for (let i = 0; i < 8; i++) {
    const tx = x + (Math.random() - 0.5) * (BLOCK_SIZE * 0.8)
    const tz = z + (Math.random() - 0.5) * (BLOCK_SIZE * 0.8)

    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.set(tx, 1, tz)
    trunk.castShadow = true
    trunk.receiveShadow = true
    scene.add(trunk)
    collidables.push(trunk)

    const leaves = new THREE.Mesh(leavesGeo, leavesMat)
    leaves.position.set(tx, 3, tz)
    leaves.castShadow = true
    leaves.receiveShadow = true
    scene.add(leaves)
    collidables.push(leaves)
  }
}

