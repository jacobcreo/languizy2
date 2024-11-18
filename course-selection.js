// Initialize Firebase Firestore
const db = firebase.firestore();
let languageLearned = '';

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
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        checkReg(user);
        await loadHeadline(user);
        await loadStreak(user);
        await fetchOrAssignCoach(user);
        await loadUserAvatar(user); // Load user avatar in the navbar
        db.collection('users').doc(user.uid).get().then(async (doc) => {
            if (doc.exists) {
                populateModalCourses(user); // Populate modal with course options
                const currentCourse = doc.data().currentCourse;
                if (currentCourse) {
                    await loadCardData(user, currentCourse);
                    loadTrainingOptions(currentCourse, user.uid);
                } else {
                    showCourseModal(user);
                }
            }
        });
    } else {
        window.location.href = '/';
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
                const fallbackLetter = (displayName.charAt(0) || email.charAt(0)).toUpperCase();
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
        console.log(`Assigned default coach ID: ${coachId} to user ${user.uid}`);
    } else {
        console.log(`Fetched existing coach ID: ${coachId} for user ${user.uid}`);
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
            console.log(`Loaded coach details for coach ID: ${coachId}`);
            document.querySelector('#CurrentCoachCard .fill-effect').style.animation = 'none';
        } else {
            console.error(`Coach with ID ${coachId} does not exist.`);
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
async function loadHeadline(user) {
    const today = new Date();
    const todayString = today.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    try {
        const querySnapshot = await db.collection('headlines').where('date', '==', todayString).get();
        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                const headlineData = doc.data();
                document.getElementById('headline').textContent = headlineData.headline;
                console.log(`Loaded headline for date ${todayString}: ${headlineData.headline}`);
            });
        } else {
            document.getElementById('headline').textContent = "Have a great day learning!";
            console.log(`No headline found for date ${todayString}. Using default message.`);
        }
        document.querySelector('#headlineCard .fill-effect').style.animation = 'none';

        
    } catch (error) {
        console.error("Error fetching headline: ", error);
    }
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
        document.getElementById('streakCount').textContent = `${currentStreak || 0} Days`;

        // Update flame color based on whether the streak was extended today
        const flameIcon = document.querySelector('.fa-fire');
        const messageElement = document.getElementById('streakMessage');
        flameIcon.style.color = streakExtendedToday ? 'orange' : 'gray';

        // Display additional message
        if (streakExtendedToday) {
            messageElement.innerHTML = `<i class="fas fa-check-circle text-success"></i> Streak extended today!`;
            console.log(`Streak extended today for user ${user.uid}. Current streak: ${currentStreak} Days.`);
        } else {
            messageElement.innerHTML = `<i class="fas fa-exclamation-triangle text-danger"></i> ${hoursLeft} hours left to extend your streak!`;
            console.log(`Streak not extended today for user ${user.uid}. ${hoursLeft} hours left to extend.`);
        }
        document.querySelector('#CurrentStreakCard .fill-effect').style.animation = 'none';


    } catch (error) {
        console.error("Error fetching streak: ", error);
        document.getElementById('streakCount').textContent = "0 Days";
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

    // Set up button actions
    continueCourseBtn.onclick = function () {
        window.location.href = `practice.html?courseId=${currentCourse}`;
    };
    document.getElementById('statsBtn').disabled = false;
    document.getElementById('statsBtn').onclick = function () {
        window.location.href = 'stats.html';
    };
    document.getElementById('vocabBtn').disabled = false;
    document.getElementById('vocabBtn').onclick = function () {
        window.location.href = 'vocabulary.html?course=' + currentCourse;
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
                console.log(`Stories available for course ${currentCourse}. Enabled Stories button.`);
            } else {
                console.log(`No stories available for course ${currentCourse}. Stories button remains disabled.`);
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
                console.log(`Grammar topics available for course ${currentCourse}. Enabled Grammar button.`);
            } else {
                console.log(`No grammar topics available for course ${currentCourse}. Grammar button remains disabled.`);
            }
        });

    // Chat
    chatBtn.disabled = false;
    chatBtn.onclick = function () {
        window.location.href = `chat.html?courseId=${currentCourse}`;
    };
    console.log(`Enabled Chat button for course ${currentCourse}.`);
}

