// grammar-lesson.js

// Initialize Firestore
var db = firebase.firestore();
var dailyScore = 0;
var debounceTimeout = null; // Use a debounce timeout instead of a boolean flag
let correctAnswers = 0;
let wrongAnswers = 0;
let streakCorrect = 0;
let streakWrong = 0;
let lastFiveAnswers = [];
let showCoachFeedback = true;

let questionStartTime; // Variable to store the start time of the question


let uid = null;

// Global variable to track the current mode (multiple-choice or text input)
let isMultipleChoice;

let hasShownCompletionModal = false;
let startedAt100 = false; // Initialize as false


// Global variables to store the current question data
let currentQuestionId;
let currentQuestionData;
let currentLesson;
let currentLanguagePair;
let previousQuestionId = null;
let lessonName = ''; // Global variable to store the lesson name



// Array of random encouragement statements
const encouragementStatements = [
    "You got this! Let's make this fun!",
    "Believe in yourself – you're doing great!",
    "Let's conquer this question together!",
    "You're unstoppable! Keep up the good work!",
    "Every step counts – let's make it count!"
];

const loadingMessages = [
   "Hang tight! We're fetching some cool grammar tips...",
  "Just a moment! Your explanation is on the way...",
  "Patience is key! Almost there with your breakdown...",
  "Great things take time, and so does your explanation...",
  "Did you know? We're crafting the perfect explanation just for you...",
  "A little longer... Good things come to those who wait!",
  "Loading... the suspense is building!",
  "Grabbing the grammar gnomes... they can be tricky to catch!",
  "We're halfway there... keep your linguistic curiosity strong!",
  "Cooking up some tasty grammar for your brain. Yum!",
  "Just a sec... the grammar elves are polishing their explanations.",
  "Almost ready! Good explanations can't be rushed!",
  "Brushing up the words, cleaning up the commas...",
  "Did you know? Explaining things is 70% magic, 30% caffeine.",
  "Your grammar wish is our command... almost granted!",
  "Making sure every word is in its proper place...",
  "Loading... this is a great time to stretch, don't you think?",
  "Our grammar detectives are connecting all the clues!",
  "Fetching some A+ explanations for your learning pleasure...",
  "It's like brewing coffee, but with words. Hold on!",
  "Loading... our language squirrel is gathering all the nuts of knowledge!",
  "Meanwhile, in the Land of Verbs... your answer is being prepared.",
  "Ever wonder how explanations are made? Well, you’re about to find out...",
  "Beep boop... translating grammar magic into human-readable form.",
  "The words are warming up... almost ready to jump onto your screen!",
  "We're making sure every comma and full stop is in tip-top shape...",
  "Spinning up the Grammar Machine... almost done!",
  "Words are like cheese... they get better with a little time.",
  "Practicing some word yoga... stretching those definitions!",
  "Adding some pizzazz to those explanations... sparkle, sparkle!",
  "Taking a grammar selfie... it just needs the right angle.",
  "Pouring a cup of linguistic tea... patience is brewed!",
  "Shhh... the words are concentrating. Silence, please.",
  "Our grammar gremlins are triple-checking everything!",
  "Your explanation is coming... it's fashionably late, but worth it.",
  "Grabbing some words from the adjective jungle... they'll be back soon.",
  "Counting all the verbs... and there are a lot of them!",
  "Just fluffing up the explanations so they look nice and neat.",
  "Filling in the missing word... with style and precision!",
  "All the commas are lining up in a row... very orderly.",
  "Your explanation is being wrapped with a bow. Almost ready to open!",
  "Generating some A-grade grammar jokes... and your explanation too.",
  "Crossing all the t's and dotting all the i's... literally.",
  "Finding just the right words... it's a very picky process.",
  "Patience, grasshopper. Your grammar lesson will be worth the wait!",
  "We’re talking to a noun about your explanation... nouns talk slow.",
  "We're fishing for some top-notch explanations... almost caught one!",
  "Balancing out the sentence structure... it's like word acrobatics!",
  "The missing word is shy... coaxing it out for you.",
  "Putting the final touches on your word masterpiece... voila!",
  "Loading... trust me, your brain is going to love this!"
];

let interimMessageInterval;

var audioElement = new Audio(); // Create a new audio element
const countryToLanguage = {
    cn: { languageCode: "cmn-CN", voice: "Zhiyu" }, // China
    in: { languageCode: "hi-IN", voice: "Aditi" }, // India
    us: { languageCode: "en-US", voice: "Joanna" }, // United States
    br: { languageCode: "pt-BR", voice: "Camila" }, // Brazil
    ru: { languageCode: "ru-RU", voice: "Tatyana" }, // Russia
    jp: { languageCode: "ja-JP", voice: "Mizuki" }, // Japan
    eg: { languageCode: "arb", voice: "Zeina" }, // Egypt (Arabic)
    tr: { languageCode: "tr-TR", voice: "Filiz" }, // Turkey
    de: { languageCode: "de-DE", voice: "Marlene" }, // Germany
    fr: { languageCode: "fr-FR", voice: "Celine" }, // France
    es: { languageCode: "es-ES", voice: "Conchita" }, // Spain
    it: { languageCode: "it-IT", voice: "Carla" }, // Italy
    nl: { languageCode: "nl-NL", voice: "Lotte" }, // Netherlands
    sv: { languageCode: "sv-SE", voice: "Astrid" }, // Sweden
    no: { languageCode: "nb-NO", voice: "Liv" }, // Norway
    dk: { languageCode: "da-DK", voice: "Naja" } // Denmark
};

const languageToSpecialChars = {
    de: ['ä', 'ö', 'ü', 'ß'], // German
    fr: ['é', 'è', 'ç', 'à'], // French
    es: ['ñ', 'á', 'é', 'í'], // Spanish
    pt: ['ã', 'ç', 'é', 'õ'], // Portuguese
    it: ['à', 'è', 'ì', 'ò'], // Italian
    sv: ['å', 'ä', 'ö'],      // Swedish
    nl: ['é', 'ë', 'ï', 'ü'], // Dutch
    da: ['æ', 'ø', 'å'],      // Danish
    no: ['æ', 'ø', 'å'],      // Norwegian
    pl: ['ą', 'ć', 'ę', 'ł']  // Polish
  };

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

async function fetchOrAssignCoach(user) {
    const userRef = db.collection('users').doc(user.uid);

    try {
        // Get user document to find coach ID
        const userDoc = await userRef.get();
        let userData = userDoc.data();
        showCoachFeedback = userData.CoachFeedback !== undefined ? userData.CoachFeedback : true;
            if (showCoachFeedback) {
                $('#coach-container').addClass('d-flex').removeClass('d-none');
            } else {
            $('#coach-container').addClass('d-none').removeClass('d-flex');
        }

        let coachId = userDoc.exists && userData.coach;
        populateSubLevelBadge(userDoc)
        // If no coach is assigned, set the default coach ID and update the user document
        if (!coachId) {
            coachId = "ntRoVcqi2KNo6tvljdQ2"; // Default coach ID
            await userRef.update({ coach: coachId });
        }

        // Fetch coach data from Firestore
        const coachData = await fetchCoachData(coachId);

        // Set global variables or store coach data to be used throughout the practice screen
        window.coachData = coachData;
        setCoachImage(coachData.image); // Set the coach image in the UI
    } catch (error) {
        console.error('Error fetching or assigning coach:', error);
    }
}

