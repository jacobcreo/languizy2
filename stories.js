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
    if (selectedCourse) {
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

    // Now fetch the stories that match the user's current course and frequency
    const storiesRef = db.collection('stories')
      .where('language', '==', selectedCourse.split('-')[1])
      .where('knownLanguage', '==', selectedCourse.split('-')[0]);

    const storiesSnapshot = await storiesRef.get();

    const storiesList = document.getElementById('storiesList');
    storiesList.innerHTML = ''; // Clear the current list

    let storiesAvailable = false;
    storiesSnapshot.forEach(doc => {
      const storyData = doc.data();
      if (storyData.wordsRequired <= maxFrequencySeen) {
        storiesAvailable = true;
        console.log(`Story pulled: ${storyData.storyTitle} (Words required: ${storyData.wordsRequired})`);
        const storyCard = createStoryCard(storyData);
        storiesList.appendChild(storyCard);
      } else {
        console.log(`Story skipped: ${storyData.storyTitle} (Words required: ${storyData.wordsRequired})`);
      }
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

// Create a Story Card Element
function createStoryCard(storyData) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'col-md-4 mb-4';

  const cardHTML = `
    <div class="card h-100">
      <img src="assets/images/${storyData.image || 'default_story_image.jpg'}" class="card-img-top" alt="Story Image">
      <div class="card-body">
        <h5 class="card-title">${storyData.storyTitle}</h5>
        <p class="card-text">Words required: ${storyData.wordsRequired}</p>
        <a href="/story.html?storyId=${storyData.id}" class="btn btn-primary">Read Story</a>
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
  } else {
    window.location.href = 'login.html';
  }
});
