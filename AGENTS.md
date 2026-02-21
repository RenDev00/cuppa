# Agent Guidelines for Cuppa

## Project Overview

Cuppa is a digital workplace application with a Node.js/Express backend using Socket.io for real-time communication and a vanilla JavaScript frontend built with Vite. Features a pixel-art aesthetic with custom fonts (Jersey10, Tiny5).

---

## Build & Development Commands

### Installation
```bash
npm install
```

### Development
```bash
npm run dev         # Frontend (Vite on port 5173)
npm run dev:server  # Backend (Express + Socket.io on port 3000)
```

### Build & Preview
```bash
npm run build    # Build frontend for production
npm run preview  # Preview production build
```

### Testing
No test framework configured. To add tests with Vitest:
```bash
npm install -D vitest
# Add to package.json: "test": "vitest"
npm test           # Run all tests
npm test -- --run  # Run tests once (CI mode)
npm test -- file   # Run specific file
```

---

## Code Style Guidelines

### JavaScript Version
- Use ES Modules (`import`/`export`) - project uses `"type": "module"`
- Avoid `var`; use `const` and `let`
- Use async/await over raw promises
- Use arrow functions for callbacks

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `userCount`, `currentRoom` |
| Functions | camelCase | `renderAvatars()`, `escapeHtml()` |
| Constants | UPPER_SNAKE_CASE | `MAX_USERS`, `PORT` |
| Files | kebab-case | `script.js`, `index.js` |
| CSS Classes | kebab-case | `.workplace-card`, `.avatar-label-top` |

### Formatting
- 4 spaces for indentation
- Maximum line length: 100 characters
- Trailing commas in multiline objects/arrays
- Use template literals instead of string concatenation

### Comments
- DO NOT ADD COMMENTS unless explicitly asked
- Code should be self-documenting through clear naming

---

## Import Patterns

### Server Imports
```javascript
import express from 'express';
import { createServer } from 'http';
import { rooms, workplacesConfig, claimSeat, userJoined } from './state.js';
```

### Client Script
- No imports needed (vanilla JS with global `io()` from socket.io)
- Cache DOM elements at the top:
```javascript
const landing = document.getElementById('landing');
const roomNameEl = document.getElementById('room-name');
```

---

## Server-Side Patterns

### Socket Event Handlers
Always validate incoming data:
```javascript
socket.on('claimSeat', (data) => {
    const { roomName, seatId } = data;
    if (typeof roomName !== 'string' || roomName.length === 0) {
        log('WARN', 'Invalid roomName');
        return;
    }
    if (typeof seatId !== 'number' || !Number.isInteger(seatId)) {
        log('WARN', 'Invalid seatId type');
        return;
    }
    const room = rooms.get(roomName);
    if (!room) {
        log('WARN', 'Room not found', { roomName });
        return;
    }
});
```

### Logging
```javascript
const log = (level, message, data = {}) => {
    console.log(`[${new Date().toISOString()}] [${level}] ${message}`, data);
};
log('INFO', 'User joined', { socketId: socket.id, roomName });
```

### Rate Limiting
```javascript
if (!checkRateLimit(socket.id, 'claimSeat', 1)) {
    log('WARN', 'Rate limit exceeded', { socketId: socket.id });
    return;
}
```

---

## Client-Side Patterns

### HTML Escaping
Always escape user input before rendering:
```javascript
const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};
```

### Socket.io Events
```javascript
// Client emits
socket.emit('joinWorkplace', { type, username, avatar });
socket.emit('claimSeat', { roomName, seatId });

// Client listens
socket.on('roomState', (data) => { /* handle */ });
socket.on('userJoined', (data) => { /* handle */ });
```

---

## State Management

### Server State (server/state.js)
- Use in-memory `Map` for rooms
- Export pure functions for atomic operations
- Always return result objects with `success` boolean

```javascript
export const claimSeat = (room, socketId, seatId) => {
    const seat = room.seats.find(s => s.id === seatId);
    if (!seat) return { success: false };
    if (seat.occupiedBy) return { success: false };
    seat.occupiedBy = socketId;
    return { success: true };
};
```

### Workplace Configuration
Seat coordinates are normalized (0-1) relative to background image:
```javascript
export const workplacesConfig = {
    cafe: {
        bg: '/assets/bgs/café.png',
        bgWidth: 960,
        bgHeight: 540,
        seats: [{ id: 0, x: 0.257, y: 0.75 }]
    }
};
```

---

## CSS & Styling

### Fonts
- **Jersey10**: Primary font for headers, buttons, labels
- **Tiny5**: Secondary font for subtitles, metadata

### Design System
- Background: `#fff`, Border: `#9ca3af`, `#1f2937`
- Border: 3px solid, Border-radius: 4px
- Highlight: `#f59e0b` (amber)

### Pixel Art
```css
img { image-rendering: pixelated; }
```

---

## Security

- Validate all socket event payloads (type, length, existence)
- Escape HTML to prevent XSS using `escapeHtml()`
- Sanitize usernames on server with `sanitizeUsername()`
- No secrets in client-side code

---

## File Organization
```
/cuppa
├── public/        # index.html, script.js, style.css, assets/
├── server/        # index.js, state.js
├── package.json
├── vite.config.js
└── AGENTS.md
```

---

## Adding New Features

1. **New Socket Event**: Add handler in `server/index.js`, emitter in `public/script.js`
2. **New Workplace Type**: Add to `workplacesConfig` in `server/state.js`
3. **New UI**: Add HTML in `public/index.html`, style in `public/style.css`

---

## Known Constraints

- No test framework configured
- In-memory state lost on server restart
- No authentication/authorization
- No database persistence
