// Initialize Firebase Firestore
const db = firebase.firestore();
let currentCoachId = null;

// Firebase Authentication listener
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        fetchOrAssignCoach(user);
        loadUserAvatar(user); // Load user avatar in the navbar
    } else {
        window.location.href = 'login.html';
    }
});

// Fetch or assign the coach for the user
async function fetchOrAssignCoach(user) {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    // Check if the user has a coach assigned
    currentCoachId = userDoc.exists && userDoc.data().coach;
    if (!currentCoachId) {
        // If no coach is assigned, set a default coach
        currentCoachId = "ntRoVcqi2KNo6tvljdQ2"; // Default coach ID
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

            // Create a card for each coach
            const coachCard = $(`
                <div class="col">
                    <div class="card coach-card ${coachId === currentCoachId ? 'selected' : ''}" data-id="${coachId}">
                        <img src="assets/images/${coachData.image}" alt="${coachData.coachName}" class="card-img-top">
                        <div class="card-body">
                            <h5 class="coach-name">${coachData.coachName}</h5>
                            <p class="coach-description">${coachData.characterDescription}</p>
                        </div>
                    </div>
                </div>
            `);

            // Add click event listener to select the coach
            coachCard.on('click', () => selectCoach(coachId, coachData));

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

    try {
        // Update the user's coach in Firestore
        await userRef.update({ coach: coachId });

        // Update the UI to reflect the selection
        $('.coach-card').removeClass('selected');
        $(`.coach-card[data-id=${coachId}]`).addClass('selected');
        
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

// Logout function
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error("Logout failed: ", error);
    });
}
