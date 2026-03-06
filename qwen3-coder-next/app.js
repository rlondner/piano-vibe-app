/**
 * Vibe Piano - 5-Octave Polyphonic Synthesizer
 * Based on Tone.js
 */

// =========================
// Configuration & Constants
// =========================

const CONFIG = {
    startOctave: 2,
    endOctave: 6,
    octavesCount: 5,
    baseFreq: 261.63, // C4
    notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    whiteKeyMap: ['A', 'S', 'D', 'F', 'G', 'H', 'J'],
    blackKeyMap: ['W', 'E', 'T', 'Y', 'U'],
    instruments: {
        rhodes: {
            name: 'Fender Rhodes',
            type: 'poly',
            params: {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 1.5 }
            },
            effects: {
                delay: { time: 0.25, feedback: 0.3, wet: 0.3 },
                reverb: { roomSize: 0.4, wet: 0.4 }
            }
        },
        wurlitzer: {
            name: 'Wurlitzer Electronic Piano',
            type: 'poly',
            params: {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.005, decay: 0.15, sustain: 0.3, release: 1.2 }
            },
            effects: {
                delay: { time: 0.2, feedback: 0.25, wet: 0.2 },
                reverb: { roomSize: 0.3, wet: 0.3 },
                distortion: 0.05
            }
        },
        cp70: {
            name: 'Yamaha CP-70',
            type: 'poly',
            params: {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 1.8 }
            },
            effects: {
                delay: { time: 0.28, feedback: 0.35, wet: 0.35 },
                reverb: { roomSize: 0.5, wet: 0.4 },
                chorus: { baseDelay: 15, depth: 0.5, wet: 0.2 }
            }
        },
        cp80: {
            name: 'Yamaha CP-80',
            type: 'poly',
            params: {
                oscillator: { type: 'square' },
                envelope: { attack: 0.008, decay: 0.18, sustain: 0.35, release: 1.5 }
            },
            effects: {
                delay: { time: 0.22, feedback: 0.28, wet: 0.25 },
                reverb: { roomSize: 0.45, wet: 0.35 },
                phaser: { baseDelay: 10, depth: 0.6, wet: 0.2 }
            }
        },
        clavinet: {
            name: 'Hohner Clavinet',
            type: 'poly',
            params: {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.002, decay: 0.1, sustain: 0.2, release: 0.5 }
            },
            effects: {
                delay: { time: 0.15, feedback: 0.2, wet: 0.2 },
                reverb: { roomSize: 0.25, wet: 0.2 },
                phaser: { baseDelay: 8, depth: 0.8, wet: 0.3 },
                distortion: 0.15
            }
        },
        pianet: {
            name: 'Hohner Pianet',
            type: 'poly',
            params: {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.01, decay: 0.15, sustain: 0.35, release: 0.8 }
            },
            effects: {
                delay: { time: 0.18, feedback: 0.15, wet: 0.15 },
                reverb: { roomSize: 0.2, wet: 0.2 },
                tremolo: { rate: 5, depth: 0.3, wet: 0.2 }
            }
        },
        juno106: {
            name: 'Juno 106',
            type: 'poly',
            params: {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.01, decay: 0.5, sustain: 0.6, release: 1.5 }
            },
            effects: {
                delay: { time: 0.3, feedback: 0.4, wet: 0.3 },
                reverb: { roomSize: 0.6, wet: 0.4 },
                chorus: { baseDelay: 20, depth: 0.8, wet: 0.4 }
            }
        },
        electra: {
            name: 'RMI Electra-piano',
            type: 'poly',
            params: {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.005, decay: 0.12, sustain: 0.25, release: 1.0 }
            },
            effects: {
                delay: { time: 0.18, feedback: 0.2, wet: 0.2 },
                reverb: { roomSize: 0.3, wet: 0.25 },
                tremolo: { rate: 6, depth: 0.25, wet: 0.15 }
            }
        },
        dx7: {
            name: 'Yamaha DX7 organ',
            type: 'fm',
            params: {
                operatorRatio: 1,
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 1.2 }
            },
            effects: {
                delay: { time: 0.25, feedback: 0.3, wet: 0.3 },
                reverb: { roomSize: 0.5, wet: 0.4 },
                phaser: { baseDelay: 12, depth: 0.4, wet: 0.2 }
            }
        },
        nord: {
            name: 'Clavia Nord Stage 4 Grand Piano',
            type: 'poly',
            params: {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.4, sustain: 0.6, release: 2.0 }
            },
            effects: {
                delay: { time: 0.35, feedback: 0.4, wet: 0.35 },
                reverb: { roomSize: 0.7, wet: 0.5 },
                chorus: { baseDelay: 25, depth: 0.6, wet: 0.25 }
            }
        }
    }
};