async function fetchCoachData(coachId) {
    try {
        const coachDoc = await db.collection('coaches').doc(coachId).get();
        if (!coachDoc.exists) throw new Error(`Coach with ID ${coachId} not found.`);

        const coachData = coachDoc.data();

        // Get 10 random entries from each message array
        function getRandomMessages(array, count = 10) {
            return array.sort(() => 0.5 - Math.random()).slice(0, count);
        }

        return {
            coachName: coachData.coachName,
            image: coachData.image,
            correctMessages: getRandomMessages(coachData.correctMessages),
            encouragementMessages: getRandomMessages(coachData.encouragementMessages),
            fiveCorrectMessages: getRandomMessages(coachData.fiveCorrectMessages),
            fiveMistakesMessages: getRandomMessages(coachData.fiveMistakesMessages),
            loadingMessages: getRandomMessages(coachData.loadingMessages),
            mistakeMessages: getRandomMessages(coachData.mistakeMessages),
            sevenCorrectMessages: getRandomMessages(coachData.sevenCorrectMessages),
            sevenMistakesMessages: getRandomMessages(coachData.sevenMistakesMessages),
            threeCorrectMessages: getRandomMessages(coachData.threeCorrectMessages),
            threeMistakesMessages: getRandomMessages(coachData.threeMistakesMessages),
            tonsOfCorrectsInARowMessages: getRandomMessages(coachData.tonsOfCorrectsInARowMessages),
            tonsOfMistakesInARowMessages: getRandomMessages(coachData.tonsOfMistakesInARowMessages),
        };
    } catch (error) {
        console.error('Error fetching coach data:', error);
    }
}

function setCoachImage(imageFilename) {
    const imagePath = `assets/images/${imageFilename}`;
    $('#coachImage').attr('src', imagePath); // Assuming there's an <img id="coachImage"> in your HTML
    $('#coachImage').removeClass('invisible');
}

function updateFlagIcons(currentLesson) {
    const flagCard = document.getElementById('flag-card');
    if (!flagCard) return;
    debugger;
    // Clear existing flags
    flagCard.innerHTML = '';

    // Define a mapping of lesson IDs to flag icons
    const lessonToFlags = {
        'en-de': ['assets/icons/en-flag.png', 'assets/icons/de-flag.png'],
        'en-es': ['assets/icons/en-flag.png', 'assets/icons/es-flag.png'],
        'en-fr': ['assets/icons/en-flag.png', 'assets/icons/fr-flag.png'],
        'en-it': ['assets/icons/en-flag.png', 'assets/icons/it-flag.png'],
        'en-ru': ['assets/icons/en-flag.png', 'assets/icons/ru-flag.png'],
        'en-cn': ['assets/icons/en-flag.png', 'assets/icons/cn-flag.png'],
        'en-pt': ['assets/icons/en-flag.png', 'assets/icons/pt-flag.png'],
        'en-nl': ['assets/icons/en-flag.png', 'assets/icons/nl-flag.png'],
        // Add more lessons and their corresponding flags here
    };

    const flags = lessonToFlags[window.currentLanguagePair];
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
        console.warn(`No flags found for lesson: ${currentLesson}`);
    }
}

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        fetchOrAssignCoach(user).then(() => {
            fetchCurrentLesson(user).then(async (currentLesson) => {
                loadUserAvatar(user);
                if (!currentLesson) {
                    console.error('No valid current lesson found.');
                    window.location.href = 'course_selection.html';
                    return;
                }
                debugger;
                fetchLessonName(currentLesson).then(name => {
                    lessonName = name;
                    console.log(`Current Lesson Name: ${lessonName}`);
                    displayLessonName(lessonName);
                }).catch(error => {
                    console.error('Error fetching lesson name:', error);
                });

                // Initialize default mode and load question
                initializeDefaultMode();
                loadQuestion(user, currentLesson);
                updateFlagIcons(currentLesson);
                loadDailyScore(user, currentLesson);

                const targetLanguage = window.currentLanguagePair.split('-')[1];
                updateSpecialCharacters(targetLanguage);
 

                // Fetch and store the lesson name, then display it
                

                

                // After loading the initial question, check if started at 100%
                if (startedAt100 && !hasShownCompletionModal) {
                    await showCompletionModal(currentLesson);
                    hasShownCompletionModal = true;
                }
            }).catch((error) => {
                console.error('Error fetching current lesson:', error);
                window.location.href = 'course_selection.html';
            });
        });
    } else {
        window.location.href = '/';
    }
});


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
        'question_type': 'Grammar',
        'user_id': uid,
        'user_pressed': isMultipleChoice ? 'Make it easier' : 'Make it harder',
        'course': window.currentLanguagePair
    });
    // Reload the current question with the new mode
    displayQuestion(currentQuestionData, currentQuestionId, currentLesson);
}

// Function to fetch the current lesson based on URL or Firestore
function fetchCurrentLesson(user) {
    return new Promise((resolve, reject) => {
        debugger;
        const urlParams = new URLSearchParams(window.location.search);
        const topicFromUrl = urlParams.get('topic');
        const targetLanguage = urlParams.get('language');
        const knownLanguage = urlParams.get('knownLanguage');

        if (topicFromUrl && targetLanguage && knownLanguage) {
            let lessonId = topicFromUrl;
            console.log(`Lesson ID found in URL: ${lessonId}`);
            window.currentLanguagePair = knownLanguage + '-' + targetLanguage;
            $("#topicNum").html(lessonId);
            

            // Check if the lesson exists (validate that questions exist for this lesson)
            validateLesson(lessonId, targetLanguage, knownLanguage).then((isValidLesson) => {
                if (isValidLesson) {
                    // Update the `currentLesson` field in Firestore for the user
                    updateCurrentLessonInFirestore(user, lessonId).then(() => {
                        resolve(lessonId); // Now resolve the promise
                    }).catch(reject);
                } else {
                    // If the URL lesson is invalid, fall back to Firestore lesson
                    console.warn('Invalid lesson ID in URL, falling back to Firestore currentLesson.');
                    getFirestoreCurrentLesson(user).then(resolve).catch(reject);
                }
            }).catch(reject);
        } else {
            // No lesson in URL, fallback to Firestore
            getFirestoreCurrentLesson(user).then(resolve).catch(reject);
        }
    });
}

// Function to update Firestore with the new lesson selection
function updateCurrentLessonInFirestore(user, newLessonId) {
    return db.collection('users').doc(user.uid).update({
        currentLesson: newLessonId
    }).then(() => {
        console.log(`Updated currentLesson in Firestore to: ${newLessonId}`);
    }).catch((error) => {
        console.error('Error updating current lesson in Firestore:', error);
    });
}

// // Function to register the lesson in the user's 'grammar' sub-collection
// function registerUserLesson(user, lessonId, knownLanguage, targetLanguage) {
//     return db.collection('users').doc(user.uid)
//         .collection('grammar').doc(lessonId)
//         .set({
//             knownLanguage: knownLanguage,
//             targetLanguage: targetLanguage,
//             lessonNumber: parseInt(lessonId.split('-').pop()),
//         }).then(() => {
//             console.log(`Lesson ${lessonId} successfully registered in Firestore.`);
//         }).catch((error) => {
//             console.error('Error registering lesson in Firestore:', error);
//             throw error; // Pass the error up the chain
//         });
// }

// Function to get the current lesson from Firestore
function getFirestoreCurrentLesson(user) {
    return new Promise((resolve, reject) => {
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists && doc.data().currentLesson) {
                console.log(`Fetched currentLesson from Firestore: ${doc.data().currentLesson}`);
                resolve(doc.data().currentLesson);
            } else {
                resolve(null);
            }
        }).catch((error) => {
            console.error('Error fetching current lesson from Firestore:', error);
            reject(error);
        });
    });
}

