// Initialize Firestore
var db = firebase.firestore();
var dailyScore = 0;
var debounceTimeout = null; // Use a debounce timeout instead of a boolean flag
var audioElement = new Audio(); // Create a new audio element
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
            }
            flagCard.appendChild(img);
            
        });
    } else {
        console.warn(`No flags found for course: ${currentCourse}`);
    }
}



// Usage in auth state check
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        fetchCurrentCourse(user).then((currentCourse) => {
            if (!currentCourse) {
                console.error('No valid current course found.');
                window.location.href = 'course_selection.html';
                return;
            }
            loadDailyScore(user, currentCourse); // Fetch and display daily score
            loadQuestion(user, currentCourse);
            updateFlagIcons(currentCourse); // Update flag icons based on current course

        }).catch((error) => {
            console.error('Error fetching current course:', error);
            window.location.href = 'course_selection.html';
        });
    } else {
        // No user is signed in, redirect to login
        window.location.href = 'login.html';
    }
});

// Function to fetch the current course based on URL or Firestore
function fetchCurrentCourse(user) {
    return new Promise((resolve, reject) => {
        const urlParams = new URLSearchParams(window.location.search);
        const courseIdFromUrl = urlParams.get('courseId');

        if (courseIdFromUrl) {
            console.log(`Course ID found in URL: ${courseIdFromUrl}`);

            // Check if the course exists (validate that questions exist for this course)
            validateCourse(courseIdFromUrl).then((isValidCourse) => {
                if (isValidCourse) {
                    // If the course exists, update Firestore with the new course selection
                    updateCurrentCourseInFirestore(user, courseIdFromUrl);
                    resolve(courseIdFromUrl);
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
    db.collection('users').doc(user.uid).update({
        currentCourse: newCourseId
    }).then(() => {
        console.log(`Updated currentCourse in Firestore to: ${newCourseId}`);
    }).catch((error) => {
        console.error('Error updating current course in Firestore:', error);
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


// Function to validate if the course exists (i.e., there are questions for it)
function validateCourse(courseId) {
    return db.collection('questions')
        .where('knownLanguage', '==', courseId.split('-')[0])  // Example: 'en' from 'en-es'
        .where('language', '==', courseId.split('-')[1])  // Example: 'es' from 'en-es'
        .limit(1)  // Check if at least one question exists
        .get()
        .then(snapshot => !snapshot.empty)
        .catch(error => {
            console.error('Error validating course:', error);
            return false;
        });
}


// Function to load daily score from Firestore
function loadDailyScore(user, currentCourse) {
  var today = new Date().toISOString().split('T')[0]; // Get date in yyyy-mm-dd format

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

// Load a question from Firestore
function loadQuestion(user, currentCourse) {
  showLoadingProgress();

  if (!user) {
    console.error("User is not authenticated.");
    return;
  }

  if (!currentCourse) {
    console.error('User has not selected a course.');
    window.location.href = 'course_selection.html';
    return;
  }

  // Fetch the due questions based on scheduling algorithm
  db.collection('users').doc(user.uid)
    .collection('courses').doc(currentCourse)
    .collection('progress')
    .where('nextDue', '<=', new Date())
    .orderBy('nextDue')
    .limit(1)
    .get()
    .then(progressSnapshot => {
      if (!progressSnapshot.empty) {
        // Load the due question
        var progressDoc = progressSnapshot.docs[0];
        var questionId = progressDoc.id;
        loadQuestionData(questionId, currentCourse); // Pass currentCourse as a parameter
      } else {
        // No due questions; attempt to load a new question
        loadNewQuestion(user, currentCourse);
      }
    }).catch(error => {
      console.error('Error fetching due questions:', error);
    });
}

// Load question data and display
function loadQuestionData(questionId, currentCourse) {
  db.collection('questions').doc(questionId).get()
    .then(questionDoc => {
      if (questionDoc.exists) {
        displayQuestion(questionDoc.data(), questionId, currentCourse); // Pass currentCourse as a parameter
      } else {
        console.error('Question not found:', questionId);
      }
    });
}

// Load a new question that hasn't been answered yet or from a specific course
// Load a new question that hasn't been answered yet or from a specific course
function loadNewQuestion(user, courseId) {
    // Fetch user's selected course details (knownLanguage and targetLanguage)
    db.collection('users').doc(user.uid).collection('courses').doc(courseId).get().then(courseDoc => {
      var courseData = courseDoc.data();
      if (!courseData || !courseData.knownLanguage || !courseData.targetLanguage) {
        console.error('User has not selected a course.');
        window.location.href = 'course_selection.html';
        return;
      }
  
      // Fetch all questions for the relevant course (language pair) and order by frequency
      db.collection('questions')
        .where('language', '==', courseData.targetLanguage)
        .where('knownLanguage', '==', courseData.knownLanguage)
        .orderBy('frequency', 'asc')  // Order by frequency in ascending order
        .get()
        .then(questionSnapshot => {
          var questions = [];
          questionSnapshot.forEach(doc => {
            questions.push({ id: doc.id, data: doc.data() });
          });
  
          // Filter out questions the user has already answered (progress collection)
          db.collection('users').doc(user.uid)
            .collection('courses').doc(courseId)
            .collection('progress').get()
            .then(progressSnapshot => {
              var seenQuestions = progressSnapshot.docs.map(doc => doc.id);
              var unseenQuestions = questions.filter(q => !seenQuestions.includes(q.id));
  
              if (unseenQuestions.length > 0) {
                // Select the first question with the lowest frequency
                var lowestFrequencyQuestion = unseenQuestions[0];
                displayQuestion(lowestFrequencyQuestion.data, lowestFrequencyQuestion.id, courseId); 
              } else {
                console.log('No new questions available.');
                loadNextEarlyQuestion(user, courseId); // Load the next question even if it's not yet due
              }
            });
        });
    }).catch(error => {
      console.error('Error loading user course data:', error);
    });
  }
  

// Load the next question even if it's not yet due
function loadNextEarlyQuestion(user, courseId) {
  db.collection('users').doc(user.uid)
    .collection('courses').doc(courseId)
    .collection('progress')
    .orderBy('nextDue')
    .limit(1)
    .get()
    .then(progressSnapshot => {
      if (!progressSnapshot.empty) {
        var progressDoc = progressSnapshot.docs[0];
        var questionId = progressDoc.id;
        loadQuestionData(questionId, courseId); // Pass currentCourse as a parameter
      } else {
        console.log('No questions found at all.');
      }
    }).catch(error => {
      console.error('Error fetching next early question:', error);
    });
}

// Show loading progress
function showLoadingProgress() {
  $('#loading-progress').show();
  $('#question-area').hide(); // Hide the question area
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
  $('#question-area').show(); // Show the question area
}

// Display the question on the page
function displayQuestion(question, questionId, currentCourse) {
    console.log(question);
    hideLoadingProgress(); // Hide progress bar when the question loads

    var inputLength = question.missingWord.length;

    // Calculate input width dynamically to match the expected answer length
    var inputWidth = inputLength * 1.2 + 1;

    // Replace the missing word with an input field
    var inputHTML = `<input type="text" id="user-answer" class="fill-in-blank" maxlength="${inputLength}" style="width: ${inputWidth}ch;">`;
    var sentenceHTML = question.sentence.replace('___', inputHTML);

    // Display the sentence with the embedded input field
    $('#sentence').html(sentenceHTML);
    $('#translation').text(question.translation);

    // Retrieve the progress data for this question to get `lastAnswered`
    var user = firebase.auth().currentUser;
    var userProgressRef = db.collection('users').doc(user.uid)
      .collection('courses').doc(currentCourse)
      .collection('progress').doc(questionId);

    userProgressRef.get().then(progressDoc => {
      var phraseStatus = "(new phrase)"; // Default if never answered before

      if (progressDoc.exists) {
        var progressData = progressDoc.data();
        if (progressData.lastAnswered) {
          // Calculate time difference for display
          phraseStatus = timeDifference(progressData.lastAnswered);
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

      // Display the phrase status
      $('#translation').append(` <span class="text-muted">${phraseStatus}</span>`);

      // Automatically focus on the input field
      $('#user-answer').focus();
    });

    $('#feedback').text('').removeClass('text-success text-danger');

    // Show the submit button, hide the next button
    $('#submit-answer').show();
    $('#next-question').hide();
    // $('#replay-audio').hide(); // Hide the replay audio button initially

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

    // Handle answer submission
    function handleSubmit() {
      var userAnswer = $('#user-answer').val().trim();
      checkAnswer(userAnswer, question, questionId, currentCourse); // Pass currentCourse as a parameter
      $('#submit-answer').hide(); // Hide submit button after submission
      $('#next-question').show(); // Show next question button after submission

      // Construct the complete sentence using the correct missing word
      var completeSentence = question.sentence.replace('___', question.missingWord); // **Added**
      var targetLanguage = question.language; // **Added** Assume language is stored in question data

      playAudio(questionId, completeSentence, targetLanguage); // **Modified** Pass completeSentence and targetLanguage
    }

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

    // Handle next question button click
    $('#next-question').off('click').on('click', function () {
      stopAudio(); // Stop audio when moving to the next question
      handleDebounce(() => loadQuestion(user, currentCourse)); // Pass currentCourse as a parameter
    });

    // Event listener for Enter key to move to the next question
    $(document).off('keypress').on('keypress', function (e) {
      if (e.which === 13 && $('#next-question').is(':visible')) { // Enter key pressed and next button visible
        handleDebounce(() => $('#next-question').click());
      }
    });

    // Replay audio button event
    $('#replay-audio').off('click').on('click', function () {
      // **Modified** Ensure completeSentence and targetLanguage are passed correctly
      var completeSentence = question.sentence.replace('___', question.missingWord); 
      var targetLanguage = question.language;
      playAudio(questionId, completeSentence, targetLanguage); 
    });
}

  

// Function to play audio from S3
function playAudio(questionId, completeSentence, targetLanguage) {
    
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
            generateAudio(questionId, completeSentence, targetLanguage);
        });

    // $('#replay-audio').hide(); // Hide replay button while playing

    audioElement.onended = function () {
        console.log("Audio playback ended.");
        // $('#replay-audio').show(); // Show replay button when audio ends
        $('#replay-audio').prop('disabled', false); // Re-enable the button

    };

    audioElement.onerror = function () {
        console.error("Error loading audio from S3:", audioUrl);
        console.log("Attempting to generate audio due to loading error.");
        generateAudio(questionId, completeSentence, targetLanguage);
    };
}


// Function to stop the audio
function stopAudio() {
  audioElement.pause();
  audioElement.currentTime = 0; // Reset the audio playback
}

// Function to generate audio using the provided Lambda function
function generateAudio(questionId, completeSentence, targetLanguage) {
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
            text: completeSentence,
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
            
            // $('#replay-audio').hide(); // Hide replay button while playing
        },
        error: function (error) {
            console.error('Error generating audio using AWS Polly:', error);
        }
    });
}
  
// Function to get the language code and female voice based on the target language
function getLanguageAndVoice(countryCode) {
    console.log(`Attempting to find language and voice for country code: ${countryCode}`);
    
    const entry = countryToLanguage[countryCode.toLowerCase()];
    
    if (!entry) {
        console.error(`No language and voice found for country code: ${countryCode}`);
        return null; // Explicitly returning null to indicate failure
    }

    const { languageCode, voice } = entry;
    console.log(`Success: Found language code '${languageCode}' and voice '${voice}' for country code '${countryCode}'`);
    
    return [languageCode, voice];
}
    

// Normalization function to ignore special characters
function normalizeString(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Check user's answer
function checkAnswer(userAnswer, question, questionId, currentCourse) {
  var correctAnswer = normalizeString(question.missingWord);
  var normalizedUserAnswer = normalizeString(userAnswer);

  var isCorrect = normalizedUserAnswer === correctAnswer;

  if (isCorrect) {
    $('#feedback').text('Correct!').removeClass('text-danger').addClass('text-success');
    updateUserProgress(questionId, true, currentCourse);
  } else {
    $('#feedback').text(`Incorrect. The correct answer was "${question.missingWord}".`).removeClass('text-success').addClass('text-danger');
    updateUserProgress(questionId, false, currentCourse);
  }
}

// Update user progress in the database
function updateUserProgress(questionId, isCorrect, currentCourse) {
    var user = firebase.auth().currentUser;
  
    var userProgressRef = db.collection('users').doc(user.uid)
      .collection('courses').doc(currentCourse)
      .collection('progress').doc(questionId);
  
    var userStatsRef = db.collection('users').doc(user.uid)
      .collection('courses').doc(currentCourse)
      .collection('stats');
  
    var allTimeStatsRef = userStatsRef.doc('all-time');
  
    // First, fetch the question data to get its frequency outside the transaction
    db.collection('questions').doc(questionId).get().then(questionDoc => {
      if (questionDoc.exists) {
        var questionFrequency = questionDoc.data().frequency; // Frequency of the current question
  
        // Now, run the transaction to update progress and stats
        db.runTransaction(transaction => {
          return transaction.get(userProgressRef).then(doc => {
            var data = doc.exists ? doc.data() : {
              timesCorrect: 0,
              timesIncorrect: 0,
              timesCorrectInARow: 0,
              lastAnswered: null,
              nextDue: null,
              initialAppearance: true
            };
  
            var now = new Date();
            var today = now.toISOString().split('T')[0]; // Get date in yyyy-mm-dd format
  
            if (isCorrect) {
              data.timesCorrect += 1;
              data.timesCorrectInARow += 1;
              var daysToAdd = data.initialAppearance ? 28 : 2 * data.timesCorrectInARow;
              data.nextDue = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
              updateStats(userStatsRef, today, 10, true);
              dailyScore += 10; // Update the daily score
              $('#score').text(dailyScore); // Update the score on screen
            } else {
              data.timesIncorrect += 1;
              data.timesCorrectInARow = 0;
              data.nextDue = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
              updateStats(userStatsRef, today, 0, false);
            }
  
            // Update `lastAnswered` to the current time
            data.lastAnswered = firebase.firestore.Timestamp.fromDate(now);
            data.initialAppearance = false;
  
            // Fetch the current maxFrequency and update if necessary
            return transaction.get(allTimeStatsRef).then(allTimeDoc => {
                var allTimeData = allTimeDoc.exists ? allTimeDoc.data() : {};
              
                // Ensure maxFrequency is set, even if the document exists but the field is missing
                if (typeof allTimeData.maxFrequency === 'undefined') {
                  allTimeData.maxFrequency = 0;
                }
              
                // Compare question frequency and update if necessary
                if (questionFrequency > allTimeData.maxFrequency) {
                  allTimeData.maxFrequency = questionFrequency;
                }
              
                // Write the updated progress and stats back to Firestore
                transaction.set(userProgressRef, data);
                transaction.set(allTimeStatsRef, allTimeData);
              });
          });
        }).catch(error => {
          console.error('Transaction failed:', error);
        });
  
      } else {
        console.error("Question not found");
      }
    }).catch(error => {
      console.error('Error fetching question data:', error);
    });
  }
  


// Update stats in the database
function updateStats(userStatsRef, date, score, isCorrect, courseId) {
  var dailyStatsRef = userStatsRef.doc(date);
  var allTimeStatsRef = userStatsRef.doc('all-time');

  db.runTransaction(transaction => {
    return transaction.get(dailyStatsRef).then(dailyDoc => {
      return transaction.get(allTimeStatsRef).then(allTimeDoc => {
        // Process daily stats
        var dailyData = dailyDoc.exists ? dailyDoc.data() : {
          correctAnswers: 0,
          wrongAnswers: 0,
          totalDrills: 0,
          score: 0
        };

        dailyData.totalDrills += 1;
        dailyData.score += score;

        if (isCorrect) {
          dailyData.correctAnswers += 1;
        } else {
          dailyData.wrongAnswers += 1;
        }

        // Process all-time stats
        var allTimeData = allTimeDoc.exists ? allTimeDoc.data() : {
          totalCorrectAnswers: 0,
          totalWrongAnswers: 0,
          totalDrills: 0,
          totalScore: 0
        };

        allTimeData.totalDrills += 1;
        allTimeData.totalScore += score;

        if (isCorrect) {
          allTimeData.totalCorrectAnswers += 1;
        } else {
          allTimeData.totalWrongAnswers += 1;
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
    return "(new phrase)";
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
    return "(new phrase)";
  }
}

function getLanguageAndVoice(countryCode) {
    const entry = countryToLanguage[countryCode.toLowerCase()];
    if (!entry) {
        return `No language and voice found for country code: ${countryCode}`;
    }

    const { languageCode, voice } = entry;
    return [languageCode, voice];
}

function buttonClick(which) {
if (which === 'stats') {
    window.location.href = 'stats.html';
}
}