// =========================
// Global State
// =========================

let state = {
    currentOctave: CONFIG.startOctave, // Currently displayed lowest octave
    visibleOctaves: 1, // 1 for portrait, 2 for landscape
    inputMode: 'hardware', // 'hardware' or 'touch'
    visualFeedback: 'color', // 'color' or 'depress'
    isRecording: false,
    recorder: null,
    recordedNotes: [],
    activeKeys: new Map(), // Map of noteName -> noteObject
    lastNoteTime: 0
};

// =========================
// Tone.js Audio Engine
// =========================

let masterChain, masterReverb, masterDelay, masterCompressor;
let activeSynths = new Map(); // Map of note -> active synth

// Initialize audio context
async function initAudio() {
    await Tone.start();

    // Create effects
    masterReverb = new Tone.Reverb({ roomSize: 0.5, wet: 0.3 }).toDestination();
    masterDelay = new Tone.Delay({ time: 0.25, feedback: 0.3, wet: 0.2 });
    masterCompressor = new Tone.Compressor({
        threshold: -12,
        knee: 30,
        ratio: 12,
        attack: 0.003,
        release: 0.25
    });

    // Signal chain: Reverb -> Delay -> Compressor -> Destination
    masterReverb.connect(masterDelay);
    masterDelay.connect(masterCompressor);
    masterCompressor.connect(Tone.Destination);

    // Store the chain for recording
    masterChain = masterCompressor;
}

// Get frequency for a note
function getFrequency(note, octave) {
    const noteIndex = CONFIG.notes.indexOf(note);
    // C4 = 261.63Hz, octave 2 starts at C2 = 65.41Hz
    const baseOctave = 2;
    const octaveOffset = octave - baseOctave;
    const noteOffset = noteIndex;
    const frequency = 65.41 * Math.pow(2, octaveOffset + noteOffset / 12);
    return frequency;
}

// Get note name for a key
function getNoteName(octave, noteIndex) {
    return `${CONFIG.notes[noteIndex]}${octave}`;
}

