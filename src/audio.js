/**
 * LATTICE.OS — Terminal audio
 */

import { AMBIENCE, MUSIC, SOUNDTRACK } from "../content/boot-content.js";

const AMBIENCE_LIVE_KEY = "lattice.ambienceLive";

/** Sampled UI SFX under assets/audio/ui-sfx/ */
const UI_SFX = {
  typewriter: ["assets/audio/ui-sfx/typewriter-a.ogg"],
  keyInput: "assets/audio/ui-sfx/key-input.wav",
  channelSwitch: "assets/audio/ui-sfx/channel-switch.ogg",
  journalSelect: "assets/audio/ui-sfx/dropdown.ogg",
  dropdownToggle: "assets/audio/ui-sfx/dropdown.ogg",
  revealScan: "assets/audio/ui-sfx/reveal-scan.wav",
  uiBeep: "assets/audio/ui-sfx/ui-beep.wav",
  tunerNudge: "assets/audio/ui-sfx/tuner-nudge.wav",
  uiDeny: "assets/audio/ui-sfx/ui-deny.wav",
  codeSuccess: "assets/audio/ui-sfx/code-success.ogg",
  imperialClearance: "assets/audio/ui-sfx/imperial-clearance.ogg",
  imagoBoot: "assets/audio/ui-sfx/imago-boot.ogg",
  imagoReset: "assets/audio/ui-sfx/imago-reset.ogg",
  flogSearchHit: "assets/audio/ui-sfx/flog-search-hit.wav",
};

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
   AUDIO — Web Audio API synthesizer + UI sample beds
   ========================================================================== */

