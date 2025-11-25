const fs = require('fs');

// Configuration matching world.js
const GRID_SIZE = 5;
const BLOCK_SIZE = 30;
const ROAD_WIDTH = 10;
const CITY_OFFSET = ((GRID_SIZE * (BLOCK_SIZE + ROAD_WIDTH)) - ROAD_WIDTH) / 2;

let svgContent = `<svg width="500" height="500" viewBox="-110 -110 220 220" xmlns="http://www.w3.org/2000/svg">
  <rect x="-110" y="-110" width="220" height="220" fill="#2b2b2b" />
`;

// Draw Roads
const totalSize = GRID_SIZE * (BLOCK_SIZE + ROAD_WIDTH) - ROAD_WIDTH;
const roadColor = "#333333";

// Horizontal Roads
for (let z = 0; z < GRID_SIZE - 1; z++) {
    const zPos = (z * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + BLOCK_SIZE + (ROAD_WIDTH / 2);
    svgContent += `  <rect x="${-totalSize/2}" y="${zPos - ROAD_WIDTH/2}" width="${totalSize}" height="${ROAD_WIDTH}" fill="${roadColor}" />\n`;
}

// Vertical Roads
for (let x = 0; x < GRID_SIZE - 1; x++) {
    const xPos = (x * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + BLOCK_SIZE + (ROAD_WIDTH / 2);
    svgContent += `  <rect x="${xPos - ROAD_WIDTH/2}" y="${-totalSize/2}" width="${ROAD_WIDTH}" height="${totalSize}" fill="${roadColor}" />\n`;
}

// Draw Blocks
for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
        const xPos = (x * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + (BLOCK_SIZE / 2);
        const zPos = (z * (BLOCK_SIZE + ROAD_WIDTH)) - CITY_OFFSET + (BLOCK_SIZE / 2);
        
        // Block rect (centered at xPos, zPos)
        const bx = xPos - BLOCK_SIZE/2;
        const bz = zPos - BLOCK_SIZE/2;

        let color = "#4a6b4a"; // Default Residential Green
        let label = "";

        if (x === 2 && z === 2) {
            color = "#1a4d6e"; // Dark Store Blue
            label = "Dark Store";
        } else if ((x === 1 && z === 1) || (x === 3 && z === 3) || (x === 1 && z === 3) || (x === 3 && z === 1)) {
            color = "#228B22"; // Park Green
            label = "Park";
        } else {
            // Residential Buildings
            // Draw small rects for buildings inside
            svgContent += `  <rect x="${bx}" y="${bz}" width="${BLOCK_SIZE}" height="${BLOCK_SIZE}" fill="${color}" />\n`;
            
            // 4 Buildings
            const bSize = BLOCK_SIZE * 0.4;
            const bColor = "#e0d6c2";
            svgContent += `  <rect x="${bx + BLOCK_SIZE*0.05}" y="${bz + BLOCK_SIZE*0.05}" width="${bSize}" height="${bSize}" fill="${bColor}" />\n`;
            svgContent += `  <rect x="${bx + BLOCK_SIZE*0.55}" y="${bz + BLOCK_SIZE*0.05}" width="${bSize}" height="${bSize}" fill="${bColor}" />\n`;
            svgContent += `  <rect x="${bx + BLOCK_SIZE*0.05}" y="${bz + BLOCK_SIZE*0.55}" width="${bSize}" height="${bSize}" fill="${bColor}" />\n`;
            svgContent += `  <rect x="${bx + BLOCK_SIZE*0.55}" y="${bz + BLOCK_SIZE*0.55}" width="${bSize}" height="${bSize}" fill="${bColor}" />\n`;
            continue;
        }

        svgContent += `  <rect x="${bx}" y="${bz}" width="${BLOCK_SIZE}" height="${BLOCK_SIZE}" fill="${color}" />\n`;
        if (label) {
             svgContent += `  <text x="${xPos}" y="${zPos}" font-family="Arial" font-size="5" fill="white" text-anchor="middle" dominant-baseline="middle">${label}</text>\n`;
        }
    }
}

svgContent += `</svg>`;

fs.writeFileSync('city_map.svg', svgContent);
console.log('City map SVG generated.');