// Create synth based on instrument
function createSynth(instrumentKey, paramsOverride = {}) {
    const instrument = CONFIG.instruments[instrumentKey];

    if (instrument.type === 'fm') {
        // FM Synth for DX7
        const synth = new Tone.FMSynth({
            carrier: {
                oscillator: { type: 'square' },
                envelope: { ...instrument.params.envelope }
            },
            modulator: {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.8 }
            },
            envelope: { ...instrument.params.envelope },
            modulationIndex: 5,
            harmonicity: 2
        });

        // FM-specific effects
        if (instrument.effects.phaser) {
            const phaser = new Tone.Phaser({
                baseDelay: instrument.effects.phaser.baseDelay,
                depth: instrument.effects.phaser.depth,
                spread: 90,
                feedback: 0.3,
                frequency: 2
            }).connect(masterReverb);
            synth.connect(phaser);
        }
        if (instrument.effects.delay) {
            const delay = new Tone.Delay({
                delayTime: instrument.effects.delay.time,
                feedback: instrument.effects.delay.feedback,
                wet: instrument.effects.delay.wet || 0.3
            }).connect(masterDelay);
            synth.connect(delay);
        }
        if (instrument.effects.tremolo) {
            const tremolo = new Tone.Tremolo({
                type: 'sine',
                rate: instrument.effects.tremolo.rate,
                depth: instrument.effects.tremolo.depth,
                wet: instrument.effects.tremolo.wet || 0.2
            }).connect(masterReverb);
            synth.connect(tremolo);
        }

        return synth;
    } else {
        // PolySynth for all other instruments
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { ...instrument.params.oscillator },
            envelope: { ...instrument.params.envelope }
        });

        // Apply instrument-specific effects
        if (instrument.effects.distortion) {
            const distortion = new Tone.Distortion(instrument.effects.distortion).connect(masterReverb);
            synth.connect(distortion);
        } else {
            synth.connect(masterReverb);
        }

        if (instrument.effects.phaser) {
            const phaser = new Tone.Phaser({
                baseDelay: instrument.effects.phaser.baseDelay,
                depth: instrument.effects.phaser.depth,
                spread: 90,
                feedback: 0.3,
                frequency: 2
            }).connect(masterDelay);
            synth.connect(phaser);
        }

        if (instrument.effects.chorus) {
            const chorus = new Tone.Chorus({
                type: 'sine',
                baseDelay: instrument.effects.chorus.baseDelay,
                depth: instrument.effects.chorus.depth,
                feedback: 0.3,
                wet: instrument.effects.chorus.wet || 0.3
            }).connect(masterDelay);
            synth.connect(chorus);
        }

        if (instrument.effects.tremolo) {
            const tremolo = new Tone.Tremolo({
                type: 'sine',
                rate: instrument.effects.tremolo.rate,
                depth: instrument.effects.tremolo.depth,
                wet: instrument.effects.tremolo.wet || 0.2
            }).connect(masterReverb);
            synth.connect(tremolo);
        }
    }
}

// Play a note
function playNote(note, octave, velocity = 0.8) {
    const noteName = getNoteName(octave, CONFIG.notes.indexOf(note));
    const frequency = getFrequency(note, octave);
    const currentTime = Tone.now();

    // Get current instrument
    const instrumentKey = document.getElementById('instrument-select').value;

    // Check if synth already exists
    if (!activeSynths.has(noteName)) {
        activeSynths.set(noteName, createSynth(instrumentKey));
    }

    const synth = activeSynths.get(noteName);
    synth.triggerAttack(frequency, currentTime, velocity);
    state.lastNoteTime = currentTime;

    return noteName;
}

// Stop a note
function stopNote(note, octave) {
    const noteName = getNoteName(octave, CONFIG.notes.indexOf(note));
    const currentTime = Tone.now();

    if (activeSynths.has(noteName)) {
        const synth = activeSynths.get(noteName);
        synth.triggerRelease(currentTime);
    }

    // Clean up after release
    setTimeout(() => {
        if (activeSynths.has(noteName)) {
            const synth = activeSynths.get(noteName);
            // Check if synth has no more active voices
            if (synth.numberOfActivations === 0) {
                activeSynths.delete(noteName);
            }
        }
    }, 2000);

    return noteName;
}

// =========================
// UI Generation & Rendering
// =========================

