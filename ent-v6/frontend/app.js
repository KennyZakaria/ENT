// // Configuration
// const CONFIG = {
//     keycloakUrl: 'http://localhost:8080',
//     keycloakRealm: 'master',
//     keycloakClientId: 'file-upload-service',
//     chatServiceUrl: 'http://localhost:8004',
//     wsUrl: 'ws://localhost:8004/ws'
// };

// // DOM Elements
// const loginSection = document.getElementById('login-section');
// const chatSection = document.getElementById('chat-section');
// const loginBtn = document.getElementById('login-btn');
// const logoutBtn = document.getElementById('logout-btn');
// const usernameInput = document.getElementById('username');
// const passwordInput = document.getElementById('password');
// const loginError = document.getElementById('login-error');
// const userName = document.getElementById('user-name');

// // Chat Elements
// const roomsList = document.getElementById('rooms-list');
// const contactsList = document.getElementById('contacts-list');
// const messagesContainer = document.getElementById('messages-container');
// const messageInput = document.getElementById('message-input');
// const sendMessageBtn = document.getElementById('send-message-btn');
// const messageInputContainer = document.getElementById('message-input-container');
// const currentChatName = document.getElementById('current-chat-name');
// const chatParticipants = document.getElementById('chat-participants');

// // Modal Elements
// const createRoomBtn = document.getElementById('create-room-btn');
// const createRoomModal = document.getElementById('create-room-modal');
// const newMessageBtn = document.getElementById('new-message-btn');
// const newMessageModal = document.getElementById('new-message-modal');
// const closeModalBtns = document.querySelectorAll('.close-modal');
// const createRoomSubmit = document.getElementById('create-room-submit');
// const sendNewMessage = document.getElementById('send-new-message');
// const roomNameInput = document.getElementById('room-name');
// const isGroupCheckbox = document.getElementById('is-group');
// const participantsContainer = document.getElementById('participants-container');
// const participantsList = document.getElementById('participants-list');
// const recipientSelect = document.getElementById('recipient');
// const newMessageText = document.getElementById('new-message-text');

// // Connection Status
// const connectionStatus = document.getElementById('connection-status');
// const connectionMessage = document.getElementById('connection-message');

// // State
// let authToken = null;
// let currentUser = null;
// let webSocket = null;
// let activeRoomId = null;
// let activeContactId = null;
// let rooms = [];
// let contacts = [];
// let messages = {}; // { roomId/contactId: [messages] }

// // Event Listeners
// document.addEventListener('DOMContentLoaded', () => {
//     // Check if user is already logged in (token in localStorage)
//     const savedToken = localStorage.getItem('authToken');
//     if (savedToken) {
//         authToken = savedToken;
//         validateTokenAndConnect();
//     }

//     // Login button click
//     loginBtn.addEventListener('click', handleLogin);

//     // Logout button click
//     logoutBtn.addEventListener('click', handleLogout);
    
//     // Send message button click
//     sendMessageBtn.addEventListener('click', sendMessage);
    
//     // Message input enter key
//     messageInput.addEventListener('keypress', (e) => {
//         if (e.key === 'Enter') {
//             sendMessage();
//         }
//     });
    
//     // Create room button click
//     createRoomBtn.addEventListener('click', () => {
//         showModal(createRoomModal);
//     });
    
//     // New message button click
//     newMessageBtn.addEventListener('click', () => {
//         populateRecipients();
//         showModal(newMessageModal);
//     });
    
//     // Close modal buttons
//     closeModalBtns.forEach(btn => {
//         btn.addEventListener('click', () => {
//             hideModals();
//         });
//     });
    
//     // Create room submit
//     createRoomSubmit.addEventListener('click', createRoom);
    
//     // Send new message
//     sendNewMessage.addEventListener('click', startNewConversation);
    
//     // Toggle group chat participants
//     isGroupCheckbox.addEventListener('change', () => {
//         participantsContainer.classList.toggle('hidden', !isGroupCheckbox.checked);
//     });
// });

// // Authentication Functions
// async function handleLogin() {
//     const username = usernameInput.value.trim();
//     const password = passwordInput.value.trim();

//     if (!username || !password) {
//         showLoginError('Please enter both username and password');
//         return;
//     }

