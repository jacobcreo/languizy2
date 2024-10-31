// Initialize Firebase services
var auth = firebase.auth();
var db = firebase.firestore();

// Add Firestore settings if needed (optional)
db.settings({ timestampsInSnapshots: true });

// User settings (default values)
var userSettings = {
  firstAppearanceDaysCorrect: 28,
  firstAppearanceDaysIncorrect: 0.0035, // 5 minutes in days
  repeatDaysCorrectMultiplier: 2,
  repeatDaysIncorrect: 0.0035 // 5 minutes in days
};

// Monitor auth state
auth.onAuthStateChanged(user => {
  if (user) {
    console.log('User logged in:', user.email);
    saveUserData(user);

    // Load user settings
    loadUserSettings().then(() => {
      // Load question if on practice page
      if (window.location.pathname.endsWith('practice.html')) {
        loadQuestion();
      }
    });
  } else {
    console.log('User logged out');
    // Redirect to login if not authenticated
    if (!window.location.pathname.endsWith('login.html')) {
      window.location.href = 'login.html';
    }
  }
});

// Google Sign-In
function googleLogin() {
  gtag('event', 'registration_started', {
    'method': 'google_login',
    'source': 'homepage_button'
  });
  
  var provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      console.log('Google Sign-In successful:', result.user);

      // Save user data to Firestore
      saveUserData(result.user);

      
    })
    .catch(error => {
      console.error('Google Sign-In error:', error);
    });
}

// Email Link Authentication
function emailLogin() {
  var email = prompt('Please enter your email:');
  var actionCodeSettings = {
    url: window.location.origin + '/course_selection.html',
    handleCodeInApp: true,
  };
  auth.sendSignInLinkToEmail(email, actionCodeSettings)
    .then(() => {
      window.localStorage.setItem('emailForSignIn', email);
      alert('A sign-in link has been sent to your email.');
    })
    .catch(error => {
      console.error('Email Sign-In error:', error);
    });
}

// Function to save user data to Firestore and update profile image if changed
function saveUserData(user) {
  debugger;
  var userRef = db.collection('users').doc(user.uid);

  // Check if the user's Firestore document exists
  userRef.get().then(doc => {
    if (doc.exists) {
      debugger;
      const userData = doc.data();
      gtag('event', 'signin_completed', {
        'method': 'google_login',
        'user_id': doc.id,
        'tier': doc.subLevel || 'Free'
      }); 
      const storedPhotoURL = userData.photoURL;  // Get the stored photoURL

      // Check if the stored photoURL is different from the Google photoURL
      if (user.photoURL && (!storedPhotoURL || storedPhotoURL !== user.photoURL)) {
        debugger;
        // If photoURL has changed or is missing, update the Firestore document
        userRef.update({
          photoURL: user.photoURL,  // Update the profile image
          lastLogin: firebase.firestore.Timestamp.now()  // Update the last login timestamp
        }).then(() => {
          console.log('Profile image updated in Firestore.');
          window.location.href = 'course_selection.html';
        }).catch(error => {
          console.error('Error updating profile image:', error);
        });
        
      } else {
        // Just update the lastLogin if no photoURL changes
        userRef.update({
          lastLogin: firebase.firestore.Timestamp.now()
        });
        window.location.href = 'course_selection.html';
      }
    } else {
      // If the document doesn't exist (new user), create it with the profile image
      userRef.set({
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,  // Save the profile image for new users
        lastLogin: firebase.firestore.Timestamp.now(),
        subLevel : 'Free'
      }).then(() => {
        console.log('New user data saved successfully with profile image.');
        
        // Fetch the newly created document to ensure the userId exists
        debugger;
        userRef.get().then(newDoc => {
          if (newDoc.exists) {
            gtag('event', 'registration_completed', {
              'method': 'google_login',
              'user_id':  gtag('event', 'registration_completed', {
                'method': 'google_login',
                'user_id': doc.id,
                'tier': 'Free'
            });
            pingOnboardFunction(newDoc.id, user);
          }
          window.location.href = 'course_selection.html';
        }).catch(error => {
          console.error('Error fetching new user document:', error);
        });
      }).catch(error => {
        console.error('Error saving new user data:', error);
      });
    }
  }).catch(error => {
    console.error('Error fetching user data from Firestore:', error);
  });
}

// Function to ping the onboard Google function
function pingOnboardFunction(userId, user) {
  const payload = {
    email: user.email,
    userId: userId,
    eventName: "user_joined",
    firstName: user.displayName,
    eventProperties: {
      activity: "Signed up",
      date: new Date().toISOString()
    }
  };

  fetch('https://us-central1-languizy2.cloudfunctions.net/onboardUser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Successfully pinged onboard function:', data);
  })
  .catch(error => {
    console.error('Error pinging onboard function:', error);
  });
}




// Function to load user settings
function loadUserSettings() {
  return new Promise((resolve, reject) => {
    var user = auth.currentUser;
    db.collection('users').doc(user.uid).collection('settings').doc('appSettings').get()
      .then(doc => {
        if (doc.exists) {
          userSettings = doc.data();
          console.log('User settings loaded:', userSettings);
        } else {
          console.log('No user settings found, using defaults.');
        }
        resolve();
      })
      .catch(error => {
        console.error('Error loading user settings:', error);
        reject(error);
      });
  });
}

