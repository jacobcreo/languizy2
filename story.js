// Initialize Firestore
const db = firebase.firestore();

// Get the storyId from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const storyId = urlParams.get('storyId');
let currentUser;
let correctAnswersCount = 0; // Track correct answers for scoring
const totalQuestions = 4; // Number of questions in the test

// Load Story
async function loadStory() {
  try {
    const storyDoc = await db.collection('stories').doc(storyId).get();
    if (!storyDoc.exists) {
      console.error("Story not found!");
      return;
    }

    const storyData = storyDoc.data();
    document.getElementById('storyTitle').innerText = storyData.storyTitle;
    document.getElementById('storyImage').src = `/images/${storyData.image || 'storyImage.jpg'}`;
    document.getElementById('storyText').innerHTML = storyData.storyText.replace(/\n/g, '<br>');

    // Set up test your knowledge button
    document.getElementById('testYourKnowledgeBtn').onclick = () => {
      startTest(storyData);
    };

  } catch (error) {
    console.error("Error loading story:", error);
  }
}

// Start Test for the Story
function startTest(storyData) {
  document.getElementById('testYourKnowledgeBtn').style.display = 'none';
  document.getElementById('testSection').style.display = 'block';
  
  // Populate questions
  const questionContainer = document.getElementById('questionContainer');
  questionContainer.innerHTML = ''; // Clear previous questions

  for (let i = 1; i <= totalQuestions; i++) {
    const question = storyData[`test_question${i}`];
    const answers = shuffleArray(storyData[`answers${i}`]); // Randomize answers
    
    const questionHTML = `
      <div class="mb-3">
        <p><strong>${i}. ${question}</strong></p>
        ${answers.map(answer => `
          <div class="form-check">
            <input class="form-check-input" type="radio" name="question${i}" value="${answer}">
            <label class="form-check-label">${answer}</label>
          </div>
        `).join('')}
      </div>
    `;
    
    questionContainer.innerHTML += questionHTML;
  }

  // Set up the test submission button
  document.getElementById('submitTestBtn').onclick = () => {
    submitTest(storyData);
  };
}

// Shuffle answers for randomness
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Submit Test and Evaluate Results
function submitTest(storyData) {
  correctAnswersCount = 0; // Reset correct answers count

  for (let i = 1; i <= totalQuestions; i++) {
    const userAnswer = document.querySelector(`input[name="question${i}"]:checked`);
    if (!userAnswer) {
      alert('Please answer all the questions!');
      return;
    }

    const correctAnswer = storyData[`answers${i}`][0]; // The first answer in the array is always correct
    if (userAnswer.value === correctAnswer) {
      correctAnswersCount++;
    }
  }

  // Show feedback
  showTestFeedback();
}

// Show feedback based on test results
function showTestFeedback() {
  const feedbackSection = document.getElementById('testFeedback');
  const resultsMessage = document.getElementById('testResults');

  if (correctAnswersCount >= 3) {
    resultsMessage.innerHTML = `
      <p><strong>Well done!</strong> You answered ${correctAnswersCount} out of 4 correctly.</p>
      <p>You have completed this story. You've earned 200 points!</p>
    `;
    updateUserProgress(true);
  } else {
    resultsMessage.innerHTML = `
      <p><strong>Almost there!</strong> You answered ${correctAnswersCount} out of 4 correctly.</p>
      <p>You can retry the test or return to the Stories screen.</p>
    `;
    updateUserProgress(false);
  }

  feedbackSection.style.display = 'block';
  document.getElementById('submitTestBtn').style.display = 'none'; // Hide submit button after test is done
}

// Update User's Story Progress in Firestore
async function updateUserProgress(isCompleted) {
  try {
    const userDocRef = db.collection('users').doc(currentUser.uid);
    const storyProgressRef = userDocRef.collection('stories').doc(storyId);

    await storyProgressRef.set({
      lastAnswered: new Date().toISOString(),
      questionsAnsweredCorrect: correctAnswersCount,
      questionsAnsweredWrong: totalQuestions - correctAnswersCount,
      finished: isCompleted
    }, { merge: true });

    if (isCompleted) {
      // Add points to user's total score
      await userDocRef.update({
        totalPoints: firebase.firestore.FieldValue.increment(200)
      });
    }

  } catch (error) {
    console.error("Error updating story progress:", error);
  }
}

// Retry test logic
document.getElementById('retryTestBtn').onclick = function() {
  document.getElementById('testFeedback').style.display = 'none';
  document.getElementById('submitTestBtn').style.display = 'block';
  startTest(); // Start the test again
};

// Authentication listener to get the user
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loadStory(); // Load the story when user is authenticated
  } else {
    window.location.href = 'login.html';
  }
});
