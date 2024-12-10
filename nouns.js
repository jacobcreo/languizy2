// Initialize Firestore
var db = firebase.firestore();
var dailyScore = 0;
var debounceTimeout = null; // Use a debounce timeout instead of a boolean flag
let correctAnswers = 0;
let wrongAnswers = 0;
let streakCorrect = 0;
let streakWrong = 0;
let lastFiveAnswers = [];
let previousNounId = null; // Ensure this is correctly initialized
let questionStartTime; // Variable to store the start time of the question
let nounDisplayMode;
let listOfSeenNouns = [];
let maxOrder = 0;

let matchingPairs = []; // Store {target: "", origin: ""}
let selectedMatchingBtn = null; // Track the currently selected button
let matchedCount = 0; // Count how many pairs have been matched in this drill


let fourImagesToLoad = [];

let uid = null;

// Global variable to track the current mode (multiple-choice or text input)
let isMultipleChoice;

// Global variables to store the current noun data
let currentNounId;
let currentNounData;
let currentCourse;


// Array of random encouragement statements
const encouragementStatements = [
    "You got this! Let's make this fun!",
    "Believe in yourself – you're doing great!",
    "Let's conquer this question together!",
    "You're unstoppable! Keep up the good work!",
    "Every step counts – let's make it count!"
];

const loadingMessages = [
    "Hang tight! We're fetching some cool words...",
    "Just a moment! Your image is loading...",
    "Patience is key! Almost there...",
    "Great things take time, and so does your image...",
    "Did you know? We're selecting the perfect image just for you...",
    "A little longer... Good things come to those who wait!",
    "Loading... the suspense is building!",
    "Fetching your next noun...",
    "We're halfway there... keep your linguistic curiosity strong!",
    "Just a sec... almost ready!",
    "Loading... this is a great time to stretch, don't you think?",
    "Fetching some A+ images for your learning pleasure...",
    "Loading... our language squirrel is gathering all the nuts of knowledge!",
    "Meanwhile, in the Land of Nouns... your image is being prepared.",
    "Ever wonder how images are chosen? Well, you’re about to find out...",
    "Your noun is coming... it's fashionably late, but worth it.",
    "Patience, grasshopper. Your learning will be worth the wait!",
];

let interimMessageInterval;
const countryToLanguage = {
    cn: { languageCode: "cmn-CN", voice: "Zhiyu" },        // China
    in: { languageCode: "hi-IN", voice: "Aditi" },         // India
    us: { languageCode: "en-US", voice: "Joanna" },        // United States
    br: { languageCode: "pt-BR", voice: "Camila" },        // Brazil
    ru: { languageCode: "ru-RU", voice: "Tatyana" },       // Russia
    jp: { languageCode: "ja-JP", voice: "Mizuki" },        // Japan
    eg: { languageCode: "arb", voice: "Zeina" },           // Egypt (Arabic)
    tr: { languageCode: "tr-TR", voice: "Filiz" },         // Turkey
    de: { languageCode: "de-DE", voice: "Marlene" },       // Germany
    fr: { languageCode: "fr-FR", voice: "Celine" },        // France
    es: { languageCode: "es-ES", voice: "Conchita" },      // Spain
    it: { languageCode: "it-IT", voice: "Carla" },         // Italy
    nl: { languageCode: "nl-NL", voice: "Lotte" },         // Netherlands
    sv: { languageCode: "sv-SE", voice: "Astrid" },        // Sweden
    no: { languageCode: "nb-NO", voice: "Liv" },           // Norway
    dk: { languageCode: "da-DK", voice: "Naja" }           // Denmark
};
const languageToSpecialChars = {
    de: ['ä', 'ö', 'ü', 'ß'], // German
    fr: ['é', 'è', 'ç', 'à'], // French
    es: ['ñ', 'á', 'é', 'í'], // Spanish
    pt: ['ã', 'ç', 'é', 'õ'], // Portuguese
    it: ['à', 'è', 'ì', 'ò'], // Italian
    sv: ['å', 'ä', 'ö'], // Swedish
    nl: ['é', 'ë', 'ï', 'ü'], // Dutch
    da: ['æ', 'ø', 'å'], // Danish
    no: ['æ', 'ø', 'å'], // Norwegian
    pl: ['ą', 'ć', 'ę', 'ł'] // Polish
};

// Initialize audio element for noun audio playback
var nounAudioElement = new Audio();

// Load User Avatar or Initials into Navbar
function loadUserAvatar(user) {
    const userRef = db.collection('users').doc(user.uid);
    uid = user.uid;

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

function updateFlagIcons(currentCourse) {
    const flagCard = document.getElementById('flag-card');
    if (!flagCard) return;

    // Clear existing flags
    flagCard.innerHTML = '';

    // Define a mapping of course IDs to flag icons
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

        flags.forEach(flagSrc => {
            const img = document.createElement('img');
            img.src = flagSrc;
            img.alt = 'Flag';
            img.width = 32;
            if (flagCard.children.length === 0) {
                img.classList.add('me-2');
                img.classList.add('d-none');
                img.classList.add('d-lg-inline');
            }
            flagCard.appendChild(img);

        });
    } else {
        console.warn(`No flags found for course: ${currentCourse}`);
    }
}

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        fetchCurrentCourse(user).then((currentCourse) => {
            loadUserAvatar(user);
            if (!currentCourse) {
                console.error('No valid current course found.');
                window.location.href = 'course_selection.html';
                return;
            }

            loadRandomImages(0);
            loadDailyScore(user, currentCourse);
            initializeDefaultMode();
            loadNoun(user, currentCourse);
            updateFlagIcons(currentCourse);
            updateMaxOrder(user, currentCourse);

            const targetLanguage = currentCourse.split('-')[1];
            updateSpecialCharacters(targetLanguage);

        }).catch((error) => {
            console.error('Error fetching current course:', error);
            window.location.href = 'course_selection.html';
        });
    } else {
        window.location.href = '/';
    }
});

// New function to update maxOrder
function updateMaxOrder(user, currentCourse) {
    
    const allTimeStatsRef = db.collection('users').doc(user.uid)
        .collection('courses').doc(currentCourse)
        .collection('stats').doc('all-time');

    allTimeStatsRef.get().then(doc => {
        if (doc.exists) {
            maxOrder = doc.data().maxOrder || 0;
            let maxOrderPercentage = (maxOrder / 10000 * 100).toFixed(2) + '%';
            $('#proficiencyLevel').text(maxOrderPercentage);
            $('#profTooltip').text(maxOrderPercentage + ' Proficiency Level');
        } else {
            $('#proficiencyLevel').text('0.00%');
            $('#profTooltip').text('0.00% Proficiency Level');
        }
    }).catch(error => {
        console.error('Error fetching maxOrder:', error);
        $('#proficiencyLevel').text('0.00%');
    });
}

// Function to initialize the default mode based on screen size
function initializeDefaultMode() {
    if (window.innerWidth < 768) { // Mobile devices
        isMultipleChoice = true; // Set to multiple-choice
        $('#toggle-mode').text('Make it harder');
    } else {
        isMultipleChoice = false; // Set to text input
        $('#toggle-mode').text('Make it easier');
    }

    // Add an event listener for the toggle button
    $('#toggle-mode').off('click').on('click', toggleMode);
}

// Function to toggle between modes
function toggleMode() {
    isMultipleChoice = !isMultipleChoice; // Toggle the mode
    $('#toggle-mode').text(isMultipleChoice ? 'Make it harder' : 'Make it easier');
    gtag('event', 'Toggle Mode', {
        'question_type': 'Nouns',
        'user_id': uid,
        'user_pressed': isMultipleChoice ? 'Make it easier' : 'Make it harder',
        'course': window.currentCourse
    });
    // Reload the current question with the new mode
    displayNoun(window.currentNounData, window.currentNounId, window.currentCourse);
}

// Function to fetch the current course based on URL or Firestore
function fetchCurrentCourse(user) {
    return new Promise((resolve, reject) => {
        const urlParams = new URLSearchParams(window.location.search);
        const courseIdFromUrl = urlParams.get('courseId');

        if (courseIdFromUrl) {
            console.log(`Course ID found in URL: ${courseIdFromUrl}`);

            // Check if the course exists (validate that nouns exist for this course)
            validateCourse(courseIdFromUrl).then((isValidCourse) => {
                if (isValidCourse) {
                    // If the course exists, register it under the user's 'courses' sub-collection
                    registerUserCourse(user, courseIdFromUrl).then(() => {
                        // Also update the `currentCourse` field in Firestore for the user
                        updateCurrentCourseInFirestore(user, courseIdFromUrl).then(() => {
                            resolve(courseIdFromUrl); // Now resolve the promise
                        }).catch(reject);
                    }).catch(reject);
                } else {
                    // If the URL course is invalid, fall back to Firestore course
                    console.warn('Invalid course ID in URL, falling back to Firestore currentCourse.');
                    getFirestoreCurrentCourse(user).then(resolve).catch(reject);
                }
            }).catch(reject);
        } else {
            // No course in URL, fallback to Firestore
            getFirestoreCurrentCourse(user).then(resolve).catch(reject);
        }
    });
}

