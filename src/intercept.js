/**
 * Celeste AUX bleed — radio tuner → intercept reveal
 */

const SIGNAL_FREQ = 97.9;
const FREQ_MIN = 0;
const FREQ_MAX = 108.0;
const LOCK_HOLD_MS = 2000;
const LOCK_TOLERANCE = 0.12;
const DETENT_RANGE = 1.8;
const SIGNAL_SRC = "assets/audio/TriadSignal.mp3";
const CLARITY_WINDOW = 28;
const MASTER_VOLUME = 0.28;
const BAR_COUNT = 72;
const TUNED_KEY = "lattice.interceptTuned";

const $ = (sel, root = document) => root.querySelector(sel);

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function formatFreq(hz) {
  return hz.toFixed(1).padStart(5, "0");
}

function makeSoftClipCurve(amount = 1.4) {
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1;
    curve[i] = Math.tanh(x * amount);
  }
  return curve;
}

class RadioTuner {
  constructor() {
    this.root = $(".radio");
    this.stage = $(".intercept-stage");
    this.freqEl = $(".radio__freq-value");
    this.dialHand = $(".radio__dial-hand");
    this.vizRoot = $("#radio-viz");
    this.btnLeft = $(".radio__spin--left");
    this.btnRight = $(".radio__spin--right");
    this.message = $(".intercept");
    this.ctaFoot = $(".intercept__foot");
    this.frame = $(".radio__frame");
    this.clearanceBtn = $(".radio__clearance");

    this.freq = 82.4;
    this.dialAngle = -18;
    this.direction = 0;
    this.holdMs = 0;
    this.lockHoldMs = 0;
    this.locked = false;
    this.revealed = false;
    this.audioReady = false;
    this.flatViz = false;
    this.hideBars = false;
    this.clarity = 0;

    this.raf = 0;
    this.lastTs = 0;
    this.barHeight = [];
    this.barNodes = [];
    this.noiseFloor = [];

    this.ctx = null;
    this.signal = null;
    this.signalGain = null;
    this.muffLp = null;
    this.muffHp = null;
    this.noiseGain = null;
    this.noiseBright = null;
    this.noiseDull = null;
    this.masterGain = null;
    this.analyser = null;
    this.noiseNode = null;
    this.timeData = null;
    this.freqData = null;
  }

  init() {
    this.#buildBars();
    this.#bindControls();
    this.#renderFreq();
    this.#setClarity(0);
    this.#renderDial();
    this.#syncClearanceExit();
    this.lastTs = performance.now();
    this.raf = requestAnimationFrame((t) => this.#tick(t));
  }

  #hasTunedBefore() {
    try {
      return localStorage.getItem(TUNED_KEY) === "1";
    } catch {
      return false;
    }
  }

