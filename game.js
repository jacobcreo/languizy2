// Initialize Firestore
var db = firebase.firestore();
var dailyScore = 0;
var debounceTimeout = null; // Use a debounce timeout instead of a boolean flag
let correctAnswers = 0;
let wrongAnswers = 0;
let streakCorrect = 0;
let streakWrong = 0;
let lastFiveAnswers = [];

// Global variable to track the current mode (multiple-choice or text input)
let isMultipleChoice;

// Global variables to store the current question data
let currentQuestionId;
let currentQuestionData;
let currentCourse;

// Array of random encouragement statements
const encouragementStatements = [
  "You got this! Let's make this fun!",
  "Believe in yourself – you're doing great!",
  "Let's conquer this question together!",
  "You're unstoppable! Keep up the good work!",
  "Every step counts – let's make it count!"
];

const loadingMessages = [
  "Hang tight! We're fetching some cool grammar tips...",
  "Just a moment! Your explanation is on the way...",
  "Patience is key! Almost there with your breakdown...",
  "Great things take time, and so does your explanation...",
  "Did you know? We're crafting the perfect explanation just for you...",
  "A little longer... Good things come to those who wait!",
  "Loading... the suspense is building!",
  "Grabbing the grammar gnomes... they can be tricky to catch!",
  "We're halfway there... keep your linguistic curiosity strong!",
  "Cooking up some tasty grammar for your brain. Yum!",
  "Just a sec... the grammar elves are polishing their explanations.",
  "Almost ready! Good explanations can't be rushed!",
  "Brushing up the words, cleaning up the commas...",
  "Did you know? Explaining things is 70% magic, 30% caffeine.",
  "Your grammar wish is our command... almost granted!",
  "Making sure every word is in its proper place...",
  "Loading... this is a great time to stretch, don't you think?",
  "Our grammar detectives are connecting all the clues!",
  "Fetching some A+ explanations for your learning pleasure...",
  "It's like brewing coffee, but with words. Hold on!",
  "Loading... our language squirrel is gathering all the nuts of knowledge!",
  "Meanwhile, in the Land of Verbs... your answer is being prepared.",
  "Ever wonder how explanations are made? Well, you’re about to find out...",
  "Beep boop... translating grammar magic into human-readable form.",
  "The words are warming up... almost ready to jump onto your screen!",
  "We're making sure every comma and full stop is in tip-top shape...",
  "Spinning up the Grammar Machine... almost done!",
  "Words are like cheese... they get better with a little time.",
  "Practicing some word yoga... stretching those definitions!",
  "Adding some pizzazz to those explanations... sparkle, sparkle!",
  "Taking a grammar selfie... it just needs the right angle.",
  "Pouring a cup of linguistic tea... patience is brewed!",
  "Shhh... the words are concentrating. Silence, please.",
  "Our grammar gremlins are triple-checking everything!",
  "Your explanation is coming... it's fashionably late, but worth it.",
  "Grabbing some words from the adjective jungle... they'll be back soon.",
  "Counting all the verbs... and there are a lot of them!",
  "Just fluffing up the explanations so they look nice and neat.",
  "Filling in the missing word... with style and precision!",
  "All the commas are lining up in a row... very orderly.",
  "Your explanation is being wrapped with a bow. Almost ready to open!",
  "Generating some A-grade grammar jokes... and your explanation too.",
  "Crossing all the t's and dotting all the i's... literally.",
  "Finding just the right words... it's a very picky process.",
  "Patience, grasshopper. Your grammar lesson will be worth the wait!",
  "We’re talking to a noun about your explanation... nouns talk slow.",
  "We're fishing for some top-notch explanations... almost caught one!",
  "Balancing out the sentence structure... it's like word acrobatics!",
  "The missing word is shy... coaxing it out for you.",
  "Putting the final touches on your word masterpiece... voila!",
  "Loading... trust me, your brain is going to love this!"
];


let interimMessageInterval;


var audioElement = new Audio(); // Create a new audio element
const countryToLanguage = {
    cn: { languageCode: "cmn-CN", voice: "Zhiyu" },        // China
    in: { languageCode: "hi-IN", voice: "Aditi" },         // India
    us: { languageCode: "en-US", voice: "Joanna" },        // United States
    br: { languageCode: "pt-BR", voice: "Camila" },        // Brazil
    ru: { languageCode: "ru-RU", voice: "Tatyana" },       // Russia
    jp: { languageCode: "ja-JP", voice: "Mizuki" },        // Japan
    eg: { languageCode: "arb", voice: "Zeina" },           // Egypt (Arabic)
    tr: { languageCode: "tr-TR", voice: "Filiz" },         // Turkey
    de: { languageCode: "de-DE", voice: "Marlene" },       // Germany
    fr: { languageCode: "fr-FR", voice: "Celine" },        // France
    es: { languageCode: "es-ES", voice: "Conchita" },      // Spain
    it: { languageCode: "it-IT", voice: "Carla" },         // Italy
    nl: { languageCode: "nl-NL", voice: "Lotte" },         // Netherlands
    sv: { languageCode: "sv-SE", voice: "Astrid" },        // Sweden
    no: { languageCode: "nb-NO", voice: "Liv" },           // Norway
    dk: { languageCode: "da-DK", voice: "Naja" }           // Denmark
};

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

async function fetchOrAssignCoach(user) {
  const userRef = db.collection('users').doc(user.uid);
  
  try {
    // Get user document to find coach ID
    const userDoc = await userRef.get();
    let coachId = userDoc.exists && userDoc.data().coach;

    // If no coach is assigned, set the default coach ID and update the user document
    if (!coachId) {
      coachId = "ntRoVcqi2KNo6tvljdQ2"; // Default coach ID
      await userRef.update({ coach: coachId });
    }

    // Fetch coach data from Firestore
    const coachData = await fetchCoachData(coachId);

    // Set global variables or store coach data to be used throughout the practice screen
    window.coachData = coachData;
    setCoachImage(coachData.image); // Set the coach image in the UI
  } catch (error) {
    console.error('Error fetching or assigning coach:', error);
  }
}

