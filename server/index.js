import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { rooms, workplacesConfig, claimSeat, userJoined, userLeft, updateStatus, createRoom } from './state.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const log = (level, message, data = {}) => {
    console.log(`[${new Date().toISOString()}] [${level}] ${message}`, data);
};

const sanitizeUsername = (username) => {
    if (typeof username !== 'string') return 'Anonymous';
    return username
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .slice(0, 50);
};

const VALID_AVATARS = ['cat.png', 'dog.png', 'cow.png', 'pig.png', 'panda.png', 'sheep.png', 'duck.png'];

const broadcastRoomsList = () => {
    const roomList = Array.from(rooms.entries()).map(([name, room]) => ({
        name,
        userCount: room.users.size,
        maxUsers: room.seats.length
    }));
    io.emit('roomsList', roomList);
};

const app = express();
const httpServer = createServer(app);
const isProduction = process.env.NODE_ENV === 'production';
const staticPath = isProduction
    ? join(__dirname, '../dist')
    : join(__dirname, '../public');
const io = new Server(httpServer, {
    cors: {
        origin: isProduction ? false : ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST']
    }
});

const eventRateLimitStore = new Map();
const socketRateLimitKeys = new Map();

const checkRateLimit = (socketId, eventName, maxPerSecond = 10) => {
    const now = Date.now();
    const key = `${socketId}:${eventName}`;

    if (!eventRateLimitStore.has(key)) {
        eventRateLimitStore.set(key, { count: 0, resetTime: now + 1000 });
        if (!socketRateLimitKeys.has(socketId)) {
            socketRateLimitKeys.set(socketId, new Set());
        }
        socketRateLimitKeys.get(socketId).add(key);
    }

    const record = eventRateLimitStore.get(key);

    if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + 1000;
    }

    record.count++;

    if (record.count > maxPerSecond) {
        return false;
    }
    return true;
};

const cleanupRateLimiter = () => {
    const now = Date.now();
    for (const [key, record] of eventRateLimitStore.entries()) {
        if (now > record.resetTime + 5000) {
            eventRateLimitStore.delete(key);
        }
    }
};

setInterval(cleanupRateLimiter, 30000);

app.use(express.static(staticPath));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

