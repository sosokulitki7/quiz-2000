let allQuestions = [];
let currentRoundQuestions = [];
let currentIndex = 0;
let score = 0;
let currentCorrectText = ""; // Запоминаем текст правильного ответа
const QUESTIONS_PER_ROUND = 10; // Количество вопросов за один раунд
const STORAGE_KEY = 'quiz2000_used_indices';

// Загружаем базу вопросов при открытии страницы
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        allQuestions = await response.json();
        document.getElementById('total-db-count').innerText = allQuestions.length;
        startNewRound();
    } catch (error) {
        console.error(error);
        document.getElementById('progress').innerText = "Ошибка подключения";
        document.getElementById('question').innerText = "Не удалось загрузить questions.json.";
    }
}

// Алгоритм случайного перемешивания (Фишера — Йетса)
function shuffle(array) {
    let copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function getUsedIndices() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
}

function saveUsedIndices(indices) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(indices));
}

// Запуск нового раунда без повторений вопросов
function startNewRound() {
    currentIndex = 0;
    score = 0;

    let usedIndices = getUsedIndices();
    
    let availableIndices = allQuestions
        .map((_, index) => index)
        .filter(index => !usedIndices.includes(index));

    if (availableIndices.length === 0) {
        usedIndices = [];
        availableIndices = allQuestions.map((_, index) => index);
    }

    const selectedIndices = shuffle(availableIndices).slice(0, QUESTIONS_PER_ROUND);
    saveUsedIndices([...usedIndices, ...selectedIndices]);

    currentRoundQuestions = selectedIndices.map(index => allQuestions[index]);

    document.getElementById('quiz-box').classList.remove('hidden');
    document.getElementById('result-box').classList.add('hidden');
    renderQuestion();
}

// Отрисовка вопроса со случайным порядком вариантов ответа
function renderQuestion() {
    const qData = currentRoundQuestions[currentIndex];
    const usedCount = getUsedIndices().length;
    
    document.getElementById('progress').innerText = 
        `Вопрос ${currentIndex + 1} из ${currentRoundQuestions.length} (Пройдено по базе: ${usedCount}/${allQuestions.length})`;
    
    document.getElementById('question').innerText = qData.q;
    
    // Сохраняем текст правильного ответа ДО перемешивания
    currentCorrectText = qData.options[qData.answer];
    
    // Перемешиваем варианты ответов случайным образом
    const shuffledOptions = shuffle(qData.options);
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    shuffledOptions.forEach((optText) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.innerText = optText;
        btn.onclick = () => handleAnswer(optText, btn);
        optionsDiv.appendChild(btn);
    });
}

// Проверка ответа по тексту кнопки
function handleAnswer(selectedText, clickedBtn) {
    const buttons = document.querySelectorAll('#options .btn');
    
    buttons.forEach((btn) => {
        btn.disabled = true;
        if (btn.innerText === currentCorrectText) {
            btn.style.background = '#166534'; // Зеленый для правильного
            btn.style.borderColor = '#22c55e';
        }
        if (btn === clickedBtn && selectedText !== currentCorrectText) {
            btn.style.background = '#991b1b'; // Красный для ошибки
            btn.style.borderColor = '#ef4444';
        }
    });

    if (selectedText === currentCorrectText) {
        score++;
    }

    setTimeout(() => {
        currentIndex++;
        if (currentIndex < currentRoundQuestions.length) {
            renderQuestion();
        } else {
            showResults();
        }
    }, 800);
}

// Финальный экран раунда
function showResults() {
    document.getElementById('quiz-box').classList.add('hidden');
    document.getElementById('result-box').classList.remove('hidden');
    
    const remaining = allQuestions.length - getUsedIndices().length;
    const extraText = remaining === 0 
        ? " Вы прошли все вопросы в базе! Следующая игра начнет новый круг." 
        : ` Осталось новых вопросов в базе: ${remaining}.`;

    document.getElementById('score-text').innerText = 
        `Ваш результат: ${score} из ${currentRoundQuestions.length}!${extraText}`;
}

loadQuestions();
