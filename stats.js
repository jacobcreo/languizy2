// Initialize Firestore
const db = firebase.firestore();

// Initialize Chart Instances
let accuracyChartInstance;
let answersOverTimeChartInstance;
let cumulativeScoreChartInstance;
let difficultyLevelChartInstance;
let speechPartBreakdownChartInstance;
let performanceOverTimeChartInstance;
let dailyScoreBreakdownChartInstance;
let vocabGrammarAccuracyChartInstance;


// Initialize selectedCourse to 'all' for showing all course stats by default
let selectedCourse = 'all';

// Authentication State Listener
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    loadStats(user); // Load stats for the authenticated user
    populateCourseSelector(user); // Populate course selector dynamically
    loadUserAvatar(user);  // Load user avatar in the navbar
  } else {
    window.location.href = '/'; // Redirect to login if not authenticated
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
    } else {
      console.error('User data does not exist in Firestore');
    }
    userAvatar.onclick = () => {
      window.location.href = '/settings.html';
    };
  }).catch((error) => {
    console.error('Error loading user avatar:', error);
  });
}

/**
 * Load Statistics for the Authenticated User
 * @param {Object} user - The authenticated user object
 */
async function loadStats(user) {
  try {
    const userDocRef = db.collection('users').doc(user.uid);

    // Display loading messages for each chart
    setLoadingState('speechPartBreakdownChart', 'speechPartBreakdownLoading');
    setLoadingState('answersOverTimeChart', 'answersOverTimeLoading');
    setLoadingState('accuracyChart', 'accuracyLoading');
    setLoadingState('cumulativeScoreChart', 'cumulativeScoreLoading');
    setLoadingState('difficultyLevelChart', 'difficultyLevelLoading');
    setLoadingState('performanceOverTimeChart', 'performanceOverTimeLoading');
    setLoadingState('dailyScoreBreakdownChart', 'dailyScoreBreakdownLoading');
    setLoadingState('vocabGrammarAccuracyChart', 'vocabGrammarAccuracyLoading');

    // Fetch user courses and stats concurrently
    const [userDoc, coursesSnapshot] = await Promise.all([
      userDocRef.get(),
      userDocRef.collection('courses').get()
    ]);

    if (!userDoc.exists) return console.error('No such user!');
    if (coursesSnapshot.empty) return console.warn('No courses found for this user.');

    // Variables for stats aggregation
    let earliestDate = null;
    let totalCorrectAnswers = 0;
    let totalWrongAnswers = 0;
    let totalScore = 0;
    let totalDrills = 0;
    let dailyStats = [];
    let datesSet = new Set();
    let vocabCorrect = 0, vocabWrong = 0, grammarCorrect = 0, grammarWrong = 0;

    // Fetch stats for all courses at once
    const courseStatsPromises = coursesSnapshot.docs.map(courseDoc => {
      if (selectedCourse !== 'all' && courseDoc.id !== selectedCourse) return null;
      return userDocRef.collection('courses').doc(courseDoc.id).collection('stats').get();
    });

    const statsSnapshots = await Promise.all(courseStatsPromises);

    statsSnapshots.forEach(statsSnapshot => {
      if (!statsSnapshot) return;

      statsSnapshot.forEach(doc => {
        const data = doc.data();
        const dateId = doc.id;
    
        if (dateId === 'all-time') {
          totalCorrectAnswers += data.totalCorrectAnswers || 0;
          totalWrongAnswers += data.totalWrongAnswers || 0;
          totalScore += data.totalScore || 0;
          totalDrills += data.totalDrills || 0;
    
          // Use the correct field names for "all-time" document
          vocabCorrect += data.vocabulary_totalCorrectAnswers || 0;
          vocabWrong += data.vocabulary_totalWrongAnswers || 0;
          grammarCorrect += data.grammar_totalCorrectAnswers || 0;
          grammarWrong += data.grammar_totalWrongAnswers || 0;
        } else {
          const date = new Date(dateId);
          if (!earliestDate || date < earliestDate) earliestDate = date;
    
          dailyStats.push({
            date: dateId,
            correctAnswers: data.correctAnswers || 0,
            wrongAnswers: data.wrongAnswers || 0,
            score: data.score || 0,
            totalDrills: data.totalDrills || 0,
            vocabularyScore: data.vocabulary_score || 0,
            grammarScore: data.grammar_score || 0
          });
    
          // Aggregate daily stats for vocabulary and grammar accuracy
          vocabCorrect += data.vocabulary_correctAnswers || 0;
          vocabWrong += data.vocabulary_wrongAnswers || 0;
          grammarCorrect += data.grammar_correctAnswers || 0;
          grammarWrong += data.grammar_wrongAnswers || 0;
    
          datesSet.add(dateId);
        }
      });
    });

    // Determine Day Joined
    const dayJoined = earliestDate ? earliestDate.toLocaleDateString() : 'N/A';

    // Calculate Streaks
    const streakInfo = calculateStreaks(Array.from(datesSet));
    const currentStreak = streakInfo.currentStreak;
    const longestStreak = streakInfo.longestStreak;

    const totalDaysPracticed = datesSet.size;

    // Calculate Average Score
    const averageScore = totalDaysPracticed > 0 ? (totalScore / totalDaysPracticed).toFixed(2) : 0;

    // Update HTML Elements with Calculated Statistics
    document.getElementById('dayJoined').innerText = `Day Joined: ${dayJoined}`;
    document.getElementById('currentStreak').innerText = `Current Streak: ${currentStreak}`;
    document.getElementById('longestStreak').innerText = `Longest Streak: ${longestStreak}`;
    document.getElementById('totalDaysPracticed').innerText = `Total Days Practiced: ${totalDaysPracticed}`;
    document.getElementById('averageScore').innerText = `Average Score: ${averageScore}`;
    document.getElementById('totalWrongAnswers').innerText = `Total Wrong Answers: ${totalWrongAnswers}`;

    // Generate a Complete Date Range and Fill Missing Dates
    const latestDate = new Date(); // Assume latest date is today
    if (!earliestDate) earliestDate = latestDate; // If there's no earliest date, set it to today

    const sortedDailyStats = dailyStats.sort((a, b) => new Date(a.date) - new Date(b.date));
    const dateRange = generateDateRange(earliestDate, latestDate);

    // Fill in missing dates in dailyStats with zero values
    const filledDailyStats = dateRange.map(date => {
      const existingStat = sortedDailyStats.find(stat => stat.date === date);
      return existingStat || { date, correctAnswers: 0, wrongAnswers: 0, score: 0, totalDrills: 0, vocabularyScore: 0, grammarScore: 0 };
    });

    // Prepare Data for Charts
    const answersOverTimeData = filledDailyStats.map(stat => ({
      date: stat.date,
      correctAnswers: stat.correctAnswers,
      wrongAnswers: stat.wrongAnswers
    }));

    // Display Charts and Heatmap
    await Promise.all([
      displaySpeechPartBreakdownChart(userDocRef, selectedCourse),
      displayAnswersOverTimeChart(answersOverTimeData),
      displayAccuracyChart(totalCorrectAnswers, totalWrongAnswers),
      displayCumulativeScoreChart(filledDailyStats),
      displayDifficultyLevelChart(userDocRef, selectedCourse),
      displayHeatmap(Array.from(datesSet)),
      displayPerformanceOverTimeChart(filledDailyStats),
      displayDailyScoreBreakdownChart(filledDailyStats),
      displayVocabGrammarAccuracyChart(vocabCorrect, vocabWrong, grammarCorrect, grammarWrong)
    ]);

  } catch (error) {
    console.error('Error loading stats:', error);
  }
}


