// Constants & State
const OCTAVES = 5;
const START_OCTAVE = 2; // C2 to C7 approx
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const QWERTY_MAP = {
    'a': 'C', 'w': 'C#', 's': 'D', 'e': 'D#', 'd': 'E', 'f': 'F', 't': 'F#', 
    'g': 'G', 'y': 'G#', 'h': 'A', 'u': 'A#', 'j': 'B', 'k': 'C'
};

let currentInstrument = null;
let currentVisibleOctave = 0; // 0 to 4 (or 3 if showing 2)
let isRecording = false;
let recorder = null;
let chunks = [];
let activeNotes = new Set();
let feedbackStyle = 'color'; // 'color' or 'depress'
let inputMode = 'touch'; // 'touch' or 'hardware'

// --- Audio Engine Setup ---

const presets = {
    fenderRhodes: () => new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3, modulationIndex: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 1.2, sustain: 0.1, release: 1.2 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
    }).toDestination(),

    wurlitzer: () => new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth4' },
        envelope: { attack: 0.005, decay: 0.5, sustain: 0.1, release: 0.8 }
    }).connect(new Tone.Distortion(0.1).toDestination()),

    yamahaCP70: () => new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 1 }
    }).toDestination(),

    yamahaCP80: () => new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 2, sustain: 0, release: 1.5 }
    }).toDestination(),

    clavinet: () => new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'pulse', width: 0.3 },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 }
    }).toDestination(),

    pianet: () => new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.02, decay: 0.4, sustain: 0, release: 0.4 }
    }).toDestination(),

    juno106: () => new Tone.PolySynth(Tone.AMSynth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.1, decay: 0.3, sustain: 1, release: 1.2 }
    }).toDestination(),

    rmiElectra: () => new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square8' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.2 }
    }).toDestination(),

    dx7Organ: () => new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 2, modulationIndex: 20,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0, sustain: 1, release: 0.5 }
    }).toDestination(),

    nordGrand: () => new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 2.5, sustain: 0, release: 1.5 }
    }).toDestination()
};

// --- Initialization ---

async function init() {
    await Tone.start();
    switchInstrument('fenderRhodes');
    document.getElementById('start-overlay').style.display = 'none';
    
    // Recorder setup
    recorder = new Tone.Recorder();
    Tone.Destination.connect(recorder);
}

function switchInstrument(name) {
    if (currentInstrument) currentInstrument.dispose();
    currentInstrument = presets[name]();
}

// --- Keyboard Generation ---

function generateKeys() {
    const container = document.getElementById('piano-keys-container');
    container.innerHTML = '';

    for (let oct = 0; oct < OCTAVES; oct++) {
        const octaveNum = START_OCTAVE + oct;
        const octaveDiv = document.createElement('div');
        octaveDiv.className = 'octave';
        octaveDiv.style.display = 'contents';

        ALL_NOTES.forEach(noteName => {
            const isBlack = noteName.includes('#');
            const key = document.createElement('div');
            const fullNote = noteName + octaveNum;
            
            key.className = `key ${isBlack ? 'black-key' : 'white-key'}`;
            key.dataset.note = fullNote;
            
            // Interaction listeners
            key.addEventListener('mousedown', e => handleKeyAction(fullNote, 'start', e));
            key.addEventListener('touchstart', e => {
                e.preventDefault();
                handleKeyAction(fullNote, 'start', e);
            }, { passive: false });

            container.appendChild(key);
        });
    }

    // Global release listeners
    window.addEventListener('mouseup', () => releaseAll());
    window.addEventListener('touchend', () => releaseAll());
    window.addEventListener('touchcancel', () => releaseAll());
}

function handleKeyAction(note, action, event) {
    if (action === 'start') {
        if (!activeNotes.has(note)) {
            currentInstrument.triggerAttack(note);
            activeNotes.add(note);
            visualizeKey(note, true);
        }
    }
}

function releaseAll() {
    currentInstrument.releaseAll();
    activeNotes.forEach(note => visualizeKey(note, false));
    activeNotes.clear();
}

function visualizeKey(note, isActive) {
    const keyEl = document.querySelector(`[data-note="${note}"]`);
    if (!keyEl) return;

    if (isActive) {
        if (feedbackStyle === 'color') keyEl.classList.add('active-color');
        else keyEl.classList.add('active-depress');
    } else {
        keyEl.classList.remove('active-color', 'active-depress');
    }
}

