// Initialize Firebase Firestore
const db = firebase.firestore();
let currentUser = null;
let currentCoach = null;
let knownLanguage = '';
let language = '';

// Array to hold the entire conversation history
let conversationHistory = [];

// Firebase Authentication listener
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserAvatar(user);
        await loadCurrentCoach(user);
        await loadCurrentCourse(user);
        initializeChat(); // Initialize chat with bot's first message
    } else {
        window.location.href = 'login.html';
    }
});

// Load User Avatar
async function loadUserAvatar(user) {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
        const photoURL = userDoc.data().photoURL;
        const displayName = userDoc.data().displayName || '';
        const email = userDoc.data().email || '';
        const userAvatar = document.getElementById('userAvatar');

        if (photoURL) {
            userAvatar.innerHTML = `<img src="${photoURL}" alt="User Avatar" class="img-fluid rounded-circle" width="40" height="40">`;
        } else {
            const fallbackLetter = displayName.charAt(0).toUpperCase() || email.charAt(0).toUpperCase();
            userAvatar.innerHTML = `<div class="avatar-circle">${fallbackLetter}</div>`;
        }
    }
}

// Load Current Coach
async function loadCurrentCoach(user) {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    const coachId = userDoc.data().coach || 'defaultCoachId'; // Fallback to default coach

    const coachDoc = await db.collection('coaches').doc(coachId).get();
    if (coachDoc.exists) {
        currentCoach = coachDoc.data();
    }
}

// Load Current Course
async function loadCurrentCourse(user) {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    const course = userDoc.data().currentCourse;

    if (course) {
        [knownLanguage, language] = course.split('-');
    }
}

// Initialize Chat with Bot's First Message
function initializeChat() {
    conversationHistory = []; // Reset conversation history

    // Show typing indicator
    const typingIndicatorId = showTypingIndicator();

    // Disable input while waiting for initial AI message
    toggleUserInput(false);

    getFirstBotMessage().then(initialMessage => {
        // Remove typing indicator
        removeTypingIndicator(typingIndicatorId);

        addMessage('ai', initialMessage);

        // Re-enable input
        toggleUserInput(true);

        // Focus on input field
        document.getElementById('userInput').focus();
    });
}

// Get the First Bot Message from the Google Cloud Function
async function getFirstBotMessage() {
    try {
        const response = await fetch('https://us-central1-languizy2.cloudfunctions.net/explainSentence-1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a friendly and helpful language tutor. Start the conversation with a friendly greeting and an introductory question.'
                    }
                ],
                knownLanguage,
                language,
                level: 50, // Default level, you can customize this
                uid: currentUser.uid // Pass the user ID
            })
        });

        const data = await response.json();
        const botMessage = data.message;

        // Add the bot's first message to the conversation history
        conversationHistory.push({ role: 'assistant', content: botMessage });

        return botMessage;
    } catch (error) {
        console.error('Error getting the first bot message:', error);
        return 'Hello! I am here to help you practice your language skills. How can I assist you today?';
    }
}

// Send User Message
async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    if (!message) return;

    addMessage('user', message);
    userInput.value = '';

    // Add the user's message to the conversation history
    conversationHistory.push({ role: 'user', content: message });

    // Show typing indicator
    const typingIndicatorId = showTypingIndicator();

    // Disable input while waiting for response
    toggleUserInput(false);

    // Send the updated conversation history to the AI
    const aiResponseData = await chatWithAI(conversationHistory);

    // Remove typing indicator
    removeTypingIndicator(typingIndicatorId);

    // Enable input after response is received
    toggleUserInput(true);

    // Focus on input field
    document.getElementById('userInput').focus();

    if (aiResponseData.type === 'summary') {
        // Switch to summary view
        showSummaryView(aiResponseData.message);
        // Clear conversation history
        conversationHistory = [];
    } else {
        // Add AI response to chat
        addMessage('ai', aiResponseData.message);
        // Add AI's response to the conversation history
        conversationHistory.push({ role: 'assistant', content: aiResponseData.message });
    }
}

