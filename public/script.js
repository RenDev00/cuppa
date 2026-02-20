const socket = io();

console.log('Socket.io test connection: Client connected');

const landing = document.getElementById('landing');
const workplaceSelector = document.getElementById('workplace-selector');
const workplacesGrid = document.getElementById('workplaces-grid');
const room = document.getElementById('room');
const usernameInput = document.getElementById('username');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const roomNameEl = document.getElementById('room-name');
const userCountEl = document.getElementById('user-count');
const seatsContainer = document.getElementById('seats-container');
const avatarsContainer = document.getElementById('avatars-container');

let currentRoom = null;
let username = '';
let cachedRooms = [];
let workplaceTypes = [];
let workplaceSeats = {};

const getDisplayName = (roomName) => {
    const base = roomName.replace(/-[0-9]+$/, '');
    if (base === 'cafe') return 'Café';
    return base.charAt(0).toUpperCase() + base.slice(1);
};

const getPreviewClass = (roomName) => {
    const base = roomName.split('-')[0];
    return `${base}-preview`;
};

const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

const renderRooms = (rooms) => {
    if (workplaceTypes.length === 0) return;

    cachedRooms = rooms;
    workplacesGrid.innerHTML = '';

    workplaceTypes.forEach(type => {
        const roomData = rooms.find(r => r.name === type);
        const userCount = roomData ? roomData.userCount : 0;
        const maxUsers = roomData ? roomData.maxUsers : (workplaceSeats[type] || 10);
        const isFull = roomData && userCount >= maxUsers;

        const card = document.createElement('div');
        card.className = 'workplace-card' + (isFull ? ' full' : '');
        card.dataset.type = type;
        card.innerHTML = `
            <div class="preview ${type}-preview"></div>
            <span>${getDisplayName(type)} (${userCount}/${maxUsers})${isFull ? ' - Full' : ''}</span>
        `;

        if (!isFull) {
            card.addEventListener('click', () => {
                currentRoom = type;
                workplaceSelector.classList.add('hidden');
                room.classList.remove('hidden');
                room.style.backgroundImage = `url(/assets/bgs/${type}.png)`;
                roomNameEl.textContent = getDisplayName(type);
                socket.emit('joinWorkplace', { type, username });
            });
        }

        workplacesGrid.appendChild(card);
    });
};

socket.on('workplaceTypes', (types) => {
    workplaceTypes = types;
    renderRooms(cachedRooms);
});

socket.on('workplaceConfig', (config) => {
    workplaceSeats = config;
    renderRooms(cachedRooms);
});

joinBtn.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if (username.length < 3) {
        alert('Username must be at least 3 characters');
        return;
    }
    landing.classList.add('hidden');
    workplaceSelector.classList.remove('hidden');
});

leaveBtn.addEventListener('click', () => {
    if (currentRoom) {
        socket.emit('leaveRoom', { roomName: currentRoom });
    }
    currentRoom = null;
    room.classList.add('hidden');
    workplaceSelector.classList.remove('hidden');
    seatsContainer.innerHTML = '';
    avatarsContainer.innerHTML = '';
});

document.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (currentRoom) {
            socket.emit('updateStatus', { roomName: currentRoom, status: btn.dataset.status });
        }
    });
});

socket.on('roomState', (data) => {
    currentRoom = data.roomName;
    roomNameEl.textContent = getDisplayName(data.roomName);
    userCountEl.textContent = `${data.users.length} users`;
    seatsContainer.innerHTML = '';
    avatarsContainer.innerHTML = '';

    data.seats.forEach(seat => {
        const seatEl = document.createElement('div');
        seatEl.className = 'seat' + (seat.occupiedBy ? ' occupied' : '');
        seatEl.style.left = `${seat.x}px`;
        seatEl.style.top = `${seat.y}px`;
        seatEl.dataset.seatId = seat.id;

        if (!seat.occupiedBy) {
            seatEl.addEventListener('click', (e) => {
                e.stopPropagation();
                socket.emit('claimSeat', { roomName: currentRoom, seatId: seat.id });
            });
        }

        seatsContainer.appendChild(seatEl);
    });

    data.users.forEach(user => {
        const seat = data.seats.find(s => s.occupiedBy === user.id);
        if (seat) {
            const avatarEl = document.createElement('div');
            avatarEl.className = 'avatar';
            avatarEl.style.left = `${seat.x}px`;
            avatarEl.style.top = `${seat.y}px`;
            avatarEl.textContent = escapeHtml(user.username);
            avatarsContainer.appendChild(avatarEl);
        }
    });
});

socket.on('userJoined', (data) => {
    console.log('User joined:', data.socketId);
    if (currentRoom) {
        socket.emit('getRoomState', { roomName: currentRoom });
    }
});

socket.on('userLeft', (data) => {
    console.log('User left:', data.socketId);
    if (currentRoom) {
        socket.emit('getRoomState', { roomName: currentRoom });
    }
});

socket.on('seatClaimed', (data) => {
    console.log('Seat claimed:', data);
    if (currentRoom) {
        socket.emit('getRoomState', { roomName: currentRoom });
    }
});

socket.on('seatFreed', (data) => {
    console.log('Seat freed:', data);
    if (currentRoom) {
        socket.emit('getRoomState', { roomName: currentRoom });
    }
});

socket.on('userStatusUpdated', (data) => {
    console.log('User status updated:', data);
    if (currentRoom) {
        socket.emit('getRoomState', { roomName: currentRoom });
    }
});

socket.on('roomFull', (data) => {
    alert('The room is full. Please try again later.');
    currentRoom = null;
    room.classList.add('hidden');
    workplaceSelector.classList.remove('hidden');
    seatsContainer.innerHTML = '';
    avatarsContainer.innerHTML = '';
    renderRooms(cachedRooms);
});

socket.on('connect', () => {
    console.log('Connected to server with ID:', socket.id);
});

socket.on('roomsList', (rooms) => {
    renderRooms(rooms);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});
