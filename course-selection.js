// Initialize Firebase Firestore
const db = firebase.firestore();
let languageLearned = '';
let drillsLimitReached = false;




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

        // Fetch the user document once
        console.time('Fetch User Document');

        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();
        console.timeEnd('Fetch User Document');

        if (userDoc.exists) {
            const userData = userDoc.data();
            const currentCourse = userData.currentCourse;
            populateModalCourses(user); // Populate modal with course options

            if (currentCourse) {
                await loadCardData(user, currentCourse);
                loadTrainingOptions(currentCourse, user.uid);
                await loadTodaysDrills(user, currentCourse); // Load today's drills
            } else {
                showCourseModal(user);
            }

            // Run independent functions in parallel
            await Promise.all([
                loadHeadline(),
                loadStreak(user, userDocRef),
                fetchOrAssignCoach(user, userDocRef, userData),
                loadUserAvatar(userData),
            ]);

           
        }
    } else {
        window.location.href = '/';
    }
});

// Load User Avatar or Initials into Navbar
async function loadUserAvatar(userData) {
    try {
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
    } catch (error) {
        console.error('Error loading user avatar:', error);
    }
}

// Fetch or assign the coach for the user
async function fetchOrAssignCoach(user, userDocRef, userData) {
    let coachId = userData.coach;
    if (!coachId) {
        coachId = "ntRoVcqi2KNo6tvljdQ2"; // Default coach ID
        await userDocRef.update({ coach: coachId });
        console.log(`Assigned default coach ID: ${coachId} to user ${user.uid}`);
    } else {
        console.log(`Fetched existing coach ID: ${coachId} for user ${user.uid}`);
    }
    await loadCurrentCoach(coachId);
}

