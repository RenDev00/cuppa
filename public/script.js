const socket = io();

console.log('Socket.io test connection: Client connected');

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
    'sheep.png'
];

const thumbnailFiles = ['café.png'];

const emojiList = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗',
    '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
    '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
    '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁',
    '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
    '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹',
    '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉',
    '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛',
    '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️',
    '🗨️', '🗯️', '💭', '💤', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘',
    '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐',
    '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀',
    '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩',
    '🧓', '👴', '👵', '🙍', '🙎', '🙅', '💁', '🙆', '💇', '💆', '🧏', '🙇', '🤦', '💃', '🕺', '🧖',
    '🧗', '🤸', '🏌️', '🏇', '⛷️', '🏂', '🏋️', '🤼', '🤽', '🤾', '🤺', '⛹️', '🏊', '🚣', '🧘', '🛀',
    '🛌', '👭', '👫', '👬', '💏', '💑', '👪', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👩‍🧒', '👩‍👩‍👦', '👩‍👩‍👧',
    '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧',
    '👩‍👧‍👦', '👩‍👧‍👧', '🧑‍🤝‍🧑', '👣', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
    '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣',
    '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜',
    '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐',
    '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣',
    '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙',
    '🐐', '🦌', '🐕', '🐩', '🦮', '🐈', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝',
    '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🐾', '🐉', '🐲', '🌵', '🎄', '🌲', '🌳',
    '🌴', '🪵', '🌱', '🌿', '☘️', '🍀', '🎍', '🪴', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🪨', '🌾',
    '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗',
    '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '🪐', '💫', '⭐', '🌟', '✨', '⚡', '☄️',
    '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️',
    '⛄', '🌬️', '💨', '💧', '💦', '☔', '☂️', '🌊', '🌫️', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
    '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️',
    '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈',
    '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮',
    '🌯', '🫔', '🥗', '🥘', '🫕', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚',
    '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬',
    '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🧃', '🥤', '🧋', '🍶',
    '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢',
    '🧂', '🥤', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹',
    '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰',
    '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶',
    '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩',
    '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦',
    '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬',
    '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒',
    '🧽', '🪣', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞',
    '🪟', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️',
    '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜',
    '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️',
    '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖',
    '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️',
    '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓', '✅', '❌', '❓', '❗', '💯', '🔴', '🟠', '🟡',
    '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '💠', '🔘', '🔳', '🔲',
    '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈',
    '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴',
    '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞',
    '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'
];

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

const getElapsedTime = (seatTime) => {
    if (!seatTime) return '0m';
    return formatDuration(Date.now() - seatTime);
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
            avatarWrapper.dataset.seatTime = user.seatTime || '';

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
            timeSpan.textContent = getElapsedTime(user.seatTime);

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
            const seatTime = parseInt(avatarWrapper.dataset.seatTime);
            const timeSpan = avatarWrapper.querySelector('.avatar-time');
            if (timeSpan && seatTime) {
                timeSpan.textContent = getElapsedTime(seatTime);
            }
        });
    }, 60000);
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
                const username = labelTop.textContent.split(' ')[0];
                labelTop.textContent = `${username} ${data.emoji}`;
            }
        }
    }

    if (data.socketId === socket.id && data.emoji) {
        emojiDisplay.textContent = data.emoji;
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

const renderEmojiGrid = (emojis) => {
    emojiGrid.innerHTML = '';
    emojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-option';
        btn.textContent = emoji;
        btn.addEventListener('click', () => {
            emojiDisplay.textContent = emoji;
            emojiPicker.classList.add('hidden');
            emojiSearch.value = '';
            isPickerOpen = false;
        });
        emojiGrid.appendChild(btn);
    });
};

