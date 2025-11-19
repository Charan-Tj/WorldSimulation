import * as THREE from 'three'

export function createWorld(scene) {
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(200, 200)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x33aa33 }) // Green grass
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // Lanes (Roads)
  createRoads(scene)

  // Buildings
  createBuildings(scene)

  // Trees
  createTrees(scene)
}

function createRoads(scene) {
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })
  
  // Simple cross roads
  const road1 = new THREE.Mesh(new THREE.PlaneGeometry(20, 200), roadMaterial)
  road1.rotation.x = -Math.PI / 2
  road1.position.y = 0.01 // Slightly above ground
  road1.receiveShadow = true
  scene.add(road1)

  const road2 = new THREE.Mesh(new THREE.PlaneGeometry(200, 20), roadMaterial)
  road2.rotation.x = -Math.PI / 2
  road2.position.y = 0.01
  road2.receiveShadow = true
  scene.add(road2)
}

function createBuildings(scene) {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  
  for (let i = 0; i < 50; i++) {
    const height = Math.random() * 5 + 2
    const width = Math.random() * 2 + 1
    const depth = Math.random() * 2 + 1
    
    const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
    const building = new THREE.Mesh(geometry, material)
    
    building.scale.set(width, height, depth)
    
    // Random position avoiding roads (approx)
    let x = (Math.random() - 0.5) * 180
    let z = (Math.random() - 0.5) * 180
    
    // Simple check to avoid center roads
    if (Math.abs(x) < 15 || Math.abs(z) < 15) continue
    
    building.position.set(x, height / 2, z)
    building.castShadow = true
    building.receiveShadow = true
    scene.add(building)
  }
}

function createTrees(scene) {
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.2, 1)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  const leavesGeo = new THREE.ConeGeometry(1, 2, 8)
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228B22 })

  for (let i = 0; i < 100; i++) {
    let x = (Math.random() - 0.5) * 180
    let z = (Math.random() - 0.5) * 180
    
    if (Math.abs(x) < 12 || Math.abs(z) < 12) continue // Avoid roads

    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.set(x, 0.5, z)
    trunk.castShadow = true
    trunk.receiveShadow = true
    scene.add(trunk)

    const leaves = new THREE.Mesh(leavesGeo, leavesMat)
    leaves.position.set(x, 2, z)
    leaves.castShadow = true
    leaves.receiveShadow = true
    scene.add(leaves)
  }
}
