import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { rooms, workplacesConfig } from './state.js';

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
    const workplaceType = baseName.replace(/-[0-9]+$/, '');
    const maxPerRoom = workplacesConfig[workplaceType]?.seats.length || 10;

    if (!rooms.has(baseName)) {
        return baseName;
    }

    const room = rooms.get(baseName);
    if (room.users.size < maxPerRoom) {
        return baseName;
    }

    return null;
};

const createRoom = (roomName) => {
    const workplaceType = roomName.replace(/-[0-9]+$/, '');
    return {
        users: new Map(),
        seats: JSON.parse(JSON.stringify(workplacesConfig[workplaceType]?.seats || []))
    };
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

const rateLimitStore = new Map();

const rateLimitMiddleware = (socket, next) => {
    const now = Date.now();
    const socketId = socket.id;

    if (!rateLimitStore.has(socketId)) {
        rateLimitStore.set(socketId, { count: 0, resetTime: now + 1000 });
    }

    const record = rateLimitStore.get(socketId);

    if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + 1000;
    }

    record.count++;

    if (record.count > 10) {
        return next(new Error('Rate limit exceeded'));
    }

    next();
};

io.use(rateLimitMiddleware);

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

        room.users.set(socket.id, { username: username || 'Anonymous', status: 'working' });

        socket.join(roomName);
        socket.emit('roomState', {
            roomName,
            users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user })),
            seats: room.seats
        });

        socket.to(roomName).emit('userJoined', { socketId: socket.id });

        broadcastRoomsList();
    });

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

        const seat = room.seats.find(s => s.id === seatId);
        if (seat && !seat.occupiedBy) {
            seat.occupiedBy = socket.id;
            io.to(roomName).emit('seatUpdated', { seatId, occupiedBy: socket.id });
        } else if (seat?.occupiedBy) {
            log('WARN', 'Seat already occupied', { seatId, currentOccupant: seat.occupiedBy });
        }
    });

    socket.on('getRoomState', (data) => {
        const { roomName } = data;
        const room = rooms.get(roomName);
        if (room && room.users.has(socket.id)) {
            socket.emit('roomState', {
                roomName,
                users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user })),
                seats: room.seats
            });
        }
    });

    socket.on('leaveRoom', (data) => {
        const { roomName } = data;
        const room = rooms.get(roomName);

        if (!room || !room.users.has(socket.id)) {
            log('WARN', 'User not in room', { socketId: socket.id, roomName });
            return;
        }

        room.users.delete(socket.id);

        room.seats.forEach(seat => {
            if (seat.occupiedBy === socket.id) {
                seat.occupiedBy = null;
            }
        });

        socket.leave(roomName);
        io.to(roomName).emit('userLeft', { socketId: socket.id });

        log('INFO', 'User left room', { socketId: socket.id, roomName });
        broadcastRoomsList();
    });

    socket.on('updateStatus', (data) => {
        const { roomName, status } = data;

        const room = rooms.get(roomName);
        if (!room || !room.users.has(socket.id)) {
            log('WARN', 'User not in room', { socketId: socket.id, roomName });
            return;
        }

        const user = room.users.get(socket.id);
        user.status = status;
        io.to(roomName).emit('userStatusUpdated', { socketId: socket.id, status });
    });

    socket.on('disconnect', () => {
        log('INFO', 'Client disconnected', { socketId: socket.id });

        rateLimitStore.delete(socket.id);

        rooms.forEach((room, roomName) => {
            if (room.users.has(socket.id)) {
                room.users.delete(socket.id);

                room.seats.forEach(seat => {
                    if (seat.occupiedBy === socket.id) {
                        seat.occupiedBy = null;
                    }
                });

                io.to(roomName).emit('userLeft', { socketId: socket.id });
            }
        });

        broadcastRoomsList();
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
