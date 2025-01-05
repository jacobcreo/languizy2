// consts

const LEVELS_LIST = [
  {
    "level": 1,
    "name": "Word Wanderer",
    "correctDrillsRequired": 0
  },
  {
    "level": 2,
    "name": "Letter Explorer",
    "correctDrillsRequired": 10
  },
  {
    "level": 3,
    "name": "Phrase Pioneer",
    "correctDrillsRequired": 30
  },
  {
    "level": 4,
    "name": "Sound Adventurer",
    "correctDrillsRequired": 50
  },
  {
    "level": 5,
    "name": "Grammar Glider",
    "correctDrillsRequired": 100
  },
  {
    "level": 6,
    "name": "Sentence Sprout",
    "correctDrillsRequired": 170
  },
  {
    "level": 7,
    "name": "Accent Apprentice",
    "correctDrillsRequired": 250
  },
  {
    "level": 8,
    "name": "Vocab Voyager",
    "correctDrillsRequired": 325
  },
  {
    "level": 9,
    "name": "Syntax Seeker",
    "correctDrillsRequired": 410
  },
  {
    "level": 10,
    "name": "Culture Enthusiast",
    "correctDrillsRequired": 500
  },
  {
    "level": 11,
    "name": "Language Pathfinder",
    "correctDrillsRequired": 600
  },
  {
    "level": 12,
    "name": "Article Architect",
    "correctDrillsRequired": 620
  },
  {
    "level": 13,
    "name": "Dialogue Discoverer",
    "correctDrillsRequired": 780
  },
  {
    "level": 14,
    "name": "Noun Navigator",
    "correctDrillsRequired": 1040
  },
  {
    "level": 15,
    "name": "Verb Conqueror",
    "correctDrillsRequired": 1190
  },
  {
    "level": 16,
    "name": "Preposition Pilot",
    "correctDrillsRequired": 1350
  },
  {
    "level": 17,
    "name": "Basic Builder",
    "correctDrillsRequired": 1520
  },
  {
    "level": 18,
    "name": "Wordsmith-in-Training",
    "correctDrillsRequired": 1700
  },
  {
    "level": 19,
    "name": "Grammar Grower",
    "correctDrillsRequired": 1890
  },
  {
    "level": 20,
    "name": "Pronunciation Prodigy",
    "correctDrillsRequired": 2090
  },
  {
    "level": 21,
    "name": "Sentence Shaper",
    "correctDrillsRequired": 2300
  },
  {
    "level": 22,
    "name": "Conjugation Crafter",
    "correctDrillsRequired": 2520
  },
  {
    "level": 23,
    "name": "Idiom Investigator",
    "correctDrillsRequired": 2750
  },
  {
    "level": 24,
    "name": "Conversation Champion",
    "correctDrillsRequired": 2990
  },
  {
    "level": 25,
    "name": "Phrase Chaser",
    "correctDrillsRequired": 3240
  },
  {
    "level": 26,
    "name": "Accent Aficionado",
    "correctDrillsRequired": 3500
  },
  {
    "level": 27,
    "name": "Vocabulary Virtuoso",
    "correctDrillsRequired": 3770
  },
  {
    "level": 28,
    "name": "Grammar Guardian",
    "correctDrillsRequired": 4050
  },
  {
    "level": 29,
    "name": "Dialogue Dancer",
    "correctDrillsRequired": 4340
  },
  {
    "level": 30,
    "name": "Cultural Connector",
    "correctDrillsRequired": 4640
  },
  {
    "level": 31,
    "name": "Syntax Strategist",
    "correctDrillsRequired": 4950
  },
  {
    "level": 32,
    "name": "Expression Enthusiast",
    "correctDrillsRequired": 5270
  },
  {
    "level": 33,
    "name": "Linguistic Learner",
    "correctDrillsRequired": 5600
  },
  {
    "level": 34,
    "name": "Word Weaver",
    "correctDrillsRequired": 5940
  },
  {
    "level": 35,
    "name": "Translation Tactician",
    "correctDrillsRequired": 6290
  },
  {
    "level": 36,
    "name": "Comprehension Conqueror",
    "correctDrillsRequired": 6650
  },
  {
    "level": 37,
    "name": "Sentence Sculptor",
    "correctDrillsRequired": 7020
  },
  {
    "level": 38,
    "name": "Accent Artist",
    "correctDrillsRequired": 7400
  },
  {
    "level": 39,
    "name": "Phrase Specialist",
    "correctDrillsRequired": 7790
  },
  {
    "level": 40,
    "name": "Grammar Sage",
    "correctDrillsRequired": 8190
  },
  {
    "level": 41,
    "name": "Linguistic Voyager",
    "correctDrillsRequired": 8600
  },
  {
    "level": 42,
    "name": "Polyglot Pathfinder",
    "correctDrillsRequired": 9020
  },
  {
    "level": 43,
    "name": "Syntax Sorcerer",
    "correctDrillsRequired": 9450
  },
  {
    "level": 44,
    "name": "Idiom Alchemist",
    "correctDrillsRequired": 9890
  },
  {
    "level": 45,
    "name": "Phraseologist",
    "correctDrillsRequired": 10340
  },
  {
    "level": 46,
    "name": "Expression Artisan",
    "correctDrillsRequired": 10800
  },
  {
    "level": 47,
    "name": "Accent Maestro",
    "correctDrillsRequired": 11270
  },
  {
    "level": 48,
    "name": "Fluent Trailblazer",
    "correctDrillsRequired": 11750
  },
  {
    "level": 49,
    "name": "Cultural Whisperer",
    "correctDrillsRequired": 12240
  },
  {
    "level": 50,
    "name": "Grammar Virtuoso",
    "correctDrillsRequired": 12740
  },
  {
    "level": 51,
    "name": "Language Magician",
    "correctDrillsRequired": 13250
  },
  {
    "level": 52,
    "name": "Multilingual Muse",
    "correctDrillsRequired": 13770
  },
  {
    "level": 53,
    "name": "Conjugation Commander",
    "correctDrillsRequired": 14300
  },
  {
    "level": 54,
    "name": "Sentence Sculptor Extraordinaire",
    "correctDrillsRequired": 14840
  },
  {
    "level": 55,
    "name": "Expression Explorer",
    "correctDrillsRequired": 15390
  },
  {
    "level": 56,
    "name": "Cultural Cartographer",
    "correctDrillsRequired": 15950
  },
  {
    "level": 57,
    "name": "Polyglot Dreamer",
    "correctDrillsRequired": 16520
  },
  {
    "level": 58,
    "name": "Dialogue Dynamo",
    "correctDrillsRequired": 17100
  },
  {
    "level": 59,
    "name": "Vocabulary Visionary",
    "correctDrillsRequired": 17690
  },
  {
    "level": 60,
    "name": "Linguistic Luminary",
    "correctDrillsRequired": 18290
  },
  {
    "level": 61,
    "name": "Language Nomad",
    "correctDrillsRequired": 18900
  },
  {
    "level": 62,
    "name": "Multilingual Mastermind",
    "correctDrillsRequired": 19520
  },
  {
    "level": 63,
    "name": "Syntax Whisperer",
    "correctDrillsRequired": 20150
  },
  {
    "level": 64,
    "name": "Prose Pioneer",
    "correctDrillsRequired": 20790
  },
  {
    "level": 65,
    "name": "Vocabulary Vanguard",
    "correctDrillsRequired": 21440
  },
  {
    "level": 66,
    "name": "Translation Titan",
    "correctDrillsRequired": 22100
  },
  {
    "level": 67,
    "name": "Accent Virtuoso",
    "correctDrillsRequired": 22770
  },
  {
    "level": 68,
    "name": "Idiom Enthusiast",
    "correctDrillsRequired": 23450
  },
  {
    "level": 69,
    "name": "Cultural Ambassador",
    "correctDrillsRequired": 24140
  },
  {
    "level": 70,
    "name": "Grammar Guru",
    "correctDrillsRequired": 24840
  },
  {
    "level": 71,
    "name": "Fluent Pathfinder",
    "correctDrillsRequired": 25550
  },
  {
    "level": 72,
    "name": "Global Conversationalist",
    "correctDrillsRequired": 26270
  },
  {
    "level": 73,
    "name": "Prose Alchemist",
    "correctDrillsRequired": 27000
  },
  {
    "level": 74,
    "name": "Wordplay Wizard",
    "correctDrillsRequired": 27740
  },
  {
    "level": 75,
    "name": "Accent Perfectionist",
    "correctDrillsRequired": 28490
  },
  {
    "level": 76,
    "name": "Language Liberator",
    "correctDrillsRequired": 29250
  },
  {
    "level": 77,
    "name": "Idiom Illuminator",
    "correctDrillsRequired": 30020
  },
  {
    "level": 78,
    "name": "Expression Strategist",
    "correctDrillsRequired": 30800
  },
  {
    "level": 79,
    "name": "Communication Captain",
    "correctDrillsRequired": 31590
  },
  {
    "level": 80,
    "name": "Cultural Crusader",
    "correctDrillsRequired": 32390
  },
  {
    "level": 81,
    "name": "Multilingual Maestro",
    "correctDrillsRequired": 33200
  },
  {
    "level": 82,
    "name": "Expression Innovator",
    "correctDrillsRequired": 34020
  },
  {
    "level": 83,
    "name": "Linguistic Artisan",
    "correctDrillsRequired": 34850
  },
  {
    "level": 84,
    "name": "Cultural Sage",
    "correctDrillsRequired": 35690
  },
  {
    "level": 85,
    "name": "Language Connoisseur",
    "correctDrillsRequired": 36540
  },
  {
    "level": 86,
    "name": "Grammar Grandmaster",
    "correctDrillsRequired": 37400
  },
  {
    "level": 87,
    "name": "Syntax Champion",
    "correctDrillsRequired": 38270
  },
  {
    "level": 88,
    "name": "Conversational Visionary",
    "correctDrillsRequired": 39150
  },
  {
    "level": 89,
    "name": "Polyglot Pilgrim",
    "correctDrillsRequired": 40040
  },
  {
    "level": 90,
    "name": "Linguistic Virtuoso",
    "correctDrillsRequired": 40940
  },
  {
    "level": 91,
    "name": "Expressionist Extraordinaire",
    "correctDrillsRequired": 41850
  },
  {
    "level": 92,
    "name": "Language Legend",
    "correctDrillsRequired": 42770
  },
  {
    "level": 93,
    "name": "Fluent Star",
    "correctDrillsRequired": 43700
  },
  {
    "level": 94,
    "name": "Sentence Symphony",
    "correctDrillsRequired": 44640
  },
  {
    "level": 95,
    "name": "Accent Commander",
    "correctDrillsRequired": 45590
  },
  {
    "level": 96,
    "name": "Translation Luminary",
    "correctDrillsRequired": 46550
  },
  {
    "level": 97,
    "name": "Polyglot Pioneer",
    "correctDrillsRequired": 47520
  },
  {
    "level": 98,
    "name": "Linguistic Sage",
    "correctDrillsRequired": 48500
  },
  {
    "level": 99,
    "name": "Global Wordsmith",
    "correctDrillsRequired": 49490
  },
  {
    "level": 100,
    "name": "Master of Tongues",
    "correctDrillsRequired": 50490
  }
];

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

