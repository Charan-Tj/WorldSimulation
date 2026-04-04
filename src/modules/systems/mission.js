import * as THREE from 'three';

// Mission phases for each AI drone
const PHASE = {
    IDLE: 'idle',
    ASCENDING_TO_PICKUP: 'ascending_to_pickup',
    FLYING_TO_PICKUP: 'flying_to_pickup',
    DESCENDING_TO_PICKUP: 'descending_to_pickup',
    PICKING_UP: 'picking_up',
    ASCENDING: 'ascending',
    FLYING_TO_ZONE: 'flying_to_zone',
    DESCENDING: 'descending',
    DROPPING: 'dropping',
    RETURNING: 'returning',
};

const CRUISE_ALTITUDE = 22;   // Height drones travel at
const PICKUP_ALTITUDE = 13.6; // Rooftop level
const DROP_ALTITUDE   = 3;    // Ground hover before drop

export class MissionManager {
    constructor(scene, packages, deliveryZones) {
        this.scene = scene;
        this.packages = packages;
        this.deliveryZones = deliveryZones;

        // Per-drone mission state
        this.droneStates = new Map(); // drone -> { phase, target, assignedPackage, homePos, timer }

        this.score = 0;
        this.scoreEl = document.getElementById('score');

        this._missionInterval = null;
    }

    /** Call this after docked drones are created so we can track them */
    registerDrones(dockedDrones) {
        this.dockedDrones = dockedDrones;
        dockedDrones.forEach(drone => {
            this.droneStates.set(drone, {
                phase: PHASE.IDLE,
                target: null,
                assignedPackage: null,
                // Store home position so they can return
                homePos: drone.mesh.position.clone(),
                timer: 0,
            });
        });

        // Kick off mission dispatch every 3 s
        this._missionInterval = setInterval(() => this._dispatchIdle(), 3000);
    }

    /** Assign a mission to any idle drone that has a package available */
    _dispatchIdle() {
        if (!this.dockedDrones) return;

        this.dockedDrones.forEach(drone => {
            const state = this.droneStates.get(drone);
            if (!state || state.phase !== PHASE.IDLE) return;

            // Pick an unassigned, undelivered package from the conveyor belt
            const pkg = this.packages.find(
                p => !p.isHeld && !p.delivered && p.isStatic
            );
            if (!pkg) return;

            // Pick a free delivery zone
            const zone = this.deliveryZones
                ? this.deliveryZones.find(z => !z.isOccupied)
                : null;
            if (!zone) return;

            pkg.isHeld = true;
            zone.isOccupied = true;

            state.assignedPackage = pkg;
            state.targetZone      = zone;
            state.phase           = PHASE.ASCENDING_TO_PICKUP;
            state.target          = new THREE.Vector3(
                drone.mesh.position.x,
                CRUISE_ALTITUDE,
                drone.mesh.position.z
            );
        });
    }

    update() {
        if (!this.droneStates) return;

        this.droneStates.forEach((state, drone) => {
            this._tickDrone(drone, state);
        });
    }