// Function to update Firestore with the new course selection
function updateCurrentCourseInFirestore(user, newCourseId) {
    return db.collection('users').doc(user.uid).update({
        currentCourse: newCourseId
    }).then(() => {
        console.log(`Updated currentCourse in Firestore to: ${newCourseId}`);
    }).catch((error) => {
        console.error('Error updating current course in Firestore:', error);
    });
}

// Function to register the course in the user's 'courses' sub-collection
function registerUserCourse(user, courseId) {
    const knownLanguage = courseId.split('-')[0];
    const targetLanguage = courseId.split('-')[1];

    return db.collection('users').doc(user.uid)
        .collection('courses').doc(courseId)
        .set({
            knownLanguage: knownLanguage,
            targetLanguage: targetLanguage,
        }).then(() => {
            console.log(`Course ${courseId} successfully registered in Firestore.`);
        }).catch((error) => {
            console.error('Error registering course in Firestore:', error);
            throw error; // Pass the error up the chain
        });
}

// Function to get the current course from Firestore
function getFirestoreCurrentCourse(user) {
    return new Promise((resolve, reject) => {
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists && doc.data().currentCourse) {
                console.log(`Fetched currentCourse from Firestore: ${doc.data().currentCourse}`);
                resolve(doc.data().currentCourse);
            } else {
                resolve(null);
            }
        }).catch((error) => {
            console.error('Error fetching current course from Firestore:', error);
            reject(error);
        });
    });
}

// Function to validate if the course exists (i.e., there are nouns for it)
function validateCourse(courseId) {
    return db.collection('nouns')
        .where('knownLanguage', '==', courseId.split('-')[0]) // Example: 'en' from 'en-es'
        .where('language', '==', courseId.split('-')[1]) // Example: 'es' from 'en-es'
        .limit(1) // Check if at least one noun exists
        .get()
        .then(snapshot => !snapshot.empty)
        .catch(error => {
            console.error('Error validating course:', error);
            return false;
        });
}

// Function to load daily score from Firestore
function loadDailyScore(user, currentCourse) {
    // Get the user's local timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Create a date object for the current date
    let now = new Date();

    // Format the date according to the user's timezone
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: userTimezone };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(now);

    // Split the formatted date into parts
    const [month, day, year] = formattedDate.split('/');

    // Create the date in yyyy-mm-dd format
    var today = `${year}-${month}-${day}`;

    // Fetch user's current course stats from the "courses" sub-collection
    var userStatsRef = db.collection('users').doc(user.uid)
        .collection('courses').doc(currentCourse)
        .collection('stats').doc(today);

    // Fetch today's stats
    userStatsRef.get().then(doc => {
        if (doc.exists) {
            dailyScore = doc.data().score || 0; // Load the score from Firestore
        } else {
            dailyScore = 0; // If no score for today, initialize it
        }
        $('#score').text(dailyScore); // Display the current daily score
    }).catch(error => {
        console.error('Error loading daily score:', error);
    });
}

// Load a noun from Firestore
function loadNoun(user, currentCourse) {
    showLoadingProgress();

    // nounDisplayMode = Math.random() < 0.33 ? "four-images" : "regular";
    // nounDisplayMode = "four-images";
    const randVal = Math.random();
    if (randVal < 0.33) {
        nounDisplayMode = "matching-mode";
    } else if (randVal < 0.66) {
        nounDisplayMode = "four-images";

    $('#noun-img1').attr('src', '');
    $('#noun-img2').attr('src', '');
    $('#noun-img3').attr('src', '');
    $('#noun-img4').attr('src', '');
    } else {
        nounDisplayMode = "regular";
    }

    if (!user) {
        console.error("User is not authenticated.");
        return;
    }

    if (!currentCourse) {
        console.error('User has not selected a course.');
        window.location.href = 'course_selection.html';
        return;
    }



    // Show a random encouragement message when loading a new noun
    showEncouragementMessage();

    // Fetch the due nouns based on scheduling algorithm - nextDue
    db.collection('users').doc(user.uid)
        .collection('nouns').doc(currentCourse)
        .collection('nouns')
        .where('nextDue', '<=', new Date())
        .orderBy('nextDue')
        .limit(2) // Fetch two due nouns to handle potential duplicates
        .get()
        .then(progressSnapshot => {
            if (!progressSnapshot.empty) {
                // Iterate through fetched nouns to find one that's not the same as the previous
                let selectedNounDoc = null;
                progressSnapshot.forEach(doc => {
                    if (doc.id !== previousNounId && !selectedNounDoc) {
                        let imgToLoad = `https://languizy.com/myimages/nouns/noun-${doc.data().order}.png/smaller`;
                        let img = new Image();
                        img.src = imgToLoad; // Prefetch the image

                        selectedNounDoc = doc;
                    }
                });

                // If all fetched nouns are same as previous, select the first one (to avoid missing nouns)
                if (!selectedNounDoc && progressSnapshot.size > 0) {
                    selectedNounDoc = progressSnapshot.docs[0];
                }

                if (selectedNounDoc) {
                    var nounId = selectedNounDoc.id;
                    loadNounData(nounId, currentCourse); // Pass currentCourse as a parameter
                    previousNounId = nounId; // Update the previousNounId
                } else {
                    console.log('No suitable due nouns found. Attempting to load a new noun.');
                    loadNewNoun(user, currentCourse);
                }
            } else {
                // No due nouns; attempt to load a new noun
                loadNewNoun(user, currentCourse);
            }
        }).catch(error => {
            console.error('Error fetching due nouns:', error);
        });
}

// Load noun data and display
function loadNounData(nounId, currentCourse) {
    db.collection('nouns').doc(nounId).get()
        .then(nounDoc => {
            if (nounDoc.exists) {
                displayNoun(nounDoc.data(), nounId, currentCourse); // Pass currentCourse as a parameter
                previousNounId = nounId; // Ensure previousNounId is updated

            } else {
                console.error('Noun not found:', nounId);
            }
        });
}

// Load a new noun that hasn't been answered yet or from a specific course
function loadNewNoun(user, courseId) {
    // Fetch user's selected course details (knownLanguage and targetLanguage)
    db.collection('users').doc(user.uid).collection('courses').doc(courseId).get()
        .then(courseDoc => {
            var courseData = courseDoc.data();

            if (!courseData || !courseData.knownLanguage || !courseData.targetLanguage) {
                // Course data might not be ready, let's retry once after a short delay
                console.warn('Course data not found. Retrying...');
                setTimeout(() => {
                    if ((typeof (courseData.targetLanguage) !== 'undefined') && (typeof (courseData.knownLanguage) !== 'undefined')) {
                        // Retry fetching course data
                        db.collection('users').doc(user.uid).collection('courses').doc(courseId).get()
                            .then(retryDoc => {
                                courseData = retryDoc.data();
                                if (!courseData || !courseData.knownLanguage || !courseData.targetLanguage) {
                                    console.error('User has not selected a course after retry.');
                                    window.location.href = 'course_selection.html';
                                } else {
                                    // Proceed with loading nouns after retry
                                    fetchAndLoadNouns(courseData);
                                }
                            }).catch(error => {
                                console.error('Error fetching course data during retry:', error);
                                window.location.href = 'course_selection.html';
                            });
                    } else {
                        console.error('User has not selected a course correctly.');
                        window.location.href = 'course_selection.html';
                    }
                }, 1000); // 1-second delay for retry
            } else {
                // Proceed if course data is available
                fetchAndLoadNouns(courseData);
            }
        }).catch(error => {
            console.error('Error loading user course data:', error);
        });
}

