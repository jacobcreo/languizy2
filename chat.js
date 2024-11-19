// Initialize Firebase Firestore
const db = firebase.firestore();
let currentUser = null;
let currentCoach = null;
let knownLanguage = '';
let language = '';
let chatStartTime;
let chatElapsedTime = 0;

// Array to hold the entire conversation history
let conversationHistory = [];

const initialLoadingMessages = [
    'Initializing your language session...',
    'Getting everything ready for you...',
    'Setting up your learning environment...',
    'Loading language resources...',
    'Preparing your personalized dashboard...',
    'Connecting to language servers...',
    'Fetching the latest language updates...',
    'Optimizing your learning path...',
    'Calibrating language models...',
    'Synchronizing with language databases...',
    'Loading interactive features...',
    'Preparing language exercises...',
    'Gathering language insights...',
    'Customizing your language experience...'
];

const subsequentLoadingMessages = [
    'Thinking of the best response...',
    'Coming up with a great idea...',
    'Analyzing your input...',
    'Formulating a thoughtful reply...',
    'Consulting the language experts...',
    'Crafting a personalized response...',
    'Gathering relevant information...',
    'Synthesizing the best answer...',
    'Exploring creative solutions...',
    'Reviewing the latest data...',
    'Checking for the best insights...',
    'Preparing a detailed response...'
];

const lastLoadingMessages = [
    'Coming out with my final message...',
    'Summarizing our conversation...',
    'Reflecting on our chat...',
    'Preparing to say goodbye...',
    'Gathering my final thoughts...',
    'Wrapping up our session...',
    'Concluding our discussion...',
    'Finalizing my response...',
    'Bidding you farewell...',
    'Expressing my gratitude...',
    'Signing off with a smile...',
    'Leaving you with a thought...',
    'Ending on a positive note...',
    'Wishing you all the best...',
    'Hoping to chat again soon...'
];

// Variable to track if it's the first loading
let isFirstLoading = true;

// Variable to store the interval ID for rotating loading messages
let loadingIntervalId = null;

// Counter for loading messages
let loadingMessageCounter = 0;

// Get the topic ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const tid = urlParams.get('tid');
if (!tid) {
    window.location.href = 'chat-topics.html';
}

