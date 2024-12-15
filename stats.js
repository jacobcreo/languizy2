// stats.js

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
let timeSpentDistributionChartInstance;
let timeSpentChartInstance; 

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
        const fallbackLetter = (displayName.charAt(0) || email.charAt(0)).toUpperCase();
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

async function loadStats(user) {
  try {
    const userDocRef = db.collection('users').doc(user.uid);
    const selectedTimeInterval = document.getElementById('timeIntervalSelector').value;

    // Display loading messages for each chart
    const chartIds = [
      'speechPartBreakdownChart', 'answersOverTimeChart', 'accuracyChart',
      'cumulativeScoreChart', 'difficultyLevelChart', 'performanceOverTimeChart',
      'dailyScoreBreakdownChart', 'vocabGrammarAccuracyChart', 'timeSpentChart', 'timeSpentDistributionChart'
    ];
    chartIds.forEach(id => setLoadingState(id, `${id}Loading`));

    // Fetch user document and courses in parallel
    const [userDoc, coursesSnapshot] = await Promise.all([
      userDocRef.get(),
      userDocRef.collection('courses').get()
    ]);

    if (!userDoc.exists) return console.error('No such user!');
    if (coursesSnapshot.empty) return console.warn('No courses found for this user.');

    // Prepare to fetch stats for all courses
    const courseIds = coursesSnapshot.docs.map(doc => doc.id);
    const statsPromises = courseIds.map(courseId => {
      if (selectedCourse !== 'all' && courseId !== selectedCourse) return null;
      return userDocRef.collection('courses').doc(courseId).collection('stats').get();
    });

    const statsSnapshots = await Promise.all(statsPromises);

    // Process stats data
    const statsData = processStatsData(statsSnapshots, selectedTimeInterval);

    // Fetch and display the "Day Joined" date
    const dayJoined = userDoc.data().joinDate; 
    displayDayJoined(dayJoined);

    // Update UI with processed data
    updateUIWithStats(statsData);

    // Display charts (or locked messages if totalDrills < 10)
    await displayCharts(userDocRef, selectedCourse, statsData);

  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function displayDayJoined(dayJoined) {
  const formattedDayJoined = dayJoined ? dayJoined.toDate().toLocaleDateString() : 'N/A';
  document.getElementById('dayJoined').innerText = `Day Joined: ${formattedDayJoined}`;
}

async function displayCharts(userDocRef, selectedCourse, statsData) {
  const { dailyStats, datesSet, vocabCorrect, vocabWrong, grammarCorrect, grammarWrong, totalDrills, totalTimeSpent } = statsData;

  // If totalDrills < 10, display locked messages for all charts and return
  if (totalDrills < 10) {
    // Show locked messages for each chart
    displayLockedMessage('timeSpentChart', 'timeSpentLoading', 'Time Spent on Activities');
    displayLockedMessage('timeSpentDistributionChart', 'timeSpentDistributionLoading', 'Time Spent Distribution');
    displayLockedMessage('speechPartBreakdownChart', 'speechPartBreakdownLoading', 'Speech Parts Breakdown');
    displayLockedMessage('answersOverTimeChart', 'answersOverTimeLoading', 'Answers Over Time');
    displayLockedMessage('accuracyChart', 'accuracyLoading', 'Accuracy');
    displayLockedMessage('cumulativeScoreChart', 'cumulativeScoreLoading', 'Cumulative Score Over Time');
    displayLockedMessage('difficultyLevelChart', 'difficultyLevelLoading', 'Questions by Difficulty Level');
    displayLockedMessage('performanceOverTimeChart', 'performanceOverTimeLoading', 'Performance Over Time');
    displayLockedMessage('dailyScoreBreakdownChart', 'dailyScoreBreakdownLoading', 'Daily Score Breakdown');
    displayLockedMessage('vocabGrammarAccuracyChart', 'vocabGrammarAccuracyLoading', 'Vocabulary and Grammar Accuracy');
    
    // Also replace the heatmapContainer
    const heatmapContainer = document.getElementById('heatmapContainer');
    heatmapContainer.innerHTML = `
      <div class="locked-message">
        <i class="fas fa-lock fa-3x mb-3"></i>
        <h5 class="mb-0">Practice More to Unlock Daily Practice Heatmap</h5>
      </div>`;
    return; 
  }

  // If totalDrills >= 10, proceed with displaying charts
  const latestDate = new Date(); 
  const earliestDate = statsData.earliestDate || latestDate; 

  const sortedDailyStats = dailyStats.sort((a, b) => new Date(a.date) - new Date(b.date));
  const dateRange = generateDateRange(earliestDate, latestDate);

  // Fill in missing dates in dailyStats with zero values
  const filledDailyStats = dateRange.map(date => {
    const existingStat = sortedDailyStats.find(stat => stat.date === date);
    return existingStat || { 
      date, 
      correctAnswers: 0, 
      wrongAnswers: 0, 
      score: 0, 
      totalDrills: 0, 
      vocabularyScore: 0, 
      grammarScore: 0,
      vocabulary_DailyTime: 0,
      grammar_DailyTime: 0,
      stories_DailyTime: 0,
      chat_DailyTime: 0,
      basics_DailyTime: 0 
    };
  });

  const answersOverTimeData = filledDailyStats.map(stat => ({
    date: stat.date,
    correctAnswers: stat.correctAnswers,
    wrongAnswers: stat.wrongAnswers
  }));

  // Display Charts and Heatmap
  await Promise.all([
    displayTimeSpentChart(userDocRef, selectedCourse, dateRange),
    displayTimeSpentDistributionChart(userDocRef, selectedCourse, dateRange),
    displaySpeechPartBreakdownChart(userDocRef, selectedCourse),
    displayAnswersOverTimeChart(answersOverTimeData),
    displayAccuracyChart(statsData.totalCorrectAnswers, statsData.totalWrongAnswers),
    displayCumulativeScoreChart(filledDailyStats),
    displayDifficultyLevelChart(userDocRef, selectedCourse),
    displayHeatmap(Array.from(datesSet)),
    displayPerformanceOverTimeChart(filledDailyStats),
    displayDailyScoreBreakdownChart(filledDailyStats),
    displayVocabGrammarAccuracyChart(vocabCorrect, vocabWrong, grammarCorrect, grammarWrong)
  ]);
}

function processStatsData(statsSnapshots, selectedTimeInterval) {
  let earliestDate = null;
  let totalCorrectAnswers = 0;
  let totalWrongAnswers = 0;
  let totalScore = 0;
  let totalDrills = 0;
  let totalTimeSpent = 0;
  let dailyStats = [];
  let datesSet = new Set();
  let vocabCorrect = 0, vocabWrong = 0, grammarCorrect = 0, grammarWrong = 0, nounsCorrect = 0, nounsWrong = 0;

  statsSnapshots.forEach(statsSnapshot => {
    if (!statsSnapshot) return;

    statsSnapshot.forEach(doc => {
      const data = doc.data();
      const dateId = doc.id;

      // Filter by time interval
      if (selectedTimeInterval === 'last-7-days') {
        const date = new Date(dateId);
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);

        if (date < sevenDaysAgo || date > today) {
          return; // Skip
        }
      }

      if (dateId === 'all-time') {
        totalCorrectAnswers += data.totalCorrectAnswers || 0;
        totalWrongAnswers += data.totalWrongAnswers || 0;
        totalScore += data.totalScore || 0;
        totalDrills += data.totalDrills || 0;

        vocabCorrect += data.vocabulary_totalCorrectAnswers || 0;
        vocabWrong += data.vocabulary_totalWrongAnswers || 0;
        grammarCorrect += data.grammar_totalCorrectAnswers || 0;
        grammarWrong += data.grammar_totalWrongAnswers || 0;
        nounsCorrect += data.nouns_totalCorrectAnswers || 0;
        nounsWrong += data.nouns_totalWrongAnswers || 0;
      } else {
        const date = new Date(dateId);
        if (!earliestDate || date < earliestDate) earliestDate = date;

        const stat = {
          date: dateId,
          correctAnswers: data.correctAnswers || 0,
          wrongAnswers: data.wrongAnswers || 0,
          score: data.score || 0,
          totalDrills: data.totalDrills || 0,
          vocabularyScore: data.vocabulary_score || 0,
          grammarScore: data.grammar_score || 0,
          nounsScore: data.nouns_score || 0,
          nounsCorrect: data.nouns_correctAnswers || 0,
          nounsWrong: data.nouns_wrongAnswers || 0,
          nounsTotalDrills: data.nouns_totalDrills || 0,
          vocabularyTotalDrills: data.vocabulary_totalDrills || 0,
          vocabularyCorrect: data.vocabulary_correctAnswers || 0,
          vocabularyWrong: data.vocabulary_wrongAnswers || 0,
          grammarTotalDrills: data.grammar_totalDrills || 0,
          grammarCorrect: data.grammar_correctAnswers || 0,
          grammarWrong: data.grammar_wrongAnswers || 0,
          vocabulary_DailyTime: data.vocabulary_DailyTime || 0,
          grammar_DailyTime: data.grammar_DailyTime || 0,
          stories_DailyTime: data.timeSpentStories || 0,
          chat_DailyTime: data.chatTimeSpent || 0,
          basics_DailyTime: data.nouns_DailyTime || 0
        };

        dailyStats.push(stat);

        vocabCorrect += data.vocabulary_correctAnswers || 0;
        vocabWrong += data.vocabulary_wrongAnswers || 0;
        grammarCorrect += data.grammar_correctAnswers || 0;
        grammarWrong += data.grammar_wrongAnswers || 0;
        nounsCorrect += data.nouns_correctAnswers || 0;
        nounsWrong += data.nouns_wrongAnswers || 0;

        datesSet.add(dateId);

        // Accumulate total time spent
        totalTimeSpent += stat.vocabulary_DailyTime;
        totalTimeSpent += stat.grammar_DailyTime;
        totalTimeSpent += stat.stories_DailyTime;
        totalTimeSpent += stat.chat_DailyTime;
        totalTimeSpent += stat.basics_DailyTime;
      }
    });
  });

  return {
    earliestDate,
    totalCorrectAnswers,
    totalWrongAnswers,
    totalScore,
    totalDrills,
    dailyStats,
    datesSet,
    vocabCorrect,
    vocabWrong,
    grammarCorrect,
    grammarWrong,
    nounsCorrect,
    nounsWrong,
    totalTimeSpent
  };
}

function updateUIWithStats(statsData) {
  const { earliestDate, totalCorrectAnswers, totalWrongAnswers, totalScore, dailyStats, datesSet, totalTimeSpent } = statsData;

  const streakInfo = calculateStreaks(Array.from(datesSet));
  const currentStreak = streakInfo.currentStreak;
  const longestStreak = streakInfo.longestStreak;

  const totalDaysPracticed = datesSet.size;
  const averageScore = totalDaysPracticed > 0 ? (totalScore / totalDaysPracticed).toFixed(2) : 0;

  document.getElementById('currentStreak').innerText = `Current Streak: ${currentStreak}`;
  document.getElementById('longestStreak').innerText = `Longest Streak: ${longestStreak}`;
  document.getElementById('totalDaysPracticed').innerText = `Total Days Practiced: ${totalDaysPracticed}`;
  document.getElementById('averageScore').innerText = `Average Score: ${averageScore}`;
  document.getElementById('totalWrongAnswers').innerText = `Total Wrong Answers: ${totalWrongAnswers}`;

  // NEW: Update the new data boxes
  document.getElementById('totalExercisesDone').innerText = `Total Exercises Done: ${statsData.totalDrills}`;
  document.getElementById('correctAnswers').innerText = `Correct Answers: ${totalCorrectAnswers}`;
  document.getElementById('timeSpentLearning').innerText = `Time Spent Learning: ${formatTime(totalTimeSpent)}`;
}

/**
 * Helper Function to Format Time from Seconds to "X hr Y min Z sec"
 */
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  let formatted = '';
  if (hrs > 0) formatted += `${hrs} hr `;
  if (mins > 0) formatted += `${mins} min `;
  formatted += `${secs} sec`;
  return formatted;
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

async function populateCourseSelector(user) {
  const userDocRef = db.collection('users').doc(user.uid);
  const courseSelector = document.getElementById('courseSelector');
  courseSelector.innerHTML = '<option value="all">All Courses</option>';

  const coursesSnapshot = await userDocRef.collection('courses').get();
  coursesSnapshot.forEach(doc => {
    const courseData = doc.data();
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = `${courseData.knownLanguage.toUpperCase()} to ${courseData.targetLanguage.toUpperCase()}`;
    courseSelector.appendChild(option);
  });
}

async function displaySpeechPartBreakdownChart(userDocRef, currentCourse) {
  const ctx = document.getElementById('speechPartBreakdownChart').getContext('2d');

  if (speechPartBreakdownChartInstance) {
    speechPartBreakdownChartInstance.destroy();
  }

  const speechPartStats = {};

  async function processCourseQuestions(courseId) {
    const progressRef = userDocRef.collection('courses').doc(courseId).collection('progress');
    const progressSnapshot = await progressRef.get();

    for (const progressDoc of progressSnapshot.docs) {
      const progressData = progressDoc.data();
      const questionId = progressDoc.id;

      const questionDoc = await db.collection('questions').doc(questionId).get();
      if (!questionDoc.exists) continue;

      const questionData = questionDoc.data();
      const speechPart = questionData.missingWordSpeechPart || 'Unknown';

      if (!speechPartStats[speechPart]) {
        speechPartStats[speechPart] = { correct: 0, wrong: 0 };
      }

      speechPartStats[speechPart].correct += progressData.timesCorrect || 0;
      speechPartStats[speechPart].wrong += progressData.timesIncorrect || 0;
    }
  }

  if (currentCourse === 'all') {
    const coursesSnapshot = await userDocRef.collection('courses').get();
    await Promise.all(coursesSnapshot.docs.map(courseDoc => processCourseQuestions(courseDoc.id)));
  } else {
    await processCourseQuestions(currentCourse);
  }

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
      indexAxis: 'y',
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

function filterByCourse() {
  const selector = document.getElementById('courseSelector');
  selectedCourse = selector.value;
  loadStats(firebase.auth().currentUser); 
}

function displayHeatmap(dates) {
  const heatmapContainer = document.getElementById('heatmapContainer');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const oneDay = 24 * 60 * 60 * 1000;
  const datesSet = new Set(dates);
  const minimumBoxes = 30; 

  function drawHeatmap() {
    heatmapContainer.innerHTML = '';
    const containerWidth = heatmapContainer.offsetWidth;
    const boxSize = 28.78;
    const boxesPerRow = Math.floor(containerWidth / boxSize);
    const totalBoxes = Math.max(minimumBoxes, boxesPerRow * Math.ceil(minimumBoxes / boxesPerRow));

    for (let i = 0; i < totalBoxes; i++) {
      const day = new Date(today.getTime() - i * oneDay);
      const dateStr = day.toISOString().split('T')[0];
      const played = datesSet.has(dateStr);
      const color = played ? '#4CAF50' : '#D3D3D3';

      const dayDiv = document.createElement('div');
      dayDiv.className = 'heatmap-day';
      dayDiv.style.backgroundColor = color;
      dayDiv.title = `Date: ${dateStr}\nPlayed: ${played ? 'Yes' : 'No'}`;
      heatmapContainer.appendChild(dayDiv);
    }
  }

  drawHeatmap();
  window.addEventListener('resize', drawHeatmap);
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

  return { currentStreak, longestStreak };
}

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
    }
  });
  clearLoadingState('accuracyChart', 'accuracyLoading');
}

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