async function fetchCoachData(coachId) {
  try {
    const coachDoc = await db.collection('coaches').doc(coachId).get();
    if (!coachDoc.exists) throw new Error(`Coach with ID ${coachId} not found.`);

    const coachData = coachDoc.data();

    // Get 10 random entries from each message array
    function getRandomMessages(array, count = 10) {
      return array.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    return {
      coachName: coachData.coachName,
      image: coachData.image,
      correctMessages: getRandomMessages(coachData.correctMessages),
      encouragementMessages: getRandomMessages(coachData.encouragementMessages),
      fiveCorrectMessages: getRandomMessages(coachData.fiveCorrectMessages),
      fiveMistakesMessages: getRandomMessages(coachData.fiveMistakesMessages),
      loadingMessages: getRandomMessages(coachData.loadingMessages),
      mistakeMessages: getRandomMessages(coachData.mistakeMessages),
      sevenCorrectMessages: getRandomMessages(coachData.sevenCorrectMessages),
      sevenMistakesMessages: getRandomMessages(coachData.sevenMistakesMessages),
      threeCorrectMessages: getRandomMessages(coachData.threeCorrectMessages),
      threeMistakesMessages: getRandomMessages(coachData.threeMistakesMessages),
      tonsOfCorrectsInARowMessages: getRandomMessages(coachData.tonsOfCorrectsInARowMessages),
      tonsOfMistakesInARowMessages: getRandomMessages(coachData.tonsOfMistakesInARowMessages),
    };
  } catch (error) {
    console.error('Error fetching coach data:', error);
  }
}

function setCoachImage(imageFilename) {
  const imagePath = `assets/images/${imageFilename}`;
  $('#coachImage').attr('src', imagePath); // Assuming there's an <img id="coach-image"> in your HTML
}




function updateFlagIcons(currentCourse) {
    const flagCard = document.getElementById('flag-card');
    if (!flagCard) return;

    // Clear existing flags
    flagCard.innerHTML = '';

    // Define a mapping of course IDs to flag icons
    const courseToFlags = {
        'en-de': ['assets/icons/en-flag.png', 'assets/icons/de-flag.png'],
        'en-es': ['assets/icons/en-flag.png', 'assets/icons/es-flag.png'],
        'en-fr': ['assets/icons/en-flag.png', 'assets/icons/fr-flag.png'],
        'en-it': ['assets/icons/en-flag.png', 'assets/icons/it-flag.png'],
        'en-ru': ['assets/icons/en-flag.png', 'assets/icons/ru-flag.png'],
        'en-cn': ['assets/icons/en-flag.png', 'assets/icons/cn-flag.png'],        
        'en-pt': ['assets/icons/en-flag.png', 'assets/icons/pt-flag.png'],
        'en-nl': ['assets/icons/en-flag.png', 'assets/icons/nl-flag.png'],
        // Add more courses and their corresponding flags here
    };

    const flags = courseToFlags[currentCourse];
    if (flags) {
        flags.forEach(flagSrc => {
            const img = document.createElement('img');
            img.src = flagSrc;
            img.alt = 'Flag';
            img.width = 32;
            if (flagCard.children.length === 0) {
                img.classList.add('me-2');
            }
            flagCard.appendChild(img);
            
        });
    } else {
        console.warn(`No flags found for course: ${currentCourse}`);
    }
}

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    fetchOrAssignCoach(user).then(() => {
      fetchCurrentCourse(user).then((currentCourse) => {
        loadUserAvatar(user); 
        if (!currentCourse) {
          console.error('No valid current course found.');
          window.location.href = 'course_selection.html';
          return;
        }
        loadDailyScore(user, currentCourse);
        initializeDefaultMode();
        loadQuestion(user, currentCourse);
        updateFlagIcons(currentCourse);
      }).catch((error) => {
        console.error('Error fetching current course:', error);
        window.location.href = 'course_selection.html';
      });
    });
  } else {
    window.location.href = 'login.html';
  }
});


// Function to initialize the default mode based on screen size
function initializeDefaultMode() {
    if (window.innerWidth < 768) { // Mobile devices
        isMultipleChoice = true; // Set to multiple-choice
        $('#toggle-mode').text('Make it harder');
    } else {
        isMultipleChoice = false; // Set to text input
        $('#toggle-mode').text('Make it easier');
    }

    // Add an event listener for the toggle button
    $('#toggle-mode').off('click').on('click', toggleMode);
}

// Function to toggle between modes
function toggleMode() {
    isMultipleChoice = !isMultipleChoice; // Toggle the mode
    $('#toggle-mode').text(isMultipleChoice ? 'Make it harder' : 'Make it easier');
    // Reload the current question with the new mode
    displayQuestion(currentQuestionData, currentQuestionId, currentCourse);
}

// Function to fetch the current course based on URL or Firestore
function fetchCurrentCourse(user) {
  return new Promise((resolve, reject) => {
      const urlParams = new URLSearchParams(window.location.search);
      const courseIdFromUrl = urlParams.get('courseId');

      if (courseIdFromUrl) {
          console.log(`Course ID found in URL: ${courseIdFromUrl}`);

          // Check if the course exists (validate that questions exist for this course)
          validateCourse(courseIdFromUrl).then((isValidCourse) => {
              if (isValidCourse) {
                  // If the course exists, register it under the user's 'courses' sub-collection
                  registerUserCourse(user, courseIdFromUrl).then(() => {
                      // Also update the `currentCourse` field in Firestore for the user
                      updateCurrentCourseInFirestore(user, courseIdFromUrl).then(() => {
                          resolve(courseIdFromUrl); // Now resolve the promise
                      }).catch(reject);
                  }).catch(reject);
              } else {
                  // If the URL course is invalid, fall back to Firestore course
                  console.warn('Invalid course ID in URL, falling back to Firestore currentCourse.');
                  getFirestoreCurrentCourse(user).then(resolve).catch(reject);
              }
          }).catch(reject);
      } else {
          // No course in URL, fallback to Firestore
          getFirestoreCurrentCourse(user).then(resolve).catch(reject);
      }
  });
}

// Function to update Firestore with the new course selection
function updateCurrentCourseInFirestore(user, newCourseId) {
  return db.collection('users').doc(user.uid).update({
      currentCourse: newCourseId
  }).then(() => {
      console.log(`Updated currentCourse in Firestore to: ${newCourseId}`);
  }).catch((error) => {
      console.error('Error updating current course in Firestore:', error);
  });
}

// Function to register the course in the user's 'courses' sub-collection
function registerUserCourse(user, courseId) {
  const knownLanguage = courseId.split('-')[0];
  const targetLanguage = courseId.split('-')[1];

  return db.collection('users').doc(user.uid)
      .collection('courses').doc(courseId)
      .set({
          knownLanguage: knownLanguage,
          targetLanguage: targetLanguage,
      }).then(() => {
          console.log(`Course ${courseId} successfully registered in Firestore.`);
      }).catch((error) => {
          console.error('Error registering course in Firestore:', error);
          throw error; // Pass the error up the chain
      });
}

