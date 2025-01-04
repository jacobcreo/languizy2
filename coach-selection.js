// Initialize Firebase Firestore
const db = firebase.firestore();
let currentCoachId = null;
let subLevel = null;

// List of free coach names (in English)
const freeCoachNames = [
  'Old-School British Boarding School Teacher',
  'Royal Queen',
  'Pirate Captain',
  'Drill Sergeant',
  'Surfer Dude'
];

// Firebase Authentication listener
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    fetchOrAssignCoach(user);
    loadUserAvatar(user); // Load user avatar in the navbar
  } else {
    window.location.href = '/';
  }
});

async function populateSubLevelBadge(userDoc) {
  subLevel = userDoc.data().subLevel;
  const subLevelBadge = document.getElementById('subLevelBadge');
  subLevelBadge.textContent = subLevel;  // Set the badge based on subLevel
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

/**
 * Helper: getEnglishString(fieldData)
 *
 * - If the doc is old-structure, fieldData might be just a string:  "Pirate Captain"
 * - If the doc is new-structure, fieldData might be an object like: { en: "Pirate Captain", es: "Capitán Pirata" }
 * - We want to reliably get the English version (or fallback to the original string if old).
 */
function getEnglishString(fieldData) {
  if (!fieldData) return "";
  // Old structure => string
  if (typeof fieldData === 'string') {
    return fieldData;
  }
  // New structure => object with subkeys like { en: "Royal Queen", es: "Reina Real" }
  if (typeof fieldData === 'object' && fieldData.en) {
    return fieldData.en;
  }
  // Fallback
  return "";
}

/**
 * Helper: getDisplayString(fieldData, defaultLang = 'en')
 *
 * - For displaying to the user in English or fallback to old-structure if not found
 * - If you eventually want to display in user’s interfaceLanguage, you can adapt similarly
 */
function getDisplayString(fieldData, defaultLang = 'en') {
  if (!fieldData) return "";
  if (typeof fieldData === 'string') {
    // old structure => plain string
    return fieldData;
  }
  if (typeof fieldData === 'object') {
    // new structure => check if we have .en
    return fieldData[defaultLang] || "";
  }
  return "";
}

// Fetch or assign the coach for the user
async function fetchOrAssignCoach(user) {
  const userRef = db.collection('users').doc(user.uid);
  const userDoc = await userRef.get();
  await populateSubLevelBadge(userDoc);

  // Check if the user has a coach assigned
  currentCoachId = userDoc.exists && userDoc.data().coach;
  if (!currentCoachId) {
    // If no coach is assigned, set a default coach
    currentCoachId = "ntRoVcqi2KNo6tvljdQ2"; // Default coach ID
    await userRef.update({ coach: currentCoachId });
  }

  // Check if the current coach is allowed for the user's subLevel
  const coachRef = db.collection('coaches').doc(currentCoachId);
  const coachDoc = await coachRef.get();

  if (coachDoc.exists) {
    const coachData = coachDoc.data();
    // Extract the English name for free-coach detection
    const coachNameEnglish = getEnglishString(coachData.coachName);
    const isFreeCoach = freeCoachNames.includes(coachNameEnglish);
    const isLocked = subLevel !== 'Pro' && !isFreeCoach;

    if (isLocked) {
      // If the current coach is locked for the user, assign the default coach
      currentCoachId = 'ntRoVcqi2KNo6tvljdQ2'; // Default coach ID
      await userRef.update({ coach: currentCoachId });
    }
  } else {
    // Coach does not exist, assign default coach
    currentCoachId = 'ntRoVcqi2KNo6tvljdQ2'; // Default coach ID
    await userRef.update({ coach: currentCoachId });
  }

  loadCoaches();
}

// Load all coaches from Firestore and display them
async function loadCoaches() {
  const coachGrid = $('#coachGrid');
  try {
    const coachesSnapshot = await db.collection('coaches').get();
    coachGrid.empty();

    coachesSnapshot.forEach((doc) => {
      const coachData = doc.data();
      const coachId = doc.id;

      // We get the English name to check if it's in the freeCoachNames
      const coachNameEnglish = getEnglishString(coachData.coachName);
      const isFreeCoach = freeCoachNames.includes(coachNameEnglish);
      const isLocked = subLevel !== 'Pro' && !isFreeCoach;

      // For display: pick English or old structure
      const displayName = getDisplayString(coachData.coachName, 'en');
      const displayDescription = getDisplayString(coachData.characterDescription, 'en');

      // Build a card for each coach
      const coachCard = $(`
        <div class="col">
          <div class="card coach-card ${coachId === currentCoachId ? 'selected' : ''} ${isLocked ? 'locked' : ''}" data-id="${coachId}">
            <div class="card-img-container">
              <img src="assets/images/${coachData.image}" alt="${displayName}" class="card-img-top">
              ${isLocked ? '<div class="lock-overlay"><i class="fas fa-lock"></i></div>' : ''}
            </div>
            <div class="card-body">
              <h5 class="coach-name">${displayName}</h5>
              <p class="coach-description">${displayDescription}</p>
            </div>
          </div>
        </div>
      `);

      if (!isLocked) {
        // Add click event listener to select the coach
        coachCard.on('click', () => selectCoach(coachId, coachData));
      } else {
        // Add click event listener to show the upgrade modal
        coachCard.on('click', () => showUpgradeModal());
      }

      // Append coach card to the grid
      coachGrid.append(coachCard);

      // If the coach is currently selected, display in "selected coach" section
      if (coachId === currentCoachId) {
        displaySelectedCoach(coachData);
      }
    });
    $("#mainContainer").show();
  } catch (error) {
    console.error('Error loading coaches:', error);
  }
}

// Select a coach and update Firestore
async function selectCoach(coachId, coachData) {
  const user = firebase.auth().currentUser;
  const userRef = db.collection('users').doc(user.uid);

  // Check if the coach is locked (re-check for safety)
  const coachNameEnglish = getEnglishString(coachData.coachName);
  const isFreeCoach = freeCoachNames.includes(coachNameEnglish);
  const isLocked = subLevel !== 'Pro' && !isFreeCoach;

  if (isLocked) {
    alert('This coach is available only for Pro users. Upgrade to Pro to unlock this coach.');
    return;
  }

  try {
    // Update the user's coach in Firestore
    await userRef.update({ coach: coachId });

    // Update the UI to reflect the selection
    $('.coach-card').removeClass('selected');
    $(`.coach-card[data-id='${coachId}']`).addClass('selected');
    
    currentCoachId = coachId; // Update the current coach ID

    // Update the selected coach section
    displaySelectedCoach(coachData);
  } catch (error) {
    console.error('Error selecting coach:', error);
  }
}

// Display the selected coach in the dedicated section
function displaySelectedCoach(coachData) {
  // For display, again we show English or fallback if needed
  const displayName = getDisplayString(coachData.coachName, 'en');
  const displayDescription = getDisplayString(coachData.characterDescription, 'en');

  $('#selectedCoachImage').attr('src', `assets/images/${coachData.image}`);
  $('#selectedCoachName').text(displayName);
  $('#selectedCoachDescription').text(displayDescription);
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
        const fallbackLetter = (displayName.charAt(0).toUpperCase() || email.charAt(0).toUpperCase()) || '?';
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

// Logout function
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = '/';
  }).catch((error) => {
    console.error("Logout failed: ", error);
  });
}

// Function to show the upgrade modal
function showUpgradeModal() {
  const upgradeModal = new bootstrap.Modal(document.getElementById('upgradeModal'));
  upgradeModal.show();
}

// Function to redirect to the upgrade URL
function redirectToUpgrade() {
  window.location.href = '/course_selection.html?upgrade=true';
}