async function displayDifficultyLevelChart(userDocRef, currentCourse) {
  const ctx = document.getElementById('difficultyLevelChart').getContext('2d');

  if (difficultyLevelChartInstance) {
    difficultyLevelChartInstance.destroy();
  }

  const difficultyLevels = {};
  let maxDifficultyLevelSeen = 0;

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

function generateDateRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate).toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
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

async function displayTimeSpentChart(userDocRef, currentCourse, dateRange) {
  const ctx = document.getElementById('timeSpentChart').getContext('2d');

  if (timeSpentChartInstance) {
    timeSpentChartInstance.destroy();
  }

  const timeSpentData = {};
  const selectedTimeInterval = document.getElementById('timeIntervalSelector').value;
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  const coursesSnapshot = currentCourse === 'all' 
    ? await userDocRef.collection('courses').get()
    : [{ id: currentCourse }];

  for (const courseDoc of (coursesSnapshot.docs || coursesSnapshot)) {
    const statsSnapshot = await userDocRef.collection('courses').doc(courseDoc.id).collection('stats').get();

    statsSnapshot.forEach(doc => {
      const data = doc.data();
      const dateId = doc.id;
      if (selectedTimeInterval === 'last-7-days') {
        const date = new Date(dateId);
        if (date < sevenDaysAgo || date > today) {
          return;
        }
      }

      if (dateId !== 'all-time') {
        if (!timeSpentData[dateId]) {
          timeSpentData[dateId] = { vocabulary: 0, grammar: 0, stories: 0, chat: 0, basics: 0 };
        }
        timeSpentData[dateId].vocabulary += data.vocabulary_DailyTime || 0;
        timeSpentData[dateId].grammar += data.grammar_DailyTime || 0;
        timeSpentData[dateId].stories += data.timeSpentStories || 0;
        timeSpentData[dateId].chat += data.chatTimeSpent || 0;
        timeSpentData[dateId].basics += data.nouns_DailyTime || 0;
      }
    });
  }

  for (const date of dateRange) {
    if (!timeSpentData[date]) {
      timeSpentData[date] = { vocabulary: 0, grammar: 0, stories: 0, chat: 0, basics: 0 };
    }
  }

  const dates = dateRange.sort();
  const vocabularyData = dates.map(date => timeSpentData[date].vocabulary);
  const grammarData = dates.map(date => timeSpentData[date].grammar);
  const storiesData = dates.map(date => timeSpentData[date].stories);
  const chatData = dates.map(date => timeSpentData[date].chat);
  const basicsData = dates.map(date => timeSpentData[date].basics);

  timeSpentChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Vocabulary',
          data: vocabularyData,
          backgroundColor: '#007bff'
        },
        {
          label: 'Grammar',
          data: grammarData,
          backgroundColor: '#28a745'
        },
        {
          label: 'Stories',
          data: storiesData,
          backgroundColor: '#ffc107'
        },
        {
          label: 'Chat',
          data: chatData,
          backgroundColor: '#dc3545'
        },
        {
          label: 'Basics',
          data: basicsData,
          backgroundColor: '#6c757d'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          stacked: true,
          title: {
            display: true,
            text: 'Time Spent (seconds)'
          },
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });

  clearLoadingState('timeSpentChart', 'timeSpentLoading');
}

