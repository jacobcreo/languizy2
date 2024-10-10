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
async function initializeChat() {
    const initialMessage = await getFirstBotMessage();
    addMessage('ai', initialMessage);
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
                level: 50 // Default level, you can customize this
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
    const aiResponse = await chatWithAI(conversationHistory);

    // Remove typing indicator
    removeTypingIndicator(typingIndicatorId);

    // Enable input after response is received
    toggleUserInput(true);

    // Add AI response to chat
    addMessage('ai', aiResponse);
}

// Add Message to Chat
function addMessage(sender, content) {
    const chatArea = document.getElementById('chatArea');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('d-flex', sender === 'user' ? 'justify-content-end' : 'justify-content-start', 'mb-3');
    messageDiv.innerHTML = `
        <div class="chat-message ${sender === 'user' ? 'bg-primary text-white' : 'bg-light'} p-3 rounded">
            ${sender === 'user' ? '<img src="' + currentUser.photoURL + '" class="avatar me-2">' : '<img src="assets/images/' + currentCoach.image + '" class="avatar me-2">'}
            <div>${content}</div>
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
                level: 50 // Default level, can be changed
            })
        });
        const data = await response.json();
        const aiMessage = data.message;

        // Add the AI's response to the conversation history
        conversationHistory.push({ role: 'assistant', content: aiMessage });

        return aiMessage;
    } catch (error) {
        console.error('Error communicating with AI:', error);
        return 'Sorry, there was an error. Please try again.';
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