// Function to get the current course from Firestore
function getFirestoreCurrentCourse(user) {
    return new Promise((resolve, reject) => {
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists && doc.data().currentCourse) {
                console.log(`Fetched currentCourse from Firestore: ${doc.data().currentCourse}`);
                resolve(doc.data().currentCourse);
            } else {
                resolve(null);
            }
        }).catch((error) => {
            console.error('Error fetching current course from Firestore:', error);
            reject(error);
        });
    });
}

// Function to validate if the course exists (i.e., there are questions for it)
function validateCourse(courseId) {
    return db.collection('questions')
        .where('knownLanguage', '==', courseId.split('-')[0])  // Example: 'en' from 'en-es'
        .where('language', '==', courseId.split('-')[1])  // Example: 'es' from 'en-es'
        .limit(1)  // Check if at least one question exists
        .get()
        .then(snapshot => !snapshot.empty)
        .catch(error => {
            console.error('Error validating course:', error);
            return false;
        });
}

// Function to load daily score from Firestore
function loadDailyScore(user, currentCourse) {
  var today = new Date().toISOString().split('T')[0]; // Get date in yyyy-mm-dd format

  // Fetch user's current course stats from the "courses" sub-collection
  var userStatsRef = db.collection('users').doc(user.uid)
    .collection('courses').doc(currentCourse)
    .collection('stats').doc(today);

  // Fetch today's stats
  userStatsRef.get().then(doc => {
    if (doc.exists) {
      dailyScore = doc.data().score || 0; // Load the score from Firestore
    } else {
      dailyScore = 0; // If no score for today, initialize it
    }
    $('#score').text(dailyScore); // Display the current daily score
  }).catch(error => {
    console.error('Error loading daily score:', error);
  });
}

// Load a question from Firestore
function loadQuestion(user, currentCourse) {
  showLoadingProgress();

  if (!user) {
    console.error("User is not authenticated.");
    return;
  }

  if (!currentCourse) {
    console.error('User has not selected a course.');
    window.location.href = 'course_selection.html';
    return;
  }

  // Show a random encouragement message when loading a new question
  showEncouragementMessage();

  // Fetch the due questions based on scheduling algorithm
  db.collection('users').doc(user.uid)
    .collection('courses').doc(currentCourse)
    .collection('progress')
    .where('nextDue', '<=', new Date())
    .orderBy('nextDue')
    .limit(1)
    .get()
    .then(progressSnapshot => {
      if (!progressSnapshot.empty) {
        // Load the due question
        var progressDoc = progressSnapshot.docs[0];
        var questionId = progressDoc.id;
        loadQuestionData(questionId, currentCourse); // Pass currentCourse as a parameter
      } else {
        // No due questions; attempt to load a new question
        loadNewQuestion(user, currentCourse);
      }
    }).catch(error => {
      console.error('Error fetching due questions:', error);
    });
}

// Load question data and display
function loadQuestionData(questionId, currentCourse) {
  db.collection('questions').doc(questionId).get()
    .then(questionDoc => {
      if (questionDoc.exists) {
        displayQuestion(questionDoc.data(), questionId, currentCourse); // Pass currentCourse as a parameter
      } else {
        console.error('Question not found:', questionId);
      }
    });
}

// Load a new question that hasn't been answered yet or from a specific course
function loadNewQuestion(user, courseId) {
  // Fetch user's selected course details (knownLanguage and targetLanguage)
  db.collection('users').doc(user.uid).collection('courses').doc(courseId).get()
  .then(courseDoc => {
      var courseData = courseDoc.data();

      if (!courseData || !courseData.knownLanguage || !courseData.targetLanguage) {
          // Course data might not be ready, let's retry once after a short delay
          console.warn('Course data not found. Retrying...');
          setTimeout(() => {
            if (typeof(courseData.courseId) == 'undefined') {
              if ((typeof(courseData.targetLanguage) !== 'undefined') && (typeof(courseData.knownLanguage) !== 'undefined'))
                courseData.courseId = courseData.knownLanguage + '-' + courseData.targetLanguage;
              }
              // Retry fetching course data
              db.collection('users').doc(user.uid).collection('courses').doc(courseId).get()
              .then(retryDoc => {
                  courseData = retryDoc.data();
                  if (!courseData || !courseData.knownLanguage || !courseData.targetLanguage) {
                      console.error('User has not selected a course after retry.');
                      window.location.href = 'course_selection.html';
                  } else {
                      // Proceed with loading questions after retry
                      fetchAndLoadQuestions(courseData);
                  }
              }).catch(error => {
                  console.error('Error fetching course data during retry:', error);
                  window.location.href = 'course_selection.html';
              });
          }, 1000);  // 1-second delay for retry
      } else {
          // Proceed if course data is available
          fetchAndLoadQuestions(courseData);
      }
  }).catch(error => {
      console.error('Error loading user course data:', error);
  });
}

// Helper function to fetch and load questions
function fetchAndLoadQuestions(courseData) {
  if (typeof(courseData.courseId) == 'undefined') {
    if ((typeof(courseData.targetLanguage) !== 'undefined') && (typeof(courseData.knownLanguage) !== 'undefined'))
      courseData.courseId = courseData.knownLanguage + '-' + courseData.targetLanguage;
    }
  db.collection('questions')
      .where('language', '==', courseData.targetLanguage)
      .where('knownLanguage', '==', courseData.knownLanguage)
      .orderBy('frequency', 'asc')  // Order by frequency in ascending order
      .get()
      .then(questionSnapshot => {
          var questions = [];
          questionSnapshot.forEach(doc => {
              questions.push({ id: doc.id, data: doc.data() });
          });

          // Filter out questions the user has already answered (progress collection)
          db.collection('users').doc(firebase.auth().currentUser.uid)
              .collection('courses').doc(courseData.courseId)
              .collection('progress').get()
              .then(progressSnapshot => {
                  var seenQuestions = progressSnapshot.docs.map(doc => doc.id);
                  var unseenQuestions = questions.filter(q => !seenQuestions.includes(q.id));

                  if (unseenQuestions.length > 0) {
                      // Select the first question with the lowest frequency
                      var lowestFrequencyQuestion = unseenQuestions[0];
                      displayQuestion(lowestFrequencyQuestion.data, lowestFrequencyQuestion.id, courseData.courseId); 
                  } else {
                      console.log('No new questions available.');
                      loadNextEarlyQuestion(firebase.auth().currentUser, courseData.courseId); // Load the next question even if it's not yet due
                  }
              });
      });
}

