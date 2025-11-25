import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Drone {
    constructor(scene, physicsWorld, isPlayerControlled = true, startPosition = new THREE.Vector3(0, 14, 0)) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.isPlayerControlled = isPlayerControlled;
        this.startPosition = startPosition;
        
        this.mesh = new THREE.Group();
        this.mesh.frustumCulled = false; // DISABLE CULLING TO PREVENT DISAPPEARING
        
        // Physics constants
        this.speed = 20; // Reduced from 50
        this.lift = 55; // Reduced from 60 (Hover is ~49)
        this.rotationSpeed = 1.0; // Reduced from 2
        this.damping = 0.5; // Linear damping
        this.angularDamping = 0.9; // High angular damping to stop spinning

        // Control state
        this.keys = {
            w: false,
            s: false,
            a: false,
            d: false,
            q: false,
            e: false,
            r: false,
            shift: false,
            space: false
        };

        this.yaw = 0; // Track rotation explicitly
        this.rotors = [];
        
        this.buildDrone();
        this.mesh.position.copy(this.startPosition); // Force initial position
        this.initPhysics();

        if (this.isPlayerControlled) {
            this.setupControls();
        }
    }

    buildDrone() {
        // Materials
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, // White for visibility
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
        window.debugStatus = "Controls Setup";
        window.addEventListener('keydown', (e) => this.onKey(e, true));
        window.addEventListener('keyup', (e) => this.onKey(e, false));
    }

    onKey(event, isDown) {
        // Use code for physical key location (works better for games)
        const code = event.code; 
        window.lastKey = code; // Debug
        switch(code) {
            case 'KeyW': this.keys.w = isDown; break;
            case 'KeyS': this.keys.s = isDown; break;
            case 'KeyA': this.keys.a = isDown; break;
            case 'KeyD': this.keys.d = isDown; break;
            case 'KeyQ': this.keys.q = isDown; break;
            case 'KeyE': this.keys.e = isDown; break;
            case 'Space': this.keys.space = isDown; break;
            case 'ShiftLeft': 
            case 'ShiftRight': this.keys.shift = isDown; break;
            case 'KeyF': 
                if (isDown && !this.keys.f) { // Trigger only on press
                    this.togglePickup();
                }
                this.keys.f = isDown; 
                break;
            case 'KeyR': this.keys.r = isDown; break;
        }
    }

    initPhysics() {
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.25, 0.5)); // Approx size
        
        // For docked/AI drones, start them as KINEMATIC (ignore gravity/forces) so they stay put.
        // We can switch them to DYNAMIC later if we want them to fly.
        const mass = this.isPlayerControlled ? 5 : 0;
        
        this.body = new CANNON.Body({
            mass: mass, 
            position: new CANNON.Vec3(this.startPosition.x, this.startPosition.y, this.startPosition.z),
            shape: shape,
            linearDamping: 0.5,
            angularDamping: 0.5,
            fixedRotation: false
        });
        
        if (!this.isPlayerControlled) {
             this.body.type = CANNON.Body.KINEMATIC;
        }
        
        this.physicsWorld.addBody(this.body);
    }

    setPosition(position) {
        this.body.position.copy(position);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        this.mesh.position.copy(position);
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    moveTo(x, y, z) {
        this.targetPosition = new CANNON.Vec3(x, y, z);
        this.isMoving = true;
    }

    update(deltaTime) {
        // Rotor animation
        this.rotors.forEach(rotor => {
            rotor.rotation.y += 15 * deltaTime;
        });

        if (!this.isPlayerControlled) {
            // --- AI/Docked Drone Logic ---
            if (this.isMoving && this.targetPosition) {
                const currentPos = this.body.position;
                const direction = new CANNON.Vec3();
                this.targetPosition.vsub(currentPos, direction);
                
                const distance = direction.length();
                if (distance < 0.5) {
                    this.isMoving = false; // Arrived
                    this.body.velocity.set(0, 0, 0);
                    console.log(`Drone Arrived at ${this.targetPosition.toString()}`);
                    console.log(`Final State - Pos: ${this.mesh.position.toArray()}, Rot: ${this.mesh.rotation.y}, Visible: ${this.mesh.visible}`);
                } else {
                    direction.normalize();
                    if (!isNaN(direction.x)) { // Safety check
                        const speed = 10; // Units per second
                        
                        // Kinematic Movement: Directly update position
                        const moveStep = direction.scale(speed * deltaTime);
                        this.body.position.vadd(moveStep, this.body.position);
                        
                        // Face direction
                        const angle = Math.atan2(direction.x, direction.z);
                        
                        // SYNC BODY ROTATION (Fixes snapping)
                        const q = new CANNON.Quaternion();
                        q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
                        this.body.quaternion.copy(q);
                    }
                }
            }
            
            // ALWAYS Sync Mesh to Body for AI
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
            
            // DEBUG VISIBILITY
            if (!this.mesh.visible) {
                console.error("Drone became invisible!", this);
                this.mesh.visible = true; // Force visible
            }
            return;
        }

        // --- Player Control Logic ---
        // 1. Sync Mesh Position with Body
        this.mesh.position.copy(this.body.position);
        
        // 2. Sync Mesh Rotation (Yaw) with Body
        const bodyEuler = new THREE.Euler().setFromQuaternion(this.body.quaternion);
        this.mesh.rotation.y = bodyEuler.y;
        this.mesh.rotation.x = 0; // Reset for tilt calculation
        this.mesh.rotation.z = 0;

        // --- Physics Forces ---
        
        // Ensure Yaw is valid
        if (isNaN(this.yaw)) this.yaw = 0;
        
        // Directions (Global-ish, but relative to Yaw)
        const forward = new CANNON.Vec3(0, 0, -1);
        const right = new CANNON.Vec3(1, 0, 0);
        this.body.quaternion.vmult(forward, forward);
        this.body.quaternion.vmult(right, right);

        // Vertical Movement (Velocity-based for Arcade Stability)
        // We override gravity/forces for Y axis to ensure perfect hover and control
        let targetYVel = 0;
        if (this.keys.space) {
            targetYVel = 10; // Ascend speed
        } else if (this.keys.shift) {
            targetYVel = -8; // Descend speed
        }
        
        // Smoothly interpolate Y velocity or set directly?
        // Setting directly is most stable.
        this.body.velocity.y = THREE.MathUtils.lerp(this.body.velocity.y, targetYVel, deltaTime * 5);

        // Horizontal Movement (Force-based for inertia)
        const moveForce = 30;
        
        if (this.keys.w) this.body.applyForce(forward.scale(moveForce), this.body.position);
        if (this.keys.s) this.body.applyForce(forward.scale(-moveForce), this.body.position);
        if (this.keys.a) this.body.applyForce(right.scale(-moveForce), this.body.position);
        if (this.keys.d) this.body.applyForce(right.scale(moveForce), this.body.position);

        // Rotation (Yaw)
        // Explicit Yaw Control (Fail-safe)
        const rotationSpeed = 0.005; // Faster rotation
        
        if (this.keys.q) {
            this.yaw += rotationSpeed;
        } else if (this.keys.e) {
            this.yaw -= rotationSpeed;
        }
        
        // Apply Yaw to Body AND Mesh directly
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.yaw);
        this.body.quaternion.copy(q);
        
        // Direct visual sync (Bypass physics sync for rotation to ensure responsiveness)
        this.mesh.rotation.y = this.yaw;
        
        // Zero out angular velocity to prevent physics interference
        this.body.angularVelocity.set(0, 0, 0);

        // --- Visual Tilt (Fake Physics) ---
        const localVel = new THREE.Vector3().copy(this.body.velocity);
        localVel.applyQuaternion(this.mesh.quaternion.clone().invert());
        
        const maxTilt = 0.3; 
        const targetTiltX = THREE.MathUtils.clamp(localVel.z * 0.05, -maxTilt, maxTilt); 
        const targetTiltZ = THREE.MathUtils.clamp(-localVel.x * 0.05, -maxTilt, maxTilt); 

        this.mesh.rotation.x = targetTiltX;
        this.mesh.rotation.z = targetTiltZ;

        // --- Safety Net & Reset ---
        if (this.keys.r || this.body.position.y < -10 || isNaN(this.body.position.y)) {
            console.warn("Resetting Drone...");
            this.body.position.set(0, 14, 0);
            this.body.velocity.set(0, 0, 0);
            this.body.angularVelocity.set(0, 0, 0);
            this.yaw = 0;
            this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0);
        }
        
        // NaN Rotation Check
        if (isNaN(this.mesh.rotation.y)) {
             console.warn("Drone rotation is NaN! Resetting...");
             this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), 0);
             this.body.angularVelocity.set(0,0,0);
             this.mesh.rotation.set(0,0,0);
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
        let minDist = 2.0; 

        if (!window.packages) return; 

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
            
            // Physics attachment
            // Option 1: Lock Constraint
            this.pickupConstraint = new CANNON.LockConstraint(this.body, nearest.body);
            this.physicsWorld.addConstraint(this.pickupConstraint);
            
            // Wake up package
            nearest.body.wakeUp();
        }
    }

    drop() {
        if (this.carriedPackage) {
            const pkg = this.carriedPackage;
            this.carriedPackage = null;
            pkg.isHeld = false;
            
            // Remove constraint
            if (this.pickupConstraint) {
                this.physicsWorld.removeConstraint(this.pickupConstraint);
                this.pickupConstraint = null;
            }
        }
    }
}