// Logout function
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = '/';
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
                console.log(`Selected course: ${courseText}`);
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
                // Fire the gtag event and simulate waiting for it to complete
                return new Promise((resolve) => {
                    gtag('event', 'Course Selection', {
                        'user_id': user.uid,
                        'course': selectedCourse
                    });
                    // Simulate a delay to ensure gtag has time to process
                    setTimeout(resolve, 500); // Adjust the timeout as needed
                });
            }).then(() => {
                const modalElement = document.getElementById('courseModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();
                console.log(`Updated current course to ${selectedCourse} for user ${user.uid}. Reloading page.`);
                window.location.reload();
            }).catch((error) => {
                console.error("Error setting current course:", error);
            });
        }
    });
}

function showCourseModal(user) {
    const modalElement = document.getElementById('courseModal');
    const modalInstance = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
    });
    modalInstance.show();
    gtag('event', 'Course Selection Modal Launch', {
        'user_id': user.uid
    });
}


// **New Function: Calculate Recommendation**
function calculateRecommendation(vocab, grammar, stories, chat) {
    // Initialize variables to determine recommendation
    let recommendation = null;
    let reason = '';

    // Check if all categories are 0%
    if (vocab === 0 && grammar === 0 && stories === 0 && chat === 0) {
        recommendation = {
            name: 'Vocabulary',
            buttonColor: 'success',
            buttonId: 'learnVocabBtn',
            icon: 'fas fa-book'
        };
        reason = 'All your progress areas are at zero. Starting with vocabulary will help you build a strong foundation.';
        console.log(`Recommendation Reason: All categories are at 0%. Recommending Vocabulary to initiate your learning journey.`);
        return { recommendation, reason };
    }

    // Define the precedence order
    const categories = [
        { name: 'Vocabulary', value: vocab, buttonColor: 'success', buttonId: 'learnVocabBtn', icon: 'fas fa-book' },
        { name: 'Grammar', value: grammar, buttonColor: 'info', buttonId: 'learnGrammarBtn', icon: 'fas fa-pencil-alt' },
        { name: 'Stories', value: stories, buttonColor: 'secondary', buttonId: 'storiesBtn', icon: 'fas fa-book-open' },
        { name: 'Chat', value: chat, buttonColor: 'warning', buttonId: 'chatBtn', icon: 'fas fa-comments' }
    ];

    // Function to determine if a category should be recommended based on 2% advantage
    const shouldRecommend = (current, others) => {
        return others.every(other => (current.value - other.value) >= 2);
    };

    // Iterate through categories based on precedence
    for (let i = 0; i < categories.length; i++) {
        const current = categories[i];
        const others = categories.filter((_, index) => index !== i);
        if (shouldRecommend(current, others)) {
            recommendation = current;
            reason = `${current.name} progress is ahead of other areas by at least 2%, ensuring a balanced advancement in your learning.`;
            console.log(`Recommendation Reason: ${current.name} has a 2% or more advantage over all other categories.`);
            return { recommendation, reason };
        }
    }

    // If no category has a 2% advantage, proceed with weighted random selection
    // Apply constraints:
    // - Don't recommend Stories until Grammar and Vocabulary have at least 0.5%
    // - Don't recommend Chat until Grammar, Vocabulary, and Stories have at least 1%
    let eligibleCategories = [];

    // Always eligible: Vocabulary and Grammar
    eligibleCategories.push({ name: 'Vocabulary', weight: 60, buttonColor: 'success', buttonId: 'learnVocabBtn', icon: 'fas fa-book' });
    eligibleCategories.push({ name: 'Grammar', weight: 30, buttonColor: 'info', buttonId: 'learnGrammarBtn', icon: 'fas fa-pencil-alt' });

    // Stories eligibility
    if (grammar >= 0.5 && vocab >= 0.5) {
        eligibleCategories.push({ name: 'Stories', weight: 10, buttonColor: 'secondary', buttonId: 'storiesBtn', icon: 'fas fa-book-open' });
    }

    // Chat eligibility
    if (grammar >= 1 && vocab >= 1 && stories >= 1) {
        // Adjust weights if Chat is eligible
        // Let's assume Chat gets an additional 5% weight, reducing Stories to 5%
        // To maintain total weight at 100%
        eligibleCategories = eligibleCategories.map(cat => {
            if (cat.name === 'Vocabulary') return { ...cat, weight: 55 };
            if (cat.name === 'Grammar') return { ...cat, weight: 25 };
            if (cat.name === 'Stories') return { ...cat, weight: 5 };
            return cat;
        });
        eligibleCategories.push({ name: 'Chat', weight: 15, buttonColor: 'warning', buttonId: 'chatBtn', icon: 'fas fa-comments' });
    }

    // Calculate total weight
    const totalWeight = eligibleCategories.reduce((sum, cat) => sum + cat.weight, 0);

    // Generate a random number between 0 and totalWeight
    const rand = Math.random() * totalWeight;

    let cumulative = 0;
    for (let cat of eligibleCategories) {
        cumulative += cat.weight;
        if (rand <= cumulative) {
            recommendation = cat;
            reason = `Based on your current progress, focusing on ${cat.name} will help you maintain a balanced learning path.`;
            console.log(`Recommendation Reason: No category has a 2% advantage. Randomly selected ${cat.name} based on weighted probabilities.`);
            return { recommendation, reason };
        }
    }

    // Fallback to Vocabulary if something goes wrong
    recommendation = {
        name: 'Vocabulary',
        buttonColor: 'success',
        buttonId: 'learnVocabBtn',
        icon: 'fas fa-book'
    };
    reason = 'Defaulting to Vocabulary to ensure you have a strong foundation.';
    console.log(`Recommendation Reason: Fallback to Vocabulary due to unexpected conditions.`);
    return { recommendation, reason };
}