// Load the next question even if it's not yet due
function loadNextEarlyQuestion(user, courseId) {
  db.collection('users').doc(user.uid)
    .collection('courses').doc(courseId)
    .collection('progress')
    .orderBy('nextDue','asc')
    .limit(1)
    .get()
    .then(progressSnapshot => {
      if (!progressSnapshot.empty) {
        var progressDoc = progressSnapshot.docs[0];
        var questionId = progressDoc.id;
        loadQuestionData(questionId, courseId); // Pass currentCourse as a parameter
      } else {
        console.log('No questions found at all.');
      }
    }).catch(error => {
      console.error('Error fetching next early question:', error);
    });
}

function showLoadingMessages() {
  // Use coach-specific loading messages
  const shuffledMessages = [...window.coachData.loadingMessages].sort(() => Math.random() - 0.5);
  let currentMessageIndex = 0;

  const loadingHtml = `
    <div id="loading-indicator" class="loading-container">
      <div class="spinner"></div>
      <p id="loading-message" class="loading-text"></p>
    </div>
  `;

  $('#explanation-content').html(loadingHtml);
  $('#explanationModal').modal('show');

  $('#loading-message').text(shuffledMessages[currentMessageIndex]);

  interimMessageInterval = setInterval(() => {
    currentMessageIndex++;
    if (currentMessageIndex >= shuffledMessages.length) {
      currentMessageIndex = 0;
    }
    $('#loading-message').text(shuffledMessages[currentMessageIndex]);
  }, 2000 + Math.random() * 1000);
}




// Show loading progress
function showLoadingProgress() {
  // Hide the question area content but keep its space
  $('#question-area').removeClass('visible').css('visibility', 'hidden');
  $('.option-btn').text('\u00A0');

  $('#loading-progress').show();
  $('#progress-bar').css('width', '0%');

  let width = 0;
  const interval = setInterval(() => {
    width += 20;
    $('#progress-bar').css('width', `${width}%`);
    if (width >= 100) {
      width = 0;
    }
  }, 500); // Increase every 500ms

  // Save the interval ID to stop it later
  $('#loading-progress').data('interval', interval);
}

// Hide loading progress
function hideLoadingProgress() {
  $('#loading-progress').hide();
  clearInterval($('#loading-progress').data('interval'));
  // Make the question area content visible again
  $('#question-area').css('visibility', 'visible').addClass('visible');
}

