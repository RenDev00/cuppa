const socket = io();

const TIME_UPDATE_INTERVAL = 30000;
const EMOJI_GRID_WIDTH = 8;

const landing = document.getElementById('landing');
const workplaceSelector = document.getElementById('workplace-selector');
const workplacesGrid = document.getElementById('workplaces-grid');
const room = document.getElementById('room');
const usernameInput = document.getElementById('username');
const leaveBtn = document.getElementById('leave-btn');
const roomNameEl = document.getElementById('room-name');
const userCountEl = document.getElementById('user-count');
const seatsContainer = document.getElementById('seats-container');
const avatarsContainer = document.getElementById('avatars-container');
const emojiPickerBtn = document.getElementById('emoji-picker-btn');
const emojiDisplay = document.getElementById('emoji-display');
const emojiPicker = document.getElementById('emoji-picker');
const emojiSearch = document.getElementById('emoji-search');
const emojiGrid = document.getElementById('emoji-grid');
const customStatusInput = document.getElementById('custom-status-input');
const updateStatusBtn = document.getElementById('update-status-btn');

let currentRoom = null;
let selectedAvatar = null;
let cachedRooms = [];
let workplaceTypes = [];
let workplaceSeats = {};
let workplaceBgs = {};
let workplaceDimensions = {};
let isTransitioning = false;

const adjectives = [
    'Happy', 'Brave', 'Clever', 'Gentle', 'Swift',
    'Calm', 'Bold', 'Kind', 'Wise', 'Mighty',
    'Lucky', 'Proud', 'Noble', 'Quick', 'Bright',
    'Cool', 'Eager', 'Fierce', 'Grateful', 'Heroic'
];

const nouns = [
    'Fox', 'Bear', 'Wolf', 'Owl', 'Hawk',
    'Lion', 'Tiger', 'Eagle', 'Panda', 'Koala',
    'Dolphin', 'Penguin', 'Rabbit', 'Deer', 'Swan',
    'Cat', 'Dog', 'Horse', 'Mouse', 'Frog'
];

const avatarFiles = [
    'cat.png',
    'dog.png',
    'cow.png',
    'pig.png',
    'panda.png',
    'sheep.png',
    'duck.png'
];

const thumbnailFiles = ['café.png'];

const userSelection = {
    username: '',
    avatar: null,
};

let timeUpdateInterval = null;

