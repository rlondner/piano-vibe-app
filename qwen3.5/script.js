/**
 * Glass Piano - 5 Octave Synthesizer
 * Audio Engine & Interactivity
 */

// ========================================
// Constants & Configuration
// ========================================

const TOTAL_OCTAVES = 5;
const OCTAVE_OFFSET = 2; // Start from C2
const NOTES_IN_OCTAVE = 12;
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = ['C#', 'D#', 'F#', 'G#', 'A#'];

// Keyboard mappings for one octave (QWERTY layout)
const KEYBOARD_MAP = {
    // White keys
    'a': 0,  // C
    's': 2,  // D
    'd': 4,  // E
    'f': 5,  // F
    'g': 7,  // G
    'h': 9,  // A
    'j': 11, // B
    // Black keys
    'w': 1,  // C#
    'e': 3,  // D#
    't': 6,  // F#
    'y': 8,  // G#
    'u': 10  // A#
};

// Instrument presets using Tone.js
const INSTRUMENT_PRESETS = {
    'fender-rhodes': {
        type: 'fm',
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.6, release: 1.5 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 1 },
        effects: ['chorus', 'reverb']
    },
    'wurlitzer': {
        type: 'fm',
        harmonicity: 2.5,
        modulationIndex: 8,
        oscillator: { type: 'square' },
        envelope: { attack: 0.005, decay: 0.4, sustain: 0.5, release: 1.2 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.005, decay: 0.3, sustain: 0.3, release: 0.8 },
        effects: ['tremolo', 'reverb']
    },
    'yamaha-cp70': {
        type: 'fm',
        harmonicity: 4,
        modulationIndex: 12,
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.003, decay: 0.5, sustain: 0.7, release: 2 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.003, decay: 0.4, sustain: 0.5, release: 1.5 },
        effects: ['delay', 'reverb']
    },
    'yamaha-cp80': {
        type: 'fm',
        harmonicity: 4.5,
        modulationIndex: 14,
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.002, decay: 0.6, sustain: 0.75, release: 2.5 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.002, decay: 0.5, sustain: 0.6, release: 1.8 },
        effects: ['delay', 'reverb', 'eq']
    },
    'hohner-clavinet': {
        type: 'am',
        harmonicity: 2,
        modulationIndex: 5,
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.4, release: 0.5 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.001, decay: 0.1, sustain: 0.2, release: 0.3 },
        effects: ['wahwah', 'distortion']
    },
    'hohner-pianet': {
        type: 'fm',
        harmonicity: 3,
        modulationIndex: 6,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.5, release: 1 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.6 },
        effects: ['tremolo', 'phaser']
    },
    'juno-106': {
        type: 'poly',
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.7, release: 1.5 },
        filter: {
            type: 'lowpass',
            frequency: 2000,
            Q: 5,
            envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 1 }
        },
        effects: ['chorus', 'delay']
    },
    'rmi-electra': {
        type: 'fm',
        harmonicity: 1.5,
        modulationIndex: 3,
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0.8, release: 0.3 },
        modulation: { type: 'square' },
        modulationEnvelope: { attack: 0.001, decay: 0.1, sustain: 0.5, release: 0.2 },
        effects: ['reverb']
    },
    'yamaha-dx7': {
        type: 'fm',
        harmonicity: 1,
        modulationIndex: 5,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.5, sustain: 0.8, release: 1 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.005, decay: 0.4, sustain: 0.6, release: 0.8 },
        effects: ['delay', 'reverb']
    },
    'nord-stage': {
        type: 'sample',
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 1, sustain: 0.8, release: 3 },
        effects: ['reverb', 'eq', 'compressor']
    }
};

// ========================================
// Global State
// ========================================

let state = {
    currentOctave: 0, // 0 to 4 (5 octaves total)
    visibleOctaves: 2, // How many octaves to show at once
    inputMode: 'touch', // 'keyboard' or 'touch'
    feedbackStyle: 'color', // 'depress' or 'color'
    isRecording: false,
    recordedChunks: [],
    activeKeys: new Set(),
    synth: null,
    effectsChain: null,
    recorder: null,
    audioContext: null
};

// ========================================
// DOM Elements
// ========================================

let elements = {};

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    cacheDOMElements();
    setupEventListeners();
    generatePianoKeys();
    updateOctaveDisplay();
    updateKeyHints();
    observeResize();
});