// Function to validate if the lesson exists (i.e., there are questions for it)
function validateLesson(lessonId, language, knownLanguage) {
    return db.collection('grammar_questions')
        .where('topic', '==', parseInt(lessonId))
        .where('language', '==', language)
        .where('knownLanguage', '==', knownLanguage)
        .limit(1) // Check if at least one question exists
        .get()
        .then(snapshot => !snapshot.empty)
        .catch(error => {
            console.error('Error validating lesson:', error);
            return false;
        });
    }

// Function to load daily score from Firestore
function loadDailyScore(user, currentCourse) {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Create a date object for the current date
const now = new Date();

// Format the date according to the user's timezone
const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: userTimezone };
const formattedDate = new Intl.DateTimeFormat('en-US', options).format(now);

// Split the formatted date into parts
const [month, day, year] = formattedDate.split('/');

// Create the date in yyyy-mm-dd format
var today = `${year}-${month}-${day}`;
    

    // Fetch user's current lesson stats from the "grammar" sub-collection
    var userStatsRef = db.collection('users').doc(user.uid)
    .collection('courses').doc(window.currentLanguagePair)
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

// Load a question from Firestore
function loadQuestion(user, currentLesson) {
    debugger;
    showLoadingProgress();

    if (!user) {
        console.error("User is not authenticated.");
        return;
    }

    if (!currentLesson) {
        console.error('User has not selected a lesson.');
        window.location.href = 'course_selection.html';
        return;
    }
debugger;
    checkDrillsLimit(user, window.currentLanguagePair);

    // Show a random encouragement message when loading a new question
    showEncouragementMessage();

    // Step 1: Pull the next due question, ensuring it's not the same as the previous one
    db.collection('users').doc(user.uid)
        .collection('grammar').doc(window.currentLanguagePair)
        .collection('questions')
        .where('nextDue', '<=', new Date())
        .where('topic', '==', parseInt(currentLesson))
        .orderBy('nextDue')
        .limit(1)
        .get()
        .then(progressSnapshot => {
            console.log('Step 1 - ');
            if (!progressSnapshot.empty) {
                console.log('progressSnapshot isnt empty');
                let nextQuestionDoc = progressSnapshot.docs[0];
                    console.log('loading the first doc from progressSnapshot');
                    console.log('next question Id is: ',nextQuestionDoc.id);

                // If the next due question is the same as the previous one, get the next available question
                if (nextQuestionDoc.id === previousQuestionId) {
                    console.log('next question is supposed to be the same as the previous one already shown...');
                    return db.collection('users').doc(user.uid)
                        .collection('grammar').doc(window.currentLanguagePair)
                        .collection('questions')
                        .where('nextDue', '<=', new Date())
                        .where('topic', '==', parseInt(currentLesson))
                        .orderBy('nextDue')
                        .limit(2) // Pull 2 questions and skip the first
                        .get()
                        .then(secondSnapshot => {
                            console.log('pulling the second possible match as the first question for review is identical to the one just shown');
                            return secondSnapshot.docs[1] || null; // Return the next question if available

                        });
                } else {
                    return nextQuestionDoc; // Return the next question if it's different
                }
            } else {
                // No due questions found; proceed to load a new question
                console.log('No due questions found; proceed to load a new question');
                return loadNewQuestion(user, currentLesson).then(newQuestionDoc => {
                    return newQuestionDoc || loadNextEarlyQuestion(user, currentLesson); // Fallback to next early question
                });
            }
        })
        .then(nextQuestionDoc => {
            if (nextQuestionDoc) {
                const questionId = nextQuestionDoc.id;
                loadQuestionData(questionId, currentLesson); // Load and display the question
                previousQuestionId = questionId; // Update the previous question ID
            } else {
                console.log('No questions found at all.');
            }
        })
        .catch(error => {
            console.error('Error fetching next question:', error);
        });
}


// Load question data and display
function loadQuestionData(questionId, currentLesson) {
    db.collection('grammar_questions').doc(questionId).get()
    .then(questionDoc => {
        if (questionDoc.exists) {
            
            displayQuestion(questionDoc.data(), questionId, currentLesson);
        } else {
            console.error('Question not found:', questionId);
        }
    });
}


// Load a new question that hasn't been answered yet or from a specific lesson
function loadNewQuestion(user, lessonId) {
    console.log('loadNewQuestion function... Trying to load a new question that the user didnt see yet');
    return new Promise((resolve, reject) => {
        if (typeof(window.currentLanguagePair) !== 'undefined') {
            fetchAndLoadQuestions(window.currentLanguagePair, lessonId)
                .then(newQuestionDoc => {
                    // Check that the new question is not identical to the previous question
                    if (newQuestionDoc && newQuestionDoc.id !== previousQuestionId) {
                        displayQuestion(newQuestionDoc.data, newQuestionDoc.id, window.currentLanguagePair);
                        previousQuestionId = newQuestionDoc.id; // Update the previous question ID
                        resolve(newQuestionDoc); // Resolve with the new question document
                    } else {
                        // If no new question or duplicate, proceed to load the next early question
                        loadNextEarlyQuestion(user, window.currentLanguagePair, lessonId)
                            .then(resolve)
                            .catch(reject); // Propagate errors
                    }
                })
                .catch(error => {
                    console.error('Error loading new question:', error);
                    reject(error);
                });
        } else {
            console.error('Error loading user lesson data');
            reject(new Error('Language pair not defined.'));
        }
    });
}

