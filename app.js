let allQuestions = [];
let currentRoundQuestions = [];
let currentIndex = 0;
let score = 0;
let currentCorrectText = "";
const QUESTIONS_PER_ROUND = 10;
const STORAGE_KEY = 'quiz2000_played_texts_v2'; // Новый ключ для чистой истории

// Загружаем базу и удаляем возможные дубликаты по тексту вопроса
async function loadQuestions() {
    try {
        // Добавляем ?v=timestamp, чтобы браузер не брал старый кэш файла
        const response = await fetch('questions.json?v=' + Date.now());
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        const rawData = await response.json();
        
        // Фильтруем дубликаты, если в JSON вдруг попались одинаковые вопросы
        const seenTexts = new Set();
        allQuestions = rawData.filter(item => {
            const normalized = item.q.trim().toLowerCase();
            if (seenTexts.has(normalized)) return false;
            seenTexts.add(normalized);
            return true;
        });

        document.getElementById('total-db-count').innerText = allQuestions.length;
        startNewRound();
    } catch (error) {
        console.error(error);
        document.getElementById('progress').innerText = "Ошибка подключения";
        document.getElementById('question').innerText = "Не удалось загрузить questions.json.";
    }
}

function shuffle(array) {
    let copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function getPlayedTexts() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function savePlayedTexts(textsArray) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(textsArray));
    } catch (e) {
        console.warn("localStorage недоступен", e);
    }
}

function startNewRound() {
    currentIndex = 0;
    score = 0;

    let playedTexts = getPlayedTexts();
    
    // Оставляем только те вопросы, текста которых еще НЕТ в списке сыгранных
    let availableQuestions = allQuestions.filter(item => !playedTexts.includes(item.q));

    // Если несыгранных вопросов меньше 10 (или 0) — сбрасываем историю, чтобы раунд всегда был полным
    if (availableQuestions.length === 0) {
        playedTexts = [];
        savePlayedTexts([]);
        availableQuestions = [...allQuestions];
    }

    // Перемешиваем доступные вопросы и берем ровно 10 (или остаток до конца базы)
    currentRoundQuestions = shuffle(availableQuestions).slice(0, QUESTIONS_PER_ROUND);

    document.getElementById('quiz-box').classList.remove('hidden');
    document.getElementById('result-box').classList.add('hidden');
    renderQuestion();
}

function renderQuestion() {
    const qData = currentRoundQuestions[currentIndex];
    const playedCount = getPlayedTexts().length;
    
    document.getElementById('progress').innerText = 
        `Вопрос ${currentIndex + 1} из ${currentRoundQuestions.length} (Пройдено: ${playedCount}/${allQuestions.length})`;
    
    document.getElementById('question').innerText = qData.q;
    currentCorrectText = qData.options[qData.answer];
    
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

function handleAnswer(selectedText, clickedBtn) {
    const currentQuestionObj = currentRoundQuestions[currentIndex];
    
    // Сразу записываем этот вопрос в историю пройденных
    const playedTexts = getPlayedTexts();
    if (!playedTexts.includes(currentQuestionObj.q)) {
        playedTexts.push(currentQuestionObj.q);
        savePlayedTexts(playedTexts);
    }

    const buttons = document.querySelectorAll('#options .btn');
    buttons.forEach((btn) => {
        btn.disabled = true;
        if (btn.innerText === currentCorrectText) {
            btn.style.background = '#166534';
            btn.style.borderColor = '#22c55e';
        }
        if (btn === clickedBtn && selectedText !== currentCorrectText) {
            btn.style.background = '#991b1b';
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

function showResults() {
    document.getElementById('quiz-box').classList.add('hidden');
    document.getElementById('result-box').classList.remove('hidden');
    
    const playedCount = getPlayedTexts().length;
    const remaining = allQuestions.length - playedCount;
    
    const extraText = remaining === 0 
        ? " Вы прошли все вопросы в базе! Следующая игра начнет новый круг." 
        : ` Осталось новых вопросов в базе: ${remaining}.`;

    document.getElementById('score-text').innerText = 
        `Ваш результат: ${score} из ${currentRoundQuestions.length}!${extraText}`;
}

loadQuestions();