const formatDuration = (ms) => {
    if (!ms || ms <= 0) return '0m';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

const getElapsedTime = (statusTime) => {
    if (!statusTime) return '0m';
    return formatDuration(Date.now() - statusTime);
};

const preloadAssets = () => {
    avatarFiles.forEach(file => {
        const img = new Image();
        img.src = `/assets/avatars/${file}`;
    });

    thumbnailFiles.forEach(file => {
        const img = new Image();
        img.src = `/assets/thumbnails/${file}`;
    });
};

const generateRandomName = () => {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return adj + noun;
};

const renderAvatarGrid = () => {
    const grid = document.getElementById('avatar-grid');
    grid.innerHTML = '';

    const avatarCount = 12;
    for (let i = 0; i < avatarCount; i++) {
        const option = document.createElement('div');

        if (i < avatarFiles.length) {
            const avatarFile = avatarFiles[i];
            option.className = 'avatar-option';
            option.dataset.avatar = avatarFile;
            option.innerHTML = `<img src="/assets/avatars/${avatarFile}" alt="Avatar ${i + 1}">`;

            option.addEventListener('click', () => {
                document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedAvatar = avatarFile;
                userSelection.avatar = selectedAvatar;
                updateEnterButton();
            });
        } else {
            option.className = 'avatar-option empty';
            option.innerHTML = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="8" y1="8" x2="92" y2="92" stroke="#9ca3af" stroke-width="7" stroke-linecap="round" />
            </svg>`;
        }

        grid.appendChild(option);
    }
};

const updateEnterButton = () => {
    const enterBtn = document.getElementById('enter-btn');
    const username = usernameInput.value.trim();
    const isValidUsername = username.length >= 2 && username.length <= 16;
    const hasAvatar = selectedAvatar !== null;

    enterBtn.disabled = !(isValidUsername && hasAvatar);
};

const handleEnter = () => {
    if (isTransitioning) return;
    const username = usernameInput.value.trim();
    if (username.length >= 2 && username.length <= 16 && selectedAvatar) {
        isTransitioning = true;
        userSelection.username = username;
        userSelection.avatar = selectedAvatar;

        landing.style.opacity = '0';

        setTimeout(() => {
            landing.classList.add('hidden');
            landing.style.opacity = '';
            workplaceSelector.classList.remove('hidden');
            workplaceSelector.style.opacity = '0';
            setTimeout(() => {
                workplaceSelector.style.opacity = '1';
                isTransitioning = false;
            }, 50);
        }, 300);
    }
};

usernameInput.addEventListener('input', () => {
    userSelection.username = usernameInput.value.trim();
    updateEnterButton();
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const enterBtn = document.getElementById('enter-btn');
        if (!enterBtn.disabled) {
            handleEnter();
        }
    }
});

document.getElementById('random-name-btn').addEventListener('click', () => {
    usernameInput.value = generateRandomName();
    userSelection.username = usernameInput.value;
    updateEnterButton();
});

document.getElementById('enter-btn').addEventListener('click', handleEnter);

document.getElementById('back-to-landing-btn').addEventListener('click', () => {
    if (isTransitioning) return;
    isTransitioning = true;
    workplaceSelector.style.opacity = '0';

    setTimeout(() => {
        workplaceSelector.classList.add('hidden');
        workplaceSelector.style.opacity = '';
        landing.classList.remove('hidden');
        landing.style.opacity = '0';
        setTimeout(() => {
            landing.style.opacity = '1';
            isTransitioning = false;
        }, 50);
    }, 300);
});

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

const getPreviewStyle = (type) => {
    const base = type.replace(/-[0-9]+$/, '');
    const fallbackColors = {
        'cafe': '#4a3728',
        'library': '#2d4a3e',
        'park': '#3d5c3d',
        'bar': '#4a2d3d',
        'study': '#3d3d5c'
    };
    const fallbackColor = fallbackColors[base] || '#e5e7eb';

    if (base === 'cafe') {
        return `background-image: url(/assets/thumbnails/café.png)`;
    }
    return `background-color: ${fallbackColor}`;
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
            <div class="preview" style="${getPreviewStyle(type)}"></div>
            <span>${escapeHtml(getDisplayName(type))} (${userCount}/${maxUsers})${isFull ? ' - Full' : ''}</span>
        `;

        if (!isFull) {
            card.addEventListener('click', () => {
                if (isTransitioning) return;
                isTransitioning = true;
                currentRoom = type;

                workplaceSelector.style.opacity = '0';

                setTimeout(() => {
                    workplaceSelector.classList.add('hidden');
                    workplaceSelector.style.opacity = '';

                    room.classList.remove('hidden');
                    room.style.opacity = '0';
                    const bgUrl = workplaceBgs[type];
                    const roomContent = document.getElementById('room-content');
                    if (roomContent) {
                        roomContent.style.backgroundImage = `url(${bgUrl})`;
                    }
                    roomNameEl.textContent = getDisplayName(type);

                    document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
                    const workingBtn = document.querySelector('.status-btn[data-status="working"]');
                    if (workingBtn) {
                        workingBtn.classList.add('active');
                        emojiDisplay.textContent = '💻';
                        customStatusInput.value = 'Working';
                    }


                    setTimeout(() => {
                        room.style.opacity = '1';
                        isTransitioning = false;
                    }, 50);

                    socket.emit('joinWorkplace', {
                        type,
                        username: userSelection.username,
                        avatar: userSelection.avatar
                    });
                }, 300);
            });
        }

        workplacesGrid.appendChild(card);
    });
};

socket.on('workplaceTypes', (types) => {
    workplaceTypes = types;
    renderRooms(cachedRooms);
});

const preloadBackgrounds = () => {
    Object.values(workplaceBgs).forEach(bgUrl => {
        if (bgUrl) {
            const img = new Image();
            img.src = bgUrl;
        }
    });
};

socket.on('workplaceConfig', (config) => {
    workplaceSeats = {};
    workplaceBgs = {};
    workplaceDimensions = {};
    for (const [type, data] of Object.entries(config)) {
        workplaceSeats[type] = data.seats;
        workplaceBgs[type] = data.bg;
        workplaceDimensions[type] = { width: data.bgWidth, height: data.bgHeight };
    }
    preloadBackgrounds();
    renderRooms(cachedRooms);
});

leaveBtn.addEventListener('click', () => {
    if (isTransitioning) return;
    isTransitioning = true;

    stopTimeUpdates();

    if (currentRoom) {
        socket.emit('leaveRoom', { roomName: currentRoom });
    }
    currentRoom = null;

    room.style.opacity = '0';

    setTimeout(() => {
        room.classList.add('hidden');
        room.style.opacity = '';
        workplaceSelector.classList.remove('hidden');
        workplaceSelector.style.opacity = '0';
        setTimeout(() => {
            workplaceSelector.style.opacity = '1';
            isTransitioning = false;
        }, 50);
        seatsContainer.innerHTML = '';
        avatarsContainer.innerHTML = '';
        emojiDisplay.textContent = '';
        customStatusInput.value = '';
    }, 300);
});

customStatusInput.addEventListener('input', (e) => {
    if (e.target.value.trim().length > 0) {
        document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
    }
});

document.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        emojiDisplay.textContent = btn.dataset.emoji;
        customStatusInput.value = btn.textContent.substring(2).trim();
    });
});

