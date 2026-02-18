**Implementation Plan: Pixel Workplace**  
A lightweight, ephemeral, real-time virtual co-working space in pure pixel-art style. Users join instantly with zero registration or persistent data. Everything runs in server memory and disappears on disconnect/restart. Designed for <50 concurrent users per room, sub-100ms feel, <5 MB total bundle.

### Core Principles (strictly followed)
- No database, no accounts, no cookies beyond session.
- Only Socket.io + Express as runtime deps.
- Pixel-perfect aesthetic: all assets use a limited 16–32 color palette; CSS `image-rendering: pixelated;`.
- Fixed seats only (no free movement, no pathfinding → ultra-simple).
- One global room per workplace type initially (auto-spawn “cafe-2” when full).
- Preload everything; optimistic UI updates; delta broadcasts.

### Tech Stack (minimal)
| Layer     | Choice                          | Reason |
|-----------|---------------------------------|--------|
| Backend   | Node.js 20 + Express + Socket.io v4 | Single binary, WebSocket rooms, in-memory Map state |
| Frontend  | Vanilla JS (or optional Vite + Svelte 5) | Zero framework bloat option; Svelte only if you want reactivity in <10 KB |
| Rendering | DOM + absolute-positioned `<div>`s inside a fixed 960×540 px container | Faster than Canvas for text/labels; pixelated images look perfect |
| Hosting   | Render.com or Railway (free tier) | WebSocket support out-of-the-box, instant deploys |

### Project Layout
```
pixel-workplace/
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
└── vite.config.js        ← optional (only if using Svelte/Vite)
```

### Asset Requirements (create once)
- 5 workplaces: Café, Library, Park Bench, Cozy Bar, Study Loft.
- 12–20 avatars: front-facing pixel characters (use OpenGameArt “pixel people” packs or Piskel.app free).
- 8 status icons (📚, 🌿, 🍜, etc.) or tiny PNGs.
- All PNGs optimized; consistent palette (Lospec.com “Pixel Joint” palettes).

### Data Structures (server in-memory only)
```js
// state.js
const workplacesConfig = {
  cafe: {
    bg: '/assets/bgs/cafe.png',
    seats: [
      { id: 0, x: 180, y: 320 }, // chair
      { id: 1, x: 320, y: 310 },
      // … up to 15–20 seats
    ]
  },
  // park, library, …
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

### User Flow & Screens (all client-side, instant)
1. **Landing (index.html)**
   - Username input + “Random” button (arrays: adjectives + nouns).
   - Avatar grid (click to highlight, preloaded `<img>`).
   - “Find a place” → hide landing, show workplaces.

2. **Workplace selector**
   - 2×3 grid of thumbnail cards (tiny 240×135 preview images).
   - Click → `socket.emit('joinWorkplace', {type: 'cafe'})`.

3. **Room view**
   - Full container `div#room` with `background-image` + `pixelated`.
   - Dynamic avatar containers:
     ```html
     <div class="avatar" style="left:180px;top:320px">
       <img src="/assets/avatars/05.png" class="pixel">
       <div class="label">
         @PixelCat<br>
         <span class="status">📚 Studying</span><br>
         <span class="time">2h 14m</span>
       </div>
     </div>
     ```
   - Empty seats rendered as faint chair icons (clickable `<div data-seat-id>` overlay).
   - Bottom toolbar: status picker (8 buttons + optional custom text).
   - Top bar: room name, user count, “Change place” / “Leave”.

4. **Leave** → back to workplace selector (socket leaves room).

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

Server is authoritative for seats (prevents race conditions).

### Performance & Snappiness Guarantees
- Preload all assets on landing (`new Image()`).
- Optimistic UI: status/seat change happens instantly on client, then confirmed.
- Timers: server sends `joinedAt` Unix timestamp; client runs one `setInterval(30_000)` that updates all visible times.
- Broadcast only deltas after initial state.
- CSS: `will-change: transform`, `contain: layout paint`.
- Max 25 users per room → auto-create “cafe-2” when full (simple counter).
- No animations except subtle CSS `transform: translateY(2px)` idle bob on avatars (optional, 2 KB).

### Security / Edge Cases
- Username sanitized (3–16 alphanum + _-).
- Socket rate limiting (built-in Socket.io).
- “Room full” message + suggestion to try another workplace.
- Browser close/tab close → automatic disconnect → avatar disappears in <1 s.

### Development Roadmap (2–4 weeks solo)
**Week 1**  
- Set up server + static serving + basic Socket.io chat test.  
- Create 3 workplaces + 8 avatars manually.  
- Landing + avatar picker + workplace grid (vanilla).

**Week 2**  
- Room view + seat claiming + avatar DOM rendering.  
- Status + timer.  
- Full in-memory state + join/leave.

**Week 3**  
- Polish (idle bob, pixel font, mobile-ish responsive).  
- Auto-room spawning + full state sync.  
- Test with 10+ tabs (easy with ngrok).

**Week 4 (optional)**  
- Add “stand up / wander” mode (no seat, avatar at edge).  
- Tiny sound on join (optional, 1 click sound).  
- Deploy + custom domain.

### Optional Lightweight Enhancements (still minimal)
- Svelte 5 + Vite instead of pure vanilla (adds ~8 KB gzipped, huge dev speed).  
- One global chat per room (optional, can be toggled off).  
- Shareable link `?room=cafe-3` (just parse query param).

This architecture delivers exactly the spec: instant username/avatar → pick workplace → click seat → see everyone in real time, all in beautiful pixel art, with literally zero user data stored anywhere. Ready to code — start with the server `state.js` and the landing screen and you’ll have a working prototype in one afternoon.