// **New Function: Update Recommendation Card**
function updateRecommendationCard(recommendationObj) {
    const { recommendation, reason } = recommendationObj;
    const recommendationText = document.getElementById('recommendationText');
    const recommendationBtn = document.getElementById('recommendationBtn');

    // Personalize the recommendation message based on the category
    let message = '';
    switch (recommendation.name) {
        case 'Vocabulary':
            message = "Building a robust vocabulary is essential for effective communication. Let's enhance your word knowledge!";
            break;
        case 'Grammar':
            message = "Understanding grammar rules will help you construct sentences accurately. Let's delve into grammar!";
            break;
        case 'Stories':
            message = "Reading stories can improve your comprehension and contextual understanding. Let's explore some engaging stories!";
            break;
        case 'Chat':
            message = "Engaging in conversations will boost your speaking and listening skills. Let's start chatting!";
            break;
        default:
            message = "Let's continue your learning journey!";
    }

    recommendationText.textContent = message;

    // Update button color and icon
    recommendationBtn.className = `btn btn-${recommendation.buttonColor}`;
    recommendationBtn.innerHTML = `<i class="${recommendation.icon} me-2"></i> Go to ${recommendation.name}`;
    recommendationBtn.style.visibility = 'visible';

    // Add click event to navigate to the relevant section
    recommendationBtn.onclick = () => {
        switch (recommendation.name) {
            case 'Vocabulary':
                window.location.href = 'practice.html';
                break;
            case 'Grammar':
                window.location.href = 'grammar-topics.html';
                break;
            case 'Stories':
                window.location.href = 'stories.html';
                break;
            case 'Chat':
                window.location.href = 'chat.html';
                break;
            default:
                console.warn('Unknown recommendation category');
        }
    };
    
    document.querySelector('#CurrentRecommendationCard .fill-effect').style.animation = 'none';

    console.log(`Recommendation Updated: ${recommendation.name} - ${reason}`);
}

