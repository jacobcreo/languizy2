// Initialize Firebase Firestore
const db = firebase.firestore();

const languageShorts = {
    'en' : 'English',
    'de' : 'German',
    'fr' : 'French',
    'it' : 'Italian',
    'es' : 'Spanish',
    'us' : 'English',
    'uk' : 'English',
    'ru' : 'Russian',
    'cn' : 'Chinese',
    'pt' : 'Portuguese',
    'nl' : 'Dutch'
};


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

// Load current streak data and update UI based on whether the streak was extended today
async function loadStreak(user) {
    try {
        const userDocRef = db.collection('users').doc(user.uid);
        const coursesSnapshot = await userDocRef.collection('courses').get();

        if (coursesSnapshot.empty) {
            console.warn('No courses found for this user.');
            document.getElementById('streakCount').textContent = "0 Days in a Row";
            return;
        }

        let datesSet = new Set();

        // Iterate through each course and collect dates when the user practiced
        for (const courseDoc of coursesSnapshot.docs) {
            const statsRef = userDocRef.collection('courses').doc(courseDoc.id).collection('stats');
            const statsSnapshot = await statsRef.get();

            statsSnapshot.forEach(doc => {
                const dateId = doc.id;
                if (dateId !== 'all-time') {
                    datesSet.add(dateId); // Store all dates the user practiced
                }
            });
        }

        // Calculate streaks
        const streakInfo = calculateStreaks(Array.from(datesSet));
        const currentStreak = streakInfo.currentStreak;

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset hours to compare dates accurately

        const todayDateStr = today.toISOString().split('T')[0];

        // Determine if the streak was extended today
        const streakExtendedToday = datesSet.has(todayDateStr);

        // Calculate time left to extend the streak (until midnight)
        const now = new Date();
        const midnight = new Date(today.getTime() + 24 * 60 * 60 * 1000); // Midnight of the next day
        const hoursLeft = Math.floor((midnight - now) / (60 * 60 * 1000)); // Remaining hours

        // Update streak display
        document.getElementById('streakCount').textContent = `${currentStreak || 0} Days in a Row`;

        // Update flame color based on whether the streak was extended today
        const flameIcon = document.querySelector('.fa-fire');
        const messageElement = document.getElementById('streakMessage');
        flameIcon.style.color = streakExtendedToday ? 'orange' : 'white';

        // Display additional message
        if (streakExtendedToday) {
            messageElement.innerHTML = `<i class="fas fa-check-circle text-success"></i> Streak extended today!`;
        } else {
            messageElement.innerHTML = `<i class="fas fa-exclamation-triangle text-danger"></i> ${hoursLeft} hours left to extend your streak!`;
        }

    } catch (error) {
        console.error("Error fetching streak: ", error);
        document.getElementById('streakCount').textContent = "0 Days in a Row";
    }
}

// Reuse the same streak calculation function from stats screen
function calculateStreaks(dates) {
    if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const dateObjects = dates.map(dateStr => new Date(dateStr));
    dateObjects.sort((a, b) => a - b);

    const uniqueDates = Array.from(new Set(dateObjects.map(d => d.toDateString()))).map(d => new Date(d));

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
        const diffTime = uniqueDates[i] - uniqueDates[i - 1];
        const diffDays = diffTime / (24 * 60 * 60 * 1000);

        if (diffDays === 1) {
            currentStreak++;
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
        } else {
            currentStreak = 1;
        }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let tempStreak = 0;
    let checkDate = new Date(today);

    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (uniqueDates.find(d => d.toISOString().split('T')[0] === dateStr)) {
            tempStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    currentStreak = tempStreak;

    return { currentStreak, longestStreak };
}



// Function to get flag icons based on the course
function getFlagIcons(currentCourse) {
    const courseToFlags = {
        'en-de': ['assets/icons/en-flag.png', 'assets/icons/de-flag.png'],
        'en-es': ['assets/icons/en-flag.png', 'assets/icons/es-flag.png'],
        'en-fr': ['assets/icons/en-flag.png', 'assets/icons/fr-flag.png'],
        'en-it': ['assets/icons/en-flag.png', 'assets/icons/it-flag.png'],
        'en-ru': ['assets/icons/en-flag.png', 'assets/icons/ru-flag.png'],
        'en-cn': ['assets/icons/en-flag.png', 'assets/icons/cn-flag.png'],        
        'en-pt': ['assets/icons/en-flag.png', 'assets/icons/pt-flag.png'],
        'en-nl': ['assets/icons/en-flag.png', 'assets/icons/nl-flag.png'],
        // Add more courses and their corresponding flags here
    };

    const flags = courseToFlags[currentCourse];
    if (flags) {
        return flags.map(flagSrc => `<img src="${flagSrc}" alt="Flag" width="24" class="me-2">`).join('');
    } else {
        console.warn(`No flags found for course: ${currentCourse}`);
        return '';
    }
}


// Load available courses for the user
function loadCourses(user) {
    const courseDropdown = document.getElementById('courseDropdown');
    const trainingOptions = document.getElementById('trainingOptions');
    const switchCourseDropdown = document.getElementById('switchCourseDropdown');
    const addCourseSelect = document.getElementById('addCourseSelect');
    let currentCourse;

    // Get current user course if exists
    db.collection('users').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            currentCourse = doc.data().currentCourse;
        }

        // Get user's courses
        db.collection('users').doc(user.uid).collection('courses').get()
            .then((snapshot) => {
                const courseCount = snapshot.size;
                if (courseCount === 0) {
                    // Case 1: No courses selected yet
                    courseDropdown.style.display = 'block';
                    populateAvailableCourses(user, currentCourse);
                } else if (courseCount === 1) {
                    // Case 2: Only 1 course available
                    courseDropdown.style.display = 'none';
                    loadTrainingOptions(currentCourse, user.uid, true);
                    populateAvailableCourses(user, currentCourse);
                } else {
                    // Case 3: Multiple courses available
                    switchCourseDropdown.style.display = 'block';
                    loadSwitchCourses(currentCourse, user.uid);
                    loadTrainingOptions(currentCourse, user.uid, false);
                    populateAvailableCourses(user, currentCourse);
                }
            });
    });
}