function generateKeys() {
    const keysWrapper = document.getElementById('keys-wrapper');
    keysWrapper.innerHTML = '';

    // Determine visible octaves based on screen width and landscape/portrait
    const isLandscape = window.innerWidth > 768;
    const visibleOctavesCount = window.innerWidth <= 600 ? 1 : (isLandscape ? 2 : 1);
    state.visibleOctaves = visibleOctavesCount;

    // Calculate visible octave range
    let startOctave = state.currentOctave;
    let endOctave = startOctave + visibleOctavesCount - 1;

    // Clamp to valid range
    if (endOctave > CONFIG.endOctave) {
        endOctave = CONFIG.endOctave;
        startOctave = Math.max(CONFIG.startOctave, endOctave - visibleOctavesCount + 1);
    }

    // Render white keys first (background layer)
    for (let oct = startOctave; oct <= endOctave; oct++) {
        // C through B (white keys)
        for (let i = 0; i < CONFIG.notes.length; i++) {
            const note = CONFIG.notes[i];
            if (!note.includes('#')) { // White key
                const key = document.createElement('div');
                const noteName = getNoteName(oct, i);
                key.className = `piano-key white`;
                key.dataset.note = note;
                key.dataset.octave = oct;
                key.dataset.noteName = noteName;
                key.id = `key-${noteName}`;

                // Add keyboard hint label for visible octave
                if (oct === startOctave) {
                    const label = document.createElement('span');
                    label.className = 'key-label';
                    key.appendChild(label);
                    key.dataset.hintLabel = note; // Store hint label
                }

                keysWrapper.appendChild(key);
            }
        }
    }

    // Render black keys (foreground layer)
    for (let oct = startOctave; oct <= endOctave; oct++) {
        // C# through B# (black keys)
        for (let i = 0; i < CONFIG.notes.length; i++) {
            const note = CONFIG.notes[i];
            if (note.includes('#')) { // Black key
                const key = document.createElement('div');
                const noteName = getNoteName(oct, i);
                key.className = `piano-key black`;
                key.dataset.note = note;
                key.dataset.octave = oct;
                key.dataset.noteName = noteName;
                key.id = `key-${noteName}`;

                // Add keyboard hint label for visible octave
                if (oct === startOctave) {
                    const label = document.createElement('span');
                    label.className = 'key-label';
                    key.appendChild(label);
                    key.dataset.hintLabel = note;
                }

                keysWrapper.appendChild(key);
            }
        }
    }

    // Update keyboard hint labels
    updateKeyboardHint();

    // Update octave display
    updateOctaveDisplay(startOctave, endOctave);

    return { startOctave, endOctave };
}

function updateKeyboardHint() {
    const hintDiv = document.getElementById('keyboard-hint');
    if (!hintDiv) return;

    const whiteLabels = hintDiv.querySelector('.key-mapping');
    const blackLabels = hintDiv.querySelector('.black-key-labels');

    if (whiteLabels) {
        whiteLabels.innerHTML = '';
        // Get currently visible white keys
        const visibleOctaves = state.visibleOctaves;
        for (let i = 0; i < 7; i++) {
            const label = document.createElement('span');
            label.className = 'white-key-label';
            label.textContent = CONFIG.whiteKeyMap[i];
            whiteLabels.appendChild(label);
        }
    }

    if (blackLabels) {
        blackLabels.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const label = document.createElement('span');
            label.className = 'black-key-label';
            label.textContent = CONFIG.blackKeyMap[i];
            blackLabels.appendChild(label);
        }
    }
}

function updateOctaveDisplay(startOctave, endOctave) {
    const rangeEl = document.getElementById('octave-range');
    const counterEl = document.getElementById('octave-counter');

    if (rangeEl) {
        rangeEl.textContent = `C${startOctave} - B${endOctave}`;
    }

    if (counterEl) {
        // Calculate current page number
        const currentPage = Math.floor((startOctave - CONFIG.startOctave) / state.visibleOctaves) + 1;
        const totalPages = Math.ceil((CONFIG.endOctave - CONFIG.startOctave + 1) / state.visibleOctaves);
        counterEl.textContent = `${currentPage}/${totalPages}`;
    }
}

function updateKeyVisual(noteName, isActive) {
    const key = document.getElementById(`key-${noteName}`);
    if (!key) return;

    if (isActive) {
        key.classList.add('active');
        const feedbackMode = state.visualFeedback;
        key.classList.add(`${feedbackMode}-mode`);
    } else {
        key.classList.remove('active');
        key.classList.remove('color-mode', 'depress-mode');
    }
}