updateStatusBtn.addEventListener('click', () => {
    if (!currentRoom) return;

    const emoji = emojiDisplay.textContent || '😊';
    const customStatus = customStatusInput.value;

    if (emoji && customStatus) {
        socket.emit('updateStatus', {
            roomName: currentRoom,
            status: customStatus,
            emoji: emoji
        });
    }
});

const calculateSeatPosition = (seat, bgWidth, bgHeight, containerWidth, containerHeight) => {
    const bgAspect = bgWidth / bgHeight;
    const containerAspect = containerWidth / containerHeight;

    let renderWidth, renderHeight, offsetX, offsetY;

    if (containerAspect > bgAspect) {
        renderHeight = containerHeight;
        renderWidth = renderHeight * bgAspect;
        offsetX = (containerWidth - renderWidth) / 2;
        offsetY = 0;
    } else {
        renderWidth = containerWidth;
        renderHeight = renderWidth / bgAspect;
        offsetX = 0;
        offsetY = (containerHeight - renderHeight) / 2;
    }

    const x = offsetX + seat.x * renderWidth;
    const y = offsetY + seat.y * renderHeight;

    return { x, y, renderWidth, renderHeight, offsetX, offsetY };
};

const renderAvatars = (data, bgWidth, bgHeight, containerWidth, containerHeight) => {
    avatarsContainer.innerHTML = '';

    data.users.forEach(user => {
        const seat = data.seats.find(s => s.occupiedBy === user.id);
        if (seat && user.avatar) {
            const pos = calculateSeatPosition(seat, bgWidth, bgHeight, containerWidth, containerHeight);

            const avatarWrapper = document.createElement('div');
            avatarWrapper.className = 'avatar-wrapper';
            avatarWrapper.style.left = `${pos.x}px`;
            avatarWrapper.style.top = `${pos.y}px`;
            avatarWrapper.dataset.userId = user.id;
            avatarWrapper.dataset.statusTime = user.statusTime || '';

            const avatarEl = document.createElement('div');
            avatarEl.className = 'avatar';

            const labelTop = document.createElement('div');
            labelTop.className = 'avatar-label-top';
            labelTop.textContent = `@${escapeHtml(user.username)} ${user.statusEmoji || '😊'}`;

            const img = document.createElement('img');
            img.src = `/assets/avatars/${user.avatar}`;
            img.alt = escapeHtml(user.username);

            const labelBottom = document.createElement('div');
            labelBottom.className = 'avatar-label-bottom';

            const timeSpan = document.createElement('span');
            timeSpan.className = 'avatar-time';
            timeSpan.textContent = getElapsedTime(user.statusTime);

            const statusSpan = document.createElement('span');
            statusSpan.className = 'avatar-status';
            statusSpan.textContent = user.status || 'Working';

            labelBottom.appendChild(timeSpan);
            labelBottom.appendChild(statusSpan);

            avatarEl.appendChild(labelTop);
            avatarEl.appendChild(img);
            avatarEl.appendChild(labelBottom);

            avatarWrapper.appendChild(avatarEl);
            avatarsContainer.appendChild(avatarWrapper);
        }
    });
};

const startTimeUpdates = () => {
    if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
    }

    timeUpdateInterval = setInterval(() => {
        document.querySelectorAll('.avatar-wrapper').forEach(avatarWrapper => {
            const statusTime = parseInt(avatarWrapper.dataset.statusTime);
            const timeSpan = avatarWrapper.querySelector('.avatar-time');
            if (timeSpan && statusTime) {
                timeSpan.textContent = getElapsedTime(statusTime);
            }
        });
    }, TIME_UPDATE_INTERVAL);
};

