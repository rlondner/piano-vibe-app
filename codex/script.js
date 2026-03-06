const TOTAL_OCTAVES = 5;
const FIRST_OCTAVE = 2;
const OCTAVES = Array.from({ length: TOTAL_OCTAVES }, (_, i) => FIRST_OCTAVE + i);
const WHITE_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_NOTES = ["C#", "D#", "F#", "G#", "A#"];
const BLACK_INDEX_MAP = [0, 1, 3, 4, 5];

const presetFactories = {
  "Fender Rhodes": () => {
    const synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.1,
      modulationIndex: 11,
      envelope: { attack: 0.008, decay: 0.9, sustain: 0.25, release: 1.8 },
      modulation: { type: "sine" },
      modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1.2 }
    }).set({ volume: -8 });
    const chorus = new Tone.Chorus(4, 2.4, 0.3).start();
    const delay = new Tone.FeedbackDelay("8n", 0.18);
    synth.chain(chorus, delay, Tone.Destination);
    return { synth, nodes: [chorus, delay] };
  },
  "Wurlitzer Electronic Piano": () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.002, decay: 0.35, sustain: 0.2, release: 1.1 }
    }).set({ volume: -7 });
    const tremolo = new Tone.Tremolo(7.5, 0.37).start();
    const drive = new Tone.Distortion(0.08);
    synth.chain(tremolo, drive, Tone.Destination);
    return { synth, nodes: [tremolo, drive] };
  },
  "Yamaha CP-70": () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle2" },
      envelope: { attack: 0.003, decay: 0.45, sustain: 0.28, release: 1.3 }
    }).set({ volume: -9 });
    const eq = new Tone.EQ3(-2, 1.5, 3);
    const reverb = new Tone.Freeverb({ roomSize: 0.65, dampening: 3200 });
    synth.chain(eq, reverb, Tone.Destination);
    return { synth, nodes: [eq, reverb] };
  },
  "Yamaha CP-80": () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle4" },
      envelope: { attack: 0.004, decay: 0.6, sustain: 0.33, release: 1.9 }
    }).set({ volume: -10 });
    const chorus = new Tone.Chorus(1.5, 1.3, 0.25).start();
    const reverb = new Tone.Freeverb({ roomSize: 0.78, dampening: 2600 });
    synth.chain(chorus, reverb, Tone.Destination);
    return { synth, nodes: [chorus, reverb] };
  },
  "Hohner Clavinet": () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0.04, release: 0.22 }
    }).set({ volume: -10 });
    const autoWah = new Tone.AutoWah(80, 5.5, -28);
    const comp = new Tone.Compressor(-20, 4);
    synth.chain(autoWah, comp, Tone.Destination);
    return { synth, nodes: [autoWah, comp] };
  },
  "Hohner Pianet": () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.002, decay: 0.2, sustain: 0.1, release: 0.45 }
    }).set({ volume: -9 });
    const filter = new Tone.Filter(2100, "lowpass", -24);
    const comp = new Tone.Compressor(-24, 3);
    synth.chain(filter, comp, Tone.Destination);
    return { synth, nodes: [filter, comp] };
  },
  "Juno 106": () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.04, decay: 0.35, sustain: 0.45, release: 0.75 }
    }).set({ volume: -10 });
    const filter = new Tone.Filter(1200, "lowpass", -12);
    const chorus = new Tone.Chorus(0.8, 2.2, 0.45).start();
    synth.chain(filter, chorus, Tone.Destination);
    return { synth, nodes: [filter, chorus] };
  },
  "RMI Electra-piano": () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "square" },
      envelope: { attack: 0.001, decay: 0.16, sustain: 0.12, release: 0.32 }
    }).set({ volume: -12 });
    const crush = new Tone.BitCrusher(5);
    const highpass = new Tone.Filter(220, "highpass", -24);
    synth.chain(crush, highpass, Tone.Destination);
    return { synth, nodes: [crush, highpass] };
  },
  "Yamaha DX7 organ": () => {
    const synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.8,
      modulationIndex: 4,
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.9, release: 0.35 },
      modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.9, release: 0.3 }
    }).set({ volume: -10 });
    const chorus = new Tone.Chorus(1.2, 1.7, 0.3).start();
    const delay = new Tone.FeedbackDelay("16n", 0.12);
    synth.chain(chorus, delay, Tone.Destination);
    return { synth, nodes: [chorus, delay] };
  },
  "Clavia Nord Stage 4 Grand Piano": () => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle8" },
      envelope: { attack: 0.004, decay: 0.65, sustain: 0.35, release: 1.6 }
    }).set({ volume: -8 });
    const eq = new Tone.EQ3(1, 1, 3.5);
    const reverb = new Tone.Freeverb({ roomSize: 0.84, dampening: 2800 });
    const comp = new Tone.Compressor(-22, 2.5);
    synth.chain(eq, reverb, comp, Tone.Destination);
    return { synth, nodes: [eq, reverb, comp] };
  }
};

