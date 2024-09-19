// populateFirestore.js

const admin = require('firebase-admin');

// Replace with the path to your service account key JSON file
const serviceAccount = require('/Users/kobyofek/Development/languizy2/serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function populateDatabase() {
  try {
    const questions = [
      {
        sentence: 'Ich hatte noch nie einen echten ____ gesehen.',
        translation: 'I had never seen a real elephant.',
        missingWord: 'Elefanten',
        missingWordTranslation: ['elephant'],
        language: 'de',
        knownLanguage: 'en'
      },
      {
        sentence: 'Das ____ ist sehr weit entfernt.',
        translation: 'The airport is very far away.',
        missingWord: 'Flughafen',
        missingWordTranslation: ['airport'],
        language: 'de',
        knownLanguage: 'en'
      },
      {
        sentence: 'Ich habe mein ____ vergessen.',
        translation: 'I forgot my umbrella.',
        missingWord: 'Regenschirm',
        missingWordTranslation: ['umbrella'],
        language: 'de',
        knownLanguage: 'en'
      },
      {
        sentence: 'Er hat das ____ auf den Tisch gelegt.',
        translation: 'He placed the book on the table.',
        missingWord: 'Buch',
        missingWordTranslation: ['book'],
        language: 'de',
        knownLanguage: 'en'
      },
      {
        sentence: 'Das ____ ist im Park.',
        translation: 'The dog is in the park.',
        missingWord: 'Hund',
        missingWordTranslation: ['dog'],
        language: 'de',
        knownLanguage: 'en'
      },
      {
        sentence: 'Ich brauche eine ____ für das Rezept.',
        translation: 'I need a recipe for the recipe.',
        missingWord: 'Zutat',
        missingWordTranslation: ['ingredient'],
        language: 'de',
        knownLanguage: 'en'
      },
      {
        sentence: 'Er fährt mit dem ____ zur Arbeit.',
        translation: 'He commutes to work by bicycle.',
        missingWord: 'Fahrrad',
        missingWordTranslation: ['bicycle'],
        language: 'de',
        knownLanguage: 'en'
      },
      {
        sentence: 'Das ____ war sehr teuer.',
        translation: 'The meal was very expensive.',
        missingWord: 'Essen',
        missingWordTranslation: ['meal'],
        language: 'de',
        knownLanguage: 'en'
      },
      {
        sentence: 'Wir haben das ____ verloren.',
        translation: 'We lost the game.',
        missingWord: 'Spiel',
        missingWordTranslation: ['game'],
        language: 'de',
        knownLanguage: 'en'
      },
      {
        sentence: 'Das ____ im Wald ist alt.',
        translation: 'The house in the forest is old.',
        missingWord: 'Haus',
        missingWordTranslation: ['house'],
        language: 'de',
        knownLanguage: 'en'
      }
    ];

    // Add each question to the "questions" collection
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      await db.collection('questions').add(question);
      console.log(`Question ${i + 1} added successfully!`);
    }
  } catch (error) {
    console.error('Error adding data:', error);
  }
}

populateDatabase();