io.on('connection', (socket) => {
    log('INFO', 'Client connected', { socketId: socket.id });

    socket.emit('workplaceTypes', Object.keys(workplacesConfig));
    socket.emit('workplaceConfig', Object.fromEntries(
        Object.entries(workplacesConfig).map(([type, config]) => [type, {
            seats: config.seats.length,
            bg: config.bg,
            bgWidth: config.bgWidth,
            bgHeight: config.bgHeight
        }])
    ));
    socket.emit('roomsList', Array.from(rooms.entries()).map(([name, room]) => ({
        name,
        userCount: room.users.size,
        maxUsers: room.seats.length
    })));

    socket.on('joinWorkplace', (data) => {
        const { type, username, avatar } = data;
        const baseRoomName = type || 'cafe';

        if (!workplacesConfig[baseRoomName]) {
            log('WARN', 'Invalid workplace type', { type: baseRoomName });
            return;
        }

        const roomName = baseRoomName;
        const maxUsers = workplacesConfig[baseRoomName]?.seats.length || 10;

        log('INFO', 'User joining workplace', { socketId: socket.id, roomName, username });

        let room = rooms.get(roomName);
        if (!room) {
            room = createRoom(roomName);
            rooms.set(roomName, room);
        }

        const sanitizedUsername = sanitizeUsername(username);
        const sanitizedAvatar = VALID_AVATARS.includes(avatar) ? avatar : 'cat.png';

        const result = userJoined(room, socket.id, {
            username: sanitizedUsername,
            avatar: sanitizedAvatar,
        }, maxUsers);

        if (!result.success) {
            log('WARN', 'Room full during join', { roomName, userCount: room.users.size, maxUsers });
            socket.emit('roomFull', { type: baseRoomName });
            return;
        }

        socket.join(roomName);
        socket.emit('roomState', {
            roomName,
            users: Array.from(room.users.entries()).map(([id, userData]) => ({ id, ...userData })),
            seats: room.seats
        });

        socket.to(roomName).emit('userJoined', {
            socketId: socket.id,
            username: result.user.username,
            status: result.user.status,
            avatar: result.user.avatar,
            statusEmoji: result.user.statusEmoji
        });

        broadcastRoomsList();
    });

    socket.on('claimSeat', (data) => {
        if (!checkRateLimit(socket.id, 'claimSeat', 1)) {
            return;
        }

        const { roomName, seatId } = data;
        log('INFO', 'claimSeat received', { socketId: socket.id, roomName, seatId });

        if (typeof roomName !== 'string' || roomName.length === 0 || roomName.length > 50) {
            log('WARN', 'Invalid roomName', { roomName: typeof roomName });
            return;
        }

        if (typeof seatId !== 'number' || !Number.isInteger(seatId)) {
            log('WARN', 'Invalid seatId type', { seatId: typeof seatId });
            return;
        }

        const room = rooms.get(roomName);
        if (!room) {
            log('WARN', 'Room not found', { roomName });
            return;
        }

        if (!room.users.has(socket.id)) {
            log('WARN', 'User not in room', { socketId: socket.id, roomName });
            return;
        }

        const seatExists = room.seats.some(s => s.id === seatId);
        if (!seatExists) {
            log('WARN', 'Seat does not exist in room', { seatId, roomName });
            return;
        }

        const result = claimSeat(room, socket.id, seatId);
        if (result.success) {
            log('INFO', 'Seat claimed', { socketId: socket.id, roomName, seatId, freedSeatId: result.freedSeatId });
            if (result.freedSeatId !== null) {
                io.to(roomName).emit('seatFreed', { seatId: result.freedSeatId, socketId: socket.id });
            }
            io.to(roomName).emit('seatClaimed', { seatId, socketId: socket.id });
        } else {
            log('WARN', 'Seat already occupied or invalid', { seatId, roomName });
        }
    });

    socket.on('getRoomState', (data) => {
        if (!checkRateLimit(socket.id, 'getRoomState', 10)) {
            return;
        }

        const { roomName } = data;

        if (typeof roomName !== 'string' || roomName.length === 0 || roomName.length > 50) {
            log('WARN', 'Invalid roomName', { roomName: typeof roomName });
            return;
        }

        const room = rooms.get(roomName);
        if (!room || !room.users.has(socket.id)) {
            log('WARN', 'getRoomState failed - user not in room', { socketId: socket.id, roomName });
            return;
        }

        socket.emit('roomState', {
            roomName,
            users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user })),
            seats: room.seats
        });
    });

    socket.on('leaveRoom', (data) => {
        const { roomName } = data;

        if (typeof roomName !== 'string' || roomName.length === 0 || roomName.length > 50) {
            log('WARN', 'Invalid roomName', { roomName: typeof roomName });
            return;
        }

        const room = rooms.get(roomName);

        if (!room || !room.users.has(socket.id)) {
            log('WARN', 'User not in room', { socketId: socket.id, roomName });
            return;
        }

        const { freedSeatId, isEmpty } = userLeft(room, socket.id);

        socket.leave(roomName);

        const payload = { socketId: socket.id };
        if (freedSeatId !== null) {
            payload.seatFreed = freedSeatId;
        }
        io.to(roomName).emit('userLeft', payload);

        log('INFO', 'User left room', { socketId: socket.id, roomName });
        if (isEmpty) {
            rooms.delete(roomName);
            log('INFO', 'Room deleted (empty)', { roomName });
        }
        broadcastRoomsList();
    });

    socket.on('updateStatus', (data) => {
        if (!checkRateLimit(socket.id, 'updateStatus', 1)) {
            return;
        }

        const { roomName, status, emoji } = data;

        if (typeof status !== 'string' || status.length > 20) {
            log('WARN', 'Invalid status', { socketId: socket.id, status });
            return;
        }
        if (typeof emoji !== 'string' || emoji.length > 10) {
            log('WARN', 'Invalid emoji', { socketId: socket.id, emoji });
            return;
        }


        const room = rooms.get(roomName);
        if (!room || !room.users.has(socket.id)) {
            log('WARN', 'User not in room', { socketId: socket.id, roomName });
            return;
        }

        const success = updateStatus(room, socket.id, status, emoji);
        if (success) {
            log('INFO', 'User status updated', { socketId: socket.id, roomName, status, emoji });
            io.to(roomName).emit('userStatusUpdated', { socketId: socket.id, status, emoji });
        }
    });

    socket.on('disconnect', () => {
        log('INFO', 'Client disconnected', { socketId: socket.id });

        const keys = socketRateLimitKeys.get(socket.id);
        if (keys) {
            keys.forEach(key => eventRateLimitStore.delete(key));
            socketRateLimitKeys.delete(socket.id);
        }

        rooms.forEach((room, roomName) => {
            if (room.users.has(socket.id)) {
                const { freedSeatId, isEmpty } = userLeft(room, socket.id);

                const payload = { socketId: socket.id };
                if (freedSeatId !== null) {
                    payload.seatFreed = freedSeatId;
                }
                io.to(roomName).emit('userLeft', payload);

                if (isEmpty) {
                    rooms.delete(roomName);
                    log('INFO', 'Room deleted (empty)', { roomName });
                }
            }
        });

        broadcastRoomsList();
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