const stopTimeUpdates = () => {
    if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
        timeUpdateInterval = null;
    }
};


let currentRoomData = null;
let currentBgDimensions = null;

const renderRoom = () => {
    if (!currentRoomData || !currentBgDimensions) return;

    const roomContent = document.getElementById('room-content');
    if (!roomContent) return;

    const containerWidth = roomContent.clientWidth;
    const containerHeight = roomContent.clientHeight;
    const { width: bgWidth, height: bgHeight } = currentBgDimensions;

    seatsContainer.innerHTML = '';
    avatarsContainer.innerHTML = '';

    currentRoomData.seats.forEach(seat => {
        const pos = calculateSeatPosition(seat, bgWidth, bgHeight, containerWidth, containerHeight);
        const seatEl = document.createElement('div');
        seatEl.className = 'seat' + (seat.occupiedBy ? ' occupied' : '');
        seatEl.style.left = `${pos.x}px`;
        seatEl.style.top = `${pos.y}px`;
        seatEl.dataset.seatId = seat.id;

        if (!seat.occupiedBy) {
            seatEl.addEventListener('click', (e) => {
                e.stopPropagation();
                socket.emit('claimSeat', { roomName: currentRoom, seatId: seat.id });
            });
        }

        seatsContainer.appendChild(seatEl);
    });

    renderAvatars(currentRoomData, bgWidth, bgHeight, containerWidth, containerHeight);
};

socket.on('roomState', (data) => {
    currentRoom = data.roomName;
    currentRoomData = data;
    currentBgDimensions = workplaceDimensions[currentRoom] || { width: 960, height: 540 };

    roomNameEl.textContent = getDisplayName(data.roomName);
    userCountEl.textContent = `${data.users.length} users`;

    renderRoom();
    startTimeUpdates();
});

window.addEventListener('resize', () => {
    if (currentRoom && !room.classList.contains('hidden')) {
        renderRoom();
    }
});

socket.on('userJoined', (data) => {
    if (currentRoom) {
        socket.emit('getRoomState', { roomName: currentRoom });
    }
});

socket.on('userLeft', (data) => {
    if (currentRoom) {
        socket.emit('getRoomState', { roomName: currentRoom });
    }
});

socket.on('seatClaimed', (data) => {
    if (currentRoom) {
        socket.emit('getRoomState', { roomName: currentRoom });
    }
});

socket.on('seatFreed', (data) => {
    if (currentRoom) {
        socket.emit('getRoomState', { roomName: currentRoom });
    }
});

socket.on('userStatusUpdated', (data) => {
    const avatarWrapper = document.querySelector(`.avatar-wrapper[data-user-id="${data.socketId}"]`);
    if (avatarWrapper) {
        if (data.status !== undefined) {
            const statusSpan = avatarWrapper.querySelector('.avatar-status');
            if (statusSpan) {
                statusSpan.textContent = data.status || 'Working';
            }
        }

        if (data.emoji) {
            const labelTop = avatarWrapper.querySelector('.avatar-label-top');
            if (labelTop) {
                const username = labelTop.textContent.split(' ').slice(0, -1).join(' ');
                labelTop.textContent = `${username} ${escapeHtml(data.emoji)}`;
            }
        }
    }

    if (data.socketId === socket.id && data.emoji) {
        emojiDisplay.textContent = data.emoji;
    }

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
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message);
    alert('Unable to connect to server. Please refresh the page.');
});

socket.on('roomsList', (rooms) => {
    renderRooms(rooms);
});

socket.on('disconnect', () => {
});

const renderEmojiGrid = (emojis) => {
    emojiGrid.innerHTML = '';
    currentEmojiList = emojis;
    selectedEmojiIndex = emojis.length > 0 ? 0 : -1;
    emojis.forEach((emoji, index) => {
        const btn = document.createElement('button');
        btn.className = 'emoji-option';
        btn.textContent = emoji;
        btn.dataset.index = index;
        btn.addEventListener('click', () => {
            emojiDisplay.textContent = emoji;
            document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
            emojiPicker.classList.add('hidden');
            emojiSearch.value = '';
            isPickerOpen = false;
        });
        emojiGrid.appendChild(btn);
    });
    updateEmojiSelection();
};

