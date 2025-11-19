import * as THREE from 'three';

export class Package {
    constructor(scene, position) {
        this.scene = scene;
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
        this.velocity = new THREE.Vector3();
        this.gravity = 9.8;
        this.isHeld = false;

        scene.add(this.mesh);
    }

    update(deltaTime) {
        if (this.isHeld) return;

        // Gravity
        this.velocity.y -= this.gravity * deltaTime;
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Floor collision
        if (this.mesh.position.y < 0.25) {
            this.mesh.position.y = 0.25;
            this.velocity.y = 0;
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
    }
}
