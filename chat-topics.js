// Initialize Firestore
const db = firebase.firestore();
let selectedCourse = null;
let userMaxGroup = {}; // To store user's max group per course
let currentPage = 1;
const topicsPerPage = 20;
let totalTopics = 0;
let topicsData = []; // To store all topics
let accessibleTopics = []; // To store topics accessible to the user

// Show loading GIF as soon as the page loads
document.addEventListener('DOMContentLoaded', showLoadingGif);

// Authentication state listener
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    loadUserAvatar(user);
    loadChatTopics(user);
  } else {
    window.location.href = '/';
  }
});

async function populateSubLevelBadge(userDoc) {
  const subLevel = userDoc.data().subLevel;
  const subLevelBadge = document.getElementById('subLevelBadge');
  subLevelBadge.textContent = subLevel;  // Set the badge based on userLevel
  if (subLevel === 'Free') {
    subLevelBadge.textContent = 'FREE';
    subLevelBadge.className = 'badge bg-secondary';
    subLevelBadge.onclick = function() {
      window.location.href = '/course_selection.html?upgrade=true';
    };
  } else {
    subLevelBadge.textContent = 'PRO';
    subLevelBadge.className = 'badge bg-danger';
    subLevelBadge.onclick = null; // No action on click for PRO
}
}

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
    populateSubLevelBadge(userDoc);

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

    // Initialize userMaxGroup
    userMaxGroup = chatInfoData.current_max_group || {};

    // Ensure userMaxGroup[selectedCourse] is set
    if (!userMaxGroup[selectedCourse]) {
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
  } finally {
    hideLoadingGif(); // Hide loading GIF
  }
}

// Show loading GIF
function showLoadingGif() {
  const loadingGif = document.createElement('div');
  loadingGif.id = 'loadingGif';
  loadingGif.style.position = 'fixed';
  loadingGif.style.top = '50%';
  loadingGif.style.left = '50%';
  loadingGif.style.transform = 'translate(-50%, -50%)';
  loadingGif.style.zIndex = '1000';
  loadingGif.innerHTML = '<img src="assets/images/loadingDog.gif" alt="Loading...">';
  document.body.appendChild(loadingGif);
}

// Hide loading GIF
function hideLoadingGif() {
  const loadingGif = document.getElementById('loadingGif');
  if (loadingGif) {
    document.body.removeChild(loadingGif);
  }
}

// Determine Accessible Topics and Fetch Completion Timestamps
async function determineAccessibleTopics(user) {
  // Fetch user's completed chats for the course with 'completedAt' timestamp
  const userChatsSnapshot = await db.collection('users').doc(user.uid)
    .collection('chat').doc(selectedCourse)
    .collection('completedChats').get();

  const completedChats = userChatsSnapshot.docs.map(doc => {
    return {
      order: doc.data().order,
      completedAt: doc.data().completedAt.toDate() // Convert Firestore Timestamp to JavaScript Date
    };
  });

  // Create a map for quick lookup of completed chats by order
  const completedChatsMap = {};
  completedChats.forEach(chat => {
    completedChatsMap[chat.order] = chat.completedAt;
  });

  // For each topic, determine if it's accessible and if it's completed
  accessibleTopics = topicsData.map(topic => {
    const topicOrder = topic.order;
    const groupNumber = Math.floor(topicOrder / 5) + 1;
    const isAccessible = groupNumber <= userMaxGroup[selectedCourse];
    const isCompleted = completedChatsMap.hasOwnProperty(topicOrder);
    const completedAt = isCompleted ? completedChatsMap[topicOrder] : null;

    return {
      ...topic,
      isAccessible: isAccessible,
      isCompleted: isCompleted,
      completedAt: completedAt
    };
  });
}

// Utility Function to Calculate Time Since Completion
function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 604800); // weeks
  if (interval >= 1) {
    return interval === 1 ? '1 week ago' : `${interval} weeks ago`;
  }
  interval = Math.floor(seconds / 86400); // days
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  interval = Math.floor(seconds / 3600); // hours
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  interval = Math.floor(seconds / 60); // minutes
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }
  return 'Just now';
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

  // Show pagination controls only after topics are loaded
  const paginationControls = document.querySelectorAll('.paginationControls');
  paginationControls.forEach(control => {
    control.classList.remove('d-none');
    control.classList.add('d-flex');
  });

  // Update pagination buttons
  updatePaginationControls();
}

// Create a Topic Card Element
function createTopicCard(topic) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'col-12 col-md-4 mb-4';

  const opacityClass = topic.isAccessible ? '' : 'disabled-card';
  const lockIcon = topic.isAccessible ? '' : '<i class="fas fa-lock lock-icon"></i>';
  const action = topic.isAccessible ? `onclick="startChat('${topic.id}', '${topic.topic}')" ` : '';

  // Determine the status icon and text
  let statusIcon = '';
  let statusText = '';
  if (topic.isCompleted) {
    // Completed: Show check icon and time since completion
    statusIcon = '<i class="fas fa-check-circle text-success me-2"></i>';
    statusText = timeSince(topic.completedAt);
  } else {
    // Not Completed: Show hourglass icon and 'Not Started'
    statusIcon = '<i class="fas fa-hourglass-half text-secondary me-2"></i>';
    statusText = 'Not Started';
  }

  const cardHTML = `
    <div class="card h-100 ${opacityClass}" ${action}>
      <div class="card-img-wrapper">
        ${lockIcon}
        
        <img src="https://languizy.com/myimages/chats/chat-topic-${topic.order}.png/public" class="card-img-top" alt="Topic Image">
        

      </div>
      <div class="card-body">
        <h5 class="card-title">${topic.topic}</h5>
        <p class="card-status mb-0">${statusIcon}${statusText}</p>
      </div>
    </div>
  `;

  cardDiv.innerHTML = cardHTML;
  return cardDiv;
}

// Start Chat
function startChat(topicId,topicName) {
  window.location.href = `/chat.html?tid=${topicId}&t=${encodeURIComponent(topicName)}`;
}

// Update Pagination Controls
function updatePaginationControls() {
  const prevBtns = document.querySelectorAll('.prevPageBtn');
  const nextBtns = document.querySelectorAll('.nextPageBtn');

  prevBtns.forEach(btn => {
    btn.disabled = currentPage === 1;
  });

  nextBtns.forEach(btn => {
    btn.disabled = currentPage * topicsPerPage >= totalTopics;
  });
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
    window.location.href = '/';
  }).catch((error) => {
    console.error("Logout failed: ", error);
  });
}
