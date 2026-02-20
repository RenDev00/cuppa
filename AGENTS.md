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

### Build & Preview
```bash
npm run build      # Build frontend for production
npm run preview    # Preview production build
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

### General Principles
- Write clean, readable code over clever code
- Keep functions small and focused (single responsibility)
- Use meaningful variable and function names

### JavaScript Version
- Use ES Modules (`import`/`export`) - project uses `"type": "module"`
- Avoid `var`; use `const` and `let`
- Use async/await over raw promises
- Use arrow functions for callbacks

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `userCount`, `currentRoom` |
| Functions | camelCase | `findAvailableRoom()` |
| Constants | UPPER_SNAKE_CASE | `MAX_USERS`, `PORT` |
| Files | kebab-case | `script.js`, `index.js` |
| CSS Classes | kebab-case | `.workplace-card` |

### Formatting
- Use 4 spaces for indentation
- Maximum line length: 100 characters
- Add trailing commas in multiline objects/arrays
- Use template literals instead of string concatenation

---

## Validation Patterns

### Server-Side Validation (Required)
```javascript
socket.on('claimSeat', (data) => {
    const { roomName, seatId } = data;
    
    // Type validation
    if (typeof seatId !== 'number' || !Number.isInteger(seatId)) {
        log('WARN', 'Invalid seatId type');
        return;
    }
    
    // Existence validation
    const room = rooms.get(roomName);
    if (!room) {
        log('WARN', 'Room not found', { roomName });
        return;
    }
});
```

---

## Client-Side Patterns

- Cache DOM elements at the top of the file
- Use `escapeHtml()` utility to sanitize user input before rendering
- Use `const` for DOM queries

### Socket.io Conventions
- Server emits to room: `io.to(roomName).emit(...)`
- Server emits to client: `socket.emit(...)`
- Client listens: `socket.on('eventName', callback)`
- Client emits: `socket.emit('eventName', data)`

---

## State Management

### Server State (server/state.js)
- Use in-memory `Map` for rooms (`rooms`)
- Helper functions for atomic operations: `claimSeat`, `userJoined`, `userLeft`

### Client State
- Cache server state; update on socket events
- Always use server as source of truth

---

## Security

- Validate all socket event payloads (type, length, existence)
- Escape HTML to prevent XSS (use `escapeHtml` utility)
- No secrets in client-side code

---

## File Organization

```
/cuppa
├── public/
│   ├── index.html, script.js, style.css
│   └── assets/ (avatars/, bgs/, fonts/)
├── server/
│   ├── index.js    # Express + Socket.io
│   └── state.js    # In-memory state
├── package.json
├── vite.config.js
└── AGENTS.md
```

---

## Common Patterns

### Atomic State Operations
```javascript
export const claimSeat = (room, socketId, seatId) => {
  const seat = room.seats.find(s => s.id === seatId);
  if (!seat) return { success: false };
  if (seat.occupiedBy) return { success: false };
  seat.occupiedBy = socketId;
  return { success: true };
};
```

### Broadcasting Updates
```javascript
io.to(roomName).emit('seatClaimed', { seatId, socketId });
io.to(roomName).emit('userJoined', { socketId, username });
```

---

## Adding New Features

1. **New Socket Event**: Add handler in `server/index.js`
2. **New Frontend Event**: Add listener in `public/script.js`
3. **New Workplace Type**: Add to `workplacesConfig` in `server/state.js`
4. **New UI**: Add HTML in `public/index.html`, style in `public/style.css`

---

## Known Constraints

- No test framework configured
- In-memory state lost on server restart
- No authentication/authorization
