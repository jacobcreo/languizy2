// Initialize Firebase Firestore
const db = firebase.firestore();

// Firebase Authentication listener
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loadHeadline(user);
        loadStreak(user);
        loadCourses(user);
    } else {
        window.location.href = 'login.html';
    }
});

// Load daily headline based on current date
function loadHeadline(user) {
    const today = new Date();
    const todayString = today.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    db.collection('headlines').where('date', '==', todayString)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const headlineData = doc.data();
                    document.getElementById('headline').textContent = headlineData.headline;
                });
            } else {
                document.getElementById('headline').textContent = "Have a great day learning!";
            }
        })
        .catch((error) => {
            console.error("Error fetching headline: ", error);
        });
}

// Load current streak data
function loadStreak(user) {
    db.collection('users').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            document.getElementById('streakCount').textContent = `${userData.currentStreak || 0} Days in a Row`;
        } else {
            console.log("No user data found");
        }
    }).catch((error) => {
        console.error("Error fetching streak: ", error);
    });
}

// Load available courses for the user
function loadCourses(user) {
    const courseDropdown = document.getElementById('courseDropdown');

    db.collection('users').doc(user.uid).collection('courses')
        .get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const courseData = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${courseData.knownLanguage} to ${courseData.targetLanguage}`;
                courseDropdown.appendChild(option);
            });
        })
        .catch((error) => {
            console.error("Error fetching courses: ", error);
        });

    // Handle course selection
    courseDropdown.addEventListener('change', () => {
        const selectedCourse = courseDropdown.value;
        if (selectedCourse !== 'Select a Course') {
            window.location.href = `practice.html?courseId=${selectedCourse}`;
        }
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