const countryToLanguage = {
  cn: { languageCode: "cmn-CN", voice: "Zhiyu" },        // China
  in: { languageCode: "hi-IN", voice: "Aditi" },         // India
  us: { languageCode: "en-US", voice: "Joanna" },        // United States
  en: { languageCode: "en-US", voice: "Joanna" },        // United States
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
  sv: ['å', 'ä', 'ö'],      // Swedish
  nl: ['é', 'ë', 'ï', 'ü'], // Dutch
  da: ['æ', 'ø', 'å'],      // Danish
  no: ['æ', 'ø', 'å'],      // Norwegian
  pl: ['ą', 'ć', 'ę', 'ł']  // Polish
};

const UIString = {
  en: {
    // General
    pageTitle: "Vocabulary - Language Learning App",
    navbarBrandTitle: "Languizy, Language Learning for Real",
    navbarBrandAlt: "Languizy Logo",
    logout: "Logout",
    returnToCourseSelection: "Return to Course Selection",

    // Stats & Counters
    ProficiencyLevel: 'Proficiency Level',
    ReviewQuestionsWaiting: 'Review Questions Waiting',
    loadingMessage: "Loading...",
    seenLabel: "Seen:",
    timesWord: "times",
    times: 'times',
    seen: 'Seen',
    once: 'once',
    correctLabel: "Correct",
    wrongLabel: "Wrong",

    // Buttons
    submitAnswer: "Submit Answer",
    nextQuestion: "Next Question",
    toggleMode: "Make it easier",
    explainSentence: "Explain Sentence",
    makeItEasier: "Make it easier",
    makeItHarder: "Make it harder",

    // Multiple Choice
    multipleChoiceSection: "Multiple Choice",

    // Coach
    coachContainer: "Coach Container", // for dev reference
    coachImageAlt: "Coach Image",
    coachMessage: "You are doing great!",

    // Special Characters
    specialCharactersBlock: "Special characters block",

    // Replay & Additional Buttons
    replayAudio: "Replay",
    help: "Help",
    stats: "Stats",
    report: "Report",

    // Explanation Modal
    explanationModalTitle: "Explanation",
    closeButtonTitle: "Close",
    close: "Close",

    // Report Modal
    reportIssue: "Report Issue",
    describeIssue: "Describe your issue with the question:",
    reportCommentPlaceholder: "Explain what went wrong...",
    submit: "Submit",

    // Help Modal
    helpInstructions: "Help & Instructions",
    welcome: "Welcome to the Vocabulary Practice Screen!",
    enhanceSkills:
      "Here, you can enhance your language skills by practicing vocabulary in a fun and interactive way...",
    navigationHeader: "Navigation",
    logoutLabel: "Logout:",
    logoutDescription:
      'Click the "Logout" button in the top-right corner to safely exit your session.',
    courseSelectionLabel: "Course Selection:",
    courseSelectionDescription:
      "Use the back arrow in the stats bar to return to the course selection screen.",
    interfaceUnderstandingHeader: "Understanding the Interface",
    questionAreaLabel: "Question Area:",
    questionAreaDescription:
      "This is where your current question is displayed. Fill in the blank with the correct word.",
    multipleChoiceModeLabel: "Multiple Choice Mode:",
    multipleChoiceModeDescription:
      "If enabled, select the correct answer from the given options.",
    textInputModeLabel: "Text Input Mode:",
    textInputModeDescription:
      "Type your answer in the input field provided.",
    buttonsFeaturesHeader: "Buttons and Features",
    submitAnswerLabel: "Submit Answer:",
    submitAnswerDescription:
      "Click this button to submit your answer for evaluation.",
    nextQuestionLabel: "Next Question:",
    nextQuestionDescription:
      "Move to the next question after submitting your answer.",
    toggleModeLabel: "Toggle Mode:",
    toggleModeDescription:
      "Switch between multiple-choice and text input modes to adjust the difficulty level.",
    replayAudioLabel: "Replay Audio:",
    replayAudioDescription:
      "Listen to the pronunciation of the sentence again.",
    reportLabel: "Report:",
    reportDescription:
      "If you encounter an issue with a question, use this button to report it.",
    statsFeedbackHeader: "Stats and Feedback",
    scoreLabel: "Score:",
    scoreTooltip: 'Daily Score: ',
    scoreDescription:
      "Your current score is displayed in the stats bar. Aim to improve it with each correct answer!",
    correctWrongCountLabel: "Correct/Wrong Count:",
    correctWrongCountDescription:
      "Keep track of your correct and incorrect answers.",
    correctTooltip: 'Correct Answers: ',
    wrongTooltip: 'Incorrect Answers: ',
    lastFiveAnswersLabel: "Last 5 Answers:",
    lastFiveAnswersDescription:
      "Visual feedback on your recent performance is shown with colored boxes.",
    tipsSuccessHeader: "Tips for Success",
    tip1: "Take your time to understand each question...",
    tip2: "Switch between modes to challenge yourself...",
    tip3: "Use the 'Replay Audio' feature to improve your pronunciation...",
    closingParagraph:
      "We hope you enjoy your learning journey with us. If you have any questions or need further assistance, feel free to reach out to our support team. Happy learning!",

    // Drills Limit Modal
    drillsLimitTitle: "Drills Limit Reached",
    drillsLimitMessage:
      "You have reached your daily limit of 50 drills for the Free subscription. Please upgrade to continue practicing.",

    // Error Modal
    errorModalTitle: "Oops! Something went wrong.",
    errorModalMessage:
      "We couldn't load the questions. There might be an issue with your internet connection.",
    errorModalBack: "Back to Main Screen",
    errorModalRetry: "Try Again",

    // Congrats Modal
    congrats: 'Congratulations!',
    level: 'Level',
    continue: 'Continue',
    exploreOtherOptions: 'Explore Other Options',
    youUnlocked: 'You\'ve unlocked the stage:',

    
    correctExclemation: 'Correct!',
    incorrectPart1: 'Incorrect. The correct answer was',
    correctPart2: 'is',

    lessonExplanation: "Lesson Explanation",
      generalExplanation: "General Explanation",
      theMissingWord: "The Missing Word",

      // Time Difference Templates
    shownLast: "shown last {0} {1} ago",
    newPhrase: "(new phrase)",

    // Time Units
    minute: "minute",
    minutes: "minutes",
    hour: "hour",
    hours: "hours",
    day: "day",
    days: "days",
    week: "week",
    weeks: "weeks",
    month: "month",
    months: "months",
    year: "year",
    years: "years",
  },

  es: {
    // General
    pageTitle: "Vocabulario - Aplicación de Aprendizaje de Idiomas",
    navbarBrandTitle: "Languizy, Aprendizaje de Idiomas para la Vida Real",
    navbarBrandAlt: "Logo de Languizy",
    logout: "Cerrar sesión",
    returnToCourseSelection: "Volver a la Selección de Curso",

    // Stats & Counters
    ProficiencyLevel: 'Nivel de Competencia',
    ReviewQuestionsWaiting: 'Preguntas para Revisión',
    loadingMessage: "Cargando...",
    seenLabel: "Visto:",
    timesWord: "veces",
    times: "veces",
    seen: "Visto",
    once: "una vez",
    correctLabel: "Correctos",
    wrongLabel: "Incorrectos",

    // Buttons
    submitAnswer: "Enviar Respuesta",
    nextQuestion: "Siguiente Pregunta",
    toggleMode: "Hacerlo más fácil",
    explainSentence: "Explicar Oración",
    makeItEasier: "Hacerlo más fácil",
    makeItHarder: "Hacerlo más difícil",

    // Multiple Choice
    multipleChoiceSection: "Opción Múltiple",

    // Coach
    coachContainer: "Contenedor del Entrenador",
    coachImageAlt: "Imagen del Entrenador",
    coachMessage: "¡Lo estás haciendo muy bien!",

    // Special Characters
    specialCharactersBlock: "Caracteres especiales",

    // Replay & Additional Buttons
    replayAudio: "Repetir",
    help: "Ayuda",
    stats: "Estadísticas",
    report: "Informar",

    // Explanation Modal
    explanationModalTitle: "Explicación",
    closeButtonTitle: "Cerrar",
    close: "Cerrar",

    // Report Modal
    reportIssue: "Informar Problema",
    describeIssue: "Describe tu problema con la pregunta:",
    reportCommentPlaceholder: "Explica qué salió mal...",
    submit: "Enviar",

    // Help Modal
    helpInstructions: "Ayuda e Instrucciones",
    welcome: "¡Bienvenido a la Pantalla de Práctica de Vocabulario!",
    enhanceSkills:
      "Aquí puedes mejorar tus habilidades lingüísticas practicando vocabulario de manera divertida...",
    navigationHeader: "Navegación",
    logoutLabel: "Cerrar Sesión:",
    logoutDescription:
      'Haz clic en el botón "Cerrar sesión" en la esquina superior derecha para salir de tu sesión...',
    courseSelectionLabel: "Selección de Curso:",
    courseSelectionDescription:
      "Usa la flecha de regreso en la barra de estadísticas para regresar a la pantalla de selección...",
    interfaceUnderstandingHeader: "Entendiendo la Interfaz",
    questionAreaLabel: "Área de Pregunta:",
    questionAreaDescription:
      "Aquí se muestra la pregunta actual. Completa el espacio en blanco con la palabra correcta.",
    multipleChoiceModeLabel: "Modo de Opción Múltiple:",
    multipleChoiceModeDescription:
      "Si está habilitado, selecciona la respuesta correcta de las opciones dadas.",
    textInputModeLabel: "Modo de Entrada de Texto:",
    textInputModeDescription:
      "Escribe tu respuesta en el campo de texto proporcionado.",
    buttonsFeaturesHeader: "Botones y Funciones",
    submitAnswerLabel: "Enviar Respuesta:",
    submitAnswerDescription:
      "Haz clic en este botón para enviar tu respuesta para evaluación.",
    nextQuestionLabel: "Siguiente Pregunta:",
    nextQuestionDescription:
      "Pasa a la siguiente pregunta después de enviar tu respuesta.",
    toggleModeLabel: "Cambiar Modo:",
    toggleModeDescription:
      "Cambia entre modo de opción múltiple y modo de entrada de texto para ajustar la dificultad.",
    replayAudioLabel: "Repetir Audio:",
    replayAudioDescription:
      "Escucha nuevamente la pronunciación de la oración.",
    reportLabel: "Informar:",
    reportDescription:
      "Si encuentras un problema con una pregunta, usa este botón para informarlo.",
    statsFeedbackHeader: "Estadísticas y Retroalimentación",
    scoreLabel: "Puntuación:",
    scoreDescription:
      "Tu puntuación actual se muestra en la barra de estadísticas. ¡Intenta mejorarla con cada respuesta correcta!",
    scoreTooltip: 'Puntuación Diaria: ',
    correctWrongCountLabel: "Correctos/Incorrectos:",
    correctWrongCountDescription:
      "Lleva un registro de tus respuestas correctas e incorrectas.",
    correctTooltip: 'Respuestas Correctas: ',
    wrongTooltip: 'Respuestas Incorrectas: ',
    lastFiveAnswersLabel: "Últimas 5 Respuestas:",
    lastFiveAnswersDescription:
      "Se muestra retroalimentación visual de tu rendimiento reciente con cuadros de colores.",
    tipsSuccessHeader: "Consejos para el Éxito",
    tip1: "Tómate tu tiempo para entender cada pregunta...",
    tip2: "Cambia de modo para desafiarte y mejorar tu aprendizaje...",
    tip3: "Usa la función 'Repetir Audio' para mejorar tu pronunciación...",
    closingParagraph:
      "Esperamos que disfrutes tu experiencia de aprendizaje con nosotros. Si tienes alguna pregunta o necesitas ayuda adicional, ¡contáctanos!",

    // Drills Limit Modal
    drillsLimitTitle: "Límite de Ejercicios Alcanzado",
    drillsLimitMessage:
      "Has alcanzado tu límite diario de 50 ejercicios para la suscripción gratuita. Por favor, mejora tu plan para continuar practicando.",

    // Error Modal
    errorModalTitle: "¡Ups! Algo salió mal.",
    errorModalMessage:
      "No pudimos cargar las preguntas. Puede que tengas problemas con tu conexión a internet.",
    errorModalBack: "Volver a la Pantalla Principal",
    errorModalRetry: "Intentar de Nuevo",

    // Congrats Modal
    congrats: '¡Felicidades!',
    level: 'Nivel',
    continue: 'Continuar',
    exploreOtherOptions: 'Explorar otras opciones',
    youUnlocked: '¡Has desbloqueado el nivel:',


    correctExclemation: '¡Correcto!',
        incorrectPart1: 'Incorrecto. La respuesta correcta era',
        correctPart2: 'es',
        incorrect: 'Incorrecto',
        lessonExplanation: "Explicación de la Lección",
        generalExplanation: "Explicación General",
        theMissingWord: "La Palabra Faltante",

         // Time Difference Templates
    shownLast: "mostrado hace {0} {1}",
    newPhrase: "(nueva frase)",

    // Time Units
    minute: "minuto",
    minutes: "minutos",
    hour: "hora",
    hours: "horas",
    day: "día",
    days: "días",
    week: "semana",
    weeks: "semanas",
    month: "mes",
    months: "meses",
    year: "año",
    years: "años",
  },
  // Additional languages can be added here
};



