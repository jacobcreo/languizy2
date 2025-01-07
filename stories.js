// Initialize Firestore
const db = firebase.firestore();
let selectedCourse = null;
let maxFrequencySeen = 0;

let UIString = {
  'en': {
    'all_courses': 'All Courses',
    'practice_more_words': 'Practice More Words',
    'practice': 'Practice',
    'logout': 'Logout',
    'your_stories': 'Your Stories',
    'keep_practicing': 'Keep Practicing!',
    'you_need': 'You need to practice',
    'more_words': 'more words',
    'to_unlock': 'to unlock',
    'practice_morevocabulary': 'Practice more vocabulary',
    'locked': 'Locked',
    'read_story': 'Read Story',
    'free_user': 'Free',
    'pro_user': 'Pro',
  },
  'es': {
    'all_courses': 'Todos los cursos',
    'practice_more_words': 'Practica más palabras',
    'practice': 'Practica',
    'logout': 'Cerrar sesión',
    'your_stories': 'Tus historias',
    'keep_practicing': '¡Mantente practicando!',
    'you_need': 'Necesitas practicar',
    'more_words': 'más palabras',
    'to_unlock': 'para desbloquear',
    'practice_morevocabulary': 'Practica más vocabulario',
    'locked': 'Bloqueado',
    'read_story': 'Leer historia',
    'free_user': 'GRATIS',
    'pro_user': 'PRO',
  }
}

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

let interfaceLanguage = 'en';

// Load Stories for the user based on the current course

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

async function loadStories(user) {
  try {
    
    const userDocRef = db.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();

    populateSubLevelBadge(userDoc);

    // Fetch current course from the user's document
    var currentCourse = userDoc.data().currentCourse;

    // If the current course has been switched via the dropdown, override it
    if (selectedCourse && selectedCourse !== 'all') {
      currentCourse = selectedCourse;
    } else {
      selectedCourse = currentCourse;
    }

    if (!currentCourse) {
      console.error("No current course found for this user.");
      return;
    }

    console.log(`Current course: ${selectedCourse}`);

    // Fetch maxFrequency directly from the user's document under all-time stats
    let highestFrequency = await getMaxFrequency(userDocRef, selectedCourse);

    if (!highestFrequency) {
      console.log('No maxFrequency found, defaulting to 0');
      highestFrequency = 0;
      
    }

    maxFrequencySeen = highestFrequency;
    console.log(`Current maxFrequency: ${maxFrequencySeen}`);

    // Fetch the stories that match the user's current course and frequency
    const storiesRef = db.collection('stories')
      .where('language', '==', selectedCourse.split('-')[1])
      .where('knownLanguage', '==', selectedCourse.split('-')[0]);

    const storiesSnapshot = await storiesRef.get();

    // Fetch user's completed stories for the current course
    const completedStoriesSnapshot = await userDocRef
      .collection('stories')
      .doc(currentCourse)
      .collection(currentCourse)
      .get();

    // Create a Set of completed story IDs for quick lookup
    const completedStoryIds = new Set();
    completedStoriesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.finished) {
        completedStoryIds.add(doc.id);
      }
    });

    if (window.innerWidth <= 700) { // Check if screen width is 'sm' or less
      const style = document.createElement('style');
      style.innerHTML = `
        .card-img-top {
          height:100%;
        }
      `;
      document.head.appendChild(style);
    }

    const storiesList = document.getElementById('storiesList');
    storiesList.innerHTML = ''; // Clear the current list

    let storiesAvailable = false;
    const sortedStories = [];

    storiesSnapshot.forEach(doc => {
      const storyData = doc.data();
      const storyId = doc.id; // Retrieve the document ID

      const isAccessible = storyData.wordsRequired <= maxFrequencySeen;
      const isCompleted = completedStoryIds.has(storyId);

      sortedStories.push({ storyData, storyId, isAccessible, isCompleted });

      if (isAccessible) {
        storiesAvailable = true;
        console.log(`Story pulled: ${storyData.storyTitle} (Words required: ${storyData.wordsRequired})`);
      } else {
        console.log(`Story skipped (locked): ${storyData.storyTitle} (Words required: ${storyData.wordsRequired})`);
      }
    });

    // Sort stories by wordsRequired in ascending order
    sortedStories.sort((a, b) => a.storyData.wordsRequired - b.storyData.wordsRequired);

    // Remove existing alert if present
    const existingAlert = document.querySelector('.alert-dismissible');
    if (existingAlert) {
      existingAlert.remove();
    }

    // Find the first inaccessible story
    const firstInaccessibleStory = sortedStories.find(story => !story.isAccessible);
    if (firstInaccessibleStory) {
      const wordsNeeded = firstInaccessibleStory.storyData.wordsRequired - maxFrequencySeen;
      const alertHTML = `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>${UIString[interfaceLanguage].keep_practicing}</strong> ${UIString[interfaceLanguage].you_need} ${wordsNeeded} ${UIString[interfaceLanguage].more_words} ${UIString[interfaceLanguage].to_unlock} "<strong>${firstInaccessibleStory.storyData.storyTitle}</strong>".
          <a href="/practice.html" class="alert-link">${UIString[interfaceLanguage].practice_morevocabulary}</a>.
          <button type="button" class="btn-close" aria-label="Close"></button>
        </div>
      `;
      storiesList.insertAdjacentHTML('beforebegin', alertHTML);

      // Add event listener to close button
      const closeButton = document.querySelector('.btn-close');
      closeButton.addEventListener('click', () => {
        closeButton.parentElement.remove();
      });
    }

    // Append sorted stories to the DOM
    sortedStories.forEach(({ storyData, storyId, isAccessible, isCompleted }) => {
      const storyCard = createStoryCard(storyData, storyId, isAccessible, isCompleted);
      storiesList.appendChild(storyCard);
    });

    if (!storiesAvailable) {
      
    }

  } catch (error) {
    console.error("Error loading stories:", error);
  }
}

