// Initialize Firestore
const db = firebase.firestore();
let selectedCourse = null;
let userMaxTopic = 0;

// Pagination variables
let currentPage = 1;
const topicsPerPage = 20; // Number of topics per page
let totalTopics = 0;
let topicsData = []; // To store all topics


async function loadTopics(user) {
    try {
        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();

        // Fetch current course from the user's document
        let currentCourse = userDoc.data().currentCourse;

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

        // Fetch scores and maxTopic from user's grammar document for the current course
        const userCourseRef = userDocRef.collection('grammar').doc(currentCourse);
        const userCourseDoc = await userCourseRef.get();
        const userCourseData = userCourseDoc.exists ? userCourseDoc.data() : {};

        const scores = userCourseData.scores || [];
        userMaxTopic = userCourseData.maxTopic || 1; // Default maxTopic to 1 if not present

        // Check if no progress exists, and only allow the first topic to be active
        if (userMaxTopic === 1 && scores.length === 0) {
            console.log("No progress found. Setting maxTopic to 1 and allowing only Topic 1 to be active.");
        }

        // Fetch topics for the selected course
        const grammarRef = db.collection('grammar')
            .where('language', '==', selectedCourse.split('-')[1])
            .where('knownLanguage', '==', selectedCourse.split('-')[0])
            .orderBy('topic', 'asc');

        const topicsSnapshot = await grammarRef.get();
        topicsData = topicsSnapshot.docs.map((doc, index) => {
            const topicData = doc.data();
            const topicNumber = topicData.topic;

            // If no progress exists, only the first topic is unlocked
            const isUnlocked = (userMaxTopic === 1 && scores.length === 0) ? index === 0 : topicNumber <= userMaxTopic;

            topicData.score = scores[topicNumber] || 0; // Use the score from the scores array, default to 0 if not found
            topicData.unlocked = isUnlocked;

            return topicData;
        });

        totalTopics = topicsData.length;

        // Now update the UI with topics for the current page
        updateUIWithTopics();

    } catch (error) {
        console.error("Error loading topics:", error);
    } finally {
        hideLoadingGif();
    }
}


// Calculate maxTopic based on user's progress and update Firestore
async function calculateMaxTopic(userDocRef, currentCourse, topicsSnapshot) {
    let maxTopic = userMaxTopic; // Start with the current maxTopic stored in the user's document
    let updatedTopics = [];
  
    for (const doc of topicsSnapshot.docs) {
      const topicData = doc.data();
      const topicNumber = topicData.topic;
  
      // Fetch total questions for this topic from the "grammar_questions" collection.
      const totalQuestionsSnapshot = await db.collection('grammar_questions')
        .where('topic', '==', topicNumber)
        .get();
  
      const totalQuestions = totalQuestionsSnapshot.size;
  
      // Fetch user's progress for this topic (correct questions).
      const correctQuestionsSnapshot = await userDocRef
        .collection('grammar')
        .doc(currentCourse) // Use .doc to access the course document
        .collection('questions')
        .where('topic', '==', topicNumber)
        .where('timesCorrectInARow', '>', 0)
        .get();
  
      const correctQuestions = correctQuestionsSnapshot.size;
  
      // Calculate the score for the topic.
      const topicScore = totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;
  
      // Update the topicData with the score for UI display.
      topicData.score = topicScore;
  
      // Add the updated topic to the list of updated topics
      updatedTopics.push(topicData);
  
      // Update maxTopic based on the calculated score.
      if (topicScore >= 75) {
        maxTopic = Math.max(maxTopic, topicNumber + 1);
      }
    }
  
    // If the new maxTopic is greater than the stored one, update it in Firestore.
    if (maxTopic > userMaxTopic) {
      userMaxTopic = maxTopic;
      const userCourseRef = userDocRef.collection('grammar').doc(currentCourse);
      await userCourseRef.set({ maxTopic: userMaxTopic }, { merge: true }); // Merge to avoid overwriting other fields
    }
  
    return updatedTopics;
  }

  // Function to update the UI with the topics and their respective scores
  function updateUIWithTopics() {
    const topicsList = document.getElementById('topicsList');
    topicsList.innerHTML = ''; // Clear the current list

    // Calculate start and end indices for the current page
    const startIndex = (currentPage - 1) * topicsPerPage;
    const endIndex = Math.min(startIndex + topicsPerPage, totalTopics);

    // Loop through topics for the current page and create cards
    for (let i = startIndex; i < endIndex; i++) {
        const topicData = topicsData[i];
        const topicCard = createTopicCard(topicData, selectedCourse, topicData.unlocked);
        topicsList.appendChild(topicCard);
    }

    // Show pagination controls and update buttons
    document.querySelectorAll('.paginationControls').forEach(control => {
        control.classList.remove('d-none');
    });
    updatePaginationControls();
}