// Initialize Firestore
var db = firebase.firestore();
var dailyScore = 0;
var debounceTimeout = null; // Use a debounce timeout instead of a boolean flag
let correctAnswers = 0;
let wrongAnswers = 0;
let streakCorrect = 0;
let streakWrong = 0;
let lastFiveAnswers = [];
let previousQuestionId = null; // Ensure this is correctly initialized
let questionStartTime; // Variable to store the start time of the question
let showCoachFeedback = true;
let userCurrentLevel = 1; // default

let interfaceLanguage = 'en';

let questionsToIgnore = []; // new array for ignoring failing question IDs




let uid = null;

// Global variable to track the current mode (multiple-choice or text input)
let isMultipleChoice;

// Global variables to store the current question data
let currentQuestionId;
let currentQuestionData;
let currentCourse;

let maxFrequency = 0;



let interimMessageInterval;


var audioElement = new Audio(); // Create a new audio element


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

      showCoachFeedback = userData.CoachFeedback !== undefined ? userData.CoachFeedback : true;
      if (showCoachFeedback) {
        $('#coach-container').addClass('d-flex').removeClass('d-none');
      } else {
        $('#coach-container').addClass('d-none').removeClass('d-flex');
      }

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
    let coachId = userDoc.exists && userDoc.data().coach;

    // If no coach is assigned, set the default coach ID and update the user document
    if (!coachId) {
      coachId = "ntRoVcqi2KNo6tvljdQ2"; // Default coach ID
      await userRef.update({ coach: coachId });
    }

    // Fetch coach data from Firestore
    const coachData = await fetchCoachData(coachId, interfaceLanguage);

    // Set global variables or store coach data to be used throughout the practice screen
    window.coachData = coachData;
    setCoachImage(coachData.image); // Set the coach image in the UI
  } catch (error) {
    console.error('Error fetching or assigning coach:', error);
  }
}

