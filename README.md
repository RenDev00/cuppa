# Cuppa

A digital workplace for remote teams - a lightweight, ephemeral, real-time virtual co-working space in pure pixel-art style. Users join instantly with zero registration or persistent data. Everything runs in server memory and disappears on disconnect/restart. Designed for <50 concurrent users per room, sub-100ms feel, <5 MB total bundle.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run both servers (recommended)
npm run dev          # Frontend on http://localhost:5173
npm run dev:server   # Backend on http://localhost:3000

# Or run separately in two terminals
npm run dev          # Terminal 1: Vite dev server
npm run dev:server   # Terminal 2: Express server
```

---

## Architecture

### Core Principles
- **No database, no accounts, no cookies** beyond session
- **Fixed seats only** (no free movement, no pathfinding)
- **Single room per workplace type** - rooms persist once created, no dynamic room creation
- **Server as source of truth** - always trust server state over client cache

### Tech Stack
| Layer | Choice | Reason |
|-------|--------|--------|
| Backend | Node.js + Express + Socket.io v4 | Single binary, WebSocket rooms, in-memory Map state |
| Frontend | Vanilla JS + Vite | Zero framework bloat, fast dev experience |
| Rendering | DOM + absolute-positioned divs in 960×540 container | Faster than Canvas for text/labels |

### Project Structure
```
cuppa/
├── server/
│   ├── index.js          # Express + Socket.io server
│   └── state.js          # In-memory rooms & workplaces config
├── public/
│   ├── index.html
│   ├── style.css
│   ├── script.js         # Client-side Socket.io logic
│   └── assets/
│       ├── avatars/      # 32×48 px pixel characters
│       ├── bgs/          # 960×540 px backgrounds
│       └── icons/        # Status icons
├── package.json
├── vite.config.js
└── AGENTS.md            # Guidelines for AI agents
```

---

## Workplaces

Five workplace types are configured in `server/state.js`:

| Workplace | Seats | Background |
|-----------|-------|------------|
| Café | 10 | cafe.png |
| Library | 10 | library.png |
| Park | 5 | park.png |
| Bar | 6 | bar.png |
| Study | 8 | study.png |

---

## Data Structures

### Server State (`server/state.js`)
```javascript
const workplacesConfig = {
  cafe: {
    bg: '/assets/bgs/cafe.png',
    seats: [{ id: 0, x: 180, y: 320 }, ...]
  }
};

const rooms = new Map(); // key: "cafe", "library", etc.
```

### Room Object
```javascript
{
  users: new Map(),  // socketId → { username, status }
  seats: [{ id, x, y, occupiedBy: socketId | null }, ...]
}
```

---

## Socket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `joinWorkplace` | `{ type, username }` | Join a workplace room |
| `claimSeat` | `{ roomName, seatId }` | Claim an available seat |
| `leaveRoom` | `{ roomName }` | Leave current room |
| `updateStatus` | `{ roomName, status }` | Update user status |
| `getRoomState` | `{ roomName }` | Request current room state |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `workplaceTypes` | `string[]` | List of available workplace types |
| `workplaceConfig` | `{ type: seatCount }` | Seat count per workplace |
| `roomsList` | `[{ name, userCount, maxUsers }]` | All rooms with user counts |
| `roomState` | `{ roomName, users, seats }` | Full room snapshot |
| `userJoined` | `{ socketId }` | User joined notification |
| `userLeft` | `{ socketId }` | User left notification |
| `seatUpdated` | `{ seatId, occupiedBy }` | Seat claim update |
| `userStatusUpdated` | `{ socketId, status }` | Status change broadcast |
| `roomFull` | `{ type }` | No available seats in room |

---

## User Flow

1. **Landing** - Enter username (min 3 chars)
2. **Workplace Selector** - View all workplaces with user counts
3. **Room View** - See seats, avatars, claim a seat, update status
4. **Leave** - Return to workplace selector

---

## Security & Validation

All socket events include server-side validation:
- Check user exists in room before allowing actions
- Validate workplace type exists in config
- Escape HTML on client to prevent XSS
- No secrets in client-side code

---

## Known Constraints

- In-memory state is lost on server restart
- No authentication/authorization
- Single workplace per room (no sub-rooms)
- Maximum users per workplace equals seat count defined in config
- No dynamic room creation - once a workplace is full, no new rooms are created

---

## API Endpoints

- `GET /health` - Health check endpoint

---

## Production

```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```