  #markTuned() {
    try {
      localStorage.setItem(TUNED_KEY, "1");
    } catch {
      /* private mode */
    }
  }

  #syncClearanceExit() {
    if (!this.clearanceBtn) return;
    if (this.#hasTunedBefore() && !this.locked) {
      this.clearanceBtn.hidden = false;
      this.root?.classList.add("radio--has-clearance");
    } else {
      this.clearanceBtn.hidden = true;
      this.root?.classList.remove("radio--has-clearance");
    }
  }

  #buildBars() {
    if (!this.vizRoot) return;
    this.vizRoot.replaceChildren();
    this.barNodes = [];
    this.barHeight = Array.from({ length: BAR_COUNT }, () => 0.12 + Math.random() * 0.35);
    this.noiseFloor = Array.from({ length: BAR_COUNT }, () => Math.random());

    for (let i = 0; i < BAR_COUNT; i++) {
      const bar = document.createElement("span");
      bar.className = "radio__bar";
      bar.style.setProperty("--h", this.barHeight[i].toFixed(3));
      this.vizRoot.appendChild(bar);
      this.barNodes.push(bar);
    }
  }

  #bindControls() {
    const start = (dir) => (e) => {
      e.preventDefault();
      if (this.locked) return;
      this.direction = dir;
      this.holdMs = 0;
      void this.#ensureAudio();
      this.root?.classList.add("radio--spinning");
    };
    const stop = () => {
      this.direction = 0;
      this.holdMs = 0;
      this.root?.classList.remove("radio--spinning");
    };

    for (const [btn, dir] of [
      [this.btnLeft, -1],
      [this.btnRight, 1],
    ]) {
      if (!btn) continue;
      btn.addEventListener("pointerdown", start(dir));
      btn.addEventListener("pointerup", stop);
      btn.addEventListener("pointerleave", stop);
      btn.addEventListener("pointercancel", stop);
      btn.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    window.addEventListener("pointerup", stop);
    window.addEventListener("blur", stop);
  }

  async #ensureAudio() {
    if (this.audioReady) {
      if (this.ctx?.state === "suspended") await this.ctx.resume();
      if (this.signal?.paused && !this.locked) {
        this.signal.play().catch(() => {});
      }
      return;
    }

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    await this.ctx.resume();

    const el = new Audio(SIGNAL_SRC);
    el.loop = true;
    el.preload = "auto";
    this.signal = el;

    const source = this.ctx.createMediaElementSource(el);

    this.muffHp = this.ctx.createBiquadFilter();
    this.muffHp.type = "highpass";
    this.muffHp.frequency.value = 90;
    this.muffHp.Q.value = 0.5;

    this.muffLp = this.ctx.createBiquadFilter();
    this.muffLp.type = "lowpass";
    this.muffLp.frequency.value = 420;
    this.muffLp.Q.value = 0.7;

    const soft = this.ctx.createWaveShaper();
    soft.curve = makeSoftClipCurve(1.15);
    soft.oversample = "2x";

    this.signalGain = this.ctx.createGain();
    this.signalGain.gain.value = 0.12;

    const noiseBuf = this.#makeNoiseBuffer(3);
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuf;
    this.noiseNode.loop = true;

    this.noiseDull = this.ctx.createBiquadFilter();
    this.noiseDull.type = "lowpass";
    this.noiseDull.frequency.value = 1800;
    this.noiseDull.Q.value = 0.4;

    this.noiseBright = this.ctx.createBiquadFilter();
    this.noiseBright.type = "bandpass";
    this.noiseBright.frequency.value = 2800;
    this.noiseBright.Q.value = 0.55;

    const noiseMix = this.ctx.createGain();
    noiseMix.gain.value = 1;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0.72;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.38;
    this.timeData = new Uint8Array(this.analyser.fftSize);
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = MASTER_VOLUME;

    source
      .connect(this.muffHp)
      .connect(this.muffLp)
      .connect(soft)
      .connect(this.signalGain);

    this.noiseNode.connect(this.noiseDull);
    this.noiseNode.connect(this.noiseBright);
    this.noiseDull.connect(noiseMix);
    this.noiseBright.connect(noiseMix);
    noiseMix.connect(this.noiseGain);

    this.signalGain.connect(this.analyser);
    this.noiseGain.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.noiseNode.start();
    try {
      await el.play();
    } catch {
      /* retry on next spin */
    }

    this.audioReady = true;
    this.#applyAudioMix(this.clarity);
  }

  #makeNoiseBuffer(seconds = 2) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      let sample = last * 3.2;
      if (Math.random() < 0.002) sample += (Math.random() * 2 - 1) * 0.9;
      data[i] = clamp(sample, -1, 1);
    }
    return buf;
  }

  #setClarity(c) {
    this.clarity = clamp(c, 0, 1);
    this.root?.style.setProperty("--clarity", this.clarity.toFixed(3));
    this.#applyAudioMix(this.clarity);
  }

  #applyAudioMix(clarity) {
    if (!this.audioReady) return;
    const t = this.ctx.currentTime;
    const mud = 1 - clarity;

    // Louder as you focus in on 097.9; static peels back
    this.signalGain.gain.setTargetAtTime(0.06 + clarity * 0.92, t, 0.1);
    this.noiseGain.gain.setTargetAtTime(0.06 + mud * 0.72, t, 0.12);
    this.muffLp.frequency.setTargetAtTime(380 + clarity * 7600, t, 0.14);
    this.muffHp.frequency.setTargetAtTime(140 - clarity * 100, t, 0.14);
    if (this.noiseBright) {
      this.noiseBright.frequency.setTargetAtTime(3200 - clarity * 900, t, 0.15);
    }
    if (this.noiseDull) {
      this.noiseDull.frequency.setTargetAtTime(1200 + clarity * 400, t, 0.15);
    }
  }

  #tick(ts) {
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;

    if (!this.locked && this.direction !== 0) {
      this.holdMs += dt * 1000;
      const accel = Math.pow(Math.min(1, this.holdMs / 2500), 1.65);
      let speed = 0.2 + accel * 22;

      const distBefore = Math.abs(this.freq - SIGNAL_FREQ);
      if (distBefore < DETENT_RANGE && accel < 0.55) {
        speed *= 0.22 + distBefore / DETENT_RANGE;
        this.freq += (SIGNAL_FREQ - this.freq) * dt * 2.8;
      }

      const atMin = this.freq <= FREQ_MIN && this.direction < 0;
      const atMax = this.freq >= FREQ_MAX && this.direction > 0;

      if (!atMin && !atMax) {
        this.freq = clamp(this.freq + this.direction * speed * dt, FREQ_MIN, FREQ_MAX);

        if (Math.abs(this.freq - SIGNAL_FREQ) <= LOCK_TOLERANCE) {
          this.freq = SIGNAL_FREQ;
        }

        this.dialAngle += this.direction * (35 + accel * 480) * dt;
        this.#renderFreq();
        this.#renderDial();
      } else {
        // Hard stop at band edges — hold is fine, dial does not keep spinning
        this.freq = clamp(this.freq, FREQ_MIN, FREQ_MAX);
        this.#renderFreq();
      }
    }

    if (!this.locked) {
      const dist = Math.abs(this.freq - SIGNAL_FREQ);
      const clarity = Math.pow(1 - clamp(dist / CLARITY_WINDOW, 0, 1), 1.35);
      this.#setClarity(clarity);

      if (dist <= LOCK_TOLERANCE) {
        this.lockHoldMs += dt * 1000;
        this.root?.classList.add("radio--on-signal");
        if (this.lockHoldMs >= LOCK_HOLD_MS) void this.#lockOn();
      } else {
        this.lockHoldMs =
          this.direction === 0 ? Math.max(0, this.lockHoldMs - dt * 1000 * 1.5) : 0;
        if (this.lockHoldMs === 0) this.root?.classList.remove("radio--on-signal");
      }
    }

    this.#paintViz(dt);
    this.raf = requestAnimationFrame((t) => this.#tick(t));
  }

  #renderFreq() {
    if (this.freqEl) this.freqEl.textContent = formatFreq(this.freq);
  }

  #renderDial() {
    if (this.dialHand) {
      this.dialHand.style.transform = `translateX(-50%) rotate(${this.dialAngle}deg)`;
    }
  }

  #paintViz(dt) {
    if (!this.barNodes.length || this.hideBars) return;

    let hasAudio = false;
    if (this.analyser && !this.flatViz) {
      this.analyser.getByteTimeDomainData(this.timeData);
      this.analyser.getByteFrequencyData(this.freqData);
      hasAudio = true;
    }

    const mid = (BAR_COUNT - 1) / 2;
    const phase = this.lastTs * 0.008;

    for (let i = 0; i < BAR_COUNT; i++) {
      let target;

      if (this.flatViz) {
        target = 0;
      } else if (hasAudio) {
        const bin = Math.floor((i / BAR_COUNT) * (this.freqData.length * 0.7));
        const spectral = this.freqData[bin] / 255;
        const tIdx = Math.floor((i / BAR_COUNT) * this.timeData.length);
        const wave = Math.abs(this.timeData[tIdx] - 128) / 128;

        this.noiseFloor[i] = (this.noiseFloor[i] * 0.82 + Math.random() * 0.18) % 1;
        const crackle = this.noiseFloor[i];
        const staticShape =
          0.08 +
          crackle * (0.62 - this.clarity * 0.48) +
          Math.abs(Math.sin(i * 0.27 + phase)) * 0.1 * (1 - this.clarity);

        const signalShape = spectral * 0.65 + wave * 0.9;
        const blend =
          staticShape * (1 - this.clarity * 0.9) + signalShape * (0.12 + this.clarity * 0.98);

        const edge = Math.abs(i - mid) / mid;
        const centerBias = this.clarity > 0.55 ? 1 - edge * 0.12 : 0.88 + edge * 0.18;
        target = clamp(blend * centerBias, 0.04, 1);
      } else {
        this.noiseFloor[i] = (this.noiseFloor[i] * 0.75 + Math.random() * 0.25) % 1;
        target = 0.08 + this.noiseFloor[i] * 0.55;
      }

      const lerp = this.flatViz ? Math.min(1, dt * 4.5) : Math.min(1, dt * (11 + this.clarity * 7));
      this.barHeight[i] += (target - this.barHeight[i]) * lerp;
      this.barNodes[i].style.setProperty("--h", this.barHeight[i].toFixed(3));
    }
  }

  async #lockOn() {
    if (this.locked) return;
    this.locked = true;
    this.direction = 0;
    this.freq = SIGNAL_FREQ;
    this.#renderFreq();
    this.#setClarity(1);

    this.root?.classList.remove("radio--spinning");
    this.root?.classList.add("radio--locked");
    this.stage?.classList.add("intercept-stage--locked");
    this.#markTuned();
    this.#syncClearanceExit();

    for (const btn of [this.btnLeft, this.btnRight]) {
      if (!btn) continue;
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
    }

    await this.#ensureAudio();

    // Dial / arrows / freq leave; visualizer stays through the playback
    await this.#wait(280);
    this.root?.classList.add("radio--controls-out");
    await this.#wait(900);
    this.root?.classList.add("radio--controls-gone");

    await this.#playCleanSignal();

    // Bars collapse fully flat, then vanish — rails remain as the single center line
    this.flatViz = true;
    this.root?.classList.add("radio--flat");
    await this.#wait(1800);

    this.hideBars = true;
    this.root?.classList.add("radio--bars-gone");
    await this.#wait(700);

    // Frame grows from the seam; rails ride top/bottom while staying centered
    this.root?.classList.add("radio--splitting");
    this.stage?.classList.add("intercept-stage--opening");
    await this.#wait(1150);

    this.#revealMessage();
  }

  async #playCleanSignal() {
    if (!this.signal || !this.ctx) return;

    const t = this.ctx.currentTime;
    this.noiseGain.gain.setTargetAtTime(0.012, t, 0.08);
    this.signalGain.gain.setTargetAtTime(1, t, 0.08);
    this.muffLp.frequency.setTargetAtTime(14000, t, 0.08);
    this.muffHp.frequency.setTargetAtTime(40, t, 0.08);
    this.masterGain.gain.setTargetAtTime(MASTER_VOLUME * 1.2, t, 0.08);

    this.signal.loop = false;
    try {
      this.signal.currentTime = 0;
    } catch {
      /* ignore */
    }

    await new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        this.signal.removeEventListener("ended", done);
        resolve();
      };
      this.signal.addEventListener("ended", done);
      this.signal.play().catch(() => setTimeout(done, 1200));
      setTimeout(done, 13000);
    });

    try {
      this.signal.pause();
    } catch {
      /* ignore */
    }
    this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.18);
  }

  #revealMessage() {
    if (this.revealed) return;
    this.revealed = true;

    this.root?.classList.add("radio--message");
    this.message?.classList.add("intercept--revealed");
    this.message?.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
      this.ctaFoot?.classList.add("intercept__foot--in");
      this.ctaFoot?.setAttribute("aria-hidden", "false");
      this.stage?.classList.add("intercept-stage--open");
    }, 700);
  }

  #wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new RadioTuner().init();
});
