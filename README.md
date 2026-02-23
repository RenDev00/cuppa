# Cuppa

A cozy real-time virtual co-working space with pixel-art aesthetics. Join instantly—no registration, no accounts, just pick a username and start working alongside others. Everything lives in server memory and disappears when you leave.

[**Try It → Live Demo**](http://194.156.154.186/)

---

## Quick Start

```bash
# Install dependencies
npm install

# Run frontend (Terminal 1)
npm run dev          # Opens at http://localhost:5173

# Run backend (Terminal 2)
npm run dev:server   # Runs on http://localhost:3000
```

### Production Build

```bash
npm run build
npm run preview
```

---

## Features

- **Real-time sync** — See others join, claim seats, and change status instantly via Socket.io
- **Status-based timer** — Your work timer starts when you join, resets on status change, continues when you switch seats
- **Seat claiming** — Grab a table and see who's sitting where
- **Pixel-art aesthetic** — Custom fonts (Jersey10, Tiny5) and retro visuals
- **Zero friction** — No accounts, no cookies, just enter a username and go

---

## Workplaces

| Workplace | Seats | Status |
|-----------|-------|--------|
| Café | 4 | Active |

*More workplaces coming soon (Library, Park, Bar, Study are in development).*

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, Socket.io |
| Frontend | Vanilla JavaScript, Vite |
| Rendering | DOM + absolute-positioned elements |
| Fonts | Jersey10, Tiny5 (Google Fonts) |

### Project Structure

```
/cuppa
├── public/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── assets/
├── server/
│   ├── index.js      # Express + Socket.io handlers
│   └── state.js      # In-memory state management
├── package.json
└── vite.config.js
```

### Core Principles

- No database, no accounts — all state in server memory
- Fixed seats only — no free movement
- Server as source of truth — always trust server state

---

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `joinWorkplace` | `{ type, username, avatar }` | Join a workplace |
| `claimSeat` | `{ roomName, seatId }` | Claim a seat |
| `leaveRoom` | `{ roomName }` | Leave current room |
| `updateStatus` | `{ roomName, status, emoji }` | Update status |
| `getRoomState` | `{ roomName }` | Request room state |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `roomState` | `{ roomName, users, seats }` | Full room snapshot |
| `userJoined` | `{ socketId, username, avatar }` | User joined |
| `userLeft` | `{ socketId, seatFreed }` | User left |
| `seatClaimed` | `{ seatId, socketId }` | Seat claimed |
| `seatFreed` | `{ seatId }` | Seat freed |
| `userStatusUpdated` | `{ socketId, status, emoji }` | Status update |

---

## Security

- Server-side validation on all socket events
- HTML escaping on client to prevent XSS
- Username sanitization (max 50 chars)
- No secrets in client-side code

---

## Known Constraints

- In-memory state is lost on server restart
- No authentication/authorization
- Maximum users equals seat count (4 for Café)

---

## Credits

Fonts: [Tiny5](https://fonts.google.com/specimen/Tiny5), [Jersey 10](https://fonts.google.com/specimen/Jersey+10)
