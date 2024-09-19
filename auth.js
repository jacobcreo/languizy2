// auth.js

// Initialize Firebase Authentication
var auth = firebase.auth();

// Google Sign-In
function googleLogin() {
  var provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      console.log('Google Sign-In successful:', result.user);
      saveUserData(result.user);
      window.location.href = 'course_selection.html';
    })
    .catch(error => {
      console.error('Google Sign-In error:', error);
    });
}

// Save user data to Firestore
function saveUserData(user) {
  var userRef = db.collection('users').doc(user.uid);
  userRef.set({
    email: user.email,
    displayName: user.displayName,
    lastLogin: firebase.firestore.Timestamp.now()
  }, { merge: true })
  .then(() => {
    console.log('User data saved successfully');
  })
  .catch(error => {
    console.error('Error saving user data:', error);
  });
}

// Logout function
function logout() {
  auth.signOut().then(() => {
    window.location.href = 'login.html';
  });
}