// Helper function to fetch and load nouns
function fetchAndLoadNouns(courseData) {
    debugger;
    if ((typeof (courseData.targetLanguage) !== 'undefined') && (typeof (courseData.knownLanguage) !== 'undefined')) {
        courseData.courseId = courseData.knownLanguage + '-' + courseData.targetLanguage;
    }

    db.collection('nouns')
        .where('language', '==', courseData.targetLanguage)
        .where('knownLanguage', '==', courseData.knownLanguage)
        .where('order', '>=', Math.max(0, maxOrder - 5)) // Ensure order is at least 0 and within the range
        .where('order', '<=', maxOrder + 5) // Ensure order is within the range of maxOrder +5
        .orderBy('order', 'asc') // Order by 'order' in ascending order
        .get()
        .then(nounSnapshot => {
            var nouns = [];
            nounSnapshot.forEach(doc => {
                nouns.push({ id: doc.id, data: doc.data() });
            });
            // Filter out nouns the user has already answered
            db.collection('users').doc(firebase.auth().currentUser.uid)
                .collection('nouns').doc(courseData.courseId)
                .collection('nouns').get()
                .then(progressSnapshot => {
                    var seenNouns = progressSnapshot.docs.map(doc => doc.id);
                    var unseenNouns = nouns.filter(q => !seenNouns.includes(q.id));
                    debugger;
                    // Shuffle unseenNouns to add randomness
                    // shuffleArray(unseenNouns);

                    // Find the first noun that is not the same as previousNounId
                    let selectedNoun = unseenNouns.find(q => q.id !== previousNounId);

                    if (!selectedNoun && unseenNouns.length > 0) {
                        // If all unseen nouns are same as previous (unlikely), select the first one
                        selectedNoun = unseenNouns[0];
                    }

                    if (selectedNoun) {
                        displayNoun(selectedNoun.data, selectedNoun.id, courseData.courseId);
                        previousNounId = selectedNoun.id; // Update the previousNounId
                    } else {
                        console.log('No new nouns available. Loading next early noun.');
                        loadNextEarlyNoun(firebase.auth().currentUser, courseData.courseId); // Load the next noun even if it's not yet due
                    }
                });
        });
}

// Load the next noun even if it's not yet due
function loadNextEarlyNoun(user, courseId) {
    db.collection('users').doc(user.uid)
        .collection('nouns').doc(courseId)
        .collection('nouns')
        .orderBy('nextDue', 'asc')
        .limit(2) // Fetch two to handle potential duplicates
        .get()
        .then(progressSnapshot => {
            if (!progressSnapshot.empty) {
                let selectedNounDoc = null;
                progressSnapshot.forEach(doc => {
                    if (doc.id !== previousNounId && !selectedNounDoc) {
                        selectedNounDoc = doc;
                    }
                });

                // If all fetched nouns are same as previous, select the first one
                if (!selectedNounDoc && progressSnapshot.size > 0) {
                    selectedNounDoc = progressSnapshot.docs[0];
                }

                if (selectedNounDoc) {
                    var nounId = selectedNounDoc.id;
                    loadNounData(nounId, courseId); // Pass currentCourse as a parameter
                    previousNounId = nounId; // Update the previousNounId
                } else {
                    console.log('No nouns found at all.');
                }
            } else {
                console.log('No nouns found at all.');
            }
        }).catch(error => {
            console.error('Error fetching next early noun:', error);
        });
}

// Show loading progress
function showLoadingProgress() {
    // Hide the question area content but keep its space
    $('#question-area').removeClass('visible').css('visibility', 'hidden');
    $('.option-btn').text('\u00A0');

    $('#loading-progress').show();
    $('#progress-bar').css('width', '0%');

    let width = 0;
    const interval = setInterval(() => {
        width += 20;
        $('#progress-bar').css('width', `${width}%`);
        if (width >= 100) {
            width = 0;
        }
    }, 500); // Increase every 500ms

    // Save the interval ID to stop it later
    $('#loading-progress').data('interval', interval);
}

// Hide loading progress
function hideLoadingProgress() {
    $('#loading-progress').hide();
    clearInterval($('#loading-progress').data('interval'));
    // Make the question area content visible again
    $('#question-area').css('visibility', 'visible').addClass('visible');
    // Start the timer when the noun is loaded
    questionStartTime = new Date();
}

function displayFourImagesNew(noun) {


    while (fourImagesToLoad.length < 4) {
        const randomNumber = Math.floor(Math.random() * 66) + 1; // Generate a random number between 1 and 99
        const imgUrl = `https://languizy.com/myimages/nouns/noun-${randomNumber}.png/smaller`;
        if (!fourImagesToLoad.includes(imgUrl)) {
            fourImagesToLoad.push(imgUrl); // Add the URL if it's not already in the array
        }

    }
    displaytheImages(noun); // Call the function to display images once we have enough





    // Function to display the images in random order
   // Function to display the images in random order
   function displaytheImages(noun) {
    $('.the4images').css("visibility", "hidden");
     
    const currentOrder = noun.order;
    const imageElements = ['#noun-img1', '#noun-img2', '#noun-img3', '#noun-img4'];
    let imagesToLoad = fourImagesToLoad;
    fourImagesToLoad = [];
    const correctImageUrl = `https://languizy.com/myimages/nouns/noun-${currentOrder}.png/smaller`;
    if (!imagesToLoad.includes(correctImageUrl)) {
        imagesToLoad[3] = correctImageUrl;
    }
    // Shuffle the images array
    imagesToLoad = imagesToLoad.sort(() => Math.random() - 0.5);

    // Preload the correct image
    const pimg = new Image();
    pimg.src = correctImageUrl;

    let imagesLoaded = 0; // Counter for loaded images
    const totalImages = imagesToLoad.length + 1; // +1 for the correct image

    // Function to check if all images are loaded
    const checkAllImagesLoaded = () => {
        if (imagesLoaded === totalImages) {
            $('.the4images').css("visibility", "visible"); // Show the container after all images are loaded
        }
    };

    // Preload the correct image
    pimg.onload = () => {
        imagesLoaded++;
        checkAllImagesLoaded();
    };

    // Set the images to the respective elements
    imageElements.forEach((selector, index) => {
        if (index < imagesToLoad.length) {
            const imgElement = $(selector);
            imgElement.attr('src', imagesToLoad[index]);
            // Add data attribute for the correct noun image
            if (imagesToLoad[index] === correctImageUrl) {
                imgElement.attr('data-correct', true);
            }
            // Wait for each image to load in the DOM
            imgElement.on('load', () => {
                imagesLoaded++;
                checkAllImagesLoaded();
            });
        }
    });
   }}

