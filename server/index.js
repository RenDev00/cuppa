import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { rooms, workplacesConfig } from './state.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.static(join(__dirname, '../public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('joinWorkplace', (data) => {
    const { type } = data;
    const roomName = type || 'cafe';
    
    let room = rooms.get(roomName);
    if (!room) {
      room = {
        users: new Map(),
        seats: JSON.parse(JSON.stringify(workplacesConfig[roomName]?.seats || []))
      };
      rooms.set(roomName, room);
    }

    socket.join(roomName);
    socket.emit('roomState', {
      roomName,
      users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user })),
      seats: room.seats
    });

    socket.to(roomName).emit('userJoined', { socketId: socket.id });
  });

  socket.on('claimSeat', (data) => {
    const { roomName, seatId } = data;
    const room = rooms.get(roomName);
    if (!room) return;

    const seat = room.seats.find(s => s.id === seatId);
    if (seat && !seat.occupiedBy) {
      seat.occupiedBy = socket.id;
      io.to(roomName).emit('seatUpdated', { seatId, occupiedBy: socket.id });
    }
  });

  socket.on('updateStatus', (data) => {
    const { roomName, status } = data;
    const room = rooms.get(roomName);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (user) {
      user.status = status;
      io.to(roomName).emit('userStatusUpdated', { socketId: socket.id, status });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
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
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
