/* ========================================================
   Glass Piano - 5-Octave Polyphonic Synthesizer
   ======================================================== */

(() => {
  "use strict";

  // ── Constants ──
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const WHITE_INDICES = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
  const BLACK_INDICES = [1, 3, 6, 8, 10];        // C# D# F# G# A#
  const BLACK_POSITIONS = [0, 1, 3, 4, 5];        // after which white key (0-indexed)
  const TOTAL_OCTAVES = 5;
  const START_OCTAVE = 2; // C2 through B6

  // Keyboard mappings: white keys row, black keys row
  const WHITE_KEYS_MAP = ["a", "s", "d", "f", "g", "h", "j"];
  const BLACK_KEYS_MAP = ["w", "e", null, "t", "y", "u"];
  // black keys: C#->W, D#->E, (skip E#), F#->T, G#->Y, A#->U

  // ── State ──
  let visibleStart = 1; // index into octave array (0-based), default show octave 3 (index 1)
  let octavesVisible = 1;
  let inputMode = "keyboard"; // "keyboard" | "touch"
  let feedbackStyle = "color"; // "color" | "depress"
  let synth = null;
  let currentPreset = "fender-rhodes";
  let isRecording = false;
  let mediaRecorder = null;
  let recordedChunks = [];
  let activeNotes = new Map(); // note -> count of active triggers
  let touchMap = new Map();    // touchId -> note

  // ── DOM refs ──
  const overlay = document.getElementById("start-overlay");
  const startBtn = document.getElementById("start-btn");
  const instrumentSelect = document.getElementById("instrument-select");
  const pianoKeys = document.getElementById("piano-keys");
  const ribbonLabel = document.getElementById("ribbon-label");
  const ribbonLeft = document.getElementById("ribbon-left");
  const ribbonRight = document.getElementById("ribbon-right");
  const ribbon = document.getElementById("ribbon");
  const recordBtn = document.getElementById("record-btn");
  const stopBtn = document.getElementById("stop-btn");
  const pianoViewport = document.getElementById("piano-viewport");

  // ── Audio Context Init ──
  startBtn.addEventListener("click", async () => {
    await Tone.start();
    overlay.classList.add("hidden");
    initSynth();
  });

  // ── Instrument Presets ──
  function createSynth(preset) {
    // Dispose old synth
    if (synth) {
      synth.disconnect();
      synth.dispose();
    }

    let s;
    switch (preset) {
      case "fender-rhodes": {
        s = new Tone.PolySynth(Tone.FMSynth, {
          maxPolyphony: 16,
          voice: Tone.FMSynth,
          options: {
            harmonicity: 3.01,
            modulationIndex: 0.8,
            oscillator: { type: "sine" },
            modulation: { type: "triangle" },
            envelope: { attack: 0.005, decay: 0.8, sustain: 0.3, release: 1.2 },
            modulationEnvelope: { attack: 0.002, decay: 0.5, sustain: 0.2, release: 0.8 }
          }
        });
        const trem = new Tone.Tremolo(3.5, 0.3).start();
        const eq = new Tone.EQ3(-2, 1, -4);
        s.chain(trem, eq, Tone.Destination);
        return s;
      }

      case "wurlitzer": {
        s = new Tone.PolySynth(Tone.FMSynth, {
          maxPolyphony: 16,
          options: {
            harmonicity: 2,
            modulationIndex: 1.5,
            oscillator: { type: "sine" },
            modulation: { type: "square" },
            envelope: { attack: 0.001, decay: 0.6, sustain: 0.15, release: 0.8 },
            modulationEnvelope: { attack: 0.001, decay: 0.4, sustain: 0.1, release: 0.5 }
          }
        });
        const dist = new Tone.Distortion(0.08);
        const trem = new Tone.Tremolo(5, 0.4).start();
        s.chain(dist, trem, Tone.Destination);
        return s;
      }

      case "cp70": {
        s = new Tone.PolySynth(Tone.Synth, {
          maxPolyphony: 16,
          options: {
            oscillator: { type: "triangle8" },
            envelope: { attack: 0.003, decay: 1.5, sustain: 0.1, release: 1.8 }
          }
        });
        const rev = new Tone.Reverb({ decay: 2.5, wet: 0.25 });
        const comp = new Tone.Compressor(-20, 4);
        s.chain(comp, rev, Tone.Destination);
        return s;
      }

      case "cp80": {
        s = new Tone.PolySynth(Tone.FMSynth, {
          maxPolyphony: 16,
          options: {
            harmonicity: 1.5,
            modulationIndex: 0.4,
            oscillator: { type: "triangle" },
            modulation: { type: "sine" },
            envelope: { attack: 0.002, decay: 1.8, sustain: 0.12, release: 2.0 },
            modulationEnvelope: { attack: 0.002, decay: 1.0, sustain: 0.1, release: 1.5 }
          }
        });
        const rev = new Tone.Reverb({ decay: 3, wet: 0.3 });
        s.chain(rev, Tone.Destination);
        return s;
      }

      case "clavinet": {
        s = new Tone.PolySynth(Tone.Synth, {
          maxPolyphony: 16,
          options: {
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.15 }
          }
        });
        const filt = new Tone.AutoFilter({ frequency: 4, depth: 0.5 }).start();
        const dist = new Tone.Distortion(0.15);
        s.chain(dist, filt, Tone.Destination);
        return s;
      }

      case "pianet": {
        s = new Tone.PolySynth(Tone.FMSynth, {
          maxPolyphony: 16,
          options: {
            harmonicity: 5,
            modulationIndex: 1.2,
            oscillator: { type: "sine" },
            modulation: { type: "sine" },
            envelope: { attack: 0.001, decay: 0.9, sustain: 0.05, release: 0.7 },
            modulationEnvelope: { attack: 0.001, decay: 0.6, sustain: 0.05, release: 0.4 }
          }
        });
        const trem = new Tone.Tremolo(4.5, 0.35).start();
        s.chain(trem, Tone.Destination);
        return s;
      }

      case "juno106": {
        s = new Tone.PolySynth(Tone.Synth, {
          maxPolyphony: 16,
          options: {
            oscillator: { type: "pwm", modulationFrequency: 0.8 },
            envelope: { attack: 0.08, decay: 0.6, sustain: 0.6, release: 0.9 }
          }
        });
        const chorus = new Tone.Chorus(1.5, 3.5, 0.7).start();
        const filt = new Tone.Filter(3000, "lowpass");
        s.chain(filt, chorus, Tone.Destination);
        return s;
      }

      case "rmi-electra": {
        s = new Tone.PolySynth(Tone.Synth, {
          maxPolyphony: 16,
          options: {
            oscillator: { type: "square8" },
            envelope: { attack: 0.005, decay: 1.0, sustain: 0.3, release: 1.0 }
          }
        });
        const filt = new Tone.Filter(2500, "lowpass");
        const rev = new Tone.Reverb({ decay: 2, wet: 0.2 });
        s.chain(filt, rev, Tone.Destination);
        return s;
      }

      case "dx7-organ": {
        s = new Tone.PolySynth(Tone.FMSynth, {
          maxPolyphony: 16,
          options: {
            harmonicity: 1,
            modulationIndex: 3,
            oscillator: { type: "sine" },
            modulation: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0.9, release: 0.15 },
            modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.1 }
          }
        });
        const vib = new Tone.Vibrato(5.5, 0.08);
        s.chain(vib, Tone.Destination);
        return s;
      }

      case "nord-grand": {
        s = new Tone.PolySynth(Tone.FMSynth, {
          maxPolyphony: 16,
          options: {
            harmonicity: 2,
            modulationIndex: 0.5,
            oscillator: { type: "triangle" },
            modulation: { type: "sine" },
            envelope: { attack: 0.002, decay: 2.5, sustain: 0.15, release: 3.0 },
            modulationEnvelope: { attack: 0.002, decay: 1.5, sustain: 0.1, release: 2.0 }
          }
        });
        const rev = new Tone.Reverb({ decay: 3.5, wet: 0.3 });
        const comp = new Tone.Compressor(-18, 3);
        const eq = new Tone.EQ3(1, 0, -2);
        s.chain(comp, eq, rev, Tone.Destination);
        return s;
      }

      default: {
        s = new Tone.PolySynth(Tone.Synth, { maxPolyphony: 16 });
        s.toDestination();
        return s;
      }
    }
  }

  function initSynth() {
    synth = createSynth(currentPreset);
  }

  // ── Build Piano Keys ──
  function buildPiano() {
    pianoKeys.innerHTML = "";

    for (let oct = 0; oct < TOTAL_OCTAVES; oct++) {
      const octNum = START_OCTAVE + oct;
      const group = document.createElement("div");
      group.classList.add("octave-group");
      group.dataset.octave = octNum;

      // White keys
      for (let w = 0; w < 7; w++) {
        const noteIdx = WHITE_INDICES[w];
        const noteName = NOTE_NAMES[noteIdx] + octNum;
        const key = document.createElement("div");
        key.classList.add("key", "key-white");
        key.dataset.note = noteName;

        const label = document.createElement("span");
        label.classList.add("key-label");
        label.textContent = noteName;
        key.appendChild(label);

        const hint = document.createElement("span");
        hint.classList.add("key-hint");
        key.appendChild(hint);

        group.appendChild(key);
      }

      // Black keys
      for (let b = 0; b < BLACK_INDICES.length; b++) {
        const noteIdx = BLACK_INDICES[b];
        const noteName = NOTE_NAMES[noteIdx] + octNum;
        const key = document.createElement("div");
        key.classList.add("key", "key-black");
        key.dataset.note = noteName;

        // Position black keys
        const whiteKeyWidth = 100 / 7; // percentage
        const pos = BLACK_POSITIONS[b];
        const leftPercent = (pos + 1) * whiteKeyWidth - (whiteKeyWidth * 0.58) / 2;
        key.style.left = leftPercent + "%";

        const hint = document.createElement("span");
        hint.classList.add("key-hint");
        key.appendChild(hint);

        group.appendChild(key);
      }

      pianoKeys.appendChild(group);
    }

    updateLayout();
  }

  // ── Layout: determine octaves visible, size groups ──
  function updateLayout() {
    const vw = pianoViewport.offsetWidth;
    octavesVisible = vw <= 600 ? 1 : 2;

    // Clamp visibleStart
    const maxStart = TOTAL_OCTAVES - octavesVisible;
    if (visibleStart > maxStart) visibleStart = maxStart;
    if (visibleStart < 0) visibleStart = 0;

    // Size each octave group to fill viewport evenly
    const groupWidth = vw / octavesVisible;
    const groups = pianoKeys.querySelectorAll(".octave-group");
    groups.forEach((g) => {
      g.style.width = groupWidth + "px";
    });

    // Slide
    slideToOctave();
    updateRibbon();
    updateKeyHints();
  }

  function slideToOctave() {
    const vw = pianoViewport.offsetWidth;
    const groupWidth = vw / octavesVisible;
    pianoKeys.style.transform = `translateX(-${visibleStart * groupWidth}px)`;
  }

  function updateRibbon() {
    const startOct = START_OCTAVE + visibleStart;
    const endOct = START_OCTAVE + visibleStart + octavesVisible - 1;
    if (octavesVisible === 1) {
      ribbonLabel.textContent = `C${startOct} \u2013 B${startOct}`;
    } else {
      ribbonLabel.textContent = `C${startOct} \u2013 B${endOct}`;
    }
  }

  function shiftOctave(dir) {
    const maxStart = TOTAL_OCTAVES - octavesVisible;
    visibleStart = Math.max(0, Math.min(maxStart, visibleStart + dir));
    slideToOctave();
    updateRibbon();
    updateKeyHints();
  }

  // ── Keyboard Hints ──
  function updateKeyHints() {
    // Clear all hints and classes
    document.querySelectorAll(".octave-group").forEach((g) => {
      g.classList.remove("first-octave", "second-octave");
    });

    const groups = pianoKeys.querySelectorAll(".octave-group");
    groups.forEach((g) => {
      g.querySelectorAll(".key-hint").forEach((h) => (h.textContent = ""));
    });

    // Mark visible octaves
    const firstGroup = groups[visibleStart];
    if (firstGroup) {
      firstGroup.classList.add("first-octave");
      assignHints(firstGroup, 0);
    }
    if (octavesVisible >= 2 && groups[visibleStart + 1]) {
      const secondGroup = groups[visibleStart + 1];
      secondGroup.classList.add("second-octave");
      assignHints(secondGroup, 1);
    }
  }

  function assignHints(group, octaveOffset) {
    const whites = group.querySelectorAll(".key-white");
    const blacks = group.querySelectorAll(".key-black");

    // For second visible octave, use shifted keys
    const wMap = octaveOffset === 0 ? WHITE_KEYS_MAP : ["k", "l", ";", "'", null, null, null];
    const bMap = octaveOffset === 0 ? ["w", "e", "t", "y", "u"] : ["o", "p", null, null, null];

    whites.forEach((k, i) => {
      const hint = k.querySelector(".key-hint");
      if (hint && wMap[i]) hint.textContent = wMap[i].toUpperCase();
    });
    blacks.forEach((k, i) => {
      const hint = k.querySelector(".key-hint");
      if (hint && bMap[i]) hint.textContent = bMap[i].toUpperCase();
    });
  }

  // ── Note Trigger ──
  function noteOn(note) {
    if (!synth) return;
    const count = activeNotes.get(note) || 0;
    activeNotes.set(note, count + 1);
    if (count === 0) {
      synth.triggerAttack(note, Tone.now());
      const el = document.querySelector(`.key[data-note="${note}"]`);
      if (el) el.classList.add("active");
    }
  }

  function noteOff(note) {
    if (!synth) return;
    const count = activeNotes.get(note) || 0;
    if (count <= 1) {
      activeNotes.delete(note);
      synth.triggerRelease(note, Tone.now());
      const el = document.querySelector(`.key[data-note="${note}"]`);
      if (el) el.classList.remove("active");
    } else {
      activeNotes.set(note, count - 1);
    }
  }

  // ── Hardware Keyboard ──
  const keyboardState = new Set();

  // Build mapping for first visible octave
  function getKeyMap() {
    const map = {};
    const groups = pianoKeys.querySelectorAll(".octave-group");
    const g1 = groups[visibleStart];
    if (!g1) return map;

    const whites1 = g1.querySelectorAll(".key-white");
    const blacks1 = g1.querySelectorAll(".key-black");

    WHITE_KEYS_MAP.forEach((k, i) => {
      if (k && whites1[i]) map[k] = whites1[i].dataset.note;
    });

    const bKeys = ["w", "e", "t", "y", "u"];
    bKeys.forEach((k, i) => {
      if (k && blacks1[i]) map[k] = blacks1[i].dataset.note;
    });

    // Second octave
    if (octavesVisible >= 2 && groups[visibleStart + 1]) {
      const g2 = groups[visibleStart + 1];
      const whites2 = g2.querySelectorAll(".key-white");
      const blacks2 = g2.querySelectorAll(".key-black");

      const wMap2 = ["k", "l", ";", "'"];
      wMap2.forEach((k, i) => {
        if (k && whites2[i]) map[k] = whites2[i].dataset.note;
      });

      const bMap2 = ["o", "p"];
      bMap2.forEach((k, i) => {
        if (k && blacks2[i]) map[k] = blacks2[i].dataset.note;
      });
    }

    return map;
  }

  document.addEventListener("keydown", (e) => {
    if (inputMode !== "keyboard" || e.repeat) return;

    const key = e.key.toLowerCase();

    if (key === "arrowup") {
      e.preventDefault();
      shiftOctave(-1);
      return;
    }
    if (key === "arrowdown") {
      e.preventDefault();
      shiftOctave(1);
      return;
    }

    const map = getKeyMap();
    if (map[key] && !keyboardState.has(key)) {
      keyboardState.add(key);
      noteOn(map[key]);
    }
  });

  document.addEventListener("keyup", (e) => {
    if (inputMode !== "keyboard") return;
    const key = e.key.toLowerCase();
    const map = getKeyMap();
    if (map[key] && keyboardState.has(key)) {
      keyboardState.delete(key);
      noteOff(map[key]);
    }
  });

  // ── Touch / Mouse Mode ──
  pianoViewport.addEventListener("mousedown", (e) => {
    if (inputMode !== "touch") return;
    const key = e.target.closest(".key");
    if (key) {
      noteOn(key.dataset.note);
      const handleUp = () => {
        noteOff(key.dataset.note);
        document.removeEventListener("mouseup", handleUp);
      };
      document.addEventListener("mouseup", handleUp);
    }
  });

  pianoViewport.addEventListener("touchstart", (e) => {
    if (inputMode !== "touch") return;
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const key = el && el.closest(".key");
      if (key) {
        touchMap.set(touch.identifier, key.dataset.note);
        noteOn(key.dataset.note);
      }
    }
  }, { passive: false });

  pianoViewport.addEventListener("touchend", (e) => {
    if (inputMode !== "touch") return;
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const note = touchMap.get(touch.identifier);
      if (note) {
        noteOff(note);
        touchMap.delete(touch.identifier);
      }
    }
  }, { passive: false });

  pianoViewport.addEventListener("touchcancel", (e) => {
    if (inputMode !== "touch") return;
    for (const touch of e.changedTouches) {
      const note = touchMap.get(touch.identifier);
      if (note) {
        noteOff(note);
        touchMap.delete(touch.identifier);
      }
    }
  });

  // ── Ribbon Swipe ──
  let ribbonDragStartX = null;

  ribbon.addEventListener("mousedown", (e) => {
    ribbonDragStartX = e.clientX;
  });
  document.addEventListener("mousemove", (e) => {
    // no-op, we only care about end
  });
  document.addEventListener("mouseup", (e) => {
    if (ribbonDragStartX !== null) {
      const dx = e.clientX - ribbonDragStartX;
      if (Math.abs(dx) > 30) {
        shiftOctave(dx < 0 ? 1 : -1);
      }
      ribbonDragStartX = null;
    }
  });

  let ribbonTouchStartX = null;
  ribbon.addEventListener("touchstart", (e) => {
    ribbonTouchStartX = e.touches[0].clientX;
  }, { passive: true });
  ribbon.addEventListener("touchend", (e) => {
    if (ribbonTouchStartX !== null) {
      const dx = e.changedTouches[0].clientX - ribbonTouchStartX;
      if (Math.abs(dx) > 30) {
        shiftOctave(dx < 0 ? 1 : -1);
      }
      ribbonTouchStartX = null;
    }
  }, { passive: true });

  ribbonLeft.addEventListener("click", () => shiftOctave(-1));
  ribbonRight.addEventListener("click", () => shiftOctave(1));

  // ── Controls ──
  instrumentSelect.addEventListener("change", (e) => {
    currentPreset = e.target.value;
    // Release all active notes
    activeNotes.forEach((_, note) => {
      synth.triggerRelease(note, Tone.now());
      const el = document.querySelector(`.key[data-note="${note}"]`);
      if (el) el.classList.remove("active");
    });
    activeNotes.clear();
    keyboardState.clear();
    synth = createSynth(currentPreset);
  });

  // Input mode toggles
  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-mode]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      inputMode = btn.dataset.mode;
      document.body.classList.toggle("keyboard-mode", inputMode === "keyboard");
      // Release all
      activeNotes.forEach((_, note) => {
        synth && synth.triggerRelease(note, Tone.now());
        const el = document.querySelector(`.key[data-note="${note}"]`);
        if (el) el.classList.remove("active");
      });
      activeNotes.clear();
      keyboardState.clear();
      touchMap.clear();
    });
  });

  // Feedback toggles
  document.querySelectorAll("[data-feedback]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-feedback]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      feedbackStyle = btn.dataset.feedback;
      document.body.classList.remove("feedback-color", "feedback-depress");
      document.body.classList.add("feedback-" + feedbackStyle);
    });
  });

  // ── Recording ──
  recordBtn.addEventListener("click", startRecording);
  stopBtn.addEventListener("click", stopRecording);

  function startRecording() {
    const dest = Tone.context.createMediaStreamDestination();
    Tone.Destination.connect(dest);

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(dest.stream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      exportWav();
      Tone.Destination.disconnect(dest);
    };

    mediaRecorder.start();
    isRecording = true;
    recordBtn.classList.add("recording");
    recordBtn.textContent = "Recording...";
    stopBtn.disabled = false;
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    isRecording = false;
    recordBtn.classList.remove("recording");
    recordBtn.textContent = "Record";
    stopBtn.disabled = true;
  }

  async function exportWav() {
    const blob = new Blob(recordedChunks, { type: "audio/webm" });

    // Decode to AudioBuffer, then encode as WAV
    const arrayBuffer = await blob.arrayBuffer();
    try {
      const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
      const wavBlob = audioBufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "glass-piano-recording.wav";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback: download as webm if WAV encoding fails
      console.warn("WAV encoding failed, downloading as webm:", err);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "glass-piano-recording.webm";
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    // Interleave channels
    let interleaved;
    if (numChannels === 1) {
      interleaved = buffer.getChannelData(0);
    } else {
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      interleaved = new Float32Array(left.length + right.length);
      for (let i = 0, j = 0; i < left.length; i++) {
        interleaved[j++] = left[i];
        interleaved[j++] = right[i];
      }
    }

    const dataLength = interleaved.length * (bitDepth / 8);
    const headerLength = 44;
    const totalLength = headerLength + dataLength;
    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    writeString(view, 0, "RIFF");
    view.setUint32(4, totalLength - 8, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, "data");
    view.setUint32(40, dataLength, true);

    // Write samples
    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
      let sample = Math.max(-1, Math.min(1, interleaved[i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  }

  function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // ── Resize Observer ──
  const ro = new ResizeObserver(() => {
    updateLayout();
  });
  ro.observe(pianoViewport);

  // ── Init ──
  document.body.classList.add("feedback-color", "keyboard-mode");
  buildPiano();
})();