const filterEmojis = (query) => {
    if (!query) {
        renderEmojiGrid(emojiList);
        return;
    }
    const q = query.toLowerCase();
    const filtered = emojiList.filter(emoji => {
        const keywords = emojiKeywords[emoji];
        if (!keywords) return false;
        return keywords.some(k => k.includes(q));
    });
    renderEmojiGrid(filtered);
};

let isPickerOpen = false;
let selectedEmojiIndex = -1;
let currentEmojiList = [];

const updateEmojiSelection = () => {
    const buttons = emojiGrid.querySelectorAll('.emoji-option');
    buttons.forEach((btn, idx) => {
        btn.classList.toggle('selected', idx === selectedEmojiIndex);
    });
    if (selectedEmojiIndex >= 0) {
        buttons[selectedEmojiIndex]?.scrollIntoView({ block: 'nearest' });
    }
};

document.addEventListener('keydown', (e) => {
    if (!isPickerOpen) return;
    if (e.key === 'Escape') {
        emojiPicker.classList.add('hidden');
        isPickerOpen = false;
        return;
    }
    if (e.key === 'Enter') {
        e.preventDefault();
        if (e.target === emojiSearch) {
            const buttons = emojiGrid.querySelectorAll('.emoji-option');
            if (buttons.length > 0) {
                buttons[selectedEmojiIndex]?.click();
            }
        } else if (selectedEmojiIndex >= 0 && currentEmojiList[selectedEmojiIndex]) {
            const emoji = currentEmojiList[selectedEmojiIndex];
            emojiDisplay.textContent = emoji;
            document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
            emojiPicker.classList.add('hidden');
            emojiSearch.value = '';
            isPickerOpen = false;
        }
        return;
    }
    if (e.target === emojiSearch) {
        if (e.key === 'Backspace') {
            emojiSearch.value = emojiSearch.value.slice(0, -1);
            filterEmojis(emojiSearch.value);
        }
        return;
    }
    if (e.key === 'Backspace') {
        emojiSearch.value = emojiSearch.value.slice(0, -1);
        filterEmojis(emojiSearch.value);
        return;
    }
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedEmojiIndex >= EMOJI_GRID_WIDTH) {
            selectedEmojiIndex -= EMOJI_GRID_WIDTH;
            updateEmojiSelection();
        }
        return;
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectedEmojiIndex + EMOJI_GRID_WIDTH < currentEmojiList.length) {
            selectedEmojiIndex += EMOJI_GRID_WIDTH;
            updateEmojiSelection();
        }
        return;
    }
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (selectedEmojiIndex > 0) {
            selectedEmojiIndex -= 1;
            updateEmojiSelection();
        }
        return;
    }
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (selectedEmojiIndex < currentEmojiList.length - 1) {
            selectedEmojiIndex += 1;
            updateEmojiSelection();
        }
        return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        emojiSearch.value += e.key;
        filterEmojis(emojiSearch.value);
    }
});

emojiPickerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isPickerOpen = !isPickerOpen;
    if (isPickerOpen) {
        const btnRect = emojiPickerBtn.getBoundingClientRect();
        const pickerHeight = 300;
        const spaceBelow = window.innerHeight - btnRect.bottom;
        const spaceAbove = btnRect.top;

        if (spaceBelow < pickerHeight && spaceAbove > spaceBelow) {
            emojiPicker.style.bottom = '100%';
            emojiPicker.style.top = 'auto';
            emojiPicker.style.marginBottom = '8px';
        } else {
            emojiPicker.style.top = '100%';
            emojiPicker.style.bottom = 'auto';
            emojiPicker.style.marginTop = '8px';
        }

        emojiPicker.classList.remove('hidden');
        emojiSearch.value = '';
        renderEmojiGrid(emojiList);
    } else {
        emojiPicker.classList.add('hidden');
    }
});

emojiSearch.addEventListener('input', (e) => {
    filterEmojis(e.target.value);
});

emojiPicker.addEventListener('click', (e) => {
    e.stopPropagation();
});

document.addEventListener('click', (e) => {
    if (isPickerOpen && !emojiPicker.contains(e.target) && e.target !== emojiPickerBtn) {
        emojiPicker.classList.add('hidden');
        isPickerOpen = false;
    }
});

renderAvatarGrid();
preloadAssets();
