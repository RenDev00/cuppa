# Code Cleanup Plan

## Critical

### 1. Rate Limit Store Memory Leak ✅ FIXED
**File:** `server/index.js` (lines 48-71, 231-235)

- Per-event rate limiting implemented
- Cleanup on disconnect added
- No longer an issue

---

## High Priority

### 2. Missing seatId Type Validation ✅ FIXED
**File:** `server/index.js` (line ~146)

Added validation to check seatId is an integer before processing.

### 3. No Status Value Validation ⚠️ NOT NEEDED
**File:** `server/index.js` (line 197)

Custom statuses planned for future - no validation needed.

### 4. Room Not Cleaned When Empty ✅ FIXED
**File:** `server/state.js` (userLeft function)

- userLeft now returns isEmpty flag
- leaveRoom and disconnect handlers delete room when empty

---

## Medium Priority

### 5. Silent Failure in getRoomState ✅ FIXED
**File:** `server/index.js` (lines ~181-185)

Added WARN log when getRoomState fails due to user not being in room.

### 6. No Username Length Validation ✅ FIXED
**File:** `server/state.js` (line ~90-91)

Added username length validation, truncating to 50 characters max.

### 7. Dead Code in findAvailableRoom ✅ FIXED
**File:** `server/index.js` (lines 23-30)

Simplified to use maxPerRoom correctly - returns baseName, null, or baseName based on room capacity.

### 8. Missing roomName in Seat Error Log ✅ FIXED
**File:** `server/index.js` (line ~164)

Added roomName to log object.

---

## Low Priority

### 9. Hardcoded CORS Origin
**File:** `server/index.js` (line 43)

Make configurable via environment variable.