//     try {
//         // Clear previous errors
//         loginError.textContent = '';
//         loginBtn.disabled = true;
//         loginBtn.textContent = 'Logging in...';

//         // Get token from Keycloak
//         const tokenResponse = await getKeycloakToken(username, password);
        
//         if (tokenResponse.access_token) {
//             // Save token and user info
//             authToken = tokenResponse.access_token;
//             localStorage.setItem('authToken', authToken);
            
//             // Extract user info from token
//             currentUser = parseToken(authToken);
            
//             // Show chat section
//             showChatSection();
            
//             // Connect to WebSocket
//             connectWebSocket();
            
//             // Load rooms and contacts
//             loadRooms();
//         } else {
//             showLoginError('Authentication failed');
//         }
//     } catch (error) {
//         console.error('Login error:', error);
//         showLoginError('Authentication failed: ' + (error.message || 'Unknown error'));
//     } finally {
//         loginBtn.disabled = false;
//         loginBtn.textContent = 'Login';
//     }
// }

// async function getKeycloakToken(username, password) {
//     const keycloak = new Keycloak({
//         url: CONFIG.keycloakUrl,
//         realm: CONFIG.keycloakRealm,
//         clientId: CONFIG.keycloakClientId
//     });
    
//     try {
//          await keycloak.init({ onLoad: 'login-required' });
//          if (keycloak.authenticated) {
//              console.log("Authenticated");
//              return { access_token: keycloak.token };
//          }
//      } catch (error) {
//          console.error("Keycloak init error:", error);
//          throw error;
//      }
// }

// function parseToken(token) {
//     try {
//         // Split the token and get the payload
//         const base64Url = token.split('.')[1];
//         const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//         const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
//             return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//         }).join(''));

//         return JSON.parse(jsonPayload);
//     } catch (error) {
//         console.error('Error parsing token:', error);
//         return null;
//     }
// }

// async function validateTokenAndConnect() {
//     try {
//         // Extract user info from token
//         currentUser = parseToken(authToken);
        
//         if (!currentUser) {
//             handleLogout();
//             return;
//         }
        
//         // Show chat section
//         showChatSection();
        
//         // Connect to WebSocket
//         connectWebSocket();
        
//         // Load rooms and contacts
//         loadRooms();
//     } catch (error) {
//         console.error('Token validation error:', error);
//         handleLogout();
//     }
// }

// function handleLogout() {
//     // Clear token and user info
//     authToken = null;
//     currentUser = null;
//     localStorage.removeItem('authToken');
    
//     // Close WebSocket connection
//     if (webSocket) {
//         webSocket.close();
//         webSocket = null;
//     }
    
//     // Show login section
//     showLoginSection();
// }

// // UI Functions
// function showLoginSection() {
//     loginSection.classList.remove('hidden');
//     chatSection.classList.add('hidden');
    
//     // Clear login form
//     usernameInput.value = '';
//     passwordInput.value = '';
//     loginError.textContent = '';
// }

// function showChatSection() {
//     loginSection.classList.add('hidden');
//     chatSection.classList.remove('hidden');
    
//     // Set user name
//     userName.textContent = currentUser.preferred_username || currentUser.sub;
// }

// function showLoginError(message) {
//     loginError.textContent = message;
// }

// function showModal(modal) {
//     // Hide all modals first
//     hideModals();
    
//     // Show the specified modal
//     modal.classList.remove('hidden');
// }

// function hideModals() {
//     createRoomModal.classList.add('hidden');
//     newMessageModal.classList.add('hidden');
    
//     // Clear modal inputs
//     roomNameInput.value = '';
//     isGroupCheckbox.checked = false;
//     participantsContainer.classList.add('hidden');
//     participantsList.innerHTML = '';
//     recipientSelect.innerHTML = '';
//     newMessageText.value = '';
// }

// function showConnectionStatus(message, isConnected = false) {
//     connectionMessage.textContent = message;
//     connectionStatus.classList.remove('hidden');
//     connectionStatus.classList.add('visible');
    
//     if (isConnected) {
//         connectionStatus.classList.add('connected');
//     } else {
//         connectionStatus.classList.remove('connected');
//     }
    
