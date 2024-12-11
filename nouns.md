Languizy: Basics (Nouns) Screen Functionality and Documentation

This document provides a comprehensive overview of the Basics (Nouns) screen in Languizy, focusing on its functionality, design, logic, and workflow. This is intended to help developers understand the code and structure, enabling them to contribute effectively.

Purpose of the Basics (Nouns) Screen

The Basics (Nouns) screen is designed to help users learn and practice foundational vocabulary through interactive noun drills. It supports various modes of interaction (e.g., multiple-choice, text input) and integrates with Firestore for data persistence and analytics.

Features and Functionality

1. User Interface Components

The screen includes:
	•	Navigation Bar: Includes a logout button, user avatar, and a link to the course selection page.
	•	Stats Bar:
	•	Displays the user’s current course flags, score, correct and incorrect answer counts, and recent answer streaks (visualized as color-coded boxes).
	•	A proficiency indicator shows the user’s progress percentage (maxOrder) for the course.
	•	Question Area:
	•	Shows a single noun-related task (e.g., image, multiple-choice options, or text input field).
	•	Displays feedback on answers.
	•	Includes controls for toggling difficulty (multiple-choice vs. text input) and navigation (next question).
	•	Special Characters Section: Provides buttons for special characters needed for text input (e.g., ä, é) based on the target language.
	•	Multiple-Choice Area: Displays up to four options for the user to choose the correct noun (visible only in multiple-choice mode).
	•	Audio Playback: Allows users to replay the pronunciation of the noun.
	•	Feedback and Stats:
	•	Displays immediate feedback (correct/incorrect) and the correct answer if necessary.
	•	Tracks the user’s progress for each noun (e.g., times seen, times correct).

2. Core Functionalities

2.1 Display Modes

	•	Image-to-Word: Displays an image, and the user identifies the noun via text input or multiple-choice selection.
	•	Four Images: Displays four images, and the user selects the one corresponding to the noun.
	•	Matching-Mode: Displays two columns of words—four target-language words on the left and four origin-language words on the right. The user must match pairs by selecting one word from either column and then its correct counterpart in the other column. This mode uses keys 1-4 for left column words and 5-8 for right column words, and no special characters or images are involved. After all pairs are correctly matched, the drill is considered a success.


2.2 Difficulty Modes

	•	Text Input (Harder): User types the noun based on the displayed image.
	•	Multiple Choice (Easier): User selects the correct option from four randomly shuffled words.

2.3 Progress Tracking

The app tracks:
	•	Correct/Wrong Streaks: Adjusts AI coach feedback.
	•	User Stats: Includes total drills, correct/wrong answers, and the time taken per question.
	•	Noun Progress: Tracks how often a noun has been seen, answered correctly, or answered incorrectly.

2.4 Feedback

	•	Feedback messages indicate correctness and provide the correct answer for incorrect responses.
	•	Encouragement messages are dynamically generated based on streaks.
	•	Matching-mode uses correct/wrong sounds and considers the drill complete only after all pairs are matched.


2.5 Data Integration

	•	Firestore:
	•	Stores user stats, progress, and daily limits.
	•	Tracks maxOrder (highest noun order answered) to calculate proficiency.
	•	AWS Polly Integration:
	•	Checks and generates audio files for nouns using AWS Polly when not available.

Key Code Components

1. Initialization

	•	firebase.auth().onAuthStateChanged: Ensures the user is authenticated and loads the current course data.
	•	Firestore Initialization: The app connects to Firestore to retrieve user data, nouns, and progress.

2. Loading Questions

Main Functions

	1.	loadNoun:
	•	Determines which noun to display next using a scheduling algorithm:
	•	Prioritizes nouns due for review based on nextDue timestamp.
	•	Avoids repeating the last noun (previousNounId).
	•	Calls loadNounData to fetch the noun details and display it.
	2.	displayNoun:
	•	Dynamically updates the UI to display the selected noun.
	•	Handles image-to-word, four-images, and matching-mode displays.
	•	Preloads images to ensure smooth transitions.
	3.	displayMultipleChoiceOptions:
	•	Generates four options, including the correct noun and three distractors.
	•	Randomizes their order before displaying.
	4.	displayFourImagesNew:
	•	Loads four images (including the correct noun’s image).
	•	Shuffles and displays the images, tracking the correct answer with a data-correct attribute.
	•	In matching-mode, initializes pairs of words, shuffles them, and sets up event handlers for matching pairs.


3. Answer Submission

