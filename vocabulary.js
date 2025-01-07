// Initialize Firebase Firestore
const db = firebase.firestore();

// Mapping language codes to full language names
const languageMap = {
    "de": "German",
    "fr": "French",
    "es": "Spanish",
    "it": "Italian",
    "nl": "Dutch",
    "sv": "Swedish",
    "no": "Norwegian",
    "dk": "Danish",
    "ru": "Russian",
    "jp": "Japanese",
    "cn": "Chinese",
    "in": "Hindi",
    "us": "English",
    "en" : "English",
    "br": "Portuguese",
    "eg": "Arabic",
    "ar" : "Arabic",
    "tr": "Turkish",
    "pt": "Portuguese"
};

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
        'word': 'Word',
        'lastSeen': 'Last Seen',
        'correct': 'Correct',
        'incorrect': 'Incorrect',
        'accuracy': 'Accuracy',
        'logout': 'Logout',
        'vocabulary': 'Vocabulary',
        'selectACourse': 'Select a course',
        'wordsSeen': 'Words Seen',
        'wordsKnown': 'Words Known',
        'familiarity': 'Familiarity',
        'fluency': 'Fluency',
        'languageFluency': '{0} Fluency',
        'languageFamiliarity': '{0} Familiarity'
    },
    'es': {
        'word': 'Palabra',
        'lastSeen': 'Última Vez',
        'correct': 'Correcto',
        'incorrect': 'Incorrecto',
        'accuracy': 'Precisión',
        'logout': 'Cerrar sesión',
        'vocabulary': 'Vocabulario',
        'selectACourse': 'Selecciona un curso',
        'wordsSeen': 'Palabras Vistas',
        'wordsKnown': 'Palabras Conocidas',
        'familiarity': 'Familiaridad',
        'fluency': 'Fluidez',
        'languageFluency': '{0} Fluidez',
        'languageFamiliarity': 'Conocimiento del {0}'
    }
}

// Global variables to store stats
let vocabularyData = [];
const TOTAL_WORDS = 10000; // Simulated total vocabulary size for Language Familiarity and Fluency calculations

// Firebase Authentication listener
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    loadUserAvatar(user);
    loadCourses(user);
  } else {
    window.location.href = '/';
  }
});