// Display the noun on the page
function displayNoun(noun, nounId, currentCourse) {
    // Store nounId and current noun data globally for use in other functions
    if (typeof nounId !== 'undefined') {
        window.currentNounId = nounId;
    } else {
        nounId = window.currentNounId;
    }
    console.log(noun);
    hideLoadingProgress(); // Hide progress bar when the noun loads

    // Reset matching mode UI if previously enabled
    $('#matching-container').hide();
    matchedCount = 0;
    selectedMatchingBtn = null;
    $(document).off('keydown.matching'); // Remove matching key bindings


    // Adjust input field based on the noun
    adjustInputField(noun.noun, currentCourse);
    $("#noun-translation").text(noun.missingWordTranslation);

    if (nounDisplayMode === "four-images") {
        // displayFourImages(noun);

        displayFourImagesNew(noun);
    }

    
    if (nounDisplayMode !== "four-images" && nounDisplayMode !== "matching-mode") {
        $('#toggle-mode').show();
        $('#toggle-mode').prop('disabled', false);
        $("#submit-answer").css("visibility", "visible");
        $("#text-input-area").show();
    } if (nounDisplayMode === "matching-mode") {
        $('#noun-image').hide();
        $('#four-images-container').hide();
        $('#text-input-area').hide();
        $('#multiple-choice-options').hide();
        $('#special-characters').hide();
        $('#toggle-mode').hide();
        $('#submit-answer').hide();
        // Show matching container
        $('#matching-container').show();
        $('#question-area').hide();

        // We will call a function to initialize the matching drill
        initializeMatchingMode(noun, currentCourse);
    } else {
        $('#toggle-mode').hide();
        $("#submit-answer").css("visibility", "hidden");
        $("#text-input-area").hide();
        $('#multiple-choice-options').hide();
    }

    $('#replay-audio').prop('disabled', true);

    if (typeof noun !== 'undefined') {
        window.currentNounData = noun;
    } else {
        noun = window.currentNounData;
    }

    if (typeof currentCourse !== 'undefined') {
        window.currentCourse = currentCourse;
    } else {
        currentCourse = window.currentCourse;
    }

    if (nounDisplayMode !== "matching-mode") {
        setupReplayButton(nounId, noun.noun);
    }

    if (nounDisplayMode !== "four-images" && nounDisplayMode !== "matching-mode") {
        // Set the image source
        const imageUrl = `https://languizy.com/myimages/nouns/noun-${noun.order}.png/smaller`;
        $('#noun-image').attr('src', imageUrl);
        $('#four-images-container').hide();
        $('#noun-image').show();
    } else if (nounDisplayMode === "four-images") {
        const imageUrl = `https://languizy.com/myimages/nouns/noun-${noun.order}.png/smaller`;
        const pimg = new Image();
        pimg.src = imageUrl;
        pimg.onload = () => {
            $('#four-images-container').show();
        };
        // $('#four-images-container').show();
        $('#noun-image').hide();
        $('#noun-four-images-text').text(noun.noun);
    }
    if (nounDisplayMode !== "matching-mode") {
        $('#question-area').show();
    }

    if (nounDisplayMode !== "four-images" && nounDisplayMode !== "matching-mode") {
        // Display noun translations in the feedback area
        displayNounTranslations(noun.translations);
    }

    // Retrieve the progress data for this noun to get `lastAnswered`
    var user = firebase.auth().currentUser;
    var userProgressRef = db.collection('users').doc(user.uid)
        .collection('nouns').doc(currentCourse)
        .collection('nouns').doc(nounId);

    userProgressRef.get().then(progressDoc => {
        var phraseStatus = "(new noun)"; // Default if never answered before

        if (progressDoc.exists) {
            var progressData = progressDoc.data();
            if (progressData.lastAnswered) {
                // Calculate time difference for display
                phraseStatus = timeDifference(progressData.lastAnswered);
            }

            // ** NEW: Update Noun Stats **
            var timesSeen = (progressData.timesCorrect || 0) + (progressData.timesIncorrect || 0);
            var timesCorrect = progressData.timesCorrect || 0;
            var timesWrong = progressData.timesIncorrect || 0;

            // Update HTML with the stats
            $('#times-seen').text(timesSeen);
            $('#times-correct').text(timesCorrect);
            $('#times-wrong').text(timesWrong);
            $('#question-stats').show(); // Show the stats section
        } else {
            var timesSeen = 0;
            var timesCorrect = 0;
            var timesWrong = 0;

            // Update HTML with the stats
            $('#times-seen').text(timesSeen);
            $('#times-correct').text(timesCorrect);
            $('#times-wrong').text(timesWrong);
            $('#question-stats').show(); // Show the stats section
        }

        // Display the phrase status
        $('#feedback').append(` <span class="text-muted">${phraseStatus}</span>`);

        // Automatically focus on the input field if in text input mode
        if (!isMultipleChoice && nounDisplayMode !== "four-images" && nounDisplayMode !== "matching-mode") {
            $('#user-answer').focus();
        }
    });

    $('#feedback').removeClass('visible text-success text-danger').css('visibility', 'hidden');

    $('.option-btn').removeClass('selected'); // Remove selected class from all options (relevant to multiple choice, but in case user switches)
    $('.option-btn').prop('disabled', false);

    // Show or hide the submit button based on the current mode
    if (isMultipleChoice) {
        $('#submit-answer').hide();
        $('#special-characters').hide();
    } else if (nounDisplayMode !== "four-images" && nounDisplayMode !== "matching-mode") {
        $('#special-characters').show();
        $('#submit-answer').show();
    } else {
        $('#special-characters').hide();
    }
    $('#next-question').hide();

    // Hide or show elements based on the current mode
    if (isMultipleChoice) {
        $('#text-input-area').hide();
        $('#multiple-choice-options').show();
        displayMultipleChoiceOptions(noun);
        // Add keydown event for keys 1-4
        $(document).off('keydown.multipleChoice').on('keydown.multipleChoice', function (e) {
            if ($('#next-question').is(':visible')) return; // Ignore if next-question is visible
            const key = e.which - 48; // For top number keys
            if (key >= 1 && key <= 4) {
                e.preventDefault();
                $('.option-btn').eq(key - 1).click();
            }
        });
    } else if (nounDisplayMode !== "four-images") {
        $('#user-answer').val(''); // Clear the input field
        $('#user-answer').css('font-weight', 'normal');
        $('#text-input-area').show();

        $('#multiple-choice-options').hide();
        // Remove multiple-choice keydown event
        $(document).off('keydown.multipleChoice');
    } else if (nounDisplayMode === "four-images") {

        $(document).off('keydown.fourImages').on('keydown.fourImages', function (e) {
            debugger;
            if ($('#next-question').is(':visible')) return; // Ignore if next-question is visible
            if (nounDisplayMode !== "four-images") return;
            const key = e.which - 48; // For top number keys
            if (key >= 1 && key <= 4) {
                e.preventDefault();
                handleFourImagesSubmit(key);
            }
        });
    }


    // Debounce handler to prevent multiple triggers
    function handleDebounce(callback) {
        if (!debounceTimeout) {
            callback(); // Execute the callback function immediately

            // Set debounceTimeout to prevent further triggers
            debounceTimeout = setTimeout(() => {
                debounceTimeout = null; // Reset after 300ms
            }, 300); // Debounce time set to 300ms
        }
    }

    // Handle answer submission for text input mode
    function handleSubmit() {
        var userAnswer = $('#user-answer').val().trim();
        var isCorrect = normalizeString(userAnswer) === normalizeString(noun.noun);
        $('#replay-audio').prop('disabled', false);
        afterAnswerSubmission(isCorrect);
    }

    $('.noun-img').on('click', function () {
        handleDebounce(() => {
            const imgId = $(this).attr('id'); // Get the id of the clicked image
            const imgNumber = imgId.charAt(imgId.length - 1); // Get the last character from the id as the number
            handleFourImagesSubmit(imgNumber); // Call the function with the extracted number
        });
    });


    // Handle answer submission for four images mode
    function handleFourImagesSubmit(imgNumber) {
        var selectedImage = $(`#noun-img${imgNumber}`);
        var isCorrect = selectedImage.attr('data-correct') === 'true';
        selectedImage.removeAttr('data-correct');
        if (isCorrect) {
            selectedImage.addClass('green-border');
        } else {
            selectedImage.addClass('red-border');

            for (let i = 1; i <= 4; i++) {
                const imgElement = $(`#noun-img${i}`);
                if (imgElement.attr('data-correct') === 'true') {
                    imgElement.addClass('green-border');
                    break;
                }
            }
        }
        afterAnswerSubmission(isCorrect, "four-images");
    }

    async function initializeMatchingMode(currentNounData, currentCourse) {
        // currentNounData.noun = target word
        // currentNounData.missingWordTranslation = origin word for that noun
        matchingPairs = [];

        // Add current noun pair
        matchingPairs.push({
            target: currentNounData.noun,
            origin: currentNounData.missingWordTranslation
        });

        // Fetch 3 random other nouns to form 3 more pairs
        const otherPairs = await fetchRandomNounPairs(currentCourse, 3, currentNounData.noun);
        matchingPairs = matchingPairs.concat(otherPairs);

        // Separate target words and origin words
        const targetWords = matchingPairs.map(p => p.target);
        const originWords = matchingPairs.map(p => p.origin);

        // Shuffle each column separately
        shuffleArray(targetWords);
        shuffleArray(originWords);

        // Display them in the two columns
        displayMatchingColumns(targetWords, originWords);

        // Set up key listeners for 1-8
        setupMatchingKeyBindings();
    }

    async function fetchRandomNounPairs(courseId, count, excludeNoun) {
        // We'll fetch random nouns from the nouns collection of the target language
        const parts = courseId.split('-');
        const knownLang = parts[0];
        const targetLang = parts[1];

        const snapshot = await db.collection('nouns')
            .where('knownLanguage', '==', knownLang)
            .where('language', '==', targetLang)
            .limit(100) // fetch a larger sample
            .get();

        const allNouns = snapshot.docs.map(d => d.data()).filter(d => d.noun !== excludeNoun);

        // If not enough nouns, just pick what we have
        if (allNouns.length < count) {
            console.warn('Not enough extra nouns, using fewer pairs.');
        }

        shuffleArray(allNouns);
        const selected = allNouns.slice(0, count);

        // Convert to pairs
        const pairs = selected.map(d => ({
            target: d.noun,
            origin: d.missingWordTranslation
        }));

        return pairs;
    }

    function displayMatchingColumns(targetWords, originWords) {
        const leftCol = $('#matching-left-column');
        const rightCol = $('#matching-right-column');
        leftCol.empty();
        rightCol.empty();

        // Create buttons for left column (1-4)
        for (let i = 0; i < 4; i++) {
            const btn = $('<button>')
                .addClass('matching-btn')
                .text(targetWords[i])
                .attr('data-type', 'target')
                .attr('data-word', targetWords[i])
                .attr('data-index', i + 1);
            leftCol.append(btn);
        }

        // Create buttons for right column (5-8)
        for (let i = 0; i < 4; i++) {
            const btn = $('<button>')
                .addClass('matching-btn')
                .text(originWords[i])
                .attr('data-type', 'origin')
                .attr('data-word', originWords[i])
                .attr('data-index', i + 5);
            rightCol.append(btn);
        }

        // Click handler for matching
        $('.matching-btn').off('click').on('click', function () {
            handleMatchingButtonClick(this);
        });
    }

    function handleMatchingButtonClick(btnElem) {
        const $btn = $(btnElem);
        if ($btn.hasClass('matched')) return; // Already matched

        // If no button selected yet
        if (!selectedMatchingBtn) {
            // Select this button
            $btn.addClass('selected');
            selectedMatchingBtn = $btn;
        } else {
            // There is already a selected button
            if ($btn[0] === selectedMatchingBtn[0]) {
                // Clicked the same button again, deselect
                $btn.removeClass('selected');
                selectedMatchingBtn = null;
                return;
            }

            // Check if they form a correct pair
            const word1 = selectedMatchingBtn.attr('data-word');
            const word2 = $btn.attr('data-word');

            if (isMatchingPair(word1, word2)) {
                // Correct Pair
                playCorrectSound();
                // Mark both as matched (set visibility to hidden)
                selectedMatchingBtn.addClass('matched').css('visibility', 'hidden');
                $btn.addClass('matched').css('visibility', 'hidden');
                selectedMatchingBtn = null;
                matchedCount++;
                if (matchedCount === 4) {
                    // All matched
                    afterAllPairsMatched();
                }
            } else {
                // Incorrect pair
                playWrongSound();
                // Deselect both
                selectedMatchingBtn.removeClass('selected');
                selectedMatchingBtn = null;
            }
        }
    }

    function isMatchingPair(word1, word2) {
        // We have an array of matchingPairs = [{target:"t", origin:"o"}, ...]
        // Check if word1 and word2 appear as a pair in matchingPairs
        for (let p of matchingPairs) {
            // A pair is correct if one is target and the other is origin of the same pair
            if ((p.target === word1 && p.origin === word2) ||
                (p.target === word2 && p.origin === word1)) {
                return true;
            }
        }
        return false;
    }

    function afterAllPairsMatched() {
        // Similar to afterAnswerSubmission for a correct answer:
        // Hide matching container and show next button, update stats as correct.
        // No "submit-answer" here, just directly call what a correct answer would do.

        // We'll treat this as a correct completion of this "drill"
        // Update stats the same way a correct answer does:
        const timeTaken = Math.min(Math.floor((new Date() - questionStartTime) / 1000), 30);
        updateUserProgress(window.currentNounId, true, window.currentCourse, timeTaken);
        $('#feedback').text('All pairs matched!').removeClass('text-danger').addClass('text-success visible').css('visibility', 'visible');
        updateVisualStats(true);
        loadNoun(user, currentCourse);
        // $('#next-question').show();
        // Enter key now moves to next question as normal.
    }

    function setupMatchingKeyBindings() {
        // Key bindings: 1-4 for left column, 5-8 for right column
        $(document).off('keydown.matching').on('keydown.matching', function (e) {


            if ($('#next-question').is(':visible')) return; // If next question visible, do nothing
            if (nounDisplayMode !== "matching-mode") return;
            const key = e.which;
            if (key >= 49 && key <= 56) {
                e.preventDefault();
                // keys '1'-'8' = 49-56 in keycode
                const index = key - 48;
                // Find the button with data-index = index
                const btn = $(`.matching-btn[data-index='${index}']`);
                if (btn.length > 0 && btn.is(':visible') && !btn.hasClass('matched')) {
                    handleMatchingButtonClick(btn[0]);
                }
            }
        });
    }

    function playCorrectSound() {
        playFeedbackSound(true);
        console.log("Play correct sound");
    }

    function playWrongSound() {
        playFeedbackSound(false);
        console.log("Play wrong sound");
    }



    // Function to display noun translations
    function displayNounTranslations(translationsArray) {

        // Ensure translationsArray is an array and limit to 3 entries
        const translations = Array.isArray(translationsArray) ? translationsArray.slice(0, 3) : [];

        if (translations.length > 0) {
            // Create a comma-separated string of translations
            const translationsText = translations.join(', ');

            // Update the #feedback area with the translations
            $('#feedback')
                .html(`<span class="noun-translations">${translationsText}</span>`)
                .addClass('visible')
                .removeClass('text-success text-danger'); // Remove any previous feedback classes
        } else {
            // Hide the feedback area if there are no translations
            $('#feedback').removeClass('visible').html('');
        }
    }

    // Common function to handle after answer submission
    function afterAnswerSubmission(isCorrect, type = "translation") {
        $('#submit-answer').hide();
        $('#next-question').show();

        gtag('event', 'User Answered', {
            'question_type': 'Nouns',
            'user_id': uid,
            'answer': isCorrect,
            'course': window.currentCourse,
            'mode': type === "four-images" ? 'four-images' : (isMultipleChoice ? 'Multiple_Choice' : 'Text_Input')
        });

        const questionEndTime = new Date();
        let timeTaken = Math.floor((questionEndTime - questionStartTime) / 1000); // Time in seconds
        timeTaken = Math.min(timeTaken, 30); // Cap the time at 30 seconds

        // Disable the toggle button after submission
        $('#toggle-mode').prop('disabled', true);

        if (type !== "four-images") {
            // Feedback to user
            if (isCorrect) {
                $('#feedback').text('Correct!').removeClass('text-danger').addClass('text-success visible').css('visibility', 'visible');
                if (!isMultipleChoice) {
                $('#user-answer').val(`${noun.noun}`).css('font-weight', 'bold');
                }
            } else {
                $('#feedback').text(`Incorrect. The correct answer was "${noun.noun}".`).removeClass('text-success').addClass('text-danger visible').css('visibility', 'visible');
            }
        } else {
            if (isCorrect) {
                let correction = 'Correct! <span class="text-decoration-underline">' + window.currentNounData.noun + '</span> is <span class="text-decoration-underline">' + window.currentNounData.missingWordTranslation + '</span>';
                $('#feedback').html(correction).addClass('text-success visible').css('visibility', 'visible');
            } else {
                let correction = 'Incorrect. <span class="text-decoration-underline">' + window.currentNounData.noun + '</span> is <span class="text-decoration-underline">' + window.currentNounData.missingWordTranslation + '</span>';
                $('#feedback').html(correction).removeClass('text-success').addClass('text-danger visible').css('visibility', 'visible');
            }
        }

        // Update visual stats and progress
        updateVisualStats(isCorrect);
        updateUserProgress(window.currentNounId, isCorrect, currentCourse, timeTaken);

        // Hide toggle-mode button after answer is submitted
        $('#toggle-mode').hide();


        // Play noun audio after submission
        playNounAudio(window.currentNounId, window.currentNounData.noun);
    }

    /**
     * Sets up the Replay Audio button to play the noun audio when clicked.
     * @param {string} nounId - The unique identifier for the noun.
     * @param {string} nounWord - The noun word to be pronounced.
     */
    function setupReplayButton(nounId, nounWord) {
        $('#replay-audio').off('click').on('click', function () {
            playNounAudio(nounId, nounWord);
        });
    }

    /**
     * Stops the noun audio playback and resets the audio element.
     */
    function stopNounAudio() {
        nounAudioElement.pause();
        nounAudioElement.currentTime = 0; // Reset the audio playback
    }

    if (isMultipleChoice) {
        // Event listener for multiple-choice option buttons
        $('.option-btn').off('click').on('click', function () {
            const selectedOption = $(this).data('option');
            var isCorrect = normalizeString(selectedOption) === normalizeString(noun.noun);

            // Visually mark the selected option
            $('.option-btn').removeClass('selected'); // Remove selected class from all options
            $(this).addClass('selected'); // Add selected class to the clicked button

            // Disable all option buttons
            $('.option-btn').prop('disabled', true);

            afterAnswerSubmission(isCorrect, selectedOption);
        });

        // Add keydown event for keys 1-4
        $(document).off('keydown.multipleChoice').on('keydown.multipleChoice', function (e) {
            if ($('#next-question').is(':visible')) return; // Ignore if next-question is visible
            if (nounDisplayMode !== "regular") return;
            const key = e.which - 48; // For top number keys
            if (key >= 1 && key <= 4) {
                e.preventDefault();
                const optionBtn = $('.option-btn').eq(key - 1);

                // Trigger click on the option button
                optionBtn.click();
            }
        });
    } else {
        // Remove multiple-choice keydown event
        $(document).off('keydown.multipleChoice');

        // Event listener for Enter key to submit answer
        $('#user-answer').off('keypress').on('keypress', function (e) {
            if (e.which === 13 && $('#submit-answer').is(':visible')) { // Enter key pressed and submit button visible
                handleDebounce(handleSubmit);
            }
        });

        // Handle submit answer button click
        $('#submit-answer').off('click').on('click', function () {
            handleDebounce(handleSubmit);
        });
    }

    $('#next-question').off('click').on('click', function () {
        stopNounAudio(); // Stop audio when moving to the next question
        $(".noun-img").removeClass("green-border red-border");
        handleDebounce(() => {
            $('#noun-image').attr('src', '');
            loadNoun(user, currentCourse);
            $('#toggle-mode').show(); // Show the toggle button back
        });
    });

    // Event listener for Enter key to move to the next question
    $(document).off('keypress').on('keypress', function (e) {
        if (e.which === 13 && $('#next-question').is(':visible')) { // Enter key pressed and next button visible

            stopNounAudio();
            e.preventDefault(); // Prevent default behavior
            handleDebounce(() => $('#next-question').click());
        }
    });
}