/**
 * Set a loading state for the chart containers
 */
function setLoadingState(chartId, loadingId) {
  const loadingElement = document.getElementById(loadingId);
  const chartElement = document.getElementById(chartId);

  if (loadingElement) {
    loadingElement.style.display = 'block';
  }
  if (chartElement) {
    chartElement.style.display = 'none';
  }
}

/**
 * Clear the loading state once data is loaded
 */
function clearLoadingState(chartId, loadingId) {
  const loadingElement = document.getElementById(loadingId);
  const chartElement = document.getElementById(chartId);

  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
  if (chartElement) {
    chartElement.style.display = 'block';
  }
}


/**
 * Populate the course selector with options for the user's courses
 * @param {Object} user - The authenticated user object
 */
async function populateCourseSelector(user) {
  const userDocRef = db.collection('users').doc(user.uid);
  const courseSelector = document.getElementById('courseSelector');
  courseSelector.innerHTML = '<option value="all">All Courses</option>'; // Default option

  const coursesSnapshot = await userDocRef.collection('courses').get();
  coursesSnapshot.forEach(doc => {
    const courseData = doc.data();
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = `${courseData.knownLanguage.toUpperCase()} to ${courseData.targetLanguage.toUpperCase()}`;
    courseSelector.appendChild(option);
  });
}