//     // Hide after 3 seconds
//     setTimeout(() => {
//         connectionStatus.classList.remove('visible');
//     }, 3000);
// }

// // WebSocket Functions
// function connectWebSocket() {
//     if (webSocket) {
//         webSocket.close();
//     }
    
//     const wsUrl = `${CONFIG.wsUrl}/${currentUser.sub}`;
//     webSocket = new WebSocket(wsUrl);
    
//     webSocket.onopen = () => {
//         console.log('WebSocket connection established');
//         showConnectionStatus('Connected to chat server', true);
//     };
    
//     webSocket.onmessage = (event) => {
//         handleWebSocketMessage(event.data);
//     };
    
//     webSocket.onclose = () => {
//         console.log('WebSocket connection closed');
//         showConnectionStatus('Disconnected from chat server');
        
//         // Try to reconnect after 5 seconds
//         setTimeout(() => {
//             if (authToken) {
//                 connectWebSocket();
//             }
//         }, 5000);
//     };
    
//     webSocket.onerror = (error) => {
//         console.error('WebSocket error:', error);
//         showConnectionStatus('Connection error');
//     };
// }

// function handleWebSocketMessage(data) {
//     try {
//         const message = JSON.parse(data);
        
//         switch (message.type) {
//             case 'message':
//                 // Handle new message
//                 receiveMessage(message.data);
//                 break;
                
//             case 'user_joined':
//                 // Handle user joined room
//                 showConnectionStatus(`${message.data.user_id} joined the room`, true);
//                 break;
                
//             case 'user_left':
//                 // Handle user left room
//                 showConnectionStatus(`${message.data.user_id} left the room`);
//                 break;
                
//             case 'error':
//                 // Handle error
//                 showConnectionStatus(`Error: ${message.data.message}`);
//                 break;
                
//             default:
//                 console.log('Unknown message type:', message.type);
//         }
//     } catch (error) {
//         console.error('Error handling WebSocket message:', error);
//     }
// }

// function sendWebSocketMessage(type, data) {
//     if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
//         showConnectionStatus('Not connected to chat server');
//         return false;
//     }
    
//     const message = {
//         type: type,
//         data: data
//     };
    
//     webSocket.send(JSON.stringify(message));
//     return true;
// }

// // Chat Functions
// async function loadRooms() {
//     try {
//         // Show loading state
//         roomsList.innerHTML = '<p>Loading rooms...</p>';
        
//         // Fetch rooms from API
//         const response = await fetch(`${CONFIG.chatServiceUrl}/rooms/`, {
//             headers: {
//                 'Authorization': `Bearer ${authToken}`
//             }
//         });
        
//         if (!response.ok) {
//             throw new Error('Failed to load rooms');
//         }
        
//         const data = await response.json();
//         rooms = data;
        
//         // Render rooms
//         renderRooms();
        
//         // Load contacts (for direct messages)
//         loadContacts();
//     } catch (error) {
//         console.error('Error loading rooms:', error);
//         roomsList.innerHTML = `<p class="error">Error loading rooms: ${error.message}</p>`;
//     }
// }

// async function loadContacts() {
//     // In a real app, you would fetch contacts from an API
//     // For this example, we'll use a dummy list
//     contacts = [
//         { id: 'user1', name: 'User 1' },
//         { id: 'user2', name: 'User 2' },
//         { id: 'user3', name: 'User 3' }
//     ];
    
//     // Filter out current user
//     contacts = contacts.filter(contact => contact.id !== currentUser.sub);
    
//     // Render contacts
//     renderContacts();
// }

// function renderRooms() {
//     if (rooms.length === 0) {
//         roomsList.innerHTML = '<p>No rooms available</p>';
//         return;
//     }
    
//     roomsList.innerHTML = '';
    
//     rooms.forEach(room => {
//         const roomElement = document.createElement('div');
//         roomElement.className = 'room-item';
//         roomElement.dataset.roomId = room.room_id;
//         roomElement.textContent = room.name;
        
//         roomElement.addEventListener('click', () => {
//             selectRoom(room.room_id);
//         });
        
//         roomsList.appendChild(roomElement);
//     });
// }

// function renderContacts() {
//     if (contacts.length === 0) {
//         contactsList.innerHTML = '<p>No contacts available</p>';
//         return;
//     }
    
