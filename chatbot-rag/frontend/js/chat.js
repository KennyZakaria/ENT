// Variables globales
let isLoading = false;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chat.js chargé');
    setupChatForm();
    addWelcomeMessage();
});

function setupChatForm() {
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await sendMessage();
        });
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading) {
                    sendMessage();
                }
            }
        });

        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = messageInput.scrollHeight + 'px';
        });
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    if (!messageInput || isLoading) return;

    const message = messageInput.value.trim();
    if (!message) return;

    // Désactiver l'interface
    isLoading = true;
    messageInput.disabled = true;
    if (sendButton) sendButton.disabled = true;

    try {
        // Ajouter le message utilisateur
        addMessage(message, 'user');
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // Ajouter indicateur de chargement
        const loadingId = addLoadingMessage();

        // Envoyer la requête
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        // Supprimer l'indicateur de chargement
        removeLoadingMessage(loadingId);

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('Réponse reçue:', data);

        // Vérifier le format de la réponse
        if (data.status === 'success' && data.response) {
            let responseText = data.response;
            
            // S'assurer que c'est une string
            if (typeof responseText !== 'string') {
                console.error('Type de réponse inattendu:', typeof responseText, responseText);
                responseText = JSON.stringify(responseText);
            }
            
            addMessage(responseText, 'assistant');
        } else {
            console.error('Format de réponse inattendu:', data);
            addMessage('Erreur: format de réponse inattendu', 'assistant');
        }

    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        removeLoadingMessage();
        addMessage('Erreur de connexion. Veuillez réessayer.', 'assistant');
    } finally {
        // Réactiver l'interface
        isLoading = false;
        messageInput.disabled = false;
        if (sendButton) sendButton.disabled = false;
        messageInput.focus();
    }
}

function addMessage(content, role) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`;

    const avatar = role === 'user' ? '👤' : '🤖';
    const bgColor = role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800';
    const name = role === 'user' ? 'Vous' : 'Assistant';

    messageDiv.innerHTML = `
        <div class="flex ${role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-3xl">
            <div class="flex-shrink-0 text-2xl">${avatar}</div>
            <div class="flex-1">
                <div class="text-xs text-gray-500 mb-1">${name}</div>
                <div class="${bgColor} rounded-lg px-4 py-2">
                    <div class="text-sm whitespace-pre-wrap">${content}</div>
                </div>
            </div>
        </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addLoadingMessage() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return null;

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'flex justify-start mb-4';
    loadingDiv.id = 'loading-message';

    loadingDiv.innerHTML = `
        <div class="flex flex-row items-start space-x-2 max-w-3xl">
            <div class="flex-shrink-0 text-2xl">🤖</div>
            <div class="flex-1">
                <div class="text-xs text-gray-500 mb-1">Assistant</div>
                <div class="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
                    <div class="text-sm">
                        <span class="inline-flex space-x-1">
                            <span class="animate-bounce">●</span>
                            <span class="animate-bounce" style="animation-delay: 0.1s">●</span>
                            <span class="animate-bounce" style="animation-delay: 0.2s">●</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;

    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return 'loading-message';
}

function removeLoadingMessage(loadingId = 'loading-message') {
    const loadingMessage = document.getElementById(loadingId);
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

function addWelcomeMessage() {
    addMessage("Bonjour ! Je suis votre assistant IA. Posez-moi vos questions !", 'assistant');
}