/**
 * Display Speech Part Breakdown Chart
 */
async function displaySpeechPartBreakdownChart(userDocRef, currentCourse) {
  const ctx = document.getElementById('speechPartBreakdownChart').getContext('2d');

  if (speechPartBreakdownChartInstance) {
    speechPartBreakdownChartInstance.destroy();
  }

  // Data structure to track correct and wrong answers for each speech part
  const speechPartStats = {};

  // Process questions answered by the user
  async function processCourseQuestions(courseId) {
    const progressRef = userDocRef.collection('courses').doc(courseId).collection('progress');
    const progressSnapshot = await progressRef.get();

    // Loop through progress to analyze each question's results
    for (const progressDoc of progressSnapshot.docs) {
      const progressData = progressDoc.data();
      const questionId = progressDoc.id;

      // Fetch the corresponding question from the questions collection
      const questionDoc = await db.collection('questions').doc(questionId).get();
      if (!questionDoc.exists) continue;

      const questionData = questionDoc.data();
      const speechPart = questionData.missingWordSpeechPart || 'Unknown';

      if (!speechPartStats[speechPart]) {
        speechPartStats[speechPart] = { correct: 0, wrong: 0 };
      }

      // Increment correct and wrong counts
      speechPartStats[speechPart].correct += progressData.timesCorrect || 0;
      speechPartStats[speechPart].wrong += progressData.timesIncorrect || 0;
    }
  }

  // Fetch data for all courses or a specific course
  if (currentCourse === 'all') {
    const coursesSnapshot = await userDocRef.collection('courses').get();
    await Promise.all(coursesSnapshot.docs.map(courseDoc => processCourseQuestions(courseDoc.id)));
  } else {
    await processCourseQuestions(currentCourse);
  }

  // Prepare data for chart
  const labels = Object.keys(speechPartStats);
  const correctData = labels.map(speechPart => speechPartStats[speechPart].correct);
  const wrongData = labels.map(speechPart => speechPartStats[speechPart].wrong);

  speechPartBreakdownChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Correct Answers',
          data: correctData,
          backgroundColor: '#28a745',
          barPercentage: 0.7,
          categoryPercentage: 0.8
        },
        {
          label: 'Wrong Answers',
          data: wrongData,
          backgroundColor: '#dc3545',
          barPercentage: 0.7,
          categoryPercentage: 0.8
        }
      ],
    },
    options: {
      indexAxis: 'y', // Horizontal bars
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const index = context.dataIndex;
              const correct = correctData[index];
              const wrong = wrongData[index];
              const total = correct + wrong;
              const successRate = total > 0 ? ((correct / total) * 100).toFixed(1) : '0';

              const datasetLabel = context.dataset.label || '';
              const value = context.raw || 0;
              
              return `${datasetLabel}: ${value} (${successRate}% Success)`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Answers',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Speech Parts',
          },
          ticks: {
            autoSkip: false,
          }
        },
      }
    }
  });

  clearLoadingState('speechPartBreakdownChart', 'speechPartBreakdownLoading');
}