// Function to display multiple-choice options
function displayMultipleChoiceOptions(noun) {
    // Combine the correct answer with distractors
    const options = [...noun.distractors, noun.noun];

    // Shuffle the options array
    shuffleArray(options);

    // Display the options in the buttons
    $('.option-btn').each(function (index) {
        if (index < options.length) {
            $(this).text(options[index]).data('option', options[index]).show();
        } else {
            $(this).hide(); // Hide unused buttons
        }
    });
}

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Plays the audio for a given noun.
 * @param {string} nounId - The unique identifier for the noun.
 * @param {string} nounWord - The noun word to be pronounced.
 */
function playNounAudio(nounId, nounWord) {

    var audioUrl = `https://s3.us-east-2.amazonaws.com/audio1.languizy.com/audio/${nounId}.mp3`;

    const targetLanguage = window.currentCourse.split('-')[1];
    nounAudioElement.src = audioUrl;
    nounAudioElement.play()
        .then(() => {
            console.log("Noun audio playback started successfully.");
        })
        .catch((error) => {
            console.error("Error playing noun audio:", error);
            console.log("Attempting to generate audio since playback failed.");
            generateNounAudio(nounId, nounWord, targetLanguage);
        });

    nounAudioElement.onended = function () {
        console.log("Noun audio playback ended.");
    };

    nounAudioElement.onerror = function () {
        console.error("Error loading noun audio from S3:", audioUrl);
        console.log("Attempting to generate audio due to loading error.");
        generateNounAudio(nounId, nounWord, targetLanguage);
    };
}

