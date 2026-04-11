const fs = require('fs');
const path = require('path');

// Configuration matching world.js
const GRID_SIZE = 5;
const BLOCK_SIZE = 30;
const ROAD_WIDTH = 10;
const CITY_OFFSET = ((GRID_SIZE * (BLOCK_SIZE + ROAD_WIDTH)) - ROAD_WIDTH) / 2;
const totalSize = GRID_SIZE * (BLOCK_SIZE + ROAD_WIDTH) - ROAD_WIDTH;

// ── Colors ──────────────────────────────────────────────────────────────────
const C = {
    bg:           '#141822',
    road:         '#2a2e3e',
    roadLine:     '#3d4255',
    residential:  '#1c3a2a',
    resBldg:      '#c4b99a',
    resBldgStroke: '#9a9078',
    park:         '#1a4d2a',
    parkTree:     '#2d7a42',
    parkTreeDark: '#1a5c2e',
    darkStore:    '#1a3f5e',
    darkStoreTop: '#245980',
    helipad:      '#fc8019',
    text:         '#e0e0e0',
    textDim:      '#8890a0',
    deliveryZone: '#44cc8855',
    deliveryRing: '#44cc88',
};

let svg = `<svg width="500" height="500" viewBox="-115 -115 230 230" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Road dash pattern -->
    <pattern id="roadDash" patternUnits="userSpaceOnUse" width="8" height="2" patternTransform="rotate(0)">
      <rect x="0" y="0" width="4" height="1" fill="${C.roadLine}" opacity="0.5"/>
    </pattern>
    <!-- Park grass pattern -->
    <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="6" height="6">
      <rect width="6" height="6" fill="${C.park}"/>
      <circle cx="1.5" cy="1.5" r="0.5" fill="${C.parkTree}" opacity="0.3"/>
      <circle cx="4.5" cy="4.5" r="0.5" fill="${C.parkTree}" opacity="0.3"/>
    </pattern>
    <!-- Glow filter for delivery zones -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <!-- Shadow for buildings -->
    <filter id="bldgShadow">
      <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect x="-115" y="-115" width="230" height="230" fill="${C.bg}" rx="6"/>

`;

// ── Draw Roads ──────────────────────────────────────────────────────────────