/**
 * fetchCoachData(coachId, interfaceLanguage)
 * 
 *  - Fetches coach doc from Firestore
 *  - Handles both the old and new structure for strings/arrays
 *  - Falls back to English if the requested language is missing
 *  - Returns only the data needed for the UI
 */

async function fetchCoachData(coachId, interfaceLanguage = 'en') {
  try {
    const coachDoc = await db.collection('coaches').doc(coachId).get();
    if (!coachDoc.exists) {
      throw new Error(`Coach with ID ${coachId} not found.`);
    }

    const docData = coachDoc.data();

    // Helper function to shuffle an array and get 'count' items
    function getRandomMessages(arr, count = 10) {
      return arr.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    /**
     * getStringField(fieldData):
     * - If old structure => fieldData is just "some string"
     * - If new structure => fieldData is { en: "some string", es: "algo" }
     * - Return fieldData[interfaceLanguage] if it exists, else fallback to .en, else ""
     */
    function getStringField(fieldData) {
      if (!fieldData) return "";
      
      // Old structure => string
      if (typeof fieldData === 'string') {
        return fieldData;
      }
      // New structure => object with subkeys
      if (typeof fieldData === 'object') {
        return fieldData[interfaceLanguage] || fieldData.en || "";
      }

      // Fallback
      return "";
    }

    /**
     * getArrayField(fieldData):
     * - If old structure => fieldData is just ["some", "array", "strings"]
     * - If new structure => fieldData is { en: [...], es: [...], fr: [...] }
     * - Return the array for interfaceLanguage, fallback to .en if missing
     */
    function getArrayField(fieldData) {
      if (!fieldData) return [];

      // Old structure => array
      if (Array.isArray(fieldData)) {
        return fieldData;
      }
      // New structure => object with sub-arrays
      if (typeof fieldData === 'object') {
        const arr = fieldData[interfaceLanguage] || fieldData.en || [];
        return Array.isArray(arr) ? arr : [];
      }

      // Fallback
      return [];
    }

    return {
      coachName: getStringField(docData.coachName),
      characterDescription: getStringField(docData.characterDescription),
      personality: getStringField(docData.personality),
      image: docData.image || "",

      // For each array field, we get up to 10 random messages
      correctMessages: getRandomMessages(getArrayField(docData.correctMessages)),
      encouragementMessages: getRandomMessages(getArrayField(docData.encouragementMessages)),
      fiveCorrectMessages: getRandomMessages(getArrayField(docData.fiveCorrectMessages)),
      fiveMistakesMessages: getRandomMessages(getArrayField(docData.fiveMistakesMessages)),
      loadingMessages: getRandomMessages(getArrayField(docData.loadingMessages)),
      mistakeMessages: getRandomMessages(getArrayField(docData.mistakeMessages)),
      sevenCorrectMessages: getRandomMessages(getArrayField(docData.sevenCorrectMessages)),
      sevenMistakesMessages: getRandomMessages(getArrayField(docData.sevenMistakesMessages)),
      threeCorrectMessages: getRandomMessages(getArrayField(docData.threeCorrectMessages)),
      threeMistakesMessages: getRandomMessages(getArrayField(docData.threeMistakesMessages)),
      tonsOfCorrectsInARowMessages: getRandomMessages(getArrayField(docData.tonsOfCorrectsInARowMessages)),
      tonsOfMistakesInARowMessages: getRandomMessages(getArrayField(docData.tonsOfMistakesInARowMessages)),
    };
  } catch (error) {
    console.error('Error fetching coach data:', error);
    return null;
  }
}


function setCoachImage(imageFilename) {
  const imagePath = `assets/images/${imageFilename}`;
  $('#coachImage').attr('src', imagePath); // Assuming there's an <img id="coach-image"> in your HTML
  $('#coachImage').removeClass('invisible'); // Assuming there's an <img id="coach-image"> in your HTML
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
    'es-en': ['assets/icons/es-flag.png', 'assets/icons/en-flag.png'],
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

    modifyInterfaceLanguage();


    fetchOrAssignCoach(user).then(() => {
      fetchCurrentCourse(user).then((currentCourse) => {
        fetchMaxFrequency(user, currentCourse).then(() => {
          window.currentCourse = currentCourse;


          loadUserAvatar(user);
          if (!currentCourse) {

            console.error('No valid current course found.');
            window.location.href = 'course_selection.html';
            return;
          }

          loadDailyScore(user, currentCourse);
          initializeDefaultMode();
          loadQuestion(user, currentCourse);
          updateFlagIcons(currentCourse);
          updateMaxFrequencyUI();

          // fetch user level from all-time doc once, store in window.userCurrentLevel
          fetchCurrentLevel(user, currentCourse)
            .then((lvl) => {
              userCurrentLevel = lvl;
              console.log("User current level is:", lvl);
            })
            .catch((err) => {
              console.warn("Couldn't fetch user level, defaulting to 1:", err);
              userCurrentLevel = 1;
            });

          const targetLanguage = currentCourse.split('-')[1];
          updateSpecialCharacters(targetLanguage);
        }).catch((error) => {

          console.error('error fetching max frequency:', error);
          window.location.href = 'course_selection.html';
        });
      }).catch((error) => {

        console.error('Error fetching current course:', error);
        window.location.href = 'course_selection.html';
      });
    });
  } else {

    window.location.href = '/';
  }
});

async function populateSubLevelBadge(userDoc) {
  const subLevel = userDoc.data().subLevel;
  const subLevelBadge = document.getElementById('subLevelBadge');
  subLevelBadge.textContent = subLevel;  // Set the badge based on userLevel
  if (subLevel === 'Free') {
    subLevelBadge.textContent = 'FREE';
    subLevelBadge.className = 'badge bg-secondary';

    subLevelBadge.onclick = function () {
      window.location.href = '/course_selection.html?upgrade=true';
    };
  } else {
    subLevelBadge.textContent = 'PRO';
    subLevelBadge.className = 'badge bg-danger';
    subLevelBadge.onclick = null; // No action on click for PRO
  }
}

