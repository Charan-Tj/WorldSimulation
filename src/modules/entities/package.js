import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Package {
    constructor(scene, physicsWorld, position) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.mesh = new THREE.Group();
        
        // Box visual
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xd2b48c, // Cardboard color
            roughness: 0.8 
        });
        const box = new THREE.Mesh(geometry, material);
        box.castShadow = true;
        box.receiveShadow = true;
        this.mesh.add(box);

        // Tape detail
        const tapeGeo = new THREE.PlaneGeometry(0.51, 0.1);
        const tapeMat = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
        const tape = new THREE.Mesh(tapeGeo, tapeMat);
        tape.position.z = 0.251;
        this.mesh.add(tape);

        this.mesh.position.copy(position);
        this.isHeld = false;
        this.delivered = false;

        // Physics Body
        const shape = new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25));
        this.body = new CANNON.Body({
            mass: 1, // kg
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape
        });
        this.physicsWorld.addBody(this.body);

        scene.add(this.mesh);
    }

    update(deltaTime) {
        // Sync mesh with body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
}