function cacheDOMElements() {
    elements = {
        overlay: document.getElementById('start-overlay'),
        startBtn: document.getElementById('start-btn'),
        appContainer: document.getElementById('app-container'),
        instrumentSelect: document.getElementById('instrument-select'),
        inputModeToggle: document.getElementById('input-mode-toggle'),
        feedbackStyleToggle: document.getElementById('feedback-style-toggle'),
        recordBtn: document.getElementById('record-btn'),
        downloadBtn: document.getElementById('download-btn'),
        recordingStatus: document.getElementById('recording-status'),
        octaveRibbon: document.getElementById('octave-ribbon'),
        currentOctaveDisplay: document.getElementById('current-octave-display'),
        pianoContainer: document.getElementById('piano-container'),
        arrowLeft: document.querySelector('.arrow-left'),
        arrowRight: document.querySelector('.arrow-right')
    };
}

function setupEventListeners() {
    // Start overlay
    elements.startBtn.addEventListener('click', initializeApp);

    // Instrument selection
    elements.instrumentSelect.addEventListener('change', changeInstrument);

    // Input mode toggle
    elements.inputModeToggle.addEventListener('change', toggleInputMode);

    // Feedback style toggle
    elements.feedbackStyleToggle.addEventListener('change', toggleFeedbackStyle);

    // Recording controls
    elements.recordBtn.addEventListener('click', toggleRecording);
    elements.downloadBtn.addEventListener('click', stopAndDownloadRecording);

    // Octave ribbon swipe navigation
    setupSwipeNavigation();

    // Arrow click navigation
    elements.arrowLeft.parentElement.addEventListener('click', () => changeOctave(-1));
    elements.arrowRight.parentElement.addEventListener('click', () => changeOctave(1));

    // Keyboard input
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Prevent context menu on piano
    elements.pianoContainer.addEventListener('contextmenu', (e) => e.preventDefault());
}

// ========================================
// App Initialization (Audio Context)
// ========================================

async function initializeApp() {
    try {
        // Initialize Tone.js
        await Tone.start();
        state.audioContext = Tone.context;

        // Create synth
        createSynth('fender-rhodes');

        // Setup recorder
        setupRecorder();

        // Hide overlay, show app
        elements.overlay.classList.add('hidden');
        elements.appContainer.classList.remove('hidden');

        // Focus for keyboard input
        window.focus();
    } catch (error) {
        console.error('Failed to initialize audio:', error);
        elements.startBtn.textContent = 'Error - Click to Retry';
    }
}

// ========================================
// Synthesizer Creation
// ========================================

function createSynth(presetName) {
    // Dispose existing synth
    if (state.synth) {
        state.synth.dispose();
    }
    if (state.effectsChain) {
        state.effectsChain.dispose();
    }

    const preset = INSTRUMENT_PRESETS[presetName];
    let synth;

    // Create main synth based on type
    switch (preset.type) {
        case 'fm':
            synth = new Tone.FMSynth({
                harmonicity: preset.harmonicity,
                modulationIndex: preset.modulationIndex,
                oscillator: preset.oscillator,
                envelope: preset.envelope,
                modulation: preset.modulation,
                modulationEnvelope: preset.modulationEnvelope
            }).toDestination();
            break;
        case 'am':
            synth = new Tone.AMSynth({
                harmonicity: preset.harmonicity,
                modulationIndex: preset.modulationIndex,
                oscillator: preset.oscillator,
                envelope: preset.envelope,
                modulation: preset.modulation,
                modulationEnvelope: preset.modulationEnvelope
            }).toDestination();
            break;
        case 'poly':
            synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: preset.oscillator,
                envelope: preset.envelope
            }).toDestination();
            break;
        default:
            synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: preset.oscillator,
                envelope: preset.envelope
            }).toDestination();
    }

    // Add effects
    const effects = [];

    if (preset.effects) {
        preset.effects.forEach(effectName => {
            const effect = createEffect(effectName, preset);
            if (effect) effects.push(effect);
        });
    }

    // Connect effects chain
    if (effects.length > 0) {
        let lastNode = synth;
        effects.forEach(effect => {
            lastNode.connect(effect);
            lastNode = effect;
        });
        lastNode.toDestination();
        state.effectsChain = effects[effects.length - 1];
    }

    state.synth = synth;
}