// Display the question on the page
function displayQuestion(question, questionId, currentCourse) {
  console.log(question);
  hideLoadingProgress(); // Hide progress bar when the question loads

  // Store questionId and current question data globally for use in other functions
  if (typeof questionId !== 'undefined') {
    window.currentQuestionId = questionId;
  } else {
    questionId = window.currentQuestionId;
  }

  // Show the toggle button (Make it Easier/Harder) when a new question is displayed
$('#toggle-mode').show();
$('#explain-sentence-btn').hide(); // Hide the explain button initially
  
  if (typeof question !== 'undefined') {
    window.currentQuestionData = question;
  } else {
    question = window.currentQuestionData;
  }
  
  if (typeof currentCourse !== 'undefined') {
    window.currentCourse = currentCourse;
  } else {
    currentCourse = window.currentCourse;
  }

  var inputLength = question.missingWord.length;

  // Calculate input width dynamically to match the expected answer length
  var inputWidth = inputLength * 1.2 + 1;

  // Determine whether to show input field or placeholder based on mode
  const inputField = isMultipleChoice ? '_____' : `<input type="text" autocomplete="off" id="user-answer" class="fill-in-blank" maxlength="${inputLength}" style="width: ${inputWidth}ch;">`;
  var sentenceHTML = question.sentence.replace('___', inputField);

  $('.option-btn').removeClass('selected'); // Remove selected class from all options (relevant to multiple choice, but in case user switches)
  $('.option-btn').prop('disabled', false);

  // Display the sentence with the appropriate input field or placeholder
  $('#sentence').html(sentenceHTML);
  $('#translation').text(question.translation);

  $('#toggle-mode').prop('disabled', false);


  // Retrieve the progress data for this question to get `lastAnswered`
  var user = firebase.auth().currentUser;
  var userProgressRef = db.collection('users').doc(user.uid)
    .collection('courses').doc(currentCourse)
    .collection('progress').doc(questionId);

  userProgressRef.get().then(progressDoc => {
    var phraseStatus = "(new phrase)"; // Default if never answered before

    if (progressDoc.exists) {
      var progressData = progressDoc.data();
      if (progressData.lastAnswered) {
        // Calculate time difference for display
        phraseStatus = timeDifference(progressData.lastAnswered);
      }

      // ** NEW: Update Question Stats **
      var timesSeen = (progressData.timesCorrect || 0) + (progressData.timesIncorrect || 0);
      var timesCorrect = progressData.timesCorrect || 0;
      var timesWrong = progressData.timesIncorrect || 0;

      // Update HTML with the stats
      $('#times-seen').text(timesSeen);
      $('#times-correct').text(timesCorrect);
      $('#times-wrong').text(timesWrong);
      $('#question-stats').show(); // Show the stats section
    } else {
      var timesSeen = 0;
      var timesCorrect = 0;
      var timesWrong = 0;

      // Update HTML with the stats
      $('#times-seen').text(timesSeen);
      $('#times-correct').text(timesCorrect);
      $('#times-wrong').text(timesWrong);
      $('#question-stats').show(); // Show the stats section
    }

    // Display the phrase status
    $('#translation').append(` <span class="text-muted">${phraseStatus}</span>`);

    // Display the translations of the missing word in the feedback area
  displayMissingWordTranslations(question.missingWordTranslation);


    // Automatically focus on the input field if in text input mode
    if (!isMultipleChoice) {
        $('#user-answer').focus();
    }
  });

  $('#feedback').removeClass('visible text-success text-danger').css('visibility', 'hidden');
  $('#coach-feedback').hide(); // Hide coach feedback when a new question is loaded

  // Show or hide the submit button based on the current mode
if (isMultipleChoice) {
  $('#submit-answer').hide();
  $('#special-characters').hide();
} else {
  $('#special-characters').show();
  $('#submit-answer').show();
}
  $('#next-question').hide();

  // Hide or show elements based on the current mode
  if (isMultipleChoice) {
      $('#user-answer').hide();
      $('#multiple-choice-options').show();
      displayMultipleChoiceOptions(question);
      // Add keydown event for keys 1-4
    $(document).off('keydown.multipleChoice').on('keydown.multipleChoice', function (e) {
      if ($('#next-question').is(':visible')) return; // Ignore if next-question is visible
      const key = e.which - 48; // For top number keys
      if (key >= 1 && key <= 4) {
          e.preventDefault();
          $('.option-btn').eq(key - 1).click();
      }
  });
  } else {
      $('#user-answer').show();
      $('#multiple-choice-options').hide();
      // Remove multiple-choice keydown event
    $(document).off('keydown.multipleChoice');
  }

  // Debounce handler to prevent multiple triggers
  function handleDebounce(callback) {
    if (!debounceTimeout) {
      callback(); // Execute the callback function immediately

      // Set debounceTimeout to prevent further triggers
      debounceTimeout = setTimeout(() => {
        debounceTimeout = null; // Reset after 300ms
      }, 300); // Debounce time set to 300ms
    }
  }

  // Handle answer submission for text input mode
  function handleSubmit() {
    var userAnswer = $('#user-answer').val().trim();
    var isCorrect = normalizeString(userAnswer) === normalizeString(question.missingWord);
    afterAnswerSubmission(isCorrect);
  }

  // Function to display missing word translations
function displayMissingWordTranslations(translationsArray) {
  
  // Ensure translationsArray is an array and limit to 3 entries
  const translations = Array.isArray(translationsArray) ? translationsArray.slice(0, 3) : [];

  if (translations.length > 0) {
    // Create a comma-separated string of translations
    const translationsText = translations.join(', ');

    // Update the #feedback area with the translations
    $('#feedback')
    .html(`<span class="missing-word-translations">${translationsText}</span>`)
    .addClass('visible')
    .removeClass('text-success text-danger'); // Remove any previous feedback classes
} else {
  // Hide the feedback area if there are no translations
  $('#feedback').removeClass('visible').html('');
}
}


  // Common function to handle after answer submission
  function afterAnswerSubmission(isCorrect, selectedOption) {
    $('#submit-answer').hide();
    $('#next-question').show();

    // Disable the toggle button after submission
    $('#toggle-mode').prop('disabled', true);

    // Replace '_____' with the correct answer in the sentence and style it
    var answerToDisplay = `<span class="correct-answer">${question.missingWord}</span>`;
    var sentenceHTML = question.sentence.replace('___', answerToDisplay);
    $('#sentence').html(sentenceHTML);

    // Feedback to user
    if (isCorrect) {
      $('#feedback').text('Correct!').removeClass('text-danger').addClass('text-success visible').css('visibility', 'visible');
    } else {
      $('#feedback').text(`Incorrect. The correct answer was "${question.missingWord}".`).removeClass('text-success').addClass('text-danger visible').css('visibility', 'visible');
    }

    // Update visual stats and progress
    updateVisualStats(isCorrect);
    updateUserProgress(questionId, isCorrect, currentCourse);

    // Hide toggle-mode button and show explain-sentence button after answer is submitted
$('#toggle-mode').hide();
$('#explain-sentence-btn').show();

    // Play feedback sound and audio
    playFeedbackSound(isCorrect, () => {
      var completeSentence = question.sentence.replace('___', question.missingWord);
      var targetLanguage = question.language;
      playAudio(questionId, completeSentence, targetLanguage);
    });
}



if (isMultipleChoice) {
    // Event listener for multiple-choice option buttons
    $('.option-btn').off('click').on('click', function () {
      const selectedOption = $(this).data('option');
      var isCorrect = normalizeString(selectedOption) === normalizeString(question.missingWord);

      // Visually mark the selected option
      $('.option-btn').removeClass('selected'); // Remove selected class from all options
      $(this).addClass('selected'); // Add selected class to the clicked button

      // Disable all option buttons
      $('.option-btn').prop('disabled', true);

      afterAnswerSubmission(isCorrect, selectedOption);
    });

    // Add keydown event for keys 1-4
    $(document).off('keydown.multipleChoice').on('keydown.multipleChoice', function (e) {
        if ($('#next-question').is(':visible')) return; // Ignore if next-question is visible
        const key = e.which - 48; // For top number keys
        if (key >= 1 && key <= 4) {
            e.preventDefault();
            const optionBtn = $('.option-btn').eq(key - 1);

            // Trigger click on the option button
            optionBtn.click();
        }
    });
} else {
    // Remove multiple-choice keydown event
    $(document).off('keydown.multipleChoice');

    // Event listener for Enter key to submit answer
    $('#user-answer').off('keypress').on('keypress', function (e) {
      if (e.which === 13 && $('#submit-answer').is(':visible')) { // Enter key pressed and submit button visible
        handleDebounce(handleSubmit);
      }
    });

    // Handle submit answer button click
    $('#submit-answer').off('click').on('click', function () {
      handleDebounce(handleSubmit);
    });
}



  $('#next-question').off('click').on('click', function () {
    stopAudio(); // Stop audio when moving to the next question
    handleDebounce(() => {
      loadQuestion(user, currentCourse);
      $('#explain-sentence-btn').hide(); // Hide the button for the next question
      $('#toggle-mode').show(); // Show the toggle button back
    });
  });

  // Event listener for Enter key to move to the next question
  $(document).off('keypress').on('keypress', function (e) {
    if (e.which === 13 && $('#next-question').is(':visible')) { // Enter key pressed and next button visible
      e.preventDefault(); // Prevent default behavior
      handleDebounce(() => $('#next-question').click());
    }
  });

  // Replay audio button event
  $('#replay-audio').off('click').on('click', function () {
    // Ensure completeSentence and targetLanguage are passed correctly
    var completeSentence = question.sentence.replace('___', question.missingWord); 
    var targetLanguage = question.language;
    playAudio(questionId, completeSentence, targetLanguage); 
  });
}

// Function to display multiple-choice options
function displayMultipleChoiceOptions(question) {
  // Combine the correct answer with distractors
  const options = [...question.distractors, question.missingWord];

  // Shuffle the options array
  shuffleArray(options);

  // Display the options in the buttons
  $('.option-btn').each(function (index) {
    if (index < options.length) {
      $(this).text(options[index]).data('option', options[index]).show();
    } else {
      $(this).hide(); // Hide unused buttons
    }
  });
}

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

// Function to play audio from S3
function playAudio(questionId, completeSentence, targetLanguage) {
  var audioUrl = `https://s3.us-east-2.amazonaws.com/audio1.languizy.com/audio/${questionId}.mp3`;

  // Disable replay button during playback
  $('#replay-audio').prop('disabled', true); // Disable and grey out the button

  audioElement.src = audioUrl;
  audioElement.play()
      .then(() => {
          console.log("Audio playback started successfully.");
      })
      .catch((error) => {
          console.error("Error playing audio:", error);
          console.log("Attempting to generate audio since playback failed.");
          generateAudio(questionId, completeSentence, targetLanguage);
      });

  audioElement.onended = function () {
      console.log("Audio playback ended.");
      $('#replay-audio').prop('disabled', false); // Re-enable the button
  };

  audioElement.onerror = function () {
      console.error("Error loading audio from S3:", audioUrl);
      console.log("Attempting to generate audio due to loading error.");
      generateAudio(questionId, completeSentence, targetLanguage);
  };
}