async function populateSubLevelBadge(userDoc) {
  const subLevel = userDoc.data().subLevel;
  const subLevelBadge = document.getElementById('subLevelBadge');
  subLevelBadge.textContent = subLevel;  // Set the badge based on userLevel
  if (subLevel === 'Free') {
    subLevelBadge.textContent = 'FREE';
    subLevelBadge.className = 'badge bg-secondary';
    subLevelBadge.onclick = function() {
      window.location.href = '/course_selection.html?upgrade=true';
    };
  } else {
    subLevelBadge.textContent = 'PRO';
    subLevelBadge.className = 'badge bg-danger';
    subLevelBadge.onclick = null; // No action on click for PRO
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
          populateSubLevelBadge(doc);
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

// Load courses the user has practiced
function loadCourses(user) {
  const courseDropdown = document.getElementById('courseDropdown');
  const urlParams = new URLSearchParams(window.location.search);
  const urlCourse = urlParams.get('course');
  let defaultCourseSet = false;

  db.collection('users').doc(user.uid).collection('courses').get().then((snapshot) => {
    snapshot.forEach((doc) => {
      const courseData = doc.data();
      
      // Use the languageMap to convert knownLanguage and targetLanguage to full names
      const knownLanguageName = languageMap[courseData.knownLanguage] || courseData.knownLanguage;
      const targetLanguageName = languageMap[courseData.targetLanguage] || courseData.targetLanguage;

      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${knownLanguageName} to ${targetLanguageName}`;
      courseDropdown.appendChild(option);

      // Check if the course from the URL is available and set it as default
      if (urlCourse && doc.id === urlCourse && !defaultCourseSet) {
        option.selected = true;
        defaultCourseSet = true;
        document.getElementById('statsCards').style.display = 'flex';
        loadVocabulary(user, urlCourse);
        updateCardTitles(urlCourse);
      }
    });
  });

  courseDropdown.addEventListener('change', () => {
    const selectedCourse = courseDropdown.value;
    if (selectedCourse !== 'Select a course') {
      document.getElementById('statsCards').style.display = 'flex';
      loadVocabulary(user, selectedCourse);
      updateCardTitles(selectedCourse);
    }
  });
}

// Load vocabulary words from progress collection and questions collection
function loadVocabulary(user, courseId) {
  const tableBody = document.getElementById('vocabularyTable').querySelector('tbody');
  tableBody.innerHTML = ''; // Clear previous data

  vocabularyData = []; // Clear any previously loaded data

  const userProgressRef = db.collection('users').doc(user.uid).collection('courses').doc(courseId).collection('progress');
  const questionsRef = db.collection('questions');

  userProgressRef.get().then((snapshot) => {
    let totalCorrect = 0;
    let totalWordsKnown = 0;

    snapshot.forEach((progressDoc) => {
      const progressData = progressDoc.data();
      const questionId = progressDoc.id;

      questionsRef.doc(questionId).get().then((questionDoc) => {
        if (questionDoc.exists) {
          const questionData = questionDoc.data();
          const word = questionData.missingWord;

          // Store the data in the vocabularyData array for sorting
          vocabularyData.push({
            word: word,
            lastSeen: progressData.lastAnswered.toDate(),
            correct: progressData.timesCorrect || 0,
            incorrect: progressData.timesIncorrect || 0,
            accuracy: calculateAccuracy(progressData.timesCorrect, progressData.timesIncorrect)
          });

          // Calculate words known and correct answers
          totalCorrect += progressData.timesCorrect || 0;
          if (progressData.timesCorrect > 0 && progressData.timesIncorrect === 0) {
            totalWordsKnown += 1;
          }

          // After fetching all words, render the table
          if (vocabularyData.length === snapshot.size) {
            renderTable(vocabularyData);

            // Update the stats cards
            updateStatsCards({
              wordsSeen: vocabularyData.length,
              wordsKnown: totalWordsKnown,
              totalCorrect: totalCorrect
            });
          }
        }
      });
    });
  });
}

function updateStatsCards({ wordsSeen, wordsKnown, totalCorrect }) {
    // Ensure all elements exist before updating them
    const wordsSeenEl = document.getElementById('wordsSeen');
    const wordsKnownEl = document.getElementById('wordsKnown');
    const familiarityEl = document.getElementById('familiarityPercentage');
    const fluencyEl = document.getElementById('fluencyPercentage');
  
    if (wordsSeenEl && wordsKnownEl && familiarityEl && fluencyEl) {
      wordsSeenEl.textContent = wordsSeen;
      wordsKnownEl.textContent = wordsKnown;
  
      const familiarityPercentage = ((wordsSeen / TOTAL_WORDS) * 100).toFixed(2);
      familiarityEl.textContent = `${familiarityPercentage}%`;
  
      const fluencyPercentage = ((wordsKnown / TOTAL_WORDS) * 100).toFixed(2);
      fluencyEl.textContent = `${fluencyPercentage}%`;
    } else {
      console.error('One or more stats card elements not found');
    }
  }
  

  function updateCardTitles(courseId) {

    const courseDropdown = document.getElementById('courseDropdown');
    const selectedText = courseDropdown.options[courseDropdown.selectedIndex].textContent;

    // Extract targetLanguage from the selected course
    const targetLanguageCode = courseId.split('-')[1]; // Extract the target language code
    const targetLanguage = languageMap[targetLanguageCode] || targetLanguageCode;

    // Ensure the elements exist before modifying them
    const familiarityTitle = document.getElementById('familiarityTitle');
    const fluencyTitle = document.getElementById('fluencyTitle');

    if (familiarityTitle && fluencyTitle) {
        familiarityTitle.textContent = localize('languageFamiliarity', interfaceLanguage, languageShorts[interfaceLanguage][targetLanguageCode] || "Language")
        
        fluencyTitle.textContent = localize('languageFluency', interfaceLanguage, languageShorts[interfaceLanguage][targetLanguageCode] || "Language")
        
    } else {
        console.error('Familiarity or Fluency title element not found');
    }
}

  

function renderTable(data) {
    const tableBody = document.getElementById('vocabularyTable').querySelector('tbody');
    tableBody.innerHTML = ''; // Clear the table
  
    data.forEach((item) => {
      const row = document.createElement('tr');
  
      // Word
      const wordCell = document.createElement('td');
      wordCell.textContent = item.word;
  
      // Last Seen
      const lastSeenCell = document.createElement('td');
      lastSeenCell.textContent = new Date(item.lastSeen).toLocaleDateString();
  
      // Correct
      const correctCell = document.createElement('td');
      correctCell.textContent = item.correct;
  
      // Incorrect
      const incorrectCell = document.createElement('td');
      incorrectCell.textContent = item.incorrect;
  
      // Accuracy (hidden sortable value)
      const accuracyCell = document.createElement('td');
      
      // Add data-sort attribute for sorting
      accuracyCell.setAttribute('data-sort', item.accuracy); // Hidden numeric value for sorting
      
      // Create the visual accuracy bar
      const accuracyBar = createAccuracyBar(item.accuracy);
      accuracyCell.appendChild(accuracyBar);
  
      // Append cells to the row
      row.appendChild(wordCell);
      row.appendChild(lastSeenCell);
      row.appendChild(correctCell);
      row.appendChild(incorrectCell);
      row.appendChild(accuracyCell);
  
      // Append row to the table body
      tableBody.appendChild(row);
    });
  
    // Reinitialize DataTables for sorting after the table is updated
    $('#vocabularyTable').DataTable().destroy();  // Destroy previous initialization
    $('#vocabularyTable').DataTable({             // Reinitialize DataTables
      order: [[0, 'asc']],                         // Default sorting by the first column
      responsive: true
    });
}

// Calculate accuracy percentage
function calculateAccuracy(correct, incorrect) {
  const total = correct + incorrect;
  return total > 0 ? (correct / total) * 100 : 0;
}

// Create a visual accuracy bar
function createAccuracyBar(accuracyPercentage) {
  const accuracyBar = document.createElement('div');
  accuracyBar.className = 'accuracy-bar';

  const accuracyBarFill = document.createElement('div');
  accuracyBarFill.className = 'accuracy-bar-fill';
  accuracyBarFill.style.width = `${accuracyPercentage}%`;

  accuracyBar.appendChild(accuracyBarFill);
  return accuracyBar;
}

// Handle logout functionality
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = '/';
  });
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

/**
 * Retrieves and formats a localized string based on the key and language.
 *
 * @param {string} key - The key for the desired string in UIString.
 * @param {string} language - The interface language code (e.g., 'en', 'es').
 * @param {...any} args - Values to replace placeholders in the template.
 * @returns {string} - The formatted, localized string.
 */
function localize(key, language, ...args) {
  debugger;
  let template = UIString[language][key];
  
  if (!template) {
    console.warn(`Missing translation for key: "${key}" in language: "${language}". Falling back to English.`);
    // Fallback to English if translation is missing
    template = UIString['en'][key] || key;
  }
  
  return template.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] !== 'undefined' ? args[number] : match;
  });
}