function createEffect(effectName, preset) {
    switch (effectName) {
        case 'reverb':
            return new Tone.Reverb({ decay: 2, wet: 0.3 }).toDestination();
        case 'delay':
            return new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.4, wet: 0.2 }).toDestination();
        case 'chorus':
            return new Tone.Chorus({ frequency: 2, delayTime: 2.5, wet: 0.4 }).toDestination();
        case 'tremolo':
            return new Tone.Tremolo({ frequency: 5, depth: 0.5, wet: 0.3 }).toDestination();
        case 'phaser':
            return new Tone.Phaser({ frequency: 0.5, octaves: 3, baseFrequency: 200, wet: 0.4 }).toDestination();
        case 'wahwah':
            return new Tone.AutoFilter({ frequency: 1, baseFrequency: 400, octaves: 2.5, wet: 0.5 }).toDestination();
        case 'distortion':
            return new Tone.Distortion({ distortion: 0.2, wet: 0.3 }).toDestination();
        case 'eq':
            return new Tone.EQ3({ low: 2, mid: 0, high: 3 }).toDestination();
        case 'compressor':
            return new Tone.Compressor({ threshold: -24, ratio: 9 }).toDestination();
        default:
            return null;
    }
}

function changeInstrument() {
    const presetName = elements.instrumentSelect.value;
    createSynth(presetName);
}

// ========================================
// Piano Key Generation
// ========================================

function generatePianoKeys() {
    elements.pianoContainer.innerHTML = '';
    const totalKeys = TOTAL_OCTAVES * NOTES_IN_OCTAVE;

    for (let i = 0; i < totalKeys; i++) {
        const octave = Math.floor(i / NOTES_IN_OCTAVE);
        const noteIndex = i % NOTES_IN_OCTAVE;
        const note = getNoteFromIndex(noteIndex);
        const isBlack = note.includes('#');
        const frequency = Tone.Frequency(note + (octave + OCTAVE_OFFSET), 'm');

        const key = document.createElement('div');
        key.className = `key ${isBlack ? 'black-key' : 'white-key'}`;
        key.dataset.note = note;
        key.dataset.octave = octave + OCTAVE_OFFSET;
        key.dataset.frequency = frequency;
        key.dataset.index = i;

        // Add label
        const label = document.createElement('span');
        label.className = 'key-label';
        label.textContent = note + (octave + OCTAVE_OFFSET);
        key.appendChild(label);

        // Add keyboard hint for first octave
        if (octave === 0) {
            const hint = KEYBOARD_MAP[Object.keys(KEYBOARD_MAP).find(k => KEYBOARD_MAP[k] === noteIndex)];
            if (hint) {
                const hintEl = document.createElement('span');
                hintEl.className = 'key-hint';
                hintEl.textContent = hint;
                key.appendChild(hintEl);
            }
        }

        // Touch/Mouse events
        key.addEventListener('mousedown', (e) => handleKeyStart(i, e));
        key.addEventListener('mouseup', () => handleKeyEnd(i));
        key.addEventListener('mouseleave', () => handleKeyEnd(i));
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleKeyStart(i, e);
        });
        key.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleKeyEnd(i);
        });
        key.addEventListener('touchcancel', () => handleKeyEnd(i));

        elements.pianoContainer.appendChild(key);
    }

    updateVisibleKeys();
}

function getNoteFromIndex(index) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return notes[index];
}

// ========================================
// Key Playing Logic
// ========================================

function handleKeyStart(keyIndex, event) {
    if (!state.synth) return;

    // Prevent duplicate triggers
    if (state.activeKeys.has(keyIndex)) return;
    state.activeKeys.add(keyIndex);

    const key = elements.pianoContainer.children[keyIndex];
    const frequency = parseFloat(key.dataset.frequency);

    // Play note
    state.synth.triggerAttack(frequency);

    // Visual feedback
    updateKeyVisual(key, true);
}

function handleKeyEnd(keyIndex) {
    if (!state.synth) return;
    if (!state.activeKeys.has(keyIndex)) return;

    state.activeKeys.delete(keyIndex);

    const key = elements.pianoContainer.children[keyIndex];
    const frequency = parseFloat(key.dataset.frequency);

    // Release note
    state.synth.triggerRelease(frequency);

    // Reset visual
    updateKeyVisual(key, false);
}