// Function to stop the audio
function stopAudio() {
  audioElement.pause();
  audioElement.currentTime = 0; // Reset the audio playback
}

// Function to generate audio using the provided Lambda function
function generateAudio(questionId, completeSentence, targetLanguage) {
  const [languageCode, voice] = getLanguageAndVoice(targetLanguage);

  if (!languageCode || !voice) {
      console.error(`Error: No language and voice found for language: ${targetLanguage}`);
      return;
  }

  console.log(`Generating new audio using AWS Polly with language: ${languageCode} and voice: ${voice}`);

  $.ajax({
      url: 'https://hml8eek21e.execute-api.us-east-2.amazonaws.com/check-audio', // Replace with your API endpoint
      type: 'GET',
      data: {
          filename: questionId,
          text: completeSentence,
          language: languageCode,
          voice: voice
      },
      success: function (response) {
          console.log("AWS Polly audio generation request succeeded.");
          const audioUrl = JSON.parse(response).url;

          console.log(`Audio generated successfully and available at: ${audioUrl}`);
          audioElement.src = audioUrl;
          audioElement.play()
              .then(() => {
                  console.log("Generated audio playback started successfully.");
              })
              .catch((error) => {
                  console.error("Error playing generated audio:", error);
              });
      },
      error: function (error) {
          console.error('Error generating audio using AWS Polly:', error);
      }
  });
}

// Function to play feedback sound
function playFeedbackSound(isCorrect, callback) {
  const feedbackAudio = new Audio();
  feedbackAudio.src = isCorrect ? '/assets/audio/correct.mp3' : '/assets/audio/wrong.mp3';
  
  // Play the feedback sound
  feedbackAudio.play()
      .then(() => {
          console.log("Feedback sound played successfully.");
      })
      .catch((error) => {
          console.error("Error playing feedback sound:", error);
      });

  // After feedback sound ends, call the callback to play the full sentence audio
  feedbackAudio.onended = callback;
}

// Function to get the language code and female voice based on the target language
function getLanguageAndVoice(countryCode) {
    console.log(`Attempting to find language and voice for country code: ${countryCode}`);
    
    const entry = countryToLanguage[countryCode.toLowerCase()];
    
    if (!entry) {
        console.error(`No language and voice found for country code: ${countryCode}`);
        return [null, null]; // Return null values to indicate failure
    }

    const { languageCode, voice } = entry;
    console.log(`Success: Found language code '${languageCode}' and voice '${voice}' for country code '${countryCode}'`);
    
    return [languageCode, voice];
}

