// Initialize Firestore
const db = firebase.firestore();

// Initialize Chart Instances
let accuracyChartInstance;
let answersOverTimeChartInstance;
let cumulativeScoreChartInstance;
let difficultyLevelChartInstance;

// Initialize selectedCourse to 'all' for showing all course stats by default
let selectedCourse = 'all';

// Authentication State Listener
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    loadStats(user); // Load stats for the authenticated user
    populateCourseSelector(user); // Populate course selector dynamically
    loadUserAvatar(user);  // Load user avatar in the navbar

  } else {
    window.location.href = 'login.html'; // Redirect to login if not authenticated
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
      } else {
          console.error('User data does not exist in Firestore');
      }
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
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.error('No such user!');
      return;
    }

    const coursesSnapshot = await userDocRef.collection('courses').get();

    if (coursesSnapshot.empty) {
      console.warn('No courses found for this user.');
      return;
    }

    let earliestDate = null;
    let totalCorrectAnswers = 0;
    let totalWrongAnswers = 0;
    let totalScore = 0;
    let totalDrills = 0;
    let dailyStats = [];
    let datesSet = new Set();

    // Iterate through each course to aggregate stats or filter by selected course
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      if (selectedCourse !== 'all' && courseId !== selectedCourse) continue;

      const statsRef = userDocRef.collection('courses').doc(courseId).collection('stats');
      const statsSnapshot = await statsRef.get();

      statsSnapshot.forEach(doc => {
        const data = doc.data();
        const dateId = doc.id;

        if (dateId === 'all-time') {
          totalCorrectAnswers += data.totalCorrectAnswers || 0;
          totalWrongAnswers += data.totalWrongAnswers || 0;
          totalScore += data.totalScore || 0;
          totalDrills += data.totalDrills || 0;
        } else {
          const date = new Date(dateId);
          if (!earliestDate || date < earliestDate) {
            earliestDate = date;
          }

          dailyStats.push({
            date: dateId,
            correctAnswers: data.correctAnswers || 0,
            wrongAnswers: data.wrongAnswers || 0,
            score: data.score || 0,
            totalDrills: data.totalDrills || 0
          });

          datesSet.add(dateId);
        }
      });
    }

    // Determine Day Joined
    const dayJoined = earliestDate ? earliestDate.toLocaleDateString() : 'N/A';

    // Calculate Streaks
    const streakInfo = calculateStreaks(Array.from(datesSet));
    const currentStreak = streakInfo.currentStreak;
    const longestStreak = streakInfo.longestStreak;

    const totalDaysPracticed = datesSet.size;

    // Calculate Average Score
    const averageScore = totalDaysPracticed > 0 ? (totalScore / totalDaysPracticed).toFixed(2) : 0;

    // Calculate Average Accuracy
    const totalAnswers = totalCorrectAnswers + totalWrongAnswers;
    const averageAccuracy = totalAnswers > 0 ? ((totalCorrectAnswers / totalAnswers) * 100).toFixed(2) : 0;

    // Update HTML Elements with Calculated Statistics
    document.getElementById('dayJoined').innerText = `Day Joined: ${dayJoined}`;
    document.getElementById('currentStreak').innerText = `Current Streak: ${currentStreak}`;
    document.getElementById('longestStreak').innerText = `Longest Streak: ${longestStreak}`;
    document.getElementById('totalDaysPracticed').innerText = `Total Days Practiced: ${totalDaysPracticed}`;
    document.getElementById('averageScore').innerText = `Average Score: ${averageScore}`;
    document.getElementById('totalWrongAnswers').innerText = `Total Wrong Answers: ${totalWrongAnswers}`;

    // Prepare Data for Charts
    const sortedDailyStats = dailyStats.sort((a, b) => new Date(a.date) - new Date(b.date));
    const answersOverTimeData = sortedDailyStats.map(stat => ({
      date: stat.date,
      correctAnswers: stat.correctAnswers,
      wrongAnswers: stat.wrongAnswers
    }));

    // Display Charts and Heatmap
    displayHeatmap(Array.from(datesSet));
    displayAnswersOverTimeChart(answersOverTimeData);
    displayAccuracyChart(totalCorrectAnswers, totalWrongAnswers);
    displayCumulativeScoreChart(dailyStats);
    displayDifficultyLevelChart(userDocRef, selectedCourse); // pass the course to this function
  } catch (error) {
    console.error('Error loading stats:', error);
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
    const datesSet = new Set(dates); // Store practiced dates in a set for easy lookup
    const minimumBoxes = 30; // Ensure at least 30 boxes are shown
  
    // Function to recalculate and redraw the heatmap based on screen size
    function drawHeatmap() {
      heatmapContainer.innerHTML = ''; // Clear previous content
  debugger;
      const containerWidth = heatmapContainer.offsetWidth;
      const boxSize = 28.78; // Width of each box in pixels, including margin
      const boxesPerRow = Math.floor(containerWidth / boxSize);
      const totalBoxes = Math.max(minimumBoxes, boxesPerRow * Math.ceil(minimumBoxes / boxesPerRow)); // Always fill rows completely
  
      for (let i = 0; i < totalBoxes; i++) {
        const day = new Date(today.getTime() - i * oneDay); // Get date for each box starting from today
        const dateStr = day.toISOString().split('T')[0];
        const played = datesSet.has(dateStr); // Check if user practiced on this date
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

/**
 * Display Answers Over Time Chart
 * @param {Array} data - Array of objects containing date, correctAnswers, and wrongAnswers
 */
function displayAnswersOverTimeChart(data) {
  const ctx = document.getElementById('answersOverTimeChart').getContext('2d');

  // Destroy previous chart instance if it exists
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
    }});
}