//     contactsList.innerHTML = '';
    
//     contacts.forEach(contact => {
//         const contactElement = document.createElement('div');
//         contactElement.className = 'contact-item';
//         contactElement.dataset.contactId = contact.id;
//         contactElement.textContent = contact.name;
        
//         contactElement.addEventListener('click', () => {
//             selectContact(contact.id);
//         });
        
//         contactsList.appendChild(contactElement);
//     });
// }

// async function selectRoom(roomId) {
//     // Deactivate previous selection
//     deactivateSelections();
    
//     // Activate selected room
//     const roomElement = document.querySelector(`.room-item[data-room-id="${roomId}"]`);
//     if (roomElement) {
//         roomElement.classList.add('active');
//     }
    
//     // Set active room
//     activeRoomId = roomId;
//     activeContactId = null;
    
//     // Get room details
//     const room = rooms.find(r => r.room_id === roomId);
//     if (room) {
//         currentChatName.textContent = room.name;
//     }
    
//     // Join room via WebSocket
//     sendWebSocketMessage('join_room', { room_id: roomId });
    
//     // Load room messages
//     await loadRoomMessages(roomId);
    
//     // Show message input
//     messageInputContainer.classList.remove('hidden');
// }

// async function selectContact(contactId) {
//     // Deactivate previous selection
//     deactivateSelections();
    
//     // Activate selected contact
//     const contactElement = document.querySelector(`.contact-item[data-contact-id="${contactId}"]`);
//     if (contactElement) {
//         contactElement.classList.add('active');
//     }
    
//     // Set active contact
//     activeContactId = contactId;
//     activeRoomId = null;
    
//     // Get contact details
//     const contact = contacts.find(c => c.id === contactId);
//     if (contact) {
//         currentChatName.textContent = contact.name;
//     }
    
//     // Load direct messages
//     await loadDirectMessages(contactId);
    
//     // Show message input
//     messageInputContainer.classList.remove('hidden');
// }

// function deactivateSelections() {
//     // Remove active class from all rooms and contacts
//     document.querySelectorAll('.room-item.active, .contact-item.active').forEach(element => {
//         element.classList.remove('active');
//     });
// }

// async function loadRoomMessages(roomId) {
//     try {
//         // Show loading state
//         messagesContainer.innerHTML = '<p>Loading messages...</p>';
        
//         // Check if we already have messages for this room
//         if (!messages[roomId]) {
//             // Fetch messages from API (in a real app)
//             // For this example, we'll use empty array
//             messages[roomId] = [];
//         }
        
//         // Render messages
//         renderMessages(messages[roomId]);
//     } catch (error) {
//         console.error('Error loading room messages:', error);
//         messagesContainer.innerHTML = `<p class="error">Error loading messages: ${error.message}</p>`;
//     }
// }

// async function loadDirectMessages(contactId) {
//     try {
//         // Show loading state
//         messagesContainer.innerHTML = '<p>Loading messages...</p>';
        
//         // Check if we already have messages for this contact
//         if (!messages[contactId]) {
//             // Fetch messages from API
//             const response = await fetch(`${CONFIG.chatServiceUrl}/messages/${contactId}`, {
//                 headers: {
//                     'Authorization': `Bearer ${authToken}`
//                 }
//             });
            
//             if (!response.ok) {
//                 throw new Error('Failed to load messages');
//             }
            
//             const data = await response.json();
//             messages[contactId] = data;
//         }
        
//         // Render messages
//         renderMessages(messages[contactId]);
//     } catch (error) {
//         console.error('Error loading direct messages:', error);
//         messagesContainer.innerHTML = `<p class="error">Error loading messages: ${error.message}</p>`;
//     }
// }

// function renderMessages(messagesList) {
//     if (!messagesList || messagesList.length === 0) {
//         messagesContainer.innerHTML = '<p class="no-messages">No messages yet</p>';
//         return;
//     }
    
//     messagesContainer.innerHTML = '';
    
//     messagesList.forEach(message => {
//         const messageElement = document.createElement('div');
//         messageElement.className = `message ${message.sender_id === currentUser.sub ? 'message-sent' : 'message-received'}`;
        
//         const contentElement = document.createElement('div');
//         contentElement.className = 'message-content';
//         contentElement.textContent = message.content;
        
