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
        fetchOrAssignCoach(user);
        loadUserAvatar(user);  // Load user avatar in the navbar
    } else {
        window.location.href = 'login.html';
    }
});

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

// Fetch or assign the coach for the user
async function fetchOrAssignCoach(user) {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    // Check if the user has a coach assigned
    let coachId = userDoc.exists && userDoc.data().coach;
    if (!coachId) {
        // If no coach is assigned, set a default coach
        coachId = "ntRoVcqi2KNo6tvljdQ2"; // Default coach ID
        await userRef.update({ coach: coachId });
    }

    loadCurrentCoach(coachId);
}

// Load the current coach details
async function loadCurrentCoach(coachId) {
    try {
        const coachDoc = await db.collection('coaches').doc(coachId).get();
        if (coachDoc.exists) {
            const coachData = coachDoc.data();

            // Update the current coach section
            $('#currentCoachImage').attr('src', `assets/images/${coachData.image}`);
            $('#currentCoachImage').css('visibility', 'visible');
            $('#currentCoachName').text(coachData.coachName);
        }
    } catch (error) {
        console.error('Error loading current coach:', error);
    }
}

// Open the coach selection page
function openCoachSelection() {
    window.location.href = 'coach-selection.html'; // Modify the path as needed
}



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

        const todayDateStr = today.toLocaleDateString('en-CA');
        debugger;
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
    debugger;

    const today = new Date();
today.setHours(0, 0, 0, 0);
let tempStreak = 0;
let checkDate = new Date(today);
checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday

// Check if there is a continuous streak until yesterday
while (true) {
    const dateStr = checkDate.toLocaleDateString('en-CA');

    // Check if checkDate is in uniqueDates
    if (uniqueDates.find(d => d.toLocaleDateString('en-CA') === dateStr)) {
        // If the streak started, increment it
        tempStreak++;
        checkDate.setDate(checkDate.getDate() - 1); // Move to the previous day
    } else {
        // Break if no streak found for this day
        break;
    }
}

// Check if today is part of the streak
const streakExtendedToday = uniqueDates.some(d => d.toLocaleDateString('en-CA') === today.toLocaleDateString('en-CA'));

if (streakExtendedToday) {
    tempStreak++; // Include today in the streak count if practiced today
}

currentStreak = tempStreak;


    return { currentStreak, longestStreak, streakExtendedToday };
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
                
                // Case 1: No courses found for the user
                if (courseCount === 0) {
                    document.getElementById('trainingOptions').classList.add('hidden');  // Hide training options
                    document.getElementById('newUserOptions').classList.remove('hidden');  // Hide training options
                    
                    
                    
                    populateNewCoursesSelect(user); // New function call here

                } 
                
                // Case 2: Only 1 course available
                else if (courseCount === 1) {
                    document.getElementById('trainingOptions').classList.remove('hidden');  // Hide training options
                    document.getElementById('addAnotherCourseBox').classList.remove('hidden');  // Hide training options
                    switchCourseDropdown.style.display = 'none';  // Hide course switch option
                    loadTrainingOptions(currentCourse, user.uid, true);  // Load training options
                    populateAvailableCourses(user, currentCourse);  // Show available courses
                } 
                
                // Case 3: Multiple courses available
                else {
                    document.getElementById('trainingOptions').classList.remove('hidden');  // Hide training options
                    document.getElementById('addAnotherCourseBox').classList.remove('hidden');  // Hide training options
                    switchCourseDropdown.style.display = 'block';  // Show switch course option
                    loadSwitchCourses(currentCourse, user.uid);  // Show the switch course dropdown
                    loadTrainingOptions(currentCourse, user.uid, false);  // Load training options
                    populateAvailableCourses(user, currentCourse);  // Show available courses
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
    defaultOption.textContent = 'Select a Course to begin';
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

// New function to populate the newCoursesSelect dropdown for new users
function populateNewCoursesSelect(user) {
    
    const newCoursesSelect = document.getElementById('newCoursesSelect');
    newCoursesSelect.innerHTML = ''; // Clear previous options

    // Add default "Select new course" option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a Course to begin';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    newCoursesSelect.appendChild(defaultOption);

    // Get all available courses from the questions collection
    db.collection('questions')
        .get()
        .then((snapshot) => {
            const courses = new Set();

            snapshot.forEach((doc) => {
                const data = doc.data();
                const courseCombo = `${data.knownLanguage}-${data.language}`;
                courses.add(courseCombo);
            });

            // Populate the dropdown with all available courses (no filtering for enrolled courses)
            courses.forEach((course) => {
                const [knownLanguage, language] = course.split('-');
                const option = document.createElement('option');
                option.value = course;
                option.textContent = `${languageShorts[knownLanguage]} to ${languageShorts[language]}`;
                newCoursesSelect.appendChild(option);
            });

            if (newCoursesSelect.children.length === 1) { // Only default option is present
                const noCoursesOption = document.createElement('option');
                noCoursesOption.textContent = 'No courses available';
                noCoursesOption.disabled = true;
                newCoursesSelect.appendChild(noCoursesOption);
            }
        })
        .catch((error) => {
            console.error("Error fetching courses:", error);
        });

    // Add event listener for course selection
    newCoursesSelect.addEventListener('change', () => {
        const selectedCourse = newCoursesSelect.value;
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
    const continueCourseAlert = document.getElementById('continueCourseAlert');

    // Only proceed if the buttons exist
    if (storiesBtn && grammarBtn && chatBtn && continueCourseBtn && continueCourseAlert) {

        continueCourseAlert.innerHTML = `${getFlagIcons(currentCourse)} Continue ${languageShorts[knownLanguage]} to ${languageShorts[language]} Training`; 
        continueCourseAlert.style.display = 'block';
        // Display course name and flags on the continue button (for both single and multiple courses)
        // continueCourseBtn.innerHTML = `${getFlagIcons(currentCourse)} Continue ${languageShorts[knownLanguage]} to ${languageShorts[language]} Training`;
        // continueCourseBtn.style.display = 'block';

        continueCourseBtn.onclick = function() {
            window.location.href = `practice.html?courseId=${currentCourse}`;
        };
        statsBtn.disabled = false;
        statsBtn.onclick = function() {
            window.location.href = `stats.html`;
        };
        vocabBtn.disabled = false;
        vocabBtn.onclick = function() {
            window.location.href = `vocabulary.html`;
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
                        window.location.href = `grammar-topics.html`;
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