/**
 * Filter stats based on the selected course
 */
function filterByCourse() {
  const selector = document.getElementById('courseSelector');
  selectedCourse = selector.value;
  loadStats(firebase.auth().currentUser); // Reload stats when course is selected
}

/**
 * Display Heatmap for Daily Practice
 * @param {Array} dates - Array of date strings in "YYYY-MM-DD" format when the user practiced
 */
function displayHeatmap(dates) {
  const heatmapContainer = document.getElementById('heatmapContainer');
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Ensure we start from today without time interference

  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day
  const datesSet = new Set(dates);
  const minimumBoxes = 30; // Ensure at least 30 boxes are shown

  // Function to recalculate and redraw the heatmap based on screen size
  function drawHeatmap() {
    heatmapContainer.innerHTML = ''; // Clear previous content
    const containerWidth = heatmapContainer.offsetWidth;
    const boxSize = 28.78; // Width of each box in pixels, including margin
    const boxesPerRow = Math.floor(containerWidth / boxSize);
    const totalBoxes = Math.max(minimumBoxes, boxesPerRow * Math.ceil(minimumBoxes / boxesPerRow)); // Always fill rows completely

    for (let i = 0; i < totalBoxes; i++) {
      const day = new Date(today.getTime() - i * oneDay); // Get date for each box starting from today
      const dateStr = day.toISOString().split('T')[0];
      const played = datesSet.has(dateStr);
      const color = played ? '#4CAF50' : '#D3D3D3'; // Color for practiced and non-practiced days

      const dayDiv = document.createElement('div');
      dayDiv.className = 'heatmap-day';
      dayDiv.style.backgroundColor = color;
      dayDiv.title = `Date: ${dateStr}\nPlayed: ${played ? 'Yes' : 'No'}`;
      heatmapContainer.appendChild(dayDiv);
    }
  }

  // Initial draw
  drawHeatmap();

  // Redraw heatmap when window is resized to ensure it fits dynamically
  window.addEventListener('resize', drawHeatmap);
  clearLoadingState('heatmapContainer', 'heatmapLoading');
}

/**
 * Calculate Streaks
 */
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
  checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday

  // Check if there is a continuous streak until yesterday
  while (true) {
    const dateStr = checkDate.toLocaleDateString('en-CA');

    if (uniqueDates.find(d => d.toLocaleDateString('en-CA') === dateStr)) {
        tempStreak++;
        checkDate.setDate(checkDate.getDate() - 1); // Move to the previous day
    } else {
        break;
    }
  }

  const streakExtendedToday = uniqueDates.some(d => d.toLocaleDateString('en-CA') === today.toLocaleDateString('en-CA'));

  if (streakExtendedToday) {
    tempStreak++; // Include today in the streak count if practiced today
  }

  currentStreak = tempStreak;

  return { currentStreak, longestStreak };
}

/**
 * Display Answers Over Time Chart
 * @param {Array} data - Array of objects containing date, correctAnswers, and wrongAnswers
 */
function displayAnswersOverTimeChart(data) {
  const ctx = document.getElementById('answersOverTimeChart').getContext('2d');

  if (answersOverTimeChartInstance) {
    answersOverTimeChartInstance.destroy();
  }

  answersOverTimeChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [
        {
          label: 'Correct Answers',
          data: data.map(d => d.correctAnswers),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.2)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Wrong Answers',
          data: data.map(d => d.wrongAnswers),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
        },
        legend: {
          position: 'top',
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Number of Answers'
          },
          beginAtZero: true
        }
      }
    }
  });
  clearLoadingState('answersOverTimeChart', 'answersOverTimeLoading');
}

/**
 * Display Accuracy Pie Chart
 * @param {number} totalCorrect - Total number of correct answers
 * @param {number} totalWrong - Total number of wrong answers
 */