// Fetch questions and progress for the given language pair (e.g., 'en-de')
function fetchAndLoadQuestions(languagePair, topic) {
    console.log(`Fetching questions for language pair: ${languagePair} and topic: ${topic}`);
    
    const [knownLanguage, language] = languagePair.split('-');

    return new Promise((resolve, reject) => {
        // Fetch questions from grammar_questions collection based on the topic
        db.collection('grammar_questions')
            .where('topic', '==', parseInt(topic))
            .where('language', '==', language)
            .where('knownLanguage', '==', knownLanguage)
            .limit(100) // Limit to 20 questions per lesson
            .get()
            .then(questionSnapshot => {
                const questions = [];
                questionSnapshot.forEach(doc => {
                    questions.push({ id: doc.id, data: doc.data() });
                });

                // Fetch progress from the user's grammar collection (for the given languagePair)
                db.collection('users').doc(firebase.auth().currentUser.uid)
                    .collection('grammar').doc(languagePair)
                    .collection('questions').get()
                    .then(progressSnapshot => {
                        const seenQuestions = progressSnapshot.docs.map(doc => doc.id);
                        const unseenQuestions = questions.filter(q => !seenQuestions.includes(q.id));

                        if (unseenQuestions.length > 0) {
                            // Resolve with the first unseen question
                            resolve(unseenQuestions[0]);
                        } else {
                            console.log('No new questions available.');
                            resolve(null); // Resolve with null if no unseen questions
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching progress data:', error);
                        reject(error);
                    });
            })
            .catch(error => {
                console.error('Error fetching grammar questions:', error);
                reject(error);
            });
    });
}

// Load the next available question even if it's not due (based on the topic and language pair)
function loadNextEarlyQuestion(user, languagePair, topic) {
    return new Promise((resolve, reject) => {
        db.collection('users').doc(user.uid)
            .collection('grammar').doc(languagePair)
            .collection('questions')
            .where('topic', '==', parseInt(topic))
            .orderBy('nextDue', 'asc')
            .limit(2) // Fetch two questions to handle the case of repeating questions
            .get()
            .then(progressSnapshot => {
                if (!progressSnapshot.empty) {
                    const progressDocs = progressSnapshot.docs;

                    // Find the first question that is not the same as the previous one
                    const nextQuestionDoc = progressDocs.find(doc => doc.id !== previousQuestionId);

                    if (nextQuestionDoc) {
                        resolve({ id: nextQuestionDoc.id, data: nextQuestionDoc.data() });
                    } else {
                        // If all retrieved questions are the same as the previous one, resolve with the first one (fallback)
                        resolve({ id: progressDocs[0].id, data: progressDocs[0].data() });
                    }
                } else {
                    console.log('No questions found at all.');
                    resolve(null);
                }
            })
            .then(async (nextQuestionDoc) => {
                if (nextQuestionDoc) {
                    // Check if this question was answered correctly before
                    if (nextQuestionDoc.data().timesCorrectInARow >= 1) {
                        // Now, check if all questions are answered correctly
                        const { totalQuestions, correctQuestions } = await fetchTotalQuestionsAndCorrect(
                            db.collection('users').doc(user.uid),
                            topic,
                            languagePair.split('-')[1],
                            languagePair.split('-')[0]
                        );

                        if (totalQuestions > 0 && correctQuestions === totalQuestions) {
                            // Set startedAt100 to true
                            startedAt100 = true;
                            console.log('User has achieved 100% in this lesson.');

                            // Do not show the modal
                        }
                    }

                    const questionId = nextQuestionDoc.id;
                    loadQuestionData(questionId, topic); // Load and display the question
                    previousQuestionId = questionId; // Update the previous question ID
                } else {
                    console.log('No questions found.');
                }
            })
            .catch(error => {
                console.error('Error fetching next early question:', error);
                reject(error);
            });
    });
}


function showLoadingMessages() {
    // Use coach-specific loading messages
    const shuffledMessages = [...window.coachData.loadingMessages].sort(() => Math.random() - 0.5);
    let currentMessageIndex = 0;

    const loadingHtml = `
    <div id="loading-indicator" class="loading-container">
        <div class="spinner"></div>
        <p id="loading-message" class="loading-text"></p>
    </div>
    `;

    $('#explanation-content').html(loadingHtml);
    $('#explanationModal').modal('show');

    $('#loading-message').text(shuffledMessages[currentMessageIndex]);

    interimMessageInterval = setInterval(() => {
        currentMessageIndex++;
        if (currentMessageIndex >= shuffledMessages.length) {
            currentMessageIndex = 0;
        }
        $('#loading-message').text(shuffledMessages[currentMessageIndex]);
    }, 2000 + Math.random() * 1000);
}

// Show loading progress
function showLoadingProgress() {
    // Hide the question area content but keep its space
    $('#question-area').removeClass('visible').css('visibility', 'hidden');
    $('.option-btn').text('\u00A0');

    stopAudio();

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
    // Start the timer when the question is loaded
    questionStartTime = new Date();

}

// Display the question on the page
function displayQuestion(question, questionId, currentLesson) {
    console.log(question);
    hideLoadingProgress(); // Hide progress bar when the question loads
    currentQuestionId = questionId;
    currentQuestionData = question;
    currentLesson = question.topic;
    if (currentQuestionData.sentence.indexOf('___') > 0) {
        const index = currentQuestionData.sentence.indexOf('___');
        if (currentQuestionData.sentence[index - 1] !== ' ') {
            currentQuestionData.sentence = currentQuestionData.sentence.slice(0, index) + ' ' + currentQuestionData.sentence.slice(index);
        }
    }


    // Store questionId and current question data globally for use in other functions
    if (typeof questionId !== 'undefined') {
        window.currentQuestionId = questionId;
    } else {
        questionId = window.currentQuestionId;
    }

    // Show the toggle button (Make it Easier/Harder) when a new question is displayed
    $('#toggle-mode').show();
    $('#explain-sentence-btn').hide(); // Hide the explain button initially

    if (typeof question !== 'undefined') {
        window.currentQuestionData = question;
    } else {
        question = window.currentQuestionData;
    }

    if (typeof currentLesson !== 'undefined') {
        window.currentLesson = currentLesson;
    } else {
        currentLesson = window.currentLesson;
    }

    var inputLength = question.missingWord.length;
    if (window.currentQuestionData.language == 'de') {
        if (question.missingWord.includes('ß')) {
            inputLength += 1;
        }

    }

    // Calculate input width dynamically to match the expected answer length
    var inputWidth = inputLength * 1.2;

    // Determine whether to show input field or placeholder based on mode
    const inputField = isMultipleChoice ? '_____' : `<input type="text" autocomplete="off" id="user-answer" class="fill-in-blank" maxlength="${inputLength}" style="width: ${inputWidth}ch;">`;
    var questionHTML = question.sentence.replace(/_{3,}/g, inputField);

    $('.option-btn').removeClass('selected'); // Remove selected class from all options (relevant to multiple choice, but in case user switches)
    $('.option-btn').prop('disabled', false);


    // Display the question with the appropriate input field or placeholder
    $('#sentence').html(questionHTML);
    if (questionHTML.length > 68) {
        $('#sentence').removeClass('size2 size175').addClass('size15');
    } else if (questionHTML.length > 51) {
        $('#sentence').removeClass('size2 size15').addClass('size175');
    } else if (questionHTML.length > 34) {
        $('#sentence').removeClass('size175 size15').addClass('size2');
    } else {
        $('#sentence').removeClass('size2 size175 size15');
    }
    $('#translation').text(question.translation);

    $('#toggle-mode').prop('disabled', false);

    // Retrieve the progress data for this question to get `lastAnswered`
    var user = firebase.auth().currentUser;
    var userProgressRef = db.collection('users').doc(user.uid)
    .collection('grammar').doc(window.currentLanguagePair)
    .collection('questions').doc(questionId);

    userProgressRef.get().then(progressDoc => {
        var questionStatus = "(new question)"; // Default if never answered before

        if (progressDoc.exists) {
            var progressData = progressDoc.data();
            if (progressData.lastAnswered) {
                // Calculate time difference for display
                questionStatus = timeDifference(progressData.lastAnswered);
            }

            // ** NEW: Update Question Stats **
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

        // Display the question status
        $('#translation').append(` <span class="text-muted">${questionStatus}</span>`);

        // Display the translations of the expected answer in the feedback area
        displaymissingWordTranslation(question.missingWordTranslation);

        // Automatically focus on the input field if in text input mode
        if (!isMultipleChoice) {
            $('#user-answer').focus();
        }
    });

    $('#feedback').removeClass('visible text-success text-danger').css('visibility', 'hidden');
    $('#coach-feedback').hide(); // Hide coach feedback when a new question is loaded

    // Show or hide the submit button based on the current mode
    if (isMultipleChoice) {
        $('#submit-answer').hide();
        $('#special-characters').hide();
    } else {
        $('#special-characters').show();
        $('#submit-answer').show();
    }
    $('#next-question').hide();

    // Hide or show elements based on the current mode
    if (isMultipleChoice) {
        $('#user-answer').hide();
        $('#multiple-choice-options').show();
        displayMultipleChoiceOptions(question);
        // Add keydown event for keys 1-4
        $(document).off('keydown.multipleChoice').on('keydown.multipleChoice', function (e) {
            if ($('#next-question').is(':visible')) return; // Ignore if next-question is visible
            const key = e.which - 48; // For top number keys
            if (key >= 1 && key <= 4) {
                e.preventDefault();
                $('.option-btn').eq(key - 1).click();
            }
        });
    } else {
        $('#user-answer').show();
        $('#multiple-choice-options').hide();
        // Remove multiple-choice keydown event
        $(document).off('keydown.multipleChoice');
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
        var isCorrect = normalizeString(userAnswer) === normalizeString(question.missingWord);
        handleAnswerSubmission(user, isCorrect, questionId, 
            currentQuestionData.topic, currentQuestionData.language, currentQuestionData.knownLanguage);
        afterAnswerSubmission(isCorrect);
    }

    // Function to display expected answer translations
    function displaymissingWordTranslation(translationsArray) {

// Check if translationsArray is an array and limit to 3 entries, or if it's a non-empty string
let translationsText = '';
if (Array.isArray(translationsArray)) {
    const translations = translationsArray.slice(0, 3);
    if (translations.length > 0) {
        translationsText = translations.join(', ');
    }
} else if (typeof translationsArray === 'string' && translationsArray.trim() !== '') {
    translationsText = translationsArray.trim();
}

if (translationsText) {
    // Update the #feedback area with the translations
    $('#feedback')
        .html(`<span class="missing-word-translations">${translationsText}</span>`)
        .addClass('visible')
        .removeClass('text-success text-danger'); // Remove any previous feedback classes
} else {
    // Hide the feedback area if there are no translations
    $('#feedback').removeClass('visible').html('');
}
    }


    // Common function to handle after answer submission
    function afterAnswerSubmission(isCorrect, selectedOption) {
        $('#submit-answer').hide();
        $('#next-question').show();

        gtag('event', 'User Answered', {
            'question_type': 'Grammar',
            'user_id': uid,
            'answer': isCorrect,
            'course': window.currentLanguagePair,
            'mode': isMultipleChoice ? 'Multiple_Choice' : 'Cloze'
        });

        // Calculate the time taken to answer the question
  const questionEndTime = new Date();
  let timeTaken = Math.floor((questionEndTime - questionStartTime) / 1000); // Time in seconds
  timeTaken = Math.min(timeTaken, 30); // Cap the time at 30 seconds

        // Disable the toggle button after submission
        $('#toggle-mode').prop('disabled', true);

        // Replace '_____' with the correct answer in the question and style it
        var answerToDisplay = `<span class="correct-answer">${question.missingWord}</span>`;
        var questionHTML = question.sentence.replace(/_{3,}/g, answerToDisplay);
        $('#sentence').html(questionHTML);

        // Feedback to user
        if (isCorrect) {
            $('#feedback').text('Correct!').removeClass('text-danger').addClass('text-success visible').css('visibility', 'visible');
        } else {
            $('#feedback').text(`Incorrect. The correct answer was "${question.missingWord}".`).removeClass('text-success').addClass('text-danger visible').css('visibility', 'visible');
        }

        // Update visual stats and progress
        updateVisualStats(isCorrect);
        updateUserProgress(questionId, isCorrect, currentLesson, timeTaken);

        // Hide toggle-mode button and show explain-lesson button after answer is submitted
        $('#toggle-mode').hide();
        $('#explain-sentence-btn').show();

        // Play feedback sound and audio
        playFeedbackSound(isCorrect, () => {
            var completeLesson = question.sentence.replace(/_{3,}/g, question.missingWord);
            var targetLanguage = question.targetLanguage;
            playAudio(questionId, completeLesson, targetLanguage);
        });
    }

    if (isMultipleChoice) {
        // Event listener for multiple-choice option buttons
        $('.option-btn').off('click').on('click', function () {
            const selectedOption = $(this).text().trim();
            var isCorrect = normalizeString(selectedOption) === normalizeString(question.missingWord);

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
            const key = e.which - 48; // For top number keys
            if (key >= 1 && key <= 4) {
                e.preventDefault();
                const optionBtn = $('.option-btn').eq(key - 1);
                if (optionBtn.length) {
                    optionBtn.click();
                }
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
        handleDebounce(() => {
            loadQuestion(user, currentLesson);
            $('#explain-sentence-btn').hide(); // Hide the button for the next question
            $('#toggle-mode').show(); // Show the toggle button back
        });
    });

    // Event listener for Enter key to move to the next question
    $(document).off('keypress').on('keypress', function (e) {
        if (e.which === 13 && $('#next-question').is(':visible')) { // Enter key pressed and next button visible
            e.preventDefault(); // Prevent default behavior
            handleDebounce(() => $('#next-question').click());
        }
    });

    // Replay audio button event
    $('#replay-audio').off('click').on('click', function () {
        // Ensure completeLesson and targetLanguage are passed correctly
        var completeLesson = question.sentence.replace('___', question.missingWord);
        var targetLanguage = question.targetLanguage;
        playAudio(questionId, completeLesson, targetLanguage);
    });
}

// Function to display multiple-choice options
function displayMultipleChoiceOptions(question) {
    // Combine the correct answer with distractors
    const options = [...question.distractors, question.missingWord];

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

// Function to play audio from S3
function playAudio(questionId, completeLesson, targetLanguage) {
    var audioUrl = `https://s3.us-east-2.amazonaws.com/audio1.languizy.com/audio/${questionId}.mp3`;

    // Disable replay button during playback
    $('#replay-audio').prop('disabled', true); // Disable and grey out the button

    audioElement.src = audioUrl;
    audioElement.play()
        .then(() => {
            console.log("Audio playback started successfully.");
        })
        .catch((error) => {
            console.error("Error playing audio:", error);
            console.log("Attempting to generate audio since playback failed.");
            generateAudio(questionId, completeLesson, currentQuestionData.language);
        });

    audioElement.onended = function () {
        console.log("Audio playback ended.");
        $('#replay-audio').prop('disabled', false); // Re-enable the button
    };

    audioElement.onerror = function () {
        console.error("Error loading audio from S3:", audioUrl);
        console.log("Attempting to generate audio due to loading error.");
        generateAudio(questionId, completeLesson, currentQuestionData.language);
    };
}

// Function to stop the audio
function stopAudio() {
    audioElement.pause();
    audioElement.currentTime = 0; // Reset the audio playback
}

// Function to generate audio using the provided Lambda function
function generateAudio(questionId, completeLesson, targetLanguage) {
    const [languageCode, voice] = getLanguageAndVoice(targetLanguage);

    if (!languageCode || !voice) {
        console.error(`Error: No language and voice found for language: ${targetLanguage}`);
        return;
    }

    console.log(`Generating new audio using AWS Polly with language: ${languageCode} and voice: ${voice}`);

    $.ajax({
        url: 'https://hml8eek21e.execute-api.us-east-2.amazonaws.com/check-audio', // Replace with your API endpoint
        type: 'GET',
        data: {
            filename: questionId,
            text: completeLesson,
            language: languageCode,
            voice: voice
        },
        success: function (response) {
            console.log("AWS Polly audio generation request succeeded.");
            const audioUrl = JSON.parse(response).url;

            console.log(`Audio generated successfully and available at: ${audioUrl}`);
            audioElement.src = audioUrl;
            audioElement.play()
                .then(() => {
                    console.log("Generated audio playback started successfully.");
                })
                .catch((error) => {
                    console.error("Error playing generated audio:", error);
                });
        },
        error: function (error) {
            console.error('Error generating audio using AWS Polly:', error);
        }
    });
}

// Function to play feedback sound
function playFeedbackSound(isCorrect, callback) {
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

    // After feedback sound ends, call the callback to play the full lesson audio
    feedbackAudio.onended = callback;
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
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/ẞ/g, "Ss").toLowerCase();
    
}

// Update user progress in the database
function updateUserProgress(questionId, isCorrect, languagePair, timeTaken) {
    const user = firebase.auth().currentUser;

    const questionProgressRef = db.collection('users').doc(user.uid)
        .collection('grammar').doc(currentQuestionData.knownLanguage + '-' + currentQuestionData.language)
        .collection('questions').doc(questionId);

        var userProgressRef = db.collection('users').doc(user.uid)
    .collection('courses').doc(currentQuestionData.knownLanguage + '-' + currentQuestionData.language)
    .collection('progress').doc(questionId); // This is for updating daily stats

  var userStatsRef = db.collection('users').doc(user.uid)
    .collection('courses').doc(currentQuestionData.knownLanguage + '-' + currentQuestionData.language)
    .collection('stats'); // This is for updating all-time stats

    db.runTransaction(transaction => {
        return transaction.get(questionProgressRef).then(doc => {
            const data = doc.exists ? doc.data() : {
                timesCorrect: 0,
                timesIncorrect: 0,
                timesCorrectInARow: 0,
                timesIncorrectInARow: 0,
                lastAnswered: null,
                nextDue: null,
                initialAppearance: true,
                topic: currentQuestionData.topic
            };
            console.log('we are updating question ID: ' + questionId);
            console.log('before the update data: ');
            console.log(data);

            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Create a date object for the current date
            const now = new Date();
            
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

            debugger;
            if (isCorrect) {
                data.timesCorrect++;
                streakCorrect++;
                streakWrong=0;
                data.timesCorrectInARow++;
                data.timesIncorrectInARow = 0; // Reset incorrect streak
                data.nextDue = new Date(now.getTime() + (data.timesCorrectInARow * 24 * 60 * 60 * 1000)); // Add more days
                updateStats(userStatsRef, today, points, true, timeTaken);

                dailyScore += points; // Update the daily score
                $('#score').text(dailyScore); // Update the score on screen
            } else {
                data.timesIncorrect++;
                streakCorrect=0;
                streakWrong++;
                data.timesIncorrectInARow++;
                data.timesCorrectInARow = 0; // Reset correct streak
                data.nextDue = new Date(now.getTime() + (5 * 60 * 1000)); // Next review in 5 minutes
                updateStats(userStatsRef, today, points, false, timeTaken);

            }

            data.lastAnswered = firebase.firestore.Timestamp.fromDate(now);
            data.initialAppearance = false;


            transaction.set(questionProgressRef, data);
            console.log('after update data:')
            console.log(data);
        });
    }).then(() => {
        debugger;
        updateCoachFeedback(streakCorrect, streakWrong);
        console.log('User progress updated successfully');
       
    }).catch(error => {
        console.error('Error updating progress:', error);
    });
}

// Function to update the coach message with a random encouragement statement
function showEncouragementMessage() {
    const randomIndex = Math.floor(Math.random() * window.coachData.encouragementMessages.length);
    const message = window.coachData.encouragementMessages[randomIndex];

    $('#coach-message').text(message);
    $('#coach-feedback').show();
}

// Function to update coach feedback
function updateCoachFeedback(correctStreak, incorrectStreak) {
    let coachMessage = '';

    // Select messages based on streaks
    if (correctStreak >= 9) {
        coachMessage = getRandomMessage(window.coachData.tonsOfCorrectsInARowMessages);
    } else if (correctStreak == 7) {
        coachMessage = getRandomMessage(window.coachData.sevenCorrectMessages);
    } else if (correctStreak == 5) {
        coachMessage = getRandomMessage(window.coachData.fiveCorrectMessages);
    } else if (correctStreak == 3) {
        coachMessage = getRandomMessage(window.coachData.threeCorrectMessages);
    } else if (correctStreak > 0) {
        coachMessage = getRandomMessage(window.coachData.correctMessages);
    } else if (incorrectStreak >= 9) {
        coachMessage = getRandomMessage(window.coachData.tonsOfMistakesInARowMessages);
    } else if (incorrectStreak == 7) {
        coachMessage = getRandomMessage(window.coachData.sevenMistakesMessages);
    } else if (incorrectStreak == 5) {
        coachMessage = getRandomMessage(window.coachData.fiveMistakesMessages);
    } else if (incorrectStreak == 3) {
        coachMessage = getRandomMessage(window.coachData.threeMistakesMessages);
    } else {
        coachMessage = getRandomMessage(window.coachData.mistakeMessages);
    }

    $('#coach-message').text(coachMessage);
    $('#coach-feedback').show();
}

// Helper function to get a random message from an array
function getRandomMessage(messagesArray) {
    return messagesArray[Math.floor(Math.random() * messagesArray.length)];
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
        const box = $('<div></div>').addClass('answer-box').addClass(answerClass);
        container.append(box);
    }
}

// Update stats in the database
function updateStats(userStatsRef, date, score, isCorrect, timeTaken) {
    debugger;
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
                    grammar_correctAnswers: 0,
                    grammar_wrongAnswers: 0,
                    grammar_totalDrills: 0,
                    grammar_score: 0,
                    DailyTime: 0, // Initialize DailyTime
                    grammar_DailyTime: 0 // Initialize DailyTime
                };

                // Ensure all fields are numbers
                dailyData.totalDrills = ensureNumber(dailyData.totalDrills);
                dailyData.score = ensureNumber(dailyData.score);
                dailyData.correctAnswers = ensureNumber(dailyData.correctAnswers);
                dailyData.wrongAnswers = ensureNumber(dailyData.wrongAnswers);
                dailyData.grammar_totalDrills = ensureNumber(dailyData.grammar_totalDrills);
                dailyData.grammar_score = ensureNumber(dailyData.grammar_score);
                dailyData.grammar_correctAnswers = ensureNumber(dailyData.grammar_correctAnswers);
                dailyData.grammar_wrongAnswers = ensureNumber(dailyData.grammar_wrongAnswers);
                dailyData.grammar_DailyTime = ensureNumber(dailyData.DailyTime); // Ensure DailyTime is a number
                dailyData.DailyTime = ensureNumber(dailyData.DailyTime); // Ensure DailyTime is a number


                // Update stats safely
                
                dailyData.score += score;
                dailyData.totalDrills += 1;
                dailyData.grammar_totalDrills += 1;
                dailyData.grammar_score += score;
                dailyData.grammar_DailyTime += timeTaken; // Add time taken to DailyTime
                dailyData.DailyTime += timeTaken; // Add time taken to DailyTime


                if (isCorrect) {
                    dailyData.correctAnswers += 1;
                    dailyData.grammar_correctAnswers += 1;
                } else {
                    dailyData.wrongAnswers += 1;
                    dailyData.grammar_wrongAnswers += 1;
                }

                // Process all-time stats
                const allTimeData = allTimeDoc.exists ? allTimeDoc.data() : {
                    totalCorrectAnswers: 0,
                    totalWrongAnswers: 0,
                    totalDrills: 0,
                    totalScore: 0,
                    grammar_totalCorrectAnswers: 0,
                    grammar_totalWrongAnswers: 0,
                    grammar_totalDrills: 0,
                    grammar_totalScore: 0,
                    grammar_timeSpent: 0, // Initialize TimeSpent
                    TimeSpent: 0 // Initialize TimeSpent
                };

                // Ensure all fields are numbers
                allTimeData.totalDrills = ensureNumber(allTimeData.totalDrills);
                allTimeData.totalScore = ensureNumber(allTimeData.totalScore);
                allTimeData.totalCorrectAnswers = ensureNumber(allTimeData.totalCorrectAnswers);
                allTimeData.totalWrongAnswers = ensureNumber(allTimeData.totalWrongAnswers);
                allTimeData.grammar_totalDrills = ensureNumber(allTimeData.grammar_totalDrills);
                allTimeData.grammar_totalScore = ensureNumber(allTimeData.grammar_totalScore);
                allTimeData.grammar_totalCorrectAnswers = ensureNumber(allTimeData.grammar_totalCorrectAnswers);
                allTimeData.grammar_totalWrongAnswers = ensureNumber(allTimeData.grammar_totalWrongAnswers);
                allTimeData.grammar_timeSpent = ensureNumber(allTimeData.TimeSpent); // Ensure TimeSpent is a number
                allTimeData.TimeSpent = ensureNumber(allTimeData.TimeSpent); // Ensure TimeSpent is a number


                // Update stats safely
                
                allTimeData.totalScore += score;
                allTimeData.grammar_totalScore += score;
                allTimeData.grammar_totalDrills += 1;
                allTimeData.totalDrills += 1;
                allTimeData.grammar_timeSpent += timeTaken; // Add time taken to TimeSpent
                allTimeData.TimeSpent += timeTaken; // Add time taken to TimeSpent
                

                if (isCorrect) {
                    allTimeData.totalCorrectAnswers += 1;
                    allTimeData.grammar_totalCorrectAnswers += 1;
                } else {
                    allTimeData.totalWrongAnswers += 1;
                    allTimeData.grammar_totalWrongAnswers += 1;
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
        return "(new question)";
    }

    const now = new Date();
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
        return "(new question)";
    }
}

function buttonClick(which) {
    if (which === 'stats') {
        window.location.href = 'stats.html';
    }
}

async function generateExplanation(questionId, fullSentence, missingWord, targetLanguage, userLanguage) {
    try {
        debugger;
        const response = await fetch('https://us-central1-languizy2.cloudfunctions.net/explainSentence', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                questionId,
                fullSentence,
                missingWord,
                targetLanguage,
                userLanguage,
                grammar: true 
            })
        });

        if (!response.ok) {
            // Log the response for debugging
            console.error('Failed to call explanation function:', response.status, response.statusText);
            throw new Error(`Failed to call explanation function: ${response.statusText}`);
        }

        const data = await response.json();

        // Ensure that the explanation is properly retrieved
        if (!data || !data.focus_word_explanation) {
            throw new Error('Invalid explanation received from the function');
        }

        return data;
    } catch (error) {
        console.error('Error in generateExplanation:', error);
        throw error; // Re-throw the error to handle it in the calling function
    }
}

