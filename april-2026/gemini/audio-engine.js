class AudioEngine {
    constructor() {
        this.synth = null;
        this.recorder = new Tone.Recorder();
        this.currentPreset = 'rhodes';
        this.activeVoices = new Map();
        this.init();
    }

    async init() {
        await Tone.start();
        this.setPreset(this.currentPreset);
    }

    setPreset(preset) {
        if (this.synth) {
            this.synth.dispose();
        }

        this.currentPreset = preset;

        switch (preset) {
            case 'rhodes':
                this.synth = new Tone.PolySynth(Tone.FMSynth, {
                    harmonicity: 3,
                    modulationIndex: 10,
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 1.2 },
                    modulation: { type: "square" },
                    modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 1.2 }
                }).toDestination();
                break;

            case 'wurlitzer':
                this.synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "sawtooth8" },
                    envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.8 }
                }).toDestination();
                this.synth.set({ volume: -6 });
                break;

            case 'cp70':
            case 'cp80':
                this.synth = new Tone.PolySynth(Tone.Sampler, {
                    urls: {
                        C3: "https://tonejs.github.io/audio/salamander/C3.mp3",
                        C4: "https://tonejs.github.io/audio/salamander/C4.mp3",
                    },
                    release: 1
                }).toDestination();
                break;

            case 'clavinet':
                this.synth = new Tone.PolySynth(Tone.FMSynth, {
                    harmonicity: 1,
                    modulationIndex: 20,
                    oscillator: { type: "sawtooth" },
                    envelope: { attack: 0.005, decay: 0.1, sustain: 0.01, release: 0.1 },
                    modulation: { type: "sine" }
                }).toDestination();
                break;

            case 'juno':
                this.synth = new Tone.PolySynth(Tone.MonoSynth, {
                    oscillator: { type: "pwm", modulationFrequency: 0.2 },
                    envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 2 },
                    filterEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 2, baseFrequency: 200, octaves: 4 }
                }).toDestination();
                break;

            case 'dx7':
                this.synth = new Tone.PolySynth(Tone.FMSynth, {
                    harmonicity: 2,
                    modulationIndex: 15,
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1 }
                }).toDestination();
                break;

            case 'nord':
                this.synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "triangle" },
                    envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 1 }
                }).toDestination();
                break;

            case 'rmi':
                this.synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "square" },
                    envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 }
                }).toDestination();
                break;

            case 'pianet':
                this.synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 }
                }).toDestination();
                break;

            default:
                this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        }

        this.synth.connect(this.recorder);
    }

    triggerAttack(note) {
        if (!this.synth) return;
        this.synth.triggerAttack(note);
    }

    triggerRelease(note) {
        if (!this.synth) return;
        this.synth.triggerRelease(note);
    }

    async startRecording() {
        this.recorder.start();
    }

    async stopRecording() {
        const recording = await this.recorder.stop();
        const url = URL.createObjectURL(recording);
        const anchor = document.createElement("a");
        anchor.download = "piano-vibe-recording.webm";
        anchor.href = url;
        anchor.click();
    }
}

window.AudioEngine = AudioEngine;
