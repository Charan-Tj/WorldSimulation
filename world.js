import * as THREE from 'three'

// Configuration
const GRID_SIZE = 5 // 5x5 grid
const BLOCK_SIZE = 30
const ROAD_WIDTH = 10
const CITY_OFFSET = ((GRID_SIZE * (BLOCK_SIZE + ROAD_WIDTH)) - ROAD_WIDTH) / 2

export function createWorld(scene) {
  const collidables = []

  // Ground (Base layer)
  const groundGeometry = new THREE.PlaneGeometry(400, 400)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2b2b }) // Darker base
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.1
  ground.receiveShadow = true
  scene.add(ground)

  createCityGrid(scene, collidables)
  
  return collidables
}

function createCityGrid(scene, collidables) {
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
      // Calculate center position of this block
      const xPos = (x * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + (BLOCK_SIZE / 2)
      const zPos = (z * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + (BLOCK_SIZE / 2)

      // Determine Block Type
      if (x === 2 && z === 2) {
        createDarkStore(scene, xPos, zPos, collidables)
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

function createDarkStore(scene, x, z, collidables) {
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

  // Signage Text (Simulated with a bright box for now)
  const signGeo = new THREE.BoxGeometry(10, 2, 1)
  const signMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xaaaaaa })
  const sign = new THREE.Mesh(signGeo, signMat)
  sign.position.set(x, 10, z + (BLOCK_SIZE * 0.3) + 0.6)
  scene.add(sign)
  collidables.push(sign)
}

function createResidentialBlock(scene, x, z, collidables) {
  // Plot Grass
  const plotGeo = new THREE.PlaneGeometry(BLOCK_SIZE, BLOCK_SIZE)
  const plotMat = new THREE.MeshStandardMaterial({ color: 0x4a6b4a }) // Muted Green
  const plot = new THREE.Mesh(plotGeo, plotMat)
  plot.rotation.x = -Math.PI / 2
  plot.position.set(x, 0.05, z)
  plot.receiveShadow = true
  scene.add(plot)

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

