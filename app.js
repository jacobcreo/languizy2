// Initialize Firebase services
var auth = firebase.auth();
var db = firebase.firestore();

// Add Firestore settings if needed (optional)
db.settings({ timestampsInSnapshots: true });

// Capture URL parameters and other relevant data
(async function() {
  const queryParams = new URLSearchParams(window.location.search);
  const { fbp, fbc } = getFBPAndFBC();
  const sourceData = {
    utm_source: queryParams.get('utm_source') || null,
    utm_medium: queryParams.get('utm_medium') || null,
    utm_campaign: queryParams.get('utm_campaign') || null,
    fbclid: queryParams.get('fbclid') || null,
    referrer: document.referrer || null,
    refurl: window.location.href,
    fbp : fbp || null,
    fbc : fbc || null
  };

  if (typeof window.userCountry === 'undefined') {
    var userCountry = 'Unknown';
  } else {
    var userCountry = window.userCountry;
  }

  if (typeof window.idf === 'undefined') {
    var idf = '';
  } else {
    var idf = window.idf;
  }
  

  
  // Fetch country and other data using Cloudflare's CF-IPCountry header
  const country = userCountry || 'Unknown'; // Cloudflare sets CF-IPCountry header
  const nidf = idf || ''; // You can get the IP address by using a service like ipify (or from server logs)
  const userAgent = navigator.userAgent;
  let browser = getBrowserName(userAgent);

  const currentTime = new Date().toISOString();

  // Store this information in localStorage if not already stored
  const userKey = 'log';
  if (!localStorage.getItem(userKey)) {
    const userData = {
      ...sourceData,
      country,
      nidf,
      browser,
      userAgent,
      timestamp: currentTime,
    };

    // Save the user data to localStorage
    localStorage.setItem(userKey, JSON.stringify(userData));

    // Save the user data in Firestore only if not already logged
    await logUserData(userData);
  }
})();

// Function to log user data to Firestore
function logUserData(userData) {
  const userId = auth.currentUser ? auth.currentUser.uid : null; // Get Firebase user ID if available

  if (!userId) {
    console.warn('No authenticated user found, logging data anonymously');
    // Optionally, use an anonymous identifier, such as IP or session ID
    // Here we'll just generate a random ID if no user is logged in

    fetch('https://us-central1-languizy2.cloudfunctions.net/saveUserData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Successfully pinged log function:', data);
    })
    .catch(error => {
      console.error('Error pinging log function:', error);
    });
  }


    
  }


// Helper function to generate a unique identifier (in case there's no logged-in user)
function generateUniqueId() {
  return 'user-' + Math.random().toString(36).substr(2, 9);
}

function getSourceData() {
  const logData = localStorage.getItem('log');
  if (logData) {
    try {
      const parsedData = JSON.parse(logData);
      return parsedData;
    } catch (error) {
      console.error('Error parsing log data from localStorage:', error);
      return null;
    }
  }
  return null;
}

// Function to get a cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Function to extract URL parameters by name
function getURLParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Function to get _fbp and _fbc values
function getFBPAndFBC() {
  // Step 1: Try to get _fbp and _fbc from cookies
  const fbp = getCookie('_fbp') || '';  // Default to '' if not found
  let fbc = getCookie('_fbc') || '';    // Default to '' if not found

  // Step 2: If _fbc is not present, attempt to construct it from gclid
  if (!fbc) {
    const gclid = getURLParameter('gclid');
    if (gclid) {
      fbc = 'fb.' + gclid;  // Construct _fbc from gclid
    }
  }

  // Return the result
  return { fbp, fbc };
}

function getBrowserName(userAgent) {
  
  // Define browser patterns
  const browsers = {
    Chrome: /Chrome/,
    Firefox: /Firefox/,
    Safari: /Safari/,
    Edge: /Edg/,
    IE: /Trident/,
    Opera: /OPR|Opera/,
    Android: /Android/,
    iPhone: /iPhone/
  };

  // Loop through the patterns and return the matching browser name
  for (const [browser, pattern] of Object.entries(browsers)) {
    if (pattern.test(userAgent)) {
      return browser;
    }
  }

  return "Unknown"; // Default if no match.
}

function sendSignInLink(email) {
  // ?fbclid=blabla&utm_campaign=test_bla
  // Capture original URL parameters from localStorage
  const logData = getSourceData(); // Retrieves data from localStorage 'log' key
  const { fbp, fbc, utm_source, utm_medium, utm_campaign, country } = logData || {};
  // Store the email in localStorage under the key 'log'
  const log = JSON.parse(window.localStorage.getItem('log')) || {};
  log.em = email;
  window.localStorage.setItem('log', JSON.stringify(log));

  // Construct the redirect URL with tracking parameters
  const redirectUrl = `${window.location.origin}/?fbclid=${encodeURIComponent(getURLParameter('fbclid')) || ''}&em=${encodeURIComponent(email)}&utm_source=${encodeURIComponent(utm_source)}&utm_medium=${encodeURIComponent(utm_medium)}&utm_campaign=${encodeURIComponent(utm_campaign)}&country=${encodeURIComponent(country)}`;
debugger;
  var actionCodeSettings = {
    url: redirectUrl,
    handleCodeInApp: true,
  };

  auth.sendSignInLinkToEmail(email, actionCodeSettings)
    .then(() => {
      window.localStorage.setItem('emailForSignIn', email);
      gtag('event', 'registration_started', {
        'method': 'email_login',
        'source': 'homepage_button'
      });
      alert('A sign-in link has been sent to your email.');
      // Optionally, close the modal
      $('#loginModal').modal('hide');
    })
    .catch((error) => {
      console.error('Email Sign-In error:', error.code, error.message);
      alert('Error sending sign-in link: ' + error.message);
    });
}


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
      
      // Redirect handled after auth state changes, to avoid multiple save calls
    })
    .catch(error => {
      console.error('Google Sign-In error:', error);
    });
}

