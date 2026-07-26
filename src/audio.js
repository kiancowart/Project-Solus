/**
 * LATTICE.OS — Terminal audio
 */

import { AMBIENCE, SOUNDTRACK } from "../content/boot-content.js";

const AMBIENCE_LIVE_KEY = "lattice.ambienceLive";

function readAmbienceLive() {
  try {
    return sessionStorage.getItem(AMBIENCE_LIVE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeAmbienceLive(on) {
  try {
    if (on) sessionStorage.setItem(AMBIENCE_LIVE_KEY, "1");
    else sessionStorage.removeItem(AMBIENCE_LIVE_KEY);
  } catch {
    /* private mode */
  }
}

/* ==========================================================================
   AUDIO — Web Audio API synthesizer
   ========================================================================== */

export class TerminalAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    /** 666 eyes — no ambience, no SFX until refresh */
    this.deadSilent = false;
    this.sfxGain = 0.55;
    this.ambienceGain = Math.max(0, Math.min(1, AMBIENCE?.volume ?? 0.18));
    this.musicGain = Math.max(0, Math.min(1, SOUNDTRACK?.volume ?? 0.15));

    this.ambience = null;
    this.ambienceGainNode = null;
    this.ambienceStarted = false;
    this.ambienceRouted = false;

    this.soundtrack = null;
    this.musicGainNode = null;
    this.soundtrackStarted = false;
    this.soundtrackRouted = false;
  }

  /** True when a prior page left ambience running (pad ↔ intercept). */
  shouldResumeAmbience() {
    return readAmbienceLive();
  }

  /** Mark ambience as wanted across a same-origin navigation. */
  markAmbienceLive() {
    if (!this.deadSilent) writeAmbienceLive(true);
  }

  async ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  async enable() {
    if (this.deadSilent) return;
    await this.ensure();
    this.enabled = true;
    await this.startAmbience();
    this.#syncAmbience();
    this.#syncSoundtrack();
  }

  disable() {
    this.enabled = false;
    writeAmbienceLive(false);
    this.#syncAmbience();
    this.#syncSoundtrack();
  }

  /** Hard mute for the 666 no-mask stare (refresh to escape). */
  enterDeadSilence() {
    this.deadSilent = true;
    this.enabled = false;
    writeAmbienceLive(false);
    this.stopAmbience();
    this.stopSoundtrack();
  }

  setSfxGain(normalized) {
    this.sfxGain = Math.max(0, Math.min(1, normalized));
  }

  setAmbienceGain(normalized) {
    this.ambienceGain = Math.max(0, Math.min(1, normalized));
    this.#syncAmbience();
  }

  setMusicGain(normalized) {
    this.musicGain = Math.max(0, Math.min(1, normalized));
    this.#syncSoundtrack();
  }

  /** Start looping terminal ambience once (idempotent). */
  async startAmbience() {
    if (this.deadSilent) return;
    const src = AMBIENCE?.src;
    if (!src || this.ambienceStarted) return;

    await this.ensure();
    if (!this.ambience) {
      const el = new Audio(src);
      el.loop = AMBIENCE.loop !== false;
      el.preload = "auto";
      this.ambience = el;
    }

    this.#routeAmbience();
    this.ambienceStarted = true;
    this.#syncAmbience();
    try {
      await this.ambience.play();
      writeAmbienceLive(true);
    } catch {
      // Autoplay may still block; next enable()/gesture retries via #syncAmbience
      this.ambienceStarted = false;
    }
  }

  /** Start looping clearance soundtrack once (idempotent). */
  async startSoundtrack() {
    if (this.deadSilent) return;
    const src = SOUNDTRACK?.src;
    if (!src || this.soundtrackStarted) return;

    await this.ensure();
    if (!this.soundtrack) {
      const el = new Audio(src);
      el.loop = SOUNDTRACK.loop !== false;
      el.preload = "auto";
      this.soundtrack = el;
    }

    this.#routeSoundtrackThroughCrush();
    this.soundtrackStarted = true;
    this.#syncSoundtrack();
    try {
      await this.soundtrack.play();
    } catch {
      this.soundtrackStarted = false;
    }
  }

  #routeAmbience() {
    if (!this.ambience || !this.ctx || this.ambienceRouted) return;

    const source = this.ctx.createMediaElementSource(this.ambience);
    this.ambienceGainNode = this.ctx.createGain();
    this.ambienceGainNode.gain.value = 0;
    source.connect(this.ambienceGainNode).connect(this.ctx.destination);
    this.ambience.volume = 1;
    this.ambienceRouted = true;
  }

  /** Bitcrush + band-limit chain for a crushed terminal radio feel. */
  #routeSoundtrackThroughCrush() {
    if (!this.soundtrack || !this.ctx || this.soundtrackRouted) return;

    const crush = SOUNDTRACK?.crush ?? {};
    const drive = crush.drive ?? 1.35;
    const bits = crush.bits ?? 9;
    const hpHz = crush.highpassHz ?? 60;
    const lpHz = crush.lowpassHz ?? 7000;

    const source = this.ctx.createMediaElementSource(this.soundtrack);

    const pre = this.ctx.createGain();
    pre.gain.value = drive;

    const shaper = this.ctx.createWaveShaper();
    shaper.curve = this.#makeCrushCurve(bits, 1.35);
    shaper.oversample = "2x";

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = hpHz;
    highpass.Q.value = 0.5;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = lpHz;
    lowpass.Q.value = 0.6;

    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 18;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.25;

    const makeup = this.ctx.createGain();
    makeup.gain.value = 1.05;

    this.musicGainNode = this.ctx.createGain();
    this.musicGainNode.gain.value = 0;

    source
      .connect(pre)
      .connect(shaper)
      .connect(highpass)
      .connect(lowpass)
      .connect(comp)
      .connect(makeup)
      .connect(this.musicGainNode)
      .connect(this.ctx.destination);

    this.soundtrack.volume = 1;
    this.soundtrackRouted = true;
  }

  /** Stepped + soft-clip curve — low bit depth grit without a worklet. */
  #makeCrushCurve(bits = 5, softClip = 2.2) {
    const n = 2048;
    const curve = new Float32Array(n);
    const steps = Math.max(2, Math.pow(2, bits) - 1);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / (n - 1) - 1;
      const driven = Math.tanh(x * softClip);
      curve[i] = Math.round(driven * steps) / steps;
    }
    return curve;
  }

  stopAmbience() {
    if (this.ambience) {
      this.ambience.pause();
      try {
        this.ambience.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
    this.ambienceStarted = false;
  }

  /** Halt looping soundtrack (purge / cold exit). */
  stopSoundtrack() {
    if (this.soundtrack) {
      this.soundtrack.pause();
      try {
        this.soundtrack.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
    this.soundtrackStarted = false;
  }

  #syncAmbience() {
    if (!this.ambience) return;

    const level = this.enabled && !this.deadSilent ? this.ambienceGain : 0;
    if (this.ambienceGainNode) {
      this.ambienceGainNode.gain.value = level;
    } else {
      this.ambience.volume = level;
    }

    if (
      this.enabled &&
      !this.deadSilent &&
      this.ambienceStarted &&
      this.ambience.paused
    ) {
      this.ambience
        .play()
        .then(() => writeAmbienceLive(true))
        .catch(() => {});
    } else if ((!this.enabled || this.deadSilent) && !this.ambience.paused) {
      this.ambience.pause();
    }
  }

  #syncSoundtrack() {
    if (!this.soundtrack) return;

    const level = this.enabled && !this.deadSilent ? this.musicGain : 0;
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = level;
    } else {
      this.soundtrack.volume = level;
    }

    if (
      this.enabled &&
      !this.deadSilent &&
      this.soundtrackStarted &&
      this.soundtrack.paused
    ) {
      this.soundtrack.play().catch(() => {});
    } else if ((!this.enabled || this.deadSilent) && !this.soundtrack.paused) {
      this.soundtrack.pause();
    }
  }

  play(type = "click") {
    if (this.deadSilent || !this.enabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.35;
    master.connect(this.ctx.destination);

    if (type === "boot") {
      this.#tone(master, 180, 0.045, t, "square");
      return;
    }

    if (type === "unlock") {
      this.#tone(master, 160, 0.1, t, "square");
      this.#tone(master, 240, 0.1, t + 0.12, "square");
      this.#tone(master, 360, 0.14, t + 0.26, "triangle");
      this.#tone(master, 520, 0.18, t + 0.42, "triangle");
      this.#noise(master, 0.08, t + 0.5);
      return;
    }

    if (type === "milestone") {
      this.#tone(master, 310, 0.08, t, "triangle");
      this.#tone(master, 465, 0.1, t + 0.09, "triangle");
      this.#tone(master, 620, 0.12, t + 0.2, "sine");
      return;
    }

    if (type === "reveal") {
      this.#tone(master, 220, 0.12, t, "sine");
      this.#tone(master, 330, 0.12, t + 0.14, "triangle");
      this.#tone(master, 440, 0.14, t + 0.3, "triangle");
      this.#tone(master, 660, 0.16, t + 0.48, "sine");
      this.#noise(master, 0.06, t + 0.55);
      return;
    }

    if (type === "imperial") {
      this.#tone(master, 180, 0.12, t, "square");
      this.#tone(master, 270, 0.12, t + 0.14, "square");
      this.#tone(master, 405, 0.16, t + 0.3, "triangle");
      this.#tone(master, 540, 0.2, t + 0.48, "triangle");
      this.#tone(master, 810, 0.22, t + 0.7, "sine");
      this.#noise(master, 0.1, t + 0.85);
      return;
    }

    if (type === "select") {
      this.#tone(master, 420, 0.05, t, "triangle");
      this.#tone(master, 640, 0.04, t + 0.04, "triangle");
      return;
    }

    if (type === "open") {
      this.#tone(master, 280, 0.07, t, "sawtooth");
      this.#noise(master, 0.05, t);
      return;
    }

    this.#tone(master, 520, 0.035, t, "square");
  }

  #tone(dest, freq, dur, when, type) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.9, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  #noise(dest, dur, when) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * dur);
    const buffer = this.ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buffer;
    gain.gain.value = 0.15;
    src.connect(gain);
    gain.connect(dest);
    src.start(when);
  }
}

export const audio = new TerminalAudio();
