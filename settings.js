// Initialize Firebase Firestore
const db = firebase.firestore();
let userSubLevel = ''; // Declare a variable to hold subLevel

// Load User Profile Information
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loadUserProfile(user);
        loadUserAvatar(user); // Load avatar in the navbar
    } else {
        window.location.href = '/';
    }
});

async function populateSubLevelBadge(userData) {
    const subLevel = userData.subLevel;
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

// Load User Profile Data
function loadUserProfile(user) {
    const userRef = db.collection('users').doc(user.uid);

    userRef.get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            // Update subscription level
            const subLevel = userData.subLevel || 'Free';
            const currentPlan = userData.currentSubscription?.plan || '';
            const subscriptionStatus = userData.currentSubscription?.status || '';
            const startDate = userData.currentSubscription?.startDate?.toDate().toLocaleDateString() || '';
            const nextBillingDate = userData.currentSubscription?.nextBillingDate?.toDate().toLocaleDateString() || '';
            const canceledDate = userData.currentSubscription?.canceledDate?.toDate().toLocaleDateString() || '';

            populateSubLevelBadge(userData);

            // Update Subscription Card
            updateSubscriptionCard(userData);

            // Get the avatar element in the navbar
            const profileImage = document.getElementById('profileImage');

            if (userData.photoURL) {
                // If photoURL exists, display the user's profile image
                profileImage.innerHTML = `<img src="${userData.photoURL}" alt="User Avatar" class="img-fluid rounded-circle" width="100" height="100">`;
            } else {
                // If no photoURL, create a circle with initials
                const fallbackLetter = userData.displayName.charAt(0).toUpperCase() || userData.email.charAt(0).toUpperCase();
                profileImage.innerHTML = `<div class="profileImage-circle">${fallbackLetter}</div>`;
            }

            userSubLevel = userData.subLevel || 'Free';

            // Update user name
            const displayName = userData.displayName;
            const fullName = userData.fullName;
            const email = userData.email || 'user@example.com';
            const userName = displayName || fullName || email.split('@')[0] || 'User Name';
            document.getElementById('userName').textContent = userName;

            // Update email
            document.getElementById('userEmail').textContent = email;
            // Update input fields
            document.getElementById('displayName').value = displayName || '';
            document.getElementById('fullName').value = fullName || '';
            document.getElementById('progressMail').checked = userData.progressMail || false;
            document.getElementById('marketingMail').checked = userData.marketingMail || false;
            document.getElementById('coachFeedback').checked = userData.CoachFeedback !== undefined ? userData.CoachFeedback : true;

        } else {
            console.error('User data does not exist in Firestore');
        }
    }).catch((error) => {
        console.error('Error loading user profile:', error);
    });
}

function updateSubscriptionCard(userData) {
    const subLevel = userData.subLevel || 'Free';
    const currentPlan = userData.currentSubscription?.plan || '';
    const subscriptionStatus = userData.currentSubscription?.status || '';
    const startDate = userData.currentSubscription?.startDate?.toDate().toLocaleDateString() || '';
    const nextBillingDate = userData.currentSubscription?.nextBillingDate?.toDate().toLocaleDateString() || '';
    const canceledDate = userData.currentSubscription?.canceledDate?.toDate().toLocaleDateString() || '';

    const subscriptionLevel = document.getElementById('subscriptionLevel');
    const subscriptionBenefits = document.getElementById('subscriptionBenefits');
    const upgradeButton = document.getElementById('upgradeButton');
    const cancelButton = document.getElementById('cancelButton');
    const manageButton = document.getElementById('manageButton');
    const subscriptionInfo = document.getElementById('subscriptionInfo');
    const subscriptionIcon = document.getElementById('subscriptionIcon');

    if (subLevel === 'Pro') {
        // Update Subscription Level:
        subscriptionLevel.textContent = 'Pro';

        // Update Benefits
        subscriptionBenefits.textContent = `You are subscribed to the ${currentPlan}. Enjoy unlimited access to all features!`;

        
        // Show Cancel and Manage Buttons
        if (subscriptionStatus !== 'canceled') {
        cancelButton.classList.remove('d-none');
        }
        manageButton.classList.remove('d-none');
        upgradeButton.classList.add('d-none');

        // Update Subscription Icon
        subscriptionIcon.className = 'fa-solid fa-circle-check me-2';
        subscriptionIcon.style.color = '#28a745'; // Green color for Pro

        if (subscriptionStatus === 'canceled') {
        // Populate Subscription Info
        subscriptionInfo.innerHTML = `
        <strong>Subscribed since:</strong> ${startDate}<br>
        <strong>Subscription expires on:</strong> ${nextBillingDate}
        `;
            
        } else {


        // Populate Subscription Info
        subscriptionInfo.innerHTML = `
            <strong>Subscribed since:</strong> ${startDate}<br>
            <strong>Next Billing Date:</strong> ${nextBillingDate}
        `;
        }
        subscriptionInfo.classList.remove('d-none');
    } else {
        // Update Subscription Level
        subscriptionLevel.textContent = 'Free';

        // Update Benefits
        subscriptionBenefits.textContent = 'Enjoy limited access to daily exercises and stories. Upgrade to Pro for unlimited access and more features!';

        // Show Upgrade Button
        upgradeButton.classList.remove('d-none');
        cancelButton.classList.add('d-none');
        manageButton.classList.add('d-none');

        // Update Subscription Icon
        subscriptionIcon.className = 'fa-solid fa-circle-notch me-2';
        subscriptionIcon.style.color = '#6c757d'; // Gray color for Free

        // Hide Subscription Info
        subscriptionInfo.classList.add('d-none');
    }
    if (!cancelButton.classList.contains('d-none')) {
        cancelButton.onclick = cancelSubscription;
    }

    if (!manageButton.classList.contains('d-none')) {
        manageButton.onclick = manageSubscription;
    }
    if (!upgradeButton.classList.contains('d-none')) {
        upgradeButton.onclick = upgradeSubscription;
    }
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

// Show the reset confirmation modal
function showResetModal() {
    $('#resetModal').modal('show');
}

// Reset user progress
async function resetProgress() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const userRef = db.collection('users').doc(user.uid);

    // Disable reset button and cancel button, show progress bar
    document.getElementById('confirmResetButton').disabled = true;
    document.getElementById('cancelResetButton').disabled = true;
    document.getElementById('progressContainer').style.display = 'block';

    try {
        // Step 1: Update user document to reset progress
        await userRef.update({
            currentCourse: firebase.firestore.FieldValue.delete(),
            totalPoints: firebase.firestore.FieldValue.delete()
        });
        console.log("User fields reset successfully.");

        // Step 2: Delete all sub-collections under the user document
        await deleteAllSubCollections(userRef);

        // Step 3: Hide the reset modal after successful deletion
        $('#resetModal').modal('hide');
        console.log("All user progress reset successfully.");

        // Step 4: Show the success modal
        $('#successModal').modal('show');

    } catch (error) {
        console.error("Error resetting user progress:", error);
    } finally {
        // Re-enable buttons and hide progress bar after completion
        document.getElementById('confirmResetButton').disabled = false;
        document.getElementById('cancelResetButton').disabled = false;
        document.getElementById('progressContainer').style.display = 'none';
    }
}

