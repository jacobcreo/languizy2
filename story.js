// Initialize Firestore
const db = firebase.firestore();

// Get the storyId from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const storyId = urlParams.get('storyId');
let currentUser;
let correctAnswersCount = 0; // Track correct answers for scoring
const totalQuestions = 4; // Number of questions in the test
let currentQuestionIndex = 1; // Start from the first question
let currentStoryData; // Store the loaded story data
let isShowingTranslation = false; // Track translation toggle state
let language = '';
let knownLanguage = '';
let startTime;
let elapsedTime = 0;
let uid;

const languageShorts = {
  'en': {
      'en': 'English',
      'de': 'German',
      'fr': 'French',
      'it': 'Italian',
      'es': 'Spanish',
      'us': 'English',
      'uk': 'English',
      'ru': 'Russian',
      'cn': 'Chinese',
      'pt': 'Portuguese',
      'nl': 'Dutch'
  }, 'es' :
  {
      'en': 'Inglés',
      'de': 'Alemán',
      'fr': 'Francés',
      'it': 'Italiano',
      'es': 'Español',
      'us': 'Inglés',
      'uk': 'Inglés',
      'ru': 'Ruso',
      'cn': 'Chino',
      'pt': 'Portugués',
      'nl': 'Holandés'
  }
}

let UIString = {
    'en': {
        'logout': 'Logout',
        'retry_test': 'Retry Test',
        'return_to_stories': 'Return to Stories',
        'loading_story': 'Loading Story...',
        'play_story_audio': 'Play Story Audio',
        'test_your_knowledge': 'Test Your Knowledge',    
        'almost_there': 'Almost there!',
        'you_answered': 'You answered',
        'out_of': 'out of',
        'correctly': 'correctly.',
        'you_can_retry': 'You can retry the test or return to the Stories screen.',
        'free_user': 'Free',
        'pro_user': 'Pro'
    },
    'es': {
        'logout': 'Cerrar sesión',
        'retry_test': 'Reintentar Test',
        'return_to_stories': 'Volver a Historias',
        'loading_story': 'Cargando Historia...',
        'play_story_audio': 'Reproducir Audio de la Historia',
        'test_your_knowledge': 'Prueba tu Conocimiento',
        'almost_there': '¡Casi!',
        'you_answered': 'Respondiste',
        'out_of': 'de',
        'correctly': 'correctamente.',
        'you_can_retry': 'Puedes reintentar el test o volver a la pantalla de Historias.',
        'free_user': 'GRATIS',
        'pro_user': 'PRO'
    }
};

let interfaceLanguage = 'en';

