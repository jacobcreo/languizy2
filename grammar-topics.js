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
            hideLoadingGif();
            return;
        }

        console.log(`Current course: ${selectedCourse}`);

        // Fetch initial userMaxTopic from user's grammar document for the current course
        const userCourseRef = userDocRef.collection('grammar').doc(currentCourse);
        const userCourseDoc = await userCourseRef.get();
        const userCourseData = userCourseDoc.exists ? userCourseDoc.data() : {};
        // Initialize global userMaxTopic. calculateMaxTopic will use this as a starting point
        // and update it if a higher one is calculated.
        userMaxTopic = userCourseData.maxTopic || 1; 

        // Fetch raw topics for the selected course (e.g., all grammar topics for 'english-spanish')
        const grammarRef = db.collection('grammar')
            .where('language', '==', selectedCourse.split('-')[1])
            .where('knownLanguage', '==', selectedCourse.split('-')[0])
            .orderBy('topic', 'asc');

        const topicsSnapshot = await grammarRef.get();

        // Recalculate maxTopic based on the user's detailed progress for all topics in topicsSnapshot.
        // This function updates the global `userMaxTopic` if a new higher value is found,
        // and saves the new `userMaxTopic` to Firestore.
        // It returns an array of topic data with freshly calculated scores.
        const freshTopicsDataWithScores = await calculateMaxTopic(userDocRef, currentCourse, topicsSnapshot);
        
        // Now, use freshTopicsDataWithScores to build the topicsData array for the UI.
        // The global userMaxTopic is now also guaranteed to be the most up-to-date.
        topicsData = freshTopicsDataWithScores.map(topicData => {
            const topicNumber = topicData.topic;
            // topicData from freshTopicsDataWithScores already contains the 'score' field.
            // Determine 'unlocked' status using the (now potentially updated) global userMaxTopic.
            topicData.unlocked = (topicNumber <= userMaxTopic);
            return topicData;
        });

        totalTopics = topicsData.length;

        // Now update the UI with topics for the current page
        updateUIWithTopics(); // This will use the newly populated and status-updated topicsData

    } catch (error) {
        console.error("Error loading topics:", error);
    } finally {
        hideLoadingGif();
    }
}


// Calculate maxTopic based on user's progress and update Firestore
async function calculateMaxTopic(userDocRef, currentCourse, topicsSnapshot) {
    const maxTopicFromDB = userMaxTopic; // Store the initial value from DB (global userMaxTopic)
    let newlyCalculatedSequentialMaxTopic = 1; 
    let updatedTopics = [];

    const knownLanguage = currentCourse.split('-')[0];
    const language = currentCourse.split('-')[1];

    const correctCountsByTopic = {};
    try {
        const allCorrectUserQuestionsSnapshot = await userDocRef
            .collection('grammar')
            .doc(currentCourse)
            .collection('questions')
            .where('timesCorrectInARow', '>', 0)
            .get();

        allCorrectUserQuestionsSnapshot.forEach(doc => {
            const questionData = doc.data();
            if (questionData.topic) {
                const topicNum = parseInt(questionData.topic);
                correctCountsByTopic[topicNum] = (correctCountsByTopic[topicNum] || 0) + 1;
            }
        });
    } catch (error) {
        console.error("Error fetching all correct user questions for course:", error);
    }
  
    for (const doc of topicsSnapshot.docs) {
      const topicData = doc.data(); 
      const topicNumber = parseInt(topicData.topic);
      
      const correctQuestions = correctCountsByTopic[topicNumber] || 0;
      let topicScore = 0;
      let totalQuestions = 0; // Initialize totalQuestions

      // Determine if we need to query for totalQuestions
      let shouldQueryTotalQuestions = false;
      if (topicNumber === newlyCalculatedSequentialMaxTopic || correctQuestions > 0) {
        shouldQueryTotalQuestions = true;
      }

      if (shouldQueryTotalQuestions) {
        try {
            const totalQuestionsSnapshot = await db.collection('grammar_questions')
              .where('topic', '==', topicNumber)
              .where('language', '==', language) 
              .where('knownLanguage', '==', knownLanguage)
              .get();
            totalQuestions = totalQuestionsSnapshot.size;
            if (totalQuestions > 0) {
                topicScore = (correctQuestions / totalQuestions) * 100;
            } else if (correctQuestions > 0 && totalQuestions === 0) {
                // User has correct answers for a topic with no defined questions in grammar_questions
                // This is an inconsistency; log it. Score remains 0 or could be set to a special marker.
                console.warn(`Data inconsistency: User has ${correctQuestions} correct answers for topic ${topicNumber} which has 0 defined questions in grammar_questions.`);
                topicScore = 0; // Or handle as a partial score if desired, though problematic.
            } else {
                topicScore = 0; // No total questions, no correct questions for this topic.
            }
        } catch (error) {
            console.error(`Error fetching total questions for topic ${topicNumber}:`, error);
            topicScore = 0; // Default score to 0 on error
        }
      } else {
        // No need to query totalQuestions, correctQuestions is 0, so score is 0.
        topicScore = 0;
      }
        
      topicData.score = parseFloat(topicScore.toFixed(1));
      updatedTopics.push(topicData);
  
      // Update sequential max topic advancement
      if (topicNumber === newlyCalculatedSequentialMaxTopic && topicScore >= 75) {
        newlyCalculatedSequentialMaxTopic = topicNumber + 1;
      }
    }
  
    // After loop, compare the true sequential max topic with the one from DB
    if (newlyCalculatedSequentialMaxTopic !== maxTopicFromDB) {
      userMaxTopic = newlyCalculatedSequentialMaxTopic; // Update global for current session UI consistency
      const userCourseGrammarRef = userDocRef.collection('grammar').doc(currentCourse);
      await userCourseGrammarRef.set({ maxTopic: userMaxTopic }, { merge: true }); 
      console.log(`Updated userMaxTopic to ${userMaxTopic} for course ${currentCourse} in Firestore (was ${maxTopicFromDB}).`);
    } else {
      // Ensure global userMaxTopic is aligned if no change was made but it was read from DB
      userMaxTopic = maxTopicFromDB; 
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
