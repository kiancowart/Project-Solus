/**
 * Celeste AUX bleed — radio tuner → intercept reveal
 */

import { audio } from "./audio.js";
import { BLOOD_LYRICS } from "../content/arg-path.js";
import { hasImperialClearance } from "./clearance.js";
import { applyColdStartFromQuery } from "./progress.js";

applyColdStartFromQuery();

/* ==========================================================================
   INTERCEPT MESSAGE AUDIO — left rail progress / seek
   ========================================================================== */

/**
 * Intercept message audio reader.
 * Left rail tracks playback progress (top → bottom).
 * Click a point on the rail to jump there. Right rail mirrors scroll.
 */

/** Spoken Presage Projection intercept (Celeste). */
export const INTERCEPT_MESSAGE_AUDIO = "assets/audio/voice/intercept-message.mp3";

function setRailFill(el, amount) {
  if (!el) return;
  const t = Math.max(0, Math.min(1, amount));
  el.style.transform = `scaleY(${t})`;
}

function formatClock(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/**
 * @param {{
 *   playBtn?: HTMLButtonElement | null,
 *   audioScrub?: HTMLElement | null,
 *   audioRail?: HTMLElement | null,
 *   audioFill?: HTMLElement | null,
 *   audioTip?: HTMLElement | null,
 *   scrollHost?: HTMLElement | null,
 *   scrollFill?: HTMLElement | null,
 *   src?: string,
 * }} els
 */
export function initInterceptMessageAudio(els = {}) {
  const playBtn = els.playBtn ?? document.getElementById("intercept-audio-play");
  const audioScrub =
    els.audioScrub ?? document.getElementById("intercept-audio-scrub");
  const audioRail =
    els.audioRail ?? document.getElementById("intercept-audio-rail");
  const audioFill =
    els.audioFill ?? document.getElementById("intercept-audio-fill");
  const audioTip =
    els.audioTip ?? document.getElementById("intercept-audio-tip");
  const scrollHost =
    els.scrollHost ?? document.getElementById("intercept-scroll");
  const scrollFill =
    els.scrollFill ?? document.getElementById("intercept-scroll-fill");
  const src = els.src ?? INTERCEPT_MESSAGE_AUDIO;

  if (!playBtn) {
    return { ready: false, show() {}, destroy() {} };
  }

  const audio = new Audio(src);
  audio.preload = "metadata";

  let ready = false;
  let raf = 0;
  let destroyed = false;

  const ratioFromClientY = (clientY) => {
    // Use the visible rail height so click position matches the fill.
    const host = audioRail ?? audioScrub;
    if (!host) return 0;
    const rect = host.getBoundingClientRect();
    if (rect.height <= 0) return 0;
    return Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  };

  const progressRatio = () => {
    const dur = audio.duration;
    if (!Number.isFinite(dur) || dur <= 0) return 0;
    return Math.max(0, Math.min(1, audio.currentTime / dur));
  };

  const syncPlayingUi = () => {
    const playing = !audio.paused && !audio.ended;
    playBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    playBtn.classList.toggle("is-playing", playing);
    playBtn.setAttribute(
      "aria-label",
      playing ? "Pause intercept message" : "Play intercept message"
    );
  };

  const syncAudioRail = () => {
    const ratio = progressRatio();
    setRailFill(audioFill, ratio);
    if (audioRail) {
      audioRail.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
    }
  };

  const placeTip = (clientY, seconds) => {
    if (!audioTip || !audioScrub) return;
    const rect = audioScrub.getBoundingClientRect();
    if (rect.height <= 0) return;
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    audioTip.textContent = formatClock(seconds);
    audioTip.style.top = `${y}px`;
  };

  const seekToRatio = (ratio) => {
    const dur = audio.duration;
    if (!Number.isFinite(dur) || dur <= 0) return false;
    const next = Math.max(0, Math.min(Math.max(dur - 0.05, 0), ratio * dur));
    try {
      audio.currentTime = next;
    } catch {
      return false;
    }
    syncAudioRail();
    return true;
  };

  const syncScrollRail = () => {
    if (!scrollHost || !scrollFill) return;
    const rail = scrollFill.closest(".crt-rail");
    const max = scrollHost.scrollHeight - scrollHost.clientHeight;
    if (max <= 0) {
      if (rail) rail.hidden = true;
      setRailFill(scrollFill, 0);
      return;
    }
    if (rail) rail.hidden = false;
    setRailFill(scrollFill, scrollHost.scrollTop / max);
  };

  const tick = () => {
    if (destroyed) return;
    syncAudioRail();
    syncPlayingUi();
    if (!audio.paused && !audio.ended) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
    }
  };

  const startTick = () => {
    if (raf || destroyed) return;
    raf = requestAnimationFrame(tick);
  };

  const setLive = (on) => {
    audioScrub?.classList.toggle("is-live", on);
    audioRail?.classList.toggle("is-live", on);
    if (audioRail) audioRail.tabIndex = on ? 0 : -1;
  };

  const onMeta = () => {
    ready = Number.isFinite(audio.duration) && audio.duration > 0;
    playBtn.disabled = !ready;
    playBtn.title = ready ? "Play intercept message" : "Audio unavailable";
    setLive(ready);
    syncAudioRail();
    syncPlayingUi();
  };

  const onError = () => {
    ready = false;
    playBtn.disabled = true;
    playBtn.setAttribute("aria-pressed", "false");
    playBtn.classList.remove("is-playing");
    setRailFill(audioFill, 0);
    playBtn.title = "Audio unavailable";
    setLive(false);
  };

  audio.addEventListener("loadedmetadata", onMeta);
  audio.addEventListener("durationchange", onMeta);
  audio.addEventListener("error", onError);
  audio.addEventListener("ended", () => {
    syncPlayingUi();
    syncAudioRail();
  });
  audio.addEventListener("pause", syncPlayingUi);
  audio.addEventListener("play", () => {
    syncPlayingUi();
    startTick();
  });
  audio.addEventListener("seeked", syncAudioRail);
  audio.addEventListener("timeupdate", () => {
    if (!raf) syncAudioRail();
  });

  playBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!ready || playBtn.disabled) return;
    try {
      if (audio.paused || audio.ended) {
        if (audio.ended) audio.currentTime = 0;
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      onError();
    }
  });

  const scrubHost = audioScrub ?? audioRail;
  if (scrubHost) {
    scrubHost.addEventListener("pointermove", (e) => {
      if (!ready) return;
      const ratio = ratioFromClientY(e.clientY);
      const dur = audio.duration;
      if (Number.isFinite(dur) && dur > 0) {
        placeTip(e.clientY, ratio * dur);
      }
    });

    // Single click jumps playback to that point — no drag scrubbing.
    scrubHost.addEventListener("click", (e) => {
      if (!ready || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const ratio = ratioFromClientY(e.clientY);
      const dur = audio.duration;
      if (!seekToRatio(ratio)) return;
      if (Number.isFinite(dur) && dur > 0) {
        placeTip(e.clientY, ratio * dur);
      }
    });

    audioRail?.addEventListener("keydown", (e) => {
      if (!ready) return;
      const dur = audio.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      const step = dur * 0.05;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        seekToRatio((audio.currentTime + step) / dur);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        seekToRatio((audio.currentTime - step) / dur);
      } else if (e.key === "Home") {
        e.preventDefault();
        seekToRatio(0);
      } else if (e.key === "End") {
        e.preventDefault();
        seekToRatio(1);
      }
    });
  }

  scrollHost?.addEventListener("scroll", syncScrollRail, { passive: true });
  window.addEventListener("resize", syncScrollRail);

  try {
    audio.load();
  } catch {
    onError();
  }

  syncScrollRail();
  setRailFill(audioFill, 0);
  syncPlayingUi();

  return {
    ready: () => ready,
    audio,
    show() {
      syncScrollRail();
      syncAudioRail();
      syncPlayingUi();
    },
    hide() {
      try {
        audio.pause();
      } catch {
        /* ignore */
      }
      audioScrub?.classList.remove("is-scrubbing");
      audioRail?.classList.remove("is-scrubbing");
      syncPlayingUi();
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      try {
        audio.pause();
      } catch {
        /* ignore */
      }
      window.removeEventListener("resize", syncScrollRail);
    },
  };
}


