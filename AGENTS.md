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
```

### Build
```bash
# Build frontend for production
npm run build

# Preview production build
npm run preview
```

### Running Tests
**No test framework is currently configured.** To add tests, consider:
```bash
# Example (not configured):
npm test              # Run all tests
npm test -- --run     # Run tests once (Vitest)
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
import { rooms, workplacesConfig } from './state.js';

// Named exports preferred
export const findAvailableRoom = (baseName) => { ... };
export default app;
```

### Error Handling
- Use try/catch for async operations
- Log errors with appropriate level (`WARN` for expected errors, `ERROR` for unexpected)
- Never expose raw error messages to clients; log server-side only
- Validate all user inputs on server before processing

### Server-Side Validation Pattern
```javascript
socket.on('claimSeat', (data) => {
    const { roomName, seatId } = data;
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

### Client-Side Patterns
- Cache DOM elements at the top of the file
- Use event delegation where appropriate
- Sanitize user input before rendering (see `escapeHtml` function)
- Use `const` for DOM queries; avoid repeated queries

### Socket.io Conventions
- Server emits to specific room: `io.to(roomName).emit(...)`
- Server emits to specific client: `socket.emit(...)`
- Server broadcasts to all: `io.emit(...)`
- Client listens: `socket.on('eventName', callback)`
- Client emits: `socket.emit('eventName', data)`

### State Management
- Server: Use in-memory `Map` for rooms (`server/state.js`)
- Client: Cache server state; update on socket events
- Always use server as source of truth for room state

### Security
- Validate all socket event payloads
- Check user membership before allowing actions
- Escape HTML to prevent XSS (use `escapeHtml` utility)
- No secrets in client-side code

### CSS Guidelines
- Use CSS custom properties for theming
- Keep selectors simple and specific
- Group related styles
- Use semantic class names

### File Organization
```
/cuppa
├── public/
│   ├── index.html
│   ├── script.js      # Client-side Socket.io logic
│   └── style.css
├── server/
│   ├── index.js       # Express + Socket.io server
│   └── state.js      # In-memory state (rooms, config)
├── package.json
└── vite.config.js
```

### Common Patterns

#### Broadcasting Room Updates
```javascript
const broadcastRoomsList = () => {
    const roomList = Array.from(rooms.entries()).map(([name, room]) => ({
        name,
        userCount: room.users.size,
        maxUsers: room.seats.length
    }));
    io.emit('roomsList', roomList);
};
```

#### Handling Disconnections
```javascript
socket.on('disconnect', () => {
    log('INFO', 'Client disconnected', { socketId: socket.id });
    // Clean up user from all rooms
    rooms.forEach((room, roomName) => {
        if (room.users.has(socket.id)) {
            room.users.delete(socket.id);
            io.to(roomName).emit('userLeft', { socketId: socket.id });
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
- Socket.io events can be inspected in browser DevTools > Network > WS

---

## Adding New Features

1. **New Socket Event**: Add handler in `server/index.js` under `io.on('connection', ...)`
2. **New Frontend Event**: Add listener in `public/script.js`
3. **New Workplace Type**: Add to `workplacesConfig` in `server/state.js`
4. **New UI Component**: Add HTML in `public/index.html`, style in `public/style.css`

---

## Known Constraints

- No dynamic room creation beyond initial rooms defined in `workplacesConfig`
- Single workplace type per room (no sub-rooms)
- In-memory state is lost on server restart
- No authentication/authorization currently implemented