const state = {
  visibleOctaves: 1,
  viewportStart: 0,
  inputMode: "touch",
  visualMode: "color",
  audioStarted: false,
  synthBundle: null,
  heldCounts: new Map(),
  keyboardHeld: new Map(),
  touchHeld: new Map(),
  mouseHeld: new Set(),
  isMouseDown: false,
  recording: false,
  recL: [],
  recR: [],
  recorderNode: null,
  sampleRate: 44100
};

const ui = {
  overlay: document.getElementById("startOverlay"),
  startButton: document.getElementById("startButton"),
  presetSelect: document.getElementById("presetSelect"),
  inputToggle: document.getElementById("inputModeToggle"),
  visualToggle: document.getElementById("visualModeToggle"),
  recordBtn: document.getElementById("recordBtn"),
  stopBtn: document.getElementById("stopBtn"),
  ribbon: document.getElementById("ribbon"),
  rangeLabel: document.getElementById("rangeLabel"),
  pianoKeys: document.getElementById("pianoKeys")
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function computeVisibleOctaves() {
  const portrait = window.matchMedia("(orientation: portrait)").matches;
  if (portrait || window.innerWidth < 820) return 1;
  return 2;
}

function updateViewportRules() {
  const next = computeVisibleOctaves();
  if (next !== state.visibleOctaves) {
    state.visibleOctaves = next;
    const maxStart = TOTAL_OCTAVES - state.visibleOctaves;
    state.viewportStart = clamp(state.viewportStart, 0, maxStart);
    renderPiano();
  }
  updateRangeLabel();
}

function updateRangeLabel() {
  const lowOct = OCTAVES[state.viewportStart];
  const highOct = OCTAVES[state.viewportStart + state.visibleOctaves - 1];
  ui.rangeLabel.textContent = `Current: C${lowOct} - B${highOct}`;
}

function getVisibleNoteRange() {
  const notes = [];
  for (let i = 0; i < state.visibleOctaves; i += 1) {
    const oct = OCTAVES[state.viewportStart + i];
    WHITE_NOTES.forEach((n) => notes.push(`${n}${oct}`));
    BLACK_NOTES.forEach((n) => notes.push(`${n}${oct}`));
  }
  return notes;
}

function isHeld(note) {
  return (state.heldCounts.get(note) || 0) > 0;
}

function pressNote(note, velocity = 0.9) {
  const current = state.heldCounts.get(note) || 0;
  if (current === 0 && state.audioStarted && state.synthBundle) {
    state.synthBundle.synth.triggerAttack(note, Tone.now(), velocity);
  }
  state.heldCounts.set(note, current + 1);
  setNoteVisual(note, true);
}

function releaseNote(note) {
  if (!state.heldCounts.has(note)) return;
  const current = state.heldCounts.get(note);
  if (current <= 1) {
    state.heldCounts.delete(note);
    if (state.audioStarted && state.synthBundle) {
      state.synthBundle.synth.triggerRelease(note, Tone.now());
    }
    setNoteVisual(note, false);
    return;
  }
  state.heldCounts.set(note, current - 1);
}

function setNoteVisual(note, active) {
  const keys = ui.pianoKeys.querySelectorAll(`.key[data-note="${note}"]`);
  keys.forEach((key) => {
    key.classList.remove("color", "depress");
    key.classList.toggle("active", active);
    if (active) key.classList.add(state.visualMode);
  });
}

function renderPiano() {
  const whiteCount = state.visibleOctaves * 7;
  ui.pianoKeys.style.setProperty("--white-key-count", String(whiteCount));

  const whiteLayer = document.createElement("div");
  whiteLayer.className = "white-keys";

  const blackLayer = document.createElement("div");
  blackLayer.className = "black-key-layer";

  for (let octaveOffset = 0; octaveOffset < state.visibleOctaves; octaveOffset += 1) {
    const oct = OCTAVES[state.viewportStart + octaveOffset];

    WHITE_NOTES.forEach((name) => {
      const note = `${name}${oct}`;
      const el = document.createElement("button");
      el.className = "key white-key";
      el.type = "button";
      el.dataset.note = note;
      if (isHeld(note)) {
        el.classList.add("active", state.visualMode);
      }
      whiteLayer.appendChild(el);
    });

    BLACK_NOTES.forEach((name, idx) => {
      const note = `${name}${oct}`;
      const globalWhiteIndex = octaveOffset * 7 + BLACK_INDEX_MAP[idx];
      const leftPct = ((globalWhiteIndex + 1) / whiteCount) * 100;

      const el = document.createElement("button");
      el.className = "key black-key";
      el.type = "button";
      el.dataset.note = note;
      el.style.left = `${leftPct}%`;
      if (isHeld(note)) {
        el.classList.add("active", state.visualMode);
      }
      blackLayer.appendChild(el);
    });
  }

  ui.pianoKeys.innerHTML = "";
  ui.pianoKeys.appendChild(whiteLayer);
  ui.pianoKeys.appendChild(blackLayer);
  ui.pianoKeys.classList.toggle("pointer-locked", state.inputMode === "hardware");

  updateRangeLabel();
}

function shiftViewport(direction) {
  const maxStart = TOTAL_OCTAVES - state.visibleOctaves;
  const next = clamp(state.viewportStart + direction, 0, maxStart);
  if (next === state.viewportStart) return;
  state.viewportStart = next;
  renderPiano();
}

function setInputMode(mode) {
  if (state.inputMode !== mode) {
    state.keyboardHeld.forEach((note) => releaseNote(note));
    state.keyboardHeld.clear();
    state.touchHeld.forEach((note) => releaseNote(note));
    state.touchHeld.clear();
    state.mouseHeld.forEach((note) => releaseNote(note));
    state.mouseHeld.clear();
    state.isMouseDown = false;
  }
  state.inputMode = mode;
  const buttons = ui.inputToggle.querySelectorAll(".toggle-btn");
  buttons.forEach((btn) => btn.classList.toggle("active", btn.dataset.mode === mode));
  renderPiano();
}

function setVisualMode(mode) {
  state.visualMode = mode;
  const buttons = ui.visualToggle.querySelectorAll(".toggle-btn");
  buttons.forEach((btn) => btn.classList.toggle("active", btn.dataset.visual === mode));
  getVisibleNoteRange().forEach((note) => {
    if (isHeld(note)) setNoteVisual(note, true);
  });
}

function populatePresets() {
  Object.keys(presetFactories).forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    ui.presetSelect.appendChild(option);
  });
  ui.presetSelect.value = "Fender Rhodes";
}