/** Start site ambience on first gesture (autoplay policy). */
function bindAmbienceUnlock() {
  const unlock = async () => {
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("keydown", unlock);
    try {
      await audio.enable();
    } catch {
      /* ignore */
    }
  };
  document.addEventListener("pointerdown", unlock, { once: true });
  document.addEventListener("keydown", unlock, { once: true });

  // Resume after clearance pad → tuner navigation
  if (audio.shouldResumeAmbience()) {
    void unlock();
  }
}

bindAmbienceUnlock();

const FREQ_MIN = 0;
const FREQ_MAX = 108.0;
const LOCK_HOLD_MS = 2000;
const LOCK_TOLERANCE = 0.12;
/** Soft pull toward a carrier — keep narrow so spinning past stays easy */
const DETENT_RANGE = 0.75;
/** Only magnetize while the dial is still crawling */
const DETENT_MAX_ACCEL = 0.28;
const DETENT_PULL = 1.05;
const DETENT_SPEED_FLOOR = 0.55;
const SIGNAL_SRC = "assets/audio/music/carrier-0979.mp3";
const BLOOD_SRC = "assets/audio/music/carrier-0333.mp3";
/** Puzzle carriers are silent outside this ±MHz band */
const SIGNAL_HEAR_WINDOW = 15;
/** Easter-egg beds — audible only inside this ±MHz band */
const EGG_HEAR_WINDOW = 10;
/**
 * Clarity curve inside the hear window — higher = static hangs on longer;
 * only near/exact center reads either bed clearly.
 */