Main Functions

	1.	Text Input Mode:
	•	handleSubmit:
	•	Compares the user’s input with the correct noun.
	•	Normalizes strings to handle special characters (normalizeString).
	•	Calls afterAnswerSubmission.
	2.	Multiple Choice Mode:
	•	handleFourImagesSubmit:
	•	Evaluates whether the user clicked the correct image.
	•	Highlights the correct and incorrect answers visually.
	3.	Matching-Mode:
	•	Users select words from columns. Correct pairs disappear, and after all four pairs are matched, `afterAllPairsMatched` is called.
	•	afterAllPairsMatched: Treats the drill as a correct completion and updates stats accordingly.
	3.	Feedback and Stats:
	•	afterAnswerSubmission: Displays feedback (correct/incorrect).
	•	Updates streaks and user progress in Firestore.
	•	Adjusts difficulty and recommendations.
	•	For matching-mode, completion is determined once all pairs are matched, always counting as correct in the end.


4. Data Persistence

Firestore Collections

	1.	Users Collection:
	•	Stores user-specific data (e.g., progress, stats, and daily limits).
	2.	Nouns Collection:
	•	Contains all available nouns with metadata (e.g., translations, images, and distractors).
	3.	Reports Collection:
	•	Allows users to report problematic questions.

5. Audio Playback

Main Functions

	1.	playNounAudio:
	•	Attempts to fetch audio from AWS S3.
	•	If unavailable, generates the audio via AWS Polly.
	2.	generateNounAudio:
	•	Makes an API call to AWS Polly to generate text-to-speech audio.
	3.	Replay Button:
	•	Lets users replay the noun’s audio except in matching-mode (where no replay is needed).

6. User Interface Interactions

	1.	Special Characters:
	•	Dynamically loads based on the target language.
	•	Adds selected characters to the input field.
	2.	Stats Bar:
	•	Updates visual stats (e.g., last five answers) using updateVisualStats and updateLastFiveAnswers.
	3.	Toggle Mode:
	•	Switches between text input and multiple-choice modes.
	•	Adjusts difficulty dynamically.

	•	In matching-mode, special keys (1-4, 5-8) select words in columns. Enter does nothing until completion.


7. Reporting and Help

	1.	Reporting Issues:
	•	Users can report problematic nouns via a modal form.
	•	Reports are saved to Firestore with metadata.
	2.	Help Modal:
	•	Provides a detailed guide on how to use the screen and its features.

8. Database Structure

To modify the description to include the exact Firestore fields being read, written, and updated, here is the updated document description:

The application interacts with Firestore in several ways, involving the following collections and fields:

#### **Users Collection (`users`)**
- **Document:** `{uid}` (User ID)
  - **Fields:**
    - `displayName`: User's display name.
    - `photoURL`: URL of the user's profile picture.
    - `email`: User's email address.
    - `currentCourse`: The currently selected course (e.g., `en-de`).
    - `subLevel`: Subscription level (e.g., `Free`, `Premium`).

#### **Courses Sub-Collection (`courses`)**
- **Document:** `{courseId}` (e.g., `en-de`)
  - **Fields:**
    - `knownLanguage`: Source language for the course (e.g., `en`).
    - `targetLanguage`: Target language for the course (e.g., `de`).
  - **Sub-Collection: Stats (`stats`)**
    - **Document:** `all-time`
      - **Fields:**
        - `maxOrder`: Maximum noun order completed.
        - `totalDrills`: Total number of drills completed.
        - `totalCorrectAnswers`: Total number of correct answers.
        - `totalWrongAnswers`: Total number of wrong answers.
        - `totalScore`: Total score.
        - `nouns_totalDrills`: Total drills for nouns.
        - `nouns_totalCorrectAnswers`: Correct answers for nouns.
        - `nouns_totalWrongAnswers`: Wrong answers for nouns.
        - `nouns_totalScore`: Total score for nouns.
        - `TimeSpent`: Total time spent (in seconds).
    - **Document:** `{date}` (e.g., `2024-12-07`)
      - **Fields:**
        - `totalDrills`: Daily drills completed.
        - `correctAnswers`: Daily correct answers.
        - `wrongAnswers`: Daily wrong answers.
        - `score`: Daily score.
        - `DailyTime`: Time spent on all drills (in seconds).
        - `nouns_totalDrills`: Daily drills for nouns.
        - `nouns_correctAnswers`: Daily correct answers for nouns.
        - `nouns_wrongAnswers`: Daily wrong answers for nouns.
        - `nouns_score`: Daily score for nouns.
        - `nouns_DailyTime`: Time spent on nouns (in seconds).