function updateAllKeyVisuals() {
    const visibleNotes = getVisibleNotes();
    visibleNotes.forEach(noteName => {
        const key = document.getElementById(`key-${noteName}`);
        if (key && activeKeys.has(noteName)) {
            key.classList.add('active');
            const feedbackMode = state.visualFeedback;
            key.classList.add(`${feedbackMode}-mode`);
        }
    });
}

function getVisibleNotes() {
    const keys = document.querySelectorAll('.piano-key');
    const notes = [];
    keys.forEach(key => {
        notes.push(key.dataset.noteName);
    });
    return notes;
}

// =========================
// Octave Navigation (Ribbon Swipe)
// =========================

function initRibbonNavigation() {
    const ribbon = document.querySelector('.ribbon-container');
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    // Mouse events for desktop
    ribbon.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Only left click
        startX = e.clientX;
        isDragging = true;
        ribbon.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.clientX;
        const deltaX = currentX - startX;

        // Visual feedback during drag
        if (Math.abs(deltaX) > 50) {
            handleSwipe(deltaX > 0 ? 'right' : 'left');
            isDragging = false;
            startX = currentX;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            ribbon.style.cursor = 'grab';
        }
    });

    // Touch events for mobile
    ribbon.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    }, { passive: true });

    ribbon.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); // Prevent scrolling
        currentX = e.touches[0].clientX;
    }, { passive: false });

    ribbon.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;

        const deltaX = e.changedTouches[0].clientX - startX;
        if (Math.abs(deltaX) > 50) {
            handleSwipe(deltaX > 0 ? 'right' : 'left');
        }
    });

    // Navigation buttons
    document.getElementById('prev-octave').addEventListener('click', () => {
        navigateOctave(-1);
    });

    document.getElementById('next-octave').addEventListener('click', () => {
        navigateOctave(1);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            navigateOctave(-1);
        } else if (e.key === 'ArrowDown') {
            navigateOctave(1);
        }
    });
}

function navigateOctave(direction) {
    const newOctave = state.currentOctave + direction * state.visibleOctaves;
    if (newOctave >= CONFIG.startOctave && newOctave <= CONFIG.endOctave - state.visibleOctaves + 1) {
        state.currentOctave = newOctave;
        generateKeys();
    }
}

function handleSwipe(direction) {
    const newOctave = state.currentOctave + (direction === 'right' ? -1 : 1) * state.visibleOctaves;
    if (newOctave >= CONFIG.startOctave && newOctave <= CONFIG.endOctave - state.visibleOctaves + 1) {
        state.currentOctave = newOctave;
        generateKeys();
    }
}

// =========================
// Input Handling
// =========================

function initHardwareKeyboard() {
    const keyMap = {};
    const visibleOctave = state.currentOctave;

    // White keys mapping (A, S, D, F, G, H, J)
    const whiteKeyNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    CONFIG.whiteKeyMap.forEach((keyChar, index) => {
        const note = whiteKeyNotes[index];
        const noteName = getNoteName(visibleOctave, CONFIG.notes.indexOf(note));
        keyMap[keyChar.toLowerCase()] = noteName;
        keyMap[keyChar.toUpperCase()] = noteName;
    });

    // Black keys mapping (W, E, T, Y, U)
    const blackKeyNotes = ['C#', 'D#', 'F#', 'G#', 'A#'];
    CONFIG.blackKeyMap.forEach((keyChar, index) => {
        const note = blackKeyNotes[index];
        const noteName = getNoteName(visibleOctave, CONFIG.notes.indexOf(note));
        keyMap[keyChar.toLowerCase()] = noteName;
        keyMap[keyChar.toUpperCase()] = noteName;
    });

    // Store for lookup
    state.keyMap = keyMap;

    // Add octave shift keys
    window.addEventListener('keydown', (e) => {
        if (state.inputMode !== 'hardware') return;

        // Check for key repeat to prevent continuous triggering
        if (e.repeat) return;

        const noteName = keyMap[e.key];
        if (noteName && !activeKeys.has(noteName)) {
            const [note, octave] = parseNoteName(noteName);
            const playedNoteName = playNote(note, parseInt(octave));
            activeKeys.set(playedNoteName, {
                note,
                octave: parseInt(octave),
                startTime: Tone.now()
            });
            updateKeyVisual(playedNoteName, true);
        }
    });

    window.addEventListener('keyup', (e) => {
        if (state.inputMode !== 'hardware') return;

        const noteName = keyMap[e.key];
        if (noteName && activeKeys.has(noteName)) {
            const [note, octave] = parseNoteName(noteName);
            const stoppedNoteName = stopNote(note, parseInt(octave));
            activeKeys.delete(stoppedNoteName);
            updateKeyVisual(stoppedNoteName, false);
        }
    });
}

