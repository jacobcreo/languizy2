// Initialize Firebase Firestore
const db = firebase.firestore();

const languageShorts = {
    'en': 'English',
    'de': 'German',
    'fr': 'French',
    'it': 'Italian',
    'es': 'Spanish',
    'us': 'English',
    'uk': 'English',
    'ru': 'Russian',
    'cn': 'Chinese',
    'pt': 'Portuguese',
    'nl': 'Dutch'
};

// Firebase Authentication listener
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loadHeadline(user);
        loadStreak(user);
        fetchOrAssignCoach(user);
        loadUserAvatar(user); // Load user avatar in the navbar
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                populateModalCourses(user); // Populate modal with course options
                const currentCourse = doc.data().currentCourse;
                if (currentCourse) {
                    loadCardData(user, currentCourse);
                    loadTrainingOptions(currentCourse, user.uid);
                }
            }
        });
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

// Fetch or assign the coach for the user
async function fetchOrAssignCoach(user) {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    let coachId = userDoc.exists && userDoc.data().coach;
    if (!coachId) {
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
    window.location.href = 'coach-selection.html';
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
        today.setHours(0, 0, 0, 0);

        const todayDateStr = today.toLocaleDateString('en-CA');

        // Determine if the streak was extended today
        const streakExtendedToday = datesSet.has(todayDateStr);

        // Calculate time left to extend the streak (until midnight)
        const now = new Date();
        const midnight = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const hoursLeft = Math.floor((midnight - now) / (60 * 60 * 1000));

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let tempStreak = 0;
    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
        const dateStr = checkDate.toLocaleDateString('en-CA');
        if (uniqueDates.find(d => d.toLocaleDateString('en-CA') === dateStr)) {
            tempStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    const streakExtendedToday = uniqueDates.some(d => d.toLocaleDateString('en-CA') === today.toLocaleDateString('en-CA'));

    if (streakExtendedToday) {
        tempStreak++;
    }

    currentStreak = tempStreak;

    return { currentStreak, longestStreak, streakExtendedToday };
}

// Function to get flag icons based on the course
function getFlagIcons(currentCourse) {
    const [knownLanguage, language] = currentCourse.split('-');
    const flagIcons = `
        <img src="assets/icons/${knownLanguage}-flag.png" alt="${languageShorts[knownLanguage]} Flag" width="24" class="me-2">
        <i class="fas fa-arrow-right me-2"></i>
        <img src="assets/icons/${language}-flag.png" alt="${languageShorts[language]} Flag" width="24" class="me-2">
    `;
    return flagIcons;
}

function loadTrainingOptions(currentCourse, userId) {
    const [knownLanguage, language] = currentCourse.split('-');

    const storiesBtn = document.getElementById('storiesBtn');
    const grammarBtn = document.getElementById('learnGrammarBtn');
    const chatBtn = document.getElementById('chatBtn');
    const continueCourseBtn = document.getElementById('learnVocabBtn');
    const continueCourseAlert = document.getElementById('continueCourseAlert');

    if (storiesBtn && grammarBtn && chatBtn && continueCourseBtn && continueCourseAlert) {

        continueCourseAlert.innerHTML = `${getFlagIcons(currentCourse)} Continue ${languageShorts[knownLanguage]} to ${languageShorts[language]} Training`;
        continueCourseAlert.style.display = 'block';

        continueCourseBtn.onclick = function () {
            window.location.href = `practice.html?courseId=${currentCourse}`;
        };
        document.getElementById('statsBtn').disabled = false;
        document.getElementById('statsBtn').onclick = function () {
            window.location.href = 'stats.html';
        };
        document.getElementById('vocabBtn').disabled = false;
        document.getElementById('vocabBtn').onclick = function () {
            window.location.href = 'vocabulary.html';
        };

        // Check stories availability and set navigation
        db.collection('stories')
            .where('knownLanguage', '==', knownLanguage)
            .where('language', '==', language)
            .get()
            .then((storySnap) => {
                if (!storySnap.empty) {
                    storiesBtn.disabled = false;
                    storiesBtn.onclick = function () {
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
                    grammarBtn.onclick = function () {
                        window.location.href = 'grammar-topics.html';
                    };
                }
            });

        // Chat
        chatBtn.disabled = false;
        chatBtn.onclick = function () {
            window.location.href = `chat.html?courseId=${currentCourse}`;
        };

        document.getElementById('trainingOptions').style.display = 'block';
    } else {
        console.error("Training buttons or continue button not found in the DOM.");
    }
}

// Logout function
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error("Logout failed: ", error);
    });
}