// Function to load data for the cards
async function loadCardData(user, currentCourse) {
    const courseParts = currentCourse.split('-');
    const targetLanguageCode = courseParts[1];
    const targetLanguage = languageShorts[targetLanguageCode] || targetLanguageCode;
    document.getElementById('currentCourseName').textContent = `${languageShorts[courseParts[0]]} to ${languageShorts[courseParts[1]]}`;
    document.getElementById('currentCourseFlag').src = `assets/icons/${targetLanguageCode}-flag.png`;
    document.getElementById('currentCourseFlag').style.visibility = 'visible';
    
    
    document.querySelector('#CurrentCourseCard .fill-effect').style.animation = 'none';


    // Initialize variables to store percentages
    let vocabPercentage = 0;
    let grammarPercentage = 0;
    let chatPercentage = 0;
    let storiesPercentage = 0;

    try {
        // Create promises for each category
        const vocabPromise = db.collection('users').doc(user.uid).collection('courses').doc(currentCourse).collection('stats').doc('all-time').get()
            .then((doc) => {
                if (doc.exists) {
                    const maxFrequency = doc.data().maxFrequency || 0;
                    vocabPercentage = Math.min((maxFrequency / 10000) * 100, 100).toFixed(2);
                    document.getElementById('vocabPercentage').textContent = `${vocabPercentage}%`;
                    document.getElementById('vocabProgress').style.width = `${vocabPercentage}%`;
                    document.getElementById('vocabProgress').setAttribute('aria-valuenow', vocabPercentage);
                    console.log(`Loaded Vocabulary Percentage: ${vocabPercentage}%`);
                    document.querySelector('#CurrentPracticeCard .fill-effect').style.animation = 'none';

                }
            })
            .catch((error) => {
                console.error("Error fetching vocabulary stats:", error);
            });

        const grammarPromise = db.collection('users').doc(user.uid).collection('grammar').doc(currentCourse).get()
            .then((doc) => {
                if (doc.exists) {
                    const maxTopic = doc.data().maxTopic || 1;
                    grammarPercentage = Math.min(((maxTopic - 1) / 200) * 100, 100).toFixed(2);
                    document.getElementById('grammarPercentage').textContent = `${grammarPercentage}%`;
                    document.getElementById('grammarProgress').style.width = `${grammarPercentage}%`;
                    document.getElementById('grammarProgress').setAttribute('aria-valuenow', grammarPercentage);
                    console.log(`Loaded Grammar Percentage: ${grammarPercentage}%`);
                    document.querySelector('#CurrentGrammarCard .fill-effect').style.animation = 'none';

                }
            })
            .catch((error) => {
                console.error("Error fetching grammar stats:", error);
            });

        const chatPromise = db.collection('users').doc(user.uid).collection('chat').doc(currentCourse).collection('completedChats').get()
            .then((snapshot) => {
                const completedChats = snapshot.size;
                chatPercentage = Math.min((completedChats / 200) * 100, 100).toFixed(2);
                document.getElementById('chatPercentage').textContent = `${chatPercentage}%`;
                document.getElementById('chatProgress').style.width = `${chatPercentage}%`;
                document.getElementById('chatProgress').setAttribute('aria-valuenow', chatPercentage);
                document.getElementById('chatBtn').textContent = 'Chat in ' + languageShorts[courseParts[1]];
                
                console.log(`Loaded Chat Percentage: ${chatPercentage}%`);
                document.querySelector('#CurrentChatCard .fill-effect').style.animation = 'none';

            })
            .catch((error) => {
                console.error("Error fetching chat stats:", error);
            });

        const storiesPromise = db.collection('users').doc(user.uid).collection('stories').doc(currentCourse).collection(currentCourse).where('finished', '==', true).get()
            .then((snapshot) => {
                const completedStories = snapshot.size;
                storiesPercentage = Math.min((completedStories / 100) * 100, 100).toFixed(2);
                document.getElementById('storiesPercentage').textContent = `${storiesPercentage}%`;
                document.getElementById('storiesProgress').style.width = `${storiesPercentage}%`;
                document.getElementById('storiesProgress').setAttribute('aria-valuenow', storiesPercentage);
                console.log(`Loaded Stories Percentage: ${storiesPercentage}%`);
                document.querySelector('#CurrentStoriesCard .fill-effect').style.animation = 'none';

            })
            .catch((error) => {
                console.error("Error fetching stories stats:", error);
            });

        // Wait for all category data to be fetched
        await Promise.all([vocabPromise, grammarPromise, chatPromise, storiesPromise]);

        // Calculate and display recommendation
        calculateAndDisplayRecommendation();

    } catch (error) {
        console.error("Error loading card data:", error);
    }

    // Stories Button Functionality
    document.getElementById('storiesBtn').addEventListener('click', () => {
        window.location.href = 'stories.html';
    });

    // **New: Function to calculate and display recommendation**
    function calculateAndDisplayRecommendation() {
        // Convert percentages to numbers
        const vocab = parseFloat(vocabPercentage);
        const grammar = parseFloat(grammarPercentage);
        const stories = parseFloat(storiesPercentage);
        const chat = parseFloat(chatPercentage);

        // Calculate recommendation
        const recommendationObj = calculateRecommendation(vocab, grammar, stories, chat);

        // Update the recommendation card
        updateRecommendationCard(recommendationObj);
    }
}

function checkReg(user) {
const urlParams = new URLSearchParams(window.location.search);
const regParam = urlParams.get('reg');

if (regParam && regParam.length > 2) {
    gtag('event', 'Signup', {
        'method': 'google_login',
        'user_id': user.uid,
        'tier': 'Free'
    });
}
}