/**
 * Generates audio for a noun using AWS Polly via a Lambda function.
 * @param {string} nounId - The unique identifier for the noun.
 * @param {string} nounWord - The noun word to be pronounced.
 */
function generateNounAudio(nounId, nounWord, targetLanguage) {
    // const languageCode = window.currentCourse.split('-')[1]; // Extract the second part of the course name
    // const voice = getVoiceForLanguage(languageCode); // Assuming a function to get voice based on language code


    const [languageCode, voice] = getLanguageAndVoice(targetLanguage);


    if (!languageCode || !voice) {
        console.error(`Error: No language and voice found for course: ${currentCourse}`);
        return;
    }

    console.log(`Generating new audio using AWS Polly with language: ${languageCode} and voice: ${voice}`);

    $.ajax({
        url: 'https://hml8eek21e.execute-api.us-east-2.amazonaws.com/check-audio', // Replace with your API endpoint
        type: 'GET', // Adjust based on your API
        data: {
            filename: nounId,
            text: nounWord,
            language: languageCode,
            voice: voice
        },
        success: function (response) {
            console.log("AWS Polly audio generation request succeeded.");
            const audioUrl = JSON.parse(response).url;

            console.log(`Audio generated successfully and available at: ${audioUrl}`);
            nounAudioElement.src = audioUrl;
            nounAudioElement.play()
                .then(() => {
                    console.log("Generated noun audio playback started successfully.");
                })
                .catch((error) => {
                    console.error("Error playing generated noun audio:", error);
                });
        },
        error: function (error) {
            console.error('Error generating noun audio using AWS Polly:', error);
        }
    });
}

// Function to get the language code and female voice based on the target language
function getLanguageAndVoice(countryCode) {
    console.log(`Attempting to find language and voice for country code: ${countryCode}`);

    const entry = countryToLanguage[countryCode.toLowerCase()];

    if (!entry) {
        console.error(`No language and voice found for country code: ${countryCode}`);
        return [null, null]; // Return null values to indicate failure
    }

    const { languageCode, voice } = entry;
    console.log(`Success: Found language code '${languageCode}' and voice '${voice}' for country code '${countryCode}'`);

    return [languageCode, voice];
}

// Normalization function to ignore special characters
function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/ẞ/g, "Ss").replace(/L'/g, "Le ").replace(/l'/g, "le ").toLowerCase();
}

// Update user progress in the database
function updateUserProgress(nounId, isCorrect, currentCourse, timeTaken) {
    var user = firebase.auth().currentUser;
    debugger;
    var userProgressRef = db.collection('users').doc(user.uid)
        .collection('nouns').doc(currentCourse)
        .collection('nouns').doc(nounId);

    var userStatsRef = db.collection('users').doc(user.uid)
        .collection('courses').doc(currentCourse)
        .collection('stats');

    var allTimeStatsRef = userStatsRef.doc('all-time');

    // First, fetch the noun data to get its order outside the transaction
    db.collection('nouns').doc(nounId).get().then(nounDoc => {
        if (nounDoc.exists) {
            var nounOrder = nounDoc.data().order; // Order of the current noun

            // Now, run the transaction to update progress and stats
            db.runTransaction(transaction => {
                return transaction.get(userProgressRef).then(doc => {
                    var data = doc.exists ? doc.data() : {
                        timesCorrect: 0,
                        timesIncorrect: 0,
                        timesCorrectInARow: 0,
                        timesIncorrectInARow: 0,
                        lastAnswered: null,
                        nextDue: null,
                        initialAppearance: true
                    };

                    // Get the user's local timezone
                    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                    // Create a date object for the current date
                    let now = new Date();

                    // Format the date according to the user's timezone
                    const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: userTimezone };
                    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(now);

                    // Split the formatted date into parts
                    const [month, day, year] = formattedDate.split('/');

                    // Create the date in yyyy-mm-dd format
                    var today = `${year}-${month}-${day}`;

                    var points = isCorrect ? 10 : 0;

                    if (isMultipleChoice) {
                        points = Math.ceil(points / 2); // Half points for multiple choice
                    }

                    if (isCorrect) {
                        streakCorrect += 1;
                        streakWrong = 0;
                        data.timesCorrect += 1;
                        data.timesCorrectInARow += 1;
                        data.timesIncorrectInARow = 0; // Reset incorrect streak
                        var daysToAdd = data.initialAppearance ? 28 : 2 * data.timesCorrectInARow;
                        data.nextDue = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
                        updateStats(userStatsRef, today, points, true, timeTaken); // Pass timeTaken
                        dailyScore += points; // Update the daily score
                        $('#score').text(dailyScore); // Update the score on screen
                    } else {
                        streakWrong += 1;
                        streakCorrect = 0;
                        data.timesIncorrect += 1;
                        data.timesCorrectInARow = 0; // Reset correct streak
                        data.timesIncorrectInARow += 1; // Increment incorrect streak
                        data.nextDue = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
                        updateStats(userStatsRef, today, points, false, timeTaken); // Pass timeTaken
                    }

                    // Update `lastAnswered` to the current time
                    data.lastAnswered = firebase.firestore.Timestamp.fromDate(now);
                    data.initialAppearance = false;

                    // Fetch the current maxOrder and update if necessary
                    return transaction.get(allTimeStatsRef).then(allTimeDoc => {
                        var allTimeData = allTimeDoc.exists ? allTimeDoc.data() : {};

                        // Ensure maxOrder is set, even if the document exists but the field is missing
                        if (typeof allTimeData.maxOrder === 'undefined') {
                            allTimeData.maxOrder = 0;
                        }

                        // Compare noun order and update if necessary
                        if (nounOrder > allTimeData.maxOrder) {
                            // Only update maxOrder if not in matching mode
                            if (nounDisplayMode !== "matching-mode") {
                                allTimeData.maxOrder = nounOrder;
                                maxOrder = nounOrder; // updating the global maxOrder variable

                                var maxOrderPercentage = (nounOrder / 10000 * 100).toFixed(2) + '%';
                            }
                            $('#proficiencyLevel').text(maxOrderPercentage);
                            $('#profTooltip').text(maxOrderPercentage + ' Proficiency Level');

                        }

                        // Write the updated progress and stats back to Firestore
                        transaction.set(userProgressRef, data);
                        transaction.set(allTimeStatsRef, allTimeData);

                        return Promise.resolve(data); // Return updated data
                    });
                });
            }).then((data) => {
                console.log('Transaction successful');
                updateCoachFeedback(streakCorrect, streakWrong);
            }).catch(error => {
                console.error('Transaction failed:', error);
            });

        } else {
            console.error("Noun not found");
        }
    }).catch(error => {
        console.error('Error fetching noun data:', error);
    });
}