function displayAccuracyChart(totalCorrect, totalWrong) {
  const ctx = document.getElementById('accuracyChart').getContext('2d');

  if (accuracyChartInstance) {
    accuracyChartInstance.destroy();
  }

  accuracyChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Correct Answers', 'Wrong Answers'],
      datasets: [{
        data: [totalCorrect, totalWrong],
        backgroundColor: ['#28a745', '#dc3545']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.chart._metasets[context.datasetIndex].total;
              const percentage = ((value / total) * 100).toFixed(2);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }}
  );
  clearLoadingState('accuracyChart', 'accuracyLoading');
}

/**
 * Display Cumulative Score Chart
 * @param {Array} dailyStats - Array of daily stats containing score
 */
function displayCumulativeScoreChart(dailyStats) {
  const ctx = document.getElementById('cumulativeScoreChart').getContext('2d');

  const cumulativeData = [];
  let cumulativeScore = 0;
  dailyStats.forEach(stat => {
    cumulativeScore += stat.score;
    cumulativeData.push({
      date: stat.date,
      score: cumulativeScore
    });
  });

  if (cumulativeScoreChartInstance) {
    cumulativeScoreChartInstance.destroy();
  }

  cumulativeScoreChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: cumulativeData.map(d => d.date),
      datasets: [{
        label: 'Cumulative Score',
        data: cumulativeData.map(d => d.score),
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Cumulative Score'
          },
          beginAtZero: true
        }
      }
    }
  });
  clearLoadingState('cumulativeScoreChart', 'cumulativeScoreLoading');
}

/**
 * Display Questions by Difficulty Level Chart
 * @param {Object} userDocRef - Firestore document reference to the user
 * @param {string} currentCourse - The course to display stats for (or 'all' for all courses)
 */
async function displayDifficultyLevelChart(userDocRef, currentCourse) {
  const ctx = document.getElementById('difficultyLevelChart').getContext('2d');

  if (difficultyLevelChartInstance) {
    difficultyLevelChartInstance.destroy();
  }

  // Object to store difficulty levels and answer statistics
  const difficultyLevels = {};
  let maxDifficultyLevelSeen = 0; // Track the highest difficulty level seen

  async function processCourseProgress(courseId) {
    const progressRef = userDocRef.collection('courses').doc(courseId).collection('progress');
    const progressSnapshot = await progressRef.get();

    for (const progressDoc of progressSnapshot.docs) {
      const progressData = progressDoc.data();
      const questionId = progressDoc.id;

      const questionDoc = await db.collection('questions').doc(questionId).get();
      if (!questionDoc.exists) continue;

      const questionData = questionDoc.data();
      const difficultyLevel = questionData.difficultyLevel;

      if (!Number.isInteger(difficultyLevel) || difficultyLevel < 1 || difficultyLevel > 200) {
        console.warn(`Skipping question with invalid difficulty level: ${questionId}`);
        continue;
      }

      if (difficultyLevel > maxDifficultyLevelSeen) {
        maxDifficultyLevelSeen = difficultyLevel;
      }

      if (!difficultyLevels[difficultyLevel]) {
        difficultyLevels[difficultyLevel] = {
          totalReviewed: 0,
          correctAnswers: 0,
          incorrectAnswers: 0
        };
      }

      difficultyLevels[difficultyLevel].totalReviewed += 1;
      difficultyLevels[difficultyLevel].correctAnswers += progressData.timesCorrect || 0;
      difficultyLevels[difficultyLevel].incorrectAnswers += progressData.timesIncorrect || 0;
    }
  }

  if (currentCourse === 'all') {
    const coursesSnapshot = await userDocRef.collection('courses').get();
    await Promise.all(coursesSnapshot.docs.map(courseDoc => processCourseProgress(courseDoc.id)));
  } else {
    await processCourseProgress(currentCourse);
  }

  const extendedMaxLevel = Math.min(maxDifficultyLevelSeen + 2, 200);
  const labels = Array.from({ length: extendedMaxLevel }, (_, i) => i + 1);

  const totalReviewed = labels.map(level => difficultyLevels[level]?.totalReviewed || 0);
  const correctAnswers = labels.map(level => difficultyLevels[level]?.correctAnswers || 0);
  const incorrectAnswers = labels.map(level => difficultyLevels[level]?.incorrectAnswers || 0);

  difficultyLevelChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Reviewed',
          data: totalReviewed,
          backgroundColor: '#007bff'
        },
        {
          label: 'Correct Answers',
          data: correctAnswers,
          backgroundColor: '#28a745'
        },
        {
          label: 'Incorrect Answers',
          data: incorrectAnswers,
          backgroundColor: '#dc3545'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Questions'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Difficulty Level'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      }
    }
  });
  clearLoadingState('difficultyLevelChart', 'difficultyLevelLoading');
}