function updateKeyVisual(key, isActive) {
    if (state.feedbackStyle === 'depress') {
        key.classList.toggle('active-depress', isActive);
        key.classList.remove('active-color');
    } else {
        key.classList.toggle('active-color', isActive);
        key.classList.remove('active-depress');
    }
}

// ========================================
// Keyboard Input Handling
// ========================================

function handleKeyDown(e) {
    if (state.inputMode !== 'keyboard') return;
    if (e.repeat) return;

    // Arrow keys for octave navigation
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        changeOctave(1);
        return;
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        changeOctave(-1);
        return;
    }

    // Note keys
    const noteIndex = KEYBOARD_MAP[e.key.toLowerCase()];
    if (noteIndex === undefined) return;

    e.preventDefault();
    const keyIndex = state.currentOctave * NOTES_IN_OCTAVE + noteIndex;
    handleKeyStart(keyIndex, e);
}

function handleKeyUp(e) {
    if (state.inputMode !== 'keyboard') return;

    const noteIndex = KEYBOARD_MAP[e.key.toLowerCase()];
    if (noteIndex === undefined) return;

    const keyIndex = state.currentOctave * NOTES_IN_OCTAVE + noteIndex;
    handleKeyEnd(keyIndex);
}

function toggleInputMode() {
    state.inputMode = elements.inputModeToggle.checked ? 'keyboard' : 'touch';
}

function toggleFeedbackStyle() {
    state.feedbackStyle = elements.feedbackStyleToggle.checked ? 'color' : 'depress';

    // Reset all keys
    document.querySelectorAll('.key').forEach(key => {
        key.classList.remove('active-depress', 'active-color');
    });
}

// ========================================
// Octave Navigation
// ========================================

function changeOctave(direction) {
    const newOctave = state.currentOctave + direction;
    if (newOctave < 0 || newOctave >= TOTAL_OCTAVES) return;

    state.currentOctave = newOctave;
    updateOctaveDisplay();
    updateVisibleKeys();
    updateKeyHints();
}

function updateOctaveDisplay() {
    const startOctave = state.currentOctave + OCTAVE_OFFSET;
    const endOctave = startOctave + state.visibleOctaves - 1;

    if (state.visibleOctaves === 1) {
        elements.currentOctaveDisplay.textContent = `C${startOctave} - B${startOctave}`;
    } else {
        elements.currentOctaveDisplay.textContent = `C${startOctave} - B${endOctave}`;
    }
}

function updateVisibleKeys() {
    const keys = elements.pianoContainer.children;
    const startKey = state.currentOctave * NOTES_IN_OCTAVE;
    const endKey = startKey + (state.visibleOctaves * NOTES_IN_OCTAVE);

    Array.from(keys).forEach((key, index) => {
        if (index >= startKey && index < endKey) {
            key.style.display = 'block';
        } else {
            key.style.display = 'none';
        }
    });

    // Scroll to show visible keys
    const firstVisible = keys[startKey];
    if (firstVisible) {
        firstVisible.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function updateKeyHints() {
    document.querySelectorAll('.key-hint').forEach(hint => {
        hint.parentElement.style.display = 'none';
    });

    const startKey = state.currentOctave * NOTES_IN_OCTAVE;
    for (let i = 0; i < NOTES_IN_OCTAVE; i++) {
        const keyIndex = startKey + i;
        const key = elements.pianoContainer.children[keyIndex];
        if (key) {
            const hint = key.querySelector('.key-hint');
            if (hint) {
                key.style.display = 'block';
                hint.parentElement.style.display = 'block';
            }
        }
    }
}

// ========================================
// Swipe Navigation
// ========================================

function setupSwipeNavigation() {
    let startX = 0;
    let isSwiping = false;
    let threshold = 50;

    const ribbon = elements.octaveRibbon;

    // Mouse events
    ribbon.addEventListener('mousedown', (e) => {
        isSwiping = true;
        startX = e.clientX;
        ribbon.classList.add('swiping');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isSwiping) return;
        const diff = e.clientX - startX;
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                changeOctave(-1);
            } else {
                changeOctave(1);
            }
            isSwiping = false;
            startX = e.clientX;
        }
    });

    document.addEventListener('mouseup', () => {
        isSwiping = false;
        ribbon.classList.remove('swiping');
    });

    // Touch events
    ribbon.addEventListener('touchstart', (e) => {
        isSwiping = true;
        startX = e.touches[0].clientX;
        ribbon.classList.add('swiping');
    });

    ribbon.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        const diff = e.touches[0].clientX - startX;
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                changeOctave(-1);
            } else {
                changeOctave(1);
            }
            isSwiping = false;
            startX = e.touches[0].clientX;
        }
    });

    ribbon.addEventListener('touchend', () => {
        isSwiping = false;
        ribbon.classList.remove('swiping');
    });
}