//         const timestampElement = document.createElement('div');
//         timestampElement.className = 'message-timestamp';
//         timestampElement.textContent = new Date(message.timestamp).toLocaleString();
        
//         messageElement.appendChild(contentElement);
//         messageElement.appendChild(timestampElement);
        
//         messagesContainer.appendChild(messageElement);
//     });
    
//     // Scroll to bottom
//     messagesContainer.scrollTop = messagesContainer.scrollHeight;
// }

// function sendMessage() {
//     const content = messageInput.value.trim();
    
//     if (!content) {
//         return;
//     }
    
//     if (activeRoomId) {
//         // Send room message
//         sendRoomMessage(activeRoomId, content);
//     } else if (activeContactId) {
//         // Send direct message
//         sendDirectMessage(activeContactId, content);
//     }
    
//     // Clear input
//     messageInput.value = '';
// }

// function sendRoomMessage(roomId, content) {
//     // Create message object
//     const message = {
//         id: generateId(),
//         sender_id: currentUser.sub,
//         recipient_id: roomId,
//         content: content,
//         timestamp: new Date().toISOString(),
//         read: false
//     };
    
//     // Send via WebSocket
//     sendWebSocketMessage('message', {
//         recipient_id: roomId,
//         content: content
//     });
    
//     // Add to local messages
//     if (!messages[roomId]) {
//         messages[roomId] = [];
//     }
    
//     messages[roomId].push(message);
    
//     // Render messages
//     renderMessages(messages[roomId]);
// }

// async function sendDirectMessage(contactId, content) {
//     try {
//         // Create message object
//         const message = {
//             id: generateId(),
//             sender_id: currentUser.sub,
//             recipient_id: contactId,
//             content: content,
//             timestamp: new Date().toISOString(),
//             read: false
//         };
        
//         // Send to API
//         const response = await fetch(`${CONFIG.chatServiceUrl}/messages/`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${authToken}`
//             },
//             body: JSON.stringify({
//                 recipient_id: contactId,
//                 content: content
//             })
//         });
        
//         if (!response.ok) {
//             throw new Error('Failed to send message');
//         }
        
//         // Add to local messages
//         if (!messages[contactId]) {
//             messages[contactId] = [];
//         }
        
//         messages[contactId].push(message);
        
//         // Render messages
//         renderMessages(messages[contactId]);
//     } catch (error) {
//         console.error('Error sending direct message:', error);
//         showConnectionStatus(`Error sending message: ${error.message}`);
//     }
// }

// function receiveMessage(message) {
//     const senderId = message.sender_id;
//     const recipientId = message.recipient_id;
    
//     // Determine where to store the message
//     let storageKey;
    
//     if (recipientId === currentUser.sub) {
//         // Direct message to current user
//         storageKey = senderId;
//     } else {
//         // Room message
//         storageKey = recipientId;
//     }
    
//     // Add to local messages
//     if (!messages[storageKey]) {
//         messages[storageKey] = [];
//     }
    
//     messages[storageKey].push(message);
    
//     // If this is the active conversation, render messages
//     if ((activeRoomId && activeRoomId === storageKey) || 
//         (activeContactId && activeContactId === storageKey)) {
//         renderMessages(messages[storageKey]);
//     } else {
//         // Show notification
//         showConnectionStatus(`New message from ${senderId}`, true);
//     }
// }

// async function createRoom() {
//     const name = roomNameInput.value.trim();
//     const isGroup = isGroupCheckbox.checked;
    
//     if (!name) {
//         showConnectionStatus('Please enter a room name');
//         return;
//     }
    
//     try {
//         // Get selected participants
//         const participants = [];
//         if (isGroup) {
//             document.querySelectorAll('#participants-list input:checked').forEach(input => {
//                 participants.push(input.value);
//             });
//         }
        
//         // Create room via API
//         const response = await fetch(`${CONFIG.chatServiceUrl}/rooms/`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${authToken}`
//             },
//             body: JSON.stringify({
//                 name: name,
//                 is_group: isGroup,
//                 participants: participants
//             })
//         });
        
//         if (!response.ok) {
//             throw new Error('Failed to create room');
//         }
        
//         const data = await response.json();
        
