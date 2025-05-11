// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const chatMessages = document.getElementById('chatMessages');
const logoutBtn = document.getElementById('logoutBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const keyInput = document.getElementById('key');

// Chat room configuration
const ROOMS = {
    'abc123': { name: 'General Chat', users: [] },
    'xyz789': { name: 'Support Chat', users: [] },
    'def456': { name: 'Private Chat', users: [] }
};

// Check if user is already logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const roomKey = localStorage.getItem('roomKey');
    
    if (isLoggedIn && roomKey && ROOMS[roomKey]) {
        showChatScreen();
        updateRoomInfo(roomKey);
    } else {
        showLoginScreen();
    }
}

// Show login screen
function showLoginScreen() {
    loginScreen.style.display = 'flex';
    chatScreen.style.display = 'none';
}

// Show chat screen
function showChatScreen() {
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'block';
    loadMessages();
    scrollToBottom();
}

// Update room information in UI
function updateRoomInfo(roomKey) {
    const roomInfo = document.getElementById('roomInfo');
    if (roomInfo && ROOMS[roomKey]) {
        roomInfo.textContent = ROOMS[roomKey].name;
    }
}

// Handle login form submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const roomKey = keyInput.value.trim();
    
    // Validate room key
    if (!roomKey || !ROOMS[roomKey]) {
        loginError.textContent = 'Invalid room key!';
        loginError.classList.remove('d-none');
        loginForm.classList.add('shake');
        setTimeout(() => {
            loginForm.classList.remove('shake');
        }, 500);
        return;
    }
    
    // Validate credentials
    if (username && password.length >= 5) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('roomKey', roomKey);
        
        // Add user to room
        ROOMS[roomKey].users.push(username);
        
        // Add system message showing user joined
        const joinMessage = {
            sender: 'System',
            text: `${username} has joined the chat`,
            timestamp: new Date().toISOString(),
            system: true
        };
        
        saveMessage(joinMessage);
        showChatScreen();
        updateRoomInfo(roomKey);
    } else {
        loginError.textContent = 'Username and password required (min 5 chars)';
        loginError.classList.remove('d-none');
        loginForm.classList.add('shake');
        setTimeout(() => {
            loginForm.classList.remove('shake');
        }, 500);
    }
});

// Handle logout
logoutBtn.addEventListener('click', function() {
    const username = localStorage.getItem('username');
    const roomKey = localStorage.getItem('roomKey');
    
    if (username && roomKey && ROOMS[roomKey]) {
        // Remove user from room
        const index = ROOMS[roomKey].users.indexOf(username);
        if (index > -1) {
            ROOMS[roomKey].users.splice(index, 1);
        }
        
        // Add system message showing user left
        const leaveMessage = {
            sender: 'System',
            text: `${username} has left the chat`,
            timestamp: new Date().toISOString(),
            system: true
        };
        
        saveMessage(leaveMessage);
    }
    
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('roomKey');
    showLoginScreen();
});

// Handle message form submission
messageForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const messageText = messageInput.value.trim();
    if (messageText) {
        const username = localStorage.getItem('username') || 'Anonymous';
        const roomKey = localStorage.getItem('roomKey');
        
        const message = {
            sender: username,
            text: messageText,
            timestamp: new Date().toISOString(),
            roomKey: roomKey
        };
        
        addMessage(message);
        saveMessage(message);
        messageInput.value = '';
        messageInput.focus();
    }
});

// Clear chat messages
function clearChat() {
    const roomKey = localStorage.getItem('roomKey');
    if (!roomKey) return;
    
    // Get all messages
    let allMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    
    // Filter out messages from current room
    allMessages = allMessages.filter(message => message.roomKey !== roomKey);
    
    // Save filtered messages
    localStorage.setItem('chatMessages', JSON.stringify(allMessages));
    
    // Add system message about clearing chat
    const clearMessage = {
        sender: 'System',
        text: 'Chat has been cleared',
        timestamp: new Date().toISOString(),
        system: true,
        roomKey: roomKey
    };
    
    saveMessage(clearMessage);
    
    // Reload messages
    loadMessages();
}

// Add clear chat button event listener
clearChatBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all chat messages in this room?')) {
        clearChat();
    }
});

// Add message to chat
function addMessage(message) {
    const currentUser = localStorage.getItem('username');
    const currentRoom = localStorage.getItem('roomKey');
    
    // Only show messages for current room
    if (message.roomKey && message.roomKey !== currentRoom) {
        return;
    }
    
    const isMyMessage = message.sender === currentUser;
    const isSystem = message.system === true;
    
    const messageDiv = document.createElement('div');
    
    if (isSystem) {
        messageDiv.classList.add('system-message', 'text-center', 'my-3', 'fade-in');
        messageDiv.innerHTML = `
            <div class="badge bg-secondary py-2 px-3">
                ${message.text}
            </div>
        `;
    } else {
        messageDiv.classList.add('message', isMyMessage ? 'my-message' : 'others-message', 'fade-in');
        
        // Format timestamp for display
        const timestamp = new Date(message.timestamp);
        const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = timestamp.toLocaleDateString();
        
        messageDiv.innerHTML = `
            <div class="message-content">
                ${!isMyMessage ? `<strong>${message.sender}</strong><br>` : ''}
                ${message.text}
            </div>
            <div class="message-info">
                ${timeString} | ${dateString}
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Save message to localStorage
function saveMessage(message) {
    let messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    
    // Add roomKey if not present
    if (!message.roomKey) {
        message.roomKey = localStorage.getItem('roomKey');
    }
    
    messages.push(message);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
}

// Load messages from localStorage
function loadMessages() {
    chatMessages.innerHTML = '';
    const currentRoom = localStorage.getItem('roomKey');
    
    const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    
    // Filter messages by room
    const roomMessages = messages.filter(message => message.roomKey === currentRoom);
    
    roomMessages.forEach(message => {
        addMessage(message);
    });
}

// Scroll to bottom of chat
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// Add toggle password visibility functionality
    document.getElementById('togglePassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
// Initialize app
checkLoginStatus();