function populateAvailableCourses(user, currentCourse) {
    const addCourseSelect = document.getElementById('addCourseSelect');
    addCourseSelect.innerHTML = ''; // Clear previous options

    // Add default "Select new course" option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select new course';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    addCourseSelect.appendChild(defaultOption);

    // Get unique courses from the questions collection
    db.collection('questions')
        .get()
        .then((snapshot) => {
            const courses = new Set();

            snapshot.forEach((doc) => {
                const data = doc.data();
                const courseCombo = `${data.knownLanguage}-${data.language}`;
                courses.add(courseCombo);
            });

            // Get user's enrolled courses
            db.collection('users').doc(user.uid).collection('courses').get()
                .then((userCoursesSnap) => {
                    const userCourses = new Set();
                    userCoursesSnap.forEach((doc) => {
                        const userCourse = `${doc.data().knownLanguage}-${doc.data().targetLanguage}`;
                        userCourses.add(userCourse);
                    });

                    // Populate the dropdown with available courses that the user isn't enrolled in
                    courses.forEach((course) => {
                        if (!userCourses.has(course)) {
                            const [knownLanguage, language] = course.split('-');
                            const option = document.createElement('option');
                            option.value = course;
                            // Use languageShorts to convert the codes to full language names
                            option.textContent = `${languageShorts[knownLanguage]} to ${languageShorts[language]}`;
                            addCourseSelect.appendChild(option);
                        }
                    });

                    if (addCourseSelect.children.length === 1) { // Only default option is present
                        const noCoursesOption = document.createElement('option');
                        noCoursesOption.textContent = 'No new courses available';
                        noCoursesOption.disabled = true;
                        addCourseSelect.appendChild(noCoursesOption);
                    }
                });
        })
        .catch((error) => {
            console.error("Error fetching courses:", error);
        });

    // Add event listener for course selection
    addCourseSelect.addEventListener('change', () => {
        const selectedCourse = addCourseSelect.value;
        if (selectedCourse) {
            window.location.href = `practice.html?courseId=${selectedCourse}`;
        }
    });
}


function loadTrainingOptions(currentCourse, userId) {
    const [knownLanguage, language] = currentCourse.split('-');
    
    // Safeguard: Ensure these elements exist before accessing their properties
    const storiesBtn = document.getElementById('storiesBtn');
    const grammarBtn = document.getElementById('grammarBtn');
    const chatBtn = document.getElementById('chatBtn');
    const continueCourseBtn = document.getElementById('continueCourseBtn');

    // Only proceed if the buttons exist
    if (storiesBtn && grammarBtn && chatBtn && continueCourseBtn) {
        // Display course name and flags on the continue button (for both single and multiple courses)
        continueCourseBtn.innerHTML = `${getFlagIcons(currentCourse)} Continue ${languageShorts[knownLanguage]} to ${languageShorts[language]} Training`;
        continueCourseBtn.style.display = 'block';

        continueCourseBtn.onclick = function() {
            window.location.href = `practice.html?courseId=${currentCourse}`;
        };

        // Check stories availability and set navigation
        db.collection('stories')
            .where('knownLanguage', '==', knownLanguage)
            .where('language', '==', language)
            .get()
            .then((storySnap) => {
                if (!storySnap.empty) {
                    storiesBtn.disabled = false;
                    storiesBtn.onclick = function() {
                        window.location.href = `stories.html?courseId=${currentCourse}`;
                    };
                }
            });

        // Check grammar availability and set navigation
        db.collection('grammar')
            .where('knownLanguage', '==', knownLanguage)
            .where('language', '==', language)
            .get()
            .then((grammarSnap) => {
                if (!grammarSnap.empty) {
                    grammarBtn.disabled = false;
                    grammarBtn.onclick = function() {
                        window.location.href = `grammar.html?courseId=${currentCourse}`;
                    };
                }
            });

        // Check chat availability and set navigation
        db.collection('chat')
            .where('knownLanguage', '==', knownLanguage)
            .where('language', '==', language)
            .get()
            .then((chatSnap) => {
                if (!chatSnap.empty) {
                    chatBtn.disabled = false;
                    chatBtn.onclick = function() {
                        window.location.href = `chat.html?courseId=${currentCourse}`;
                    };
                }
            });

        // Ensure that training options are visible
        document.getElementById('trainingOptions').style.display = 'block';
    } else {
        console.error("Training buttons or continue button not found in the DOM.");
    }
}







function loadSwitchCourses(currentCourse, userId) {
    const switchCourseSelect = document.getElementById('switchCourseSelect');

    db.collection('users').doc(userId).collection('courses').get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                if (doc.id !== currentCourse) {
                    const option = document.createElement('option');
                    option.value = doc.id;
                    // Use languageShorts to convert language codes to full names
                    option.textContent = `${languageShorts[doc.data().knownLanguage]} to ${languageShorts[doc.data().targetLanguage]}`;
                    switchCourseSelect.appendChild(option);
                }
            });
        });

    // Handle course switching
    switchCourseSelect.addEventListener('change', () => {
        const selectedCourse = switchCourseSelect.value;
        if (selectedCourse) {
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