// Update pagination controls (disable buttons as necessary)
function updatePaginationControls() {
    const prevBtns = document.querySelectorAll('.prevPageBtn');
    const nextBtns = document.querySelectorAll('.nextPageBtn');

    prevBtns.forEach(btn => btn.disabled = currentPage === 1);
    nextBtns.forEach(btn => btn.disabled = currentPage * topicsPerPage >= totalTopics);
}

// Pagination functions
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

// Create a Topic Card Element

function createTopicCard(topicData, course, isUnlocked) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'col-sm-6 col-md-4 mb-4';

    const opacityClass = isUnlocked ? '' : 'disabled-card';
    const action = isUnlocked ? `onclick="showTopicModal('${course}', ${topicData.topic})"` : '';

    const previousTopic = topicData.topic - 1;
    const tooltip = isUnlocked ? '' : `<div class="tooltiptext">To unlock this topic, you need to get 75% knowledge score on topic number ${previousTopic}</div>`;


    const cardHTML = `
      <div class="card h-100 ${opacityClass}" ${action}>
        <div class="card-img-wrapper lockbox position-relative">
          <img src="https://languizy.com/myimages/grammar/${course}-grammar-${topicData.topic}.png/public" class="card-img-top" alt="Topic Image">
          ${!isUnlocked ? '<svg class="svg-inline--fa fa-lock lock-icon position-absolute" style="top: 5%; left: 95%; transform: translate(-50%, -50%);" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="lock" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z"></path></svg>' : ''}
          ${'<span class="topicNum">'}${topicData.topic}${'</span>'}
          ${tooltip}
        </div>
        <div class="card-body">
          <h5 class="card-title">${topicData.name}</h5>
        </div>
        <div class="card-footer">
          <p class="card-text">Knowledge Score: ${topicData.score ? topicData.score.toFixed(1) + '%' : 'Not Started'}</p>
        </div>
      </div>
    `;
    
    cardDiv.innerHTML = cardHTML;
    return cardDiv;
}

  
// Show Modal with Topic Details
async function showTopicModal(course, topic) {
    const topicRef = db.collection('grammar')
      .where('language', '==', course.split('-')[1])
      .where('knownLanguage', '==', course.split('-')[0])
      .where('topic', '==', topic);
  
    const topicSnapshot = await topicRef.get();
    const topicData = topicSnapshot.docs[0].data();
  
    document.getElementById('topicDetailsModalLabel').innerText = topicData.name;
    document.getElementById('syllabus').innerText = topicData.syllabus || 'No syllabus available';
    document.getElementById('topicImage').src = `https://imagedelivery.net/j9E4LWp3y7gI6dhWlQbOtw/grammar/${course}-grammar-${topic}.png/public`;
  
    // Clear previous data
    document.getElementById('explanations').innerHTML = '';
    document.getElementById('examples').innerHTML = '';
    document.getElementById('tips').innerHTML = '';
  
    // Display explanations, examples, and tips (if available)
    const explain = topicData.explain || {};
    
    if (explain.explanations && explain.explanations.length > 0) {
      explain.explanations.forEach((item) => {
        const explanationHTML = `
          <div class="mb-3">
            <h6 class="fw-bold"><i class="fas fa-info-circle me-2"></i>${item.title}</h6>
            <p>${item.content}</p>
          </div>`;
        document.getElementById('explanations').insertAdjacentHTML('beforeend', explanationHTML);
      });
    } else {
      document.getElementById('explanations').innerHTML = '<p>No explanations available.</p>';
    }
  
    if (explain.examples && explain.examples.length > 0) {
      explain.examples.forEach((item) => {
        const exampleHTML = `
          <div class="mb-3">
            <p><i class="fas fa-quote-left me-2"></i><strong>${item.example}</strong></p>
            <p class="text-muted">${item.example_explanation}</p>
          </div>`;
        document.getElementById('examples').insertAdjacentHTML('beforeend', exampleHTML);
      });
    } else {
      document.getElementById('examples').innerHTML = '<p>No examples available.</p>';
    }
  
    if (explain.tips && explain.tips.length > 0) {
      explain.tips.forEach((tip, index) => {
        const tipHTML = `
          <div class="mb-3">
            <p><i class="fas fa-lightbulb me-2"></i><strong>Tip ${index + 1}:</strong> ${tip}</p>
          </div>`;
        document.getElementById('tips').insertAdjacentHTML('beforeend', tipHTML);
      });
    } else {
      document.getElementById('tips').innerHTML = '<p>No tips available.</p>';
    }
  
    document.getElementById('startLessonLink').href = `/grammar.html?topic=${topic}&language=${course.split('-')[1]}&knownLanguage=${course.split('-')[0]}`;
  
    $('#topicDetailsModal').modal('show');
  }
  