// Normalization function to ignore special characters
function normalizeString(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Update user progress in the database
function updateUserProgress(questionId, isCorrect, currentCourse) {
  var user = firebase.auth().currentUser;

  var userProgressRef = db.collection('users').doc(user.uid)
    .collection('courses').doc(currentCourse)
    .collection('progress').doc(questionId);

  var userStatsRef = db.collection('users').doc(user.uid)
    .collection('courses').doc(currentCourse)
    .collection('stats');

  var allTimeStatsRef = userStatsRef.doc('all-time');

  // First, fetch the question data to get its frequency outside the transaction
  db.collection('questions').doc(questionId).get().then(questionDoc => {
    if (questionDoc.exists) {
      var questionFrequency = questionDoc.data().frequency; // Frequency of the current question

      // Now, run the transaction to update progress and stats
      db.runTransaction(transaction => {
        return transaction.get(userProgressRef).then(doc => {
          var data = doc.exists ? doc.data() : {
            timesCorrect: 0,
            timesIncorrect: 0,
            timesCorrectInARow: 0,
            timesIncorrectInARow: 0,
            lastAnswered: null,
            nextDue: null,
            initialAppearance: true
          };

          var now = new Date();
          var today = now.toISOString().split('T')[0]; // Get date in yyyy-mm-dd format
          var points = isCorrect ? 10 : 0;

          if (isMultipleChoice) {
              points = Math.ceil(points / 2); // Half points for multiple choice
          }

          if (isCorrect) {
            streakCorrect += 1;
            streakWrong = 0;
            data.timesCorrect += 1;
            data.timesCorrectInARow += 1;
            data.timesIncorrectInARow = 0; // Reset incorrect streak
            var daysToAdd = data.initialAppearance ? 28 : 2 * data.timesCorrectInARow;
            data.nextDue = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
            updateStats(userStatsRef, today, points, true);
            dailyScore += points; // Update the daily score
            $('#score').text(dailyScore); // Update the score on screen
          } else {
            streakWrong += 1;
            streakCorrect = 0;
            data.timesIncorrect += 1;
            data.timesCorrectInARow = 0; // Reset correct streak
            data.timesIncorrectInARow += 1; // Increment incorrect streak
            data.nextDue = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
            updateStats(userStatsRef, today, points, false);
          }

          // Update `lastAnswered` to the current time
          data.lastAnswered = firebase.firestore.Timestamp.fromDate(now);
          data.initialAppearance = false;

          // Fetch the current maxFrequency and update if necessary
          return transaction.get(allTimeStatsRef).then(allTimeDoc => {
              var allTimeData = allTimeDoc.exists ? allTimeDoc.data() : {};
            
              // Ensure maxFrequency is set, even if the document exists but the field is missing
              if (typeof allTimeData.maxFrequency === 'undefined') {
                allTimeData.maxFrequency = 0;
              }
            
              // Compare question frequency and update if necessary
              if (questionFrequency > allTimeData.maxFrequency) {
                allTimeData.maxFrequency = questionFrequency;
              }
            
              // Write the updated progress and stats back to Firestore
              transaction.set(userProgressRef, data);
              transaction.set(allTimeStatsRef, allTimeData);

              return Promise.resolve(data); // Return updated data
            });
        });
      }).then((data) => {
        console.log('Transaction successful');
        // Now data contains the updated progress data
        // We can call a function to update the coach feedback
        
        updateCoachFeedback(streakCorrect, streakWrong);
      }).catch(error => {
        console.error('Transaction failed:', error);
      });

    } else {
      console.error("Question not found");
    }
  }).catch(error => {
    console.error('Error fetching question data:', error);
  });
}

// Function to update the coach message with a random encouragement statement
function showEncouragementMessage() {
  const randomIndex = Math.floor(Math.random() * window.coachData.encouragementMessages.length);
  const message = window.coachData.encouragementMessages[randomIndex];

  $('#coach-message').text(message);
  $('#coach-feedback').show();
}

// Function to update coach feedback
function updateCoachFeedback(correctStreak, incorrectStreak) {
  let coachMessage = '';

  // Select messages based on streaks
  if (correctStreak >= 9) {
    coachMessage = getRandomMessage(window.coachData.tonsOfCorrectsInARowMessages);
  } else if (correctStreak == 7) {
    coachMessage = getRandomMessage(window.coachData.sevenCorrectMessages);
  } else if (correctStreak == 5) {
    coachMessage = getRandomMessage(window.coachData.fiveCorrectMessages);
  } else if (correctStreak == 3) {
    coachMessage = getRandomMessage(window.coachData.threeCorrectMessages);
  } else if (correctStreak > 0) {
    coachMessage = getRandomMessage(window.coachData.correctMessages);
  } else if (incorrectStreak >= 9) {
    coachMessage = getRandomMessage(window.coachData.tonsOfMistakesInARowMessages);
  } else if (incorrectStreak == 7) {
    coachMessage = getRandomMessage(window.coachData.sevenMistakesMessages);
  } else if (incorrectStreak == 5) {
    coachMessage = getRandomMessage(window.coachData.fiveMistakesMessages);
  } else if (incorrectStreak == 3) {
    coachMessage = getRandomMessage(window.coachData.threeMistakesMessages);
  } else {
    coachMessage = getRandomMessage(window.coachData.mistakeMessages);
  }

  $('#coach-message').text(coachMessage);
  $('#coach-feedback').show();
}

// Helper function to get a random message from an array
function getRandomMessage(messagesArray) {
  return messagesArray[Math.floor(Math.random() * messagesArray.length)];
}

// Function to update the visual stats (correct/wrong counts and last 5 answers)
function updateVisualStats(isCorrect) {
  // Update correct/wrong counts
  if (isCorrect) {
    correctAnswers++;
  } else {
    wrongAnswers++;
  }

  // Update last 5 answers (push new answer and maintain only 5)
  if (lastFiveAnswers.length >= 5) {
    lastFiveAnswers.shift(); // Remove the oldest entry
  }
  lastFiveAnswers.push(isCorrect ? 'correct' : 'wrong');

  // Update UI for correct/wrong counts
  $('#correct-count').text(correctAnswers);
  $('#wrong-count').text(wrongAnswers);
  
  // Update last 5 answers (display boxes)
  updateLastFiveAnswers();
}

// Function to visually update the last 5 answers
function updateLastFiveAnswers() {
  const container = $('#last-five-answers');
  container.empty(); // Clear the container

  // Add boxes based on last 5 answers
  for (let i = 0; i < 5; i++) {
    let answerClass = 'gray'; // Default is gray
    if (i < lastFiveAnswers.length) {
      answerClass = lastFiveAnswers[i] === 'correct' ? 'green' : 'red';
    }
    const box = $('<div></div>').addClass('answer-box').css('background-color', answerClass);
    container.append(box);
  }
}

// Update stats in the database
function updateStats(userStatsRef, date, score, isCorrect) {
  const dailyStatsRef = userStatsRef.doc(date);
  const allTimeStatsRef = userStatsRef.doc('all-time');

  db.runTransaction(transaction => {
    return transaction.get(dailyStatsRef).then(dailyDoc => {
      return transaction.get(allTimeStatsRef).then(allTimeDoc => {
        // Helper function to validate and sanitize fields
        function ensureNumber(value, defaultValue = 0) {
          return (typeof value === 'number' && !isNaN(value)) ? value : defaultValue;
        }

        // Process daily stats
        const dailyData = dailyDoc.exists ? dailyDoc.data() : {
          correctAnswers: 0,
          wrongAnswers: 0,
          totalDrills: 0,
          score: 0,
          vocabulary_correctAnswers: 0,
          vocabulary_wrongAnswers: 0,
          vocabulary_totalDrills: 0,
          vocabulary_score: 0
        };

        // Ensure all fields are numbers
        dailyData.totalDrills = ensureNumber(dailyData.totalDrills);
        dailyData.score = ensureNumber(dailyData.score);
        dailyData.correctAnswers = ensureNumber(dailyData.correctAnswers);
        dailyData.wrongAnswers = ensureNumber(dailyData.wrongAnswers);
        dailyData.vocabulary_totalDrills = ensureNumber(dailyData.vocabulary_totalDrills);
        dailyData.vocabulary_score = ensureNumber(dailyData.vocabulary_score);
        dailyData.vocabulary_correctAnswers = ensureNumber(dailyData.vocabulary_correctAnswers);
        dailyData.vocabulary_wrongAnswers = ensureNumber(dailyData.vocabulary_wrongAnswers);

        // Update stats safely
        dailyData.totalDrills += 1;
        dailyData.score += score;
        dailyData.vocabulary_totalDrills += 1;
        dailyData.vocabulary_score += score;

        if (isCorrect) {
          dailyData.correctAnswers += 1;
          dailyData.vocabulary_correctAnswers += 1;
        } else {
          dailyData.wrongAnswers += 1;
          dailyData.vocabulary_wrongAnswers += 1;
        }

        // Process all-time stats
        const allTimeData = allTimeDoc.exists ? allTimeDoc.data() : {
          totalCorrectAnswers: 0,
          totalWrongAnswers: 0,
          totalDrills: 0,
          totalScore: 0,
          vocabulary_totalCorrectAnswers: 0,
          vocabulary_totalWrongAnswers: 0,
          vocabulary_totalDrills: 0,
          vocabulary_totalScore: 0
        };

        // Ensure all fields are numbers
        allTimeData.totalDrills = ensureNumber(allTimeData.totalDrills);
        allTimeData.totalScore = ensureNumber(allTimeData.totalScore);
        allTimeData.totalCorrectAnswers = ensureNumber(allTimeData.totalCorrectAnswers);
        allTimeData.totalWrongAnswers = ensureNumber(allTimeData.totalWrongAnswers);
        allTimeData.vocabulary_totalDrills = ensureNumber(allTimeData.vocabulary_totalDrills);
        allTimeData.vocabulary_totalScore = ensureNumber(allTimeData.vocabulary_totalScore);
        allTimeData.vocabulary_totalCorrectAnswers = ensureNumber(allTimeData.vocabulary_totalCorrectAnswers);
        allTimeData.vocabulary_totalWrongAnswers = ensureNumber(allTimeData.vocabulary_totalWrongAnswers);

        // Update stats safely
        allTimeData.totalDrills += 1;
        allTimeData.totalScore += score;
        allTimeData.vocabulary_totalDrills += 1;
        allTimeData.vocabulary_totalScore += score;

        if (isCorrect) {
          allTimeData.totalCorrectAnswers += 1;
          allTimeData.vocabulary_totalCorrectAnswers += 1;
        } else {
          allTimeData.totalWrongAnswers += 1;
          allTimeData.vocabulary_totalWrongAnswers += 1;
        }

        // Write both sets of stats after all reads
        transaction.set(dailyStatsRef, dailyData);
        transaction.set(allTimeStatsRef, allTimeData);

        return Promise.resolve(); // Indicate the transaction is complete
      });
    });
  }).then(() => {
    console.log('Stats updated successfully');
  }).catch(error => {
    console.error('Transaction failed:', error);
  });
}

// Helper function to calculate time difference
function timeDifference(lastAnswered) {
  if (!lastAnswered) {
    return "(new phrase)";
  }

  const now = new Date();
  const diff = now - lastAnswered.toDate(); // Calculate time difference in milliseconds

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `(shown last ${years} year${years > 1 ? 's' : ''} ago)`;
  } else if (months > 0) {
    return `(shown last ${months} month${months > 1 ? 's' : ''} ago)`;
  } else if (weeks > 0) {
    return `(shown last ${weeks} week${weeks > 1 ? 's' : ''} ago)`;
  } else if (days > 0) {
    return `(shown last ${days} day${days > 1 ? 's' : ''} ago)`;
  } else if (hours > 0) {
    return `(shown last ${hours} hour${hours > 1 ? 's' : ''} ago)`;
  } else if (minutes > 0) {
    return `(shown last ${minutes} minute${minutes > 1 ? 's' : ''} ago)`;
  } else {
    return "(new phrase)";
  }
}

