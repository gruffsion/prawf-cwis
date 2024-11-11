document.addEventListener("DOMContentLoaded", () => {
    const dateSelect = document.getElementById("date-select");
    const questionContainer = document.getElementById("question-container");
    const nextButton = document.getElementById("next-question");
    const languageSelect = document.getElementById("language-select");
    const selectDateLabel = document.getElementById("select-date-label");
    const quizTitle = document.getElementById("quiz-title");

    let quizData = {};
    let translations = {};
    let currentLanguage = "en";
    let questions = [];
    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    let answeredQuestions = new Set();
    let answerSelected = false;

    // Load JSON data for quiz and translations
    async function loadData() {
        try {
            const [quizResponse, translationResponse] = await Promise.all([
                fetch("questions-data.json"), 
                fetch("translations.json")
            ]);
            quizData = await quizResponse.json();
            translations = await translationResponse.json();
            updateUIText(); // Set initial language
        } catch (error) {
            console.error("Error loading JSON data:", error);
        }
    }

    // Update all UI text based on the selected language
    function updateUIText() {
        quizTitle.textContent = translations[currentLanguage].quizTitle;
        selectDateLabel.textContent = translations[currentLanguage].selectDate;
        nextButton.textContent = translations[currentLanguage].nextQuestion;
    }

    // Display the current question
    function displayCurrentQuestion() {
        questionContainer.innerHTML = ""; // Clear the container
        const questionData = questions[currentQuestionIndex];

        if (questionData) {
            const questionCard = document.createElement("div");
            questionCard.className = "question-card";

            // Display question text
            const questionElement = document.createElement("p");
            questionElement.className = "question";
            questionElement.textContent = `${questionData.question}`;
            questionCard.appendChild(questionElement);

            // Display options with clickable areas
            ["option 1", "option 2", "option 3"].forEach(option => {
                const optionContainer = document.createElement("div");
                optionContainer.className = "option-container";
                optionContainer.dataset.option = option;

                const label = document.createElement("label");
                label.textContent = questionData[option];

                optionContainer.appendChild(label);
                questionCard.appendChild(optionContainer);

                // Click event on the option container
                optionContainer.addEventListener("click", () => handleAnswerClick(optionContainer, questionData));
            });

            questionContainer.appendChild(questionCard);
        }

        // Disable "Next" button until an answer is selected
        nextButton.disabled = true;
        answerSelected = false;

        // Update "Next" button text if on the last question
        if (currentQuestionIndex === questions.length - 1) {
            nextButton.textContent = translations[currentLanguage].seeScore || "See Score";
        } else {
            nextButton.textContent = translations[currentLanguage].nextQuestion;
        }
    }

    // Handle answer click, check if it's correct, and provide feedback
    function handleAnswerClick(optionContainer, questionData) {
        const selectedOption = optionContainer.dataset.option;

        if (!answeredQuestions.has(currentQuestionIndex)) {
            answeredQuestions.add(currentQuestionIndex);

            if (selectedOption === questionData.correct) {
                optionContainer.classList.add("correct");
                correctAnswers++;
            } else {
                optionContainer.classList.add("incorrect");

                Array.from(optionContainer.parentNode.children).forEach(child => {
                    if (child.dataset.option === questionData.correct) {
                        child.classList.add("correct");
                    }
                });
            }

            const explanation = document.createElement("p");
            explanation.className = "explanation";
            explanation.textContent = `${questionData.explanation}`;
            optionContainer.parentNode.appendChild(explanation);

            // Enable "Next" button once an answer is selected
            nextButton.disabled = false;
            answerSelected = true;

            // Show score immediately after answering last question
            if (answeredQuestions.size === questions.length) {
                setTimeout(showScore, 1000);
            }
        }
    }

    // Show the final score with language-specific text
    function showScore() {
        questionContainer.innerHTML = ""; // Clear the container
        const scoreElement = document.createElement("div");
        scoreElement.className = "score-display";
        scoreElement.innerHTML = `
            <h2>${translations[currentLanguage].quizCompleted}</h2>
            <p>${translations[currentLanguage].yourScore.replace("${correctAnswers}", correctAnswers).replace("${totalQuestions}", questions.length)}</p>
        `;
        nextButton.style.display = "none";
        dateSelect.style.display = "block";
        selectDateLabel.style.display = "block"; // Show date selector on score screen
        questionContainer.appendChild(scoreElement);
    }

    // Load questions for the selected date
    function loadQuestionsForDate(month, day) {
        questions = quizData.Dalen1.filter(
            item => item.month === month && item.date === day
        );
        currentQuestionIndex = 0;
        correctAnswers = 0;
        answeredQuestions.clear();
        
        if (questions.length > 0) {
            dateSelect.style.display = "none"; // Hide date selector when quiz starts
            selectDateLabel.style.display = "none";
            displayCurrentQuestion();
            nextButton.style.display = "inline-block";
        } else {
            questionContainer.innerHTML = `<p>${translations[currentLanguage].noQuizAvailable}</p>`;
            nextButton.style.display = "none";
            selectDateLabel.style.display = "block"; // Show date selector if no quiz available
            dateSelect.style.display = "block"; // Show date selector if no quiz available
        }
    }

    // Event listener for Next button to go to the next question or show score
    nextButton.addEventListener("click", () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayCurrentQuestion();
        } else if (answerSelected) { // Show score only if answer is selected
            showScore();
        }
    });

    // Language switcher event
    languageSelect.addEventListener("change", (event) => {
        currentLanguage = event.target.value;
        updateUIText(); // Update UI text immediately
    });

    // Date selection event
    dateSelect.addEventListener("change", () => {
        const selectedDate = new Date(dateSelect.value);
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();
        loadQuestionsForDate(month, day);
    });

    loadData(); 
});