const SIGNAL_CLARITY_CURVE = 3.8;
const MASTER_VOLUME = 0.28;
const BAR_COUNT = 72;

/** Greeting carrier — full Celeste aperture */
const GREETING = {
  id: "greeting",
  freq: 97.9,
  storageKey: "lattice.interceptTuned",
  kind: "message",
  lockable: true,
};

/** Emergency frequency — glow + blood bed; does not lock the dial */
const ECHO = {
  id: "echo",
  freq: 33.3,
  storageKey: "lattice.interceptEcho",
  kind: "echo",
  lockable: false,
};

/**
 * Soft easter-egg beds — waveform + audio only.
 * No glow, detent, snap, or lock (kept out of CARRIERS).
 */
const EASTER_BEDS = [
  { id: "song1", freq: 10.5, src: "assets/audio/music/egg-0105.mp3" },
  { id: "curiosity", freq: 51.2, src: "assets/audio/voice/egg-0512.mp3" },
  { id: "song2", freq: 66.6, src: "assets/audio/music/egg-0666.mp3" },
];

const CARRIERS = [GREETING, ECHO];
const TUNED_KEY = GREETING.storageKey;

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

function nearestCarrier(freq) {
  let best = null;
  let bestDist = Infinity;
  for (const c of CARRIERS) {
    const d = Math.abs(freq - c.freq);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return { carrier: best, dist: bestDist };
}

/** 0 outside ±window; rises late so the bed stays buried until close. */
function clarityInWindow(dist, window) {
  if (!Number.isFinite(dist) || dist > window) return 0;
  const t = 1 - dist / window;
  return Math.pow(clamp(t, 0, 1), SIGNAL_CLARITY_CURVE);
}

function carrierClarity(dist) {
  return clarityInWindow(dist, SIGNAL_HEAR_WINDOW);
}

function eggClarity(dist) {
  return clarityInWindow(dist, EGG_HEAR_WINDOW);
}

function nearestEasterBed(freq) {
  let best = null;
  let bestDist = Infinity;
  for (const bed of EASTER_BEDS) {
    const d = Math.abs(freq - bed.freq);
    if (d < bestDist) {
      bestDist = d;
      best = bed;
    }
  }
  return { bed: best, dist: bestDist };
}

function storageFlag(key) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setStorageFlag(key) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* private mode */
  }
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
    this.clearanceBtn = null;
    this.hubBtn = null;
    this.footHubBtn = null;
    this.tunerRoutes = $("#tuner-routes");
    this.padBtns = [...document.querySelectorAll('.lattice-route[data-route="pad"]')];
    this.hubBtns = [...document.querySelectorAll('.lattice-route[data-route="hub"]')];
    this.skipBtn = $("#intercept-skip");
    this.messageAudio = null;
    this.lyricRoot = $("#blood-lyric");

    this.freq = 82.4;
    this.dialAngle = -18;
    this.direction = 0;
    this.holdMs = 0;
    this.lockHoldMs = 0;
    this.activeCarrier = null;
    this.locked = false;
    this.revealed = false;
    this.audioReady = false;
    this.flatViz = false;
    this.hideBars = false;
    this.clarity = 0;
    /** Drives scope motion without CSS glow (includes easter beds). */
    this.vizClarity = 0;
    this.bloodLyricLive = false;
    this.lyricIndex = 0;
    this.lyricLastT = 0;
    this.lyricTyping = null;

    this.raf = 0;
    this.lastTs = 0;
    this.barHeight = [];
    this.barNodes = [];
    this.noiseFloor = [];

    this.ctx = null;
    this.signal = null;
    this.signalGain = null;
    this.blood = null;
    this.bloodGain = null;
    /** @type {{ id: string, freq: number, el: HTMLAudioElement, gain: GainNode }[]} */
    this.eggBeds = [];
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
    this.#bindClearanceHandoff();
    this.#renderFreq();
    this.#setClarity(0);
    this.#renderDial();
    this.#syncClearanceExit();
    this.lastTs = performance.now();
    this.raf = requestAnimationFrame((t) => this.#tick(t));
  }

  #hasTunedBefore() {
    return storageFlag(TUNED_KEY);
  }

  #markTuned() {
    setStorageFlag(TUNED_KEY);
  }

  #syncClearanceExit() {
    const tuned = this.#hasTunedBefore();
    const imperial = hasImperialClearance();

    // Under-dial strip: pad after 097.9 lock; hub after Imperial
    if (this.tunerRoutes) {
      this.tunerRoutes.hidden = !tuned;
      this.root?.classList.toggle("radio--has-clearance", tuned);
      const hub = this.tunerRoutes.querySelector('[data-route="hub"]');
      if (hub) hub.hidden = !(tuned && imperial);
    }

    // Message-foot hub only (pad there is always present)
    for (const el of this.hubBtns) {
      if (el.closest(".intercept__foot")) el.hidden = !imperial;
    }
  }

  #bindClearanceHandoff() {
    const links = [
      ...this.padBtns,
      ...this.hubBtns,
    ];
    for (const el of links) {
      if (!el || el.dataset.ambienceBound) continue;
      el.dataset.ambienceBound = "1";
      el.addEventListener("click", () => {
        audio.markAmbienceLive();
      });
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
    const setActiveBtn = (dir) => {
      this.btnLeft?.classList.toggle("is-active", dir === -1);
      this.btnRight?.classList.toggle("is-active", dir === 1);
    };

    const start = (dir) => (e) => {
      e.preventDefault();
      if (this.locked) return;
      this.direction = dir;
      this.holdMs = 0;
      setActiveBtn(dir);
      void this.#ensureAudio();
      if (audio.enabled) audio.play("channelSwitch");
      else void audio.enable().then(() => audio.play("channelSwitch"));
      this.root?.classList.add("radio--spinning");
    };
    const stop = () => {
      this.direction = 0;
      this.holdMs = 0;
      setActiveBtn(0);
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

    const keyDir = (e) => {
      const key = e.key;
      if (key === "ArrowLeft" || key === "a" || key === "A") return -1;
      if (key === "ArrowRight" || key === "d" || key === "D") return 1;
      return 0;
    };

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

    window.addEventListener("keydown", (e) => {
      if (this.locked || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const dir = keyDir(e);
      if (!dir) return;
      start(dir)(e);
    });

    window.addEventListener("keyup", (e) => {
      const dir = keyDir(e);
      if (!dir) return;
      if (this.direction === dir) stop();
    });
  }

  async #ensureAudio() {
    if (this.audioReady) {
      if (this.ctx?.state === "suspended") await this.ctx.resume();
      if (this.signal?.paused && !this.locked) {
        this.signal.play().catch(() => {});
      }
      if (this.blood?.paused && !this.locked) {
        this.blood.play().catch(() => {});
      }
      for (const bed of this.eggBeds) {
        if (bed.el.paused && !this.locked) {
          bed.el.play().catch(() => {});
        }
      }
      return;
    }

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    await this.ctx.resume();

    const el = new Audio(SIGNAL_SRC);
    el.loop = true;
    el.preload = "auto";
    this.signal = el;

    const bloodEl = new Audio(BLOOD_SRC);
    bloodEl.loop = true;
    bloodEl.preload = "auto";
    this.blood = bloodEl;

    const source = this.ctx.createMediaElementSource(el);
    const bloodSource = this.ctx.createMediaElementSource(bloodEl);

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

    this.bloodGain = this.ctx.createGain();
    this.bloodGain.gain.value = 0;

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
    this.noiseGain.gain.value = 0.54;

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

    bloodSource.connect(this.bloodGain);

    this.eggBeds = EASTER_BEDS.map((def) => {
      const eggEl = new Audio(def.src);
      eggEl.loop = true;
      eggEl.preload = "auto";
      const eggSource = this.ctx.createMediaElementSource(eggEl);
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      eggSource.connect(gain);
      gain.connect(this.analyser);
      return { id: def.id, freq: def.freq, el: eggEl, gain };
    });

    this.noiseNode.connect(this.noiseDull);
    this.noiseNode.connect(this.noiseBright);
    this.noiseDull.connect(noiseMix);
    this.noiseBright.connect(noiseMix);
    noiseMix.connect(this.noiseGain);

    this.signalGain.connect(this.analyser);
    this.bloodGain.connect(this.analyser);
    this.noiseGain.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.noiseNode.start();
    try {
      await Promise.all([
        el.play(),
        bloodEl.play(),
        ...this.eggBeds.map((b) => b.el.play()),
      ]);
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

  #applyAudioMix(puzzleClarity) {
    if (!this.audioReady) return;
    const t = this.ctx.currentTime;

    const greetClarity = carrierClarity(Math.abs(this.freq - GREETING.freq));
    const bloodClarity = carrierClarity(Math.abs(this.freq - ECHO.freq));
    const { bed: nearEgg, dist: eggDist } = nearestEasterBed(this.freq);
    const nearEggClarity = nearEgg ? eggClarity(eggDist) : 0;

    const { carrier: nearPuzzle, dist: puzzleDist } = nearestCarrier(this.freq);
    // Prefer the closer mark so easter beds don't fight puzzle carriers
    const eggPriority =
      nearEgg &&
      nearEggClarity > 0 &&
      (!nearPuzzle || eggDist < puzzleDist - 0.05);

    let audioClarity = puzzleClarity;

    if (eggPriority) {
      audioClarity = nearEggClarity;
      this.bloodGain?.gain.setTargetAtTime(0, t, 0.08);
      this.signalGain.gain.setTargetAtTime(0.015 * (1 - nearEggClarity), t, 0.12);
      for (const bed of this.eggBeds) {
        const c = eggClarity(Math.abs(this.freq - bed.freq));
        bed.gain.gain.setTargetAtTime(c > 0 ? 0.35 + c * 1.2 : 0, t, 0.1);
      }
    } else {
      for (const bed of this.eggBeds) {
        bed.gain.gain.setTargetAtTime(0, t, 0.08);
      }
      if (bloodClarity > 0) {
        this.bloodGain?.gain.setTargetAtTime(0.45 + bloodClarity * 1.55, t, 0.08);
        this.signalGain.gain.setTargetAtTime(0.015 * (1 - bloodClarity), t, 0.12);
      } else if (greetClarity > 0) {
        this.bloodGain?.gain.setTargetAtTime(0, t, 0.08);
        this.signalGain.gain.setTargetAtTime(0.04 + greetClarity * 0.96, t, 0.1);
      } else {
        this.bloodGain?.gain.setTargetAtTime(0, t, 0.08);
        this.signalGain.gain.setTargetAtTime(0.02, t, 0.12);
      }
    }

    this.vizClarity = eggPriority ? nearEggClarity : puzzleClarity;
    const mud = 1 - audioClarity;

    // Static falls off gently — still present until you're nearly on-carrier
    this.noiseGain.gain.setTargetAtTime(0.195 + mud * 0.39, t, 0.12);
    this.muffLp.frequency.setTargetAtTime(420 + audioClarity * 5200, t, 0.14);
    this.muffHp.frequency.setTargetAtTime(130 - audioClarity * 80, t, 0.14);
    if (this.noiseBright) {
      this.noiseBright.frequency.setTargetAtTime(3000 - audioClarity * 700, t, 0.15);
    }
    if (this.noiseDull) {
      this.noiseDull.frequency.setTargetAtTime(1100 + audioClarity * 350, t, 0.15);
    }
  }

  #tick(ts) {
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;

    if (!this.locked && this.direction !== 0) {
      this.holdMs += dt * 1000;
      const accel = Math.pow(Math.min(1, this.holdMs / 2500), 1.65);
      let speed = 0.2 + accel * 22;

      const { carrier: near, dist: distBefore } = nearestCarrier(this.freq);
      if (near && distBefore < DETENT_RANGE && accel < DETENT_MAX_ACCEL) {
        speed *= DETENT_SPEED_FLOOR + (1 - DETENT_SPEED_FLOOR) * (distBefore / DETENT_RANGE);
        this.freq += (near.freq - this.freq) * dt * DETENT_PULL;
      }

      const atMin = this.freq <= FREQ_MIN && this.direction < 0;
      const atMax = this.freq >= FREQ_MAX && this.direction > 0;

      if (!atMin && !atMax) {
        this.freq = clamp(this.freq + this.direction * speed * dt, FREQ_MIN, FREQ_MAX);

        // Snap to exact mark only when nearly stopped — don't glue while scrolling past
        const snap = nearestCarrier(this.freq);
        if (snap.carrier && snap.dist <= LOCK_TOLERANCE && accel < 0.15) {
          this.freq = snap.carrier.freq;
        }

        this.dialAngle += this.direction * (35 + accel * 480) * dt;
        this.#renderFreq();
        this.#renderDial();
      } else {
        this.freq = clamp(this.freq, FREQ_MIN, FREQ_MAX);
        this.#renderFreq();
      }
    }

    if (!this.locked) {
      const { carrier, dist } = nearestCarrier(this.freq);
      const { bed: nearEgg, dist: eggDist } = nearestEasterBed(this.freq);
      const onEgg =
        nearEgg &&
        eggClarity(eggDist) > 0 &&
        (!carrier || eggDist < dist - 0.05);

      // Easter beds never raise CSS --clarity (no phosphor lock glow)
      this.#setClarity(onEgg ? 0 : carrierClarity(dist));

      if (!onEgg && carrier && dist <= LOCK_TOLERANCE) {
        this.root?.classList.add("radio--on-signal");
        if (carrier.kind === "echo") {
          this.root?.classList.add("radio--on-echo");
          this.root?.classList.remove("radio--freq-gold");
        } else {
          this.root?.classList.remove("radio--on-echo");
          // Gold only when the display reads exactly 097.9
          const onGreetingExact =
            carrier.id === GREETING.id &&
            formatFreq(this.freq) === formatFreq(GREETING.freq);
          this.root?.classList.toggle("radio--freq-gold", onGreetingExact);
        }

        if (carrier.lockable === false) {
          this.lockHoldMs = 0;
        } else if (this.direction === 0) {
          // Must hold still on the greeting carrier — scrolling past shouldn't arm the lock
          this.lockHoldMs += dt * 1000;
          if (this.lockHoldMs >= LOCK_HOLD_MS) void this.#lockOn(carrier);
        } else {
          this.lockHoldMs = Math.max(0, this.lockHoldMs - dt * 1000 * 3);
        }
      } else {
        this.lockHoldMs =
          this.direction === 0 ? Math.max(0, this.lockHoldMs - dt * 1000 * 1.5) : 0;
        if (this.lockHoldMs === 0) {
          this.root?.classList.remove(
            "radio--on-signal",
            "radio--on-echo",
            "radio--freq-gold"
          );
        }
      }
    }

    this.#paintViz(dt);
    this.#syncBloodLyrics();
    this.raf = requestAnimationFrame((t) => this.#tick(t));
  }

  #syncBloodLyrics() {
    if (!this.lyricRoot || this.locked || this.revealed) {
      if (this.bloodLyricLive) this.#stopBloodLyrics();
      return;
    }

    // Poem only while the dial sits on 033.3 — not in the wider hear band
    const onMark = Math.abs(this.freq - ECHO.freq) <= LOCK_TOLERANCE;

    if (!this.bloodLyricLive && onMark) {
      this.#startBloodLyrics();
    } else if (this.bloodLyricLive && !onMark) {
      this.#stopBloodLyrics();
      return;
    }

    if (!this.bloodLyricLive || !this.blood) return;

    let t = 0;
    try {
      t = this.blood.currentTime || 0;
    } catch {
      return;
    }

    // Track looped
    if (t + 0.35 < this.lyricLastT) {
      this.#resetBloodLyricState({ keepRoot: true });
    }
    this.lyricLastT = t;

    while (
      this.lyricIndex < BLOOD_LYRICS.length &&
      t >= BLOOD_LYRICS[this.lyricIndex].at
    ) {
      this.#cueBloodLyric(BLOOD_LYRICS[this.lyricIndex], t);
      this.lyricIndex += 1;
    }

    this.#tickBloodTypewriter(t);
  }

  #startBloodLyrics() {
    this.bloodLyricLive = true;
    this.#resetBloodLyricState({ keepRoot: true });
    if (this.lyricRoot) {
      this.lyricRoot.hidden = false;
      this.lyricRoot.replaceChildren();
    }
    if (this.blood) {
      try {
        this.blood.currentTime = 0;
      } catch {
        /* ignore seek race */
      }
    }
  }

  #stopBloodLyrics() {
    this.bloodLyricLive = false;
    this.lyricTyping = null;
    if (!this.lyricRoot) return;
    for (const el of this.lyricRoot.querySelectorAll(".blood-lyric__line")) {
      el.classList.add("is-fading", "is-done");
    }
    window.setTimeout(() => {
      if (!this.bloodLyricLive && this.lyricRoot) {
        this.lyricRoot.replaceChildren();
        this.lyricRoot.hidden = true;
      }
    }, 1200);
  }

  #resetBloodLyricState({ keepRoot = false } = {}) {
    this.lyricIndex = 0;
    this.lyricLastT = 0;
    this.lyricTyping = null;
    if (!keepRoot || !this.lyricRoot) return;
    this.lyricRoot.replaceChildren();
  }

  #cueBloodLyric(line, nowT) {
    if (!this.lyricRoot) return;

    // Previous live line begins fading as the next arrives
    for (const el of this.lyricRoot.querySelectorAll(
      ".blood-lyric__line:not(.is-fading)"
    )) {
      el.classList.add("is-fading", "is-done");
      const stale = el;
      window.setTimeout(() => stale.remove(), 1200);
    }

    const el = document.createElement("p");
    el.className = "blood-lyric__line";
    el.dataset.full = line.text;
    el.textContent = "";
    this.lyricRoot.appendChild(el);

    const next = BLOOD_LYRICS[this.lyricIndex + 1];
    const until = next ? next.at : Math.max(nowT + 2.4, line.at + 2.4);
    const span = Math.max(0.55, until - line.at);
    // Finish typing a bit before the next cue
    const typeFor = Math.min(span * 0.72, Math.max(0.9, line.text.length * 0.045));

    this.lyricTyping = {
      el,
      full: line.text,
      startAt: line.at,
      typeFor,
    };
  }

  #tickBloodTypewriter(nowT) {
    const job = this.lyricTyping;
    if (!job?.el) return;

    const reduced =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      job.el.textContent = job.full;
      job.el.classList.add("is-done");
      this.lyricTyping = null;
      return;
    }

    const elapsed = Math.max(0, nowT - job.startAt);
    const progress = Math.min(1, elapsed / job.typeFor);
    const n = Math.floor(progress * job.full.length);
    job.el.textContent = job.full.slice(0, n);

    if (progress >= 1) {
      job.el.textContent = job.full;
      job.el.classList.add("is-done");
      this.lyricTyping = null;
    }
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
    const phase = this.lastTs * 0.009;
    // Egg beds drive scope motion without raising CSS --clarity (no lock glow)
    const c = Math.max(this.clarity, this.vizClarity || 0);
    // Push mid-clarity toward static so only a hard lock looks “alive”
    const signalWeight = Math.pow(c, 1.65);
    const staticWeight = 1 - signalWeight;

    for (let i = 0; i < BAR_COUNT; i++) {
      let target;

      if (this.flatViz) {
        target = 0;
      } else if (hasAudio) {
        const bin = Math.floor((i / BAR_COUNT) * (this.freqData.length * 0.72));
        const spectral = this.freqData[bin] / 255;
        const tIdx = Math.floor((i / BAR_COUNT) * this.timeData.length);
        const wave = Math.abs(this.timeData[tIdx] - 128) / 128;

        // Static: low, soft hash — still distinct from carrier, less frantic
        this.noiseFloor[i] =
          (this.noiseFloor[i] * 0.72 + Math.random() * 0.28) % 1;
        const crackle = this.noiseFloor[i];
        const hash =
          Math.abs(Math.sin(i * 1.7 + phase * 1.6)) * 0.22 +
          Math.abs(Math.cos(i * 0.41 - phase)) * 0.16;
        const staticShape = 0.05 + crackle * 0.28 + hash * 0.16 * staticWeight;

        // Signal: taller coherent peaks, tempered so motion stays readable
        const signalShape = Math.pow(spectral * 0.5 + wave * 0.95, 0.9);
        const boost = 0.18 + signalWeight * 1.05;
        const blend = staticShape * staticWeight * 0.95 + signalShape * boost;

        const edge = Math.abs(i - mid) / mid;
        const centerBias =
          signalWeight > 0.35
            ? 1.02 - edge * (0.06 + signalWeight * 0.16)
            : 0.78 + edge * 0.28 + crackle * 0.1;
        target = clamp(blend * centerBias, 0.03, 0.92);
      } else {
        this.noiseFloor[i] = (this.noiseFloor[i] * 0.7 + Math.random() * 0.3) % 1;
        target = 0.05 + this.noiseFloor[i] * 0.36;
      }

      // Gentler follow — static still flickers; signal eases instead of snaps
      const lerp = this.flatViz
        ? Math.min(1, dt * 4.5)
        : Math.min(1, dt * (8 + staticWeight * 10 + signalWeight * 6));
      this.barHeight[i] += (target - this.barHeight[i]) * lerp;
      this.barNodes[i].style.setProperty("--h", this.barHeight[i].toFixed(3));
    }
  }

  async #lockOn(carrier) {
    if (this.locked) return;
    if (carrier.lockable === false) return;

    this.locked = true;
    this.activeCarrier = carrier;
    this.direction = 0;
    this.freq = carrier.freq;
    this.#renderFreq();
    this.#setClarity(1);

    this.root?.classList.remove("radio--spinning", "radio--on-echo");
    this.root?.classList.add("radio--locked");
    this.stage?.classList.add("intercept-stage--locked");

    if (carrier.kind === "message") this.#markTuned();
    this.#syncClearanceExit();

    for (const btn of [this.btnLeft, this.btnRight]) {
      if (!btn) continue;
      btn.classList.remove("is-active");
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
    }

    await this.#ensureAudio();
    if (this.bloodGain && this.ctx) {
      this.bloodGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    for (const bed of this.eggBeds) {
      bed.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    await this.#lockGreeting();
  }

  async #lockGreeting() {
    // Dial / arrows / freq leave; visualizer stays through the playback
    await this.#wait(280);
    this.root?.classList.add("radio--controls-out");
    if (!audio.enabled) {
      try {
        await audio.enable();
      } catch {
        /* ignore */
      }
    }
    audio.playGlitchBurst({ count: 5, gapMs: 75 });
    await this.#wait(900);
    this.root?.classList.add("radio--controls-gone");

    await this.#playCleanSignal();

    this.flatViz = true;
    this.root?.classList.add("radio--flat");
    await this.#wait(1800);

    this.hideBars = true;
    this.root?.classList.add("radio--bars-gone");
    audio.playGlitchBurst({ count: 5, gapMs: 75 });
    await this.#wait(900);

    this.root?.classList.add("radio--splitting");
    this.stage?.classList.add("intercept-stage--opening");
    const openMs = 1150;
    if (audio.enabled) audio.play("revealScan", { durationMs: openMs });
    else void audio.enable().then(() => audio.play("revealScan", { durationMs: openMs }));
    await this.#wait(openMs);

    this.#revealMessage();
  }

  async #playCleanSignal() {
    if (!this.signal || !this.ctx) return;

    const t = this.ctx.currentTime;
    this.noiseGain.gain.setTargetAtTime(0.009, t, 0.08);
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

    const skipBtn = this.skipBtn;
    if (skipBtn) skipBtn.hidden = false;

    await new Promise((resolve) => {
      let settled = false;
      let timeoutId = 0;
      const done = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        this.signal.removeEventListener("ended", done);
        skipBtn?.removeEventListener("click", onSkip);
        window.removeEventListener("keydown", onSkipKey);
        if (skipBtn) skipBtn.hidden = true;
        resolve();
      };
      const onSkip = () => {
        try {
          this.signal.pause();
        } catch {
          /* ignore */
        }
        done();
      };
      const onSkipKey = (e) => {
        if (e.key !== "Enter") return;
        if (!skipBtn || skipBtn.hidden || settled) return;
        e.preventDefault();
        onSkip();
      };
      this.signal.addEventListener("ended", done);
      skipBtn?.addEventListener("click", onSkip);
      window.addEventListener("keydown", onSkipKey);
      this.signal.play().catch(() => setTimeout(done, 1200));
      timeoutId = window.setTimeout(done, 13000);
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

    if (!this.messageAudio) {
      this.messageAudio = initInterceptMessageAudio();
    }
    this.messageAudio.show();

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