// Add Message to Chat
function addMessage(sender, content) {
    const chatArea = document.getElementById('chatArea');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('d-flex', sender === 'user' ? 'justify-content-end' : 'justify-content-start', 'mb-3');

    // Determine the avatar to use
    let avatarHtml = '';
    if (sender === 'user') {
        const userAvatarElement = document.getElementById('userAvatar').querySelector('img');
        if (userAvatarElement) {
            // Use the user's photo if it exists
            avatarHtml = `<img src="${userAvatarElement.src}" class="avatar me-2">`;
        } else {
            // Use the fallback avatar circle if no photo exists
            const fallbackAvatar = document.getElementById('userAvatar').querySelector('.avatar-circle');
            avatarHtml = `<div class="avatar me-2">${fallbackAvatar.outerHTML}</div>`;
        }
    } else {
        // Use the coach's image for AI messages
        avatarHtml = `<img src="assets/images/${currentCoach ? currentCoach.image : 'default.png'}" class="avatar me-2">`;
    }

    // Construct the message HTML
    messageDiv.innerHTML = `
        <div class="chat-message ${sender === 'user' ? 'bg-primary text-white' : 'bg-light'} p-3 rounded">
            ${sender === 'user' ? avatarHtml : ''}
            <div class="msgContent">${content}</div>
            ${sender === 'ai' ? avatarHtml : ''}
        </div>`;
    
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom
}


// Chat with AI
async function chatWithAI(messages) {
    try {
        const response = await fetch('https://us-central1-languizy2.cloudfunctions.net/explainSentence-1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages, // Send the entire conversation history
                knownLanguage,
                language,
                level: 50, // Default level, can be changed
                uid: currentUser.uid // Pass the user ID
            })
        });
        const data = await response.json();

        return data; // Return the entire data object
    } catch (error) {
        console.error('Error communicating with AI:', error);
        return { message: 'Sorry, there was an error. Please try again.', type: 'error' };
    }
}

// Show typing indicator
function showTypingIndicator() {
    const chatArea = document.getElementById('chatArea');
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('d-flex', 'justify-content-start', 'mb-3');
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="chat-message bg-light p-3 rounded">
            <div class="typing-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        </div>`;
    chatArea.appendChild(typingDiv);
    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom
    return typingDiv.id;
}

// Remove typing indicator
function removeTypingIndicator(typingIndicatorId) {
    const typingDiv = document.getElementById(typingIndicatorId);
    if (typingDiv) {
        typingDiv.remove();
    }
}

// Toggle user input enable/disable
function toggleUserInput(enable) {
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    userInput.disabled = !enable;
    sendButton.disabled = !enable;
}

// Allow Enter key to send message
document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

// Logout Function
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error("Logout failed: ", error);
    });
}

// Show Summary View
function showSummaryView(summaryText) {
    // Hide chat area and input area
    document.getElementById('chatArea').style.display = 'none';
    document.getElementById('inputArea').style.display = 'none';

    // Create summary view container
    const container = document.createElement('div');
    container.id = 'summaryView';
    container.classList.add('container', 'my-4');

    // Create summary card
    const card = document.createElement('div');
    card.classList.add('card', 'p-4');

    // Card content
    card.innerHTML = `
        <h2 class="card-title text-center">Conversation Summary</h2>
        <p class="card-text">${summaryText}</p>
        <div class="d-flex justify-content-center mt-4">
            <button class="btn btn-primary me-2" onclick="restartConversation()">Restart Conversation</button>
            <button class="btn btn-secondary" onclick="exitConversation()">Exit</button>
        </div>
    `;

    container.appendChild(card);

    // Append summary view to the main container
    document.body.appendChild(container);
}

// Restart Conversation
function restartConversation() {
    // Remove summary view
    const summaryView = document.getElementById('summaryView');
    if (summaryView) summaryView.remove();

    // Show chat area and input area
    document.getElementById('chatArea').style.display = 'block';
    document.getElementById('inputArea').style.display = 'block';

    // Clear chat area
    document.getElementById('chatArea').innerHTML = '';

    // Initialize chat with bot's first message
    initializeChat();
}

// Exit Conversation
function exitConversation() {
    window.location.href = '/course-selection.html';
}