function showExplanationModal(explanationData) {
    // Stop the interim message interval
    clearInterval(interimMessageInterval);

    // Parse explanationData if it's in JSON string format
    let parsedExplanation;
    try {
        parsedExplanation = typeof explanationData === 'string' ? JSON.parse(explanationData) : explanationData;
    } catch (error) {
        console.error('Failed to parse explanation data:', error);
        alert('Failed to display explanation. Please try again.');
        return; // Exit the function if parsing fails
    }

    // Set the modal title to include the full sentence being explained
    $('#explanationModalLabel').html(`Lesson Explanation: "${window.currentQuestionData.sentence}"`);

    // Build the explanation HTML with classes for styling
    let explanationHtml = '<div class="general-explanation"><h2>General Explanation:</h2>';

    parsedExplanation.sentence_breakdown.forEach(part => {
        const partOfSpeechClass = part.part_of_speech.toLowerCase(); // Use a CSS class based on part of speech
        explanationHtml += `
        <p>
            <i class="icon ${partOfSpeechClass} fas fa-info-circle"></i>
            <strong>${part.word} (${part.part_of_speech})</strong> - ${part.explanation}
        </p>`;
    });

    explanationHtml += `</div>
    <div class="missing-word-section">
        <h2 class="missing-word-title">The Missing Word: ${window.currentQuestionData.missingWord}</h2>
        <p>${parsedExplanation.focus_word_explanation}</p>
    </div>`;

    // Populate the modal content with the final explanation
    $('#explanation-content').html(explanationHtml);

    gtag('event', 'Explain Answer', {
        'question_type': 'Grammar',
        'user_id': uid,
        'course': window.currentLanguagePair
    });

    // Show the modal
    $('#explanationModal').modal('show');
}