// Get maxFrequency from the user's all-time stats
async function getMaxFrequency(userDocRef, courseId) {
  const allTimeStatsRef = userDocRef.collection('courses').doc(courseId).collection('stats').doc('all-time');
  const allTimeStatsDoc = await allTimeStatsRef.get();

  if (allTimeStatsDoc.exists) {
    const allTimeData = allTimeStatsDoc.data();
    // Check if maxFrequency exists and return it; otherwise return 0
    return allTimeData.maxFrequency || 0;
  }

  // If no document or maxFrequency, return 0
  return 0;
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

// Create a Story Card Element
function createStoryCard(storyData, storyId, isAccessible, isCompleted) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'col-md-4 mb-4';

  // Determine which icon to display
  let statusIcon = '';
  if (isCompleted) {
    statusIcon = '<i class="fas fa-check-circle text-success ms-2" title="Completed"></i>';
  } else if (!isAccessible) {
    statusIcon = '<i class="fas fa-lock text-danger ms-2" title="Locked"></i>';
  }

  // If the story is not accessible, disable the Read Story button
  const readButton = isAccessible 
    ? `<a href="/story.html?storyId=${storyId}" class="btn btn-primary">${UIString[interfaceLanguage].read_story}</a>`
    : `<button class="btn btn-secondary" disabled>${UIString[interfaceLanguage].locked}</button>`;

  let storyImg = 'https://languizy.com/myimages/stories/'+storyData.knownLanguage + '-' + storyData.language + '-' + storyId + '.png' + '/public';

  const cardHTML = `
    <div class="card h-100">
      <img src=${storyImg} || 'default_story_image.jpg'}" class="card-img-top" alt="Story Image">
      <div class="card-body">
        <h5 class="card-title">${storyData.storyTitle}${statusIcon}</h5>
        <p class="card-text">Words required: ${storyData.wordsRequired}</p>
        <!-- <p class="card-text">storyId: ${storyId}</p> -->
      </div>
      <div class="card-footer">
      ${readButton}
      </div>
    </div>
  `;

  cardDiv.innerHTML = cardHTML;

  
  return cardDiv;
}




// Populate course selector
async function populateCourseSelector(user) {
  const userDocRef = db.collection('users').doc(user.uid);
  const coursesSnapshot = await userDocRef.collection('courses').get();
  const courseSelector = document.getElementById('courseSelector');
  courseSelector.innerHTML = ''; // Clear options

  // Add default "All Courses" option
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Courses';
  courseSelector.appendChild(allOption);

  coursesSnapshot.forEach(doc => {
    const courseData = doc.data();
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = `${courseData.knownLanguage.toUpperCase()} to ${courseData.targetLanguage.toUpperCase()}`;
    if (doc.id === selectedCourse) {
      option.selected = true;
    }
    courseSelector.appendChild(option);
  });
}

// Filter stories by course
function filterStoriesByCourse() {
  const selector = document.getElementById('courseSelector');
  selectedCourse = selector.value;
  console.log(`Switching to course: ${selectedCourse}`);
  loadStories(firebase.auth().currentUser); // Ensure the stories are reloaded
}

// Authentication state listener
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    loadUserAvatar(user);
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('courseId');
if (courseId) {
  selectedCourse = courseId;
}
    populateCourseSelector(user);
    loadStories(user);
  } else {
    window.location.href = '/';
  }
});


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