// Function to update the coach message with a random encouragement statement
function showEncouragementMessage() {
    const randomIndex = Math.floor(Math.random() * encouragementStatements.length);
    const message = encouragementStatements[randomIndex];

    // You can implement coach feedback display here if needed
}

// Function to update coach feedback
function updateCoachFeedback(correctStreak, incorrectStreak) {
    let coachMessage = '';

    if (correctStreak >= 9) {
        coachMessage = "Amazing! You're on fire!";
    } else if (correctStreak == 7) {
        coachMessage = "Fantastic! Keep up the great work!";
    } else if (correctStreak == 5) {
        coachMessage = "Great job! You're halfway there!";
    } else if (correctStreak == 3) {
        coachMessage = "Good going! Keep it up!";
    } else if (correctStreak > 0) {
        coachMessage = "Correct!";
    } else if (incorrectStreak >= 9) {
        coachMessage = "Don't give up! Take a deep breath.";
    } else if (incorrectStreak == 7) {
        coachMessage = "Keep trying! You'll get it!";
    } else if (incorrectStreak == 5) {
        coachMessage = "Stay focused! You can do it!";
    } else if (incorrectStreak == 3) {
        coachMessage = "It's okay! Let's try another.";
    } else {
        coachMessage = "Incorrect. Let's keep practicing!";
    }

    // Display coach feedback if needed
}

// Function to update the visual stats (correct/wrong counts and last 5 answers)
function updateVisualStats(isCorrect) {
    // Update correct/wrong counts
    if (isCorrect) {
        correctAnswers++;
    } else {
        wrongAnswers++;
    }

    // Update last 5 answers (push new answer and maintain only 5)
    if (lastFiveAnswers.length >= 5) {
        lastFiveAnswers.shift(); // Remove the oldest entry
    }
    lastFiveAnswers.push(isCorrect ? 'correct' : 'wrong');

    // Update UI for correct/wrong counts
    $('#correct-count').text(correctAnswers);
    $('#wrong-count').text(wrongAnswers);

    // Update last 5 answers (display boxes)
    updateLastFiveAnswers();
}

// Function to visually update the last 5 answers
function updateLastFiveAnswers() {
    const container = $('#last-five-answers');
    container.empty(); // Clear the container

    // Add boxes based on last 5 answers
    for (let i = 0; i < 5; i++) {
        let answerClass = 'gray'; // Default is gray
        if (i < lastFiveAnswers.length) {
            answerClass = lastFiveAnswers[i] === 'correct' ? 'green' : 'red';
        }
        const box = $('<div></div>').addClass('answer-box').css('background-color', answerClass);
        container.append(box);
    }
}

// Update stats in the database
function updateStats(userStatsRef, date, score, isCorrect, timeTaken) {

    const dailyStatsRef = userStatsRef.doc(date);
    const allTimeStatsRef = userStatsRef.doc('all-time');

    db.runTransaction(transaction => {
        return transaction.get(dailyStatsRef).then(dailyDoc => {
            return transaction.get(allTimeStatsRef).then(allTimeDoc => {
                // Helper function to validate and sanitize fields
                function ensureNumber(value, defaultValue = 0) {
                    return (typeof value === 'number' && !isNaN(value)) ? value : defaultValue;
                }

                // Process daily stats
                const dailyData = dailyDoc.exists ? dailyDoc.data() : {
                    correctAnswers: 0,
                    wrongAnswers: 0,
                    totalDrills: 0,
                    score: 0,
                    nouns_correctAnswers: 0,
                    nouns_wrongAnswers: 0,
                    nouns_totalDrills: 0,
                    nouns_score: 0,
                    nouns_DailyTime: 0, // Initialize DailyTime
                    DailyTime: 0 // Initialize DailyTime
                };

                // Ensure all fields are numbers
                dailyData.totalDrills = ensureNumber(dailyData.totalDrills);
                dailyData.score = ensureNumber(dailyData.score);
                dailyData.correctAnswers = ensureNumber(dailyData.correctAnswers);
                dailyData.wrongAnswers = ensureNumber(dailyData.wrongAnswers);
                dailyData.nouns_totalDrills = ensureNumber(dailyData.nouns_totalDrills);
                dailyData.nouns_score = ensureNumber(dailyData.nouns_score);
                dailyData.nouns_correctAnswers = ensureNumber(dailyData.nouns_correctAnswers);
                dailyData.nouns_wrongAnswers = ensureNumber(dailyData.nouns_wrongAnswers);
                dailyData.DailyTime = ensureNumber(dailyData.DailyTime); // Ensure DailyTime is a number
                dailyData.nouns_DailyTime = ensureNumber(dailyData.nouns_DailyTime); // Ensure DailyTime is a number

                // Update stats safely
                dailyData.totalDrills += 1;
                dailyData.score += score;
                dailyData.nouns_totalDrills += 1;
                dailyData.nouns_score += score;
                dailyData.nouns_DailyTime += timeTaken; // Add time taken to DailyTime
                dailyData.DailyTime += timeTaken; // Add time taken to DailyTime

                if (isCorrect) {
                    dailyData.correctAnswers += 1;
                    dailyData.nouns_correctAnswers += 1;
                } else {
                    dailyData.wrongAnswers += 1;
                    dailyData.nouns_wrongAnswers += 1;
                }

                // Process all-time stats
                const allTimeData = allTimeDoc.exists ? allTimeDoc.data() : {
                    totalCorrectAnswers: 0,
                    totalWrongAnswers: 0,
                    totalDrills: 0,
                    totalScore: 0,
                    nouns_totalCorrectAnswers: 0,
                    nouns_totalWrongAnswers: 0,
                    nouns_totalDrills: 0,
                    nouns_totalScore: 0,
                    nouns_TimeSpent: 0, // Initialize TimeSpent
                    TimeSpent: 0 // Initialize TimeSpent
                };

                // Ensure all fields are numbers
                allTimeData.totalDrills = ensureNumber(allTimeData.totalDrills);
                allTimeData.totalScore = ensureNumber(allTimeData.totalScore);
                allTimeData.totalCorrectAnswers = ensureNumber(allTimeData.totalCorrectAnswers);
                allTimeData.totalWrongAnswers = ensureNumber(allTimeData.totalWrongAnswers);
                allTimeData.nouns_totalDrills = ensureNumber(allTimeData.nouns_totalDrills);
                allTimeData.nouns_totalScore = ensureNumber(allTimeData.nouns_totalScore);
                allTimeData.nouns_totalCorrectAnswers = ensureNumber(allTimeData.nouns_totalCorrectAnswers);
                allTimeData.nouns_totalWrongAnswers = ensureNumber(allTimeData.nouns_totalWrongAnswers);
                allTimeData.nouns_TimeSpent = ensureNumber(allTimeData.nouns_TimeSpent); // Ensure TimeSpent is a number
                allTimeData.TimeSpent = ensureNumber(allTimeData.TimeSpent); // Ensure TimeSpent is a number


                // Update stats safely
                allTimeData.totalDrills += 1;
                allTimeData.totalScore += score;
                allTimeData.nouns_totalDrills += 1;
                allTimeData.nouns_totalScore += score;
                allTimeData.nouns_TimeSpent += timeTaken; // Add time taken to TimeSpent
                allTimeData.TimeSpent += timeTaken; // Add time taken to TimeSpent

                if (isCorrect) {
                    allTimeData.totalCorrectAnswers += 1;
                    allTimeData.nouns_totalCorrectAnswers += 1;
                } else {
                    allTimeData.totalWrongAnswers += 1;
                    allTimeData.nouns_totalWrongAnswers += 1;
                }

                // Write both sets of stats after all reads
                transaction.set(dailyStatsRef, dailyData);
                transaction.set(allTimeStatsRef, allTimeData);

                return Promise.resolve(); // Indicate the transaction is complete
            });
        });
    }).then(() => {
        console.log('Stats updated successfully');
    }).catch(error => {
        console.error('Transaction failed:', error);
    });
}