    _tickDrone(drone, state) {
        const pos = drone.mesh.position;

        switch (state.phase) {

            // ── Rise to cruise altitude above dock ──────────────────────────
            case PHASE.ASCENDING_TO_PICKUP: {
                const done = this._moveTo(drone, state.target, 8);
                if (done) {
                    // Fly horizontally to directly above the package
                    const pkg = state.assignedPackage;
                    state.target = new THREE.Vector3(pkg.mesh.position.x, CRUISE_ALTITUDE, pkg.mesh.position.z);
                    state.phase  = PHASE.FLYING_TO_PICKUP;
                }
                break;
            }

            // ── Fly to above the pickup point ───────────────────────────────
            case PHASE.FLYING_TO_PICKUP: {
                const done = this._moveTo(drone, state.target, 10);
                if (done) {
                    const pkg = state.assignedPackage;
                    state.target = new THREE.Vector3(pkg.mesh.position.x, PICKUP_ALTITUDE, pkg.mesh.position.z);
                    state.phase  = PHASE.DESCENDING_TO_PICKUP;
                }
                break;
            }

            // ── Descend to rooftop pickup altitude ──────────────────────────
            case PHASE.DESCENDING_TO_PICKUP: {
                const done = this._moveTo(drone, state.target, 6);
                if (done) {
                    state.phase = PHASE.PICKING_UP;
                    state.timer = 0.6; // hold for 0.6 s
                }
                break;
            }

            // ── Briefly hover while "attaching" package ──────────────────────
            case PHASE.PICKING_UP: {
                state.timer -= 0.016;
                const pkg = state.assignedPackage;
                if (pkg) {
                    // Freeze the package under the drone
                    pkg.body.position.set(pos.x, pos.y - 0.6, pos.z);
                    pkg.body.velocity.set(0, 0, 0);
                    pkg.mesh.position.copy(pkg.body.position);
                }
                if (state.timer <= 0) {
                    state.target = new THREE.Vector3(pos.x, CRUISE_ALTITUDE, pos.z);
                    state.phase  = PHASE.ASCENDING;
                }
                break;
            }

            // ── Ascend back to cruise altitude ──────────────────────────────
            case PHASE.ASCENDING: {
                const done = this._moveTo(drone, state.target, 8);
                // Carry package along
                this._carryPackage(drone, state);
                if (done) {
                    const zone = state.targetZone;
                    state.target = new THREE.Vector3(zone.position.x, CRUISE_ALTITUDE, zone.position.z);
                    state.phase  = PHASE.FLYING_TO_ZONE;
                }
                break;
            }

            // ── Cruise to delivery zone ──────────────────────────────────────
            case PHASE.FLYING_TO_ZONE: {
                const done = this._moveTo(drone, state.target, 10);
                this._carryPackage(drone, state);
                if (done) {
                    const zone = state.targetZone;
                    state.target = new THREE.Vector3(zone.position.x, DROP_ALTITUDE, zone.position.z);
                    state.phase  = PHASE.DESCENDING;
                }
                break;
            }

            // ── Descend to delivery zone ─────────────────────────────────────
            case PHASE.DESCENDING: {
                const done = this._moveTo(drone, state.target, 6);
                this._carryPackage(drone, state);
                if (done) {
                    state.phase = PHASE.DROPPING;
                    state.timer = 0.5;
                }
                break;
            }

            // ── Drop the package ─────────────────────────────────────────────
            case PHASE.DROPPING: {
                state.timer -= 0.016;
                this._carryPackage(drone, state);
                if (state.timer <= 0) {
                    const pkg  = state.assignedPackage;
                    if (pkg) {
                        pkg.isHeld    = false;
                        pkg.delivered = true;
                        pkg.isStatic  = false;  // Let physics take over
                        // Give it a tiny downward nudge
                        pkg.body.velocity.set(0, -1, 0);
                        this._flashZone(state.targetZone);
                    }
                    state.targetZone.isOccupied = false;
                    this._incrementScore();

                    // Return home
                    state.target = new THREE.Vector3(
                        state.homePos.x, CRUISE_ALTITUDE, state.homePos.z
                    );
                    state.phase  = PHASE.RETURNING;
                    state.assignedPackage = null;
                }
                break;
            }

            // ── Return to dock, then descend to home ─────────────────────────
            case PHASE.RETURNING: {
                const done = this._moveTo(drone, state.target, 10);
                if (done) {
                    if (Math.abs(pos.y - state.homePos.y) > 0.5) {
                        // Still at cruise alt — descend to dock
                        state.target = state.homePos.clone();
                    } else {
                        state.phase = PHASE.IDLE;
                    }
                }
                break;
            }

            case PHASE.IDLE:
            default:
                break;
        }
    }

    /** Move a kinematic drone toward target. Returns true when arrived. */
    _moveTo(drone, target, speed) {
        const pos = drone.mesh.position;
        const dir = new THREE.Vector3().subVectors(target, pos);
        const dist = dir.length();

        if (dist < 0.4) {
            // Snap exactly
            drone.body.position.set(target.x, target.y, target.z);
            drone.mesh.position.copy(drone.body.position);
            return true;
        }

        dir.normalize();
        const step = speed * 0.016; // ~60fps
        const moveVec = dir.clone().multiplyScalar(Math.min(step, dist));

        drone.body.position.x += moveVec.x;
        drone.body.position.y += moveVec.y;
        drone.body.position.z += moveVec.z;
        drone.mesh.position.copy(drone.body.position);

        // Face direction of travel (yaw only)
        if (Math.abs(dir.x) + Math.abs(dir.z) > 0.01) {
            const angle = Math.atan2(dir.x, dir.z);
            drone.mesh.rotation.y = angle;
        }

        return false;
    }

    /** Pin the package under the drone while carrying */
    _carryPackage(drone, state) {
        const pkg = state.assignedPackage;
        if (!pkg) return;
        const pos = drone.mesh.position;
        pkg.body.position.set(pos.x, pos.y - 0.6, pos.z);
        pkg.body.velocity.set(0, 0, 0);
        pkg.mesh.position.copy(pkg.body.position);
    }

    /** Flash the delivery zone green briefly on success */
    _flashZone(zone) {
        if (!zone || !zone.mesh) return;
        const mat = zone.mesh.material;
        const originalColor = mat.color.getHex();
        mat.color.set(0x00ffff);
        mat.opacity = 0.8;
        setTimeout(() => {
            mat.color.setHex(originalColor);
            mat.opacity = 0.3;
        }, 600);
    }

    _incrementScore() {
        this.score++;
        if (this.scoreEl) {
            this.scoreEl.textContent = this.score;
        }
    }

    destroy() {
        if (this._missionInterval) {
            clearInterval(this._missionInterval);
        }
    }
}