function setPreset(name) {
  if (state.synthBundle) {
    state.synthBundle.synth.releaseAll();
    state.synthBundle.synth.dispose();
    state.synthBundle.nodes.forEach((n) => n.dispose());
  }
  state.synthBundle = presetFactories[name]();
}

async function initAudio() {
  if (state.audioStarted) return;
  await Tone.start();
  setupRecorderTap();
  setPreset(ui.presetSelect.value);
  state.audioStarted = true;
  ui.overlay.classList.add("hidden");
}

function setupRecorderTap() {
  const context = Tone.getContext().rawContext;
  state.sampleRate = context.sampleRate;

  state.recorderNode = context.createScriptProcessor(4096, 2, 2);
  state.recorderNode.onaudioprocess = (evt) => {
    if (!state.recording) return;

    const inL = evt.inputBuffer.getChannelData(0);
    const hasRight = evt.inputBuffer.numberOfChannels > 1;
    const inR = hasRight ? evt.inputBuffer.getChannelData(1) : inL;

    state.recL.push(new Float32Array(inL));
    state.recR.push(new Float32Array(inR));
  };

  Tone.Destination.connect(state.recorderNode);
  state.recorderNode.connect(context.destination);
}

function beginRecording() {
  if (!state.audioStarted) return;
  state.recL = [];
  state.recR = [];
  state.recording = true;
  ui.recordBtn.disabled = true;
  ui.stopBtn.disabled = false;
}

