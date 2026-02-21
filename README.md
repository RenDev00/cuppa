# Cuppa

A digital workplace for remote teams - a lightweight, ephemeral, real-time virtual co-working space in pure pixel-art style. Users join instantly with zero registration or persistent data. Everything runs in server memory and disappears on disconnect/restart. Designed for <50 concurrent users per room, sub-100ms feel, <5 MB total bundle.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run both servers in separate terminals

# Terminal 1 - Frontend (Vite dev server)
npm run dev          # Opens at http://localhost:5173

# Terminal 2 - Backend (Express + Socket.io)
npm run dev:server   # Runs on http://localhost:3000
```

### Production

```bash
# Build frontend
npm run build

# Preview production build
npm run preview
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
| Fonts | Jersey10, Tiny5 | Pixel-art themed typography |

### Project Structure
```
/cuppa
├── public/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── assets/
│       ├── avatars/
│       ├── bgs/
│       ├── fonts/
│       └── thumbnails/
├── server/
│   ├── index.js    # Express + Socket.io handlers
│   └── state.js    # In-memory state & helpers
├── package.json
├── vite.config.js
└── AGENTS.md
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
  users: new Map(),  // socketId → { username, avatar, status }
  seats: [{ id, x, y, occupiedBy: socketId | null }, ...]
}
```

### User Selection (Client)
```javascript
const userSelection = {
  username: string,   // 2-16 characters
  avatar: string     // avatar filename (e.g., "cat.png")
};
```

---

## Socket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `joinWorkplace` | `{ type, username, avatar }` | Join a workplace room |
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
| `userJoined` | `{ socketId, username, avatar }` | User joined notification |
| `userLeft` | `{ socketId, seatFreed }` | User left notification |
| `seatClaimed` | `{ seatId, socketId }` | Seat claimed update |
| `seatFreed` | `{ seatId }` | Seat freed update |
| `userStatusUpdated` | `{ socketId, status }` | Status change broadcast |
| `roomFull` | `{ type }` | No available seats in room |

---

## User Flow

1. **Landing** - Enter username (2-16 chars), select avatar
2. **Workplace Selector** - View all workplaces with user counts
3. **Room View** - See seats, avatars, claim a seat, update status
4. **Leave** - Return to workplace selector

---

## Security & Validation

All socket events include server-side validation:
- Type validation (numbers are integers, strings are within length limits)
- Existence validation (room exists, user in room, seat exists)
- Check user exists in room before allowing actions
- Escape HTML on client to prevent XSS
- No secrets in client-side code

---

## Testing

No test framework is currently configured. To add tests with Vitest:

```bash
npm install -D vitest
# Add to package.json: "test": "vitest"
npm test              # Run all tests
npm test -- --run     # Run tests once (CI mode)
npm test -- file.js   # Run specific file
```

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

## Credits

- Fonts: [Tiny5](https://fonts.google.com/specimen/Tiny5), [Jersey 10](https://fonts.google.com/specimen/Jersey+10) (Google Fonts)
