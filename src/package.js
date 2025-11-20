import * as THREE from 'three';

export class Package {
    constructor(scene, position, collidables = []) {
        this.scene = scene;
        this.collidables = collidables;
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
        this.isStatic = false;

        scene.add(this.mesh);
    }

    checkCollision(position) {
        const boxCenter = position.clone();
        const pkgBox = new THREE.Box3().setFromCenterAndSize(boxCenter, new THREE.Vector3(0.5, 0.5, 0.5)); 

        for (const object of this.collidables) {
            const objectBox = new THREE.Box3().setFromObject(object);
            if (pkgBox.intersectsBox(objectBox)) {
                return true;
            }
        }
        return false;
    }

    update(deltaTime) {
        if (this.isHeld || this.isStatic) return;

        // Gravity
        this.velocity.y -= this.gravity * deltaTime;
        
        // Try moving X
        const nextPosX = this.mesh.position.clone();
        nextPosX.x += this.velocity.x * deltaTime;
        if (!this.checkCollision(nextPosX)) {
            this.mesh.position.x = nextPosX.x;
        } else {
            this.velocity.x = 0;
        }

        // Try moving Z
        const nextPosZ = this.mesh.position.clone();
        nextPosZ.z += this.velocity.z * deltaTime;
        if (!this.checkCollision(nextPosZ)) {
            this.mesh.position.z = nextPosZ.z;
        } else {
            this.velocity.z = 0;
        }

        // Try moving Y
        const nextPosY = this.mesh.position.clone();
        nextPosY.y += this.velocity.y * deltaTime;

        if (!this.checkCollision(nextPosY)) {
            this.mesh.position.y = nextPosY.y;
        } else {
            // Collision in Y
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
                this.velocity.x *= 0.5; // Friction
                this.velocity.z *= 0.5;
            } else {
                this.velocity.y = 0;
            }
        }

        // Floor collision (Global safety net)
        if (this.mesh.position.y < 0.25) {
            this.mesh.position.y = 0.25;
            this.velocity.y = 0;
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
    }
}