async function displayTimeSpentDistributionChart(userDocRef, currentCourse, dateRange) {
  const ctx = document.getElementById('timeSpentDistributionChart').getContext('2d');

  if (timeSpentDistributionChartInstance) {
    timeSpentDistributionChartInstance.destroy();
  }

  let totalTimeSpent = { vocabulary: 0, grammar: 0, stories: 0, chat: 0, basics: 0 };
  const selectedTimeInterval = document.getElementById('timeIntervalSelector').value;
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  const coursesSnapshot = currentCourse === 'all' 
    ? await userDocRef.collection('courses').get()
    : [{ id: currentCourse }];

  for (const courseDoc of (coursesSnapshot.docs || coursesSnapshot)) {
    const statsSnapshot = await userDocRef.collection('courses').doc(courseDoc.id).collection('stats').get();

    statsSnapshot.forEach(doc => {
      const data = doc.data();
      const dateId = doc.id;

      if (selectedTimeInterval === 'last-7-days') {
        const date = new Date(dateId);
        if (date < sevenDaysAgo || date > today) {
          return; 
        }
      }

      if (dateId !== 'all-time') {
        totalTimeSpent.vocabulary += data.vocabulary_DailyTime || 0;
        totalTimeSpent.grammar += data.grammar_DailyTime || 0;
        totalTimeSpent.stories += data.timeSpentStories || 0;
        totalTimeSpent.chat += data.chatTimeSpent || 0;
        totalTimeSpent.basics += data.nouns_DailyTime || 0;
      }
    });
  }

  const labels = ['Vocabulary', 'Grammar', 'Stories', 'Chat', 'Basics'];
  const data = [
    totalTimeSpent.vocabulary,
    totalTimeSpent.grammar,
    totalTimeSpent.stories,
    totalTimeSpent.chat,
    totalTimeSpent.basics
  ];

  timeSpentDistributionChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6c757d']
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
              return `${label}: ${value} seconds (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  clearLoadingState('timeSpentDistributionChart', 'timeSpentDistributionLoading');
}

function filterByTimeInterval() {
  loadStats(firebase.auth().currentUser);
}

/**
 * NEW HELPER FUNCTION:
 * Display a locked message instead of a chart if totalDrills < 10
 */
function displayLockedMessage(chartId, loadingId, chartName) {
  const loadingElement = document.getElementById(loadingId);
  if (loadingElement) loadingElement.style.display = 'none';

  const chartElement = document.getElementById(chartId);
  if (chartElement) {
    chartElement.style.display = 'none';
    const parent = chartElement.parentNode;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'locked-message';
    messageDiv.innerHTML = `
      <i class="fas fa-lock fa-3x mb-3"></i>
      <h5 class="mb-0">Practice More to Unlock ${chartName}</h5>
    `;

    // Append the message after the loading element (or at end if no loading)
    parent.appendChild(messageDiv);
  }
}
