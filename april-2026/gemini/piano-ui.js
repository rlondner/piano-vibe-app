class PianoUI {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.container = document.getElementById('piano-keys');
        this.ribbon = document.getElementById('octave-ribbon');
        this.rangeDisplay = document.getElementById('current-range');
        this.octaves = 5;
        this.startOctave = 2; // C2
        this.currentViewOffset = 0; // Number of white keys to scroll
        this.feedbackStyle = 'color';
        this.inputMode = 'touch';
        this.activeNotes = new Set();

        this.notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.keys = [];

        this.init();
    }

    init() {
        this.generateKeys();
        this.setupTouchEvents();
        this.setupKeyboardEvents();
        this.setupRibbonEvents();
        window.addEventListener('resize', () => this.updateView());
        this.updateView();
    }

    generateKeys() {
        this.container.innerHTML = '';
        for (let i = 0; i < this.octaves; i++) {
            const oct = this.startOctave + i;
            this.notes.forEach(note => {
                const keyName = note + oct;
                const isBlack = note.includes('#');
                const keyEl = document.createElement('div');
                keyEl.className = `key ${isBlack ? 'black' : 'white'}`;
                keyEl.dataset.note = keyName;
                this.container.appendChild(keyEl);
                this.keys.push(keyEl);
            });
        }
        // Final C7 key
        const finalKey = document.createElement('div');
        finalKey.className = 'key white';
        finalKey.dataset.note = `C${this.startOctave + this.octaves}`;
        this.container.appendChild(finalKey);
        this.keys.push(finalKey);
    }

    setupTouchEvents() {
        const handleStart = (e) => {
            e.preventDefault();
            const touches = e.changedTouches || [e];
            for (let touch of touches) {
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                if (el && el.classList.contains('key')) {
                    this.noteOn(el.dataset.note);
                    touch._lastNote = el.dataset.note;
                }
            }
        };

        const handleMove = (e) => {
            e.preventDefault();
            if (this.inputMode === 'hardware') return;
            const touches = e.changedTouches || [e];
            for (let touch of touches) {
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                if (el && el.classList.contains('key')) {
                    const newNote = el.dataset.note;
                    if (touch._lastNote && touch._lastNote !== newNote) {
                        this.noteOff(touch._lastNote);
                        this.noteOn(newNote);
                        touch._lastNote = newNote;
                    }
                }
            }
        };

        const handleEnd = (e) => {
            e.preventDefault();
            const touches = e.changedTouches || [e];
            for (let touch of touches) {
                if (touch._lastNote) {
                    this.noteOff(touch._lastNote);
                    delete touch._lastNote;
                }
            }
        };

        this.container.addEventListener('touchstart', handleStart, { passive: false });
        this.container.addEventListener('touchmove', handleMove, { passive: false });
        this.container.addEventListener('touchend', handleEnd, { passive: false });
        this.container.addEventListener('touchcancel', handleEnd, { passive: false });

        // Mouse Fallback
        let isMouseDown = false;
        this.container.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            handleStart(e);
        });
        window.addEventListener('mousemove', (e) => {
            if (isMouseDown) handleMove(e);
        });
        window.addEventListener('mouseup', (e) => {
            if (isMouseDown) {
                isMouseDown = false;
                handleEnd(e);
            }
        });
    }

    setupKeyboardEvents() {
        const keyMap = {
            'a': 'C', 'w': 'C#', 's': 'D', 'e': 'D#', 'd': 'E', 'f': 'F', 't': 'F#', 
            'g': 'G', 'y': 'G#', 'h': 'A', 'u': 'A#', 'j': 'B', 'k': 'C'
        };

        window.addEventListener('keydown', (e) => {
            if (this.inputMode !== 'hardware') return;
            if (e.repeat) return;

            const noteBase = keyMap[e.key.toLowerCase()];
            if (noteBase) {
                // Map to lowest visible octave
                const oct = this.getVisibleOctave();
                const note = noteBase === 'C' && e.key === 'k' ? `C${oct + 1}` : `${noteBase}${oct}`;
                this.noteOn(note);
            }

            if (e.key === 'ArrowUp') this.shiftView(1);
            if (e.key === 'ArrowDown') this.shiftView(-1);
        });

        window.addEventListener('keyup', (e) => {
            if (this.inputMode !== 'hardware') return;
            const noteBase = keyMap[e.key.toLowerCase()];
            if (noteBase) {
                const oct = this.getVisibleOctave();
                const note = noteBase === 'C' && e.key === 'k' ? `C${oct + 1}` : `${noteBase}${oct}`;
                this.noteOff(note);
            }
        });
    }

    setupRibbonEvents() {
        let startX, currentOffset;
        const ribbonContainer = document.querySelector('.ribbon-container');

        const handleStart = (e) => {
            startX = (e.touches ? e.touches[0].clientX : e.clientX);
            currentOffset = this.currentViewOffset;
        };

        const handleMove = (e) => {
            if (startX === undefined) return;
            const x = (e.touches ? e.touches[0].clientX : e.clientX);
            const diff = x - startX;
            // Sensitivity: 1 white key per 50px
            const shift = Math.floor(diff / 50);
            if (shift !== 0) {
                this.shiftView(-shift);
                startX = x; // Reset to allow continuous swipe
            }
        };

        const handleEnd = () => {
            startX = undefined;
        };

        ribbonContainer.addEventListener('touchstart', handleStart);
        ribbonContainer.addEventListener('touchmove', handleMove);
        ribbonContainer.addEventListener('touchend', handleEnd);
        ribbonContainer.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);

        document.querySelector('.ribbon-arrow.left').onclick = () => this.shiftView(-1);
        document.querySelector('.ribbon-arrow.right').onclick = () => this.shiftView(1);
    }

    noteOn(note) {
        if (this.activeNotes.has(note)) return;
        this.activeNotes.add(note);
        this.audioEngine.triggerAttack(note);
        const el = this.container.querySelector(`[data-note="${note}"]`);
        if (el) el.classList.add(`active-${this.feedbackStyle}`);
    }

    noteOff(note) {
        if (!this.activeNotes.has(note)) return;
        this.activeNotes.delete(note);
        this.audioEngine.triggerRelease(note);
        const el = this.container.querySelector(`[data-note="${note}"]`);
        if (el) el.classList.remove(`active-color`, `active-depress`);
    }

    getVisibleOctave() {
        // Return the octave currently at the start of the viewport
        const whiteKeysPerOctave = 7;
        return this.startOctave + Math.floor(this.currentViewOffset / whiteKeysPerOctave);
    }

    shiftView(delta) {
        const whiteKeysPerOctave = 7;
        const totalWhiteKeys = (this.octaves * 7) + 1;
        const visibleWhiteKeys = (window.innerWidth > window.innerHeight) ? 14 : 7;
        
        this.currentViewOffset = Math.max(0, Math.min(totalWhiteKeys - visibleWhiteKeys, this.currentViewOffset + delta));
        this.updateView();
    }

    updateView() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const whiteKeyWidth = window.innerWidth / (isLandscape ? 14 : 7);
        const translateX = -this.currentViewOffset * whiteKeyWidth;
        this.container.style.transform = `translateX(${translateX}px)`;
        
        const startNote = this.getNoteFromWhiteOffset(this.currentViewOffset);
        const endNote = this.getNoteFromWhiteOffset(this.currentViewOffset + (isLandscape ? 14 : 7) - 1);
        this.rangeDisplay.innerText = `Range: ${startNote} - ${endNote}`;
    }

    getNoteFromWhiteOffset(offset) {
        const oct = this.startOctave + Math.floor(offset / 7);
        const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        return whiteNotes[offset % 7] + oct;
    }
}

window.PianoUI = PianoUI;