// ========================================
// Responsive Layout
// ========================================

function observeResize() {
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const width = entry.contentRect.width;

            // Determine visible octaves based on container width
            if (width < 600) {
                state.visibleOctaves = 1;
            } else {
                state.visibleOctaves = 2;
            }

            updateOctaveDisplay();
            updateVisibleKeys();
        }
    });

    resizeObserver.observe(elements.pianoContainer.parentElement);
}

// ========================================
// Recording Functionality
// ========================================

function setupRecorder() {
    const dest = state.audioContext.createMediaStreamDestination();
    state.synth.connect(dest);
    state.recorder = new MediaRecorder(dest.stream);

    state.recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            state.recordedChunks.push(e.data);
        }
    };

    state.recorder.onstop = () => {
        // Recording stopped, ready for download
    };
}

function toggleRecording() {
    if (!state.recorder) return;

    if (state.isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    state.recordedChunks = [];
    state.recorder.start();
    state.isRecording = true;

    elements.recordBtn.classList.add('recording');
    elements.recordBtn.innerHTML = `
        <span class="record-icon"></span>
        Stop Recording
    `;
    elements.downloadBtn.disabled = true;
    elements.recordingStatus.textContent = 'Recording...';
}

function stopRecording() {
    state.recorder.stop();
    state.isRecording = false;

    elements.recordBtn.classList.remove('recording');
    elements.recordBtn.innerHTML = `
        <span class="record-icon"></span>
        Record
    `;
    elements.downloadBtn.disabled = false;
    elements.recordingStatus.textContent = 'Ready to download';
}

function stopAndDownloadRecording() {
    if (state.recordedChunks.length === 0) return;

    stopRecording();

    const blob = new Blob(state.recordedChunks, { type: 'audio/wav' });
    const wavBlob = convertToWAV(blob);
    const url = URL.createObjectURL(wavBlob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `glass-piano-recording-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        elements.recordingStatus.textContent = 'Downloaded!';
    }, 100);
}

function convertToWAV(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const audioData = new Uint8Array(reader.result);
            const wavBuffer = createWAVFile(audioData);
            resolve(new Blob([wavBuffer], { type: 'audio/wav' }));
        };
        reader.readAsArrayBuffer(blob);
    }).then(result => result);

    // Synchronous version for immediate use
    function createWAVFile(audioData) {
        const buffer = new ArrayBuffer(44 + audioData.length);
        const view = new DataView(buffer);

        // RIFF chunk descriptor
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + audioData.length, true);
        writeString(view, 8, 'WAVE');

        // fmt sub-chunk
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, 44100, true);
        view.setUint32(28, 44100 * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);

        // data sub-chunk
        writeString(view, 36, 'data');
        view.setUint32(40, audioData.length, true);

        // Write audio data
        const dataView = new Uint8Array(buffer, 44);
        dataView.set(audioData);

        return buffer;
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}

// Override with synchronous WAV conversion
function convertToWAV(blob) {
    const audioData = new Uint8Array(blob.size);
    const reader = new FileReader();

    return new Promise((resolve) => {
        reader.onload = () => {
            const buffer = createWAVFile(new Uint8Array(reader.result));
            resolve(new Blob([buffer], { type: 'audio/wav' }));
        };
        reader.readAsArrayBuffer(blob);
    });
}

function createWAVFile(audioData) {
    const buffer = new ArrayBuffer(44 + audioData.length);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioData.length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 2, true); // Stereo
    view.setUint32(24, 44100, true);
    view.setUint32(28, 44100 * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, audioData.length, true);

    const dataView = new Uint8Array(buffer, 44);
    dataView.set(audioData);

    return buffer;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