function parseNoteName(noteName) {
    const match = noteName.match(/^([A-G]#?)(\d)$/);
    if (match) {
        return [match[1], match[2]];
    }
    return [noteName.slice(0, -1), noteName.slice(-1)];
}

function initTouchInput() {
    const keys = document.querySelectorAll('.piano-key');
    let activeTouches = new Map(); // Map of touchId -> {key, note, octave}

    keys.forEach(key => {
        // Touch events
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (state.inputMode !== 'touch') return;

            const touches = e.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                const note = key.dataset.note;
                const octave = parseInt(key.dataset.octave);
                const noteName = key.dataset.noteName;

                if (!activeKeys.has(noteName)) {
                    const playedNoteName = playNote(note, octave);
                    activeKeys.set(playedNoteName, {
                        note,
                        octave,
                        startTime: Tone.now()
                    });
                    activeTouches.set(touch.identifier, { key, note, octave, noteName });
                    updateKeyVisual(playedNoteName, true);
                }
            }
        }, { passive: false });

        key.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (state.inputMode !== 'touch') return;

            const touches = e.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                const activeTouch = activeTouches.get(touch.identifier);
                if (activeTouch) {
                    const stoppedNoteName = stopNote(activeTouch.note, activeTouch.octave);
                    activeKeys.delete(stoppedNoteName);
                    activeTouches.delete(touch.identifier);
                    updateKeyVisual(stoppedNoteName, false);
                }
            }
        }, { passive: false });

        key.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            if (state.inputMode !== 'touch') return;

            const touches = e.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                const activeTouch = activeTouches.get(touch.identifier);
                if (activeTouch) {
                    const stoppedNoteName = stopNote(activeTouch.note, activeTouch.octave);
                    activeKeys.delete(stoppedNoteName);
                    activeTouches.delete(touch.identifier);
                    updateKeyVisual(stoppedNoteName, false);
                }
            }
        }, { passive: false });

        // Mouse events for desktop testing
        key.addEventListener('mousedown', (e) => {
            if (state.inputMode !== 'touch') return;

            const note = key.dataset.note;
            const octave = parseInt(key.dataset.octave);
            const noteName = key.dataset.noteName;

            if (!activeKeys.has(noteName)) {
                const playedNoteName = playNote(note, octave);
                activeKeys.set(playedNoteName, {
                    note,
                    octave,
                    startTime: Tone.now()
                });

                // Store for mouse release
                key.dataset.activeNote = playedNoteName;

                updateKeyVisual(playedNoteName, true);
            }
        });

        key.addEventListener('mouseup', (e) => {
            if (state.inputMode !== 'touch') return;

            const noteName = key.dataset.activeNote;
            if (noteName && activeKeys.has(noteName)) {
                const [note, octave] = parseNoteName(noteName);
                const stoppedNoteName = stopNote(note, parseInt(octave));
                activeKeys.delete(stoppedNoteName);
                delete key.dataset.activeNote;
                updateKeyVisual(stoppedNoteName, false);
            }
        });
    });
}

// =========================
// Recording Feature
// =========================

