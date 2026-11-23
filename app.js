let allQuestions = [];
let currentRoundQuestions = [];
let currentIndex = 0;
let score = 0;
const QUESTIONS_PER_ROUND = 10; // Количество вопросов за один раунд

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
        document.getElementById('question').innerText = "Не удалось загрузить questions.json. Запустите сайт через локальный сервер (например, Live Server в VS Code), а не двойным кликом по файлу.";
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

// Запуск нового раунда
function startNewRound() {
    currentIndex = 0;
    score = 0;
    
    // Перемешиваем всю базу и берем первые N вопросов
    currentRoundQuestions = shuffle(allQuestions).slice(0, QUESTIONS_PER_ROUND);
    
    document.getElementById('quiz-box').classList.remove('hidden');
    document.getElementById('result-box').classList.add('hidden');
    renderQuestion();
}

// Отрисовка текущего вопроса и кнопок ответов
function renderQuestion() {
    const qData = currentRoundQuestions[currentIndex];
    document.getElementById('progress').innerText = `Вопрос ${currentIndex + 1} из ${currentRoundQuestions.length}`;
    document.getElementById('question').innerText = qData.q;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    qData.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(idx);
        optionsDiv.appendChild(btn);
    });
}

// Проверка ответа и переход к следующему вопросу
function handleAnswer(selectedIdx) {
    const correctIdx = currentRoundQuestions[currentIndex].answer;
    const buttons = document.querySelectorAll('#options .btn');
    
    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === correctIdx) {
            btn.style.background = '#166534'; // Спокойный темно-зеленый
            btn.style.borderColor = '#22c55e';
        }
        if (idx === selectedIdx && idx !== correctIdx) {
            btn.style.background = '#991b1b'; // Спокойный темно-красный
            btn.style.borderColor = '#ef4444';
        }
    });

    if (selectedIdx === correctIdx) {
        score++;
    }

    // Пауза 800 мс, чтобы игрок увидел правильный вариант
    setTimeout(() => {
        currentIndex++;
        if (currentIndex < currentRoundQuestions.length) {
            renderQuestion();
        } else {
            showResults();
        }
    }, 800);
}

// Показ финального экрана с результатами
function showResults() {
    document.getElementById('quiz-box').classList.add('hidden');
    document.getElementById('result-box').classList.remove('hidden');
    document.getElementById('score-text').innerText = `Ваш результат: ${score} из ${currentRoundQuestions.length}!`;
}

// Старт при загрузке скрипта
loadQuestions();