function buttonClick(which) {
  if (which === 'stats') {
      window.location.href = 'stats.html';
  }
}

async function generateExplanation(questionId, fullSentence, missingWord, targetLanguage, userLanguage) {
  try {
    const response = await fetch('https://us-central1-languizy2.cloudfunctions.net/explainSentence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionId,
        fullSentence,
        missingWord,
        targetLanguage,
        userLanguage,
        grammar: false 
      })
    });

    if (!response.ok) {
      // Log the response for debugging
      console.error('Failed to call explanation function:', response.status, response.statusText);
      throw new Error(`Failed to call explanation function: ${response.statusText}`);
    }

    const data = await response.json();

    // Ensure that the explanation is properly retrieved
    if (!data || !data.focus_word_explanation) {
      throw new Error('Invalid explanation received from the function');
    }

    return data;
  } catch (error) {
    console.error('Error in generateExplanation:', error);
    throw error; // Re-throw the error to handle it in the calling function
  }
}


function showExplanationModal(explanationData) {
  // Stop the interim message interval
  clearInterval(interimMessageInterval);

  // Parse explanationData if it's in JSON string format
  let parsedExplanation;
  try {
    parsedExplanation = typeof explanationData === 'string' ? JSON.parse(explanationData) : explanationData;
  } catch (error) {
    console.error('Failed to parse explanation data:', error);
    alert('Failed to display explanation. Please try again.');
    return; // Exit the function if parsing fails
  }

  // Set the modal title to include the full sentence being explained
  $('#explanationModalLabel').html(`Sentence Explanation: "${window.currentQuestionData.sentence}"`);

  // Build the explanation HTML with classes for styling
  let explanationHtml = '<div class="general-explanation"><h2>General Explanation:</h2>';

  parsedExplanation.sentence_breakdown.forEach(part => {
    const partOfSpeechClass = part.part_of_speech.toLowerCase(); // Use a CSS class based on part of speech
    explanationHtml += `
      <p>
        <i class="icon ${partOfSpeechClass} fas fa-info-circle"></i>
        <strong>${part.word} (${part.part_of_speech})</strong> - ${part.explanation}
      </p>`;
  });

  explanationHtml += `</div>
    <div class="missing-word-section">
      <h2 class="missing-word-title">The Missing Word: ${window.currentQuestionData.missingWord}</h2>
      <p>${parsedExplanation.focus_word_explanation}</p>
    </div>`;

  // Populate the modal content with the final explanation
  $('#explanation-content').html(explanationHtml);

  // Show the modal
  $('#explanationModal').modal('show');
}




$('#explain-sentence-btn').off('click').on('click', async function() {
  try {
    // Show loading messages while fetching the explanation
    showLoadingMessages();

    // Check if window.currentQuestionData exists and has an explanation
    if (window.currentQuestionData && typeof window.currentQuestionData.explanation === 'string' && window.currentQuestionData.explanation.trim() !== '') {
      // Explanation already exists, display it in the modal
      showExplanationModal(window.currentQuestionData.explanation);
    } else {
      // Call the Cloud Function to generate the explanation
      const explanation = await generateExplanation(window.currentQuestionId, window.currentQuestionData.sentence, window.currentQuestionData.missingWord, window.currentQuestionData.language, 'en');

      console.log('Generated explanation:', explanation);

      if (!explanation || typeof explanation !== 'object' || Object.keys(explanation).length === 0) {
        throw new Error('Explanation generation failed or returned empty.');
      }

      // Save the explanation to Firestore
      // await db.collection('questions').doc(window.currentQuestionId).update({ explanation });

      // Display the explanation in the modal
      showExplanationModal(explanation);
    }
  } catch (error) {
    console.error('Error generating explanation:', error);
    alert('Failed to generate explanation. Please try again.');
  } finally {
    // Stop the interim messages once the explanation is ready
    clearInterval(interimMessageInterval);
  }
});

function addCharacter(character) {
  const inputField = document.getElementById('user-answer');
  if (inputField) {
    const maxLength = inputField.maxLength;
    const currentValue = inputField.value;
    const startPos = inputField.selectionStart;
    const endPos = inputField.selectionEnd;

    // Calculate the new length after insertion
    const newLength = currentValue.length - (endPos - startPos) + character.length;

    // Check if the new length exceeds the max length
    if (newLength <= maxLength) {
      // Insert the character at the current cursor position
      inputField.value = currentValue.substring(0, startPos) + character + currentValue.substring(endPos);

      // Move the cursor to the end of the inserted character
      const newCursorPos = startPos + character.length;
      inputField.setSelectionRange(newCursorPos, newCursorPos);
    }

    // Focus the input field
    inputField.focus();
  }
}