function initRecording() {
    const recordBtn = document.getElementById('record-btn');
    const stopBtn = document.getElementById('stop-btn');

    recordBtn.addEventListener('click', async () => {
        // Ensure audio context is started
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        // Create recorder
        state.recorder = new Tone.Recorder(masterChain);
        state.recordedNotes = [];
        state.isRecording = true;

        // Start recording
        await state.recorder.start();

        // Update UI
        recordBtn.classList.add('recording');
        recordBtn.textContent = 'Recording...';
        stopBtn.disabled = false;

        // Log start time for note tracking
        state.recordingStartTime = Tone.now();
    });

    stopBtn.addEventListener('click', async () => {
        if (!state.isRecording || !state.recorder) return;

        // Stop recording
        const recordedBuffer = await state.recorder.stop();
        state.isRecording = false;

        // Update UI
        recordBtn.classList.remove('recording');
        recordBtn.textContent = 'Record';
        stopBtn.disabled = true;

        // Convert to WAV and download
        downloadWav(recordedBuffer);
    });
}

async function downloadWav(audioBuffer) {
    const samples = audioBuffer.getChannelData(0);
    const wavData = encodeWav(samples);
    const blob = new Blob([wavData], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `vibe-piano-recording-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    URL.revokeObjectURL(url);
}

function encodeWav(samples) {
    const bufferSize = samples.length * 2; // 16-bit
    const buffer = new ArrayBuffer(44 + bufferSize);
    const view = new DataView(buffer);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bufferSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, 44100, true); // Sample rate
    view.setUint32(28, 44100 * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeString(view, 36, 'data');
    view.setUint32(40, bufferSize, true);

    // Write audio samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
    }

    return buffer;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// =========================
// Control Handlers
// =========================

function initControls() {
    // Instrument selector
    document.getElementById('instrument-select').addEventListener('change', () => {
        // Clear and reinitialize synths with new instrument
        activeSynths.forEach((synth) => {
            if (synth && typeof synth.dispose === 'function') {
                synth.dispose();
            }
        });
        activeSynths.clear();

        // Stop any playing notes
        const now = Tone.now();
        activeKeys.forEach((keyData, noteName) => {
            const [note, octave] = parseNoteName(noteName);
            stopNote(note, parseInt(octave));
        });
        activeKeys.clear();
        updateAllKeyVisuals();
    });

    // Input mode selector
    document.getElementById('input-mode-select').addEventListener('change', (e) => {
        state.inputMode = e.target.value;
    });

    // Visual feedback selector
    document.getElementById('visual-feedback-select').addEventListener('change', (e) => {
        state.visualFeedback = e.target.value;

        // Update all active keys
        const visibleNotes = getVisibleNotes();
        visibleNotes.forEach(noteName => {
            const key = document.getElementById(`key-${noteName}`);
            if (key) {
                key.classList.remove('color-mode', 'depress-mode');
                if (activeKeys.has(noteName)) {
                    key.classList.add(`${state.visualFeedback}-mode`);
                }
            }
        });
    });
}

// =========================
// Resize Observer
// =========================

function initResizeObserver() {
    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.target.classList.contains('piano-container')) {
                const isNarrow = entry.contentRect.width < 600;
                if (isNarrow !== (window.innerWidth < 600)) {
                    generateKeys();
                }
            }
        }
    });

    resizeObserver.observe(document.getElementById('piano-container'));
}

// =========================
// Initialization
// =========================

function init() {
    // Generate initial keys
    generateKeys();

    // Initialize ribbon navigation
    initRibbonNavigation();

    // Initialize controls
    initControls();

    // Initialize input handlers
    initHardwareKeyboard();
    initTouchInput();

    // Initialize recording
    initRecording();

    // Initialize resize observer
    initResizeObserver();

    // Start overlay
    const startOverlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('start-btn');

    startBtn.addEventListener('click', async () => {
        await initAudio();
        startOverlay.style.opacity = '0';
        setTimeout(() => {
            startOverlay.style.display = 'none';
        }, 500);
    });
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
