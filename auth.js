// auth.js

// Initialize Firebase Authentication
var auth = firebase.auth();

// Google Sign-In
function googleLogin() {
  var provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      console.log('Google Sign-In successful:', result.user);
      debugger;
      saveUserData(result.user);  // Save the user data, including the profile image
      window.location.href = 'course_selection.html';
    })
    .catch(error => {
      console.error('Google Sign-In error:', error);
    });
}

function saveUserData(user) {
  var userRef = db.collection('users').doc(user.uid);

  // Get the current user's data from Firestore
  userRef.get().then((doc) => {
    if (doc.exists) {
      
      const userData = doc.data();
      const storedPhotoURL = userData.photoURL;  // Get the stored photoURL
      
      // Check if the stored photoURL is different from the current Google photoURL
      if (user.photoURL && (!storedPhotoURL || storedPhotoURL !== user.photoURL)) {
        
        // If photoURL has changed, update the Firestore document
        userRef.update({
          photoURL: user.photoURL,  // Update the photoURL in Firestore
          lastLogin: firebase.firestore.Timestamp.now()  // Update the lastLogin timestamp
        }).then(() => {
          console.log('Profile photo updated in Firestore.');
        }).catch((error) => {
          console.error('Error updating profile photo:', error);
        });
      } else {
        // No need to update the photoURL, just update lastLogin
        userRef.update({
          lastLogin: firebase.firestore.Timestamp.now()
        });
      }
    } else {
      // If the document doesn't exist (new user), create it with the photoURL
      userRef.set({
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,  // Set the photoURL for the new user
        lastLogin: firebase.firestore.Timestamp.now()
      }).then(() => {
        console.log('New user data saved successfully with profile photo.');
      }).catch((error) => {
        console.error('Error saving new user data:', error);
      });
    }
  }).catch((error) => {
    console.error('Error fetching user data from Firestore:', error);
  });
}


// Logout function
function logout() {
  auth.signOut().then(() => {
    window.location.href = 'login.html';
  });
}