// Global variable to store the audio element
let audioElement = new Audio(); 
const countryToLanguage = {
    cn: { languageCode: "cmn-CN", voice: "Zhiyu" },        // China
    in: { languageCode: "hi-IN", voice: "Aditi" },         // India
    us: { languageCode: "en-US", voice: "Joanna" },        // United States
    en: { languageCode: "en-US", voice: "Joanna" },        // United States
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

// Call this function within your existing loadStory function after the story is loaded
// Load story function
async function loadStory() {
    try {
        const storyDoc = await db.collection('stories').doc(storyId).get();
        if (!storyDoc.exists) {
            console.error("Story not found!");
            return;
        }

        currentStoryData = storyDoc.data();
        language = currentStoryData.language;
        knownLanguage = currentStoryData.knownLanguage;
        console.log(currentStoryData);
        document.getElementById('storyTitle').innerText = currentStoryData.storyTitle;
        let storyImg = 'https://languizy.com/myimages/stories/'+currentStoryData.knownLanguage + '-' + currentStoryData.language + '-' + storyId + '.png' + '/public';
        
        document.getElementById('storyImage').src = `${storyImg || 'storyImage.jpg'}`;

        const formattedStoryText = formatStoryText(currentStoryData.storyText);
        document.getElementById('storyText').innerHTML = formattedStoryText;

        const buttonContainer = document.querySelector('.button-container');
        const playAudioBtn = document.getElementById('playStoryAudioBtn');

        // Check if translation exists
        if (currentStoryData.storyTitleTranslation && currentStoryData.storyTextTranslation) {
            const translationToggleBtn = document.createElement('button');
            translationToggleBtn.id = 'translationToggleBtn';
            translationToggleBtn.textContent = 'Show Translation';
            translationToggleBtn.onclick = () => toggleTranslation(translationToggleBtn);
            
            buttonContainer.classList.remove('single-button');
            buttonContainer.appendChild(translationToggleBtn);
        } else {
            buttonContainer.classList.add('single-button'); // Only one button
        }

        // Play story audio button initialization
        initializeAudioButton(currentStoryData);

        // Re-attach event listener for "Test Your Knowledge" button
        document.getElementById('testYourKnowledgeBtn').onclick = startTest;

        startTime = Date.now();


    } catch (error) {
        console.error("Error loading story:", error);
    }
}

// Load User Avatar or Initials into Navbar
function loadUserAvatar(user) {
  const userRef = db.collection('users').doc(user.uid);
  
  userRef.get().then((doc) => {
      if (doc.exists) {
          
          const userData = doc.data();
          let knownLanguage = userData.currentCourse.split('-')[0];
    // check if knownLanguage is in languageShorts
    if (languageShorts[knownLanguage]) {
        interfaceLanguage = knownLanguage;
    }
    modifyInterfaceLanguage();
          const photoURL = userData.photoURL;
          const displayName = userData.displayName || '';
          const email = userData.email || '';
          populateSubLevelBadge(doc);
          
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




// Toggle translation function
function toggleTranslation(button) {
    const storyTextElement = document.getElementById('storyText');
    const storyTitleElement = document.getElementById('storyTitle');

    if (button.textContent === 'Show Translation') {
        storyTitleElement.innerText = currentStoryData.storyTitleTranslation;
        storyTextElement.innerHTML = formatStoryText(currentStoryData.storyTextTranslation);
        button.textContent = 'Show Original';
    } else {
        storyTitleElement.innerText = currentStoryData.storyTitle;
        storyTextElement.innerHTML = formatStoryText(currentStoryData.storyText);
        button.textContent = 'Show Translation';
    }
}

  // Create the toggle button for switching between original and translation
function createTranslationToggleButton() {
    const toggleButton = document.createElement('button');
    toggleButton.id = 'translationToggleBtn';
    toggleButton.classList.add('btn', 'btn-secondary', 'my-3');
    toggleButton.innerText = 'Show Translation';
    toggleButton.style.width = 'auto'; // Adjust button size
  
    // Insert the button next to the story title
    const titleElement = document.getElementById('storyTitle');
    titleElement.parentNode.insertBefore(toggleButton, titleElement.nextSibling);
  
    // Add event listener to toggle between original and translation
    toggleButton.addEventListener('click', () => {
      if (isShowingTranslation) {
        // Show original story
        titleElement.innerText = currentStoryData.storyTitle;
        document.getElementById('storyText').innerHTML = formatStoryText(currentStoryData.storyText);
        toggleButton.innerText = 'Show Translation';
      } else {
        // Show translated story
        gtag('event', 'Show Translation', {
          'question_type': 'Story',
          'user_id': uid,
          'course': knownLanguage + "-" + language
      });
        titleElement.innerText = currentStoryData.storyTitleTranslation;
        document.getElementById('storyText').innerHTML = formatStoryText(currentStoryData.storyTextTranslation);
        toggleButton.innerText = 'Show Original';
      }
      isShowingTranslation = !isShowingTranslation;
    });
  }
  
// Improved format story text function to handle different line breaks and quotes
function formatStoryText(text) {
    if (typeof text !== 'string') return text;
  
    return text
      .replace(/\\n/g, '\n')            // Normalize escaped \n to normal newlines
      .replace(/\n\n+/g, '</p><p>')      // Convert two or more consecutive newlines to paragraph breaks
      .replace(/\n/g, '<br>')            // Convert remaining single newlines to <br> tags for line breaks
      .replace(/\\"/g, '"')              // Unescape quotes (\")
      .replace(/^/, '<p>')               // Add opening <p> tag at the beginning
      .replace(/$/, '</p>');             // Add closing </p> tag at the end
  }
  
  

// Start Test function
function startTest() {
  
  document.getElementById('testYourKnowledgeBtn').style.display = 'none';
  document.getElementById('testSection').style.display = 'block';
  gtag('event', 'Start Test', {
    'question_type': 'Story',
    'user_id': uid,
    'course': knownLanguage + "-" + language
});
  loadNextQuestion();
}

let correctAnswer;  // Store the correct answer for comparison



// Load next question function
function loadNextQuestion() {
  const questionContainer = document.getElementById('questionContainer');
  questionContainer.innerHTML = ''; // Clear previous question

  if (currentQuestionIndex <= totalQuestions) {
      const question = currentStoryData[`test_question${currentQuestionIndex}`];
      const answers = currentStoryData[`answers${currentQuestionIndex}`];

      if (!question || !answers || answers.length === 0) {
          console.error(`Missing question or answers for question ${currentQuestionIndex}`);
          questionContainer.innerHTML = `<p class="text-danger">Error loading question ${currentQuestionIndex}. Please try again later.</p>`;
          return;
      }

      correctAnswer = answers[0];  // The first answer in the array is the correct one
      // The first answer in the array is the correct one
      const shuffledAnswers = shuffleArray(answers);  // Shuffle the answers

      const questionHTML = `
          <h5 class="mb-4">${currentQuestionIndex}. ${question}</h5>
          <div id="answerButtons"></div>
      `;

      questionContainer.innerHTML = questionHTML;
      const answerButtonsContainer = document.getElementById('answerButtons');

      shuffledAnswers.forEach(answer => {
          const button = document.createElement('button');
          button.classList.add('btn', 'btn-outline-primary', 'btn-lg', 'd-block', 'w-100', 'my-2', 'answer-btn');
          button.innerText = answer;
          button.onclick = () => submitAnswer(answer);  // Call submitAnswer without passing correctAnswer explicitly
          answerButtonsContainer.appendChild(button);
      });

  } else {
      showTestFeedback();
  }
}

// Submit Answer and Load Next
function submitAnswer(userAnswer) {
  if (userAnswer === correctAnswer) {
      correctAnswersCount++;
  }
  gtag('event', 'User Answered', {
    'question_type': 'Story',
    'answer' : userAnswer === correctAnswer,
    'user_id': uid,
    'course': knownLanguage + "-" + language
});
  if (currentQuestionIndex >= totalQuestions) {
    // Stop the timer and calculate elapsed time
    elapsedTime = Math.min(Math.floor((Date.now() - startTime) / 1000), 300);
    debugger;
}

  currentQuestionIndex++;
  loadNextQuestion();  // Load the next question
}

// Show feedback based on test results
function showTestFeedback() {
    const feedbackSection = document.getElementById('testFeedback');
    const resultsMessage = document.getElementById('testResults');

    if (correctAnswersCount >= 3) {
        resultsMessage.innerHTML = `
            <p><strong>Well done!</strong> You answered ${correctAnswersCount} out of ${totalQuestions} correctly.</p>
            <p>You have completed this story. You've earned 200 points!</p>
        `;
        updateUserProgress(true);
    } else {
        resultsMessage.innerHTML = `
            <p><strong>${UIString[interfaceLanguage].almost_there}</strong> ${UIString[interfaceLanguage].you_answered} ${correctAnswersCount} ${UIString[interfaceLanguage].out_of} ${totalQuestions} ${UIString[interfaceLanguage].correctly}.</p>
            <p>${UIString[interfaceLanguage].you_can_retry} ${UIString[interfaceLanguage].or} ${UIString[interfaceLanguage].return_to_stories}.</p>
        `;
        updateUserProgress(false);
    }

    feedbackSection.style.display = 'block';
}

// Update User's Story Progress in Firestore
async function updateUserProgress(isCompleted) {
  try {
      const userDocRef = db.collection('users').doc(currentUser.uid);
      const course = knownLanguage + "-" + language;
      const storyProgressRef = userDocRef.collection('stories').doc(course).collection(course).doc(storyId);

      // Update story progress
      await storyProgressRef.set({
          lastAnswered: new Date().toISOString(),
          questionsAnsweredCorrect: correctAnswersCount,
          questionsAnsweredWrong: totalQuestions - correctAnswersCount,
          finished: isCompleted,
          timeSpentStories: firebase.firestore.FieldValue.increment(elapsedTime) // Add time spent

      }, { merge: true });

      if (isCompleted) {
          await userDocRef.update({
              totalPoints: firebase.firestore.FieldValue.increment(200)
          });

          // Get today's date in the format YYYY-MM-DD
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Create a date object for the current date
const now = new Date();

// Format the date according to the user's timezone
const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: userTimezone };
const formattedDate = new Intl.DateTimeFormat('en-US', options).format(now);

// Split the formatted date into parts
const [month, day, year] = formattedDate.split('/');

// Create the date in yyyy-mm-dd format
var today = `${year}-${month}-${day}`;

          // Reference to today's stats document
          
          const todayStatsRef = userDocRef
    .collection('courses').doc(course)
    .collection('stats').doc(today);


          // Reference to all-time stats document
          const allTimeStatsRef = userDocRef
    .collection('courses').doc(course)
    .collection('stats').doc('all-time');

          // Update today's stats
          await todayStatsRef.set({
              storiesRead: firebase.firestore.FieldValue.increment(1),
              storiesFinished: firebase.firestore.FieldValue.increment(1),
              storyQuestionsAnsweredCorrect: firebase.firestore.FieldValue.increment(correctAnswersCount),
              storyQuestionsAnsweredWrong: firebase.firestore.FieldValue.increment(totalQuestions - correctAnswersCount),
              timeSpentStories: firebase.firestore.FieldValue.increment(elapsedTime) // Add time spent

          }, { merge: true });

          // Update all-time stats
          await allTimeStatsRef.set({
              storiesRead: firebase.firestore.FieldValue.increment(1),
              storiesFinished: firebase.firestore.FieldValue.increment(1),
              storyQuestionsAnsweredCorrect: firebase.firestore.FieldValue.increment(correctAnswersCount),
              storyQuestionsAnsweredWrong: firebase.firestore.FieldValue.increment(totalQuestions - correctAnswersCount),
              timeSpentStories: firebase.firestore.FieldValue.increment(elapsedTime) // Add time spent

          }, { merge: true });
      }

  } catch (error) {
      console.error("Error updating story progress:", error);
  }
}

// Retry test logic
document.getElementById('retryTestBtn').onclick = function() {
  gtag('event', 'Retake Test', {
    'question_type': 'Story',
    'user_id': uid,
    'course': knownLanguage + "-" + language
});
  document.getElementById('testFeedback').style.display = 'none';
  correctAnswersCount = 0;  // Reset correct answers count
  currentQuestionIndex = 1;  // Reset to first question
  elapsedTime = 0;  // Reset elapsed time
  startTime = Date.now();  // Restart the timer
  startTest();  // Start the test again
};

async function populateSubLevelBadge(userDoc) {
  const subLevel = userDoc.data().subLevel;
  const subLevelBadge = document.getElementById('subLevelBadge');
  subLevelBadge.textContent = subLevel;  // Set the badge based on userLevel
  if (subLevel === 'Free') {
    subLevelBadge.textContent = UIString[interfaceLanguage].free_user;
    subLevelBadge.className = 'badge bg-secondary';
    subLevelBadge.onclick = function() {
      window.location.href = '/course_selection.html?upgrade=true';
    };
  } else {
    subLevelBadge.textContent = UIString[interfaceLanguage].pro_user;
    subLevelBadge.className = 'badge bg-danger';
    subLevelBadge.onclick = null; // No action on click for PRO
}
}

// Authentication listener to get the user
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    loadUserAvatar(user);
    currentUser = user;
    uid = user.uid;
    loadStory(); // Load the story when user is authenticated
    

  } else {
    window.location.href = '/';
  }
});

// Shuffle answers for randomness
function shuffleArray(array) {
  if (!array || !Array.isArray(array)) {
      console.error("Invalid answers array for shuffling", array);
      return [];
  }
  return array.sort(() => Math.random() - 0.5);
}

// Function to handle audio playback and generation
function handleAudioPlayback(storyId, storyText, languageCode, voice, storyTitle) {
    const audioUrl = `https://s3.us-east-2.amazonaws.com/audio1.languizy.com/audio/story-${storyId}.mp3`;
  
    // Try playing the audio if it exists
    audioElement.src = audioUrl;
    audioElement.play()
      .then(() => {
        console.log("Audio playback started successfully.");
        gtag('event', 'Play Audio', {
          'question_type': 'Story',
          'user_id': uid,
          'course': knownLanguage + "-" + language
      });
      })
      .catch((error) => {
        console.error("Error playing audio, attempting to generate audio:", error);
        generateStoryAudio(storyId, storyText, languageCode, voice, storyTitle);
      });
  
    // Reset the audio if it ends
    audioElement.onended = () => {
      console.log("Audio playback ended.");
    };
  
    audioElement.onerror = () => {
      console.error("Error loading audio from S3, attempting to generate audio.");
      generateStoryAudio(storyId, storyText, languageCode, voice, storyTitle);
    };
  }
  
  
  // Function to generate audio using AWS Polly (same logic as in game.js)
  function generateStoryAudio(storyId, storyText, languageCode, voice, storyTitle) {
    console.log(`Generating new audio using AWS Polly with language: ${languageCode} and voice: ${voice}`);
  
    $.ajax({
      url: 'https://hml8eek21e.execute-api.us-east-2.amazonaws.com/check-audio', // Replace with your API endpoint
      type: 'GET',
      data: {
        filename: `story-${storyId}`,
        text: convertTextToSSML(storyText, storyTitle), // Convert to SSML format for the story
        language: languageCode,
        voice: voice,
        isSSML: 'true' // Set to true for SSML generation
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

  
  
  // Initialize the "Play Story Audio" button
function initializeAudioButton(storyData) {
    const languageCode = countryToLanguage[storyData.language].languageCode;
    const voice = countryToLanguage[storyData.language].voice;
  
    document.getElementById('playStoryAudioBtn').onclick = () => {
      handleAudioPlayback(storyId, storyData.storyText, languageCode, voice, storyData.storyTitle);
    };
  }
  
  
  
  function convertTextToSSML(text, headline = "", pauseDuration = 500) {
    // Helper function to remove redundant breaks
    const removeRedundantBreaks = (text) => {
        return text.replace(/(<break time="500ms"\s*\/?>\s*)+/g, '<break time="500ms"/>');
    };
    
    // Trim the text and remove escape sequences like \"
    let cleanText = text
        .replace(/\\n/g, '<break time="500ms"/>') // Replace \n with SSML breaks
        .replace(/\\"/g, '"') // Remove escaped quotes
        .replace(/<\/?p>/g, '') // Remove <p> tags if any
        .trim(); // Trim any extra whitespace
    
    // Optionally add the headline with a customizable pause after it
    let ssml = `<speak>${headline ? headline + `<break time="1000ms"/>` : ''}`;
    
    // Ensure no redundant breaks and remove excess spacing
    ssml += removeRedundantBreaks(cleanText);

    ssml += "</speak>"; // Close SSML tag
    console.log(ssml);
    debugger;
    return ssml;
}

function modifyInterfaceLanguage() {

  if (UIString[interfaceLanguage]) {
      const lang = UIString[interfaceLanguage];

      // Update all elements with data-i18n attribute (text content)
      $('[data-i18n]').each(function () {
          const key = $(this).data('i18n');
          if (key.includes('.')) {
              // Handle nested keys e.g. 'RecommendationNames.Basics'
              const keys = key.split('.');
              let text = lang;
              keys.forEach(k => {
                  text = text[k] || '';
              });
              $(this).text(text);
          } else {
              // Direct key in the UIString
              if (lang[key] !== undefined) {
                  $(this).text(lang[key]);
              }
          }
      });

      // Update elements with data-i18n-alt (for alt attributes)
      $('[data-i18n-alt]').each(function () {
          const key = $(this).data('i18n-alt');
          if (lang[key] !== undefined) {
              $(this).attr('alt', lang[key]);
          }
      });

      // Update elements with data-i18n-title (for title attributes)
      $('[data-i18n-title]').each(function () {
          const key = $(this).data('i18n-title');
          if (lang[key] !== undefined) {
              $(this).attr('title', lang[key]);
          }
      });

      // Update elements with data-i18n-placeholder (for placeholders)
      $('[data-i18n-placeholder]').each(function () {
          const key = $(this).data('i18n-placeholder');
          if (lang[key] !== undefined) {
              $(this).attr('placeholder', lang[key]);
          }
      });




  }
}