export class TerminalAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    /** 666 eyes — no ambience, no SFX until caption dismiss */
    this.deadSilent = false;
    this.sfxGain = 0.55;
    this.ambienceGain = Math.max(0, Math.min(1, AMBIENCE?.volume ?? 0.18));
    this.musicGain = Math.max(0, Math.min(1, MUSIC?.volume ?? SOUNDTRACK?.volume ?? 0.4));

    this.ambience = null;
    this.ambienceGainNode = null;
    this.ambienceStarted = false;
    this.ambienceRouted = false;

    /** @type {Record<string, HTMLAudioElement>} */
    this.musicEls = {};
    /** @type {Record<string, boolean>} */
    this.musicRouted = {};
    this.musicGainNode = null;
    this.activeTrackId = null;
    this.soundtrackWanted = false;
    this.soundtrackSuspended = false;
    /** Alias: true when a track has been successfully started */
    this.soundtrackStarted = false;

    /** @type {AudioBuffer[]} */
    this.typewriterBuffers = [];
    /** @type {AudioBuffer | null} */
    this.keyInputBuffer = null;
    /** @type {AudioBuffer | null} */
    this.channelSwitchBuffer = null;
    /** @type {AudioBuffer | null} */
    this.journalSelectBuffer = null;
    /** @type {AudioBuffer | null} */
    this.revealScanBuffer = null;
    /** @type {AudioBuffer | null} */
    this.uiBeepBuffer = null;
    /** @type {AudioBuffer | null} */
    this.tunerNudgeBuffer = null;
    /** @type {AudioBuffer | null} */
    this.uiDenyBuffer = null;
    /** @type {AudioBuffer | null} */
    this.codeSuccessBuffer = null;
    /** @type {AudioBuffer | null} */
    this.imperialClearanceBuffer = null;
    /** @type {AudioBuffer | null} */
    this.imagoBootBuffer = null;
    /** @type {AudioBuffer | null} */
    this.imagoResetBuffer = null;
    /** @type {AudioBuffer | null} */
    this.flogSearchHitBuffer = null;
    this.sfxLoadPromise = null;
    this.keyInputBound = false;
    this._keyInputLastAt = 0;
    this._typewriterLastAt = 0;
    /** @type {Set<AudioBufferSourceNode>} */
    this._typewriterSources = new Set();
    /** @type {AudioBufferSourceNode | null} */
    this._revealScanSource = null;
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
    this.#bindKeyInputSfx();
    void this.#loadUiSfx();
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

  /** Hard mute for the 666 no-mask stare. */
  enterDeadSilence() {
    this.deadSilent = true;
    this.enabled = false;
    this.soundtrackSuspended = false;
    writeAmbienceLive(false);
    this.stopAmbience();
    this.stopSoundtrack();
  }

  /** Leave 666 dead silence so pad SFX / ambience can resume. */
  exitDeadSilence() {
    this.deadSilent = false;
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

  getMusicTracks() {
    return Array.isArray(MUSIC?.tracks) ? MUSIC.tracks : [];
  }

  getActiveTrackId() {
    return this.activeTrackId;
  }

  #trackDef(trackId) {
    return this.getMusicTracks().find((t) => t.id === trackId) ?? null;
  }

  #ensureMusicBus() {
    if (!this.ctx) return;
    if (this.musicGainNode) return;
    this.musicGainNode = this.ctx.createGain();
    this.musicGainNode.gain.value = 0;
    this.musicGainNode.connect(this.ctx.destination);
  }

  #ensureTrackEl(trackId) {
    const def = this.#trackDef(trackId);
    if (!def?.src) return null;
    if (!this.musicEls[trackId]) {
      const el = new Audio(def.src);
      el.loop = def.loop !== false;
      el.preload = "auto";
      this.musicEls[trackId] = el;
    }
    return this.musicEls[trackId];
  }

  /** Bitcrush + band-limit into shared music gain bus. */
  #routeTrackThroughCrush(trackId) {
    const el = this.musicEls[trackId];
    if (!el || !this.ctx || this.musicRouted[trackId]) return;

    this.#ensureMusicBus();

    const crush = MUSIC?.crush ?? SOUNDTRACK?.crush ?? {};
    const drive = crush.drive ?? 1.35;
    const bits = crush.bits ?? 9;
    const hpHz = crush.highpassHz ?? 60;
    const lpHz = crush.lowpassHz ?? 7000;

    const source = this.ctx.createMediaElementSource(el);

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

    source
      .connect(pre)
      .connect(shaper)
      .connect(highpass)
      .connect(lowpass)
      .connect(comp)
      .connect(makeup)
      .connect(this.musicGainNode);

    el.volume = 1;
    this.musicRouted[trackId] = true;
  }

  async #waitTrackReady(el) {
    if (!el) return;
    if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return;
    await Promise.race([
      new Promise((resolve, reject) => {
        const onReady = () => {
          cleanup();
          resolve();
        };
        const onErr = () => {
          cleanup();
          reject(new Error("music load failed"));
        };
        const cleanup = () => {
          el.removeEventListener("canplaythrough", onReady);
          el.removeEventListener("canplay", onReady);
          el.removeEventListener("error", onErr);
        };
        el.addEventListener("canplaythrough", onReady, { once: true });
        el.addEventListener("canplay", onReady, { once: true });
        el.addEventListener("error", onErr, { once: true });
        el.load();
      }),
      new Promise((resolve) => setTimeout(resolve, 10000)),
    ]);
  }

  #pauseAllTracks() {
    for (const el of Object.values(this.musicEls)) {
      if (el && !el.paused) el.pause();
    }
  }

  /**
   * Play a named hub track (stops others). Used after pad / Imperial / Diagnostics.
   * @param {string} trackId
   * @param {{ fromStart?: boolean }} [opts]
   */
  async startTrack(trackId, { fromStart = true } = {}) {
    if (this.deadSilent) return;
    const def = this.#trackDef(trackId);
    if (!def) return;

    this.soundtrackWanted = true;
    this.soundtrackSuspended = false;
    this.activeTrackId = trackId;

    try {
      await this.ensure();
    } catch {
      return;
    }
    if (!this.enabled) this.enabled = true;

    const el = this.#ensureTrackEl(trackId);
    if (!el) return;

    this.#routeTrackThroughCrush(trackId);

    // Stop sibling beds
    for (const [id, other] of Object.entries(this.musicEls)) {
      if (id !== trackId && other && !other.paused) other.pause();
    }

    try {
      await this.#waitTrackReady(el);
      if (fromStart) {
        try {
          el.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
      this.soundtrackStarted = true;
      this.#syncSoundtrack();
      await el.play();
      this.#syncSoundtrack();
    } catch {
      this.soundtrackStarted = false;
      this.#syncSoundtrack();
    }
  }

  /** Pad success — Recursion (or Ascendancy if already Imperial). */
  async startSoundtrack(trackId = MUSIC?.hubDefault ?? "recursion") {
    await this.startTrack(trackId, { fromStart: true });
  }

  /** Ensure hub music is running if pad success already armed it. */
  async ensureSoundtrack() {
    if (this.deadSilent || !this.soundtrackWanted) return;
    if (this.soundtrackSuspended) return;
    const id = this.activeTrackId ?? MUSIC?.hubDefault ?? "recursion";
    const el = this.musicEls[id];
    if (this.soundtrackStarted && el && !el.paused) {
      this.#syncSoundtrack();
      return;
    }
    await this.startTrack(id, { fromStart: false });
  }

  /** After Imperial bind animation — Ascendancy by default. */
  async playPostImperialMusic() {
    const id = MUSIC?.postImperialDefault ?? "ascendancy";
    await this.startTrack(id, { fromStart: true });
  }

  /** Diagnostics track picker (post-Imperial). */
  async setMusicTrack(trackId) {
    if (!this.#trackDef(trackId)) return;
    await this.startTrack(trackId, { fromStart: true });
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
    this.soundtrackWanted = false;
    this.soundtrackSuspended = false;
    this.soundtrackStarted = false;
    this.#pauseAllTracks();
    for (const el of Object.values(this.musicEls)) {
      try {
        el.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
    if (this.musicGainNode) this.musicGainNode.gain.value = 0;
  }

  /** Soft-stop for Imperial bind animation (keeps wanted flag). */
  pauseSoundtrack() {
    this.soundtrackSuspended = true;
    this.#pauseAllTracks();
    if (this.musicGainNode) this.musicGainNode.gain.value = 0;
  }

  /**
   * Resume after pause — only if still on the same bed.
   * Prefer playPostImperialMusic() after a successful bind.
   */
  resumeSoundtrack() {
    if (this.deadSilent) return;
    this.soundtrackSuspended = false;
    if (!this.soundtrackWanted) return;
    this.#syncSoundtrack();
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
    const id = this.activeTrackId;
    const el = id ? this.musicEls[id] : null;

    if (this.soundtrackSuspended) {
      if (this.musicGainNode) this.musicGainNode.gain.value = 0;
      this.#pauseAllTracks();
      return;
    }

    const musicOn =
      this.soundtrackWanted &&
      this.enabled &&
      !this.deadSilent &&
      this.musicGain > 0.001 &&
      Boolean(el);

    const level = musicOn ? this.musicGain : 0;
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = level;
    } else if (el) {
      el.volume = level;
    }

    if (musicOn && this.soundtrackStarted && el.paused) {
      el.play().catch(() => {});
    } else if (!musicOn) {
      this.#pauseAllTracks();
    }
  }

  async #loadUiSfx() {
    if (this.sfxLoadPromise) return this.sfxLoadPromise;
    this.sfxLoadPromise = (async () => {
      await this.ensure();
      const decode = async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`SFX fetch failed: ${url}`);
        const raw = await res.arrayBuffer();
        return await this.ctx.decodeAudioData(raw.slice(0));
      };
      try {
        this.typewriterBuffers = await Promise.all(
          UI_SFX.typewriter.map((url) => decode(url))
        );
      } catch {
        this.typewriterBuffers = [];
      }
      try {
        this.keyInputBuffer = await decode(UI_SFX.keyInput);
      } catch {
        this.keyInputBuffer = null;
      }
      try {
        this.channelSwitchBuffer = await decode(UI_SFX.channelSwitch);
      } catch {
        this.channelSwitchBuffer = null;
      }
      try {
        this.journalSelectBuffer = await decode(UI_SFX.journalSelect);
      } catch {
        this.journalSelectBuffer = null;
      }
      try {
        this.revealScanBuffer = await decode(UI_SFX.revealScan);
      } catch {
        this.revealScanBuffer = null;
      }
      try {
        this.uiBeepBuffer = await decode(UI_SFX.uiBeep);
      } catch {
        this.uiBeepBuffer = null;
      }
      try {
        this.tunerNudgeBuffer = await decode(UI_SFX.tunerNudge);
      } catch {
        this.tunerNudgeBuffer = null;
      }
      try {
        this.uiDenyBuffer = await decode(UI_SFX.uiDeny);
      } catch {
        this.uiDenyBuffer = null;
      }
      try {
        this.codeSuccessBuffer = await decode(UI_SFX.codeSuccess);
      } catch {
        this.codeSuccessBuffer = null;
      }
      try {
        this.imperialClearanceBuffer = await decode(UI_SFX.imperialClearance);
      } catch {
        this.imperialClearanceBuffer = null;
      }
      try {
        this.imagoBootBuffer = await decode(UI_SFX.imagoBoot);
      } catch {
        this.imagoBootBuffer = null;
      }
      try {
        this.imagoResetBuffer = await decode(UI_SFX.imagoReset);
      } catch {
        this.imagoResetBuffer = null;
      }
      try {
        this.flogSearchHitBuffer = await decode(UI_SFX.flogSearchHit);
      } catch {
        this.flogSearchHitBuffer = null;
      }
    })();
    return this.sfxLoadPromise;
  }

  /**
   * Play a UI sample cleanly (no crush chain). Optional short window + fade
   * keeps rapid typewriter ticks from stacking into clipped grit.
   */
  #playBuffer(
    buffer,
    gainScale = 1,
    { maxDur = null, fade = 0.012, playbackRate = 1, track = null } = {}
  ) {
    if (!buffer || !this.ctx || this.deadSilent || !this.enabled) return null;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buffer;
    const rate = Math.max(0.05, Math.min(8, playbackRate));
    src.playbackRate.value = rate;
    const level = this.sfxGain * 0.22 * gainScale;
    const natural =
      maxDur != null
        ? Math.min(buffer.duration, maxDur)
        : buffer.duration;
    const dur = natural / rate;
    const fadeOut = Math.min(fade, Math.max(0.004, dur * 0.35));
    gain.gain.setValueAtTime(level, t);
    if (fadeOut > 0 && dur > fadeOut) {
      gain.gain.setValueAtTime(level, t + dur - fadeOut);
      gain.gain.linearRampToValueAtTime(0.0001, t + dur);
    }
    src.connect(gain);
    gain.connect(this.ctx.destination);
    if (track) {
      track.add(src);
      src.addEventListener("ended", () => track.delete(src));
    }
    src.start(t, 0, natural);
    return src;
  }

  /** Halt in-flight typewriter ticks (e.g. sudoku fill aborted by pad success). */
  stopTypewriter() {
    for (const src of this._typewriterSources) {
      try {
        src.stop();
      } catch {
        /* already ended */
      }
    }
    this._typewriterSources.clear();
  }

  /** Halt a stretched reveal-scan bed mid-play. */
  stopRevealScan() {
    if (!this._revealScanSource) return;
    try {
      this._revealScanSource.stop();
    } catch {
      /* already ended */
    }
    this._revealScanSource = null;
  }

  #playTypewriter(glitch = 0) {
    const now = performance.now();
    const g = Math.max(0, Math.min(1, Number(glitch) || 0));
    // Samples are long; throttle so overlaps stay soft instead of crunching
    // Glitch mode allows denser, uglier stacking
    const throttle = g > 0.15 ? Math.max(12, 38 - g * 28) : 38;
    if (now - this._typewriterLastAt < throttle) return;
    this._typewriterLastAt = now;

    const bufs = this.typewriterBuffers;
    if (!bufs.length) {
      if (!this.ctx) return;
      const master = this.ctx.createGain();
      master.gain.value = this.sfxGain * (0.12 + g * 0.45);
      master.connect(this.ctx.destination);
      const f = 180 + g * (40 + Math.random() * 420);
      this.#tone(master, f, 0.035 + g * 0.04, this.ctx.currentTime, "square");
      if (g > 0.35) {
        this.#tone(
          master,
          f * (0.35 + Math.random() * 0.4),
          0.05,
          this.ctx.currentTime + 0.01,
          "sawtooth"
        );
      }
      return;
    }
    const buf = bufs[Math.floor(Math.random() * bufs.length)];
    if (g < 0.08) {
      this.#playBuffer(buf, 0.69733125, {
        maxDur: 0.09,
        fade: 0.025,
        track: this._typewriterSources,
      });
      return;
    }
    // Progressive crush — rate warps + chopped windows + ghost layers
    const rates = [
      0.12 + Math.random() * 0.2,
      0.35 + Math.random() * 0.4,
      1.8 + Math.random() * 2.4,
      3.2 + Math.random() * 2.8,
    ];
    const playbackRate = rates[Math.floor(Math.random() * rates.length)];
    const gainScale = 0.85 + g * (1.6 + Math.random() * 1.2);
    this.#playBuffer(buf, gainScale, {
      playbackRate,
      maxDur: 0.04 + Math.random() * (0.05 + g * 0.08),
      fade: 0.008,
      track: this._typewriterSources,
    });
    if (g > 0.25) {
      window.setTimeout(() => {
        if (this.deadSilent || !this.enabled || !bufs.length) return;
        this.#playBuffer(buf, gainScale * 0.7, {
          playbackRate: playbackRate * (0.45 + Math.random() * 0.5),
          maxDur: 0.03 + Math.random() * 0.06,
          fade: 0.006,
          track: this._typewriterSources,
        });
      }, 8 + Math.floor(Math.random() * 28));
    }
    if (g > 0.55 && Math.random() < 0.7) {
      window.setTimeout(() => {
        if (this.deadSilent || !this.enabled || !bufs.length) return;
        this.#playBuffer(buf, gainScale * 0.5, {
          playbackRate: 0.06 + Math.random() * 0.14,
          maxDur: 0.07 + Math.random() * 0.08,
          fade: 0.01,
          track: this._typewriterSources,
        });
      }, 30 + Math.floor(Math.random() * 50));
    }
  }

  #playKeyInput() {
    if (this.keyInputBuffer) {
      this.#playBuffer(this.keyInputBuffer, 0.91287);
      return;
    }
    if (!this.ctx) return;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.3;
    master.connect(this.ctx.destination);
    this.#tone(master, 480, 0.03, this.ctx.currentTime, "square");
  }

  #playChannelSwitch() {
    if (this.channelSwitchBuffer) {
      this.#playBuffer(this.channelSwitchBuffer, 0.75);
      return;
    }
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.35;
    master.connect(this.ctx.destination);
    this.#tone(master, 420, 0.05, t, "triangle");
    this.#tone(master, 640, 0.04, t + 0.04, "triangle");
  }

  #playDropdownToggle() {
    if (this.journalSelectBuffer) {
      // Match channel-switch perceived level (files differ ~7 dB RMS)
      this.#playBuffer(this.journalSelectBuffer, 1.7);
      return;
    }
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.35;
    master.connect(this.ctx.destination);
    this.#tone(master, 280, 0.07, t, "sawtooth");
    this.#noise(master, 0.05, t);
  }

  /** Stretch/compress scan SFX so it spans the stepped top-to-bottom reveal. */
  #playRevealScan(durationMs, gainScale = 3.4) {
    const buf = this.revealScanBuffer;
    const targetSec = Math.max(0.08, (Number(durationMs) || 400) / 1000);
    if (buf) {
      this.stopRevealScan();
      const rate = Math.max(0.12, Math.min(4, buf.duration / targetSec));
      this._revealScanSource = this.#playBuffer(buf, gainScale, {
        playbackRate: rate,
        fade: 0.04,
      });
      if (this._revealScanSource) {
        this._revealScanSource.addEventListener("ended", () => {
          if (this._revealScanSource) this._revealScanSource = null;
        });
      }
      return;
    }
    // Fallback: soft stepped tick if sample missing
    if (!this.ctx) return;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.55;
    master.connect(this.ctx.destination);
    const t0 = this.ctx.currentTime;
    const steps = Math.max(4, Math.round(targetSec / 0.08));
    for (let i = 0; i < steps; i++) {
      this.#tone(master, 180 + i * 18, 0.035, t0 + i * (targetSec / steps), "square");
    }
  }

  #playUiBeep() {
    if (this.uiBeepBuffer) {
      this.#playBuffer(this.uiBeepBuffer, 0.8);
      return;
    }
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.35;
    master.connect(this.ctx.destination);
    this.#tone(master, 520, 0.035, t, "square");
  }

  /** Warped / chopped ui-beep for imperial mid-triangle fill ticks. */
  #playGlitchClick() {
    if (!this.ctx) return;
    if (this.uiBeepBuffer) {
      // Extreme rates — crushed / stretched button press
      const rates = [0.08, 0.11, 0.15, 0.19, 0.24, 2.6, 3.4, 4.2, 5.1, 0.06];
      const playbackRate = rates[Math.floor(Math.random() * rates.length)];
      const gainScale = 2.4 + Math.random() * 1.4;
      this.#playBuffer(this.uiBeepBuffer, gainScale, {
        playbackRate,
        maxDur: 0.06 + Math.random() * 0.1,
        fade: 0.01,
      });
      // Harsh stacked ghost — almost always
      const ghostRate =
        playbackRate < 1
          ? playbackRate * (0.4 + Math.random() * 0.3)
          : playbackRate * (1.15 + Math.random() * 0.5);
      window.setTimeout(() => {
        if (this.deadSilent || !this.enabled || !this.uiBeepBuffer) return;
        this.#playBuffer(this.uiBeepBuffer, gainScale * 0.85, {
          playbackRate: ghostRate,
          maxDur: 0.05 + Math.random() * 0.08,
          fade: 0.008,
        });
      }, 12 + Math.floor(Math.random() * 35));
      // Occasional third grit layer
      if (Math.random() < 0.55) {
        window.setTimeout(() => {
          if (this.deadSilent || !this.enabled || !this.uiBeepBuffer) return;
          this.#playBuffer(this.uiBeepBuffer, gainScale * 0.55, {
            playbackRate: 0.05 + Math.random() * 0.12,
            maxDur: 0.08 + Math.random() * 0.06,
            fade: 0.01,
          });
        }, 40 + Math.floor(Math.random() * 60));
      }
      return;
    }
    const t = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.75;
    master.connect(this.ctx.destination);
    const f = 55 + Math.random() * 380;
    this.#tone(master, f, 0.05, t, "square");
    this.#tone(master, f * 0.37, 0.07, t + 0.015, "sawtooth");
    this.#tone(master, f * 2.7, 0.03, t + 0.03, "square");
  }

  /**
   * Burst of distorted ui-beep ticks — same bed as imperial triangle glitches.
   * Used for pad corruption, tuner/controls out, and seal glitch-outs.
   */
  playGlitchBurst({ count = 5, gapMs = 75 } = {}) {
    if (this.deadSilent) return;
    const n = Math.max(1, Math.floor(count));
    const gap = Math.max(20, Number(gapMs) || 75);
    for (let i = 0; i < n; i++) {
      window.setTimeout(() => {
        this.play("glitchClick");
      }, i * gap);
    }
  }

  #playTunerNudge() {
    if (this.tunerNudgeBuffer) {
      this.#playBuffer(this.tunerNudgeBuffer, 0.85);
      return;
    }
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.3;
    master.connect(this.ctx.destination);
    this.#tone(master, 880, 0.03, t, "sine");
  }

  #playDeny() {
    if (this.uiDenyBuffer) {
      this.#playBuffer(this.uiDenyBuffer, 0.9);
      return;
    }
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.35;
    master.connect(this.ctx.destination);
    this.#tone(master, 140, 0.08, t, "square");
    this.#tone(master, 90, 0.1, t + 0.06, "sawtooth");
  }

  #playCodeSuccess() {
    if (this.codeSuccessBuffer) {
      this.#playBuffer(this.codeSuccessBuffer, 1.19);
      return;
    }
    // Fall back to synth unlock arpeggio
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.35;
    master.connect(this.ctx.destination);
    this.#tone(master, 160, 0.1, t, "square");
    this.#tone(master, 240, 0.1, t + 0.12, "square");
    this.#tone(master, 360, 0.14, t + 0.26, "triangle");
    this.#tone(master, 520, 0.18, t + 0.42, "triangle");
    this.#noise(master, 0.08, t + 0.5);
  }

  #playImperialClearance() {
    if (this.imperialClearanceBuffer) {
      this.#playBuffer(this.imperialClearanceBuffer, 1.0);
      return;
    }
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.35;
    master.connect(this.ctx.destination);
    this.#tone(master, 180, 0.12, t, "square");
    this.#tone(master, 270, 0.12, t + 0.14, "square");
    this.#tone(master, 405, 0.16, t + 0.3, "triangle");
    this.#tone(master, 540, 0.2, t + 0.48, "triangle");
    this.#tone(master, 810, 0.22, t + 0.7, "sine");
    this.#noise(master, 0.1, t + 0.85);
  }

  /** Stretch Imago sting so it spans the full on-screen logo window. */
  #playImagoSting(variant, durationMs) {
    const buf =
      variant === "reset" ? this.imagoResetBuffer : this.imagoBootBuffer;
    const targetSec = Math.max(0.12, (Number(durationMs) || 1000) / 1000);
    if (buf) {
      const rate = buf.duration / targetSec;
      this.#playBuffer(buf, 0.9, { playbackRate: rate, fade: 0.04 });
      return;
    }
    if (!this.ctx) return;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.2;
    master.connect(this.ctx.destination);
    this.#tone(master, 220, 0.08, this.ctx.currentTime, "triangle");
  }

  #playFlogSearchHit() {
    if (this.flogSearchHitBuffer) {
      this.#playBuffer(this.flogSearchHitBuffer, 0.85);
      return;
    }
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.3;
    master.connect(this.ctx.destination);
    this.#tone(master, 640, 0.05, t, "triangle");
    this.#tone(master, 880, 0.06, t + 0.05, "sine");
  }

  /** User typing / backspace in fields — throttled slightly for held keys. */
  #bindKeyInputSfx() {
    if (this.keyInputBound || typeof document === "undefined") return;
    this.keyInputBound = true;

    const isTypingTarget = (el) => {
      if (!el || !(el instanceof Element)) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      );
    };

    const shouldPlay = (e) => {
      if (!isTypingTarget(e.target)) return false;
      if (e.metaKey || e.ctrlKey || e.altKey) return false;
      if (e.key === "Backspace" || e.key === "Delete") return true;
      if (e.key.length === 1) return true;
      return false;
    };

    document.addEventListener(
      "keydown",
      (e) => {
        if (this.deadSilent || !this.enabled) return;
        if (!shouldPlay(e)) return;
        if (e.repeat) {
          const now = performance.now();
          if (now - this._keyInputLastAt < 45) return;
          this._keyInputLastAt = now;
        } else {
          this._keyInputLastAt = performance.now();
        }
        void this.#loadUiSfx().then(() => this.#playKeyInput());
      },
      true
    );
  }

  play(type = "click", opts = {}) {
    if (this.deadSilent || !this.enabled || !this.ctx) return;

    if (type === "click") {
      void this.#loadUiSfx().then(() => this.#playUiBeep());
      return;
    }

    if (type === "glitchClick") {
      void this.#loadUiSfx().then(() => this.#playGlitchClick());
      return;
    }

    if (type === "tunerNudge") {
      void this.#loadUiSfx().then(() => this.#playTunerNudge());
      return;
    }

    if (type === "deny") {
      void this.#loadUiSfx().then(() => this.#playDeny());
      return;
    }

    if (type === "codeSuccess" || type === "unlock") {
      void this.#loadUiSfx().then(() => this.#playCodeSuccess());
      return;
    }

    if (type === "imperial") {
      void this.#loadUiSfx().then(() => this.#playImperialClearance());
      return;
    }

    if (type === "imagoBoot" || type === "imagoReset") {
      const durationMs = opts?.durationMs ?? 2000;
      const variant = type === "imagoReset" ? "reset" : "boot";
      void this.#loadUiSfx().then(() =>
        this.#playImagoSting(variant, durationMs)
      );
      return;
    }

    if (type === "flogSearchHit") {
      void this.#loadUiSfx().then(() => this.#playFlogSearchHit());
      return;
    }

    if (type === "typewriter") {
      const glitch = opts?.glitch ?? 0;
      void this.#loadUiSfx().then(() => this.#playTypewriter(glitch));
      return;
    }

    if (type === "keyInput") {
      void this.#loadUiSfx().then(() => this.#playKeyInput());
      return;
    }

    if (type === "channelSwitch") {
      void this.#loadUiSfx().then(() => this.#playChannelSwitch());
      return;
    }

    if (type === "journalSelect" || type === "dropdownToggle") {
      void this.#loadUiSfx().then(() => this.#playDropdownToggle());
      return;
    }

    if (type === "revealScan") {
      const durationMs = opts?.durationMs ?? 400;
      const gainScale = opts?.gainScale ?? 3.4;
      void this.#loadUiSfx().then(() => this.#playRevealScan(durationMs, gainScale));
      return;
    }

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