if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
  var email = window.localStorage.getItem('emailForSignIn');
  if (!email) {
    // If email is not available (e.g., user opened the link on a different device)
    email = window.prompt('Please provide your email for confirmation');
  }

  firebase.auth().signInWithEmailLink(email, window.location.href)
    .then((result) => {
      // Clear email from storage
      window.localStorage.removeItem('emailForSignIn');
      // Handle the sign-in process
      handleUserLogin(result.user);
    })
    .catch((error) => {
      console.error('Error signing in with email link:', error);
    });
}

// Monitor auth state changes
auth.onAuthStateChanged(user => {
  debugger;
  if (user) {
    console.log('User logged in:', user.email);
    handleUserLogin(user);
  } else {
    console.log('User logged out');
    // Redirect to login if not authenticated
    if (window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
      if (!(lp || window.location.pathname.endsWith('lp.html'))) {
        window.location.href = '/';
      }
    }
  }
});

// Handle user login based on database existence
function handleUserLogin(user) {
  var userRef = db.collection('users').doc(user.uid);

  userRef.get().then(doc => {
    if (doc.exists) {
      // Existing user: Update necessary fields if changed
      const userData = doc.data();
      const updates = { lastLogin: firebase.firestore.Timestamp.now() };
      if (user.photoURL && userData.photoURL !== user.photoURL) updates.photoURL = user.photoURL;

      // Update Firestore with changes, then redirect
      userRef.update(updates).then(() => {
        console.log('Existing user data updated.');
        redirectToCourseSelection('login');
      }).catch(error => {
        console.error('Error updating existing user data:', error);
      });
    } else {
      // New user: Set user data and call onboarding function
      handleUserRegistration(user);
    }
  }).catch(error => {
    console.error('Error fetching user data from Firestore:', error);
  });
}

function handleUserRegistration(user) {
  const userRef = db.collection('users').doc(user.uid);
  const sourceData = getSourceData();

  userRef.set({
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    photoURL: user.photoURL || '',
    lastLogin: firebase.firestore.Timestamp.now(),
    joinDate: firebase.firestore.Timestamp.now(),
    subLevel: 'Free',
    source: sourceData.utm_source || 'unknown',
    medium: sourceData.utm_medium || 'unknown',
    campaign: sourceData.utm_campaign || 'unknown',
    fbclid: sourceData.fbclid || null,
    referrer: sourceData.referrer || null,
    country: sourceData.country || 'Unknown',
    nidf: sourceData.nidf || '',
    browser: sourceData.browser || 'Unknown',
    userAgent: sourceData.userAgent || ''
  }).then(() => {
    console.log('User registration data saved with source info.');
    pingOnboardFunction(user.uid, user);
    redirectToCourseSelection('reg');
  }).catch(error => {
    console.error('Error saving user data:', error);
  });
}

// Redirect to course selection with appropriate parameter
function redirectToCourseSelection(paramType) {
  const randomValue = Math.random().toString(36).substring(2, 15); // Generate a random string
  const param = paramType === 'reg' ? `reg=${randomValue}` : `login=${randomValue}`;
  window.location.href = `course_selection.html?${param}`;
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

function logout() {
  auth.signOut().then(() => {
    window.location.href = '/';
  });
}

function emailLogin() {
  var email = prompt('Please enter your email:');
  if (!email) {
    // User canceled the prompt
    return;
  }

  var actionCodeSettings = {
    // URL you want to redirect back to after email verification.
    // Ensure this URL is whitelisted in the Firebase console.
    url: window.location.origin + '/',
    handleCodeInApp: true,
  };
  firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings)
  .then(() => {
    // Save the email locally so you don't need to ask the user for it again
    window.localStorage.setItem('emailForSignIn', email);
    alert('A sign-in link has been sent to your email.');
  })
  .catch((error) => {
    console.error('Email Sign-In error:', error);
  });
}



/*

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
  */

// Logout function

/*

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
           

            pingOnboardFunction(newDoc.id, user);
          }
          const randomValue = Math.random().toString(36).substring(2, 15); // Generate a random string
          window.location.href = `course_selection.html?reg=${randomValue}`;
          
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

*/

// // User settings (default values)
// var userSettings = {
//   firstAppearanceDaysCorrect: 28,
//   firstAppearanceDaysIncorrect: 0.0035, // 5 minutes in days
//   repeatDaysCorrectMultiplier: 2,
//   repeatDaysIncorrect: 0.0035 // 5 minutes in days
// };

// // Monitor auth state
// auth.onAuthStateChanged(user => {
//   if (user) {
//     console.log('User logged in:', user.email);
//     saveUserData(user);

//     // Load user settings
//     loadUserSettings().then(() => {
//       // Load question if on practice page
//       if (window.location.pathname.endsWith('practice.html')) {
//         loadQuestion();
//       }
//     });
//   } else {
//     console.log('User logged out');
//     // Redirect to login if not authenticated
//     if (!window.location.pathname.endsWith('login.html')) {
//       window.location.href = 'login.html';
//     }
//   }
// });

// Toggle mobile menu
document.getElementById('mobile-menu').addEventListener('click', function() {
  const nav = document.querySelector('.nav');
  nav.classList.toggle('active');
});
