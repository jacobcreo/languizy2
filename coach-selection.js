// Initialize Firebase Firestore
const db = firebase.firestore();
let currentCoachId = null;
let subLevel = null;

// List of free coach names
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
        const isFreeCoach = freeCoachNames.includes(coachData.coachName);
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

            const isFreeCoach = freeCoachNames.includes(coachData.coachName);
            const isLocked = subLevel !== 'Pro' && !isFreeCoach;

            // Create a card for each coach
            const coachCard = $(`
                <div class="col">
                    <div class="card coach-card ${coachId === currentCoachId ? 'selected' : ''} ${isLocked ? 'locked' : ''}" data-id="${coachId}">
                        <div class="card-img-container">
                            <img src="assets/images/${coachData.image}" alt="${coachData.coachName}" class="card-img-top">
                            ${isLocked ? '<div class="lock-overlay"><i class="fas fa-lock"></i></div>' : ''}
                        </div>
                        <div class="card-body">
                            <h5 class="coach-name">${coachData.coachName}</h5>
                            <p class="coach-description">${coachData.characterDescription}</p>
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

            // If the coach is currently selected, display in selected coach section
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

    // Check if the coach is locked (redundant but safe)
    const isFreeCoach = freeCoachNames.includes(coachData.coachName);
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
    $('#selectedCoachImage').attr('src', `assets/images/${coachData.image}`);
    $('#selectedCoachName').text(coachData.coachName);
    $('#selectedCoachDescription').text(coachData.characterDescription);
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
