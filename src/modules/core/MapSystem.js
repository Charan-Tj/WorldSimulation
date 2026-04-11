import * as THREE from 'three';

export class MapSystem {
    constructor(config) {
        this.config = config; // { bounds: [[minX, minZ], [maxX, maxZ]], imagePath, registry }
        this.map = null;
        this.trackables = new Map(); // Map<Object3D, Marker>
        this.isVisible = false;
        
        this.init();
    }

    init() {
        const container = document.getElementById('map-container');
        if (!container) {
            console.error('Map container #map-container not found!');
            return;
        }

        // Initialize Leaflet Map
        // CRS.Simple is for flat maps (x, y) instead of lat/lng
        this.map = L.map('map-container', {
            crs: L.CRS.Simple,
            minZoom: -2,
            maxZoom: 2,
            zoomControl: false,
            attributionControl: false
        });

        // Set Bounds
        // Leaflet uses [y, x] for coordinates (Lat, Lng). 
        // Our 3D world is (x, z). So we map: z -> Lat (y), x -> Lng (x)
        // Bounds: [[minZ, minX], [maxZ, maxX]]
        const bounds = [
            [this.config.bounds[0][1], this.config.bounds[0][0]], // [minZ, minX]
            [this.config.bounds[1][1], this.config.bounds[1][0]]  // [maxZ, maxX]
        ];

        // Add Image Overlay
        L.imageOverlay(this.config.imagePath, bounds).addTo(this.map);

        // Fit map to bounds
        this.map.fitBounds(bounds);

        // Add Registry Layer (Interactive Blocks)
        if (this.config.registry) {
            this.addRegistryLayer();
        }

        // Key Listener for 'M'
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyM') {
                this.toggle();
            }
        });

        // Close button
        const closeBtn = document.getElementById('map-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.toggle());
        }
    }

    addRegistryLayer() {
        // Grid Config (Hardcoded for now based on world.js, or could be passed in)
        const BLOCK_SIZE = 30;
        const ROAD_WIDTH = 10;
        const GRID_SIZE = 5;
        const CITY_OFFSET = ((GRID_SIZE * (BLOCK_SIZE + ROAD_WIDTH)) - ROAD_WIDTH) / 2;

        this.config.registry.forEach(block => {
            // Calculate Block Bounds in World Coords
            const xPos = (block.grid_x * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + (BLOCK_SIZE / 2);
            const zPos = (block.grid_z * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + (BLOCK_SIZE / 2);
            
            const minX = xPos - BLOCK_SIZE / 2;
            const maxX = xPos + BLOCK_SIZE / 2;
            const minZ = zPos - BLOCK_SIZE / 2;
            const maxZ = zPos + BLOCK_SIZE / 2;

            // Leaflet Bounds: [[minZ, minX], [maxZ, maxX]]
            const blockBounds = [[minZ, minX], [maxZ, maxX]];

            // Create Rectangle
            const rect = L.rectangle(blockBounds, {
                color: 'transparent',
                weight: 1,
                fillOpacity: 0 // Invisible but clickable
            }).addTo(this.map);

            // Popup Content
            const popupContent = `
                <div style="text-align: center; min-width: 160px">
                    <div style="font-weight: 800; font-size: 1rem; margin-bottom: 4px">${block.name}</div>
                    <div style="font-size: 0.75rem; color: #aeb5c0; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px">${block.type}</div>
                    <div style="
                        display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
                        font-size: 0.78rem; color: rgba(255,255,255,0.7);
                        background: rgba(255,255,255,0.03); border-radius: 8px; padding: 6px;
                    ">
                        <div>Sector</div><div style="font-weight:700;color:white">${block.sector}</div>
                        <div>Doors</div><div style="font-weight:700;color:white">${block.door_range}</div>
                    </div>
                </div>
            `;

            rect.bindPopup(popupContent);
            
            // Highlight on hover
            rect.on('mouseover', () => {
                rect.setStyle({ color: '#ffff00', weight: 2 });
            });
            rect.on('mouseout', () => {
                rect.setStyle({ color: 'transparent', weight: 1 });
            });
        });
    }

    addTrackable(object3D, type) {
        if (!this.map) return;

        // Create Marker Icon
        const className = `map-marker marker-${type}`;
        const icon = L.divIcon({
            className: className,
            iconSize: [12, 12],
            iconAnchor: [6, 6] // Center
        });

        // Initial Position (0,0)
        const marker = L.marker([0, 0], { icon: icon }).addTo(this.map);
        
        this.trackables.set(object3D, marker);
    }

    removeTrackable(object3D) {
        const marker = this.trackables.get(object3D);
        if (marker) {
            marker.remove();
            this.trackables.delete(object3D);
        }
    }

    update() {
        if (!this.isVisible || !this.map) return;

        this.trackables.forEach((marker, object3D) => {
            // Update Position
            // Map Z -> Lat, X -> Lng
            const lat = object3D.position.z;
            const lng = object3D.position.x;
            marker.setLatLng([lat, lng]);

            // Update Rotation (for Player)
            // Leaflet markers don't support rotation natively easily without plugin,
            // but we can rotate the DOM element if needed.
            // For now, let's just update position. 
            // If it's the player (arrow), we might want to rotate the icon.
            if (marker.options.icon.options.className.includes('marker-player')) {
                const rotation = -object3D.rotation.y * (180 / Math.PI); // Convert rad to deg
                const iconEl = marker.getElement();
                if (iconEl) {
                    iconEl.style.transform += ` rotate(${rotation}deg)`;
                }
            }
        });
    }

    toggle() {
        const overlay = document.getElementById('map-overlay');
        this.isVisible = !this.isVisible;

        if (overlay) {
            if (this.isVisible) {
                overlay.classList.add('visible');
            } else {
                overlay.classList.remove('visible');
            }
        }
        
        if (this.isVisible) {
            // Leaflet needs to know it's visible to size correctly
            setTimeout(() => {
                this.map.invalidateSize();
            }, 50);
        }
    }

    /**
     * Draws a route on the map.
     * @param {Array<{x: number, z: number}>} points - Array of world coordinates.
     * @param {Object} options - Leaflet polyline options (color, weight, etc.).
     * @returns {L.Polyline} The created polyline layer.
     */
    drawRoute(points, options = { color: 'blue', weight: 3, dashArray: '5, 10' }) {
        if (!this.map) return null;

        // Convert World (x, z) to Map (lat, lng)
        // Remember: z -> lat, x -> lng
        const latLngs = points.map(p => [p.z, p.x]);

        const route = L.polyline(latLngs, options).addTo(this.map);
        
        // Store if needed for clearing later (could add to a list)
        if (!this.routes) this.routes = [];
        this.routes.push(route);

        return route;
    }

    /**
     * Clears all drawn routes from the map.
     */
    clearRoutes() {
        if (this.routes) {
            this.routes.forEach(route => route.remove());
            this.routes = [];
        }
    }
}