// Load a question
function loadQuestion() {
  var user = auth.currentUser;

  // Get user's known and target languages
  db.collection('users').doc(user.uid).get()
    .then(userDoc => {
      var userData = userDoc.data();
      if (!userData || !userData.knownLanguage || !userData.targetLanguage) {
        window.location.href = 'course_selection.html';
        return;
      }

      // Get due questions
      db.collection('users').doc(user.uid).collection('progress')
        .where('nextDue', '<=', new Date())
        .orderBy('nextDue')
        .limit(1)
        .get()
        .then(progressSnapshot => {
          if (!progressSnapshot.empty) {
            // Load the due question
            var progressDoc = progressSnapshot.docs[0];
            var questionId = progressDoc.id;
            loadQuestionData(questionId);
          } else {
            // Load a new question
            loadNewQuestion(userData);
          }
        });
    });
}

// Load question data and display
function loadQuestionData(questionId) {
  db.collection('questions').doc(questionId).get()
    .then(questionDoc => {
      if (questionDoc.exists) {
        displayQuestion(questionDoc.data(), questionId);
      } else {
        console.error('Question not found:', questionId);
      }
    });
}

// Load a new question
function loadNewQuestion(userData) {
  // Fetch a random question that the user hasn't seen yet
  db.collection('questions')
    .where('language', '==', userData.targetLanguage)
    .where('knownLanguage', '==', userData.knownLanguage)
    .get()
    .then(questionSnapshot => {
      var questions = [];
      questionSnapshot.forEach(doc => {
        questions.push({ id: doc.id, data: doc.data() });
      });

      // Filter out questions the user has already seen
      db.collection('users').doc(auth.currentUser.uid).collection('progress').get()
        .then(progressSnapshot => {
          var seenQuestions = progressSnapshot.docs.map(doc => doc.id);
          var unseenQuestions = questions.filter(q => !seenQuestions.includes(q.id));

          if (unseenQuestions.length > 0) {
            // Pick a random unseen question
            var randomQuestion = unseenQuestions[Math.floor(Math.random() * unseenQuestions.length)];
            displayQuestion(randomQuestion.data, randomQuestion.id);
          } else {
            console.log('No new questions available.');
            // Optionally, you can restart or inform the user
          }
        });
    });
}

// Display the question
function displayQuestion(questionData, questionId) {
  $('#sentence').text(questionData.sentence);
  $('#translation').text(questionData.translation);
  $('#missing-word-translation').text(questionData.missingWordTranslation.join(', '));
  $('#answer').val('');
  $('#feedback').text('');
  $('#submit-answer').off('click').on('click', function() {
    var userAnswer = $('#answer').val().trim();
    checkAnswer(userAnswer, questionData, questionId);
  });
}

// Check the user's answer
function checkAnswer(userAnswer, questionData, questionId) {
  var correctAnswer = questionData.missingWord.toLowerCase();
  var isCorrect = userAnswer.toLowerCase() === correctAnswer;

  // Update feedback
  $('#feedback').text(isCorrect ? 'Correct!' : `Incorrect. The correct answer was "${correctAnswer}".`);

  // Update user progress
  updateUserProgress(questionId, isCorrect);
}

// Update user progress in the database
function updateUserProgress(questionId, isCorrect) {
  var user = auth.currentUser;
  var userProgressRef = db.collection('users').doc(user.uid).collection('progress').doc(questionId);

  db.runTransaction(transaction => {
    return transaction.get(userProgressRef).then(doc => {
      var data = doc.exists ? doc.data() : {
        timesCorrect: 0,
        timesIncorrect: 0,
        timesCorrectInARow: 0,
        lastAnswered: null,
        nextDue: null,
        initialAppearance: true
      };

      var now = new Date();

      if (isCorrect) {
        data.timesCorrect += 1;
        data.timesCorrectInARow += 1;
        var daysToAdd;
        if (data.initialAppearance) {
          daysToAdd = userSettings.firstAppearanceDaysCorrect;
        } else {
          daysToAdd = userSettings.repeatDaysCorrectMultiplier * data.timesCorrectInARow;
        }
        data.nextDue = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      } else {
        data.timesIncorrect += 1;
        data.timesCorrectInARow = 0;
        var minutesToAdd = userSettings.firstAppearanceDaysIncorrect * 24 * 60;
        data.nextDue = new Date(now.getTime() + minutesToAdd * 60 * 1000);
      }

      data.lastAnswered = now;
      data.initialAppearance = false;

      transaction.set(userProgressRef, data);

      // Optionally, update overall stats
      var userStatsRef = db.collection('users').doc(user.uid).collection('stats').doc('overall');
      transaction.get(userStatsRef).then(statsDoc => {
        var statsData = statsDoc.exists ? statsDoc.data() : {
          totalQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0
        };
        statsData.totalQuestions += 1;
        if (isCorrect) {
          statsData.correctAnswers += 1;
        } else {
          statsData.incorrectAnswers += 1;
        }
        transaction.set(userStatsRef, statsData);
      });
    });
  }).then(() => {
    // Load the next question after a short delay
    setTimeout(loadQuestion, 2000);
  }).catch(error => {
    console.error('Transaction failed:', error);
  });
}

// Logout function
function logout() {
  auth.signOut().then(() => {
    window.location.href = 'login.html';
  });
}