function stopRecordingAndDownload() {
  if (!state.recording) return;
  state.recording = false;
  ui.recordBtn.disabled = false;
  ui.stopBtn.disabled = true;

  if (state.recL.length === 0) return;

  const left = mergeChunks(state.recL);
  const right = mergeChunks(state.recR);
  const wav = encodeWav(left, right, state.sampleRate);
  const blob = new Blob([wav], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  a.href = url;
  a.download = `glass-synth-${stamp}.wav`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function mergeChunks(chunks) {
  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(size);
  let offset = 0;
  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });
  return merged;
}

function encodeWav(left, right, sampleRate) {
  const length = Math.min(left.length, right.length);
  const bytesPerSample = 2;
  const blockAlign = 2 * bytesPerSample;
  const dataSize = length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < length; i += 1) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7fff, true);
    view.setInt16(offset + 2, r < 0 ? r * 0x8000 : r * 0x7fff, true);
    offset += 4;
  }

  return buffer;
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function bindRibbonSwipe() {
  let startX = null;

  const start = (x) => {
    startX = x;
  };

  const end = (x) => {
    if (startX === null) return;
    const delta = x - startX;
    if (Math.abs(delta) > 35) {
      shiftViewport(delta < 0 ? 1 : -1);
    }
    startX = null;
  };

  ui.ribbon.addEventListener("mousedown", (evt) => {
    start(evt.clientX);
  });

  ui.ribbon.addEventListener("mouseup", (evt) => {
    end(evt.clientX);
  });

  ui.ribbon.addEventListener("mouseleave", (evt) => {
    if (startX !== null) end(evt.clientX);
  });

  ui.ribbon.addEventListener("touchstart", (evt) => {
    if (evt.changedTouches[0]) start(evt.changedTouches[0].clientX);
  }, { passive: true });

  ui.ribbon.addEventListener("touchend", (evt) => {
    if (evt.changedTouches[0]) end(evt.changedTouches[0].clientX);
  }, { passive: true });

  ui.ribbon.addEventListener("touchcancel", () => {
    startX = null;
  }, { passive: true });
}

