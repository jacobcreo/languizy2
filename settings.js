// Initialize Firebase Firestore
const db = firebase.firestore();

// Load User Profile Information
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loadUserProfile(user);
        loadUserAvatar(user); // Load avatar in the navbar
    } else {
        window.location.href = '/';
    }
});

// Load User Profile Data
function loadUserProfile(user) {
    const userRef = db.collection('users').doc(user.uid);

    userRef.get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            // Update profile image
            if (userData.photoURL) {
                document.getElementById('profileImage').src = userData.photoURL;
            }
            // Update email
            document.getElementById('userEmail').textContent = userData.email || 'user@example.com';
            // Update input fields
            document.getElementById('displayName').value = userData.displayName || '';
            document.getElementById('fullName').value = userData.fullName || '';
            document.getElementById('progressMail').checked = userData.progressMail || false;
            document.getElementById('marketingMail').checked = userData.marketingMail || false;
        } else {
            console.error('User data does not exist in Firestore');
        }
    }).catch((error) => {
        console.error('Error loading user profile:', error);
    });
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
        // Step 1: Disable offline persistence
        // await db.disableNetwork();
        // console.log("Offline persistence disabled for reset.");

        // Step 2: Delete fields from user document
        await userRef.update({
            currentCourse: firebase.firestore.FieldValue.delete(),
            totalPoints: firebase.firestore.FieldValue.delete()
        });
        console.log("User fields reset successfully.");

        // Step 3: Delete all sub-collections under the user document
        await deleteAllSubCollections(userRef);

        // Step 4: Clear local cache
        // await db.clearPersistence();
        // console.log("Local cache cleared.");

        // Step 5: Re-enable offline persistence
        // await db.enableNetwork();
        // console.log("Offline persistence re-enabled.");

        // Step 6: Hide the reset modal after successful deletion
        $('#resetModal').modal('hide');
        console.log("All user progress reset successfully.");

           // Step 7: Show the success modal
           $('#successModal').modal('show');

    } catch (error) {
        console.error("Error resetting user progress:", error);

        // Ensure network is re-enabled in case of error
        // try {
        //     await db.enableNetwork();
        //     console.log("Network re-enabled after error.");
        // } catch (networkError) {
        //     console.error("Error re-enabling network:", networkError);
        // }
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



// Function to show the reset confirmation modal
function showResetModal() {
    $('#resetModal').modal('show');
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
    debugger;
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
        marketingMail: document.getElementById('marketingMail').checked
    };

    userRef.update(updatedData)
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