// Function to recursively delete all sub-collections and their documents
async function deleteAllSubCollections(docRef) {
    // List all known sub-collection names that could exist under the user document
    const subCollectionNames = ['courses', 'progress', 'stats', 'stories']; // Add any other sub-collections here

    for (const subCollectionName of subCollectionNames) {
        const subCollectionRef = docRef.collection(subCollectionName);
        console.log(`Deleting documents in sub-collection: ${subCollectionName}`);

        // Fetch and delete documents in this sub-collection in batches
        while (true) {
            const snapshot = await subCollectionRef.limit(500).get(); // Fetch a batch of up to 500 docs

            if (snapshot.empty) {
                break; // Break loop if no documents are left
            }

            for (const doc of snapshot.docs) {
                // Recursively delete nested sub-collections
                await deleteAllSubCollections(doc.ref);

                // Delete the document itself
                await doc.ref.delete();
                console.log(`Deleted document ${doc.id} from ${subCollectionName} collection.`);
            }
        }
        console.log(`${subCollectionName} collection deleted successfully.`);
    }
}

// Logout function
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = '/';
    }).catch((error) => {
        console.error("Logout failed: ", error);
    });
}

document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveProfileChanges();
});

function saveProfileChanges() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const userRef = db.collection('users').doc(user.uid);

    const updatedData = {
        displayName: document.getElementById('displayName').value.trim(),
        fullName: document.getElementById('fullName').value.trim(),
        progressMail: document.getElementById('progressMail').checked,
        marketingMail: document.getElementById('marketingMail').checked,
        CoachFeedback: document.getElementById('coachFeedback').checked // Add Coach Feedback

    };

    userRef.update(updatedData).then(() => {
        // After updating the profile, call the sendToLoops function
        return sendToLoops(updatedData, user);
    })
    .then(() => {
        alert('Profile updated successfully.');
        // Optionally, reload the profile to reflect changes
        loadUserProfile(user);
    })
    .catch((error) => {
        console.error('Error updating profile:', error);
        alert('Error updating profile: ' + error.message);
    });
}

function sendToLoops(updatedData, user) {
    const sendToLoopsData = {
        email: user.email,
        userId: user.uid,
        firstName: updatedData.displayName || '',
        progressMail: updatedData.progressMail,
        marketingMail: updatedData.marketingMail,
        subLevel: userSubLevel || 'Free' // Include subLevel
    };
  
    return fetch('https://us-central1-languizy2.cloudfunctions.net/updateUserProfile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendToLoopsData),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(text);
          });
        }
        return response.text();
      })
      .then((data) => {
        console.log('sendToLoops response:', data);
      })
      .catch((error) => {
        console.error('Error calling sendToLoops:', error);
      });
}

// Function to cancel subscription
function cancelSubscription() {
    gtag('event', 'cancel_subscription', {
        'event_category': 'Subscription',
        'event_label': 'User started cancellation process'
    });

    // Redirect the user to the FastSpring account page
    window.location.href = 'https://languizy.test.onfastspring.com/account/';
}

// Function to cancel subscription
function manageSubscription() {
    gtag('event', 'manage_subscription', {
        'event_category': 'Subscription',
        'event_label': 'User clicked manage subscription button'
    });

    // Redirect the user to the FastSpring account page
    window.location.href = 'https://languizy.test.onfastspring.com/account/';
}

function upgradeSubscription() {
    window.location.href = '/course_selection.html?upgrade=true';
}