// Load the current coach details
async function loadCurrentCoach(coachId) {
    console.time('Load Current Coach');
    try {
        const coachDoc = await db.collection('coaches').doc(coachId).get();
        if (coachDoc.exists) {
            const coachData = coachDoc.data();
            $('#currentCoachImage').attr('src', `assets/images/${coachData.image}`);
            $('#currentCoachImage').css('visibility', 'visible');
            $('#currentCoachName').text(coachData.coachName);
            console.log(`Loaded coach details for coach ID: ${coachId}`);
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
async function loadHeadline() {
    console.time('Load Headline');
    const today = new Date();
    const todayString = today.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    try {
        const querySnapshot = await db.collection('headlines').where('date', '==', todayString).limit(1).get();
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const headlineData = doc.data();
            document.getElementById('headline').textContent = headlineData.headline;
            console.log(`Loaded headline for date ${todayString}: ${headlineData.headline}`);
        } else {
            document.getElementById('headline').textContent = "Have a great day learning!";
            console.log(`No headline found for date ${todayString}. Using default message.`);
        }
        document.querySelector('#headlineCard .fill-effect').style.animation = 'none';
    } catch (error) {
        console.error("Error fetching headline: ", error);
    }
    console.timeEnd('Load Headline');
}

// Load current streak data and update UI based on whether the streak was extended today
async function loadStreak(user, userDocRef) {
    console.time('Load Streak');
    try {
        const coursesSnapshot = await userDocRef.collection('courses').get();

        if (coursesSnapshot.empty) {
            console.warn('No courses found for this user.');
            document.getElementById('streakCount').textContent = "0 Days";
            document.getElementById('streakCount').style.visibility = 'visible';
            return;
        }

        let datesSet = new Set();
        let statsPromises = [];

        // Collect stats promises for all courses
        coursesSnapshot.docs.forEach((courseDoc) => {
            const statsRef = userDocRef.collection('courses').doc(courseDoc.id).collection('stats');
            const statsPromise = statsRef.where(firebase.firestore.FieldPath.documentId(), '!=', 'all-time').get()
                .then(statsSnapshot => {
                    statsSnapshot.forEach(doc => {
                        datesSet.add(doc.id);
                    });
                });
            statsPromises.push(statsPromise);
        });

        // Wait for all stats to be fetched
        await Promise.all(statsPromises);

        // Calculate streaks
        const streakInfo = calculateStreaks(Array.from(datesSet));
        const currentStreak = streakInfo.currentStreak;

        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = new Date();
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: userTimezone };
        const formattedDate = new Intl.DateTimeFormat('en-US', options).format(now);
        const [month, day, year] = formattedDate.split('/');
        var today = `${year}-${month}-${day}`;

        const streakExtendedToday = datesSet.has(today);

        const midnight = new Date(today);
        midnight.setDate(midnight.getDate() + 1); // Move to the next day

        // Calculate time left to extend the streak (until midnight)
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
        document.getElementById('streakCount').style.visibility = 'visible';
    } catch (error) {
        console.error("Error fetching streak: ", error);
        document.getElementById('streakCount').textContent = "0 Days";
        document.getElementById('streakCount').style.visibility = 'visible';
    }
    console.timeEnd('Load Streak');

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
    const basicsBtn = document.getElementById('basicsBtn');
    const continueCourseAlert = document.getElementById('continueCourseAlert');

    // Set up button actions
    continueCourseBtn.onclick = function () {
        if (!drillsLimitReached) {
            window.location.href = `practice.html?courseId=${currentCourse}`;
        } else {
            showUpgradeModal();
        }
    };
    document.getElementById('statsBtn').disabled = false;
    document.getElementById('statsBtn').onclick = function () {
        window.location.href = 'stats.html';
    };
    document.getElementById('vocabBtn').disabled = false;
    document.getElementById('vocabBtn').onclick = function () {
        window.location.href = 'vocabulary.html?course=' + currentCourse;
    };

    // Check stories and grammar availability in parallel
    const storiesQuery = db.collection('stories')
        .where('knownLanguage', '==', knownLanguage)
        .where('language', '==', language)
        .limit(1)
        .get();

    const grammarQuery = db.collection('grammar')
        .where('knownLanguage', '==', knownLanguage)
        .where('language', '==', language)
        .limit(1)
        .get();

    const basicsQuery = db.collection('nouns').
    where('knownLanguage', '==', knownLanguage).
    where('language', '==', language).
    limit(1).
    get();

    Promise.all([storiesQuery, grammarQuery, basicsQuery])
        .then(([storySnap, grammarSnap, basicsSnap]) => {
            if (!storySnap.empty) {
                storiesBtn.disabled = false;
                storiesBtn.onclick = function () {
                    window.location.href = `stories.html?courseId=${currentCourse}`;
                };
                console.log(`Stories available for course ${currentCourse}. Enabled Stories button.`);
            } else {
                console.log(`No stories available for course ${currentCourse}. Stories button remains disabled.`);
            }

            if (!grammarSnap.empty) {
                grammarBtn.disabled = false;
                grammarBtn.onclick = function () {
                    if (!drillsLimitReached) {
                        window.location.href = 'grammar-topics.html';
                    } else {
                        showUpgradeModal();
                    }
                };
                console.log(`Grammar topics available for course ${currentCourse}. Enabled Grammar button.`);
            } else {
                console.log(`No grammar topics available for course ${currentCourse}. Grammar button remains disabled.`);
            }

            if (!basicsSnap.empty) {
                basicsBtn.disabled = false;
                basicsBtn.onclick = function () {
                    if (!drillsLimitReached) {
                        window.location.href = 'nouns.html';
                    } else {
                        showUpgradeModal();
                    }
                };
                console.log(`Baiscs are available for course ${currentCourse}. Enabled Basics button.`);
            } else {
                console.log(`No basics available for course ${currentCourse}. Basics button remains disabled.`);
            }
        })
        .catch(error => {
            console.error("Error checking training options: ", error);
        });

    // Chat
    chatBtn.disabled = false;
    chatBtn.onclick = function () {
        window.location.href = `chat.html?courseId=${currentCourse}`;
    };
    console.log(`Enabled Chat button for course ${currentCourse}.`);
}

async function loadTodaysDrills(user, currentCourse) {
    console.time('Load Today\'s Drills');

    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const userDocRef = db.collection('users').doc(user.uid);
    const courseDocRef = userDocRef.collection('courses').doc(currentCourse);

    try {
        var totalDrills = 0;
        const statsDoc = await courseDocRef.collection('stats').doc(today).get();
        if (statsDoc.exists) {
            const data = statsDoc.data();
            totalDrills = (data.grammar_totalDrills || 0) + (data.totalDrills || 0);
        }

        const userDoc = await userDocRef.get();
        const subLevel = userDoc.exists ? userDoc.data().subLevel : 'Free';
        updateDrillsUI(totalDrills, subLevel);
    } catch (error) {
        console.error("Error loading today's drills:", error);
    }
    console.timeEnd('Load Today\'s Drills');

}

// Update the UI based on the drills count
function updateDrillsUI(totalDrills, userLevel) {
    const drillsAlert = document.getElementById('drillsAlert');
    const drillsCard = document.getElementById('drillsCard');

    if (userLevel === 'Free') {
        if (totalDrills >= 50) {
            drillsLimitReached = true;
        }
        if (window.innerWidth >= 1200) { // For xl devices
            drillsCard.innerHTML = `
                <div class="card border-left-warning shadow h-100 py-0">
                    <div class="card-body">
                        <h5 class="card-title text-danger text-uppercase">   <i class="fas fa-check-circle fa-fw"></i> Today's Drills</h5>
                        <p>${totalDrills} out of 50 drills completed today.</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-warning" onclick="showUpgradeModal()" id="upgBtn">
                            <i class="fas fa-arrow-right"></i> Upgrade
                        </button>
                    </div>
                </div>
            `;
            drillsCard.style.display = 'block';
        } else { // For smaller devices
            drillsAlert.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    ${totalDrills} out of 50 drills completed today. 
                    <a href="#" onclick="showUpgradeModal()">Upgrade</a> to continue.
                </div>
            `;
            drillsAlert.style.display = 'block';
        }
    } else {
        if (window.innerWidth >= 1200) { // For xl devices
            const recCol = document.getElementById('recCol');
            recCol.classList.remove('col-xl-6');
            recCol.classList.add('col-xl-9');
        }
    }
}

function showUpgradeModal() {
    const modalElement = document.getElementById('upgradeModal');
    const modalInstance = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
    });
    modalInstance.show();
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

    db.collection('courses')
        .get()
        .then((snapshot) => {
            const courses = new Set();

            snapshot.forEach((doc) => {
                const data = doc.data();
                const courseField = data.course; // Get the course field
                if (courseField && typeof courseField === 'string' && /^[a-z]{2}-[a-z]{2}$/.test(courseField)) { // Check if it exists and matches the format XX-XX
                    courses.add(courseField);
                }
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

    selectButton.addEventListener('click', async () => {
        if (selectedCourse) {
            const userDocRef = db.collection('users').doc(user.uid);
            const courseDocRef = userDocRef.collection('courses').doc(selectedCourse);
            const [knownLanguage, targetLanguage] = selectedCourse.split('-');

            try {
                // Check and update the course document
                const courseDoc = await courseDocRef.get();
                if (!courseDoc.exists) {
                    await courseDocRef.set({
                        knownLanguage: knownLanguage,
                        targetLanguage: targetLanguage
                    });
                } else {
                    const courseData = courseDoc.data();
                    if (!courseData.knownLanguage || !courseData.targetLanguage) {
                        await courseDocRef.update({
                            knownLanguage: knownLanguage,
                            targetLanguage: targetLanguage
                        });
                    }
                }

                // Check and update the 'all-time' stats document
                const statsDocRef = courseDocRef.collection('stats').doc('all-time');
                const statsDoc = await statsDocRef.get();
                if (!statsDoc.exists) {
                    await statsDocRef.set({ maxFrequency: 0 });
                }

                // Update the current course
                await userDocRef.update({
                    currentCourse: selectedCourse
                });

                // Fire the gtag event and simulate waiting for it to complete
                await new Promise((resolve) => {
                    gtag('event', 'Course Selection', {
                        'user_id': user.uid,
                        'course': selectedCourse
                    });
                    setTimeout(resolve, 500); // Adjust the timeout as needed
                });

                const modalElement = document.getElementById('courseModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();
                console.log(`Updated current course to ${selectedCourse} for user ${user.uid}. Reloading page.`);
                window.location.reload();
            } catch (error) {
                console.error("Error setting current course:", error);
            }
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

function calculateRecommendation(vocab, grammar, stories, chat, basics) {
    /*
    New Logic:
    1. If all categories are at 0% => Recommend Basics.
    2. Ensure Basics vs. Vocabulary advantage:
       - If basics is NOT at least 2.5% ahead of vocabulary, recommend Basics.
         (basicsValue - vocabValue < 2.5 means basics is not sufficiently ahead, so we pick basics)
       - Else, continue checking Vocabulary.
    3. If Vocab is not at least 2% ahead of Grammar, Stories, and Chat => fallback to weighted selection.
    4. If no suitable category found during advantage checks => fallback to Basics.
    */

    let recommendation = null;
    let reason = '';

    // 1. Check if drills limit is reached
    if (drillsLimitReached) {
        recommendation = {
            name: 'Upgrade',
            buttonColor: 'success',
            buttonId: 'upgradeBtn',
            icon: 'fas fa-exclamation-triangle'
        };
        reason = 'You have reached the daily limit of 50 exercises on the Free Plan. Consider upgrading for unlimited access or return tomorrow for more practice.';
        console.log(`Recommendation Reason: Drills limit reached. Recommending Upgrade.`);
        return { recommendation, reason };
    }

    // 2. If all categories are at 0%
    if (vocab === 0 && grammar === 0 && stories === 0 && chat === 0 && basics === 0) {
        recommendation = {
            name: 'Basics',
            buttonColor: 'success',
            buttonId: 'learnBasicsBtn',
            icon: 'fas fa-book'
        };
        reason = 'All your progress areas are at zero. Starting with Basics will help you build a strong foundation.';
        console.log(`Recommendation Reason: All categories are 0%. Recommending Basics.`);
        return { recommendation, reason };
    }

    // Check Basics vs Vocabulary advantage:
    // Basics should be 2.5% ahead of Vocabulary to even consider recommending Vocabulary or moving on.
    // If basics is NOT at least 2.5% ahead of vocabulary => recommend Basics.
    // i.e. if (basics - vocab < 2.5) then basics doesn't have the lead => we pick basics
    if ((basics - vocab) < 2.5) {
        recommendation = {
            name: 'Basics',
            buttonColor: 'success',
            buttonId: 'learnBasicsBtn',
            icon: 'fas fa-book'
        };
        reason = `Basics must be at least 2.5% ahead of Vocabulary to consider other recommendations. Basics (${basics}%) - Vocab (${vocab}%) < 2.5%. Recommending Basics.`;
        console.log(`Recommendation Reason: ${reason}`);
        return { recommendation, reason };
    }

    // If we got here, Basics is at least 2.5% ahead of Vocabulary, meaning we can consider Vocabulary next.
    // Now check if Vocabulary is 2% ahead of Grammar, Stories, and Chat.
    // If Vocab isn't at least 2% ahead of EACH of grammar, stories, and chat => fallback to weighted selection.
    const others = [
        { name: 'Grammar', value: grammar },
        { name: 'Stories', value: stories },
        { name: 'Chat', value: chat }
    ];

    const vocabHasAdvantage = others.every(other => (vocab - other.value) >= 2);

    if (vocabHasAdvantage) {
        // Recommend Vocabulary
        recommendation = {
            name: 'Vocabulary',
            buttonColor: 'success',
            buttonId: 'learnVocabBtn',
            icon: 'fas fa-book'
        };
        reason = `Vocabulary is at least 2% ahead of Grammar, Stories, and Chat. (Vocab: ${vocab}%) Recommending Vocabulary to maintain your lead.`;
        console.log(`Recommendation Reason: ${reason}`);
        return { recommendation, reason };
    }

    // If Vocab does not have the 2% lead over all others, fallback to weighted random selection
    // Weighted selection:
    // - Always include Basics, Vocab, Grammar in the pool
    // - Include Stories if Grammar and Vocab ≥ 0.5%
    // - Include Chat if Grammar, Vocab, Stories, and Basics ≥ 1%
    // The user requested to try to "balance" the others, but the previous logic still stands. Just keep the same weighting logic.

    let eligibleCategories = [
        { name: 'Basics', value: basics, weight: 50, buttonColor: 'success', buttonId: 'learnBasicsBtn', icon: 'fas fa-stairs' },
        { name: 'Vocabulary', value: vocab, weight: 30, buttonColor: 'success', buttonId: 'learnVocabBtn', icon: 'fas fa-book' },
        { name: 'Grammar', value: grammar, weight: 20, buttonColor: 'info', buttonId: 'learnGrammarBtn', icon: 'fas fa-pencil-alt' }
    ];

    // Include Stories if Grammar and Vocabulary ≥ 0.5%
    if (grammar >= 0.5 && vocab >= 0.5) {
        eligibleCategories.push({ name: 'Stories', value: stories, weight: 10, buttonColor: 'secondary', buttonId: 'storiesBtn', icon: 'fas fa-book-open' });
    }

    // Include Chat if Grammar, Vocabulary, Stories, and Basics ≥ 1%
    // If stories wasn't included due to conditions, no chat
    const storiesIncluded = eligibleCategories.some(cat => cat.name === 'Stories');
    if (grammar >= 1 && vocab >= 1 && basics >= 1 && storiesIncluded && stories >= 1) {
        // Adjust weights for Chat inclusion:
        // Basics:45, Vocab:25, Grammar:20, Stories:5, Chat:15
        eligibleCategories = eligibleCategories.map(cat => {
            if (cat.name === 'Basics') return { ...cat, weight: 45 };
            if (cat.name === 'Vocabulary') return { ...cat, weight: 25 };
            if (cat.name === 'Grammar') return { ...cat, weight: 20 };
            if (cat.name === 'Stories') return { ...cat, weight: 5 };
            return cat; // for default case
        });
        eligibleCategories.push({ name: 'Chat', value: chat, weight: 15, buttonColor: 'warning', buttonId: 'chatBtn', icon: 'fas fa-comments' });
    }

    // Weighted random selection
    const totalWeight = eligibleCategories.reduce((sum, cat) => sum + cat.weight, 0);
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    for (let cat of eligibleCategories) {
        cumulative += cat.weight;
        if (rand <= cumulative) {
            recommendation = cat;
            reason = `No category had the required advantage. Randomly selected ${cat.name} based on weighted probabilities.`;
            console.log(`Recommendation Reason: ${reason}`);
            return { recommendation, reason };
        }
    }

    // Fallback to Basics if somehow we got here
    recommendation = {
        name: 'Basics',
        buttonColor: 'success',
        buttonId: 'learnBasicsBtn',
        icon: 'fas fa-book'
    };
    reason = 'Fallback to Basics due to unexpected conditions or no suitable category found.';
    console.log(`Recommendation Reason: ${reason}`);
    return { recommendation, reason };
}

function updateRecommendationCard(recommendationObj) {
    const { recommendation, reason } = recommendationObj;
    const recommendationText = document.getElementById('recommendationText');
    const recommendationBtn = document.getElementById('recommendationBtn');

    let message = '';
    switch (recommendation.name) {
        case 'Basics':
            message = "Focusing on the Basics will help you build a strong foundation. Let's reinforce the fundamentals!";
            break;
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
        case 'Upgrade':
            message = "You've reached today's exercise limit on the Free Plan. Consider upgrading for unlimited access or come back tomorrow.";
            break;
        default:
            message = "Let's continue your learning journey!";
    }

    recommendationText.textContent = message;

    // Update button color and icon
    recommendationBtn.className = `btn btn-${recommendation.buttonColor}`;
    recommendationBtn.innerHTML = `<i class="${recommendation.icon} me-2"></i> Go to ${recommendation.name}`;
    recommendationBtn.style.visibility = 'visible';

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
            case 'Basics':
                window.location.href = 'nouns.html';
                break;
            case 'Upgrade':
                showUpgradeModal();
                break;
            default:
                console.warn('Unknown recommendation category, defaulting to Basics');
                window.location.href = 'nouns.html';
        }
    };

    document.querySelector('#CurrentRecommendationCard .fill-effect').style.animation = 'none';

    console.log(`Recommendation Updated: ${recommendation.name} - ${reason}`);
}


// Function to load data for the cards
async function loadCardData(user, currentCourse) {
    console.time('Load Card Data');

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
    let basicsPercentage = 0;

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
                } else {
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
                } else {
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

            const basicsPromise = db.collection('users').doc(user.uid).collection('courses').doc(currentCourse).collection('stats').doc('all-time').get()
            .then((doc) => {
                if (doc.exists) {
                    const maxNouns = doc.data().maxOrder || 0;
                    basicsPercentage = Math.min((maxNouns / 2500) * 100, 100).toFixed(2);
                    document.getElementById('basicsPercentage').textContent = `${basicsPercentage}%`;
                    document.getElementById('basicsProgress').style.width = `${basicsPercentage}%`;
                    document.getElementById('basicsProgress').setAttribute('aria-valuenow', basicsPercentage);
                    console.log(`Loaded Basics Percentage: ${basicsPercentage}%`);
                    document.querySelector('#CurrentBasicsCard .fill-effect').style.animation = 'none';
                } else {
                    document.querySelector('#CurrentBasicsCard .fill-effect').style.animation = 'none';
                }
            })
            .catch((error) => {
                console.error("Error fetching basics stats:", error);
            });
            
            console.timeEnd('Load Card Data');


        // Wait for all category data to be fetched
        await Promise.all([vocabPromise, grammarPromise, chatPromise, storiesPromise, basicsPromise]);

        

        // Calculate and display recommendation
        calculateAndDisplayRecommendation();
    } catch (error) {
        console.error("Error loading card data:", error);
    }

    // Stories Button Functionality
    document.getElementById('storiesBtn').addEventListener('click', () => {
        window.location.href = 'stories.html';
    });

// Function to check if the courseModal is open and refresh the page
function checkAndRefresh() {
    const courseModal = document.getElementById('courseModal');
    const isCourseModalOpen = courseModal && courseModal.classList.contains('show');

    if (isCourseModalOpen) {
        // Refresh the page if the courseModal was open
        location.reload();
    }
}

// Listen for visibility change
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        checkAndRefresh();
    }
});

// Listen for window focus
window.addEventListener('focus', function() {
    checkAndRefresh();
});

    // **New: Function to calculate and display recommendation**
    function calculateAndDisplayRecommendation() {
        // Convert percentages to numbers
        const vocab = parseFloat(vocabPercentage);
        const grammar = parseFloat(grammarPercentage);
        const stories = parseFloat(storiesPercentage);
        const chat = parseFloat(chatPercentage);
        const basics = parseFloat(basicsPercentage); // Added Basics


        // Calculate recommendation
        const recommendationObj = calculateRecommendation(vocab, grammar, stories, chat, basics);

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

function selectPlan(planType) {
    if (planType === 'monthly') {
        alert('You have selected the ' + planType + ' plan. Upgrade options coming soon. Enjoy your extended Free plan for now.');
        console.log("Monthly plan selected");
    } else if (planType === 'yearly') {
        alert('You have selected the ' + planType + ' plan. Upgrade options coming soon. Enjoy your extended Free plan for now.');
        console.log("Yearly plan selected");
    }
    // Redirect to payment or confirmation page
}

function continueFree() {
    // Logic to continue with the free plan
    alert('You have selected the Free plan. Upgrade options coming soon. Enjoy your extended Free plan for now.');
    console.log("Continuing with the free plan");
    // Close the modal
    const modalElement = document.getElementById('upgradeModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
}