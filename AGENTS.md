# Agent Guidelines for Cuppa

## Project Overview

Cuppa is a digital workplace application with a Node.js/Express backend using Socket.io for real-time communication and a vanilla JavaScript frontend built with Vite.

---

## Build & Development Commands

### Installation
```bash
npm install
```

### Development
```bash
# Run frontend (Vite dev server on port 5173)
npm run dev

# Run backend server (Express + Socket.io on port 3000)
npm run dev:server

# Run both in separate terminals for full testing
```

### Build & Preview
```bash
# Build frontend for production
npm run build

# Preview production build
npm run preview
```

### Testing
**No test framework is currently configured.** To add tests, consider Vitest:
```bash
npm install -D vitest
# Add to package.json: "test": "vitest"
npm test              # Run all tests
npm test -- --run     # Run tests once (CI mode)
npm test -- file.js   # Run specific file
```

---

## Code Style Guidelines

### General Principles
- Write clean, readable code over clever code
- Keep functions small and focused (single responsibility)
- Use meaningful variable and function names
- Comment complex logic; avoid obvious comments

### JavaScript Version
- Use ES Modules (`import`/`export`) - project uses `"type": "module"`
- Avoid `var`; use `const` and `let`
- Use async/await over raw promises where appropriate
- Use arrow functions for callbacks and anonymous functions

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `userCount`, `currentRoom` |
| Functions | camelCase | `findAvailableRoom()`, `broadcastRoomsList()` |
| Constants | UPPER_SNAKE_CASE | `MAX_USERS`, `PORT` |
| Files | kebab-case | `script.js`, `index.js` |
| CSS Classes | kebab-case | `.workplace-card`, `.room-header` |

### Imports & Exports
```javascript
// Server imports
import express from 'express';
import { rooms, workplacesConfig, claimSeat } from './state.js';

// Named exports preferred
export const findAvailableRoom = (baseName) => { ... };
export default app;
```

### Formatting
- Use 4 spaces for indentation
- Maximum line length: 100 characters
- Add trailing commas in multiline objects/arrays
- Use template literals instead of string concatenation

### Error Handling
- Use try/catch for async operations
- Log errors with appropriate level (`WARN` for expected errors, `ERROR` for unexpected)
- Never expose raw error messages to clients; log server-side only
- Validate all user inputs on server before processing

---

## Validation Patterns

### Server-Side Validation (Required)
```javascript
socket.on('claimSeat', (data) => {
    const { roomName, seatId } = data;
    
    // Type validation
    if (typeof seatId !== 'number' || !Number.isInteger(seatId)) {
        log('WARN', 'Invalid seatId type', { seatId: typeof seatId });
        return;
    }
    
    // Existence validation
    const room = rooms.get(roomName);
    if (!room) {
        log('WARN', 'Room not found', { roomName });
        return;
    }

    if (!room.users.has(socket.id)) {
        log('WARN', 'User not in room', { socketId: socket.id, roomName });
        return;
    }
    
    // Proceed with logic...
});
```

### Input Length Validation
```javascript
const username = (userData.username || 'Anonymous').slice(0, 50);
```

### Rate Limiting
Apply per-event rate limits using `checkRateLimit()`:
```javascript
if (!checkRateLimit(socket.id, 'claimSeat', 1)) {
    log('WARN', 'Rate limit exceeded', { socketId: socket.id, event: 'claimSeat' });
    return;
}
```

---

## Client-Side Patterns

- Cache DOM elements at the top of the file
- Use event delegation where appropriate
- Sanitize user input before rendering (use `escapeHtml` utility)
- Use `const` for DOM queries; avoid repeated queries
- Handle socket events for state refresh

### Socket.io Conventions
- Server emits to specific room: `io.to(roomName).emit(...)`
- Server emits to specific client: `socket.emit(...)`
- Server broadcasts to all: `io.emit(...)`
- Client listens: `socket.on('eventName', callback)`
- Client emits: `socket.emit('eventName', data)`

---

## State Management

### Server State (server/state.js)
- Use in-memory `Map` for rooms (`rooms`)
- Helper functions for atomic operations: `claimSeat`, `userJoined`, `userLeft`, `updateStatus`
- Return structured results: `{ success: true, user }` or `{ success: false, reason: 'room_full' }`

### Client State
- Cache server state; update on socket events
- Always use server as source of truth for room state
- Refresh state on: `userJoined`, `userLeft`, `seatClaimed`, `seatFreed`, `userStatusUpdated`

---

## Security

- Validate all socket event payloads (type, length, existence)
- Check user membership before allowing actions
- Escape HTML to prevent XSS (use `escapeHtml` utility)
- No secrets in client-side code
- Rate limit sensitive operations (claimSeat, updateStatus)

---

## CSS Guidelines

- Use CSS custom properties for theming
- Keep selectors simple and specific
- Group related styles
- Use semantic class names

---

## File Organization

```
/cuppa
├── public/
│   ├── index.html
│   ├── script.js      # Client-side Socket.io logic
│   └── style.css
├── server/
│   ├── index.js       # Express + Socket.io server
│   └── state.js       # In-memory state (rooms, config)
├── package.json
├── vite.config.js
└── AGENTS.md         # This file
```

---

## Common Patterns

### Atomic State Operations
```javascript
// claimSeat in state.js - atomic, prevents double-booking
export const claimSeat = (room, socketId, seatId) => {
  const seat = room.seats.find(s => s.id === seatId);
  if (!seat) return { success: false };
  if (seat.occupiedBy === socketId) return { success: true, freedSeatId: null };
  if (seat.occupiedBy) return { success: false };
  
  let freedSeatId = null;
  room.seats.forEach(s => {
    if (s.occupiedBy === socketId) {
      s.occupiedBy = null;
      freedSeatId = s.id;
    }
  });
  
  seat.occupiedBy = socketId;
  return { success: true, freedSeatId };
};
```

### Broadcasting Delta Updates
```javascript
// Minimal payloads only
io.to(roomName).emit('seatClaimed', { seatId, socketId });
io.to(roomName).emit('userJoined', { socketId, username, status });
io.to(roomName).emit('userLeft', { socketId, seatFreed });
```

### Handling Disconnections
```javascript
socket.on('disconnect', () => {
    log('INFO', 'Client disconnected', { socketId: socket.id });
    rooms.forEach((room, roomName) => {
        if (room.users.has(socket.id)) {
            const { freedSeatId, isEmpty } = userLeft(room, socket.id);
            io.to(roomName).emit('userLeft', { socketId: socket.id, seatFreed });
            if (isEmpty) rooms.delete(roomName);
        }
    });
    broadcastRoomsList();
});
```

---

## Debugging Tips

- Check browser console for client errors
- Check terminal for server logs (timestamps + log level)
- Use `log('INFO', 'message', { data })` for structured logging
- Socket.io events: browser DevTools > Network > WS
- Test with multiple browser tabs for real-time updates

---

## Adding New Features

1. **New Socket Event**: Add handler in `server/index.js` under `io.on('connection', ...)`
2. **New Frontend Event**: Add listener in `public/script.js`
3. **New Workplace Type**: Add to `workplacesConfig` in `server/state.js`
4. **New UI Component**: Add HTML in `public/index.html`, style in `public/style.css`

---

## Known Constraints

- No test framework configured yet
- In-memory state is lost on server restart
- No authentication/authorization currently implemented
- Single workplace type per room (no sub-rooms)