// Event listener for the explain-sentence button
$('#explain-sentence-btn').off('click').on('click', async function () {
    try {
        // Show loading messages while fetching the explanation
        showLoadingMessages();

        // Check if window.currentQuestionData exists and has an explanation
        if (window.currentQuestionData && typeof window.currentQuestionData.explanation === 'string' && window.currentQuestionData.explanation.trim() !== '') {
            // Explanation already exists, display it in the modal
            showExplanationModal(window.currentQuestionData.explanation);
        } else {
            // Call the Cloud Function to generate the explanation
            const explanation = await generateExplanation(window.currentQuestionId, window.currentQuestionData.sentence, window.currentQuestionData.missingWord, window.currentQuestionData.language, window.currentQuestionData.knownLanguage);

            console.log('Generated explanation:', explanation);

            if (!explanation || typeof explanation !== 'object' || Object.keys(explanation).length === 0) {
                throw new Error('Explanation generation failed or returned empty.');
            }

            // Save the explanation to Firestore (optional, uncomment if needed)
            // await db.collection('grammar_questions').doc(window.currentQuestionId).update({ explanation });

            // Display the explanation in the modal
            showExplanationModal(explanation);
        }
    } catch (error) {
        console.error('Error generating explanation:', error);
        alert('Failed to generate explanation. Please try again.');
    } finally {
        // Stop the interim messages once the explanation is ready
        clearInterval(interimMessageInterval);
    }
});