// --- Octave Navigation (Ribbon) ---

function updateOctaveView() {
    const container = document.getElementById('piano-keys-container');
    const isPortrait = window.innerWidth < 900;
    const octaveWidth = isPortrait ? 100 : 50; // % of viewport
    
    // Max octave index depends on how many we show
    const maxOctave = isPortrait ? (OCTAVES - 1) : (OCTAVES - 2);
    if (currentVisibleOctave > maxOctave) currentVisibleOctave = maxOctave;
    if (currentVisibleOctave < 0) currentVisibleOctave = 0;

    container.style.left = `-${currentVisibleOctave * octaveWidth}%`;
    
    const startNote = `C${START_OCTAVE + currentVisibleOctave}`;
    const endNote = `B${START_OCTAVE + currentVisibleOctave + (isPortrait ? 0 : 1)}`;
    document.getElementById('octave-display').innerText = `Current: ${startNote} - ${endNote}`;
}

// Ribbon Swipe Logic
let isDragging = false;
let startX = 0;

const ribbon = document.getElementById('ribbon');
ribbon.addEventListener('mousedown', e => { isDragging = true; startX = e.clientX; });
ribbon.addEventListener('touchstart', e => { isDragging = true; startX = e.touches[0].clientX; });

window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    handleDrag(e.clientX);
});
window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    handleDrag(e.touches[0].clientX);
});

window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('touchend', () => isDragging = false);

function handleDrag(currentX) {
    const diff = startX - currentX;
    if (Math.abs(diff) > 50) {
        if (diff > 0) currentVisibleOctave++;
        else currentVisibleOctave--;
        
        startX = currentX;
        updateOctaveView();
    }
}

// --- Hardware Keyboard ---

window.addEventListener('keydown', e => {
    if (inputMode !== 'hardware') return;
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        currentVisibleOctave++;
        updateOctaveView();
        return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        currentVisibleOctave--;
        updateOctaveView();
        return;
    }

    const noteName = QWERTY_MAP[e.key.toLowerCase()];
    if (noteName) {
        // Map to visible octave
        const octave = START_OCTAVE + currentVisibleOctave + (e.key === 'k' ? 1 : 0);
        const fullNote = noteName + octave;
        handleKeyAction(fullNote, 'start');
    }
});

window.addEventListener('keyup', e => {
    if (inputMode !== 'hardware') return;
    const noteName = QWERTY_MAP[e.key.toLowerCase()];
    if (noteName) {
        const octave = START_OCTAVE + currentVisibleOctave + (e.key === 'k' ? 1 : 0);
        const fullNote = noteName + octave;
        currentInstrument.triggerRelease(fullNote);
        activeNotes.delete(fullNote);
        visualizeKey(fullNote, false);
    }
});

// --- UI Controls Event Listeners ---

document.getElementById('start-btn').addEventListener('click', init);

document.getElementById('preset-select').addEventListener('change', e => {
    switchInstrument(e.target.value);
});

document.querySelectorAll('#feedback-toggle .toggle-label').forEach(el => {
    el.addEventListener('click', () => {
        document.querySelectorAll('#feedback-toggle .toggle-label').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        feedbackStyle = el.dataset.value;
    });
});

document.querySelectorAll('#input-toggle .toggle-label').forEach(el => {
    el.addEventListener('click', () => {
        document.querySelectorAll('#input-toggle .toggle-label').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        inputMode = el.dataset.value;
    });
});

// --- Recording Logic ---

document.getElementById('record-btn').addEventListener('click', async () => {
    if (!recorder) return;
    recorder.start();
    isRecording = true;
    document.getElementById('record-btn').classList.add('recording');
    document.getElementById('record-btn').disabled = true;
    document.getElementById('stop-btn').disabled = false;
});

document.getElementById('stop-btn').addEventListener('click', async () => {
    const recording = await recorder.stop();
    isRecording = false;
    document.getElementById('record-btn').classList.remove('recording');
    document.getElementById('record-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;

    // Trigger download
    const url = URL.createObjectURL(recording);
    const anchor = document.createElement("a");
    anchor.download = "piano-recording.webm";
    anchor.href = url;
    anchor.click();
});

// Window Resize
window.addEventListener('resize', updateOctaveView);

// Kickoff
generateKeys();
updateOctaveView();
