// Initialize Firestore
const db = firebase.firestore();
let selectedCourse = null;
let userMaxGroup = {}; // To store user's max group per course
let currentPage = 1;
const topicsPerPage = 20;
let totalTopics = 0;
let topicsData = []; // To store all topics
let accessibleTopics = []; // To store topics accessible to the user

// Authentication state listener
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    loadUserAvatar(user);
    loadChatTopics(user);
  } else {
    window.location.href = 'login.html';
  }
});

// Load User Avatar or Initials into Navbar
function loadUserAvatar(user) {
  const userRef = db.collection('users').doc(user.uid);

  userRef.get().then((doc) => {
    if (doc.exists) {
      const userData = doc.data();
      const photoURL = userData.photoURL;
      const displayName = userData.displayName || '';
      const email = userData.email || '';

      const userAvatar = document.getElementById('userAvatar');

      if (photoURL) {
        userAvatar.innerHTML = `<img src="${photoURL}" alt="User Avatar" class="img-fluid rounded-circle" width="40" height="40">`;
      } else {
        const fallbackLetter = displayName.charAt(0).toUpperCase() || email.charAt(0).toUpperCase();
        userAvatar.innerHTML = `<div class="avatar-circle">${fallbackLetter}</div>`;
      }
      userAvatar.onclick = () => {
        window.location.href = '/settings.html';
      };
    } else {
      console.error('User data does not exist in Firestore');
    }
  }).catch((error) => {
    console.error('Error loading user avatar:', error);
  });
}

// Load Chat Topics
async function loadChatTopics(user) {
  try {
    const userDocRef = db.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();

    // Fetch current course from the user's document
    let currentCourse = userData.currentCourse;
    if (!currentCourse) {
      console.error("No current course found for this user.");
      return;
    }

    selectedCourse = currentCourse;

    // Get user's max group for the course
    const chatInfoDocRef = userDocRef.collection('chat').doc('Info');
    const chatInfoDoc = await chatInfoDocRef.get();
    let chatInfoData = {};
    if (chatInfoDoc.exists) {
      chatInfoData = chatInfoDoc.data();
    }

    if (chatInfoData.current_max_group && chatInfoData.current_max_group[selectedCourse]) {
      userMaxGroup = chatInfoData.current_max_group;
    } else {
      // Initialize user's max group for the course to 1
      userMaxGroup[selectedCourse] = 1;
      // Update in Firestore
      await chatInfoDocRef.set({ current_max_group: userMaxGroup }, { merge: true });
    }

    // Fetch topics from 'chat' collection
    const chatTopicsSnapshot = await db.collection('chat').orderBy('order').get();
    topicsData = chatTopicsSnapshot.docs.map(doc => {
      return { id: doc.id, ...doc.data() };
    });
    totalTopics = topicsData.length;

    // Determine accessible topics based on user's progress
    await determineAccessibleTopics(user);

    // Set current page based on user's latest accessible group
    currentPage = Math.floor((userMaxGroup[selectedCourse] - 1) / (topicsPerPage / 5)) + 1;

    // Update UI with topics for the current page
    updateUIWithTopics();

  } catch (error) {
    console.error("Error loading chat topics:", error);
  }
}

// Determine Accessible Topics
async function determineAccessibleTopics(user) {
  // Fetch user's completed chats for the course
  const userChatsSnapshot = await db.collection('users').doc(user.uid)
    .collection('chat').doc(selectedCourse)
    .collection('completedChats').get();

  const completedChatOrders = userChatsSnapshot.docs.map(doc => doc.data().order);

  // For each topic, determine if it's accessible
  accessibleTopics = topicsData.map(topic => {
    const topicOrder = topic.order;
    const groupNumber = Math.floor(topicOrder / 5) + 1;
    const isAccessible = groupNumber <= userMaxGroup[selectedCourse];

    return {
      ...topic,
      isAccessible: isAccessible,
      isCompleted: completedChatOrders.includes(topicOrder)
    };
  });
}

// Update UI with Topics
function updateUIWithTopics() {
  const topicsList = document.getElementById('topicsList');
  topicsList.innerHTML = ''; // Clear the current list

  // Calculate start and end indices for the current page
  const startIndex = (currentPage - 1) * topicsPerPage;
  const endIndex = Math.min(startIndex + topicsPerPage, totalTopics);

  for (let i = startIndex; i < endIndex; i++) {
    const topic = accessibleTopics[i];
    const topicCard = createTopicCard(topic);
    topicsList.appendChild(topicCard);
  }

  // Update pagination buttons
  updatePaginationControls();
}

// Create a Topic Card Element
function createTopicCard(topic) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'col-md-4 mb-4';

  const opacityClass = topic.isAccessible ? '' : 'disabled-card';
  const lockIcon = topic.isAccessible ? '' : '<i class="fas fa-lock lock-icon"></i>';
  const action = topic.isAccessible ? `onclick="startChat('${topic.id}')" ` : '';

  const cardHTML = `
    <div class="card h-100 ${opacityClass}" ${action}>
      <div class="card-img-wrapper">
        ${lockIcon}
        <img src="https://imagedelivery.net/j9E4LWp3y7gI6dhWlQbOtw/chats/chat-topic-${topic.order}.png/public" class="card-img-top" alt="Topic Image">
      </div>
      <div class="card-body">
        <h5 class="card-title">${topic.topic}</h5>
        <p class="card-text">Topic ${topic.order}</p>
      </div>
    </div>
  `;

  cardDiv.innerHTML = cardHTML;
  return cardDiv;
}

// Start Chat
function startChat(topicId) {
  window.location.href = `/chat.html?tid=${topicId}`;
}

// Update Pagination Controls
function updatePaginationControls() {
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage * topicsPerPage >= totalTopics;
}

// Pagination Functions
function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    updateUIWithTopics();
  }
}

function nextPage() {
  if (currentPage * topicsPerPage < totalTopics) {
    currentPage++;
    updateUIWithTopics();
  }
}

// Logout Function
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = 'login.html';
  }).catch((error) => {
    console.error("Logout failed: ", error);
  });
}