async function fetchTotalQuestionsAndCorrect(userDocRef, topicNumber, language, knownLanguage) {
    // Fetch total number of questions for this topic in the grammar_questions collection
    let totalQuestionsSnapshot = await db.collection('grammar_questions')
        .where('topic', '==', topicNumber)
        .where('language', '==', language)
        .where('knownLanguage', '==', knownLanguage)
        .get();
    
    const totalQuestions = totalQuestionsSnapshot.size;

    // Fetch user's correct answers for this topic
    let correctQuestionsSnapshot = await userDocRef
        .collection('grammar')
        .doc(currentQuestionData.knownLanguage + "-" + currentQuestionData.language)
        .collection('questions')
        .where('topic', '==', topicNumber)
        .where('timesCorrectInARow', '>', 0)
        .get();

    const correctQuestions = correctQuestionsSnapshot.size;

    return { totalQuestions, correctQuestions };
}

async function updateTopicScore(userDocRef, topicNumber, totalQuestions, correctQuestions) {
    // Calculate the topic score as a percentage
    let topicScore = totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;

    // Save the score in the scores array (index corresponds to the topic)
    await userDocRef
        .collection('grammar')
        .doc(currentQuestionData.knownLanguage + "-" + currentQuestionData.language)
        .set({
            scores: { [topicNumber]: topicScore }
        }, { merge: true });

    return topicScore;
}

