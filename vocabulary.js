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

// Global variables to store stats
let vocabularyData = [];
const TOTAL_WORDS = 10000; // Simulated total vocabulary size for Language Familiarity and Fluency calculations

// Firebase Authentication listener
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    loadCourses(user);
  } else {
    window.location.href = 'login.html';
  }
});

// Load courses the user has practiced
// Load courses the user has practiced
function loadCourses(user) {
  const courseDropdown = document.getElementById('courseDropdown');
  
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
    const targetLanguageCode = selectedText.split(' to ')[1]; // Extract the target language code
    const targetLanguage = languageMap[targetLanguageCode] || targetLanguageCode;

    // Ensure the elements exist before modifying them
    const familiarityTitle = document.getElementById('familiarityTitle');
    const fluencyTitle = document.getElementById('fluencyTitle');

    if (familiarityTitle && fluencyTitle) {
        familiarityTitle.textContent = `${targetLanguage} Familiarity`;
        fluencyTitle.textContent = `${targetLanguage} Fluency`;
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
    window.location.href = 'login.html';
  });
}