// New function to update maxFrequency UI
function updateMaxFrequencyUI() {



  if (maxFrequency > 0) {
    let maxFrequencyPercentage = (maxFrequency / 10000 * 100).toFixed(2) + '%';
    $('#proficiencyLevel').text(maxFrequencyPercentage);
    $('#profTooltip').text(maxFrequencyPercentage + ' ' + UIString[interfaceLanguage].ProficiencyLevel);
  } else {
    let maxFrequencyPercentage = '0.00%';
    $('#proficiencyLevel').text(maxFrequencyPercentage);
    $('#profTooltip').text(maxFrequencyPercentage + ' ' + UIString[interfaceLanguage].ProficiencyLevel);

  }
}

// Function to initialize the default mode based on screen size
function initializeDefaultMode() {
  if (window.innerWidth < 768) { // Mobile devices
    isMultipleChoice = true; // Set to multiple-choice
    $('#toggle-mode').text(UIString[interfaceLanguage].makeItHarder);
  } else {
    isMultipleChoice = false; // Set to text input
    $('#toggle-mode').text(UIString[interfaceLanguage].makeItEasier);
  }

  // Add an event listener for the toggle button
  $('#toggle-mode').off('click').on('click', toggleMode);
}

// Function to toggle between modes
function toggleMode() {
  debugger;

  isMultipleChoice = !isMultipleChoice; // Toggle the mode
  $('#toggle-mode').text(isMultipleChoice ? UIString[interfaceLanguage].makeItHarder : UIString[interfaceLanguage].makeItEasier);
  gtag('event', 'Toggle Mode', {
    'question_type': 'Vocabulary',
    'user_id': uid,
    'user_pressed': isMultipleChoice ? UIString[interfaceLanguage].makeItEasier : UIString[interfaceLanguage].makeItHarder,
    'course': window.currentCourse
  });
  // Reload the current question with the new mode
  debugger;
  displayQuestion(currentQuestionData, currentQuestionId, currentCourse);
}

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
  // Get the user's local timezone
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

  // var today = new Date().toISOString().split('T')[0]; // Get date in yyyy-mm-dd format

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
    $('#scoreTooltip').text(UIString[interfaceLanguage].scoreTooltip + ': ' + dailyScore); // Display the current daily score
    $('#correctTooltip').text(UIString[interfaceLanguage].correctTooltip + ': 0'); // Starting with 0 correct answers
    $('#wrongTooltip').text(UIString[interfaceLanguage].wrongTooltip + ': 0'); // Starting with 0 wrong answers
  }).catch(error => {
    console.error('Error loading daily score:', error);
  });
}

//=================================================
// loadQuestion - The main orchestrator
//=================================================
async function loadQuestion(user, currentCourse) {
  showLoadingProgress();

  if (!user) {
    console.error("User is not authenticated.");
    return;
  }
  if (!currentCourse) {
    console.error("User has not selected a course.");

    window.location.href = 'course_selection.html';
    return;
  }

  // Check daily drill limit or subscription
  await checkDrillsLimit(user, currentCourse);

  // Show a random encouragement message
  showEncouragementMessage();

  try {
    // 1) Attempt to fetch a "due" question
    let questionDoc = await getDueQuestion(user, currentCourse);

    // 2) If no due question found, try new question
    if (!questionDoc) {
      questionDoc = await getNewQuestion(user, currentCourse);
    }

    // 3) If still none, try next-early question
    if (!questionDoc) {
      questionDoc = await getNextEarlyQuestion(user, currentCourse);
    }

    // 4) If we have a question, display it
    if (questionDoc) {
      previousQuestionId = questionDoc.id; // Remember it to avoid duplicates
      loadQuestionData(questionDoc.id, currentCourse);
    } else {
      console.log('No questions found at all.');
      hideLoadingProgress();
      showErrorModal();  // <---- NEW

    }
  } catch (error) {
    console.error('Error loading question:', error);
    hideLoadingProgress();
    showErrorModal(); // <---- NEW

  }
}

//=================================================
// getDueQuestion - Returns a doc from Firestore
//   that is nextDue <= now, sorted by nextDue
//=================================================
async function getDueQuestion(user, currentCourse) {
  try {
    const progressRef = db.collection('users')
      .doc(user.uid)
      .collection('courses')
      .doc(currentCourse)
      .collection('progress');

    const snapshot = await progressRef
      .where('nextDue', '<=', new Date())
      .orderBy('nextDue', 'asc')
      .limit(5)
      .get();

    if (snapshot.empty) {
      return null;
    }

    // local filter to skip question IDs in questionsToIgnore
    const docs = snapshot.docs.filter(doc => !questionsToIgnore.includes(doc.id));

    // from these, pick one that’s not the previous question
    let validDoc = null;
    docs.forEach(doc => {
      if (!validDoc && doc.id !== previousQuestionId) {
        validDoc = doc;
      }
    });

    // fallback if they're all the same
    if (!validDoc && docs.length > 0) {
      validDoc = docs[0];
    }

    if (!validDoc) return null;

    console.log('Due question found:', validDoc.id);
    return validDoc;
  } catch (err) {
    console.error('Error in getDueQuestion:', err);
    return null;
  }
}

//=================================================
// getNewQuestion - Return a question the user has
//   never answered (unseen).
//=================================================
async function getNewQuestion(user, currentCourse) {
  try {
    const [knownLang, targetLang] = currentCourse.split('-');
    const allQsSnap = await db.collection('questions')
      .where('knownLanguage', '==', knownLang)
      .where('language', '==', targetLang)
      .where('frequency', '>=', maxFrequency - 5)
      .orderBy('frequency', 'asc')
      .limit(15)
      .get();

    if (allQsSnap.empty) {
      console.log('No questions for this course in "questions" collection.');
      return null;
    }

    const allQs = allQsSnap.docs.map(doc => ({ id: doc.id, data: doc.data() }));

    const userProgressSnap = await db.collection('users')
      .doc(user.uid)
      .collection('courses')
      .doc(currentCourse)
      .collection('progress')
      .get();

    const seenIds = userProgressSnap.docs.map(d => d.id);

    // filter out seen + questionsToIgnore + previous
    const unseen = allQs.filter(q =>
      !seenIds.includes(q.id) &&
      !questionsToIgnore.includes(q.id) &&
      q.id !== previousQuestionId
    );

    if (unseen.length === 0) {
      console.log('No brand-new questions available.');
      return null;
    }

    console.log('New question found:', unseen[0].id);
    return unseen[0];
  } catch (error) {
    console.error('Error in getNewQuestion:', error);
    return null;
  }
}


//=================================================
// getNextEarlyQuestion - Return a doc for a question
//   that is not due yet but can still be practiced
//=================================================
async function getNextEarlyQuestion(user, currentCourse) {
  try {
    const progressRef = db.collection('users')
      .doc(user.uid)
      .collection('courses')
      .doc(currentCourse)
      .collection('progress');

    const snapshot = await progressRef
      .orderBy('nextDue', 'asc')
      .limit(5)
      .get();

    if (snapshot.empty) {
      console.log('No next-early questions found.');
      return null;
    }

    const docs = snapshot.docs.filter(doc => !questionsToIgnore.includes(doc.id));

    let validDoc = null;
    docs.forEach(doc => {
      if (!validDoc && doc.id !== previousQuestionId) {
        validDoc = doc;
      }
    });

    if (!validDoc && docs.length > 0) {
      validDoc = docs[0];
    }

    if (!validDoc) return null;

    console.log('Next-early question found:', validDoc.id);
    return validDoc;
  } catch (err) {
    console.error('Error in getNextEarlyQuestion:', err);
    return null;
  }
}

//=================================================
// loadQuestionData - Given a question ID, load from
//   "questions" and then call displayQuestion(...).
//=================================================
function loadQuestionData(questionId, currentCourse) {
  db.collection('questions').doc(questionId).get()
    .then(questionDoc => {
      if (questionDoc.exists) {
        displayQuestion(questionDoc.data(), questionId, currentCourse);
        previousQuestionId = questionId; // Make sure we don't show it again
      } else {
        console.error('Question doc not found:', questionId);
        questionsToIgnore.push(questionId); // <--- Mark it as invalid
        hideLoadingProgress();
      }
    })
    .catch(error => {
      console.error('Error loading question data:', error);
      questionsToIgnore.push(questionId); // <--- Mark as invalid
      hideLoadingProgress();
    });
}

