export const rooms = new Map();

export const workplacesConfig = {
  cafe: {
    bg: '/assets/bgs/cafe.png',
    seats: [
      { id: 0, x: 180, y: 320 },
      { id: 1, x: 320, y: 310 },
      { id: 2, x: 460, y: 320 },
      { id: 3, x: 600, y: 310 },
      { id: 4, x: 740, y: 320 },
      { id: 5, x: 180, y: 420 },
      { id: 6, x: 320, y: 410 },
      { id: 7, x: 460, y: 420 },
      { id: 8, x: 600, y: 410 },
      { id: 9, x: 740, y: 420 }
    ]
  },
  library: {
    bg: '/assets/bgs/library.png',
    seats: [
      { id: 0, x: 100, y: 200 },
      { id: 1, x: 250, y: 200 },
      { id: 2, x: 400, y: 200 },
      { id: 3, x: 550, y: 200 },
      { id: 4, x: 700, y: 200 },
      { id: 5, x: 100, y: 350 },
      { id: 6, x: 250, y: 350 },
      { id: 7, x: 400, y: 350 },
      { id: 8, x: 550, y: 350 },
      { id: 9, x: 700, y: 350 }
    ]
  },
  park: {
    bg: '/assets/bgs/park.png',
    seats: [
      { id: 0, x: 150, y: 280 },
      { id: 1, x: 300, y: 270 },
      { id: 2, x: 450, y: 280 },
      { id: 3, x: 600, y: 270 },
      { id: 4, x: 750, y: 280 }
    ]
  },
  bar: {
    bg: '/assets/bgs/bar.png',
    seats: [
      { id: 0, x: 120, y: 350 },
      { id: 1, x: 240, y: 350 },
      { id: 2, x: 360, y: 350 },
      { id: 3, x: 480, y: 350 },
      { id: 4, x: 600, y: 350 },
      { id: 5, x: 720, y: 350 }
    ]
  },
  study: {
    bg: '/assets/bgs/study.png',
    seats: [
      { id: 0, x: 180, y: 250 },
      { id: 1, x: 320, y: 250 },
      { id: 2, x: 460, y: 250 },
      { id: 3, x: 600, y: 250 },
      { id: 4, x: 180, y: 380 },
      { id: 5, x: 320, y: 380 },
      { id: 6, x: 460, y: 380 },
      { id: 7, x: 600, y: 380 }
    ]
  }
};

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

export const userJoined = (room, socketId, userData) => {
  const user = { username: userData.username || 'Anonymous', status: userData.status || 'working' };
  room.users.set(socketId, user);
  return user;
};

export const userLeft = (room, socketId) => {
  const hadUser = room.users.has(socketId);
  room.users.delete(socketId);
  
  let freedSeatId = null;
  room.seats.forEach(seat => {
    if (seat.occupiedBy === socketId) {
      seat.occupiedBy = null;
      freedSeatId = seat.id;
    }
  });
  
  return { hadUser, freedSeatId };
};

export const updateStatus = (room, socketId, status) => {
  const user = room.users.get(socketId);
  if (!user) return false;
  
  user.status = status;
  return true;
};

export const createRoom = (roomName) => {
  const workplaceType = roomName.replace(/-[0-9]+$/, '');
  return {
    users: new Map(),
    seats: JSON.parse(JSON.stringify(workplacesConfig[workplaceType]?.seats || []))
  };
};