#### **Nouns Sub-Collection (`nouns`)**
- **Document:** `{courseId}`
  - **Sub-Collection:** `nouns`
    - **Document:** `{nounId}` (e.g., `noun-001`)
      - **Fields:**
        - `noun`: The actual noun word.
        - `translations`: Array of translations for the noun.
        - `distractors`: Array of distractors for multiple-choice mode.
        - `order`: Sequential order of the noun.
        - `nextDue`: Timestamp of when the noun is next due for review.
        - `lastAnswered`: Timestamp of the last time the noun was answered.
        - `timesCorrect`: Count of correct answers.
        - `timesIncorrect`: Count of incorrect answers.
        - `timesCorrectInARow`: Correct answer streak.
        - `timesIncorrectInARow`: Incorrect answer streak.
        - `initialAppearance`: Boolean indicating whether the noun is being seen for the first time.

#### **Reports Collection (`reports`)**
- **Document:** Auto-generated ID
  - **Fields:**
    - `questionType`: Type of question being reported (e.g., `nouns`).
    - `nounId`: ID of the noun being reported.
    - `timeOfUpdate`: Timestamp of when the report was submitted.
    - `comment`: User's comment explaining the issue.
    - `language`: Target language of the course.
    - `knownLanguage`: Source language of the course.
    - `isMultipleChoice`: Boolean indicating if the issue occurred in multiple-choice mode.
    - `userId`: ID of the user submitting the report.
    - `status`: Current status of the report (e.g., `created`).

---

### Firestore Operations

#### **Reading Data**
- User data (`users/{uid}`):
  - Retrieves `currentCourse`, `photoURL`, and `subLevel`.
- Course details (`users/{uid}/courses/{courseId}`):
  - Retrieves `knownLanguage` and `targetLanguage`.
- Noun details (`nouns/{nounId}`):
  - Fetches noun metadata, translations, and distractors.
- User progress (`users/{uid}/nouns/{courseId}/nouns/{nounId}`):
  - Reads `timesCorrect`, `timesIncorrect`, `lastAnswered`, and `nextDue`.

#### **Writing Data**
- User progress (`users/{uid}/nouns/{courseId}/nouns/{nounId}`):
  - Updates `timesCorrect`, `timesIncorrect`, `nextDue`, `lastAnswered`, and streak data.
- Daily stats (`users/{uid}/courses/{courseId}/stats/{date}`):
  - Updates `nouns_correctAnswers`, `nouns_wrongAnswers`, and `nouns_score`.
- All-time stats (`users/{uid}/courses/{courseId}/stats/all-time`):
  - Updates `nouns_totalCorrectAnswers`, `nouns_totalWrongAnswers`, and `nouns_totalScore`.

#### **Updating Data**
- Progress Tracking:
  - Adjusts `timesCorrectInARow` and `timesIncorrectInARow`.
- Proficiency Level:
  - Updates `maxOrder` and calculates proficiency percentage.

---

This detailed addition ensures that developers understand the exact Firestore fields used in the application, enhancing clarity and maintainability.

Data Flow

	1.	Fetch User Data:
	•	Authenticate and retrieve user stats and preferences.
	2.	Load and Display Question:
	•	Fetch noun data from Firestore.
	•	Display the noun in text input, multiple-choice, four-images, or matching-mode.
	3.	Answer Submission:
	•	Evaluate the answer.
	•	Provide feedback and update progress.
	4.	Update Stats:
	•	Save the user’s performance data to Firestore.
	5.	Iterate:
	•	Load the next question based on progress and scheduling logic.

Developer Notes

	•	UI Responsiveness: The design adjusts to mobile and desktop devices.
	•	Error Handling:
	•	Ensures fallback for missing audio or data.
	•	Handles invalid course configurations.
	•	Extensibility:
	•	Easily add new languages by updating the countryToLanguage and languageToSpecialChars mappings.
	•	Supports additional exercise types via modular design.

Recommended Improvements

	1.	Enhanced Personalization:
	•	Suggest difficulty modes based on user performance.
	2.	Optimized Preloading:
	•	Prefetch multiple nouns to reduce load times.
	3.	Analytics Integration:
	•	Track detailed user behavior for insights and improvement.

This document should serve as a blueprint for future developers, providing them with the necessary understanding to extend and optimize the Basics (Nouns) screen.