// Show an error modal if we cannot load any question
function showErrorModal() {
  $('#errorModal').modal('show');
}

// Reset the questionsToIgnore and retry loading
function resetAndRetry() {
  questionsToIgnore = [];
  $('#errorModal').modal('hide');
  // Attempt loading again
  loadQuestion(firebase.auth().currentUser, window.currentCourse);
}

// Function to get the count of due questions
async function getDueQuestionsCount() {
  try {
    const progressRef = db.collection('users')
      .doc(uid)
      .collection('courses')
      .doc(window.currentCourse)
      .collection('progress');

    const countSnapshot = await progressRef
      .where('nextDue', '<=', new Date())
      .get();

    return countSnapshot.size;
  } catch (error) {
    console.error('Error fetching due questions count:', error);
    return 0;
  }
}

// Function to update the due questions count in the UI
async function updateDueQuestionsCount() {
  const count = await getDueQuestionsCount();
  document.getElementById('dueQuestions').innerText = count;
  document.getElementById('dueQuestionsTooltip').innerText = count + ' ' + UIString[interfaceLanguage].ReviewQuestionsWaiting;

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
function displayQuestion(question, questionId, currentCourse) {
  console.log(question);
  hideLoadingProgress(); // Hide progress bar when the question loads
  $('#replay-audio').prop('disabled', true); // Disable and grey out the button

  updateDueQuestionsCount(); // Update the due questions count in the UI
  // We are doing this here because it's ensuring that the previous stats are updated before the new question is displayed


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

  if (typeof currentCourse !== 'undefined') {
    window.currentCourse = currentCourse;
  } else {
    currentCourse = window.currentCourse;
  }

  var inputLength = question.missingWord.length;

  // Calculate input width dynamically to match the expected answer length
  var inputWidth = inputLength * 1.2;

  // Determine whether to show input field or placeholder based on mode
  const inputField = isMultipleChoice ? '_____' : `<input type="text" autocomplete="off" id="user-answer" class="fill-in-blank" maxlength="${inputLength}" style="width: ${inputWidth}ch;">`;
  var sentenceHTML = question.sentence.replace('___', inputField);

  $('.option-btn').removeClass('selected'); // Remove selected class from all options (relevant to multiple choice, but in case user switches)
  $('.option-btn').prop('disabled', false);

  $('#sentence').html(sentenceHTML);
  if (sentenceHTML.length > 68) {
    $('#sentence').removeClass('size2 size175').addClass('size15');
  } else if (sentenceHTML.length > 51) {
    $('#sentence').removeClass('size2 size15').addClass('size175');
  } else if (sentenceHTML.length > 34) {
    $('#sentence').removeClass('size175 size15').addClass('size2');
  } else {
    $('#sentence').removeClass('size2 size175 size15');
  }

  // Display the sentence with the appropriate input field or placeholder
  $('#sentence').html(sentenceHTML);
  $('#translation').text(question.translation);

  $('#toggle-mode').prop('disabled', false);


  // Retrieve the progress data for this question to get `lastAnswered`
  var user = firebase.auth().currentUser;
  var userProgressRef = db.collection('users').doc(user.uid)
    .collection('courses').doc(currentCourse)
    .collection('progress').doc(questionId);

  userProgressRef.get().then(progressDoc => {
    var phraseStatus = UIString[interfaceLanguage].newPhrase; // Default if never answered before

    if (progressDoc.exists) {
      var progressData = progressDoc.data();
      if (progressData.lastAnswered) {
        // Calculate time difference for display
        phraseStatus = timeDifference(progressData.lastAnswered, interfaceLanguage);
      }

      // ** NEW: Update Question Stats **
      var timesSeen = (progressData.timesCorrect || 0) + (progressData.timesIncorrect || 0);
      var timesCorrect = progressData.timesCorrect || 0;
      var timesWrong = progressData.timesIncorrect || 0;

      if (timesSeen == 1) {
        $('#once').text(UIString[interfaceLanguage].once);
        $('#once').removeClass('d-none');
        $('#times-seen').addClass('d-none');
        $('#times').addClass('d-none');
      } else {
        $('#once').addClass('d-none');
        $('#times-seen').text(timesSeen);
        $('#times-seen').removeClass('d-none');
        $('#times').removeClass('d-none');
      }
      $('#times-correct').text(timesCorrect);
      $('#times-wrong').text(timesWrong);
      $('#question-stats').show(); // Show the stats section
    } else {

      var timesSeen = 0;
      var timesCorrect = 0;
      var timesWrong = 0;

      // Update HTML with the stats
      $('#once').addClass('d-none');
      $('#times-seen').text(timesSeen);
      $('#times-seen').removeClass('d-none');
      $('#times').removeClass('d-none');
      $('#times-correct').text(timesCorrect);
      $('#times-wrong').text(timesWrong);
      $('#question-stats').show(); // Show the stats section
    }


    // Display the phrase status
    $('#translation').append(` <span class="text-muted">${phraseStatus}</span>`);

    // Display the translations of the missing word in the feedback area
    displayMissingWordTranslations(question.missingWordTranslation);


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
    debugger;
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

    afterAnswerSubmission(isCorrect);
  }

  // Function to display missing word translations
  function displayMissingWordTranslations(translationsArray) {

    // Ensure translationsArray is an array and limit to 3 entries
    const translations = Array.isArray(translationsArray) ? translationsArray.slice(0, 3) : [];

    if (translations.length > 0) {
      // Create a comma-separated string of translations
      const translationsText = translations.join(', ');

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
      'question_type': 'Vocabulary',
      'user_id': uid,
      'answer': isCorrect,
      'course': window.currentCourse,
      'mode': isMultipleChoice ? 'Multiple_Choice' : 'Cloze'
    });

    const questionEndTime = new Date();
    let timeTaken = Math.floor((questionEndTime - questionStartTime) / 1000); // Time in seconds
    timeTaken = Math.min(timeTaken, 30); // Cap the time at 30 seconds


    // Disable the toggle button after submission
    $('#toggle-mode').prop('disabled', true);

    // Replace '_____' with the correct answer in the sentence and style it
    var answerToDisplay = `<span class="correct-answer">${question.missingWord}</span>`;
    var sentenceHTML = question.sentence.replace('___', answerToDisplay);
    $('#sentence').html(sentenceHTML);

    // Feedback to user
    if (isCorrect) {
      // $('#feedback').text('Correct!').removeClass('text-danger').addClass('text-success visible').css('visibility', 'visible');
      $('#feedback').text(UIString[interfaceLanguage].correctExclemation).removeClass('text-danger').addClass('text-success visible').css('visibility', 'visible').css('display', 'block');


    } else {
      let correction = UIString[interfaceLanguage].incorrectPart1 + ' <span class="text-decoration-underline">' +question.missingWord + '</span>.';
      $('#feedback').html(correction).addClass('text-success visible').css('visibility', 'visible').css('display', 'block');
      // $('#feedback').text(`Incorrect. The correct answer was "${question.missingWord}".`).removeClass('text-success').addClass('text-danger visible').css('visibility', 'visible');
    }

    // Update visual stats and progress
    updateVisualStats(isCorrect);
    updateUserProgress(questionId, isCorrect, currentCourse, timeTaken);

    // Hide toggle-mode button and show explain-sentence button after answer is submitted
    $('#toggle-mode').hide();
    $('#explain-sentence-btn').show();

    // Play feedback sound and audio
    playFeedbackSound(isCorrect, () => {
      $('#replay-audio').prop('disabled', false); // Disable and grey out the button
      var completeSentence = question.sentence.replace('___', question.missingWord);
      var targetLanguage = question.language;
      playAudio(questionId, completeSentence, targetLanguage);
    });


  }



  if (isMultipleChoice) {
    // Event listener for multiple-choice option buttons
    $('.option-btn').off('click').on('click', function () {
      const selectedOption = $(this).data('option');
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
    handleDebounce(() => {
      loadQuestion(user, currentCourse);
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
    // Ensure completeSentence and targetLanguage are passed correctly
    var completeSentence = question.sentence.replace('___', question.missingWord);
    var targetLanguage = question.language;
    playAudio(questionId, completeSentence, targetLanguage);
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

  audioElement.onended = function () {
    console.log("Audio playback ended.");
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

  // After feedback sound ends, call the callback to play the full sentence audio
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
function updateUserProgress(questionId, isCorrect, currentCourse, timeTaken) {

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
            timesIncorrectInARow: 0,
            lastAnswered: null,
            nextDue: null,
            initialAppearance: true
          };


          // Get the user's local timezone
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
            $('#scoreTooltip').text(UIString[interfaceLanguage].scoreTooltip + ': ' + dailyScore); // Display the current daily score
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

          // Fetch the current maxFrequency and update if necessary
          return transaction.get(allTimeStatsRef).then(allTimeDoc => {
            var allTimeData = allTimeDoc.exists ? allTimeDoc.data() : {};

            // Ensure maxFrequency is set, even if the document exists but the field is missing
            if (typeof allTimeData.maxFrequency === 'undefined') {
              allTimeData.maxFrequency = 0;
            }
            debugger;
            // Compare question frequency and update if necessary
            if (questionFrequency > allTimeData.maxFrequency) {
              allTimeData.maxFrequency = questionFrequency;
              // updating the global maxFrequency
              maxFrequency = questionFrequency;

              var maxFrequencyPercentage = (questionFrequency / 10000 * 100).toFixed(2) + '%';
              $('#proficiencyLevel').text(maxFrequencyPercentage);
              $('#profTooltip').text(maxFrequencyPercentage + ' ' + UIString[interfaceLanguage].ProficiencyLevel);

            }

            // Write the updated progress and stats back to Firestore
            transaction.set(userProgressRef, data);
            transaction.set(allTimeStatsRef, allTimeData);

            return Promise.resolve(data); // Return updated data
          });
        });
      }).then((data) => {
        console.log('Transaction successful');
        // Now data contains the updated progress data
        // We can call a function to update the coach feedback

        updateCoachFeedback(streakCorrect, streakWrong);
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
  $('#correctTooltip').text(UIString[interfaceLanguage].correctTooltip + ': ' + correctAnswers); // Display the current daily score
  $('#wrongTooltip').text(UIString[interfaceLanguage].wrongTooltip + ': ' + wrongAnswers); // Display the current daily score

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
          vocabulary_correctAnswers: 0,
          vocabulary_wrongAnswers: 0,
          vocabulary_totalDrills: 0,
          vocabulary_score: 0,
          vocabulary_DailyTime: 0, // Initialize DailyTime
          DailyTime: 0 // Initialize DailyTime
        };

        // Ensure all fields are numbers
        dailyData.totalDrills = ensureNumber(dailyData.totalDrills);
        dailyData.score = ensureNumber(dailyData.score);
        dailyData.correctAnswers = ensureNumber(dailyData.correctAnswers);
        dailyData.wrongAnswers = ensureNumber(dailyData.wrongAnswers);
        dailyData.vocabulary_totalDrills = ensureNumber(dailyData.vocabulary_totalDrills);
        dailyData.vocabulary_score = ensureNumber(dailyData.vocabulary_score);
        dailyData.vocabulary_correctAnswers = ensureNumber(dailyData.vocabulary_correctAnswers);
        dailyData.vocabulary_wrongAnswers = ensureNumber(dailyData.vocabulary_wrongAnswers);
        dailyData.DailyTime = ensureNumber(dailyData.DailyTime); // Ensure DailyTime is a number
        dailyData.vocabulary_DailyTime = ensureNumber(dailyData.vocabulary_DailyTime); // Ensure DailyTime is a number


        // Update stats safely
        dailyData.totalDrills += 1;
        dailyData.score += score;
        dailyData.vocabulary_totalDrills += 1;
        dailyData.vocabulary_score += score;
        dailyData.DailyTime += timeTaken; // Add time taken to DailyTime
        dailyData.vocabulary_DailyTime += timeTaken; // Add time taken to DailyTime


        if (isCorrect) {
          dailyData.correctAnswers += 1;
          dailyData.vocabulary_correctAnswers += 1;
        } else {
          dailyData.wrongAnswers += 1;
          dailyData.vocabulary_wrongAnswers += 1;
        }

        // Process all-time stats
        const allTimeData = allTimeDoc.exists ? allTimeDoc.data() : {
          totalCorrectAnswers: 0,
          totalWrongAnswers: 0,
          totalDrills: 0,
          totalScore: 0,
          vocabulary_totalCorrectAnswers: 0,
          vocabulary_totalWrongAnswers: 0,
          vocabulary_totalDrills: 0,
          vocabulary_totalScore: 0,
          vocabulary_TimeSpent: 0, // Initialize TimeSpent
          TimeSpent: 0 // Initialize TimeSpent

        };

        // Ensure all fields are numbers
        allTimeData.totalDrills = ensureNumber(allTimeData.totalDrills);
        allTimeData.totalScore = ensureNumber(allTimeData.totalScore);
        allTimeData.totalCorrectAnswers = ensureNumber(allTimeData.totalCorrectAnswers);
        allTimeData.totalWrongAnswers = ensureNumber(allTimeData.totalWrongAnswers);
        allTimeData.vocabulary_totalDrills = ensureNumber(allTimeData.vocabulary_totalDrills);
        allTimeData.vocabulary_totalScore = ensureNumber(allTimeData.vocabulary_totalScore);
        allTimeData.vocabulary_totalCorrectAnswers = ensureNumber(allTimeData.vocabulary_totalCorrectAnswers);
        allTimeData.vocabulary_totalWrongAnswers = ensureNumber(allTimeData.vocabulary_totalWrongAnswers);
        allTimeData.TimeSpent = ensureNumber(allTimeData.TimeSpent); // Ensure TimeSpent is a number
        allTimeData.vocabulary_TimeSpent = ensureNumber(allTimeData.vocabulary_TimeSpent); // Ensure TimeSpent is a number


        // Update stats safely
        allTimeData.totalDrills += 1;
        allTimeData.totalScore += score;
        allTimeData.vocabulary_totalDrills += 1;
        allTimeData.vocabulary_totalScore += score;
        allTimeData.TimeSpent += timeTaken; // Add time taken to TimeSpent
        allTimeData.vocabulary_TimeSpent += timeTaken; // Add time taken to TimeSpent

        if (isCorrect) {
          allTimeData.totalCorrectAnswers += 1;
          allTimeData.vocabulary_totalCorrectAnswers += 1;
        } else {
          allTimeData.totalWrongAnswers += 1;
          allTimeData.vocabulary_totalWrongAnswers += 1;
        }

        checkAndHandleLevelUps(allTimeData, dailyData);


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
function timeDifference(lastAnswered, interfaceLanguage = 'en') {
  debugger;
  if (!lastAnswered) {
    return UIString[interfaceLanguage].newPhrase || "(new phrase)";
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

  let value, unitKey;

  if (years > 0) {
    value = years;
    unitKey = years > 1 ? 'years' : 'year';
  } else if (months > 0) {
    value = months;
    unitKey = months > 1 ? 'months' : 'month';
  } else if (weeks > 0) {
    value = weeks;
    unitKey = weeks > 1 ? 'weeks' : 'week';
  } else if (days > 0) {
    value = days;
    unitKey = days > 1 ? 'days' : 'day';
  } else if (hours > 0) {
    value = hours;
    unitKey = hours > 1 ? 'hours' : 'hour';
  } else if (minutes > 0) {
    value = minutes;
    unitKey = minutes > 1 ? 'minutes' : 'minute';
  } else {
    return UIString[interfaceLanguage].newPhrase || "(new phrase)";
  }

  return '(' + localize('shownLast', interfaceLanguage, value, UIString[interfaceLanguage][unitKey]) + ')';
}

function buttonClick(which) {
  if (which === 'stats') {
    window.location.href = 'stats.html';
  }
}

async function generateExplanation(questionId, fullSentence, missingWord, targetLanguage, userLanguage) {
  try {
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
        grammar: false
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
  // $('#explanationModalLabel').html(`Sentence Explanation: "${window.currentQuestionData.sentence}"`);
  $('#explanationModalLabel').html(`${UIString[interfaceLanguage].lessonExplanation}: "${window.currentQuestionData.sentence}"`);


  // Build the explanation HTML with classes for styling
  let explanationHtml = '<div class="general-explanation"><h2>' + UIString[interfaceLanguage].generalExplanation + ':</h2>';

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
     <h2 class="missing-word-title">${UIString[interfaceLanguage].theMissingWord}: ${window.currentQuestionData.missingWord}</h2>

      <p>${parsedExplanation.focus_word_explanation}</p>
    </div>`;

  // Populate the modal content with the final explanation
  $('#explanation-content').html(explanationHtml);

  gtag('event', 'Explain Answer', {
    'question_type': 'Vocabulary',
    'user_id': uid,
    'course': window.currentCourse
  });

  // Show the modal
  $('#explanationModal').modal('show');
}




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
      const explanation = await generateExplanation(window.currentQuestionId, window.currentQuestionData.sentence, window.currentQuestionData.missingWord, window.currentQuestionData.language, window.currentCourse.split('-')[0]);

      console.log('Generated explanation:', explanation);

      if (!explanation || typeof explanation !== 'object' || Object.keys(explanation).length === 0) {
        throw new Error('Explanation generation failed or returned empty.');
      }

      // Save the explanation to Firestore
      // await db.collection('questions').doc(window.currentQuestionId).update({ explanation });

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
  $('#helpModal').modal('show'); // Show the report modal
});

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
      questionType: "vocabulary",
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
    populateSubLevelBadge(userData)
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

async function fetchMaxFrequency(user, currentCourse) {
  try {

    const allTimeDocRef = db
      .collection('users')
      .doc(user.uid)
      .collection('courses')
      .doc(currentCourse)
      .collection('stats')
      .doc('all-time');

    const allTimeDoc = await allTimeDocRef.get();

    if (allTimeDoc.exists) {
      const data = allTimeDoc.data();
      maxFrequency = data.maxFrequency || 0;
      console.log(`Max Frequency for course ${currentCourse}: ${maxFrequency}`);
    } else {
      console.warn(`All-time document does not exist for course ${currentCourse}. Initializing maxFrequency to 0.`);
      maxFrequency = 0;
      // Initialize the all-time document if it doesn't exist
      await allTimeDocRef.set({ maxFrequency: 0 }, { merge: true });
    }
  } catch (error) {
    console.error('Error fetching maxFrequency:', error);
  }
}

/**
 * Updates the maxFrequency in Firestore and the global variable.
 *
 * @param {Object} user - The authenticated user object.
 * @param {string} currentCourse - The identifier for the current course.
 * @param {number} newMaxFrequency - The new maxFrequency value to set.
 */
async function updateMaxFrequency(user, currentCourse, newMaxFrequency) {
  try {
    const allTimeDocRef = db
      .collection('users')
      .doc(user.uid)
      .collection('courses')
      .doc(currentCourse)
      .collection('stats')
      .doc('all-time');

    // Update Firestore
    await allTimeDocRef.set({ maxFrequency: newMaxFrequency }, { merge: true });

    // Update the global variable
    maxFrequency = newMaxFrequency;
    console.log(`maxFrequency updated to ${maxFrequency} for course ${currentCourse}`);

  } catch (error) {
    console.error('Error updating maxFrequency:', error);
  }
}

async function fetchCurrentLevel(user, theCourse) {
  debugger;
  let currentLevel = 1;
  const allTimeStatsRef = db
    .collection('users')
    .doc(user.uid)
    .collection('courses')
    .doc(theCourse)
    .collection('stats')
    .doc('all-time');

  const snapshot = await allTimeStatsRef.get();
  if (!snapshot.exists) {
    currentLevel = 1;
  }
  const data = snapshot.data();
  if (!data.currentLevel) {
    currentLevel = 1;
  } else {
    currentLevel = data.currentLevel;
  }
  console.log("Current level is:", currentLevel);
  return currentLevel;
}

function checkAndHandleLevelUps(allTimeData, dailyData) {
  // 1) We need the user’s totalCorrectAnswers
  debugger;
  const totalCorrect = allTimeData.totalCorrectAnswers || 0;

  // 2) Compare with your LEVELS_LIST to see which level the user belongs to.
  // We'll find the highest level whose correctDrillsRequired <= totalCorrect
  let newLevel = 1;
  for (let i = 0; i < LEVELS_LIST.length; i++) {
    if (totalCorrect >= LEVELS_LIST[i].correctDrillsRequired) {
      newLevel = LEVELS_LIST[i].level;
    } else {
      break;
    }
  }

  // 3) Compare newLevel with the user’s old level
  const oldLevel = userCurrentLevel || 1;
  if (newLevel > oldLevel) {
    // user has advanced one or multiple levels

    // 3a) store all newly passed levels in today's doc
    // e.g. if user was level 2 and jumped to level 4, then user passed levels 3 and 4
    let passedLevels = [];
    for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
      passedLevels.push(lvl);
    }

    dailyData.levelsPassed = dailyData.levelsPassed || [];
    passedLevels.forEach(level => {
      if (!dailyData.levelsPassed.includes(level)) {
        dailyData.levelsPassed.push(level);
      }
    });

    // 3b) set allTimeData.currentLevel = newLevel
    allTimeData.currentLevel = newLevel;

    // 3c) show "Congrats new level" UI:
    // example: show a bootstrap modal or a banner
    // We'll just do something quick:
    showLevelCongratsPopup(newLevel);

    // 3d) also update window.userCurrentLevel so we don't keep re-triggering next time
    userCurrentLevel = newLevel;
  }
}

function showLevelCongratsPopup(newLevel) {
  // find the level object
  const found = LEVELS_LIST.find(obj => obj.level === newLevel);
  if (!found) return;
  
  // e.g. fill a hidden div
  const name = found.name;
  const lvlStr = UIString[interfaceLanguage].youUnlocked + " " + name;
  $('#newLevelNum').text(newLevel);
  
  $('#levelUpMessage').text(lvlStr);
  $('#congratsModal').modal('show'); // or your own logic
}

function continuePracticing() {
  $('#congratsModal').modal('hide');
}

function quit() {
  $('#congratsModal').modal('hide');
  window.location.href = '/course_selection.html';
}

function modifyInterfaceLanguage() {

  if (UIString[interfaceLanguage]) {
    const lang = UIString[interfaceLanguage];

    // Update all elements with data-i18n attribute (text content)
    $('[data-i18n]').each(function () {
      const key = $(this).data('i18n');
      if (key.includes('.')) {
        // Handle nested keys e.g. 'RecommendationNames.Basics'
        const keys = key.split('.');
        let text = lang;
        keys.forEach(k => {
          text = text[k] || '';
        });
        $(this).text(text);
      } else {
        // Direct key in the UIString
        if (lang[key] !== undefined) {
          $(this).text(lang[key]);
        }
      }
    });

    // Update elements with data-i18n-alt (for alt attributes)
    $('[data-i18n-alt]').each(function () {
      const key = $(this).data('i18n-alt');
      if (lang[key] !== undefined) {
        $(this).attr('alt', lang[key]);
      }
    });

    // Update elements with data-i18n-title (for title attributes)
    $('[data-i18n-title]').each(function () {
      const key = $(this).data('i18n-title');
      if (lang[key] !== undefined) {
        $(this).attr('title', lang[key]);
      }
    });

    // Update elements with data-i18n-placeholder (for placeholders)
    $('[data-i18n-placeholder]').each(function () {
      const key = $(this).data('i18n-placeholder');
      if (lang[key] !== undefined) {
        $(this).attr('placeholder', lang[key]);
      }
    });




  }
}
function localize(key, language, ...args) {
  let template = UIString[language][key];
  
  if (!template) {
    console.warn(`Missing translation for key: ${key} in language: ${language}`);
    // Fallback to English if translation is missing
    template = UIString['en'][key] || key;
  }
  
  return template.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] !== 'undefined' ? args[number] : match;
  });
}