function bindPianoTouchMouse() {
  ui.pianoKeys.addEventListener("mousedown", (evt) => {
    if (state.inputMode !== "touch") return;
    const key = evt.target.closest(".key");
    if (!key) return;
    state.isMouseDown = true;
    const note = key.dataset.note;
    if (!state.mouseHeld.has(note)) {
      state.mouseHeld.add(note);
      pressNote(note, 0.9);
    }
    evt.preventDefault();
  });

  ui.pianoKeys.addEventListener("mouseover", (evt) => {
    if (state.inputMode !== "touch" || !state.isMouseDown) return;
    const key = evt.target.closest(".key");
    if (!key) return;
    const note = key.dataset.note;
    if (!state.mouseHeld.has(note)) {
      state.mouseHeld.add(note);
      pressNote(note, 0.85);
    }
  });

  window.addEventListener("mouseup", () => {
    if (!state.isMouseDown) return;
    state.isMouseDown = false;
    state.mouseHeld.forEach((note) => releaseNote(note));
    state.mouseHeld.clear();
  });

  ui.pianoKeys.addEventListener("touchstart", (evt) => {
    if (state.inputMode !== "touch") return;
    Array.from(evt.changedTouches).forEach((t) => {
      const target = document.elementFromPoint(t.clientX, t.clientY);
      const key = target ? target.closest(".key") : null;
      if (!key) return;
      const note = key.dataset.note;
      state.touchHeld.set(t.identifier, note);
      pressNote(note, 0.95);
    });
  }, { passive: true });

  const releaseTouch = (touches) => {
    Array.from(touches).forEach((t) => {
      const note = state.touchHeld.get(t.identifier);
      if (!note) return;
      releaseNote(note);
      state.touchHeld.delete(t.identifier);
    });
  };

  ui.pianoKeys.addEventListener("touchend", (evt) => {
    if (state.inputMode !== "touch") return;
    releaseTouch(evt.changedTouches);
  }, { passive: true });

  ui.pianoKeys.addEventListener("touchcancel", (evt) => {
    if (state.inputMode !== "touch") return;
    releaseTouch(evt.changedTouches);
  }, { passive: true });
}

function bindKeyboardInput() {
  const whiteMap = { a: "C", s: "D", d: "E", f: "F", g: "G", h: "A", j: "B" };
  const blackMap = { w: "C#", e: "D#", t: "F#", y: "G#", u: "A#" };

  window.addEventListener("keydown", async (evt) => {
    const key = evt.key.toLowerCase();

    if (!state.audioStarted && (evt.key === " " || /^[a-z]$/i.test(evt.key) || evt.key.startsWith("Arrow"))) {
      await initAudio();
    }

    if (state.inputMode !== "hardware") return;

    if (evt.key === "ArrowUp") {
      shiftViewport(1);
      evt.preventDefault();
      return;
    }
    if (evt.key === "ArrowDown") {
      shiftViewport(-1);
      evt.preventDefault();
      return;
    }

    if (evt.repeat || state.keyboardHeld.has(key)) return;

    const oct = OCTAVES[state.viewportStart];
    const noteName = whiteMap[key] || blackMap[key];
    if (!noteName) return;

    const note = `${noteName}${oct}`;
    state.keyboardHeld.set(key, note);
    pressNote(note, 0.9);
    evt.preventDefault();
  });

  window.addEventListener("keyup", (evt) => {
    const key = evt.key.toLowerCase();
    if (!state.keyboardHeld.has(key)) return;
    const note = state.keyboardHeld.get(key);
    state.keyboardHeld.delete(key);
    releaseNote(note);
  });
}

function bindControls() {
  ui.startButton.addEventListener("click", initAudio);

  ["pointerdown", "keydown"].forEach((type) => {
    window.addEventListener(type, () => {
      if (!state.audioStarted) initAudio();
    }, { once: true });
  });

  ui.presetSelect.addEventListener("change", () => {
    if (!state.audioStarted) return;
    setPreset(ui.presetSelect.value);
  });

  ui.inputToggle.addEventListener("click", (evt) => {
    const btn = evt.target.closest(".toggle-btn[data-mode]");
    if (!btn) return;
    setInputMode(btn.dataset.mode);
  });

  ui.visualToggle.addEventListener("click", (evt) => {
    const btn = evt.target.closest(".toggle-btn[data-visual]");
    if (!btn) return;
    setVisualMode(btn.dataset.visual);
  });

  ui.recordBtn.addEventListener("click", async () => {
    if (!state.audioStarted) await initAudio();
    beginRecording();
  });

  ui.stopBtn.addEventListener("click", stopRecordingAndDownload);
}

function boot() {
  populatePresets();
  updateViewportRules();
  renderPiano();
  bindControls();
  bindRibbonSwipe();
  bindPianoTouchMouse();
  bindKeyboardInput();

  const resizeObserver = new ResizeObserver(() => updateViewportRules());
  resizeObserver.observe(document.body);
  window.addEventListener("resize", updateViewportRules);
}

boot();