async function populateSubLevelBadge(userDoc) {
  const subLevel = userDoc.data().subLevel;
  const subLevelBadge = document.getElementById('subLevelBadge');
  subLevelBadge.textContent = subLevel;  // Set the badge based on userLevel
  if (subLevel === 'Free') {
    subLevelBadge.textContent = 'FREE';
    subLevelBadge.className = 'badge bg-secondary';
    debugger;
    subLevelBadge.onclick = function() {
      window.location.href = '/course_selection.html?upgrade=true';
    };
} else {
    subLevelBadge.textContent = 'PRO';
    subLevelBadge.className = 'badge bg-danger';
    subLevelBadge.onclick = null; // No action on click for PRO
}
}

// Populate course selector
async function populateCourseSelector(user) {
  const userDocRef = db.collection('users').doc(user.uid);
  const userDoc = await userDocRef.get();
  const currentCourse = userDoc.data().currentCourse.toLowerCase();
  const grammarSnapshot = await userDocRef.collection('grammar').get();
  const courseSelector = document.getElementById('courseSelector');
  populateSubLevelBadge(userDoc);
  


  let courseExists = false;

  grammarSnapshot.forEach(doc => {
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = doc.id.toUpperCase();
    if (doc.id.toLowerCase() === currentCourse) {
      option.selected = true;
      courseExists = true;
    }
    courseSelector.appendChild(option);
  });

  // If the current course is missing, add it to the dropdown
  if (!courseExists) {
    const option = document.createElement('option');
    option.value = currentCourse;
    option.textContent = currentCourse.toUpperCase();
    option.selected = true;
    courseSelector.appendChild(option);
  }
}

// Filter topics by course
function filterTopicsByCourse() {
  const selector = document.getElementById('courseSelector');
  selectedCourse = selector.value;
  loadTopics(firebase.auth().currentUser);
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

// Authentication state listener
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    showLoadingGif();
    populateCourseSelector(user);
    loadTopics(user);
    loadUserAvatar(user); // Load user avatar in the navbar
  } else {
    window.location.href = '/';
  }
});
