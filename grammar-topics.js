// Initialize Firestore
const db = firebase.firestore();
let selectedCourse = null;
let userMaxTopic = 0;

// Load topics for the user based on the selected course
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
  
      // Fetch topics for the selected course
      const grammarRef = db.collection('grammar')
        .where('language', '==', selectedCourse.split('-')[1])
        .where('knownLanguage', '==', selectedCourse.split('-')[0])
        .orderBy('topic', 'asc'); // Order by 'topic' in ascending order
  
      const topicsSnapshot = await grammarRef.get();
  
      // Retrieve maxTopic from the user's document
      const userCourseRef = userDocRef.collection('grammar').doc(currentCourse);
      const userCourseDoc = await userCourseRef.get();
      userMaxTopic = userCourseDoc.exists ? userCourseDoc.data().maxTopic : 0;
  
      // Calculate user scores and unlock maxTopic
      const updatedTopics = await calculateMaxTopic(userDocRef, currentCourse, topicsSnapshot);
  
      // Now update the UI with the calculated scores
      updateUIWithTopics(updatedTopics, currentCourse);
    } catch (error) {
      console.error("Error loading topics:", error);
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
function updateUIWithTopics(topics, currentCourse) {
    const topicsList = document.getElementById('topicsList');
    topicsList.innerHTML = ''; // Clear the current list
  
    topics.forEach(topicData => {
      const topicNumber = topicData.topic;
      const topicUnlocked = topicNumber <= userMaxTopic;
  
      // Create a card for each topic and add it to the DOM
      const topicCard = createTopicCard(topicData, currentCourse, topicUnlocked);
      topicsList.appendChild(topicCard);
    });
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
    cardDiv.className = 'col-md-4 mb-4';
  
    const opacityClass = isUnlocked ? '' : 'disabled-card';
    const action = isUnlocked ? `onclick="showTopicModal('${course}', ${topicData.topic})"` : '';
  
    const cardHTML = `
      <div class="card h-100 ${opacityClass}" ${action}>
        <img src="assets/images/grammar/${course}-grammar-${topicData.topic}.png" class="card-img-top" alt="Topic Image">
        <div class="card-body">
          <h5 class="card-title">${topicData.name}</h5>
          <p class="card-text">Topic ${topicData.topic}</p>
          <p class="card-text">Your Knowledge Score: ${topicData.score ? topicData.score.toFixed(1) + '%' : 'Not Started'}</p>
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
  document.getElementById('syllabus').innerText = topicData.syllabus;
  document.getElementById('explanation').innerText = topicData.explanation || '';
  document.getElementById('topicImage').src = `assets/images/grammar/${course}-grammar-${topic}.png`;
  document.getElementById('startLessonLink').href = `/grammar.html?topic=${topic}&language=${course.split('-')[1]}&knownLanguage=${course.split('-')[0]}`;

  
  $('#topicDetailsModal').modal('show');

//   const modal = new bootstrap.Modal(document.getElementById('topicDetailsModal'));
//   modal.show();
}

// Populate course selector
async function populateCourseSelector(user) {
  const userDocRef = db.collection('users').doc(user.uid);
  const grammarSnapshot = await userDocRef.collection('grammar').get();
  const courseSelector = document.getElementById('courseSelector');
  courseSelector.innerHTML = ''; // Clear options

  grammarSnapshot.forEach(doc => {
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = doc.id.toUpperCase();
    if (doc.id === selectedCourse) {
      option.selected = true;
    }
    courseSelector.appendChild(option);
  });
}

// Filter topics by course
function filterTopicsByCourse() {
  const selector = document.getElementById('courseSelector');
  selectedCourse = selector.value;
  loadTopics(firebase.auth().currentUser);
}

// Authentication state listener
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    populateCourseSelector(user);
    loadTopics(user);
    loadUserAvatar(user); // Load user avatar in the navbar
  } else {
    window.location.href = 'login.html';
  }
});
