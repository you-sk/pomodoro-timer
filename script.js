// 初期タスクリスト
let tasks = [
    { name: '作業時間', duration: 25, unit: 'minutes' },
    { name: '休憩時間', duration: 5, unit: 'minutes' },
    { name: '長い休憩', duration: 15, unit: 'minutes' }
];

let timer = null;
let timeLeft = 0;
let isRunning = false;
let currentTaskIndex = 0;
let completedCycles = 0;
let loopType = 'infinite';
let loopCount = 4;
let soundEnabled = true;

// DOM要素の取得
const timerDisplay = document.getElementById('timerDisplay');
const status = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const currentTaskIndexDisplay = document.getElementById('currentTaskIndex');
const totalTasksDisplay = document.getElementById('totalTasks');
const completedCyclesDisplay = document.getElementById('completedCycles');
const totalCyclesDisplay = document.getElementById('totalCycles');
const taskListContainer = document.getElementById('taskList');
const container = document.querySelector('.container');
const loopCountInput = document.getElementById('loopCount');
const soundToggle = document.getElementById('soundToggle');

// 音声通知用
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playNotificationSound() {
    if (!soundEnabled) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function getTaskDurationInSeconds(task) {
    return task.unit === 'minutes' ? task.duration * 60 : task.duration;
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateStatus() {
    const currentTask = tasks[currentTaskIndex];
    status.textContent = currentTask.name;
    currentTaskIndexDisplay.textContent = currentTaskIndex + 1;
    totalTasksDisplay.textContent = tasks.length;

    // 作業/休憩モードの背景色切り替え
    if (currentTask.name.includes('休憩')) {
        container.classList.remove('work-mode');
        container.classList.add('break-mode');
    } else {
        container.classList.remove('break-mode');
        container.classList.add('work-mode');
    }
}

function updateCycleDisplay() {
    completedCyclesDisplay.textContent = completedCycles;
    if (loopType === 'count') {
        totalCyclesDisplay.textContent = `/${loopCount}`;
    } else {
        totalCyclesDisplay.textContent = '';
    }
}

function renderTaskList() {
    taskListContainer.innerHTML = '';
    tasks.forEach((task, index) => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        if (index === currentTaskIndex && isRunning) {
            taskItem.classList.add('active');
        }

        taskItem.innerHTML = `
            <div class="task-name">${task.name}</div>
            <div class="task-duration">
                <input type="number" value="${task.duration}" min="1" data-index="${index}" class="duration-edit" ${isRunning || startBtn.textContent === '再開' ? 'disabled' : ''}>
                <select data-index="${index}" class="unit-edit" ${isRunning || startBtn.textContent === '再開' ? 'disabled' : ''}>
                    <option value="minutes" ${task.unit === 'minutes' ? 'selected' : ''}>分</option>
                    <option value="seconds" ${task.unit === 'seconds' ? 'selected' : ''}>秒</option>
                </select>
            </div>
            <button class="delete-task-btn" data-index="${index}" ${startBtn.textContent !== '開始' ? 'disabled' : ''}>削除</button>
        `;

        taskListContainer.appendChild(taskItem);
    });

    totalTasksDisplay.textContent = tasks.length;
}

function nextTask() {
    currentTaskIndex++;

    if (currentTaskIndex >= tasks.length) {
        currentTaskIndex = 0;
        completedCycles++;
        updateCycleDisplay();

        if (loopType === 'count' && completedCycles >= loopCount) {
            isRunning = false;
            startBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'none';
            startBtn.textContent = '開始';
            alert('指定されたサイクル数を完了しました！');
            updateControlsState();
            return;
        }
    }

    timeLeft = getTaskDurationInSeconds(tasks[currentTaskIndex]);
    updateStatus();
    updateDisplay();
    renderTaskList();

    isRunning = false;
    startTimer();
}

function updateControlsState() {
    document.getElementById('infiniteLoop').disabled = isRunning;
    document.getElementById('countLoop').disabled = isRunning;
    loopCountInput.disabled = isRunning || loopType === 'infinite';
    renderTaskList();
}

function startTimer(playSound = false) {
    if (!isRunning && tasks.length > 0) {
        isRunning = true;
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';

        if (timeLeft === 0) {
            timeLeft = getTaskDurationInSeconds(tasks[currentTaskIndex]);
        }

        renderTaskList();
        updateControlsState();

        if (playSound) {
            playNotificationSound();
        }

        timer = setInterval(() => {
            timeLeft--;
            updateDisplay();

            if (timeLeft <= 0) {
                clearInterval(timer);
                playNotificationSound();
                setTimeout(nextTask, 1000);
            }
        }, 1000);
    }
}

function pauseTimer() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timer);
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
        startBtn.textContent = '再開';
        updateControlsState();
    }
}

function resetTimer() {
    isRunning = false;
    clearInterval(timer);
    currentTaskIndex = 0;
    completedCycles = 0;
    timeLeft = tasks.length > 0 ? getTaskDurationInSeconds(tasks[0]) : 0;
    updateDisplay();
    updateStatus();
    updateCycleDisplay();
    renderTaskList();
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
    startBtn.textContent = '開始';
    updateControlsState();
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    startBtn.addEventListener('click', () => {
        const isInitialStart = startBtn.textContent === '開始';
        startTimer(isInitialStart);
    });

    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    // ループ設定
    document.querySelectorAll('input[name="loopType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            loopType = e.target.value;
            loopCountInput.disabled = loopType === 'infinite';
            updateCycleDisplay();
        });
    });

    loopCountInput.addEventListener('change', (e) => {
        loopCount = parseInt(e.target.value) || 1;
        updateCycleDisplay();
    });

    // タスク追加
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        const name = document.getElementById('newTaskName').value.trim();
        const duration = parseInt(document.getElementById('newTaskDuration').value) || 1;
        const unit = document.getElementById('newTaskUnit').value;

        if (name) {
            tasks.push({ name, duration, unit });
            renderTaskList();
            document.getElementById('newTaskName').value = '';

            if (tasks.length === 1 && !isRunning) {
                resetTimer();
            }
        }
    });

    // タスクリストのイベント委譲
    taskListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-task-btn')) {
            const index = parseInt(e.target.dataset.index);
            if (tasks.length > 1) {
                tasks.splice(index, 1);
                if (currentTaskIndex >= tasks.length) {
                    currentTaskIndex = 0;
                }
                if (!isRunning) {
                    resetTimer();
                } else {
                    renderTaskList();
                    updateStatus();
                }
            } else {
                alert('最低1つのタスクが必要です');
            }
        }
    });

    taskListContainer.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);

        if (e.target.classList.contains('duration-edit')) {
            tasks[index].duration = parseInt(e.target.value) || 1;
            if (!isRunning && index === currentTaskIndex) {
                timeLeft = getTaskDurationInSeconds(tasks[index]);
                updateDisplay();
            }
        } else if (e.target.classList.contains('unit-edit')) {
            tasks[index].unit = e.target.value;
            if (!isRunning && index === currentTaskIndex) {
                timeLeft = getTaskDurationInSeconds(tasks[index]);
                updateDisplay();
            }
        }
    });

    // サウンドのON/OFF切り替え
    soundToggle.addEventListener('change', (e) => {
        soundEnabled = e.target.checked;
    });

    // 初期化
    resetTimer();
    renderTaskList();
});