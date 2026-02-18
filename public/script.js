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

const roomDisplayNames = {
    'cafe': 'Café',
    'cafe-2': 'Café-2',
    'cafe-3': 'Café-3',
    'library': 'Library',
    'park': 'Park',
    'bar': 'Cozy Bar',
    'study': 'Study Loft'
};

const getDisplayName = (roomName) => {
    return roomDisplayNames[roomName] || roomName.charAt(0).toUpperCase() + roomName.slice(1);
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
    workplacesGrid.innerHTML = '';
    
    rooms.forEach(roomName => {
        const card = document.createElement('div');
        card.className = 'workplace-card';
        card.dataset.type = roomName;
        card.innerHTML = `
            <div class="preview ${getPreviewClass(roomName)}"></div>
            <span>${getDisplayName(roomName)}</span>
        `;
        
        card.addEventListener('click', () => {
            currentRoom = roomName;
            workplaceSelector.classList.add('hidden');
            room.classList.remove('hidden');
            room.style.backgroundImage = `url(/assets/bgs/${roomName.split('-')[0]}.png)`;
            roomNameEl.textContent = getDisplayName(roomName);
            socket.emit('joinWorkplace', { type: roomName, username });
        });
        
        workplacesGrid.appendChild(card);
    });
};

const defaultRooms = ['cafe', 'library', 'park', 'bar', 'study'];
renderRooms(defaultRooms);

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
            seatEl.addEventListener('click', () => {
                socket.emit('claimSeat', { roomName: currentRoom, seatId: seat.id });
            });
        }

        seatsContainer.appendChild(seatEl);
    });

    data.users.forEach(user => {
        const seat = data.seats.find(s => s.id === user.seatId);
        if (seat) {
            const avatarEl = document.createElement('div');
            avatarEl.className = 'avatar';
            avatarEl.style.left = `${seat.x}px`;
            avatarEl.style.top = `${seat.y}px`;
            avatarEl.innerHTML = `
        <img src="/assets/avatars/${user.avatarId || '01'}.png" alt="${escapeHtml(user.username)}">
        <div class="label">${escapeHtml(user.username)}</div>
      `;
            avatarsContainer.appendChild(avatarEl);
        }
    });
});

socket.on('userJoined', (data) => {
    console.log('User joined:', data.socketId);
    userCountEl.textContent = `${parseInt(userCountEl.textContent) + 1} users`;
});

socket.on('userLeft', (data) => {
    console.log('User left:', data.socketId);
    userCountEl.textContent = `${Math.max(0, parseInt(userCountEl.textContent) - 1)} users`;
});

socket.on('seatUpdated', (data) => {
    console.log('Seat updated:', data);
});

socket.on('userStatusUpdated', (data) => {
    console.log('User status updated:', data);
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