//         // Hide modal
//         hideModals();
        
//         // Reload rooms
//         loadRooms();
        
//         showConnectionStatus('Room created successfully', true);
//     } catch (error) {
//         console.error('Error creating room:', error);
//         showConnectionStatus(`Error creating room: ${error.message}`);
//     }
// }

// function populateRecipients() {
//     recipientSelect.innerHTML = '';
    
//     // Add placeholder option
//     const placeholderOption = document.createElement('option');
//     placeholderOption.value = '';
//     placeholderOption.textContent = 'Select a recipient';
//     placeholderOption.disabled = true;
//     placeholderOption.selected = true;
//     recipientSelect.appendChild(placeholderOption);
    
//     // Add contacts as options
//     contacts.forEach(contact => {
//         const option = document.createElement('option');
//         option.value = contact.id;
//         option.textContent = contact.name;
//         recipientSelect.appendChild(option);
//     });
// }

// function populateParticipants() {
//     participantsList.innerHTML = '';
    
//     // Add contacts as checkboxes
//     contacts.forEach(contact => {
//         const label = document.createElement('label');
//         label.className = 'checkbox-label';
        
//         const checkbox = document.createElement('input');
//         checkbox.type = 'checkbox';
//         checkbox.value = contact.id;
        
//         label.appendChild(checkbox);
//         label.appendChild(document.createTextNode(contact.name));
        
//         participantsList.appendChild(label);
//     });
// }

// async function startNewConversation() {
//     const recipientId = recipientSelect.value;
//     const content = newMessageText.value.trim();
    
//     if (!recipientId) {
//         showConnectionStatus('Please select a recipient');
//         return;
//     }
    
//     if (!content) {
//         showConnectionStatus('Please enter a message');
//         return;
//     }
    
//     try {
//         // Send message via API
//         const response = await fetch(`${CONFIG.chatServiceUrl}/messages/`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${authToken}`
//             },
//             body: JSON.stringify({
//                 recipient_id: recipientId,
//                 content: content
//             })
//         });
        
//         if (!response.ok) {
//             throw new Error('Failed to send message');
//         }
        
//         // Hide modal
//         hideModals();
        
//         // Select the contact
//         selectContact(recipientId);
        
//         showConnectionStatus('Message sent successfully', true);
//     } catch (error) {
//         console.error('Error starting conversation:', error);
//         showConnectionStatus(`Error sending message: ${error.message}`);
//     }
// }

// // Utility Functions
// function generateId() {
//     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//         const r = Math.random() * 16 | 0;
//         const v = c === 'x' ? r : (r & 0x3 | 0x8);
//         return v.toString(16);
//     });
// }
//             }
//           })
//             .then(res => res.json())
//             .then(data => console.log(data));
//         } else {
//           console.warn("Not authenticated");
//         }
//       }).catch(err => console.error("Keycloak init error:", err));
//     // const url = `${CONFIG.keycloakUrl}/realms/${CONFIG.keycloakRealm}/protocol/openid-connect/token`;
    
//     // const formData = new URLSearchParams();
//     // formData.append('client_id', CONFIG.keycloakClientId);
//     // formData.append('username', username);
//     // formData.append('password', password);
//     // formData.append('grant_type', 'password');
    
//     // const response = await fetch(url, {
//     //     method: 'POST',
//     //     headers: {
//     //         'Content-Type': 'application/x-www-form-urlencoded'
//     //     },
//     //     body: formData
//     // });
    
//     // if (!response.ok) {
//     //     const errorData = await response.json().catch(() => ({}));
//     //     throw new Error(errorData.error_description || `HTTP error ${response.status}`);
//     // }
    
//     // return await response.json();
// }

// function parseToken(token) {
//     try {
//         // Parse the JWT token (split by dots and decode the middle part)
//         const base64Url = token.split('.')[1];
//         const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//         const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
//             return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//         }).join(''));

//         return JSON.parse(jsonPayload);
//     } catch (error) {
//         console.error('Error parsing token:', error);
//         return null;
//     }
// }

// function handleLogout() {
//     // Clear auth data
//     authToken = null;
//     currentUser = null;
//     localStorage.removeItem('authToken');
    
//     // Show login section
//     loginSection.classList.remove('hidden');
//     coursesSection.classList.add('hidden');
    