/**
 * Display Accuracy Pie Chart
 * @param {number} totalCorrect - Total number of correct answers
 * @param {number} totalWrong - Total number of wrong answers
 */
function displayAccuracyChart(totalCorrect, totalWrong) {
  const ctx = document.getElementById('accuracyChart').getContext('2d');

  // Destroy previous chart instance if it exists
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
}

/**
 * Display Cumulative Score Chart
 * @param {Array} dailyStats - Array of daily stats containing score
 */
function displayCumulativeScoreChart(dailyStats) {
  const ctx = document.getElementById('cumulativeScoreChart').getContext('2d');

  // Calculate cumulative score over time
  const cumulativeData = [];
  let cumulativeScore = 0;
  dailyStats.forEach(stat => {
    cumulativeScore += stat.score;
    cumulativeData.push({
      date: stat.date,
      score: cumulativeScore
    });
  });

  // Destroy previous chart instance if it exists
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
} );
}

/**
 * Display Questions by Difficulty Level Chart
 * @param {Object} userDocRef - Firestore document reference to the user
 * @param {string} currentCourse - The course to display stats for (or 'all' for all courses)
 */
async function displayDifficultyLevelChart(userDocRef, currentCourse) {
    const ctx = document.getElementById('difficultyLevelChart').getContext('2d');
  
    // Destroy previous chart instance if it exists
    if (difficultyLevelChartInstance) {
      difficultyLevelChartInstance.destroy();
    }
  
    // Object to store difficulty levels and answer statistics
    const difficultyLevels = {};
    let maxDifficultyLevelSeen = 0; // Track the highest difficulty level seen
  
    // Function to process the progress for a given course
    async function processCourseProgress(courseId) {
      const progressRef = userDocRef.collection('courses').doc(courseId).collection('progress');
      const progressSnapshot = await progressRef.get();
  
      for (const progressDoc of progressSnapshot.docs) {
        const progressData = progressDoc.data();
        const questionId = progressDoc.id;
  
        // Fetch the corresponding question from the questions collection
        const questionDoc = await db.collection('questions').doc(questionId).get();
        if (!questionDoc.exists) continue;
  
        const questionData = questionDoc.data();
        const difficultyLevel = questionData.difficultyLevel;
  
        // Ensure difficultyLevel is a valid integer between 1 and 200
        if (!Number.isInteger(difficultyLevel) || difficultyLevel < 1 || difficultyLevel > 200) {
          console.warn(`Skipping question with invalid difficulty level: ${questionId}`);
          continue;
        }
  
        // Update the highest difficulty level seen
        if (difficultyLevel > maxDifficultyLevelSeen) {
          maxDifficultyLevelSeen = difficultyLevel;
        }
  
        // Initialize the difficulty level entry if it doesn't exist
        if (!difficultyLevels[difficultyLevel]) {
          difficultyLevels[difficultyLevel] = {
            totalReviewed: 0,
            correctAnswers: 0,
            incorrectAnswers: 0
          };
        }
  
        // Update the difficulty level stats
        difficultyLevels[difficultyLevel].totalReviewed += 1;
        difficultyLevels[difficultyLevel].correctAnswers += progressData.timesCorrect || 0;
        difficultyLevels[difficultyLevel].incorrectAnswers += progressData.timesIncorrect || 0;
      }
    }
  
    // If showing stats for all courses, process each course
    if (currentCourse === 'all') {
      const coursesSnapshot = await userDocRef.collection('courses').get();
      for (const courseDoc of coursesSnapshot.docs) {
        await processCourseProgress(courseDoc.id);
      }
    } else {
      // If showing stats for a specific course, only process that course
      await processCourseProgress(currentCourse);
    }
  
    // Prepare data for chart, extending the difficulty levels by 2
    const extendedMaxLevel = Math.min(maxDifficultyLevelSeen + 2, 200);
    const labels = Array.from({ length: extendedMaxLevel }, (_, i) => i + 1);
  
    const totalReviewed = labels.map(level => difficultyLevels[level]?.totalReviewed || 0);
    const correctAnswers = labels.map(level => difficultyLevels[level]?.correctAnswers || 0);
    const incorrectAnswers = labels.map(level => difficultyLevels[level]?.incorrectAnswers || 0);
  
    // Display the chart
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
  }
    