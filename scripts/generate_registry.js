const fs = require('fs');

const GRID_SIZE = 5;
const SECTORS = {
    'NW': (x, z) => x <= 2 && z <= 2,
    'NE': (x, z) => x > 2 && z <= 2,
    'SW': (x, z) => x <= 2 && z > 2,
    'SE': (x, z) => x > 2 && z > 2
};

const registry = [];

for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
        let type = 'Residential';
        let name = `Block ${x}-${z}`;
        let doorRange = `${x}01-${x}04`; // Fake door range
        
        // Determine Sector
        let sector = 'Central';
        if (x < 2 && z < 2) sector = 'NW';
        else if (x > 2 && z < 2) sector = 'NE';
        else if (x < 2 && z > 2) sector = 'SW';
        else if (x > 2 && z > 2) sector = 'SE';
        else sector = 'Central'; // Middle cross

        // Specific Types
        if (x === 2 && z === 2) {
            type = 'Dark Store';
            name = 'Central Hub';
            doorRange = 'HUB-01';
        } else if ((x === 1 && z === 1) || (x === 3 && z === 3) || (x === 1 && z === 3) || (x === 3 && z === 1)) {
            type = 'Park';
            name = `Park ${sector}`;
            doorRange = 'N/A';
        } else if (x === 4 && z === 4) {
            type = 'Hostel';
            name = 'Student Hostel';
            doorRange = 'H-100-H-200';
        }

        // ID Generation
        const id = `SEC-${sector}-${x}${z}`;

        registry.push({
            id,
            name,
            type,
            grid_x: x,
            grid_z: z, // Using z to match 3D world
            sector,
            door_range: doorRange
        });
    }
}

fs.writeFileSync('city_registry.json', JSON.stringify(registry, null, 2));
console.log('City registry generated.');