//     // Clear form fields
//     usernameInput.value = '';
//     passwordInput.value = '';
//     loginError.textContent = '';
// }

// async function validateTokenAndLoadCourses() {
//     try {
//         // Parse the token to get user info
//         currentUser = parseToken(authToken);
        
//         if (!currentUser || !currentUser.preferred_username) {
//             throw new Error('Invalid token');
//         }
        
//         // Show courses section
//         showCoursesSection();
        
//         // Load courses
//         loadCourses();
//     } catch (error) {
//         console.error('Token validation error:', error);
//         handleLogout(); // Force logout if token is invalid
//     }
// }

// function showCoursesSection() {
//     // Update UI
//     loginSection.classList.add('hidden');
//     coursesSection.classList.remove('hidden');
    
//     // Set user name
//     userName.textContent = currentUser.preferred_username || 'User';
// }

// // Course Functions
// async function loadCourses() {
//     try {
//         loadingCourses.style.display = 'block';
//         coursesContainer.innerHTML = '';
        
//         const response = await fetch(`${CONFIG.downloadServiceUrl}/courses`, {
//             headers: {
//                 'Authorization': `Bearer ${authToken}`
//             }
//         });
        
//         if (!response.ok) {
//             throw new Error(`HTTP error ${response.status}`);
//         }
        
//         const courses = await response.json();
        
//         if (courses.length === 0) {
//             coursesContainer.innerHTML = '<p>No courses available.</p>';
//         } else {
//             displayCourses(courses);
//         }
//     } catch (error) {
//         console.error('Error loading courses:', error);
//         coursesContainer.innerHTML = `<p class="error-message">Failed to load courses: ${error.message}</p>`;
//     } finally {
//         loadingCourses.style.display = 'none';
//     }
// }

// function displayCourses(courses) {
//     coursesContainer.innerHTML = '';
    
//     courses.forEach(course => {
//         const courseCard = document.createElement('div');
//         courseCard.className = 'course-card';
        
//         courseCard.innerHTML = `
//             <h3 class="course-title">${escapeHtml(course.title)}</h3>
//             <p class="course-description">${escapeHtml(course.description)}</p>
//             <button class="btn download-btn" data-course-id="${escapeHtml(course.id)}">Download</button>
//         `;
        
//         coursesContainer.appendChild(courseCard);
        
//         // Add event listener to download button
//         const downloadBtn = courseCard.querySelector('.download-btn');
//         downloadBtn.addEventListener('click', () => generateDownloadLink(course.id));
//     });
// }

// async function generateDownloadLink(courseId) {
//     try {
//         showDownloadStatus('Generating download link...', false);
        
//         const response = await fetch(`${CONFIG.downloadServiceUrl}/courses/${courseId}/download`, {
//             headers: {
//                 'Authorization': `Bearer ${authToken}`
//             }
//         });
        
//         if (!response.ok) {
//             throw new Error(`HTTP error ${response.status}`);
//         }
        
//         const data = await response.json();
        
//         if (data.download_url) {
//             // Open the download URL in a new tab
//             window.open(data.download_url, '_blank');
//             showDownloadStatus('Download started!', false);
//         } else {
//             throw new Error('No download URL received');
//         }
//     } catch (error) {
//         console.error('Error generating download link:', error);
//         showDownloadStatus(`Failed to generate download link: ${error.message}`, true);
//     }
// }

// // Utility Functions
// function showLoginError(message) {
//     loginError.textContent = message;
// }

// function showDownloadStatus(message, isError) {
//     downloadMessage.textContent = message;
//     downloadStatus.classList.remove('hidden');
    
//     if (isError) {
//         downloadStatus.classList.add('error');
//     } else {
//         downloadStatus.classList.remove('error');
//     }
    
//     // Hide the status after 3 seconds
//     setTimeout(() => {
//         downloadStatus.classList.add('hidden');
//     }, 3000);
// }

// function escapeHtml(unsafe) {
//     return unsafe
//         .replace(/&/g, "&amp;")
//         .replace(/</g, "&lt;")
//         .replace(/>/g, "&gt;")
//         .replace(/"/g, "&quot;")
//         .replace(/'/g, "&#039;");
// }