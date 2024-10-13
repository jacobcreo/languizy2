// Initialize Firestore
const db = firebase.firestore();
let selectedCourse = null;
let maxFrequencySeen = 0;

// Load Stories for the user based on the current course
async function loadStories(user) {
  try {
    hidePracticeMoreCard();
    const userDocRef = db.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();

    // Fetch current course from the user's document
    var currentCourse = userDoc.data().currentCourse;

    // If the current course has been switched via the dropdown, override it
    if (selectedCourse && selectedCourse !== 'all') {
      currentCourse = selectedCourse;
    } else {
      selectedCourse = currentCourse;
    }

    if (!currentCourse) {
      console.error("No current course found for this user.");
      return;
    }

    console.log(`Current course: ${selectedCourse}`);

    // Fetch maxFrequency directly from the user's document under all-time stats
    const highestFrequency = await getMaxFrequency(userDocRef, selectedCourse);

    if (!highestFrequency) {
      console.log('No maxFrequency found, prompting the user to practice more.');
      displayPracticeMoreCard();
      return;
    }

    maxFrequencySeen = highestFrequency;
    console.log(`Current maxFrequency: ${maxFrequencySeen}`);

    // Fetch the stories that match the user's current course and frequency
    const storiesRef = db.collection('stories')
      .where('language', '==', selectedCourse.split('-')[1])
      .where('knownLanguage', '==', selectedCourse.split('-')[0]);

    const storiesSnapshot = await storiesRef.get();

    // Fetch user's completed stories for the current course
    const completedStoriesSnapshot = await userDocRef
      .collection('stories')
      .doc(currentCourse)
      .collection(currentCourse)
      .get();

    // Create a Set of completed story IDs for quick lookup
    const completedStoryIds = new Set();
    completedStoriesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.finished) {
        completedStoryIds.add(doc.id);
      }
    });

    const storiesList = document.getElementById('storiesList');
    storiesList.innerHTML = ''; // Clear the current list

    let storiesAvailable = false;
    storiesSnapshot.forEach(doc => {
      const storyData = doc.data();
      const storyId = doc.id; // Retrieve the document ID

      const isAccessible = storyData.wordsRequired <= maxFrequencySeen;
      const isCompleted = completedStoryIds.has(storyId);

      if (isAccessible) {
        storiesAvailable = true;
        console.log(`Story pulled: ${storyData.storyTitle} (Words required: ${storyData.wordsRequired})`);
      } else {
        console.log(`Story skipped (locked): ${storyData.storyTitle} (Words required: ${storyData.wordsRequired})`);
      }

      const storyCard = createStoryCard(storyData, storyId, isAccessible, isCompleted);
      storiesList.appendChild(storyCard);
    });

    if (!storiesAvailable) {
      displayPracticeMoreCard();
    }

  } catch (error) {
    console.error("Error loading stories:", error);
  }
}

// Get maxFrequency from the user's all-time stats
async function getMaxFrequency(userDocRef, courseId) {
  const allTimeStatsRef = userDocRef.collection('courses').doc(courseId).collection('stats').doc('all-time');
  const allTimeStatsDoc = await allTimeStatsRef.get();

  if (allTimeStatsDoc.exists) {
    const allTimeData = allTimeStatsDoc.data();
    // Check if maxFrequency exists and return it; otherwise return 0
    return allTimeData.maxFrequency || 0;
  }

  // If no document or maxFrequency, return 0
  return 0;
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

      // Get the avatar element in the navbar
      const userAvatar = document.getElementById('userAvatar');

      if (photoURL) {
        // If photoURL exists, display the user's profile image
        userAvatar.innerHTML = `<img src="${photoURL}" alt="User Avatar" class="img-fluid rounded-circle" width="40" height="40">`;
      } else {
        // If no photoURL, create a circle with initials
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

// Create a Story Card Element
function createStoryCard(storyData, storyId, isAccessible, isCompleted) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'col-md-4 mb-4';

  // Determine which icon to display
  let statusIcon = '';
  if (isCompleted) {
    statusIcon = '<i class="fas fa-check-circle text-success ms-2" title="Completed"></i>';
  } else if (!isAccessible) {
    statusIcon = '<i class="fas fa-lock text-danger ms-2" title="Locked"></i>';
  }

  // If the story is not accessible, disable the Read Story button
  const readButton = isAccessible 
    ? `<a href="/story.html?storyId=${storyId}" class="btn btn-primary">Read Story</a>`
    : `<button class="btn btn-secondary" disabled>Locked</button>`;

  const cardHTML = `
    <div class="card h-100">
      <img src="assets/images/${storyData.image || 'default_story_image.jpg'}" class="card-img-top" alt="Story Image">
      <div class="card-body">
        <h5 class="card-title">${storyData.storyTitle}${statusIcon}</h5>
        <p class="card-text">Words required: ${storyData.wordsRequired}</p>
        ${readButton}
      </div>
    </div>
  `;

  cardDiv.innerHTML = cardHTML;
  return cardDiv;
}

// Display a card prompting the user to practice more
function displayPracticeMoreCard() {
  document.getElementById('practiceMoreCard').style.display = 'block';
  const practiceMoreMessage = document.getElementById('practiceMoreMessage');
  practiceMoreMessage.innerText = `You need to practice more words! See ${maxFrequencySeen + 1} words to unlock the next story.`;
  document.getElementById('practiceMoreBtn').setAttribute('onclick', `window.location.href='/practice.html?courseId=${selectedCourse}'`);
}

function hidePracticeMoreCard() {
  document.getElementById('practiceMoreCard').style.display = 'none';
}

// Populate course selector
async function populateCourseSelector(user) {
  const userDocRef = db.collection('users').doc(user.uid);
  const coursesSnapshot = await userDocRef.collection('courses').get();
  const courseSelector = document.getElementById('courseSelector');
  courseSelector.innerHTML = ''; // Clear options

  // Add default "All Courses" option
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Courses';
  courseSelector.appendChild(allOption);

  coursesSnapshot.forEach(doc => {
    const courseData = doc.data();
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = `${courseData.knownLanguage.toUpperCase()} to ${courseData.targetLanguage.toUpperCase()}`;
    if (doc.id === selectedCourse) {
      option.selected = true;
    }
    courseSelector.appendChild(option);
  });
}

// Filter stories by course
function filterStoriesByCourse() {
  const selector = document.getElementById('courseSelector');
  selectedCourse = selector.value;
  console.log(`Switching to course: ${selectedCourse}`);
  loadStories(firebase.auth().currentUser); // Ensure the stories are reloaded
}

// Authentication state listener
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    populateCourseSelector(user);
    loadStories(user);
    loadUserAvatar(user);  // Load user avatar in the navbar
  } else {
    window.location.href = 'login.html';
  }
});