async function adjustCorrectQuestions(isCorrect, wasPreviouslyCorrect, correctQuestions) {
    if (isCorrect && !wasPreviouslyCorrect) {
        // Answer was incorrect before but is correct now
        correctQuestions++;
    } else if (!isCorrect && wasPreviouslyCorrect) {
        // Answer was correct before but is incorrect now
        correctQuestions--;
    }

    return correctQuestions;
}

async function updateMaxTopic(userDocRef, topicNumber, topicScore) {
    // If score is above 75 and maxTopic is not defined or lower, update it
    if (topicScore >= 75) {
        const grammarDoc = await userDocRef.collection('grammar').doc(currentQuestionData.knownLanguage + "-" + currentQuestionData.language).get();
        const maxTopic = grammarDoc.exists && grammarDoc.data().maxTopic;

        if (!maxTopic || maxTopic < topicNumber + 1) {
            await userDocRef.collection('grammar').doc(currentQuestionData.knownLanguage + "-" + currentQuestionData.language).update({
                maxTopic: topicNumber + 1
            });
        }
    }
}

async function handleAnswerSubmission(user, isCorrect, questionId, topicNumber, language, knownLanguage) {
    const userDocRef = db.collection('users').doc(user.uid);

    // Fetch total questions and correct answers for the topic
    const { totalQuestions, correctQuestions: initialCorrectQuestions } = await fetchTotalQuestionsAndCorrect(userDocRef, topicNumber, language, knownLanguage);

    // Get the current question's progress to know if it was previously answered correctly
    const questionProgressRef = userDocRef
        .collection('grammar')
        .doc(knownLanguage + '-' + language)
        .collection('questions')
        .doc(questionId);

    const questionDoc = await questionProgressRef.get();
    const wasPreviouslyCorrect = questionDoc.exists && (questionDoc.data().timesCorrectInARow >= 1);

    // Adjust correct questions based on the new answer status
    const updatedCorrectQuestions = await adjustCorrectQuestions(isCorrect, wasPreviouslyCorrect, initialCorrectQuestions);

    // Update the topic score
    const topicScore = await updateTopicScore(userDocRef, topicNumber, totalQuestions, updatedCorrectQuestions);

    // Check and update maxTopic if applicable
    await updateMaxTopic(userDocRef, topicNumber, topicScore);

    // After updating progress, check if the user has achieved 100%
    if (updatedCorrectQuestions === totalQuestions && !hasShownCompletionModal && !startedAt100) {
        // Show the completion modal
        await showCompletionModal(topicNumber); // Assuming topicNumber correlates with lessonId
        hasShownCompletionModal = true;
    }
}

// async function fetchLessonName(lessonId) {
//     try {
//         const lessonDoc = await db.collection('grammar_topics').doc(lessonId.toString()).get();
//         if (lessonDoc.exists) {
//             return lessonDoc.data().name || 'this lesson';
//         } else {
//             console.warn(`No lesson name found for lesson ID: ${lessonId}`);
//             return 'this lesson';
//         }
//     } catch (error) {
//         console.error('Error fetching lesson name:', error);
//         return 'this lesson';
//     }
// }

async function showCompletionModal(lessonId) {
    // Fetch the lesson name using the topic number
    const fetchedLessonName = await fetchLessonName(lessonId);

    // Update the modal message with the lesson name
    document.getElementById('completionMessage').textContent = `You've achieved 100% in "${fetchedLessonName}"!`;

    // Optionally, include the lesson name elsewhere in the modal
    // For example, updating the modal title
    document.getElementById('completionModalLabel').textContent = `Excellent Work on "${fetchedLessonName}"!`;

    // Show the modal using Bootstrap's Modal API
    const completionModalElement = document.getElementById('completionModal');
    const completionModal = new bootstrap.Modal(completionModalElement, {
        backdrop: 'static',
        keyboard: false
    });
    completionModal.show();

    // Remove existing event listeners to prevent multiple triggers
    $('#continuePracticingBtn').off('click');
    $('#returnToTopicsBtn').off('click');

    // Add event listeners to the modal buttons
    document.getElementById('continuePracticingBtn').addEventListener('click', () => {
        completionModal.hide();
        // Optionally, you can reload the current lesson or navigate to a practice page
        loadQuestion(firebase.auth().currentUser, lessonId);
    });

    document.getElementById('returnToTopicsBtn').addEventListener('click', () => {
        completionModal.hide();
        window.location.href = 'grammar-topics.html';
    });
}

async function fetchLessonName(topicNumber) {
    try {
        let language = window.currentLanguagePair.split('-')[1];
        let knownLanguage = window.currentLanguagePair.split('-')[0];
        const grammarSnapshot = await db.collection('grammar')
            .where('topic', '==', parseInt(topicNumber))
            .where('language', '==', language)
            .where('knownLanguage', '==', knownLanguage)
            .limit(1) // Assuming each topic number is unique
            .get();
        
        if (!grammarSnapshot.empty) {
            const lessonData = grammarSnapshot.docs[0].data();
            return lessonData.name || 'this lesson';
        } else {
            console.warn(`No lesson found for topic number: ${topicNumber}`);
            return 'this lesson';
        }
    } catch (error) {
        console.error('Error fetching lesson name:', error);
        return 'this lesson';
    }
}

function displayLessonName(name) {
    const lessonNameElement = document.getElementById('lessonNameDisplay');
    if (lessonNameElement) {
        lessonNameElement.textContent = `${name}`;
        $("#profTooltip").html(name);
    } else {
        console.warn('Lesson name display element not found.');
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
  

function backToSelection(what) {
    if (what === "course") {
        window.location.href = '/course_selection.html';
    } else {
        window.location.href = '/grammar-topics.html';
    }
  }
  

   // Event listener for the Report button
   $('#report-button').on('click', function () {
    $('#report-question-id').val(window.currentQuestionId); // Set the current question ID
    $('#reportModal').modal('show'); // Show the report modal
  });

  // Event listener for the Submit button in the report modal
  $('#submit-report').on('click', function () {
    const comment = $('#report-comment').val().trim();
    const questionId = $('#report-question-id').val();
    const user = firebase.auth().currentUser;
    const currentTime = new Date().toISOString();

    if (comment && questionId && user) {
      // Prepare the report data
      const reportData = {
        questionType: "grammar",
        questionId: questionId,
        timeOfUpdate: currentTime,
        comment: comment,
        language: window.currentQuestionData.language,
        knownLanguage: window.currentQuestionData.knownLanguage,
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

  async function populateSubLevelBadge(userDoc) {
    const subLevel = userDoc.data().subLevel;
    const subLevelBadge = document.getElementById('subLevelBadge');
    subLevelBadge.textContent = subLevel;  // Set the badge based on userLevel
    if (subLevel === 'Free') {
      subLevelBadge.textContent = 'FREE';
      subLevelBadge.className = 'badge bg-secondary';
      debugger;
      subLevelBadge.onclick = function() {
        window.location.href = '/course_selection.html?upgrade=true';
      };
  } else {
      subLevelBadge.textContent = 'PRO';
      subLevelBadge.className = 'badge bg-danger';
      subLevelBadge.onclick = null; // No action on click for PRO
  }
  }

  // Function to check drills and show modal if limit is reached
async function checkDrillsLimit(user, currentCourse) {

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
    // Create a date object for the current date
    const now = new Date();
    
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
            totalDrills = (data.grammar_totalDrills || 0) + (data.totalDrills || 0);
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
            // Proceed with loading drills or questions
            // loadQuestions(user, currentCourse);
        }
    } catch (error) {
        console.error("Error checking drills limit:", error);
    }
  }
  
  function updateSpecialCharacters(targetLanguage) {
    debugger;
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