// Firebase Authentication listener
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        
        await loadUserAvatar(user);
        await loadCurrentCoach(user);
        await loadCurrentCourse(user);
        initializeChat(tid); // Initialize chat with bot's first message
    } else {
        window.location.href = '/';
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
function initializeChat(tid) {
    conversationHistory = []; // Reset conversation history

    // Start the timer when the chat begins
    chatStartTime = Date.now();


    // Show rotating loading indicator with coach image
    const typingIndicatorId = showTypingIndicator();

    // Disable input while waiting for initial AI message
    toggleUserInput(false);

    getFirstBotMessage().then(initialMessage => {
        // Remove typing indicator and stop rotating messages
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
    console.log(tid);
    try {
        const response = await fetch('https://us-central1-languizy2.cloudfunctions.net/explainSentence-1', { // Updated URL
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
                tid: tid,
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

    // Show rotating loading indicator with coach image
    const typingIndicatorId = showTypingIndicator();

    // Disable input while waiting for response
    toggleUserInput(false);

    // Send the updated conversation history to the AI
    const aiResponseData = await chatWithAI(conversationHistory, tid);

    // Remove typing indicator and stop rotating messages
    removeTypingIndicator(typingIndicatorId);

    // Enable input after response is received
    toggleUserInput(true);

    // Focus on input field
    document.getElementById('userInput').focus();

    if (aiResponseData.type === 'summary') {
        // Display the last assistant message
        addMessage('ai', aiResponseData.lastMessage);
        conversationHistory.push({ role: 'assistant', content: aiResponseData.lastMessage });

        // Insert "Show Chat Summary" button
        addShowSummaryButton(aiResponseData.summary, aiResponseData.corrections);

        // Clear conversation history if desired
        // conversationHistory = []; // Uncomment if you want to reset history after summary
    } else {
        // Add AI response to chat
        addMessage('ai', aiResponseData.message);
        // Add AI's response to the conversation history
        conversationHistory.push({ role: 'assistant', content: aiResponseData.message });
    }
}

// Add Show Chat Summary Button
function addShowSummaryButton(summaryText, corrections) {
    const chatArea = document.getElementById('chatArea');

    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('d-flex', 'justify-content-center', 'mb-3');

    const summaryButton = document.createElement('button');
    summaryButton.classList.add('btn', 'btn-secondary');
    summaryButton.textContent = 'Show Chat Summary';

    // Attach event listener to the button
    summaryButton.addEventListener('click', () => {
        showSummaryView(summaryText, corrections);
    });

    buttonDiv.appendChild(summaryButton);
    chatArea.appendChild(buttonDiv);
    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom
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
        avatarHtml = `<img src="assets/images/${currentCoach && currentCoach.image ? currentCoach.image.replace(/1(?=\.\w+$)/, '2') : 'default.png'}" class="avatar me-2">`;
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
async function chatWithAI(messages, tid) {
    try {
        const response = await fetch('https://us-central1-languizy2.cloudfunctions.net/explainSentence-1', { // Updated URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages, // Send the entire conversation history
                knownLanguage,
                language,
                tid: tid,
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

// Show typing indicator with rotating loading messages and coach image
function showTypingIndicator() {
    loadingMessageCounter++;
    const chatArea = document.getElementById('chatArea');
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('d-flex', 'justify-content-start', 'mb-3');
    typingDiv.id = 'typingIndicator';

    // Determine the user's subscription level
    const subLevel = (currentUser && currentUser.subLevel) ? currentUser.subLevel.toLowerCase() : 'free';
    const maxMessages = (subLevel === 'free' || subLevel === 'basic') ? 4 : 10;

    // Determine which loading messages array to use
    const messagesToUse = (loadingMessageCounter >= maxMessages) ? lastLoadingMessages : (isFirstLoading ? initialLoadingMessages : subsequentLoadingMessages);

    typingDiv.innerHTML = `
        <div class="chat-message bg-light p-3 rounded">
            <img src="assets/images/${currentCoach && currentCoach.image ? currentCoach.image.replace(/1(?=\.\w+$)/, '2') : 'default.png'}" class="avatar me-2">
            <div class="msgContent">
                <span id="loadingMessage">${messagesToUse[0]}</span>
                <div class="typing-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
        </div>`;
    chatArea.appendChild(typingDiv);
    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom

    // Initialize message index
    let messageIndex = 0;

    // Reference to the loading message element
    const loadingMessageElement = typingDiv.querySelector('#loadingMessage');

    // Set up interval to rotate messages every 3 seconds
    loadingIntervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % messagesToUse.length;
        if (loadingMessageElement) {
            loadingMessageElement.textContent = messagesToUse[messageIndex];
        }
    }, 3000); // Change message every 3 seconds

    // After the first loading, set isFirstLoading to false
    if (isFirstLoading) {
        isFirstLoading = false;
    }

    return typingDiv.id;
}

// Remove typing indicator and clear the rotating message interval
function removeTypingIndicator(typingIndicatorId) {
    const typingDiv = document.getElementById(typingIndicatorId);
    if (typingDiv) {
        typingDiv.remove();
    }
    // Clear the interval to stop rotating messages
    if (loadingIntervalId) {
        clearInterval(loadingIntervalId);
        loadingIntervalId = null;
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
        window.location.href = '/';
    }).catch((error) => {
        console.error("Logout failed: ", error);
    });
}

// Show Summary View
function showSummaryView(summaryText, corrections) {
     // Stop the timer and calculate elapsed time
     chatElapsedTime = Math.min(Math.floor((Date.now() - chatStartTime) / 1000), 600);

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
    `;
    if (corrections) {
        if (Array.isArray(corrections)) {
            // Corrections are already an array
        } else if (corrections.corrections && Array.isArray(corrections.corrections)) {
            corrections = corrections.corrections;
        } else {
            corrections = [];
        }
    }
    // Display corrections after the summary
    if (corrections && corrections.length > 0) {
        const correctionsSection = document.createElement('div');
        correctionsSection.classList.add('mt-4');

        // Add a title
        const correctionsTitle = document.createElement('h3');
        correctionsTitle.classList.add('card-title', 'text-center', 'mt-4');
        correctionsTitle.textContent = 'Language Corrections';
        correctionsSection.appendChild(correctionsTitle);

        // Create a list to display corrections
        corrections.forEach(correction => {
            const correctionItem = document.createElement('div');
            correctionItem.classList.add('correction-item', 'mb-3');

            // Original sentence
            const originalSentence = document.createElement('p');
            originalSentence.innerHTML = `<strong>Original:</strong> ${correction.originalSentence.replace(/@@@/g, '')}`;
            correctionItem.appendChild(originalSentence);

            // Feedback
            const feedback = document.createElement('p');
            feedback.innerHTML = `<strong>Feedback:</strong> ${correction.feedback}`;
            correctionItem.appendChild(feedback);

            correctionsSection.appendChild(correctionItem);
        });

        card.appendChild(correctionsSection);

        updateChatStats();

    }

    // Add buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('d-flex', 'justify-content-center', 'mt-4');
    buttonContainer.innerHTML = `
        <button class="btn btn-primary me-2" onclick="restartConversation()">Restart Conversation</button>
        <button class="btn btn-secondary" onclick="exitConversation()">Exit</button>
    `;
    card.appendChild(buttonContainer);

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
    initializeChat(tid);
}

async function updateChatStats() {
    try {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const course = knownLanguage + "-" + language;

        // Get today's date in the format YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];

        // Reference to today's stats document
        const todayStatsRef = userDocRef
            .collection('courses').doc(course)
            .collection('stats').doc(today);

        // Reference to all-time stats document
        const allTimeStatsRef = userDocRef
            .collection('courses').doc(course)
            .collection('stats').doc('all-time');

        // Update today's stats
        await todayStatsRef.set({
            chatTimeSpent: firebase.firestore.FieldValue.increment(chatElapsedTime) // Add chat time spent
        }, { merge: true });

        // Update all-time stats
        await allTimeStatsRef.set({
            chatTimeSpent: firebase.firestore.FieldValue.increment(chatElapsedTime) // Add chat time spent
        }, { merge: true });

    } catch (error) {
        console.error("Error updating chat stats:", error);
    }
}

// Exit Conversation
function exitConversation() {
    window.location.href = '/course_selection.html';
}