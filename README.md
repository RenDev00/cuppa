# Cuppa

A digital workplace for remote teams - a lightweight, ephemeral, real-time virtual co-working space in pure pixel-art style. Users join instantly with zero registration or persistent data. Everything runs in server memory and disappears on disconnect/restart. Designed for <50 concurrent users per room, sub-100ms feel, <5 MB total bundle.

## Architecture Plan

### Core Principles
- No database, no accounts, no cookies beyond session.
- Only Socket.io + Express as runtime deps.
- Pixel-perfect aesthetic: all assets use a limited 16–32 color palette; CSS `image-rendering: pixelated;`.
- Fixed seats only (no free movement, no pathfinding → ultra-simple).
- One global room per workplace type initially (auto-spawn "cafe-2" when full).
- Preload everything; optimistic UI updates; delta broadcasts.

### Tech Stack
| Layer     | Choice                          | Reason |
|-----------|---------------------------------|--------|
| Backend   | Node.js 20 + Express + Socket.io v4 | Single binary, WebSocket rooms, in-memory Map state |
| Frontend  | Vanilla JS (or optional Vite + Svelte 5) | Zero framework bloat option; Svelte only if you want reactivity in <10 KB |
| Rendering | DOM + absolute-positioned `<div>`s inside a fixed 960×540 px container | Faster than Canvas for text/labels; pixelated images look perfect |
| Hosting   | Render.com or Railway (free tier) | WebSocket support out-of-the-box, instant deploys |

### Project Layout
```
cuppa/
├── server/
│   ├── index.js          ← Express + Socket.io
│   └── state.js          ← in-memory rooms & seats
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
│   └── assets/
│       ├── avatars/      ← avatar-01.png … avatar-20.png (32×48 px)
│       ├── bgs/          ← cafe.png, park.png … (960×540 px)
│       └── icons/        ← 16×16 status icons
├── package.json
├── vite.config.js        ← optional (only if using Svelte/Vite)
└── render.yaml          ← deploy template
```

### Asset Requirements
- 5 workplaces: Café, Library, Park Bench, Cozy Bar, Study Loft.
- 12–20 avatars: front-facing pixel characters
- 8 status icons or tiny PNGs
- All PNGs optimized; consistent palette

### Data Structures (server in-memory only)
```js
// state.js
const workplacesConfig = {
  cafe: {
    bg: '/assets/bgs/cafe.png',
    seats: [
      { id: 0, x: 180, y: 320 },
      { id: 1, x: 320, y: 310 },
    ]
  },
};

const rooms = new Map(); // key: "cafe" or "cafe-2"
```

Each room value:
```js
{
  users: new Map(), // socketId → { username, avatarId, seatId, status, joinedAt }
  seats: [{id, x, y, occupiedBy: socketId | null }, …]
}
```

### User Flow & Screens
1. **Landing** - Username input + avatar grid + "Find a place"
2. **Workplace selector** - 2×3 grid of thumbnail cards
3. **Room view** - Full container with backgrounds, avatars, seats, toolbar
4. **Leave** - Back to workplace selector

### Real-time Events (Socket.io)
| Event                | Direction   | Payload size | Action |
|----------------------|-------------|--------------|--------|
| joinWorkplace        | client→server | tiny        | getOrCreateRoom, send full state |
| roomState            | server→all  | ~1–2 KB     | full snapshot on join |
| userJoined / userLeft| server→all  | <100 B      | delta |
| claimSeat            | client→server | {seatId}    | atomic check & assign |
| seatUpdated          | server→all  | delta       | move avatar |
| updateStatus         | client→server | {status}    | optimistic then broadcast |
| disconnect           | automatic   | —           | cleanup + broadcast leave |

### Performance & Snappiness Guarantees
- Preload all assets on landing
- Optimistic UI: status/seat change happens instantly on client
- Delta broadcasts after initial state
- Max 25 users per room → auto-create "cafe-2" when full

## Getting Started

### Prerequisites
- Node.js 20+

### Installation
```bash
npm install
```

### Development
Start both Vite dev server and Express backend:
```bash
# Terminal 1 - Start backend
npm run dev:server

# Terminal 2 - Start frontend
npm run dev
```

Or use Vite which proxies WebSocket to port 3000:
```bash
npm run dev
```

Access the app at http://localhost:5173

### Production Build
```bash
npm run build
```

### Deploy
Deploy to Render.com using the included `render.yaml`:
```bash
render blueprint create render.yaml
```

## API Endpoints

- `GET /health` - Health check endpoint

## Socket Events

- `joinWorkplace` - Join a workplace room
- `roomState` - Receive room state on join
- `userJoined` - Notification when user joins
- `userLeft` - Notification when user leaves
- `claimSeat` - Claim a seat in the room
- `seatUpdated` - Seat update broadcast
- `updateStatus` - Update user status
- `userStatusUpdated` - Status update broadcast
