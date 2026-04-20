document.addEventListener('DOMContentLoaded', () => {
    const audioEngine = new AudioEngine();
    let pianoUI = null;

    const startBtn = document.getElementById('start-btn');
    const startOverlay = document.getElementById('start-overlay');
    const presetSelect = document.getElementById('preset-select');
    const feedbackToggle = document.getElementById('feedback-toggle');
    const modeToggle = document.getElementById('mode-toggle');
    const recordBtn = document.getElementById('record-btn');
    const stopBtn = document.getElementById('stop-btn');

    startBtn.addEventListener('click', async () => {
        await audioEngine.init();
        pianoUI = new PianoUI(audioEngine);
        startOverlay.style.display = 'none';
    });

    presetSelect.addEventListener('change', (e) => {
        audioEngine.setPreset(e.target.value);
    });

    feedbackToggle.addEventListener('click', () => {
        const current = feedbackToggle.dataset.value;
        const next = current === 'color' ? 'depress' : 'color';
        feedbackToggle.dataset.value = next;
        feedbackToggle.innerText = next === 'color' ? 'Color Change' : 'Depress';
        if (pianoUI) pianoUI.feedbackStyle = next;
    });

    modeToggle.addEventListener('click', () => {
        const current = modeToggle.dataset.value;
        const next = current === 'touch' ? 'hardware' : 'touch';
        modeToggle.dataset.value = next;
        modeToggle.innerText = next === 'touch' ? 'Touch/Mouse' : 'Hardware Keyboard';
        if (pianoUI) pianoUI.inputMode = next;
    });

    recordBtn.addEventListener('click', () => {
        if (!recordBtn.classList.contains('active')) {
            audioEngine.startRecording();
            recordBtn.classList.add('active');
            recordBtn.innerText = '● Recording...';
            stopBtn.disabled = false;
        }
    });

    stopBtn.addEventListener('click', () => {
        if (recordBtn.classList.contains('active')) {
            audioEngine.stopRecording();
            recordBtn.classList.remove('active');
            recordBtn.innerText = '● Record';
            stopBtn.disabled = true;
        }
    });
});
