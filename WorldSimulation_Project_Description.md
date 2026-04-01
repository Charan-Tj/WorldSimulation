# 🚁 WorldSimulation — Complete Project Description

## Overview

**WorldSimulation** (internally named `InstaDrone`) is a full-stack **drone delivery simulation platform**. It combines a real-time, physics-driven **3D city environment** rendered in the browser with a **REST API backend** for managing users, products, and orders. Think of it as a sandbox for visualizing and testing autonomous last-mile delivery logistics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **3D Rendering** | [Three.js](https://threejs.org/) v0.181 |
| **Physics Engine** | [cannon-es](https://github.com/pmndrs/cannon-es) v0.20 |
| **Map Overlay** | [Leaflet.js](https://leafletjs.com/) v1.9 (CRS.Simple flat map) |
| **Frontend Build** | [Vite](https://vitejs.dev/) v7 |
| **CSS Framework** | TailwindCSS v4 (PostCSS) |
| **Backend Runtime** | Node.js + [Express.js](https://expressjs.com/) v5 |
| **Database** | MongoDB via [Mongoose](https://mongoosejs.com/) v8 |
| **Auth** | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| **Dev Server** | Nodemon |

---

## Project Structure

```
WorldSimulation/
├── index.html                   # Main simulation entry point
├── vite.config.js               # Vite bundler config
├── package.json
│
├── src/                         # Frontend source
│   ├── assets/
│   │   ├── city_map.svg         # Top-down SVG map of the city
│   │   └── city_registry.json   # Metadata for map blocks (sector, name, type)
│   ├── modules/
│   │   ├── core/
│   │   │   ├── world.js         # 3D city generation
│   │   │   └── MapSystem.js     # Leaflet 2D mini-map system
│   │   ├── entities/
│   │   │   ├── drone.js         # Drone class (player + AI)
│   │   │   └── package.js       # Deliverable package class
│   │   └── systems/
│   │       └── mission.js       # Mission manager
│   ├── pages/
│   │   ├── simulation/main.js   # Core simulation loop
│   │   ├── admin/               # Admin dashboard (HTML + JS)
│   │   ├── products/            # Product catalog page
│   │   ├── landing/             # Landing page
│   │   └── login/               # Auth pages
│   ├── styles/style.css
│   └── utils/counter.js
│
└── server/                      # Backend (Express + MongoDB)
    ├── index.js                 # App entry / route registration
    ├── models/
    │   ├── User.js
    │   ├── Product.js
    │   └── Order.js
    └── routes/
        ├── auth.js
        ├── products.js
        └── orders.js
```

---

## Frontend — 3D Simulation

### Scene Setup ([src/pages/simulation/main.js](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/src/pages/simulation/main.js))

The simulation bootstraps a full Three.js + cannon-es environment:

- **Sky-blue background** with atmospheric fog (`0x87CEEB`, range 10–150 units)
- **Real-time physics** at 60Hz (`physicsWorld.step(1/60, deltaTime, 3)`)
- **Soft shadow mapping** (PCFSoftShadow, 2048×2048 map)
- **Third-person camera** that smoothly lerps behind the player drone with yaw tracking

---

### World Generation ([src/modules/core/world.js](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/src/modules/core/world.js))

The city is procedurally built as a **5×5 grid** of city blocks, each 30 units wide separated by 10-unit roads.

| Block Type | Position | Details |
|---|---|---|
| **Dark Store** | Center (2,2) | Warehouse hub with rooftop conveyor, docked drones, ops screen |
| **Parks** | (1,1), (3,3), (1,3), (3,1) | Green space with 8 randomized trees |
| **Residential** | All other 20 blocks | 4 buildings per block (random heights 4–12u), green delivery zones |

Every visual mesh has a corresponding **CANNON.js static body** for physics collision.

#### Key World Features
- **Dark Store rooftop**: Conveyor belt with 5 static packages + 5 docked AI drones + canvas-rendered ops screen
- **Delivery Zones**: Semi-transparent green cylinders (radius 2) at each residential block
- **Grid Roads**: Procedural horizontal + vertical road meshes

---

### Drone Entity ([src/modules/entities/drone.js](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/src/modules/entities/drone.js))

The [Drone](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/src/modules/entities/drone.js#4-442) class supports **two modes**: player-controlled and AI/kinematic.

#### Visual Model
Built from Three.js primitives:
- X-configuration arms, 4 spinning rotors (with motors)
- Landing skids, camera gimbal with lens
- Emissive blue LEDs, delivery magnet/claw underneath

#### Player Controls

| Key | Action |
|---|---|
| `W / S` | Forward / Backward (force-based, has inertia) |
| `A / D` | Strafe Left / Right |
| `Q / E` | Yaw (rotate) Left / Right |
| `Space` | Ascend |
| `Shift` | Descend |
| `F` | Pick up / Drop nearest package |
| `R` | Emergency reset (also auto-triggers if drone falls below y=-10) |

#### Physics Design
- Y-axis movement: **velocity-based** (direct, stable hover/ascend/descend)
- XZ movement: **force-based** (realistic inertia, linear damping 0.5)
- Visual tilt is **faked** by tilting the mesh relative to local velocity (max tilt 0.3 rad)
- Rotation is driven by an explicit `yaw` float, bypassing physics quaternion drift

#### AI Drone Logic
- `body.type = CANNON.Body.KINEMATIC` — not affected by gravity
- [moveTo(x, y, z)](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/src/modules/entities/drone.js#241-245) sets a target; drone interpolates with `speed = 10 u/s`
- Faces direction of travel; mesh synced to kinematic body every frame

#### Package Pickup
Uses a **`CANNON.LockConstraint`** between the drone body and package body — the package is rigidly attached during carry and released on drop.

---

### Package Entity ([src/modules/entities/package.js](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/src/modules/entities/package.js))

A cardboard-box visual (0.5³ units, beige + tape detail) with a 1kg CANNON physics body. Syncs mesh position/quaternion to body each frame.

---

### Map System ([src/modules/core/MapSystem.js](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/src/modules/core/MapSystem.js))

An interactive **2D mini-map** using Leaflet with `CRS.Simple` (flat coordinate system).

- Renders an SVG city map image as an image overlay
- Loads `city_registry.json` and draws **invisible, clickable rectangles** over each block
- Hovering highlights a block in yellow; clicking shows a **popup** with: name, type, sector, door range
- **Trackable markers**: player drone (arrow icon) + AI drones (ally icons) move in real-time
- Supports **route drawing** ([drawRoute()](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/src/modules/core/MapSystem.js#171-192)) and clearing ([clearRoutes()](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/src/modules/core/MapSystem.js#193-202)) via Leaflet polylines
- **Toggle** with `M` key

#### Coordinate Mapping
```
3D World  →  Leaflet Map
x         →  Lng
z         →  Lat  (Leaflet is [Lat, Lng])
```

---

### Mission System ([src/modules/systems/mission.js](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/src/modules/systems/mission.js))

A `MissionManager` class that tracks packages and delivery zones. Referenced in the main loop but currently lightweight (placeholder for full mission logic).

---

### Console API (window globals)

Exposed helpers for browser-console drone control:

```js
window.spawnDrone(x, y, z)          // Spawn a new AI drone
window.moveDrone(index, x, y, z)    // Command a specific AI drone
window.commandAllDrones(x, y, z)    // Send all AI drones to an area
window.countDrones()                // Log total drone count
window.drawRoute([{x,z},...])       // Draw a route on the mini-map
window.clearRoutes()                // Clear map routes
```

---

## Backend — REST API

### Server ([server/index.js](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/server/index.js))

Express.js server on port `5000` (or `process.env.PORT`). Connects to MongoDB via Mongoose URI from [.env](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/.env).

**Named:** `InstaDrone API`

### API Routes

#### Auth (`/api/auth`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/register` | Register new user (bcrypt hashed password) |
| `POST` | `/login` | Login, returns JWT (1h expiry) with role |

#### Products (`/api/products`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List all products |
| `POST` | `/` | Add a new product |

#### Orders (`/api/orders`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Place a new order |
| `GET` | `/:userId` | Get orders for a specific user (with product details) |
| `GET` | `/` | Get all orders — admin view (with user + product details) |
| `GET` | `/analytics/daily` | Aggregated daily order count + total revenue |

---

## Data Models

### User
```js
{ username, email, password (hashed), role: 'user'|'admin', createdAt }
```

### Product
```js
{ name, description, price, category, image (URL), stock, createdAt }
```

### Order
```js
{
  user: ObjectId,
  products: [{ product: ObjectId, quantity }],
  totalAmount,
  status: 'pending'|'processing'|'delivering'|'delivered'|'cancelled',
  droneId,
  deliveryLocation: { lat, lng, address },
  createdAt
}
```

---

## Pages (Frontend)

| Page | Path | Description |
|---|---|---|
| **Simulation** | `/` (index.html) | Main 3D drone simulation view |
| **Products** | [/src/pages/products/products.html](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/src/pages/products/products.html) | Browse/order product catalog |
| **Admin** | [/src/pages/admin/admin.html](file:///home/crackjack/Projects/WorldSimulation/WorldSimulation/src/pages/admin/admin.html) | Admin dashboard (orders, analytics) |
| **Landing** | `/src/pages/landing/` | Marketing/landing page |
| **Login** | `/src/pages/login/` | User authentication |

---

## Scripts

| Script | Path | Purpose |
|---|---|---|
| `generate_map.js` | `scripts/` | Generates the `city_map.svg` top-down view |
| `generate_registry.js` | `scripts/` | Generates `city_registry.json` block metadata |

---

## Environment Variables (`.env`)

```
MONGO_URI=...       # MongoDB connection string
JWT_SECRET=...      # JWT signing secret
PORT=5000           # (optional) server port
```

---

## Running the Project

```bash
# Frontend (Vite dev server)
npm run dev

# Backend (in a separate terminal)
node server/index.js
# or with live reload:
npx nodemon server/index.js
```

---

## Current State & What's Built

| Feature | Status |
|---|---|
| 3D city world (5×5 grid) | ✅ Complete |
| Player drone with physics | ✅ Complete |
| AI/docked drones (kinematic) | ✅ Complete |
| Package pickup / drop (LockConstraint) | ✅ Complete |
| 2D Leaflet mini-map with live tracking | ✅ Complete |
| Map block popups & route drawing | ✅ Complete |
| City registry JSON + SVG map assets | ✅ Complete |
| Auth API (register/login/JWT) | ✅ Complete |
| Products API (CRUD) | ✅ Complete |
| Orders API + analytics | ✅ Complete |
| MongoDB data models | ✅ Complete |
| Admin dashboard UI | 🔧 In progress |
| Products page UI | 🔧 In progress |
| Mission system (full logic) | 🔧 Placeholder |
| AI drone autonomous delivery | 🔧 Not implemented |
| Real-time order → drone assignment | 🔧 Not implemented |
