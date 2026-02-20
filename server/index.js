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

const broadcastRoomsList = () => {
    const roomList = Array.from(rooms.entries()).map(([name, room]) => ({
        name,
        userCount: room.users.size,
        maxUsers: room.seats.length
    }));
    io.emit('roomsList', roomList);
};

const findAvailableRoom = (baseName) => {
    if (!rooms.has(baseName)) return baseName;
    return baseName;
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

const eventRateLimitStore = new Map();

const checkRateLimit = (socketId, eventName, maxPerSecond = 10) => {
    const now = Date.now();
    const key = `${socketId}:${eventName}`;

    if (!eventRateLimitStore.has(key)) {
        eventRateLimitStore.set(key, { count: 0, resetTime: now + 1000 });
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

io.use((socket, next) => next());

app.use(express.static(join(__dirname, '../public')));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

io.on('connection', (socket) => {
    log('INFO', 'Client connected', { socketId: socket.id });

    socket.emit('workplaceTypes', Object.keys(workplacesConfig));
    socket.emit('workplaceConfig', Object.fromEntries(
        Object.entries(workplacesConfig).map(([type, config]) => [type, config.seats.length])
    ));
    socket.emit('roomsList', Array.from(rooms.entries()).map(([name, room]) => ({
        name,
        userCount: room.users.size,
        maxUsers: room.seats.length
    })));

    socket.on('joinWorkplace', (data) => {
        const { type, username } = data;
        const baseRoomName = type || 'cafe';

        if (!workplacesConfig[baseRoomName]) {
            log('WARN', 'Invalid workplace type', { type: baseRoomName });
            return;
        }

        const roomName = findAvailableRoom(baseRoomName);
        const maxUsers = workplacesConfig[baseRoomName]?.seats.length || 10;

        if (!roomName) {
            log('WARN', 'No available room', { baseRoomName });
            socket.emit('roomFull', { type: baseRoomName });
            return;
        }

        log('INFO', 'User joining workplace', { socketId: socket.id, roomName, username });

        let room = rooms.get(roomName);
        if (!room) {
            room = createRoom(roomName);
            rooms.set(roomName, room);
        }

        const result = userJoined(room, socket.id, { username, status: 'working' }, maxUsers);

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

        socket.to(roomName).emit('userJoined', { socketId: socket.id, username: result.user.username, status: result.user.status });

        broadcastRoomsList();
    });

    socket.on('claimSeat', (data) => {
        if (!checkRateLimit(socket.id, 'claimSeat', 1)) {
            log('WARN', 'Rate limit exceeded', { socketId: socket.id, event: 'claimSeat' });
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

        const { roomName, status } = data;

        const room = rooms.get(roomName);
        if (!room || !room.users.has(socket.id)) {
            log('WARN', 'User not in room', { socketId: socket.id, roomName });
            return;
        }

        const success = updateStatus(room, socket.id, status);
        if (success) {
            log('INFO', 'User status updated', { socketId: socket.id, roomName, status });
            io.to(roomName).emit('userStatusUpdated', { socketId: socket.id, status });
        }
    });

    socket.on('disconnect', () => {
        log('INFO', 'Client disconnected', { socketId: socket.id });

        for (const key of eventRateLimitStore.keys()) {
            if (key.startsWith(socket.id + ':')) {
                eventRateLimitStore.delete(key);
            }
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
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