// Function to populate the modal with course options
function populateModalCourses(user) {
    const courseList = document.getElementById('courseList');
    const searchInput = document.getElementById('searchCourseInput');
    const selectButton = document.getElementById('modalSelectCourseBtn');

    let coursesData = [];

    db.collection('questions')
        .get()
        .then((snapshot) => {
            const courses = new Set();

            snapshot.forEach((doc) => {
                const data = doc.data();
                const courseCombo = `${data.knownLanguage}-${data.language}`;
                courses.add(courseCombo);
            });

            coursesData = Array.from(courses).sort();

            renderCourseList(coursesData);

            if (coursesData.length === 0) {
                courseList.innerHTML = '<p>No courses available</p>';
            }
        })
        .catch((error) => {
            console.error("Error fetching courses:", error);
        });

    let selectedCourse = null;

    function renderCourseList(courses) {
        courseList.innerHTML = '';

        courses.forEach((course) => {
            const [knownLanguage, language] = course.split('-');
            const item = document.createElement('div');
            item.classList.add('list-group-item', 'course-item', 'cursor-pointer');
            item.dataset.course = course;

            const courseText = `${languageShorts[knownLanguage]} to ${languageShorts[language]}`;

            item.innerHTML = `
                <div class="d-flex align-items-center">
                    ${getFlagIcons(course)} <span>${courseText}</span>
                </div>
            `;

            item.addEventListener('click', () => {
                document.querySelectorAll('.course-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                selectedCourse = course;
                selectButton.disabled = false;
            });

            courseList.appendChild(item);
        });
    }

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredCourses = coursesData.filter(course => {
            const [knownLanguage, language] = course.split('-');
            const courseText = `${languageShorts[knownLanguage]} to ${languageShorts[language]}`.toLowerCase();
            return courseText.includes(searchTerm);
        });

        renderCourseList(filteredCourses);
    });

    selectButton.addEventListener('click', () => {
        if (selectedCourse) {
            db.collection('users').doc(user.uid).update({
                currentCourse: selectedCourse
            }).then(() => {
                const modalElement = document.getElementById('courseModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();
                window.location.reload();
            }).catch((error) => {
                console.error("Error setting current course:", error);
            });
        }
    });
}

// Function to load data for the cards
function loadCardData(user, currentCourse) {
    const courseParts = currentCourse.split('-');
    const targetLanguageCode = courseParts[1];
    const targetLanguage = languageShorts[targetLanguageCode] || targetLanguageCode;
    document.getElementById('currentCourseName').textContent = `${languageShorts[courseParts[0]]} to ${languageShorts[courseParts[1]]}`;
    document.getElementById('currentCourseFlag').src = `assets/icons/${targetLanguageCode}-flag.png`;

    // Vocabulary Percentage
    db.collection('users').doc(user.uid).collection('courses').doc(currentCourse).collection('stats').doc('all-time').get()
        .then((doc) => {
            if (doc.exists) {
                const maxFrequency = doc.data().maxFrequency || 0;
                const vocabPercentage = Math.min((maxFrequency / 10000) * 100, 100).toFixed(2);
                document.getElementById('vocabPercentage').textContent = `${vocabPercentage}%`;
                document.getElementById('vocabProgress').style.width = `${vocabPercentage}%`;
                document.getElementById('vocabProgress').setAttribute('aria-valuenow', vocabPercentage);
            }
        })
        .catch((error) => {
            console.error("Error fetching vocabulary stats:", error);
        });

    // Grammar Percentage
    db.collection('users').doc(user.uid).collection('grammar').doc(currentCourse).get()
        .then((doc) => {
            if (doc.exists) {
                const maxTopic = doc.data().maxTopic || 1;
                const grammarPercentage = Math.min(((maxTopic - 1) / 200) * 100, 100).toFixed(2);
                document.getElementById('grammarPercentage').textContent = `${grammarPercentage}%`;
                document.getElementById('grammarProgress').style.width = `${grammarPercentage}%`;
                document.getElementById('grammarProgress').setAttribute('aria-valuenow', grammarPercentage);
            }
        })
        .catch((error) => {
            console.error("Error fetching grammar stats:", error);
        });

    // Chat Topics Percentage
    db.collection('users').doc(user.uid).collection('chat').doc(currentCourse).collection('completedChats').get()
        .then((snapshot) => {
            const completedChats = snapshot.size;
            const chatPercentage = Math.min((completedChats / 200) * 100, 100).toFixed(2);
            document.getElementById('chatPercentage').textContent = `${chatPercentage}%`;
            document.getElementById('chatProgress').style.width = `${chatPercentage}%`;
            document.getElementById('chatProgress').setAttribute('aria-valuenow', chatPercentage);
        })
        .catch((error) => {
            console.error("Error fetching chat stats:", error);
        });

    // Stories Completed Percentage (Placeholder)
    const totalStories = 100;
    const storiesCompleted = 0;
    const storiesPercentage = Math.min((storiesCompleted / totalStories) * 100, 100).toFixed(2);
    document.getElementById('storiesPercentage').textContent = `${storiesPercentage}%`;
    document.getElementById('storiesProgress').style.width = `${storiesPercentage}%`;
    document.getElementById('storiesProgress').setAttribute('aria-valuenow', storiesPercentage);

    // Stories Button Functionality
    document.getElementById('storiesBtn').addEventListener('click', () => {
        window.location.href = 'stories.html';
    });
}
