import * as THREE from 'three';

export class Drone {
    constructor(collidables = []) {
        this.collidables = collidables;
        this.mesh = new THREE.Group();
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.rotationVelocity = 0;
        
        // Physics constants
        this.speed = 50; // Increased from 20
        this.lift = 60; // Increased from 30
        this.rotationSpeed = 2; // Increased from 2
        this.damping = 0.95;
        this.gravity = 9.8;

        // Control state
        this.keys = {
            w: false,
            s: false,
            a: false,
            d: false,
            q: false,
            e: false,
            shift: false,
            space: false
        };

        this.rotors = [];
        
        this.buildDrone();
        this.setupControls();
    }

    buildDrone() {
        // Materials
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x808080, 
            metalness: 0.7, 
            roughness: 0.3,
        });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.5 });
        const emissiveBlue = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 });

        // Main Body (Sleek central unit)
        const bodyGeo = new THREE.BoxGeometry(1, 0.25, 0.6);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        this.mesh.add(body);

        // Top Dome/Cover
        const domeGeo = new THREE.BoxGeometry(0.6, 0.1, 0.4);
        const dome = new THREE.Mesh(domeGeo, darkMat);
        dome.position.y = 0.175;
        this.mesh.add(dome);

        // Arms (X-Configuration)
        const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6);
        const arm1 = new THREE.Mesh(armGeo, darkMat);
        arm1.rotation.z = Math.PI / 2;
        arm1.rotation.y = Math.PI / 4;
        this.mesh.add(arm1);

        const arm2 = new THREE.Mesh(armGeo, darkMat);
        arm2.rotation.z = Math.PI / 2;
        arm2.rotation.y = -Math.PI / 4;
        this.mesh.add(arm2);

        // Rotors & Motors
        const rotorGeo = new THREE.BoxGeometry(0.8, 0.01, 0.08);
        const rotorMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const positions = [
            { x: 0.55, z: 0.55, dir: 1 },
            { x: -0.55, z: 0.55, dir: -1 },
            { x: 0.55, z: -0.55, dir: -1 },
            { x: -0.55, z: -0.55, dir: 1 }
        ];

        positions.forEach(pos => {
            // Motor
            const motorGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.15);
            const motor = new THREE.Mesh(motorGeo, bodyMat);
            motor.position.set(pos.x * 1.4, 0.05, pos.z * 1.4);
            this.mesh.add(motor);

            // Rotor Blade
            const rotor = new THREE.Mesh(rotorGeo, rotorMat);
            rotor.position.set(0, 0.1, 0);
            motor.add(rotor);
            this.rotors.push(rotor);
        });

        // Landing Gear (Skids)
        const skidGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2);
        const strutGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4);
        
        // Left Skid
        const leftSkid = new THREE.Mesh(skidGeo, darkMat);
        leftSkid.rotation.x = Math.PI / 2;
        leftSkid.position.set(-0.3, -0.3, 0);
        this.mesh.add(leftSkid);

        const lStrut1 = new THREE.Mesh(strutGeo, darkMat);
        lStrut1.position.set(-0.3, -0.15, 0.4);
        lStrut1.rotation.x = -0.2;
        this.mesh.add(lStrut1);

        const lStrut2 = new THREE.Mesh(strutGeo, darkMat);
        lStrut2.position.set(-0.3, -0.15, -0.4);
        lStrut2.rotation.x = 0.2;
        this.mesh.add(lStrut2);

        // Right Skid
        const rightSkid = new THREE.Mesh(skidGeo, darkMat);
        rightSkid.rotation.x = Math.PI / 2;
        rightSkid.position.set(0.3, -0.3, 0);
        this.mesh.add(rightSkid);

        const rStrut1 = new THREE.Mesh(strutGeo, darkMat);
        rStrut1.position.set(0.3, -0.15, 0.4);
        rStrut1.rotation.x = -0.2;
        this.mesh.add(rStrut1);

        const rStrut2 = new THREE.Mesh(strutGeo, darkMat);
        rStrut2.position.set(0.3, -0.15, -0.4);
        rStrut2.rotation.x = 0.2;
        this.mesh.add(rStrut2);

        // Camera Gimbal (Visual)
        const gimbalGeo = new THREE.SphereGeometry(0.12);
        const gimbal = new THREE.Mesh(gimbalGeo, darkMat);
        gimbal.position.set(0, -0.15, -0.35);
        this.mesh.add(gimbal);

        const lensGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1);
        const lens = new THREE.Mesh(lensGeo, darkMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, 0, -0.1);
        gimbal.add(lens);

        // LEDs
        const ledGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const frontLed = new THREE.Mesh(ledGeo, emissiveBlue);
        frontLed.position.set(0.2, 0.13, -0.3);
        this.mesh.add(frontLed);
        
        const frontLed2 = frontLed.clone();
        frontLed2.position.set(-0.2, 0.13, -0.3);
        this.mesh.add(frontLed2);

        // Magnet/Claw (Delivery Mechanism)
        const magnetGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05);
        const magnetMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.2 });
        const magnet = new THREE.Mesh(magnetGeo, magnetMat);
        magnet.position.set(0, -0.15, 0);
        this.mesh.add(magnet);
        
        this.mesh.castShadow = true;
        this.mesh.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    setupControls() {
        window.addEventListener('keydown', (e) => this.onKey(e, true));
        window.addEventListener('keyup', (e) => this.onKey(e, false));
    }

    onKey(event, isDown) {
        const key = event.key.toLowerCase();
        switch(key) {
            case 'w': this.keys.w = isDown; break;
            case 's': this.keys.s = isDown; break;
            case 'a': this.keys.a = isDown; break;
            case 'd': this.keys.d = isDown; break;
            case 'q': this.keys.q = isDown; break;
            case 'e': this.keys.e = isDown; break;
            case ' ': this.keys.space = isDown; break;
            case 'shift': this.keys.shift = isDown; break;
            case 'f': 
                if (isDown && !this.keys.f) { // Trigger only on press
                    this.togglePickup();
                }
                this.keys.f = isDown; 
                break;
        }
    }

    togglePickup() {
        if (this.carriedPackage) {
            this.drop();
        } else {
            this.tryPickup();
        }
    }

    tryPickup() {
        // Find nearest package
        let nearest = null;
        let minDist = 1.5; // Pickup range

        if (!window.packages) return; // Access global packages list

        window.packages.forEach(pkg => {
            if (pkg.isHeld) return;
            const dist = this.mesh.position.distanceTo(pkg.mesh.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = pkg;
            }
        });

        if (nearest) {
            this.carriedPackage = nearest;
            nearest.isHeld = true;
            // Attach to drone
            this.mesh.attach(nearest.mesh);
            nearest.mesh.position.set(0, -0.5, 0);
        }
    }

    drop() {
        if (this.carriedPackage) {
            const pkg = this.carriedPackage;
            this.carriedPackage = null;
            pkg.isHeld = false;
            
            // Detach from drone and re-add to scene
            this.mesh.parent.attach(pkg.mesh);
            
            // Inherit velocity
            pkg.velocity.copy(this.velocity);
            pkg.velocity.y -= 1; // Slight downward push
        }
    }

    checkCollision(position) {
        // Adjust box to cover the skids (approx -0.3 below center)
        // Center at position.y - 0.15, height 0.8 (from +0.25 to -0.55)
        const boxCenter = position.clone();
        boxCenter.y -= 0.15;
        const droneBox = new THREE.Box3().setFromCenterAndSize(boxCenter, new THREE.Vector3(1, 0.8, 1)); 

        for (const object of this.collidables) {
            const buildingBox = new THREE.Box3().setFromObject(object);
            if (droneBox.intersectsBox(buildingBox)) {
                return true;
            }
        }
        return false;
    }

    addToScene(scene) {
        scene.add(this.mesh);
        this.mesh.position.set(0, 14, 0); // Start on top of Dark Store
    }

    update(deltaTime) {
        // Rotor animation
        this.rotors.forEach(rotor => {
            rotor.rotation.y += 15 * deltaTime;
        });

        // Physics
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.mesh.quaternion);
        const up = new THREE.Vector3(0, 1, 0);

        // Acceleration
        this.acceleration.set(0, -this.gravity, 0); // Gravity

        if (this.keys.space) this.acceleration.add(up.clone().multiplyScalar(this.lift));
        if (this.keys.shift) this.acceleration.add(up.clone().multiplyScalar(-this.lift * 0.5)); // Descent assist
        
        if (this.keys.w) this.acceleration.add(forward.clone().multiplyScalar(this.speed));
        if (this.keys.s) this.acceleration.add(forward.clone().multiplyScalar(-this.speed));
        if (this.keys.a) this.acceleration.add(right.clone().multiplyScalar(-this.speed));
        if (this.keys.d) this.acceleration.add(right.clone().multiplyScalar(this.speed));

        // Velocity update
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        this.velocity.multiplyScalar(this.damping); // Air resistance

        // Position update - Split into Y and XZ to handle landing better
        
        // 1. Try moving XZ
        const nextPosXZ = this.mesh.position.clone();
        nextPosXZ.add(new THREE.Vector3(this.velocity.x * deltaTime, 0, this.velocity.z * deltaTime));
        
        if (!this.checkCollision(nextPosXZ)) {
            this.mesh.position.x = nextPosXZ.x;
            this.mesh.position.z = nextPosXZ.z;
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        // 2. Try moving Y
        const nextPosY = this.mesh.position.clone();
        nextPosY.y += this.velocity.y * deltaTime;

        if (!this.checkCollision(nextPosY)) {
            this.mesh.position.y = nextPosY.y;
        } else {
            // Collision in Y
            if (this.velocity.y < 0) {
                // Landing on something
                this.velocity.y = 0;
                // Optional: Snap to surface? Hard without raycast. 
                // Just stop is fine if delta is small.
            } else {
                // Hitting ceiling?
                this.velocity.y = 0;
            }
        }

        // Floor collision (Global ground safety)
        if (this.mesh.position.y < 0.5) {
            this.mesh.position.y = 0.5;
            this.velocity.y = Math.max(0, this.velocity.y);
        }

        // Rotation (Yaw)
        let targetRotationVelocity = 0;
        if (this.keys.q) targetRotationVelocity = this.rotationSpeed;
        if (this.keys.e) targetRotationVelocity = -this.rotationSpeed;
        
        this.mesh.rotation.y += targetRotationVelocity * deltaTime;

        // Tilt (Visual feedback)
        const targetTiltX = (this.keys.w ? -0.2 : 0) + (this.keys.s ? 0.2 : 0);
        const targetTiltZ = (this.keys.a ? 0.2 : 0) + (this.keys.d ? -0.2 : 0);
        
        this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, targetTiltX, deltaTime * 5);
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, targetTiltZ, deltaTime * 5);
    }
}