const emojiKeywords = {
    '😀': ['happy', 'smile', 'joy', 'fun', 'glad'],
    '😃': ['happy', 'smile', 'joy'],
    '😄': ['happy', 'smile', 'laugh'],
    '😁': ['happy', 'smile', 'grin'],
    '😆': ['laugh', 'lol', 'haha', 'funny'],
    '😅': ['nervous', 'laugh', 'sweat'],
    '🤣': ['laugh', 'rofl', 'lol', 'funny'],
    '😂': ['laugh', 'cry', 'lol', 'funny', 'tears'],
    '🙂': ['smile', 'neutral'],
    '😊': ['happy', 'smile', 'blush'],
    '😇': ['innocent', 'angel', 'good'],
    '🥰': ['love', 'heart', 'crush', 'adore'],
    '😍': ['love', 'heart', 'love', 'crush'],
    '🤩': ['star', 'excited', 'wow'],
    '😘': ['love', 'kiss', 'heart'],
    '😋': ['yum', 'tasty', 'food', 'delicious'],
    '😛': ['tongue', 'playful'],
    '😜': ['tongue', 'wink', 'playful', 'crazy'],
    '🤪': ['crazy', 'wacky', 'zany'],
    '😝': ['tongue', 'playful'],
    '🤑': ['money', 'rich', 'dollar'],
    '🤗': ['hug', 'hugging'],
    '🤭': ['oops', 'blush', 'hide'],
    '🤔': ['think', 'hmm', 'thought'],
    '🤨': ['skeptical', 'suspicious'],
    '😐': ['neutral', 'meh'],
    '😑': ['neutral', 'expressionless'],
    '😶': ['neutral', 'no mouth'],
    '😏': ['smirk', 'sly', 'smug'],
    '😒': ['annoyed', 'meh', 'upset'],
    '🙄': ['eye roll', 'annoyed'],
    '😬': ['awkward', 'nervous'],
    '😮': ['wow', 'surprised', 'omg'],
    '😯': ['surprised', 'shock'],
    '😲': ['surprised', 'shocked', 'wow'],
    '😳': ['embarrassed', 'shy', 'blush'],
    '🥺': ['please', 'puppy', 'sad', 'begging'],
    '😦': ['surprised', 'gasp'],
    '😧': ['surprised', 'gasp'],
    '😨': ['scared', 'fear', 'afraid'],
    '😰': ['nervous', 'worried', 'anxious'],
    '😥': ['sad', 'disappointed', 'worried'],
    '😢': ['sad', 'cry', 'tears'],
    '😭': ['sad', 'cry', 'sob', 'tears'],
    '😱': ['scream', 'scared', 'fear', 'wow'],
    '😤': ['angry', 'mad', 'triumph'],
    '😡': ['angry', 'mad', 'pissed'],
    '😠': ['angry', 'mad', 'grumpy'],
    '🤬': ['angry', 'cursing', 'mad'],
    '😈': ['devil', 'evil', 'horny'],
    '👿': ['devil', 'angry', 'evil'],
    '💀': ['dead', 'skull', 'death'],
    '💩': ['poop', 'shit', 'crap'],
    '🤡': ['clown', 'silly'],
    '👹': ['monster', 'demon', 'ogre'],
    '👺': ['monster', 'tengu'],
    '👻': ['ghost', 'halloween', 'boo'],
    '👽': ['alien', 'ufo', 'extraterrestrial'],
    '👾': ['alien', 'space invader', 'game'],
    '🤖': ['robot', 'bot'],
    '💋': ['kiss', 'love'],
    '💌': ['letter', 'love', 'mail'],
    '❤️': ['heart', 'love', 'red'],
    '🧡': ['heart', 'orange', 'love'],
    '💛': ['heart', 'yellow', 'love'],
    '💚': ['heart', 'green', 'love'],
    '💙': ['heart', 'blue', 'love'],
    '💜': ['heart', 'purple', 'love'],
    '🖤': ['heart', 'black', 'love'],
    '🤍': ['heart', 'white', 'love'],
    '💯': ['hundred', 'perfect', '100'],
    '🔥': ['fire', 'hot', 'lit', 'burning'],
    '💥': ['boom', 'explosion', 'bang'],
    '✨': ['sparkles', 'star', 'shine'],
    '⭐': ['star', 'gold'],
    '🌟': ['star', 'glowing'],
    '💫': ['star', 'dizzy'],
    '🌈': ['rainbow'],
    '☀️': ['sun', 'sunny', 'bright'],
    '🌙': ['moon', 'night', 'crescent'],
    '🌸': ['flower', 'cherry blossom', 'spring'],
    '🌺': ['flower', 'hibiscus'],
    '🌻': ['flower', 'sunflower'],
    '🌹': ['flower', 'rose'],
    '🌵': ['cactus', 'desert'],
    '🌴': ['palm', 'tree', 'beach'],
    '🌲': ['tree', 'pine', 'forest'],
    '🌳': ['tree', 'oak', 'forest'],
    '🍎': ['apple', 'fruit', 'red'],
    '🍊': ['orange', 'fruit', 'tangerine'],
    '🍋': ['lemon', 'fruit', 'sour'],
    '🍌': ['banana', 'fruit', 'yellow'],
    '🍉': ['watermelon', 'fruit', 'summer'],
    '🍇': ['grapes', 'fruit', 'wine'],
    '🍓': ['strawberry', 'fruit', 'red'],
    '🍒': ['cherry', 'fruit', 'red'],
    '🍑': ['peach', 'fruit'],
    '🍍': ['pineapple', 'fruit'],
    '🥝': ['kiwi', 'fruit', 'green'],
    '🍅': ['tomato', 'red', 'vegetable'],
    '🥑': ['avocado', 'green', 'healthy'],
    '🥦': ['broccoli', 'green', 'vegetable'],
    '🥬': ['lettuce', 'green', 'salad'],
    '🌶️': ['pepper', 'spicy', 'hot'],
    '🍄': ['mushroom', 'fungus'],
    '🌰': ['chestnut', 'nut'],
    '🍞': ['bread', 'toast'],
    '🥐': ['croissant', 'bread', 'french'],
    '🥖': ['baguette', 'bread', 'french'],
    '🥨': ['pretzel', 'bread', 'snack'],
    '🧀': ['cheese', 'yellow'],
    '🥚': ['egg', 'breakfast'],
    '🍳': ['egg', 'breakfast', 'cooking'],
    '🥓': ['bacon', 'breakfast', 'meat'],
    '🍔': ['burger', 'hamburger', 'fast food'],
    '🍟': ['fries', 'french fries', 'fast food'],
    '🍕': ['pizza', 'italian', 'fast food'],
    '🌮': ['taco', 'mexican'],
    '🌯': ['burrito', 'mexican'],
    '🥗': ['salad', 'healthy', 'green'],
    '🍝': ['pasta', 'spaghetti', 'italian'],
    '🍜': ['noodles', 'ramen', 'soup'],
    '🍣': ['sushi', 'japanese', 'fish'],
    '🍱': ['bento', 'japanese', 'lunch'],
    '🍙': ['rice ball', 'japanese'],
    '🍚': ['rice', 'japanese'],
    '🍛': ['curry', 'indian'],
    '🍦': ['ice cream', 'dessert', 'cold'],
    '🍧': ['shaved ice', 'dessert', 'cold'],
    '🍨': ['ice cream', 'dessert'],
    '🍰': ['cake', 'dessert', 'birthday'],
    '🎂': ['cake', 'birthday', 'party'],
    '🍮': ['pudding', 'dessert', 'flan'],
    '🍭': ['lollipop', 'candy', 'sweet'],
    '🍬': ['candy', 'sweet', 'dessert'],
    '🍫': ['chocolate', 'candy', 'dessert'],
    '🍿': ['popcorn', 'movie', 'snack'],
    '🍩': ['donut', 'dessert', 'sweet'],
    '🍪': ['cookie', 'biscuit', 'sweet'],
    '🌰': ['chestnut', 'nut'],
    '🥜': ['peanut', 'nut'],
    '☕': ['coffee', 'caffeine', 'hot', 'morning'],
    '🍵': ['tea', 'green tea', 'japanese'],
    '🧃': ['juice', 'drink'],
    '🥤': ['drink', 'cup', 'soda'],
    '🧋': ['boba', 'bubble tea', 'milk tea'],
    '🍺': ['beer', 'drink', 'alcohol'],
    '🍻': ['beer', 'drinks', 'cheers'],
    '🍷': ['wine', 'drink', 'alcohol'],
    '🥃': ['whiskey', 'drink', 'alcohol'],
    '🍸': ['cocktail', 'drink', 'alcohol'],
    '🍹': ['cocktail', 'drink', 'tropical'],
    '💻': ['computer', 'laptop', 'work', 'coding', 'tech'],
    '🖥️': ['computer', 'desktop', 'work'],
    '🖨️': ['printer', 'print'],
    '⌨️': ['keyboard', 'type', 'coding'],
    '🖱️': ['mouse', 'computer'],
    '💽': ['disk', 'cd', 'storage'],
    '💾': ['floppy', 'disk', 'save'],
    '💿': ['cd', 'disk', 'disk'],
    '📱': ['phone', 'mobile', 'cell'],
    '📞': ['phone', 'call'],
    '☎️': ['phone', 'landline'],
    '📷': ['camera', 'photo'],
    '📸': ['camera', 'photo', 'flash'],
    '📹': ['video', 'camcorder'],
    '🎥': ['video', 'movie', 'camera'],
    '📺': ['tv', 'television'],
    '📻': ['radio'],
    '🎙️': ['microphone', 'podcast'],
    '⏰': ['alarm', 'clock', 'wake'],
    '⏱️': ['stopwatch', 'timer'],
    '⏲️': ['timer', 'cooking'],
    '🕰️': ['clock', 'time'],
    '⌛': ['hourglass', 'time', 'waiting'],
    '⏳': ['hourglass', 'time', 'waiting'],
    '🔋': ['battery', 'power', 'charge'],
    '💡': ['light bulb', 'idea', 'bright'],
    '🔦': ['flashlight', 'light', 'torch'],
    '💰': ['money', 'dollar', 'rich', 'cash'],
    '💵': ['money', 'dollar', 'cash'],
    '💳': ['credit card', 'card', 'payment'],
    '💎': ['diamond', 'gem', 'jewel'],
    '🔧': ['wrench', 'tool', 'fix'],
    '🔨': ['hammer', 'tool', 'build'],
    '⚒️': ['tools', 'build', 'work'],
    '🛠️': ['tools', 'wrench', 'fix'],
    '⛏️': ['pick', 'mining', 'tool'],
    '🔩': ['nut', 'bolt', 'hardware'],
    '⚙️': ['gear', 'settings', 'cog'],
    '🪤': ['trap', 'mouse trap'],
    '🧱': ['brick', 'wall'],
    '⛓️': ['chain', 'link'],
    '🔫': ['gun', 'water gun', 'weapon'],
    '💣': ['bomb', 'explosion'],
    '🧨': ['bomb', 'dynamite', 'explosion'],
    '🪓': ['axe', 'chop', 'tool'],
    '🔪': ['knife', 'cut', 'weapon'],
    '🗡️': ['knife', 'sword', 'weapon'],
    '⚔️': ['swords', 'fight', 'battle'],
    '🛡️': ['shield', 'defend'],
    '🚬': ['cigarette', 'smoking'],
    '⚰️': ['coffin', 'dead', 'death'],
    '⚱️': ['urn', 'ashes'],
    '🏺': ['vase', 'jar'],
    '🔮': ['crystal ball', 'magic', 'fortune'],
    '🧿': ['amulet', 'evil eye'],
    '💈': ['barber', 'salon'],
    '⚗️': ['chemistry', 'science', 'flask'],
    '🔭': ['telescope', 'space', 'astronomy'],
    '🔬': ['microscope', 'science', 'research'],
    '🩹': ['bandage', 'band aid', 'hurt'],
    '🩺': ['stethoscope', 'doctor', 'medical'],
    '💊': ['pill', 'medicine', 'drug'],
    '💉': ['syringe', 'vaccine', 'medical'],
    '🩸': ['blood', 'donate', 'medical'],
    '🧬': ['dna', 'genetics', 'biology'],
    '🦠': ['virus', 'germ', 'microbe'],
    '🧫': ['petri dish', 'science', 'biology'],
    '🧪': ['test tube', 'science', 'chemistry'],
    '🌡️': ['thermometer', 'temperature', 'fever'],
    '🧹': ['broom', 'sweep', 'witch'],
    '🪠': ['plunger', 'toilet', 'clog'],
    '🧺': ['basket', 'laundry', 'harvest'],
    '🧻': ['toilet paper', 'tp'],
    '🚽': ['toilet', 'bathroom'],
    '🚿': ['shower', 'bathroom', 'wash'],
    '🛁': ['bathtub', 'bath', 'bathroom'],
    '🛀': ['bath', 'rest', 'relax'],
    '🧼': ['soap', 'wash', 'clean'],
    '🪥': ['toothbrush', 'teeth', 'clean'],
    '🪒': ['razor', 'shave'],
    '🧽': ['sponge', 'clean', 'wash'],
    '🪣': ['bucket', 'pail'],
    '🧴': ['lotion', 'bottle', 'skincare'],
    '🛎️': ['bell', 'hotel', 'reception'],
    '🔑': ['key', 'unlock', 'access'],
    '🗝️': ['key', 'old', 'unlock'],
    '🚪': ['door', 'entrance', 'exit'],
    '🪑': ['chair', 'seat', 'furniture'],
    '🛋️': ['couch', 'sofa', 'furniture'],
    '🛏️': ['bed', 'sleep', 'furniture'],
    '🧸': ['teddy bear', 'toy', 'plush'],
    '🖼️': ['picture', 'frame', 'photo'],
    '🪞': ['mirror', 'reflect'],
    '🪟': ['window', 'glass'],
    '🛍️': ['shopping bag', 'bag', 'shopping'],
    '🛒': ['cart', 'shopping'],
    '🎁': ['gift', 'present', 'birthday', 'party'],
    '🎈': ['balloon', 'party', 'birthday'],
    '🎀': ['ribbon', 'bow', 'gift'],
    '🎊': ['confetti', 'party', 'celebrate'],
    '🎉': ['party', 'celebrate', 'yay'],
    '🎎': ['japanese doll', 'festival'],
    '🏮': ['lantern', 'japanese', 'izakaya'],
    '✉️': ['email', 'envelope', 'mail'],
    '📩': ['email', 'envelope', 'receive'],
    '📧': ['email', 'mail', 'letter'],
    '💌': ['love letter', 'letter', 'mail'],
    '📦': ['package', 'box', 'shipping'],
    '🏷️': ['tag', 'label', 'price'],
    '📮': ['mailbox', 'post'],
    '📜': ['scroll', 'document', 'ancient'],
    '📄': ['document', 'file', 'paper'],
    '📃': ['document', 'page', 'file'],
    '📑': ['bookmark', 'tab', 'marker'],
    '📊': ['chart', 'graph', 'bar'],
    '📈': ['chart', 'graph', 'up', 'growth'],
    '📉': ['chart', 'graph', 'down', 'decline'],
    '📆': ['calendar', 'date', 'schedule'],
    '📅': ['calendar', 'date', 'schedule'],
    '🗑️': ['trash', 'bin', 'delete'],
    '🗂️': ['folders', 'directory', 'files'],
    '🗃️': ['file box', 'files', 'storage'],
    '🗳️': ['ballot', 'vote', 'election'],
    '🗄️': ['file cabinet', 'storage'],
    '📁': ['folder', 'directory'],
    '📂': ['open folder', 'directory'],
    '🗞️': ['newspaper', 'news'],
    '📰': ['newspaper', 'news', 'press'],
    '📓': ['notebook', 'book'],
    '📔': ['notebook', 'book'],
    '📒': ['notebook', 'ledger'],
    '📕': ['book', 'closed'],
    '📗': ['book', 'green'],
    '📘': ['book', 'blue'],
    '📙': ['book', 'orange'],
    '📚': ['books', 'library', 'reading'],
    '📖': ['book', 'open', 'read'],
    '🔖': ['bookmark', 'mark'],
    '🔗': ['link', 'chain', 'url'],
    '📎': ['paperclip', 'attachment'],
    '🖇️': ['paperclips', 'attachment'],
    '📐': ['ruler', 'measure', 'drafting'],
    '📏': ['ruler', 'measure'],
    '✂️': ['scissors', 'cut'],
    '🖊️': ['pen', 'write'],
    '🖋️': ['fountain pen', 'write'],
    '✒️': ['pen', 'black', 'write'],
    '🖌️': ['brush', 'paint', 'draw'],
    '🖍️': ['crayon', 'draw'],
    '📝': ['note', 'memo', 'write'],
    '✏️': ['pencil', 'write', 'edit'],
    '🔍': ['search', 'magnify', 'zoom'],
    '🔎': ['search', 'magnify', 'zoom'],
    '🔏': ['lock', 'pen', 'privacy'],
    '🔐': ['lock', 'key', 'secure'],
    '🔒': ['lock', 'locked', 'secure'],
    '🔓': ['lock', 'unlock', 'open'],
    '✅': ['check', 'yes', 'done', 'correct'],
    '❌': ['cross', 'no', 'wrong', 'cancel'],
    '❓': ['question', 'help', 'quiz'],
    '❗': ['exclamation', 'warning', 'important'],
    '🔴': ['circle', 'red', 'dot'],
    '🟠': ['circle', 'orange', 'dot'],
    '🟡': ['circle', 'yellow', 'dot'],
    '🟢': ['circle', 'green', 'dot'],
    '🔵': ['circle', 'blue', 'dot'],
    '🟣': ['circle', 'purple', 'dot'],
    '⚫': ['circle', 'black', 'dot'],
    '⚪': ['circle', 'white', 'dot'],
    '🟤': ['circle', 'brown', 'dot'],
    '🔺': ['triangle', 'red', 'up'],
    '🔻': ['triangle', 'red', 'down'],
    '🔸': ['diamond', 'orange', 'small'],
    '🔹': ['diamond', 'blue', 'small'],
    '🔶': ['diamond', 'orange', 'large'],
    '🔷': ['diamond', 'blue', 'large'],
    '💠': ['diamond', 'blue', 'circle'],
    '🔘': ['radio button', 'circle'],
    '🔳': ['square', 'white', 'button'],
    '🔲': ['square', 'black', 'button'],
    '▪️': ['square', 'black', 'small'],
    '▫️': ['square', 'white', 'small'],
    '◾': ['square', 'black'],
    '◽': ['square', 'white'],
    '◼️': ['square', 'black'],
    '◻️': ['square', 'white'],
    '🟥': ['square', 'red'],
    '🟧': ['square', 'orange'],
    '🟨': ['square', 'yellow'],
    '🟩': ['square', 'green'],
    '🟦': ['square', 'blue'],
    '🟪': ['square', 'purple'],
    '⬛': ['square', 'black'],
    '⬜': ['square', 'white'],
    '🟫': ['square', 'brown'],
    '🔈': ['speaker', 'volume', 'low'],
    '🔇': ['speaker', 'mute', 'silent'],
    '🔉': ['speaker', 'volume', 'medium'],
    '🔊': ['speaker', 'volume', 'high', 'loud'],
    '🔔': ['bell', 'notification', 'ring'],
    '🔕': ['bell', 'mute', 'silent'],
    '📢': ['megaphone', 'announcement', 'loud'],
    '📣': ['megaphone', 'announcement', 'cheer'],
    '💬': ['speech bubble', 'chat', 'message'],
    '💭': ['thought bubble', 'think', 'idea'],
    '🗯️': ['anger bubble', 'mad', 'angry'],
    '♠️': ['spade', 'card', 'suit'],
    '♣️': ['club', 'card', 'suit'],
    '♥️': ['heart', 'card', 'suit', 'love'],
    '♦️': ['diamond', 'card', 'suit'],
    '🃏': ['joker', 'card', 'wild'],
    '🎴': ['flower card', 'japanese', 'card'],
    '🀄': ['mahjong', 'dragon', 'game'],
    '🕐': ['clock', 'time', '1 oclock'],
    '🕑': ['clock', 'time', '2 oclock'],
    '🕒': ['clock', 'time', '3 oclock'],
    '🕓': ['clock', 'time', '4 oclock'],
    '🕔': ['clock', 'time', '5 oclock'],
    '🕕': ['clock', 'time', '6 oclock'],
    '🕖': ['clock', 'time', '7 oclock'],
    '🕗': ['clock', 'time', '8 oclock'],
    '🕘': ['clock', 'time', '9 oclock'],
    '🕙': ['clock', 'time', '10 oclock'],
    '🕚': ['clock', 'time', '11 oclock'],
    '🕛': ['clock', 'time', '12 oclock'],
    '👋': ['wave', 'hand', 'bye', 'hello'],
    '🤚': ['hand', 'backhand'],
    '🖐️': ['hand', 'five', 'high five'],
    '✋': ['hand', 'stop', 'high five'],
    '🖖': ['vulcan', 'spock', 'star trek'],
    '👌': ['ok', 'hand', 'perfect'],
    '🤌': ['italian hand', 'italy'],
    '🤏': ['small hand', 'tiny'],
    '✌️': ['peace', 'victory', 'two'],
    '🤞': ['cross fingers', 'luck'],
    '🤟': ['love you', 'rock'],
    '🤘': ['rock on', 'horns', 'metal'],
    '🤙': ['call me', 'shaka'],
    '👈': ['point left', 'left'],
    '👉': ['point right', 'right'],
    '👆': ['point up', 'up'],
    '🖕': ['middle finger', 'fuck', 'rude'],
    '👇': ['point down', 'down'],
    '☝️': ['point up', 'one', 'up'],
    '👍': ['thumbs up', 'like', 'good', 'yes'],
    '👎': ['thumbs down', 'dislike', 'bad', 'no'],
    '✊': ['fist', 'punch', 'power'],
    '👊': ['fist bump', 'punch'],
    '🤛': ['fist left', 'punch'],
    '🤜': ['fist right', 'punch'],
    '👏': ['clap', 'hands', 'bravo'],
    '🙌': ['hands up', 'hooray', 'yay'],
    '👐': ['open hands', 'stop'],
    '🤲': ['palms together', 'pray', 'please'],
    '🤝': ['handshake', 'deal', 'agree'],
    '🙏': ['pray', 'please', 'thank you', 'namaste'],
    '✍️': ['writing hand', 'write', 'pen'],
    '💅': ['nail polish', 'nails', 'beauty'],
    '💪': ['muscle', 'strong', 'flex', 'power'],
    '🦾': ['robot arm', 'prosthetic'],
    '🦵': ['leg', 'kick'],
    '🦶': ['foot', 'kick'],
    '👂': ['ear', 'hear', 'listen'],
    '🦻': ['ear hearing', 'deaf'],
    '👃': ['nose', 'smell'],
    '🧠': ['brain', 'smart', 'think'],
    '🫀': ['heart', 'organ', 'love'],
    '🫁': ['lungs', 'breath', 'organ'],
    '🦷': ['tooth', 'teeth', 'dentist'],
    '🦴': ['bone', 'skeleton'],
    '👀': ['eyes', 'look', 'see'],
    '👁️': ['eye', 'see', 'look'],
    '👅': ['tongue', 'taste'],
    '👄': ['mouth', 'lips', 'kiss'],
    '👶': ['baby', 'infant'],
    '🧒': ['child', 'kid'],
    '👦': ['boy', 'male child'],
    '👧': ['girl', 'female child'],
    '🧑': ['person', 'adult'],
    '👱': ['blonde', 'person'],
    '👨': ['man', 'male'],
    '🧔': ['beard', 'man'],
    '👩': ['woman', 'female'],
    '🧓': ['older person', 'elderly'],
    '👴': ['old man', 'grandpa'],
    '👵': ['old woman', 'grandma'],
    '🙍': ['frown', 'sad', 'upset'],
    '🙎': ['angry', 'mad', 'upset'],
    '🙅': ['no gesture', 'stop', 'nope'],
    '💁': ['info', 'help', 'service'],
    '🙆': ['ok gesture', 'okay', 'yes'],
    '💇': ['haircut', 'salon'],
    '💆': ['massage', 'spa', 'relax'],
    '🙇': ['bow', 'apologize', 'respect'],
    '🤦': ['facepalm', 'disbelief'],
    '💃': ['dance', 'woman', 'party'],
    '🕺': ['dance', 'man', 'party'],
    '🧖': ['sauna', 'steam room', 'naked'],
    '🧗': ['climbing', 'rock', 'climb'],
    '🤸': ['gymnastics', 'cartwheel'],
    '🏌️': ['golf', 'sport'],
    '🏇': ['horse racing', 'sport'],
    '⛷️': ['skiing', 'sport', 'winter'],
    '🏂': ['snowboard', 'sport', 'winter'],
    '🏋️': ['weight lifting', 'gym', 'workout'],
    '🤼': ['wrestling', 'sport'],
    '🤽': ['water polo', 'sport', 'water'],
    '🤾': ['handball', 'sport'],
    '🤺': ['fencing', 'sport'],
    '⛹️': ['basketball', 'sport', 'ball'],
    '🏊': ['swimming', 'sport', 'water'],
    '🚣': ['rowing', 'sport', 'boat'],
    '🧘': ['yoga', 'meditate', 'lotus'],
    '🛀': ['bath', 'rest', 'relax'],
    '🛌': ['sleeping', 'bed', 'rest'],
    '👭': ['women holding hands', 'couple'],
    '👫': ['man and woman holding hands', 'couple'],
    '👬': ['men holding hands', 'couple'],
    '💏': ['kiss', 'couple', 'love'],
    '💑': ['couple', 'love', 'heart'],
    '👪': ['family', 'parents', 'child'],
    '🐶': ['dog', 'puppy', 'pet'],
    '🐱': ['cat', 'kitten', 'pet'],
    '🐭': ['mouse', 'pet'],
    '🐹': ['hamster', 'pet'],
    '🐰': ['rabbit', 'bunny', 'pet'],
    '🦊': ['fox', 'animal'],
    '🐻': ['bear', 'animal'],
    '🐼': ['panda', 'bear', 'animal'],
    '🐨': ['koala', 'bear', 'australia'],
    '🐯': ['tiger', 'cat', 'animal'],
    '🦁': ['lion', 'king', 'animal'],
    '🐮': ['cow', 'animal', 'moo'],
    '🐷': ['pig', 'animal', 'oink'],
    '🐸': ['frog', 'animal', 'ribbit'],
    '🐵': ['monkey', 'animal', 'banana'],
    '🐔': ['chicken', 'animal', 'egg'],
    '🐧': ['penguin', 'animal', 'bird'],
    '🐦': ['bird', 'animal', 'twitter'],
    '🐤': ['chick', 'baby chicken'],
    '🐣': ['hatching chick', 'baby'],
    '🐥': ['baby chick', 'cute'],
    '🦆': ['duck', 'bird', 'animal'],
    '🦅': ['eagle', 'bird', 'animal'],
    '🦉': ['owl', 'bird', 'animal'],
    '🦇': ['bat', 'animal', 'vampire'],
    '🐺': ['wolf', 'animal', 'howl'],
    '🐗': ['boar', 'animal', 'pig'],
    '🐴': ['horse', 'animal', 'pony'],
    '🦄': ['unicorn', 'magic', 'fantasy'],
    '🐝': ['bee', 'honey', 'insect'],
    '🐛': ['caterpillar', 'bug', 'insect'],
    '🦋': ['butterfly', 'bug', 'insect'],
    '🐌': ['snail', 'bug', 'slow'],
    '🐞': ['ladybug', 'bug', 'insect'],
    '🐜': ['ant', 'bug', 'insect'],
    '🪲': ['beetle', 'bug', 'insect'],
    '🕷️': ['spider', 'bug', 'insect'],
    '🕸️': ['spider web', 'cobweb'],
    '🦂': ['scorpion', 'bug', 'zodiac'],
    '🐢': ['turtle', 'slow', 'animal'],
    '🐍': ['snake', 'snake', 'animal'],
    '🦎': ['lizard', 'reptile', 'animal'],
    '🦖': ['t-rex', 'dinosaur', 'tyrannosaurus'],
    '🦕': ['dinosaur', 'sauropod', 'brontosaurus'],
    '🐙': ['octopus', 'ocean', 'animal'],
    '🦑': ['squid', 'ocean', 'animal'],
    '🦐': ['shrimp', 'ocean', 'animal'],
    '🦀': ['crab', 'ocean', 'animal'],
    '🐠': ['tropical fish', 'fish', 'ocean'],
    '🐟': ['fish', 'ocean', 'animal'],
    '🐬': ['dolphin', 'ocean', 'animal'],
    '🐳': ['whale', 'ocean', 'animal'],
    '🐋': ['whale', 'ocean', 'animal'],
    '🦈': ['shark', 'ocean', 'animal'],
    '🐊': ['crocodile', 'reptile', 'animal'],
    '🐆': ['leopard', 'cat', 'animal'],
    '🦓': ['zebra', 'animal', 'africa'],
    '🦍': ['gorilla', 'animal', 'ape'],
    '🦧': ['orangutan', 'animal', 'ape'],
    '🐘': ['elephant', 'animal', 'trunk'],
    '🦛': ['hippo', 'hippopotamus', 'animal'],
    '🦏': ['rhino', 'rhinoceros', 'animal'],
    '🐪': ['camel', 'animal', 'desert'],
    '🐫': ['camel', 'animal', 'desert'],
    '🦒': ['giraffe', 'animal', 'tall'],
    '🦘': ['kangaroo', 'animal', 'australia'],
    '🦬': ['bison', 'buffalo', 'animal'],
    '🐃': ['water buffalo', 'animal'],
    '🐂': ['ox', 'animal', 'cow'],
    '🐄': ['cow', 'animal', 'moo'],
    '🐎': ['horse', 'animal', 'fast'],
    '🐖': ['pig', 'animal', 'oink'],
    '🐏': ['ram', 'sheep', 'animal'],
    '🐑': ['ewe', 'sheep', 'animal'],
    '🐐': ['goat', 'animal', 'kid'],
    '🦌': ['deer', 'animal', 'bambi'],
    '🐕': ['dog', 'puppy', 'pet'],
    '🐩': ['poodle', 'dog', 'pet'],
    '🐈': ['cat', 'kitten', 'pet'],
    '🐓': ['rooster', 'chicken', 'animal'],
    '🦃': ['turkey', 'bird', 'animal'],
    '🦚': ['peacock', 'bird', 'beautiful'],
    '🦜': ['parrot', 'bird', 'animal'],
    '🦢': ['swan', 'bird', 'animal'],
    '🦩': ['flamingo', 'bird', 'animal'],
    '🕊️': ['dove', 'bird', 'peace'],
    '🐇': ['rabbit', 'bunny', 'pet'],
    '🦝': ['raccoon', 'animal', 'cute'],
    '🦨': ['skunk', 'animal', 'stink'],
    '🦡': ['badger', 'animal'],
    '🦫': ['beaver', 'animal', 'dam'],
    '🦦': ['otter', 'animal', 'cute'],
    '🦥': ['sloth', 'animal', 'slow'],
    '🐁': ['mouse', 'animal', 'tiny'],
    '🐀': ['rat', 'animal'],
    '🐿️': ['chipmunk', 'squirrel', 'animal'],
    '🦔': ['hedgehog', 'animal', 'cute'],
    '🐉': ['dragon', 'mythical', 'fantasy'],
    '🐲': ['dragon', 'mythical', 'fantasy'],
    '🌵': ['cactus', 'plant', 'desert'],
    '🎄': ['christmas tree', 'tree', 'holiday'],
    '🌲': ['evergreen tree', 'tree', 'forest'],
    '🌳': ['deciduous tree', 'tree', 'forest'],
    '🌴': ['palm tree', 'tree', 'beach'],
    '🌱': ['seedling', 'plant', 'grow'],
    '🌿': ['herb', 'plant', 'green'],
    '☘️': ['shamrock', 'plant', 'irish'],
    '🍀': ['four leaf clover', 'luck', 'irish'],
    '🎍': ['bamboo', 'plant', 'japanese'],
    '🪴': ['potted plant', 'plant', 'indoor'],
    '🎋': ['tanabata tree', 'japanese', 'festival'],
    '🍃': ['leaf', 'plant', 'green', 'nature'],
    '🍂': ['fallen leaf', 'fall', 'autumn'],
    '🍁': ['maple leaf', 'canada', 'fall'],
    '🍄': ['mushroom', 'plant', 'fungus'],
    '🐚': ['shell', 'ocean', 'beach'],
    '🪨': ['rock', 'stone'],
    '🌾': ['rice', 'plant', 'harvest'],
    '💐': ['bouquet', 'flowers', 'gift'],
    '🌷': ['tulip', 'flower', 'spring'],
    '🌹': ['rose', 'flower', 'love'],
    '🌺': ['hibiscus', 'flower', 'tropical'],
    '🌸': ['cherry blossom', 'flower', 'spring'],
    '🌼': ['blossom', 'flower', 'spring'],
    '🌻': ['sunflower', 'flower', 'summer'],
    '🌞': ['sun with face', 'sunny', 'happy'],
    '🌝': ['full moon face', 'moon', 'creepy'],
    '🌛': ['first quarter moon face', 'moon'],
    '🌜': ['last quarter moon face', 'moon'],
    '🌚': ['new moon face', 'moon', 'creepy'],
    '🌕': ['full moon', 'moon', 'night'],
    '🌖': ['waning gibbous moon', 'moon'],
    '🌗': ['last quarter moon', 'moon'],
    '🌘': ['waning crescent moon', 'moon'],
    '🌑': ['new moon', 'moon', 'dark'],
    '🌒': ['waxing crescent moon', 'moon'],
    '🌓': ['first quarter moon', 'moon'],
    '🌔': ['waxing gibbous moon', 'moon'],
    '🌙': ['crescent moon', 'moon', 'night'],
    '🌎': ['earth globe americas', 'world', 'globe'],
    '🌍': ['earth globe europe africa', 'world', 'globe'],
    '🌏': ['earth globe asia australia', 'world', 'globe'],
    '🪐': ['ringed planet', 'saturn', 'space'],
    '💫': ['dizzy', 'star', 'space'],
    '⭐': ['star', 'gold', 'space'],
    '🌟': ['glowing star', 'star', 'space'],
    '✨': ['sparkles', 'star', 'shine'],
    '⚡': ['high voltage', 'electric', 'zap', 'fast'],
    '☄️': ['comet', 'space', 'meteor'],
    '💥': ['collision', 'boom', 'explosion'],
    '🔥': ['fire', 'hot', 'burn'],
    '🌪️': ['tornado', 'storm', 'wind'],
    '🌈': ['rainbow', 'color', 'sky'],
    '☀️': ['sun', 'sunny', 'bright'],
    '🌤️': ['sun behind small cloud', 'weather'],
    '⛅': ['sun behind cloud', 'weather', 'cloudy'],
    '🌥️': ['sun behind large cloud', 'weather'],
    '☁️': ['cloud', 'cloudy', 'weather'],
    '🌦️': ['sun rain cloud', 'weather'],
    '🌧️': ['cloud rain', 'weather', 'rain'],
    '⛈️': ['cloud lightning rain', 'storm', 'weather'],
    '🌩️': ['cloud lightning', 'storm', 'weather'],
    '🌨️': ['cloud snow', 'winter', 'weather'],
    '❄️': ['snowflake', 'winter', 'cold'],
    '☃️': ['snowman', 'winter', 'snow'],
    '⛄': ['snowman', 'winter', 'snow'],
    '🌬️': ['wind face', 'wind', 'blow'],
    '💨': ['dash', 'wind', 'fast', 'run'],
    '💧': ['droplet', 'water', 'drop'],
    '💦': ['sweat droplets', 'water', 'splash'],
    '☔': ['umbrella with rain drops', 'rain', 'weather'],
    '☂️': ['umbrella', 'rain', 'weather'],
    '🌊': ['water wave', 'ocean', 'sea', 'wave'],
    '🌫️': ['fog', 'weather', 'hazy'],
    '😴': ['sleepy', 'tired', 'sleep'],
    '😪': ['sleepy', 'tired', 'drool'],
    '🤤': ['drooling', 'hungry', 'want'],
    '🤢': ['sick', 'nausea', 'vomit'],
    '🤮': ['vomit', 'sick', 'throw up'],
    '🤧': ['sneeze', 'achoo', 'sick'],
    '🥵': ['hot face', 'hot', 'sweating'],
    '🥶': ['cold face', 'cold', 'freezing'],
    '🥴': ['woozy face', 'drunk', 'dizzy'],
    '😵': ['dizzy face', 'dizzy', 'drunk'],
    '🤯': ['exploding head', 'shocked', 'mind blown'],
    '🤠': ['cowboy hat face', 'yeehaw', 'western'],
    '🥳': ['partying face', 'party', 'celebrate'],
    '🥸': ['disguised face', 'disguise', 'incognito'],
    '😎': ['cool', 'sunglasses', 'awesome'],
    '🤓': ['nerd', 'glasses', 'smart'],
    '🧐': ['monocle face', 'fancy', 'inspect'],
    '🤭': ['face with hand over mouth', 'oops', 'giggle'],
    '🤫': ['shushing face', 'quiet', 'shhh'],
    '🤐': ['zipper mouth', 'secret', 'quiet'],
    '🧑‍⚕️': ['health worker', 'doctor', 'nurse', 'medical'],
    '🧑‍🎓': ['student', 'graduation', 'school'],
    '🧑‍🏫': ['teacher', 'school', 'professor'],
    '🧑‍🏭': ['factory worker', 'industrial', 'worker'],
    '🧑‍🔬': ['scientist', 'research', 'lab'],
    '🧑‍🔧': ['mechanic', 'repair', 'tool'],
    '🧑‍🌾': ['farmer', 'agriculture', 'farmer'],
    '🧑‍🍳': ['cook', 'chef', 'cooking'],
    '🧑‍🎤': ['singer', 'music', 'performer'],
    '🧑‍🎨': ['artist', 'paint', 'creative'],
    '🧑‍✈️': ['pilot', 'airplane', 'captain'],
    '🧑‍🚀': ['astronaut', 'space', 'nasa'],
    '🧑‍🚒': ['firefighter', 'fire', 'rescue'],
    '🧑‍⚖️': ['judge', 'court', 'legal'],
    '🧑‍🦲': ['bald', 'hairless'],
    '🧑‍🦳': ['white hair', 'elderly'],
    '🧑‍🦱': ['curly hair', 'hair'],
    '🧑‍🦰': ['red hair', 'hair'],
    '🧑‍🦱': ['curly hair', 'hair'],
    '🧔': ['person beard', 'beard'],
    '👱': ['blonde hair', 'hair'],
    '👨': ['man', 'male', 'adult'],
    '👩': ['woman', 'female', 'adult'],
    '🧓': ['older adult', 'elderly'],
    '👴': ['old man', 'grandfather'],
    '👵': ['old woman', 'grandmother'],
    '🙍': ['person frowning', 'sad'],
    '🙎': ['person pouting', 'angry'],
    '🙅': ['person gesturing no', 'stop'],
    '💁': ['person tipping hand', 'information'],
    '🙆': ['person gesturing ok', 'ok'],
    '🙇': ['person bowing', 'sorry'],
    '🧏': ['deaf person', 'deaf'],
    '🙋': ['person raising hand', 'happy'],
    '🤦': ['person facepalming', 'disbelief'],
    '💇': ['person getting haircut', 'haircut'],
    '💆': ['person getting massage', 'massage'],
    '🚴': ['person biking', 'bike', 'cycling'],
    '🚵': ['person mountain biking', 'bike', 'mtn'],
    '🏇': ['horse racing', 'race', 'betting'],
    '⛷️': ['skier', 'ski', 'snow'],
    '🏂': ['snowboarder', 'snowboard', 'snow'],
    '🏋️': ['person lifting weights', 'gym', 'workout'],
    '🤸': ['person cartwheeling', 'gymnastics'],
    '🤺': ['person fencing', 'fencing'],
    '⛹️': ['person basketball', 'basketball'],
    '🏊': ['person swimming', 'swim', 'pool'],
    '🏄': ['person surfing', 'surf', 'wave'],
    '🚣': ['person rowing boat', 'row', 'boat'],
    '🧘': ['person in lotus position', 'yoga', 'meditate'],
    '🛀': ['person in bathtub', 'bath', 'relax'],
    '🛌': ['person in bed', 'sleep', 'rest'],
    '👪': ['family', 'parents', 'child'],
    '🗣️': ['speaking head', 'talk', 'speak'],
    '👤': ['bust', 'person'],
    '👥': ['busts', 'people', 'group'],
    '🫂': ['people hugging', 'hug', 'comfort'],
    '👣': ['footprints', 'feet', 'walk'],
    '🐕': ['dog', 'puppy', 'pet'],
    '🐈': ['cat', 'kitten', 'pet'],
    '💻': ['laptop', 'computer', 'work', 'tech'],
    '⌨️': ['keyboard', 'type', 'coding'],
    '🖥️': ['desktop computer', 'computer', 'work'],
    '🖨️': ['printer', 'print'],
    '🖱️': ['computer mouse', 'mouse', 'click'],
    '🖲️': ['trackball', 'computer'],
    '💽': ['computer disk', 'disk', 'storage'],
    '💾': ['floppy disk', 'save', 'storage'],
    '💿': ['optical disk', 'cd', 'dvd'],
    '📀': ['dvd', 'disk', 'storage'],
    '📼': ['videocassette', 'vhs', 'retro'],
    '📷': ['camera', 'photo', 'picture'],
    '📸': ['camera flash', 'photo', 'picture'],
    '📹': ['video camera', 'video', 'movie'],
    '🎥': ['movie camera', 'film', 'video'],
    '📽️': ['film projector', 'movie', 'projector'],
    '🎞️': ['film frames', 'movie', 'film'],
    '📞': ['telephone receiver', 'phone', 'call'],
    '☎️': ['telephone', 'phone', 'landline'],
    '📟': ['pager', 'retro', 'beeper'],
    '📠': ['fax machine', 'fax', 'retro'],
    '📺': ['television', 'tv', 'watch'],
    '📻': ['radio', 'music', 'listen'],
    '🎙️': ['studio microphone', 'podcast', 'mic'],
    '🎚️': ['level slider', 'audio', 'music'],
    '🎛️': ['control knobs', 'audio', 'music'],
    '🧭': ['compass', 'navigation', 'direction'],
    '⏱️': ['stopwatch', 'timer', 'sport'],
    '⏲️': ['timer clock', 'cooking', 'timer'],
    '⏰': ['alarm clock', 'wake', 'morning'],
    '🕰️': ['mantelpiece clock', 'time', 'clock'],
    '⌛': ['hourglass done', 'time', 'done'],
    '⏳': ['hourglass not done', 'time', 'waiting'],
    '📡': ['satellite antenna', 'signal', 'space'],
    '🔋': ['battery', 'power', 'charge'],
    '🔌': ['electric plug', 'power', 'charge'],
    '💡': ['light bulb', 'idea', 'bright'],
    '🔦': ['flashlight', 'light', 'torch'],
    '🕯️': ['candle', 'light', 'wax'],
    '🪔': ['diya lamp', 'lamp', 'diwali'],
    '🧯': ['extinguisher', 'fire', 'safety'],
    '🛢️': ['oil drum', 'oil', 'fuel'],
    '💸': ['money with wings', 'money', 'spent'],
    '💵': ['dollar banknote', 'money', 'cash'],
    '💴': ['yen banknote', 'money', 'japan'],
    '💶': ['euro banknote', 'money', 'europe'],
    '💷': ['pound banknote', 'money', 'uk'],
    '🪙': ['coin', 'money', 'currency'],
    '💰': ['money bag', 'money', 'rich'],
    '💳': ['credit card', 'payment', 'card'],
    '💎': ['gem stone', 'diamond', 'jewel'],
    '⚖️': ['balance scale', 'justice', 'law'],
    '🪜': ['ladder', 'climb', 'scale'],
    '🧰': ['toolbox', 'tools', 'repair'],
    '🪛': ['screwdriver', 'tool', 'fix'],
    '🔧': ['wrench', 'tool', 'fix'],
    '🔨': ['hammer', 'tool', 'build'],
    '⚒️': ['hammer and pick', 'tools', 'build'],
    '🛠️': ['hammer and wrench', 'tools', 'build'],
    '⛏️': ['pick', 'mine', 'tool'],
    '🪚': ['saw', 'cut', 'tool'],
    '🔩': ['nut and bolt', 'hardware'],
    '⚙️': ['gear', 'settings', 'cog'],
    '🪤': ['mouse trap', 'trap', 'catch'],
    '🧱': ['brick', 'wall', 'build'],
    '⛓️': ['chain', 'link', 'connect'],
    '🧲': ['magnet', 'attract', 'magnetic'],
    '🔫': ['water pistol', 'water', 'toy'],
    '💣': ['bomb', 'explode', 'boom'],
    '🧨': ['firecracker', 'explode', 'fireworks'],
    '🪓': ['axe', 'chop', 'tool'],
    '🔪': ['kitchen knife', 'cut', 'knife'],
    '🗡️': ['dagger', 'knife', 'sword'],
    '⚔️': ['crossed swords', 'fight', 'battle'],
    '🛡️': ['shield', 'defend', 'protect'],
    '🚬': ['cigarette', 'smoke', 'tobacco'],
    '⚰️': ['coffin', 'dead', 'death'],
    '🪦': ['headstone', 'grave', 'death'],
    '⚱️': ['funeral urn', 'ashes', 'death'],
    '🏺': ['amphora', 'vase', 'greek'],
    '🔮': ['crystal ball', 'fortune', 'magic'],
    '📿': ['prayer beads', 'prayer', 'beads'],
    '🧿': ['nazar amulet', 'evil eye', 'protect'],
    '💈': ['barber pole', 'barber', 'salon'],
    '⚗️': ['alembic', 'chemistry', 'science'],
    '🔭': ['telescope', 'space', 'stars'],
    '🔬': ['microscope', 'science', 'zoom'],
    '🕳️': ['hole', 'pit', 'black hole'],
    '🩹': ['adhesive bandage', 'bandage', 'hurt'],
    '🩺': ['stethoscope', 'doctor', 'medical'],
    '💊': ['pill', 'medicine', 'drug'],
    '💉': ['syringe', 'vaccine', 'injection'],
    '🩸': ['drop of blood', 'blood', 'donate'],
    '🧬': ['dna', 'genetics', 'helix'],
    '🦠': ['microbe', 'virus', 'germ'],
    '🧫': ['petri dish', 'biology', 'science'],
    '🧪': ['test tube', 'science', 'chemistry'],
    '🌡️': ['thermometer', 'temperature', 'fever'],
    '🧹': ['broom', 'sweep', 'clean'],
    '🪠': ['plunger', 'toilet', 'unclog'],
    '🧺': ['basket', 'laundry', 'harvest'],
    '🧻': ['roll of paper', 'toilet paper'],
    '🚽': ['toilet', 'bathroom'],
    '🚰': ['potable water', 'water', 'drink'],
    '🚿': ['shower', 'bathroom', 'wash'],
    '🛁': ['bathtub', 'bath', 'soak'],
    '🛀': ['person taking bath', 'bath', 'relax'],
    '🧼': ['soap', 'clean', 'wash'],
    '🪥': ['toothbrush', 'clean', 'teeth'],
    '🪒': ['razor', 'shave', 'clean'],
    '🧽': ['sponge', 'clean', 'wash'],
    '🪣': ['bucket', 'pail', 'carry'],
    '🧴': ['lotion bottle', 'skincare', 'moisturizer'],
    '🛎️': ['bell', 'hotel', 'service'],
    '🔑': ['key', 'unlock', 'open'],
    '🗝️': ['old key', 'vintage', 'unlock'],
    '🚪': ['door', 'entry', 'exit'],
    '🪑': ['chair', 'seat', 'sit'],
    '🛋️': ['couch and lamp', 'sofa', 'living room'],
    '🛏️': ['bed', 'sleep', 'rest'],
    '🛌': ['person in bed', 'sleeping', 'rest'],
    '🧸': ['teddy bear', 'toy', 'plush'],
    '🪆': ['nesting dolls', 'matryoshka', 'russian'],
    '🖼️': ['frame with picture', 'photo', 'art'],
    '🪞': ['mirror', 'reflect', 'vanity'],
    '🪟': ['window', 'glass', 'open'],
    '🛍️': ['shopping bags', 'shopping', 'bags'],
    '🛒': ['shopping cart', 'cart', 'shopping'],
    '🎁': ['wrapped gift', 'gift', 'present'],
    '🎈': ['balloon', 'party', 'birthday'],
    '🎏': ['carp streamer', 'japanese', 'festival'],
    '🎀': ['ribbon', 'bow', 'gift'],
    '🪄': ['magic wand', 'magic', 'spell'],
    '🪅': ['pinata', 'party', 'mexican'],
    '🎊': ['confetti ball', 'party', 'celebrate'],
    '🎉': ['party popper', 'party', 'yay'],
    '🎎': ['dolls', 'japanese', 'festival'],
    '🏮': ['red paper lantern', 'japanese', 'lantern'],
    '🎐': ['wind chime', 'japanese', 'wind'],
    '🧧': ['red envelope', 'money', 'chinese'],
    '✉️': ['envelope', 'email', 'mail'],
    '📩': ['incoming envelope', 'email', 'receive'],
    '📨': ['envelope receiving', 'email', 'receive'],
    '📧': ['e-mail', 'email', 'mail'],
    '💌': ['love letter', 'love', 'mail'],
    '📥': ['inbox tray', 'inbox', 'receive'],
    '📤': ['outbox tray', 'outbox', 'send'],
    '📦': ['package', 'box', 'shipping'],
    '🏷️': ['label', 'tag', 'price'],
    '🪧': ['placard', 'sign', 'protest'],
    '📪': ['mailbox closed', 'mail', 'no mail'],
    '📫': ['mailbox with raised flag', 'mail', 'flag'],
    '📬': ['mailbox with flag down', 'mail', 'flag'],
    '📭': ['mailbox with lowered flag', 'mail', 'flag'],
    '📮': ['postbox', 'mail', 'post'],
    '📯': ['postal horn', 'horn', 'mail'],
    '📜': ['scroll', 'document', 'ancient'],
    '📃': ['page facing up', 'document', 'page'],
    '📄': ['page facing up', 'document', 'file'],
    '📑': ['bookmark tabs', 'tabs', 'bookmark'],
    '🧾': ['receipt', 'receipt', 'receipt'],
    '📊': ['bar chart', 'chart', 'graph'],
    '📈': ['chart increasing', 'graph', 'up'],
    '📉': ['chart decreasing', 'graph', 'down'],
    '🗒️': ['spiral notepad', 'notepad', 'memo'],
    '🗓️': ['spiral calendar', 'calendar', 'date'],
    '📆': ['tear-off calendar', 'calendar', 'date'],
    '📅': ['calendar', 'date', 'schedule'],
    '🗑️': ['wastebasket', 'trash', 'delete'],
    '📇': ['card index', 'index', 'rolodex'],
    '🗃️': ['card file box', 'files', 'box'],
    '🗳️': ['ballot box with ballot', 'vote', 'election'],
    '🗄️': ['file cabinet', 'files', 'storage'],
    '📋': ['clipboard', 'copy', 'paste'],
    '📁': ['file folder', 'folder', 'directory'],
    '📂': ['open file folder', 'folder', 'directory'],
    '🗂️': ['card index dividers', 'index', 'organize'],
    '🗞️': ['rolled-up newspaper', 'news', 'paper'],
    '📰': ['newspaper', 'news', 'press'],
    '📓': ['notebook', 'journal', 'write'],
    '📔': ['notebook with decorative cover', 'journal'],
    '📒': ['ledger', 'notebook', 'record'],
    '📕': ['closed book', 'book', 'read'],
    '📗': ['green book', 'book', 'read'],
    '📘': ['blue book', 'book', 'read'],
    '📙': ['orange book', 'book', 'read'],
    '📚': ['books', 'library', 'read'],
    '📖': ['open book', 'book', 'read'],
    '🔖': ['bookmark', 'mark', 'save'],
    '🧷': ['safety pin', 'pin', 'fastener'],
    '🔗': ['link', 'url', 'connect'],
    '📎': ['paperclip', 'attach', 'clip'],
    '🖇️': ['linked paperclips', 'attach', 'clip'],
    '📐': ['triangular ruler', 'measure', 'draw'],
    '📏': ['straight ruler', 'measure', 'draw'],
    '🧮': ['abacus', 'calculate', 'count'],
    '📌': ['pushpin', 'pin', 'mark'],
    '📍': ['round pushpin', 'pin', 'mark'],
    '✂️': ['scissors', 'cut', 'snip'],
    '🖊️': ['pen', 'write', 'ink'],
    '🖋️': ['fountain pen', 'write', 'fancy'],
    '✒️': ['black nib pen', 'write', 'pen'],
    '🖌️': ['paintbrush', 'draw', 'paint'],
    '🖍️': ['crayon', 'draw', 'color'],
    '📝': ['memo', 'note', 'write'],
    '✏️': ['pencil', 'write', 'edit'],
    '🔍': ['magnifying glass tilted left', 'search', 'find'],
    '🔎': ['magnifying glass tilted right', 'search', 'find'],
    '🔏': ['pen with nib', 'write', 'privacy'],
    '🔐': ['key', 'lock', 'security'],
    '🔒': ['locked', 'lock', 'secure'],
    '🔓': ['unlocked', 'unlock', 'open'],
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
