the users collection contains documents with the userId (e.g. 6ArNCkQOBZVTwQsEJyzD0kacL292).
Each user id contains 3 collections: courses, progress and stats, and also the following values/fields:
currentCourse
"en-de"
(string)

displayName
"Koby Ofek"
(string)

email
"kobyof@gmail.com"
(string)

knownLanguage
"en"
(string)

lastLogin
September 18, 2024 at 8:55:51 AM UTC+3
(timestamp)

targetLanguage
"de"
(string)
The courses collection contains documents like "en-de", "en-es" representing the "*language user knows*-*language user is learning*"
Each of them may contain collection like progress and stats. Progress contains documents with questionIDs (like 285LG39UsBS85z81RFmU), that contains fields like: initialAppearance
false
(boolean)

lastAnswered
September 17, 2024 at 10:56:10 AM UTC+3
(timestamp)

nextDue
September 19, 2024 at 10:56:10 AM UTC+3
(timestamp)

timesCorrect
1
(number)

timesCorrectInARow
1
(number)

timesIncorrect
1
(number)
stats contain documents like dates and all-time, for example: 2024-09-17

2024-09-18

all-time
each date collection contains the following entries/values: correctAnswers
7
(number)

score
70
(number)

totalDrills
12
(number)

wrongAnswers
5
(number)
all-time contains the following values: 
totalCorrectAnswers
11
(number)

totalDrills
19
(number)

totalScore
110
(number)

totalWrongAnswers
8
(number)