// Helper function to calculate time difference
function timeDifference(lastAnswered) {
    if (!lastAnswered) {
        return "(new noun)";
    }

    let now = new Date();
    const diff = now - lastAnswered.toDate(); // Calculate time difference in milliseconds

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
        return `(shown last ${years} year${years > 1 ? 's' : ''} ago)`;
    } else if (months > 0) {
        return `(shown last ${months} month${months > 1 ? 's' : ''} ago)`;
    } else if (weeks > 0) {
        return `(shown last ${weeks} week${weeks > 1 ? 's' : ''} ago)`;
    } else if (days > 0) {
        return `(shown last ${days} day${days > 1 ? 's' : ''} ago)`;
    } else if (hours > 0) {
        return `(shown last ${hours} hour${hours > 1 ? 's' : ''} ago)`;
    } else if (minutes > 0) {
        return `(shown last ${minutes} minute${minutes > 1 ? 's' : ''} ago)`;
    } else {
        return "(new noun)";
    }
}

function buttonClick(which) {
    if (which === 'stats') {
        window.location.href = 'stats.html';
    }
}

function addCharacter(character) {
    const inputField = document.getElementById('user-answer');
    if (inputField) {
        const maxLength = inputField.maxLength;
        const currentValue = inputField.value;
        const startPos = inputField.selectionStart;
        const endPos = inputField.selectionEnd;

        // Calculate the new length after insertion
        const newLength = currentValue.length - (endPos - startPos) + character.length;

        // Check if the new length exceeds the max length
        if (newLength <= maxLength) {
            // Insert the character at the current cursor position
            inputField.value = currentValue.substring(0, startPos) + character + currentValue.substring(endPos);

            // Move the cursor to the end of the inserted character
            const newCursorPos = startPos + character.length;
            inputField.setSelectionRange(newCursorPos, newCursorPos);
        }

        // Focus the input field
        inputField.focus();
    }
}

function backToCourseSelection() {
    window.location.href = '/course_selection.html';
}

$('#help-button').on('click', function () {
    $('#helpModal').modal('show'); // Show the help modal
});

// Event listener for the Report button
$('#report-button').on('click', function () {
    $('#report-question-id').val(window.currentNounId); // Set the current noun ID
    $('#reportModal').modal('show'); // Show the report modal
});

// Event listener for the Submit button in the report modal
$('#submit-report').on('click', function () {
    const comment = $('#report-comment').val().trim();
    const nounId = $('#report-question-id').val();
    const user = firebase.auth().currentUser;
    const currentTime = new Date().toISOString();

    if (comment && nounId && user) {
        // Prepare the report data
        const reportData = {
            questionType: "nouns",
            nounId: nounId,
            timeOfUpdate: currentTime,
            comment: comment,
            language: window.currentNounData.language,
            knownLanguage: window.currentNounData.knownLanguage,
            isMultipleChoice: isMultipleChoice,
            userId: uid,
            status: 'created'
        };

        // Insert the report into Firestore
        db.collection('reports').add(reportData)
            .then(() => {
                $('#reportForm')[0].reset(); // Clear the form
                $('#reportModal').modal('hide'); // Close the modal
                alert('Report submitted successfully.');
            })
            .catch(error => {
                console.error('Error submitting report:', error);
                alert('Failed to submit report. Please try again.');
            });
    } else {
        alert('Please enter a comment before submitting.');
    }
});

// Function to check drills and show modal if limit is reached
async function checkDrillsLimit(user, currentCourse) {

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Create a date object for the current date
    let now = new Date();

    // Format the date according to the user's timezone
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: userTimezone };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(now);

    // Split the formatted date into parts
    const [month, day, year] = formattedDate.split('/');

    // Create the date in yyyy-mm-dd format
    var today = `${year}-${month}-${day}`;

    const userDocRef = db.collection('users').doc(user.uid);
    const courseDocRef = userDocRef.collection('courses').doc(currentCourse);

    try {
        const statsDoc = await courseDocRef.collection('stats').doc(today).get();
        let totalDrills = 0;

        if (statsDoc.exists) {
            const data = statsDoc.data();
            totalDrills = (data.totalDrills || 0);
        }

        // Check subscription level
        const userData = await userDocRef.get();
        const subLevel = userData.data().subLevel;

        if (subLevel === 'Free' && totalDrills >= 50) {
            // Show modal if drills limit is reached
            const modalElement = new bootstrap.Modal(document.getElementById('drillsLimitModal'), {
                backdrop: 'static',
                keyboard: false
            });
            modalElement.show();
        } else {
            // Proceed with loading drills or nouns
        }
    } catch (error) {
        console.error("Error checking drills limit:", error);
    }
}

function afterDrillCompleted(user, currentCourse) {
    checkDrillsLimit(user, currentCourse);
}

function updateSpecialCharacters(targetLanguage) {
    const specialChars = languageToSpecialChars[targetLanguage] || [];
    const specialCharsContainer = document.getElementById('special-characters');

    // Clear existing buttons
    specialCharsContainer.innerHTML = '';

    // Create buttons for each special character
    specialChars.forEach(char => {
        const button = document.createElement('button');
        button.className = 'btn btn-light';
        button.textContent = char;
        button.onclick = () => addCharacter(char);
        specialCharsContainer.appendChild(button);
    });

    // Show the special characters container if there are characters to display
    if (specialChars.length > 0) {
        specialCharsContainer.style.display = 'block';
    } else {
        specialCharsContainer.style.display = 'none';
    }
}

function adjustInputField(noun, currentCourse) {


    const inputField = document.getElementById('user-answer');
    const padding = 2; // Additional padding in 'rem' for better appearance

    // Set the maximum length of the input field
    inputField.maxLength = noun.length;

    let language = currentCourse.split('-')[1];
    if (language == 'de') {
        if (noun.includes('ß')) {
            inputField.maxLength += 1;
        }

    } else if (language == 'fr') {
        if (noun.includes("'")) {
            inputField.maxLength += 1;
        }
    }

    // Create a canvas element to measure text width
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = window.getComputedStyle(inputField).font; // Use the same font as the input field

    // Measure the width of the noun
    const textWidth = context.measureText(noun).width;

    // Convert the width from pixels to rems
    const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const calculatedWidth = (textWidth / remSize) + padding;

    // Set the width of the input field
    inputField.style.width = `${calculatedWidth}rem`;
}



function loadRandomImages(imgNumber) {
    // Generate a random number in the range of currentOrder - 20 to currentOrder + 20
    // const randomOrder = Math.floor(Math.random() * 41) + (currentOrder - 20);
    const randomOrder = Math.floor(Math.random() * 98) + 1; // Generate a random number between 1 and 98




    const imgUrl = `https://languizy.com/myimages/nouns/noun-${randomOrder}.png/smaller`;
    if (!fourImagesToLoad.includes(imgUrl)) { // Check if the image URL is not already in the array
        const img = new Image();
        img.src = imgUrl;
        img.onload = () => {

            fourImagesToLoad.push(imgUrl);
            imgNumber++;
            if (imgNumber === 4) {

                // displayImages();
            } else {

                loadRandomImages(imgNumber); // Load the next image
            }
        };
        img.onerror = () => {
            loadRandomImages(imgNumber); // Retry loading another image if there's an error
        };
    } else {
        loadRandomImages(imgNumber); // Retry loading another image if the URL is already in the array
    }

}

// Function to play feedback sound
function playFeedbackSound(isCorrect) {
    const feedbackAudio = new Audio();
    feedbackAudio.src = isCorrect ? '/assets/audio/correct.mp3' : '/assets/audio/wrong.mp3';

    // Play the feedback sound
    feedbackAudio.play()
        .then(() => {
            console.log("Feedback sound played successfully.");
        })
        .catch((error) => {
            console.error("Error playing feedback sound:", error);
        });

}