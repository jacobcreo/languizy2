document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const num1El = document.getElementById('num1');
    const operatorEl = document.getElementById('operator');
    const num2El = document.getElementById('num2');
    const num3El = document.getElementById('num3');
    const answerInput = document.getElementById('answer');
    const submitBtn = document.getElementById('submitBtn');
    const hintBtn = document.getElementById('hintBtn');
    const feedbackEl = document.getElementById('feedback');
    const hintContainer = document.getElementById('hint-container');
    const pointLabelsContainer = document.getElementById('point-labels-container');
    const lengthLabelsContainer = document.getElementById('length-labels-container');
    const segment1El = document.getElementById('segment1');
    const segment2El = document.getElementById('segment2');

    // State Variables
    let correctAnswer = 0;
    let successStreak = 0;
    const streakForHarder = 4;
    let currentExercise = {};
    const funFeedback = [ "כל הכבוד!", "מעולה!", "עבודה נהדרת!", "בדיוק!", "אתה אלוף!", "את אלופה!", "פנטסטי!" ];

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateExercise() {
        feedbackEl.textContent = '';
        feedbackEl.className = 'feedback';
        answerInput.value = '';
        hintContainer.style.display = 'none';
        answerInput.focus();

        const isAddition = Math.random() > 0.5;
        let a, b, c;
        let robotPosition = (successStreak < streakForHarder) ? 2 : getRandomInt(0, 2);

        if (isAddition) {
            a = getRandomInt(1, 18);
            b = getRandomInt(1, 19 - a);
            c = a + b;
            operatorEl.textContent = '+';
        } else {
            a = getRandomInt(3, 20);
            b = getRandomInt(1, a - 1);
            c = a - b;
            operatorEl.textContent = '−';
        }

        if (!isAddition && robotPosition === 0) { robotPosition = 2; }

        currentExercise = { a, b, c, isAddition, robotPosition };

        switch (robotPosition) {
            case 0: num1El.textContent = '🤖'; num2El.textContent = b; num3El.textContent = c; correctAnswer = a; break;
            case 1: num1El.textContent = a; num2El.textContent = '🤖'; num3El.textContent = c; correctAnswer = b; break;
            default: num1El.textContent = a; num2El.textContent = b; num3El.textContent = '🤖'; correctAnswer = c; break;
        }
    }

    function checkAnswer() {
        const userAnswer = parseInt(answerInput.value);
        if (isNaN(userAnswer)) return;

        if (userAnswer === correctAnswer) {
            feedbackEl.textContent = funFeedback[getRandomInt(0, funFeedback.length - 1)];
            feedbackEl.className = 'feedback correct';
            successStreak++;
            setTimeout(generateExercise, 1200);
        } else {
            feedbackEl.textContent = 'אופס, נסה שוב!';
            feedbackEl.className = 'feedback incorrect';
            successStreak = 0;
            answerInput.select();
        }
    }

    function createPointLabel(number, percent) {
        const label = document.createElement('div');
        label.textContent = number;
        label.className = 'point-label';
        label.style.left = `${percent}%`;
        pointLabelsContainer.appendChild(label);
    }

    function createLengthLabel(number, startPercent, widthPercent) {
        const label = document.createElement('div');
        label.textContent = number;
        label.className = 'length-label';
        label.style.left = `calc(${startPercent}% + ${widthPercent / 2}%)`;
        lengthLabelsContainer.appendChild(label);
    }

    function showHint() {
        hintContainer.style.display = 'block';
        pointLabelsContainer.innerHTML = '';
        lengthLabelsContainer.innerHTML = '';
        const { a, b, c, isAddition, robotPosition } = currentExercise;
        const percent = val => (val / 20) * 100;

        // Reset segments
        segment1El.style.left = '0%';
        segment2El.style.left = '0%';

        if (isAddition) {
            if (robotPosition === 2) { // a + b = 🤖
                segment1El.style.width = percent(a) + '%';
                segment2El.style.left = percent(a) + '%';
                segment2El.style.width = percent(b) + '%';
                createPointLabel(a, percent(a));
                createLengthLabel(b, percent(a), percent(b));
            } else { // a + 🤖 = c
                segment1El.style.width = percent(a) + '%';
                segment2El.style.left = percent(a) + '%';
                segment2El.style.width = percent(c - a) + '%';
                createPointLabel(a, percent(a));
                createPointLabel(c, percent(c));
            }
        } else { // Subtraction
            if (robotPosition === 2) { // a - b = 🤖 (e.g., 14 - 4 = 10)
                segment1El.style.width = percent(c) + '%'; // result part
                segment2El.style.left = percent(c) + '%';
                segment2El.style.width = percent(b) + '%'; // subtracted part
                createPointLabel(a, percent(a));
                createLengthLabel(b, percent(c), percent(b));
            } else { // a - 🤖 = c (e.g., 14 - 🤖 = 10)
                segment1El.style.width = percent(c) + '%'; // result part
                segment2El.style.left = percent(c) + '%';
                segment2El.style.width = percent(a - c) + '%'; // subtracted part
                createPointLabel(c, percent(c));
                createPointLabel(a, percent(a));
            }
        }
    }

    submitBtn.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    hintBtn.addEventListener('click', showHint);

    generateExercise();
});