/**
 * Generate an array of date strings between two dates
 */
function generateDateRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate).toISOString().split('T')[0]); // Format as YYYY-MM-DD
    currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
  }

  return dates;
}

function displayPerformanceOverTimeChart(data) {
  const ctx = document.getElementById('performanceOverTimeChart').getContext('2d');

  if (performanceOverTimeChartInstance) {
    performanceOverTimeChartInstance.destroy();
  }

  performanceOverTimeChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [
        {
          label: 'Vocabulary Score',
          data: data.map(d => d.vocabularyScore),
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.2)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Grammar Score',
          data: data.map(d => d.grammarScore),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
        },
        legend: {
          position: 'top',
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Score'
          },
          beginAtZero: true
        }
      }
    }
  });
  clearLoadingState('performanceOverTimeChart', 'performanceOverTimeLoading');
}

/**
 * Display Daily Score Breakdown Chart
 * @param {Array} data - Array of daily stats containing vocabulary and grammar scores
 */
function displayDailyScoreBreakdownChart(data) {
  const ctx = document.getElementById('dailyScoreBreakdownChart').getContext('2d');

  if (dailyScoreBreakdownChartInstance) {
    dailyScoreBreakdownChartInstance.destroy();
  }

  dailyScoreBreakdownChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.date),
      datasets: [
        {
          label: 'Vocabulary Score',
          data: data.map(d => d.vocabularyScore),
          backgroundColor: '#007bff',
          barPercentage: 0.7,
          categoryPercentage: 0.8
        },
        {
          label: 'Grammar Score',
          data: data.map(d => d.grammarScore),
          backgroundColor: '#28a745',
          barPercentage: 0.7,
          categoryPercentage: 0.8
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Score'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      }
    }
  });
  clearLoadingState('dailyScoreBreakdownChart', 'dailyScoreBreakdownLoading');
}

/**
 * Display Vocabulary vs. Grammar Accuracy Chart
 * @param {number} vocabCorrect - Total number of correct vocabulary answers
 * @param {number} vocabWrong - Total number of wrong vocabulary answers
 * @param {number} grammarCorrect - Total number of correct grammar answers
 * @param {number} grammarWrong - Total number of wrong grammar answers
 */
function displayVocabGrammarAccuracyChart(vocabCorrect, vocabWrong, grammarCorrect, grammarWrong) {

  const ctx = document.getElementById('vocabGrammarAccuracyChart').getContext('2d');

  if (vocabGrammarAccuracyChartInstance) {
    vocabGrammarAccuracyChartInstance.destroy();
  }

  vocabGrammarAccuracyChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Vocabulary Correct', 'Vocabulary Wrong', 'Grammar Correct', 'Grammar Wrong'],
      datasets: [{
        data: [vocabCorrect, vocabWrong, grammarCorrect, grammarWrong],
        backgroundColor: ['#007bff', '#dc3545', '#28a745', '#ffc107']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart._metasets[context.datasetIndex].total;
              const percentage = ((value / total) * 100).toFixed(2);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
  clearLoadingState('vocabGrammarAccuracyChart', 'vocabGrammarAccuracyLoading');
}