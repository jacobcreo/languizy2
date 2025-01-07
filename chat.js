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

const initialLoadingMessages = { 'en':
    [
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
    ], 'es':
    [
        'Inicializando tu sesión de idioma...',
'Preparando todo para ti...',
'Configurando tu entorno de aprendizaje...',
'Cargando recursos de idioma...',
'Preparando tu panel personalizado...',
'Conectándote a servidores de idioma...',
'Obteniendo las últimas actualizaciones de idioma...',
'Optimizando tu ruta de aprendizaje...',
'Calibrando modelos de idioma...',
'Sincronizando con bases de datos de idioma...',
'Cargando funciones interactivas...',
'Preparando ejercicios de idioma...',
'Recopilando información sobre el idioma...',
'Personalizando tu experiencia de idioma...'
    ]
}

const subsequentLoadingMessages = { 'en':
    [
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
    ], 'es':
    [
        'Pensar en la mejor respuesta...',
'Proponer una gran idea...',
'Analizar su aporte...',
'Formular una respuesta bien pensada...',
'Consultar a los expertos en idiomas...',
'Elaborar una respuesta personalizada...',
'Recopilar información relevante...',
'Sintetizar la mejor respuesta...',
'Explorar soluciones creativas...',
'Revisar los datos más recientes...',
'Buscar las mejores ideas...',
'Preparar una respuesta detallada...'
    ]
}

const lastLoadingMessages = { 'en':
    [
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
    ], 'es':
    [
        'Saliendo con mi mensaje final...',
'Resumiendo nuestra conversación...',
'Reflexionando sobre nuestra charla...',
'Preparándome para decir adiós...',
'Reuniendo mis pensamientos finales...',
'Concluyendo nuestra sesión...',
'Concluyendo nuestra discusión...',
'Finalizando mi respuesta...',
'Despidiéndome de usted...',
'Expresando mi gratitud...',
'Cerrando la sesión con una sonrisa...',
'Dejándole con un pensamiento...',
'Terminando con una nota positiva...',
'Le deseo todo lo mejor...',
'Espero poder charlar de nuevo pronto...'
    ]
}


let UIString = {
    'en': {
        'logout': 'Logout',
        'chatInputPlaceholder': 'Type your message...',
        'chatSendButton': 'Send',
        'showChatSummary': 'Show Chat Summary',
        'conversationSummary': 'Conversation Summary',
        'languageCorrections': 'Language Corrections',
        'restartConversation': 'Restart Conversation',
        'exitConversation': 'Exit',
        'free_user': 'Free',
        'pro_user': 'Pro',
    },
    'es': {
        'logout': 'Cerrar sesión',
        'chatInputPlaceholder': 'Escribe tu mensaje...',
        'chatSendButton': 'Enviar',
        'showChatSummary': 'Mostrar Resumen de la Conversación',
        'conversationSummary': 'Resumen de la Conversación',
        'languageCorrections': 'Correcciones de Idioma',
        'restartConversation': 'Reiniciar Conversación',
        'exitConversation': 'Salir',
        'free_user': 'GRATIS',
        'pro_user': 'PRO',
    }
};

// Variable to track if it's the first loading
let isFirstLoading = true;

let interfaceLanguage = 'en';

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
        modifyInterfaceLanguage();
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
        populateSubLevelBadge(userDoc);
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
                        content: ''
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
        gtag('event', 'User Message', {
            'question_type': 'Chat',
            'user_id': currentUser.uid,
            'course': knownLanguage + '-' + language,
            'chat_topic' : new URLSearchParams(window.location.search).get('t') || '',
        });

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
    summaryButton.textContent = UIString[interfaceLanguage].showChatSummary;

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
    const maxMessages = (subLevel === 'free' || subLevel === 'basic') ? 6 : 20;

    // Determine which loading messages array to use
    const messagesToUse = (loadingMessageCounter >= maxMessages) ? lastLoadingMessages[interfaceLanguage] : (isFirstLoading ? initialLoadingMessages[interfaceLanguage] : subsequentLoadingMessages[interfaceLanguage]);

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
        <h2 class="card-title text-center">${UIString[interfaceLanguage].conversationSummary}</h2>
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
        correctionsTitle.textContent = UIString[interfaceLanguage].languageCorrections;
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
        <button class="btn btn-primary me-2" onclick="restartConversation()">${UIString[interfaceLanguage].restartConversation}</button>
        <button class="btn btn-secondary" onclick="exitConversation()">${UIString[interfaceLanguage].exitConversation}</button>
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

        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Create a date object for the current date
            const now = new Date();
            
            // Format the date according to the user's timezone
            const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: userTimezone };
            const formattedDate = new Intl.DateTimeFormat('en-US', options).format(now);
            
            // Split the formatted date into parts
            const [month, day, year] = formattedDate.split('/');
            
            // Create the date in yyyy-mm-dd format
            var today = `${year}-${month}-${day}`;

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

function modifyInterfaceLanguage() {

    if (UIString[interfaceLanguage]) {
        const lang = UIString[interfaceLanguage];

        // Update all elements with data-i18n attribute (text content)
        $('[data-i18n]').each(function () {
            const key = $(this).data('i18n');
            if (key.includes('.')) {
                // Handle nested keys e.g. 'RecommendationNames.Basics'
                const keys = key.split('.');
                let text = lang;
                keys.forEach(k => {
                    text = text[k] || '';
                });
                $(this).text(text);
            } else {
                // Direct key in the UIString
                if (lang[key] !== undefined) {
                    $(this).text(lang[key]);
                }
            }
        });

        // Update elements with data-i18n-alt (for alt attributes)
        $('[data-i18n-alt]').each(function () {
            const key = $(this).data('i18n-alt');
            if (lang[key] !== undefined) {
                $(this).attr('alt', lang[key]);
            }
        });

        // Update elements with data-i18n-title (for title attributes)
        $('[data-i18n-title]').each(function () {
            const key = $(this).data('i18n-title');
            if (lang[key] !== undefined) {
                $(this).attr('title', lang[key]);
            }
        });

        // Update elements with data-i18n-placeholder (for placeholders)
        $('[data-i18n-placeholder]').each(function () {
            const key = $(this).data('i18n-placeholder');
            if (lang[key] !== undefined) {
                $(this).attr('placeholder', lang[key]);
            }
        });




    }
}

async function populateSubLevelBadge(userDoc) {
    const subLevel = userDoc.data().subLevel;
    const subLevelBadge = document.getElementById('subLevelBadge');
    subLevelBadge.textContent = subLevel;  // Set the badge based on userLevel
    if (subLevel === 'Free') {
      subLevelBadge.textContent = UIString[interfaceLanguage].free_user;
      subLevelBadge.className = 'badge bg-secondary';
      subLevelBadge.onclick = function() {
        window.location.href = '/course_selection.html?upgrade=true';
      };
    } else {
      subLevelBadge.textContent = UIString[interfaceLanguage].pro_user;
      subLevelBadge.className = 'badge bg-danger';
      subLevelBadge.onclick = null; // No action on click for PRO
  }
  }