// Horizontal Roads
for (let z = 0; z < GRID_SIZE - 1; z++) {
    const zPos = (z * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + BLOCK_SIZE + (ROAD_WIDTH / 2);
    const ry = zPos - ROAD_WIDTH / 2;
    svg += `  <rect x="${-totalSize/2}" y="${ry}" width="${totalSize}" height="${ROAD_WIDTH}" fill="${C.road}" rx="1"/>\n`;
    // Center line
    svg += `  <line x1="${-totalSize/2}" y1="${zPos}" x2="${totalSize/2}" y2="${zPos}" stroke="${C.roadLine}" stroke-width="0.4" stroke-dasharray="3,2" opacity="0.6"/>\n`;
}

// Vertical Roads
for (let x = 0; x < GRID_SIZE - 1; x++) {
    const xPos = (x * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + BLOCK_SIZE + (ROAD_WIDTH / 2);
    const rx = xPos - ROAD_WIDTH / 2;
    svg += `  <rect x="${rx}" y="${-totalSize/2}" width="${ROAD_WIDTH}" height="${totalSize}" fill="${C.road}" rx="1"/>\n`;
    // Center line
    svg += `  <line x1="${xPos}" y1="${-totalSize/2}" x2="${xPos}" y2="${totalSize/2}" stroke="${C.roadLine}" stroke-width="0.4" stroke-dasharray="3,2" opacity="0.6"/>\n`;
}

// ── Draw Blocks ─────────────────────────────────────────────────────────────
for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
        const xPos = (x * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + (BLOCK_SIZE / 2);
        const zPos = (z * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + (BLOCK_SIZE / 2);
        const bx = xPos - BLOCK_SIZE / 2;
        const bz = zPos - BLOCK_SIZE / 2;

        if (x === 2 && z === 2) {
            // ── Dark Store ──────────────────────────────────────
            svg += `  <rect x="${bx}" y="${bz}" width="${BLOCK_SIZE}" height="${BLOCK_SIZE}" fill="${C.darkStore}" rx="2"/>\n`;
            // Main building footprint
            const bw = BLOCK_SIZE * 0.8;
            const bh = BLOCK_SIZE * 0.6;
            svg += `  <rect x="${xPos - bw/2}" y="${zPos - bh/2}" width="${bw}" height="${bh}" fill="${C.darkStoreTop}" rx="1.5" filter="url(#bldgShadow)"/>\n`;
            // Helipad circle
            svg += `  <circle cx="${xPos + 5}" cy="${zPos}" r="3" fill="none" stroke="${C.helipad}" stroke-width="0.6" opacity="0.7"/>\n`;
            svg += `  <text x="${xPos + 5}" y="${zPos + 0.5}" font-family="Arial, sans-serif" font-size="2.5" fill="${C.helipad}" text-anchor="middle" dominant-baseline="middle" font-weight="bold">H</text>\n`;
            // Conveyor belt
            svg += `  <rect x="${xPos - 7}" y="${zPos - bh/2 + 2}" width="4" height="${bh - 4}" fill="#111" rx="0.5" opacity="0.6"/>\n`;
            // Label
            svg += `  <text x="${xPos}" y="${zPos + BLOCK_SIZE/2 - 2}" font-family="Arial, sans-serif" font-size="3" fill="${C.helipad}" text-anchor="middle" font-weight="bold">DARK STORE</text>\n`;

        } else if ((x === 1 && z === 1) || (x === 3 && z === 3) || (x === 1 && z === 3) || (x === 3 && z === 1)) {
            // ── Parks ────────────────────────────────────────────
            svg += `  <rect x="${bx}" y="${bz}" width="${BLOCK_SIZE}" height="${BLOCK_SIZE}" fill="url(#grassPattern)" rx="2"/>\n`;
            svg += `  <rect x="${bx}" y="${bz}" width="${BLOCK_SIZE}" height="${BLOCK_SIZE}" fill="none" stroke="${C.parkTreeDark}" stroke-width="0.4" rx="2"/>\n`;
            // Trees (scatter)
            for (let t = 0; t < 6; t++) {
                const tx = bx + 4 + (t % 3) * 10 + (Math.sin(t * 7) * 2);
                const tz = bz + 6 + Math.floor(t / 3) * 14 + (Math.cos(t * 5) * 2);
                svg += `  <circle cx="${tx}" cy="${tz}" r="2.5" fill="${C.parkTree}" opacity="0.7"/>\n`;
                svg += `  <circle cx="${tx}" cy="${tz}" r="1.5" fill="${C.parkTreeDark}" opacity="0.5"/>\n`;
            }
            svg += `  <text x="${xPos}" y="${zPos + BLOCK_SIZE/2 - 2}" font-family="Arial, sans-serif" font-size="2.8" fill="${C.textDim}" text-anchor="middle" opacity="0.7">Park</text>\n`;

        } else {
            // ── Residential ──────────────────────────────────────
            svg += `  <rect x="${bx}" y="${bz}" width="${BLOCK_SIZE}" height="${BLOCK_SIZE}" fill="${C.residential}" rx="2"/>\n`;
            
            // 4 Buildings with shadows
            const bSize = BLOCK_SIZE * 0.35;
            const gap   = BLOCK_SIZE * 0.08;
            const positions = [
                [bx + gap, bz + gap],
                [bx + BLOCK_SIZE - gap - bSize, bz + gap],
                [bx + gap, bz + BLOCK_SIZE - gap - bSize],
                [bx + BLOCK_SIZE - gap - bSize, bz + BLOCK_SIZE - gap - bSize],
            ];
            positions.forEach(([px, pz]) => {
                svg += `  <rect x="${px}" y="${pz}" width="${bSize}" height="${bSize}" fill="${C.resBldg}" rx="1" filter="url(#bldgShadow)"/>\n`;
                svg += `  <rect x="${px}" y="${pz}" width="${bSize}" height="${bSize}" fill="none" stroke="${C.resBldgStroke}" stroke-width="0.3" rx="1"/>\n`;
            });

            // Delivery zone marker (small green circle)
            svg += `  <circle cx="${xPos}" cy="${zPos + BLOCK_SIZE * 0.3}" r="2" fill="${C.deliveryZone}" stroke="${C.deliveryRing}" stroke-width="0.4" filter="url(#glow)"/>\n`;
        }
    }
}

// ── Map Border ──────────────────────────────────────────────────────────────
svg += `  <rect x="-115" y="-115" width="230" height="230" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" rx="6"/>\n`;

svg += `</svg>`;

const outPath = path.join(__dirname, '..', 'src', 'assets', 'city_map.svg');
fs.writeFileSync(outPath, svg);
console.log(`City map SVG generated → ${outPath}`);
