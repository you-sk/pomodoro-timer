// DOMのセットアップ
function setupDOM() {
    document.body.innerHTML = `
        <div class="container">
            <div id="timerDisplay">25:00</div>
            <div id="status">作業時間</div>
            <button id="startBtn" style="display: inline-block;">開始</button>
            <button id="pauseBtn" style="display: none;">一時停止</button>
            <button id="resetBtn">リセット</button>
            <span id="currentTaskIndex">1</span>
            <span id="totalTasks">3</span>
            <span id="completedCycles">0</span>
            <span id="totalCycles"></span>
            <div id="taskList"></div>
            <input type="checkbox" id="soundToggle" checked>
            <input type="radio" name="loopType" value="infinite" id="infiniteLoop" checked>
            <input type="radio" name="loopType" value="count" id="countLoop">
            <input type="number" id="loopCount" value="4">
            <input type="text" id="newTaskName" value="テストタスク">
            <input type="number" id="newTaskDuration" value="30">
            <select id="newTaskUnit"><option value="minutes">分</option></select>
            <button id="addTaskBtn">追加</button>
            <button id="saveTasksBtn">保存</button>
            <button id="resetDefaultBtn">デフォルトに戻す</button>
        </div>
    `;
}

beforeEach(() => {
    jest.resetModules();
    setupDOM();
    jest.useFakeTimers();
    const scriptModule = require('../script.js');
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    jest.runOnlyPendingTimers();
});

afterEach(() => {
    jest.clearAllTimers();
    document.body.innerHTML = '';
    localStorage.clear();
});

describe('ポモドーロタイマー基本機能テスト', () => {
    test('初期状態のチェック', () => {
        expect(document.getElementById('timerDisplay').textContent).toBe('25:00');
        expect(document.getElementById('status').textContent).toBe('作業時間');
        expect(document.getElementById('startBtn').style.display).toBe('inline-block');
        expect(document.getElementById('pauseBtn').style.display).toBe('none');
    });

    test('タイマー開始ボタンのクリック', () => {
        document.getElementById('startBtn').click();
        jest.runOnlyPendingTimers();
        expect(document.getElementById('startBtn').style.display).toBe('none');
        expect(document.getElementById('pauseBtn').style.display).toBe('inline-block');
    });

    test('タイマー一時停止', () => {
        document.getElementById('startBtn').click();
        jest.runOnlyPendingTimers();
        document.getElementById('pauseBtn').click();
        expect(document.getElementById('startBtn').style.display).toBe('inline-block');
        expect(document.getElementById('startBtn').textContent).toBe('再開');
        expect(document.getElementById('pauseBtn').style.display).toBe('none');
    });

    test('タイマーリセット', () => {
        document.getElementById('startBtn').click();
        jest.advanceTimersByTime(5000);
        document.getElementById('resetBtn').click();
        expect(document.getElementById('timerDisplay').textContent).toBe('25:00');
        expect(document.getElementById('startBtn').textContent).toBe('開始');
        expect(document.getElementById('completedCycles').textContent).toBe('0');
    });
});

describe('ループ設定テスト', () => {
    test('ループタイプの切り替え', () => {
        const countLoop = document.getElementById('countLoop');
        const loopCount = document.getElementById('loopCount');

        countLoop.click();
        const event = new Event('change');
        countLoop.dispatchEvent(event);
        expect(loopCount.disabled).toBeFalsy();

        document.getElementById('infiniteLoop').click();
        document.getElementById('infiniteLoop').dispatchEvent(event);
        expect(loopCount.disabled).toBeTruthy();
    });

    test('ループカウントの変更', () => {
        document.getElementById('countLoop').click();
        const event = new Event('change');
        document.getElementById('countLoop').dispatchEvent(event);

        const loopCount = document.getElementById('loopCount');
        loopCount.value = '6';
        loopCount.dispatchEvent(event);

        expect(document.getElementById('totalCycles').textContent).toBe('/6');
    });
});

describe('サウンド設定テスト', () => {
    test('サウンドトグルの切り替え', () => {
        const soundToggle = document.getElementById('soundToggle');
        expect(soundToggle.checked).toBeTruthy();

        soundToggle.click();
        const event = new Event('change');
        soundToggle.dispatchEvent(event);
        expect(soundToggle.checked).toBeFalsy();
    });
});

describe('タイマー時間計算テスト', () => {
    test('分から秒への変換', () => {
        const task = { duration: 25, unit: 'minutes' };
        const { getTaskDurationInSeconds } = require('../script.js');
        expect(getTaskDurationInSeconds(task)).toBe(1500);
    });

    test('秒単位のタスク', () => {
        const task = { duration: 30, unit: 'seconds' };
        const { getTaskDurationInSeconds } = require('../script.js');
        expect(getTaskDurationInSeconds(task)).toBe(30);
    });
});

describe('タスク保存機能テスト', () => {
    test('タスク保存後に再読み込みしても保持される', () => {
        document.getElementById('newTaskName').value = '保存タスク';
        document.getElementById('addTaskBtn').click();
        document.getElementById('saveTasksBtn').click();

        jest.resetModules();
        setupDOM();
        require('../script.js');
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
        jest.runOnlyPendingTimers();

        expect(document.querySelectorAll('#taskList .task-item').length).toBe(4);
    });

    test('デフォルトに戻すとlocalStorageがクリアされる', () => {
        document.getElementById('newTaskName').value = '一時タスク';
        document.getElementById('addTaskBtn').click();
        document.getElementById('saveTasksBtn').click();

        document.getElementById('resetDefaultBtn').click();

        expect(localStorage.getItem('tasks')).toBeNull();
        expect(document.querySelectorAll('#taskList .task-item').length).toBe(3);
    });
});