/**
 * LATTICE.OS — G512 Carapace (Cara), bonded: Solus
 * Boot playback, navigation, CRT fidelity, and interface audio.
 *
 * Intro splash COPY lives in: boot-content.js  ← edit text / logo there
 */

import { BOOT_LINES, BOOT_LOGO, ACCESS_CODE, ACCESS_SUCCESS, MOTION, GATE_EASTER_EGGS, WHISPER, SOUNDTRACK, SYSTEM_CHART, FLIGHT_LOG } from "./boot-content.js";
import { LORE_CATALOG } from "./lore-catalog.js";

/** Red channel-banner copy — keyed by nav `data-panel` */
const CHANNEL_TITLES = {
  overview: "HULL TELEMETRY // CRAFT STATUS",
  flightlog: "FLIGHT LOG // PERSONAL RECORD",
  archives: "ARCHIVES // SHIP MEMORY",
  cartography: "CARTOGRAPHY // STELLAR FIX",
  diagnostics: "FIDELITY BUS // SIGNAL DIAGNOSTICS",
  auxiliary: "EXTERNAL // GUEST CHANNEL",
};

/* ==========================================================================
   AUDIO — Web Audio API synthesizer
   ========================================================================== */

class TerminalAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.sfxGain = 0.55;
    this.musicGain = Math.max(0, Math.min(1, SOUNDTRACK?.volume ?? 0.15));
    this.soundtrack = null;
    this.musicGainNode = null;
    this.soundtrackStarted = false;
    this.soundtrackRouted = false;
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
    await this.ensure();
    this.enabled = true;
    this.#syncSoundtrack();
  }

  disable() {
    this.enabled = false;
    this.#syncSoundtrack();
  }

  setSfxGain(normalized) {
    this.sfxGain = Math.max(0, Math.min(1, normalized));
  }

  setMusicGain(normalized) {
    this.musicGain = Math.max(0, Math.min(1, normalized));
    this.#syncSoundtrack();
  }

  /** Start looping clearance soundtrack once (idempotent). */
  async startSoundtrack() {
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
      // Autoplay may still block; next enable()/gesture retries via #syncSoundtrack
      this.soundtrackStarted = false;
    }
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

  #syncSoundtrack() {
    if (!this.soundtrack) return;

    const level = this.enabled ? this.musicGain : 0;
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = level;
    } else {
      this.soundtrack.volume = level;
    }

    if (this.enabled && this.soundtrackStarted && this.soundtrack.paused) {
      this.soundtrack.play().catch(() => {});
    } else if (!this.enabled && !this.soundtrack.paused) {
      this.soundtrack.pause();
    }
  }

  play(type = "click") {
    if (!this.enabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.value = this.sfxGain * 0.35;
    master.connect(this.ctx.destination);

    if (type === "boot") {
      this.#tone(master, 180, 0.045, t, "square");
      return;
    }

    if (type === "unlock") {
      // Heavier clearance sting — ascending industrial tones
      this.#tone(master, 160, 0.1, t, "square");
      this.#tone(master, 240, 0.1, t + 0.12, "square");
      this.#tone(master, 360, 0.14, t + 0.26, "triangle");
      this.#tone(master, 520, 0.18, t + 0.42, "triangle");
      this.#noise(master, 0.08, t + 0.5);
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

const audio = new TerminalAudio();

/* ==========================================================================
   MOTION HELPERS — stiff Alien-terminal typing / stepped reveal
   ========================================================================== */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pace factor for boot-only timings (< 1 = faster). */
function bootPace() {
  return MOTION.bootPace ?? 1;
}

function bootMs(ms) {
  return Math.max(0, Math.round(Number(ms) * bootPace()));
}

function prefersReducedMotion() {
  return (
    document.body.classList.contains("reduce-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

async function typeText(el, fullText, skippedRef = null, onTick = null, pace = 1) {
  if (prefersReducedMotion()) {
    el.textContent = fullText;
    onTick?.();
    return;
  }

  const typeMs = (MOTION.typeMs ?? 22) * pace;
  const hitchEvery = MOTION.hitchEvery ?? 7;
  const hitchMs = (MOTION.hitchMs ?? 55) * pace;
  let out = "";

  for (let i = 0; i < fullText.length; i++) {
    if (skippedRef?.skipped) {
      el.textContent = fullText;
      onTick?.();
      return;
    }
    out += fullText[i];
    el.textContent = out;
    onTick?.();
    if (i % 8 === 0) audio.play("boot");
    let wait = typeMs;
    if (hitchEvery > 0 && i > 0 && i % hitchEvery === 0) wait += hitchMs;
    await sleep(wait);
  }
}

/** Blink . / .. / ... on a span for durationMs (loading hold) */
async function blinkBootDots(dotsEl, durationMs, skippedRef = null) {
  if (!dotsEl || durationMs <= 0) return;

  if (prefersReducedMotion()) {
    dotsEl.textContent = "...";
    await sleep(Math.min(durationMs, 400));
    return;
  }

  const frames = [".", "..", "..."];
  const frameMs = MOTION.dotsFrameMs ?? 280;
  let i = 0;
  const end = performance.now() + durationMs;

  while (performance.now() < end) {
    if (skippedRef?.skipped) break;
    dotsEl.textContent = frames[i % frames.length];
    i += 1;
    await sleep(frameMs);
  }

  if (!skippedRef?.skipped) dotsEl.textContent = "...";
}

async function revealTopToBottom(container) {
  if (!container) return;

  const blocks = [...container.children].filter(
    (el) => el.nodeType === 1 && !el.hidden && !el.hasAttribute("hidden")
  );

  if (prefersReducedMotion()) {
    blocks.forEach((el) => {
      el.classList.remove("is-pending");
      el.classList.add("is-shown");
    });
    return;
  }

  blocks.forEach((el) => {
    el.classList.remove("is-shown");
    el.classList.add("is-pending");
  });

  const step = MOTION.blockStepMs ?? 70;
  for (const el of blocks) {
    el.classList.remove("is-pending");
    el.classList.add("is-shown");
    audio.play("boot");
    await sleep(step);
  }
}

async function revealPanel(panel) {
  panel.classList.add("is-revealing");
  const body = panel.querySelector(".panel__body");
  if (body) await revealTopToBottom(body);
  panel.classList.remove("is-revealing");
}

/* ==========================================================================
   BOOT SEQUENCE — clearance keypad → log → logo → hub
   ========================================================================== */

function prepareBootLogo() {
  const stage = document.getElementById("boot-logo");
  const img = document.getElementById("boot-logo-img");
  const placeholder = document.getElementById("boot-logo-placeholder");

  if (!BOOT_LOGO.enabled) {
    stage.hidden = true;
    return stage;
  }

  stage.hidden = false;
  stage.classList.remove("is-visible");
  img.alt = BOOT_LOGO.alt || img.alt;

  if (BOOT_LOGO.src) {
    img.src = BOOT_LOGO.src;
    img.hidden = false;
    placeholder.hidden = true;
  } else {
    img.removeAttribute("src");
    img.hidden = true;
    placeholder.hidden = false;
  }

  return stage;
}

async function playBootLogo() {
  if (!BOOT_LOGO.enabled) return;

  const log = document.getElementById("boot-log");
  log.classList.add("is-dimmed");

  const stage = prepareBootLogo();
  void stage.offsetWidth;

  const loadMs = bootMs(BOOT_LOGO.loadMs ?? 1200);
  const steps = Math.max(1, BOOT_LOGO.loadSteps ?? 5);
  const stepMs = loadMs / steps;

  // Stiff stepped load-in (not a smooth fade)
  stage.style.opacity = "0";
  stage.classList.add("is-loading");
  audio.play("select");

  if (prefersReducedMotion()) {
    stage.style.opacity = "";
    stage.classList.remove("is-loading");
    stage.classList.add("is-visible");
  } else {
    for (let i = 1; i <= steps; i++) {
      stage.style.opacity = String(i / steps);
      await sleep(stepMs);
    }
    stage.style.opacity = "";
    stage.classList.remove("is-loading");
    stage.classList.add("is-visible");
  }

  await sleep(bootMs(BOOT_LOGO.holdMs ?? 1400));

  stage.classList.remove("is-visible");
  stage.style.opacity = "";
  stage.hidden = true;
  log.classList.remove("is-dimmed");
}

function formatGateDisplay(value, maxLen) {
  const chars = value.split("");
  while (chars.length < maxLen) chars.push("_");
  return chars.join(" ");
}

function runClearanceGate(skippedRef) {
  return new Promise((resolve) => {
    const gate = document.getElementById("boot-gate");
    const display = document.getElementById("gate-display");
    const status = document.getElementById("gate-status");
    const cascade = document.getElementById("gate-cascade");
    const flash = document.getElementById("gate-flash");
    const pad = gate.querySelector(".gate__pad");
    const eyes = document.getElementById("gate-eyes");
    const skipBtn = document.getElementById("boot-skip");
    const maxLen = ACCESS_CODE.length;

    let buffer = "";
    let locked = false;

    skipBtn.hidden = true;
    gate.hidden = false;
    gate.classList.remove("is-unlocked", "is-staring");
    setWhisperPadVisible(true);
    status.textContent = "";
    status.className = "gate__status";
    cascade.hidden = true;
    cascade.innerHTML = "";
    if (eyes) eyes.hidden = true;
    display.hidden = false;
    pad.hidden = false;
    display.textContent = formatGateDisplay("", maxLen);
    pad.querySelectorAll(".gate__key").forEach((k) => {
      k.disabled = false;
    });

    revealTopToBottom(gate.querySelector(".gate"));

    const render = () => {
      display.textContent = formatGateDisplay(buffer, maxLen);
    };

    const cleanupAndResolve = () => {
      setWhisperPadVisible(false);
      gate.hidden = true;
      gate.classList.remove("is-unlocked");
      flash.classList.remove("is-fire");
      gate.removeEventListener("click", onPadClick);
      window.removeEventListener("keydown", onKeydown);
      resolve();
    };

    const fail = (message = "DENIED") => {
      locked = true;
      status.textContent = message;
      status.className = "gate__status gate__status--deny";
      gate.classList.add("is-denied");
      audio.play("open");
      setTimeout(() => {
        buffer = "";
        render();
        status.textContent = "";
        status.className = "gate__status";
        gate.classList.remove("is-denied");
        locked = false;
      }, 700);
    };

    const stare = () => {
      setWhisperPadVisible(false);
      locked = true;
      pad.querySelectorAll(".gate__key").forEach((k) => {
        k.disabled = true;
      });
      display.hidden = true;
      status.textContent = "";
      status.className = "gate__status";
      cascade.hidden = true;
      pad.hidden = true;
      skipBtn.hidden = true;
      gate.classList.add("is-staring");
      if (eyes) {
        eyes.hidden = false;
        eyes.setAttribute("aria-hidden", "false");
      }
      audio.play("open");
      gate.removeEventListener("click", onPadClick);
      window.removeEventListener("keydown", onKeydown);
      // Intentionally never resolves — refresh required
    };

    const succeed = async () => {
      setWhisperPadVisible(false);
      locked = true;
      pad.querySelectorAll(".gate__key").forEach((k) => {
        k.disabled = true;
      });

      // Full code stays on the display through the unlock ritual
      render();
      status.textContent = "ACCEPTED";
      status.className = "gate__status gate__status--ok";
      gate.classList.add("is-unlocked");
      flash.classList.remove("is-fire");
      void flash.offsetWidth;
      flash.classList.add("is-fire");
      audio.play("unlock");
      void audio.startSoundtrack();

      // Skip is available immediately — aborts acceptance text + later boot stages
      skipBtn.hidden = false;

      await sleep(bootMs(420));
      if (skippedRef.skipped) {
        cleanupAndResolve();
        return;
      }

      cascade.hidden = false;
      cascade.classList.remove("is-pending");
      cascade.classList.add("is-shown");
      const lines = ACCESS_SUCCESS?.lines ?? [];
      const pace = bootPace();
      for (const line of lines) {
        if (skippedRef.skipped) break;
        const row = document.createElement("div");
        row.className = "gate__cascade-line";
        cascade.appendChild(row);
        await typeText(row, `> ${line.text}`, skippedRef, null, pace);
        if (skippedRef.skipped) break;
        await sleep(bootMs(line.delay ?? 100));
      }

      if (!skippedRef.skipped) {
        await sleep(bootMs(ACCESS_SUCCESS?.holdMs ?? 700));
      }

      cleanupAndResolve();
    };

    const submit = () => {
      if (locked) return;
      if (buffer.length < maxLen) return;
      if (buffer === ACCESS_CODE) {
        succeed();
        return;
      }
      const egg = GATE_EASTER_EGGS?.[buffer];
      if (egg?.type === "eyes") {
        stare();
        return;
      }
      if (egg?.type === "message") {
        fail(egg.text || "DENIED");
        return;
      }
      fail();
    };

    const pushDigit = (digit) => {
      if (locked) return;
      if (buffer.length >= maxLen) return;
      buffer += digit;
      status.textContent = "";
      render();
      audio.play("click");
    };

    const clear = () => {
      if (locked) return;
      buffer = "";
      status.textContent = "";
      render();
      audio.play("click");
    };

    const onPadClick = async (e) => {
      const key = e.target.closest("[data-key]")?.dataset.key;
      if (!key) return;
      if (!audio.enabled) {
        await audio.enable();
        updateAudioToggle(true);
      }
      if (key === "clear") clear();
      else if (key === "enter") submit();
      else pushDigit(key);
    };

    const onKeydown = async (e) => {
      if (gate.hidden) return;
      if (e.target.closest?.("#whisper")) return;
      if (!audio.enabled && ((e.key >= "0" && e.key <= "9") || e.key === "Enter")) {
        await audio.enable();
        updateAudioToggle(true);
      }
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        pushDigit(e.key);
      } else if (e.key === "Enter") {
        e.preventDefault();
        // After unlock, Enter is handled by the shared skip listener
        if (locked) return;
        submit();
      } else if (e.key === "Backspace" || e.key === "Escape") {
        e.preventDefault();
        clear();
      }
    };

    gate.addEventListener("click", onPadClick);
    window.addEventListener("keydown", onKeydown);
  });
}

async function enterHub() {
  const bootScreen = document.getElementById("boot");
  const hubScreen = document.getElementById("hub");
  const logoStage = document.getElementById("boot-logo");

  bootScreen.hidden = true;
  hubScreen.hidden = false;
  if (logoStage) {
    logoStage.hidden = true;
    logoStage.classList.remove("is-visible", "is-loading");
    logoStage.style.opacity = "";
  }
  audio.play("select");
  startChrono();

  const activeBtn = document.querySelector(".nav-item.is-active");
  if (activeBtn) {
    await typeChannelBanner(activeBtn.dataset.panel, activeBtn.dataset.channelTitle);
  }

  const active = document.querySelector(".panel.is-active");
  if (active) await revealPanel(active);
}

/** Leave hub and reopen the clearance keypad; success returns to hub */
async function returnToClearance() {
  const bootScreen = document.getElementById("boot");
  const hubScreen = document.getElementById("hub");
  const log = document.getElementById("boot-log");
  const skipBtn = document.getElementById("boot-skip");
  const logoStage = document.getElementById("boot-logo");

  hubScreen.hidden = true;
  bootScreen.hidden = false;
  log.innerHTML = "";
  log.classList.remove("is-dimmed");
  skipBtn.hidden = true;
  if (logoStage) {
    logoStage.hidden = true;
    logoStage.classList.remove("is-visible", "is-loading");
    logoStage.style.opacity = "";
  }

  const skippedRef = { skipped: false };

  const triggerSkip = () => {
    if (skippedRef.skipped || skipBtn.hidden) return;
    skippedRef.skipped = true;
    audio.play("click");
  };

  skipBtn.addEventListener("click", triggerSkip, { once: true });
  const onSkipKey = (e) => {
    if (e.key !== "Enter") return;
    if (e.target.closest?.("#whisper")) return;
    if (skipBtn.hidden || skippedRef.skipped) return;
    e.preventDefault();
    triggerSkip();
  };
  window.addEventListener("keydown", onSkipKey);

  await runClearanceGate(skippedRef);

  window.removeEventListener("keydown", onSkipKey);
  skipBtn.hidden = true;
  await enterHub();
}

function initImagoReturn() {
  const mark = document.querySelector(".imago-mark");
  if (!mark) return;

  let busy = false;
  mark.addEventListener("click", async () => {
    if (busy) return;
    const hub = document.getElementById("hub");
    if (!hub || hub.hidden) return;
    busy = true;
    try {
      await returnToClearance();
    } finally {
      busy = false;
    }
  });
}

async function runBoot() {
  const log = document.getElementById("boot-log");
  const skipBtn = document.getElementById("boot-skip");

  const unlockAudio = async () => {
    await audio.enable();
    updateAudioToggle(true);
  };
  document.addEventListener("keydown", () => unlockAudio(), { once: true });

  const skippedRef = { skipped: false };
  skipBtn.hidden = true;

  const triggerSkip = () => {
    if (skippedRef.skipped || skipBtn.hidden) return;
    skippedRef.skipped = true;
    audio.play("click");
  };

  skipBtn.addEventListener("click", triggerSkip);

  const onSkipKey = (e) => {
    if (e.key !== "Enter") return;
    if (e.target.closest?.("#whisper")) return;
    if (skipBtn.hidden || skippedRef.skipped) return;
    e.preventDefault();
    triggerSkip();
  };
  window.addEventListener("keydown", onSkipKey);

  await runClearanceGate(skippedRef);
  await unlockAudio();

  // Skipped during acceptance → jump straight to hub
  if (skippedRef.skipped) {
    window.removeEventListener("keydown", onSkipKey);
    skipBtn.hidden = true;
    await enterHub();
    return;
  }

  const stickLog = () => {
    log.scrollTop = log.scrollHeight;
  };

  const pace = bootPace();
  for (const line of BOOT_LINES) {
    if (skippedRef.skipped) break;
    const el = document.createElement("div");
    el.className = line.cls || "";
    log.appendChild(el);
    stickLog();
    await typeText(el, `> ${line.text}`, skippedRef, stickLog, pace);
    if (line.awaitDotsMs && !skippedRef.skipped) {
      const dots = document.createElement("span");
      dots.className = "boot-dots";
      el.appendChild(dots);
      await blinkBootDots(dots, bootMs(line.awaitDotsMs), skippedRef);
      stickLog();
    }
    stickLog();
    if (!skippedRef.skipped) await sleep(bootMs(line.delay));
  }

  window.removeEventListener("keydown", onSkipKey);
  if (!skippedRef.skipped) await sleep(bootMs(80));
  skipBtn.hidden = true;

  if (!skippedRef.skipped) {
    await playBootLogo();
  }

  await enterHub();
}

/* ==========================================================================
   NAVIGATION — channel switching + typed banner title
   ========================================================================== */

/** Cancels an in-flight banner typewriter when a new channel is selected */
let bannerTypeAbort = { skipped: true };

async function typeChannelBanner(panelId, titleOverride) {
  const banner = document.getElementById("channel-banner");
  if (!banner) return;

  const title = titleOverride || CHANNEL_TITLES[panelId] || "";
  bannerTypeAbort.skipped = true;
  const skippedRef = { skipped: false };
  bannerTypeAbort = skippedRef;

  banner.textContent = "";
  await typeText(banner, title, skippedRef);
}

function initNav() {
  const rail = document.querySelector(".nav-rail");
  const panels = document.querySelectorAll(".panel");
  if (!rail) return;

  let revealing = false;

  rail.addEventListener("click", async (e) => {
    const btn = e.target.closest(".nav-item");
    if (!btn || !rail.contains(btn)) return;
    if (revealing) return;

    const id = btn.dataset.panel;
    if (!id) return;

    rail.querySelectorAll(".nav-item").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });

    let shown = null;
    panels.forEach((panel) => {
      const match = panel.dataset.panel === id;
      panel.hidden = !match;
      panel.classList.toggle("is-active", match);
      if (match) shown = panel;
    });

    audio.play(btn.dataset.sfx || "select");

    revealing = true;
    try {
      await typeChannelBanner(id, btn.dataset.channelTitle);
      if (shown) await revealPanel(shown);
    } finally {
      revealing = false;
    }
  });
}

/* ==========================================================================
   CHRONO — UTC clock
   ========================================================================== */

function startChrono() {
  const el = document.getElementById("chrono");
  if (!el || el.dataset.running === "1") return;
  el.dataset.running = "1";
  const tick = () => {
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, "0");
    const m = String(now.getUTCMinutes()).padStart(2, "0");
    const s = String(now.getUTCSeconds()).padStart(2, "0");
    el.textContent = `${h}:${m}:${s} UTC`;
    el.dateTime = now.toISOString();
  };
  tick();
  setInterval(tick, 1000);
}

/* ==========================================================================
   DIAGNOSTICS / AUDIO UI
   ========================================================================== */

function updateAudioToggle(on) {
  const btn = document.getElementById("audio-toggle");
  if (!btn) return;
  const label = btn.querySelector(".sys-toggle__label");
  btn.classList.toggle("is-on", on);
  if (label) label.textContent = on ? "AUDIO: ON" : "AUDIO: OFF";
}

function updateMotionToggle(reduced) {
  const btn = document.getElementById("reduce-motion");
  if (!btn) return;
  const label = btn.querySelector(".sys-toggle__label");
  /* Filled when motion is ON (not reduced); hollow when OFF */
  btn.classList.toggle("is-on", !reduced);
  if (label) label.textContent = reduced ? "MOTION: OFF" : "MOTION: ON";
  document.body.classList.toggle("reduce-motion", reduced);
}

function setFillBarValue(bar, value) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const fill = bar.querySelector(".fill-bar__fill");
  if (fill) fill.style.width = `${v}%`;
  bar.setAttribute("aria-valuenow", String(v));
  bar.dataset.value = String(v);
  return v;
}

function readFillBarValue(bar) {
  return Number(bar.dataset.value ?? bar.getAttribute("aria-valuenow") ?? 0);
}

function valueFromPointer(bar, clientX) {
  const rect = bar.getBoundingClientRect();
  if (rect.width <= 0) return 0;
  return ((clientX - rect.left) / rect.width) * 100;
}

function bindFillBar(bar, onChange) {
  if (!bar || bar.classList.contains("is-disabled")) return;

  const apply = (clientX) => {
    const v = setFillBarValue(bar, valueFromPointer(bar, clientX));
    onChange(v);
  };

  bar.addEventListener("pointerdown", (e) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    bar.setPointerCapture(e.pointerId);
    apply(e.clientX);
  });

  bar.addEventListener("pointermove", (e) => {
    if (!bar.hasPointerCapture(e.pointerId)) return;
    apply(e.clientX);
  });

  bar.addEventListener("keydown", (e) => {
    let next = readFillBarValue(bar);
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next -= 5;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") next += 5;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 100;
    else return;
    e.preventDefault();
    const v = setFillBarValue(bar, next);
    onChange(v);
  });
}

function initSystems() {
  const form = document.getElementById("systems-form");
  const audioBtn = document.getElementById("audio-toggle");
  const motionBtn = document.getElementById("reduce-motion");
  const sfxGain = document.getElementById("sfx-gain");
  const musicGain = document.getElementById("music-gain");
  const scan = document.getElementById("scan-intensity");

  form?.addEventListener("submit", (e) => e.preventDefault());
  audioBtn.addEventListener("click", async () => {
    if (audio.enabled) {
      audio.disable();
      updateAudioToggle(false);
    } else {
      await audio.enable();
      updateAudioToggle(true);
      audio.play("click");
    }
  });

  motionBtn.addEventListener("click", () => {
    updateMotionToggle(!document.body.classList.contains("reduce-motion"));
  });

  bindFillBar(sfxGain, (v) => {
    audio.setSfxGain(v / 100);
  });
  audio.setSfxGain(readFillBarValue(sfxGain) / 100);

  bindFillBar(musicGain, (v) => {
    audio.setMusicGain(v / 100);
  });
  audio.setMusicGain(readFillBarValue(musicGain) / 100);

  bindFillBar(scan, (v) => {
    document.documentElement.style.setProperty(
      "--scan-opacity",
      String(0.04 + (v / 100) * 0.18)
    );
  });
  {
    const v = readFillBarValue(scan) / 100;
    document.documentElement.style.setProperty("--scan-opacity", String(0.04 + v * 0.18));
  }

  document.body.addEventListener("click", (e) => {
    const target = e.target.closest("[data-sfx]");
    if (!target || target.classList.contains("nav-item")) return;
    if (target.id === "audio-toggle" || target.id === "reduce-motion") return;
    if (target.classList.contains("imago-mark")) return;
    audio.play(target.dataset.sfx || "click");
  });
}

/* ==========================================================================
   WHISPER — Kharon-Celeste corner ARG (pad screen only)
   ========================================================================== */

/** Shown only while the clearance number pad is active */
let whisperPadControl = {
  show() {},
  hide() {},
};

function setWhisperPadVisible(on) {
  if (on) whisperPadControl.show();
  else whisperPadControl.hide();
}

function initWhisper() {
  const root = document.getElementById("whisper");
  const tab = document.getElementById("whisper-tab");
  const panel = document.getElementById("whisper-panel");
  const head = document.getElementById("whisper-head");
  const log = document.getElementById("whisper-log");
  const form = document.getElementById("whisper-form");
  const input = document.getElementById("whisper-input");
  if (!root || !tab || !panel || !log || !form || !input) return;

  root.hidden = true;

  if (head && WHISPER?.title) head.textContent = WHISPER.title;

  const steps = WHISPER?.steps ?? [];
  const deny = WHISPER?.deny ?? "DENIED";
  const farewell = WHISPER?.farewell ?? [
    "I'm done with you now. I just wanna watch you delve into hell.",
    "Don't make me repeat myself.",
    "Fine.",
  ];
  let step = 0;
  let open = false;
  let done = false;
  let busy = false;
  let farewellIndex = 0;
  let lastBot = null; // { text, cls, grid? }

  /** Letters/digits + spacing only; symbols act as spaces. Case-insensitive. */
  const normalizeAnswer = (raw) =>
    String(raw ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");

  const formatSudoku = (grid) => {
    const cell = (n) => (n ? String(n) : "·");
    const rowLine = (row) =>
      [0, 3, 6]
        .map((b) => row.slice(b, b + 3).map(cell).join(" "))
        .join(" │ ");
    const band = (i) =>
      [0, 1, 2].map((r) => rowLine(grid[i + r])).join("\n");
    const sep = "──────┼───────┼──────";
    return [band(0), sep, band(3), sep, band(6)].join("\n");
  };

  const stick = () => {
    log.scrollTop = log.scrollHeight;
  };

  const typeLine = async (text, cls = "", { record = true } = {}) => {
    const line = document.createElement("div");
    line.className = `whisper__line${cls ? ` ${cls}` : ""}`;
    log.appendChild(line);
    stick();
    await typeText(line, text, null, stick);
    stick();
    if (record && !text.startsWith("> ")) {
      lastBot = { text, cls, grid: null };
    }
  };

  const showGrid = (grid, { record = true } = {}) => {
    const text = formatSudoku(grid);
    const line = document.createElement("pre");
    line.className = "whisper__line whisper__sudoku whisper__line--prompt";
    line.textContent = text;
    log.appendChild(line);
    stick();
    if (record) {
      lastBot = { text, cls: "whisper__line--prompt", grid };
    }
  };

  /** Prompt line + optional sudoku (grid dumps instantly). */
  const showStepPrompt = async (stepObj, { record = true } = {}) => {
    if (stepObj?.prompt) {
      await typeLine(stepObj.prompt, "whisper__line--prompt", {
        record: !stepObj.grid && record,
      });
    }
    if (stepObj?.grid) {
      showGrid(stepObj.grid, { record });
    }
  };

  const matchesAny = (raw, list = []) => {
    const n = normalizeAnswer(raw);
    return list.some((a) => normalizeAnswer(a) === n);
  };

  const isIdentityAsk = (raw) => matchesAny(raw, WHISPER?.identity?.match ?? ["who are you"]);

  const hasForbiddenName = (raw) => {
    const word = normalizeAnswer(WHISPER?.forbiddenName?.word ?? "Kian");
    if (!word) return false;
    return normalizeAnswer(raw)
      .split(" ")
      .some((token) => token === word);
  };

  const repeatLastBot = async () => {
    if (!lastBot) return;
    if (lastBot.grid) {
      showGrid(lastBot.grid, { record: false });
      return;
    }
    await typeLine(lastBot.text, lastBot.cls || "whisper__line--prompt", {
      record: false,
    });
  };

  const setBusy = (on) => {
    busy = on;
    input.disabled = on;
  };

  const askCurrent = async () => {
    if (done || step >= steps.length) return;
    setBusy(true);
    try {
      await showStepPrompt(steps[step]);
    } finally {
      setBusy(false);
      if (open) input.focus();
    }
  };

  const openPanel = async () => {
    if (busy || root.hidden) return;
    open = true;
    panel.hidden = false;
    tab.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    audio.play("select");
    if (!log.childElementCount) await askCurrent();
    else input.focus();
  };

  const closePanel = ({ silent = false } = {}) => {
    open = false;
    panel.hidden = true;
    tab.setAttribute("aria-expanded", "false");
    root.classList.remove("is-open");
    if (!silent) audio.play("click");
  };

  whisperPadControl = {
    show() {
      root.hidden = false;
    },
    hide() {
      closePanel({ silent: true });
      root.hidden = true;
    },
  };

  tab.addEventListener("click", () => {
    if (root.hidden) return;
    if (open) closePanel();
    else openPanel();
  });

  // Keep keypad / skip from seeing whisper keystrokes
  root.addEventListener("keydown", (e) => e.stopPropagation());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;

    const raw = input.value.trim();
    input.value = "";
    if (!raw) return;

    setBusy(true);
    try {
      await typeLine(`> ${raw}`, "", { record: false });

      // Name forbid — works at any point (before other interrupts)
      if (hasForbiddenName(raw)) {
        const reply = WHISPER?.forbiddenName?.reply ?? "Don't say that name.";
        audio.play("select");
        await typeLine(reply, "whisper__line--prompt", { record: false });
        await repeatLastBot();
        return;
      }

      // Identity interrupt — works at any point
      if (isIdentityAsk(raw)) {
        const reply = WHISPER?.identity?.reply ?? "Your guide.";
        audio.play("select");
        await typeLine(reply, "whisper__line--prompt", { record: false });
        await repeatLastBot();
        return;
      }

      // After the riddle is solved — escalate dismissals
      if (done || step >= steps.length) {
        const idx = Math.min(farewellIndex, farewell.length - 1);
        farewellIndex = Math.min(farewellIndex + 1, farewell.length - 1);
        audio.play("open");
        await typeLine(farewell[idx], "whisper__line--deny");
        return;
      }

      const current = steps[step];
      const accepted = matchesAny(raw, current.accept ?? []);
      const soft = current.softReject;
      const softHit = soft && matchesAny(raw, soft.match ?? []);

      if (accepted) {
        audio.play("select");
        if (current.success) {
          await typeLine(current.success, "whisper__line--ok");
        }
        step += 1;
        if (step >= steps.length) {
          done = true;
          return;
        }
        await showStepPrompt(steps[step]);
        return;
      }

      if (softHit) {
        audio.play("open");
        await typeLine(soft.text, "whisper__line--deny");
        return;
      }

      audio.play("open");
      await typeLine(deny, "whisper__line--deny");
      await showStepPrompt(current);
    } finally {
      setBusy(false);
      if (open) input.focus();
    }
  });
}

/* ==========================================================================
   CARTOGRAPHY — The Nine orbital chart
   ========================================================================== */

function polarToXY(cx, cy, r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function initCartography() {
  const mapHost = document.getElementById("chart-map");
  const readout = document.getElementById("chart-readout");
  const archiveEl = document.getElementById("chart-archive");
  const archiveBody = document.getElementById("chart-archive-body");
  if (!mapHost || !readout || !SYSTEM_CHART) return;

  const bodies = SYSTEM_CHART.bodies ?? [];
  const sturm = SYSTEM_CHART.sturm;
  const mystery = SYSTEM_CHART.mystery;
  const archive = SYSTEM_CHART.archive;
  const idle = SYSTEM_CHART.idle ?? "SELECT ORBITAL BODY";
  const errorText = SYSTEM_CHART.error ?? "GYROSCOPIC DATA SYNC ERROR";

  if (archiveEl && archiveBody && archive) {
    const title = archiveEl.querySelector(".chart-archive__title");
    if (title && archive.title) title.textContent = archive.title;
    archiveBody.innerHTML = `
      <p class="chart-archive__code">${archive.code ?? ""}</p>
      <p class="chart-archive__text">${archive.body ?? ""}</p>`;
  }

  const vb = 520;
  const cx = vb / 2;
  const cy = vb / 2;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${vb} ${vb}`);
  svg.setAttribute("class", "chart-svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "The Nine");

  const add = (tag, attrs = {}, parent = svg) => {
    const el = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    parent.appendChild(el);
    return el;
  };

  for (let i = 0; i < 28; i++) {
    add("circle", {
      class: "chart-svg__star",
      cx: 20 + ((i * 97) % (vb - 40)),
      cy: 18 + ((i * 53) % (vb - 36)),
      r: i % 5 === 0 ? 1.1 : 0.55,
    });
  }

  for (const body of bodies) {
    add("circle", {
      class: "chart-svg__orbit",
      cx,
      cy,
      r: body.r,
      fill: "none",
    });
  }

  add("circle", { class: "chart-svg__sun", cx, cy, r: 8 });

  let stopWire = null;
  let selectedId = null;
  let selectedG = null;

  const fitSelectBox = (g) => {
    const content = g.querySelector(".chart-svg__content");
    const box = g.querySelector(".chart-svg__box");
    if (!content || !box) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const include = (x0, y0, x1, y1) => {
      minX = Math.min(minX, x0);
      minY = Math.min(minY, y0);
      maxX = Math.max(maxX, x1);
      maxY = Math.max(maxY, y1);
    };

    content.querySelectorAll("circle").forEach((c) => {
      const r = Number(c.getAttribute("r") || 0);
      const x = Number(c.getAttribute("cx") || 0);
      const y = Number(c.getAttribute("cy") || 0);
      include(x - r, y - r, x + r, y + r);
    });

    content.querySelectorAll("text").forEach((t) => {
      const x = Number(t.getAttribute("x") || 0);
      const y = Number(t.getAttribute("y") || 0);
      const fs = Number.parseFloat(getComputedStyle(t).fontSize) || 8;
      let w = 0;
      try {
        w = t.getComputedTextLength();
      } catch {
        w = (t.textContent || "").length * fs * 0.62;
      }
      if (!w) w = (t.textContent || "").length * fs * 0.62;
      const anchor = t.getAttribute("text-anchor") || "start";
      let x0 = x;
      let x1 = x + w;
      if (anchor === "middle") {
        x0 = x - w / 2;
        x1 = x + w / 2;
      } else if (anchor === "end") {
        x0 = x - w;
        x1 = x;
      }
      include(x0, y - fs * 0.9, x1, y + fs * 0.3);
    });

    if (!Number.isFinite(minX)) return;

    const padLeft = 3.5;
    const padRight = 6.5;
    const padY = 2.5;
    box.setAttribute("x", String(minX - padLeft));
    box.setAttribute("y", String(minY - padY));
    box.setAttribute("width", String(maxX - minX + padLeft + padRight));
    box.setAttribute("height", String(maxY - minY + padY * 2));
  };

  const clearSelection = () => {
    if (selectedG) selectedG.classList.remove("is-selected");
    selectedId = null;
    selectedG = null;
  };

  const showIdle = () => {
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    readout.innerHTML = `<p class="chart__idle">${idle}</p>`;
  };

  const showError = () => {
    audio.play("open");
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    readout.innerHTML = `<p class="chart__error">${errorText}</p>`;
  };

  const showSturm = () => {
    audio.play("select");
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    readout.innerHTML = `
      <div class="chart-sturm">
        <div class="wire-globe" aria-hidden="true">
          <svg class="wire-globe__svg" viewBox="0 0 100 100">
            <circle class="wire-globe__rim" cx="50" cy="50" r="44" fill="none" />
            <g class="wire-globe__lats"></g>
            <g class="wire-globe__lons"></g>
          </svg>
          <div class="wire-globe__scan"></div>
        </div>
        <p class="chart-sturm__name">${sturm.name}</p>
        <p class="chart-sturm__meta">UROS · LOCAL FIX · ▽</p>
        <p class="chart-sturm__blurb">${sturm.blurb ?? ""}</p>
      </div>`;
    const globeSvg = readout.querySelector(".wire-globe__svg");
    if (globeSvg) stopWire = startWireGlobe(globeSvg);
  };

  const showMystery = () => {
    audio.play("select");
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    const text = mystery?.readout ?? "A mystery in the orbit of Unconquered Storm...";
    readout.innerHTML = `<p class="chart__mystery">${text}</p>`;
  };

  const toggleSelect = (id, g, onSelect) => {
    if (selectedId === id) {
      clearSelection();
      showIdle();
      return;
    }
    clearSelection();
    selectedId = id;
    selectedG = g;
    g.classList.add("is-selected");
    onSelect();
  };

  const sunHit = add("circle", { class: "chart-svg__hit", cx, cy, r: 14 });
  sunHit.addEventListener("click", () => {
    // Primary is not a labeled body — always error, no sticky box
    clearSelection();
    showError();
  });

  const movers = [];

  const bindBody = (g, id, onSelect) => {
    g.style.cursor = "pointer";
    const activate = () => toggleSelect(id, g, onSelect);
    g.addEventListener("click", activate);
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  };

  bodies.forEach((body) => {
    const g = add("g", {
      class: "chart-svg__body",
      tabindex: "0",
      role: "button",
      "aria-label": body.name,
    });
    g.dataset.body = body.id;
    const { x, y } = polarToXY(cx, cy, body.r, body.angle);

    add("rect", { class: "chart-svg__box", x: 0, y: 0, width: 1, height: 1 }, g);
    add("circle", { class: "chart-svg__hit", cx: 0, cy: 0, r: Math.max(12, body.size + 8) }, g);
    const content = add("g", { class: "chart-svg__content" }, g);
    add("circle", { class: "chart-svg__dot", cx: 0, cy: 0, r: body.size }, content);
    const label = add("text", { class: "chart-svg__label", x: body.size + 4, y: 2.5 }, content);
    label.textContent = body.name;
    g.setAttribute("transform", `translate(${x} ${y})`);
    bindBody(g, body.id, showError);

    movers.push({
      g,
      r: body.r,
      angle: body.angle,
      speed: 4.5 / Math.sqrt(body.r),
      id: body.id,
    });
  });

  const makeSatellite = (cfg, className, ariaLabel, onSelect) => {
    if (!cfg) return null;
    const g = add("g", {
      class: className,
      tabindex: "0",
      role: "button",
      "aria-label": ariaLabel,
    });
    g.dataset.body = cfg.id;

    const parent = bodies.find((b) => b.id === cfg.parent);
    const parentXY = parent ? polarToXY(cx, cy, parent.r, parent.angle) : { x: cx, y: cy };
    const xy = polarToXY(parentXY.x, parentXY.y, cfg.offset ?? 16, cfg.angle ?? 0);

    add("rect", { class: "chart-svg__box", x: 0, y: 0, width: 1, height: 1 }, g);
    add("circle", { class: "chart-svg__hit", cx: 0, cy: 0, r: 14 }, g);
    const content = add("g", { class: "chart-svg__content" }, g);
    const mark = add("text", { class: "chart-svg__mark", x: 0, y: 4, "text-anchor": "middle" }, content);
    mark.textContent = cfg.mark ?? "▽";
    if (cfg.name) {
      const label = add(
        "text",
        { class: "chart-svg__label chart-svg__label--sturm", x: 8, y: 3 },
        content
      );
      label.textContent = cfg.name;
    }
    g.setAttribute("transform", `translate(${xy.x} ${xy.y})`);
    bindBody(g, cfg.id, onSelect);

    return {
      g,
      parentId: cfg.parent,
      offset: cfg.offset ?? 16,
      angle: cfg.angle ?? 0,
      speed: cfg.speed ?? 18,
    };
  };

  const sturmMover = makeSatellite(
    sturm ? { ...sturm, mark: "▽" } : null,
    "chart-svg__sturm",
    `${sturm?.name ?? "Sturm"}, current location`,
    showSturm
  );

  const mysteryMover = makeSatellite(
    mystery,
    "chart-svg__mystery",
    "Unidentified object in Teavicta orbit",
    showMystery
  );

  mapHost.replaceChildren(svg);
  // Boxes need layout after mount (getComputedTextLength / fonts)
  const refitAll = () => {
    svg
      .querySelectorAll(".chart-svg__body, .chart-svg__sturm, .chart-svg__mystery")
      .forEach((g) => fitSelectBox(g));
  };
  refitAll();
  requestAnimationFrame(refitAll);
  if (document.fonts?.ready) document.fonts.ready.then(refitAll);

  showIdle();

  if (!prefersReducedMotion()) {
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const pos = Object.create(null);
      for (const m of movers) {
        m.angle += m.speed * dt;
        const { x, y } = polarToXY(cx, cy, m.r, m.angle);
        m.g.setAttribute("transform", `translate(${x} ${y})`);
        pos[m.id] = { x, y };
      }

      const tickSat = (sat) => {
        if (!sat) return;
        sat.angle += sat.speed * dt;
        let parent = pos[sat.parentId];
        if (!parent) {
          const m = movers.find((entry) => entry.id === sat.parentId);
          if (m) parent = polarToXY(cx, cy, m.r, m.angle);
        }
        if (parent) {
          const s = polarToXY(parent.x, parent.y, sat.offset, sat.angle);
          sat.g.setAttribute("transform", `translate(${s.x} ${s.y})`);
        }
      };

      tickSat(sturmMover);
      tickSat(mysteryMover);

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

/**
 * 2D wireframe globe with sphere-projected (bowed) latitudes & longitudes.
 * Meridians sweep L→R; poles remapped onto the rim circle.
 */
function startWireGlobe(svg) {
  const svgNS = "http://www.w3.org/2000/svg";
  const lats = svg.querySelector(".wire-globe__lats");
  const lons = svg.querySelector(".wire-globe__lons");
  if (!lats || !lons) return () => {};

  const cx = 50;
  const cy = 50;
  const R = 44;
  const tilt = 0.42;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  // Stretch Y so tilted poles land on the outer circle
  const yScale = 1 / cosT;
  const latCount = 5;
  const lonCount = 7;
  const samples = 32;

  const project = (lon, lat) => {
    const cl = Math.cos(lat);
    const x = R * cl * Math.sin(lon);
    const y = R * Math.sin(lat);
    const z = R * cl * Math.cos(lon);
    const yt = y * cosT - z * sinT;
    const zt = y * sinT + z * cosT;
    return { x: cx + x, y: cy + yt * yScale, z: zt };
  };

  const pathFromPoints = (pts) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
    }
    return d;
  };

  // Clip grid to the rim so stretch never spills outside the sphere
  let clip = svg.querySelector("#wire-globe-clip");
  if (!clip) {
    const defs = document.createElementNS(svgNS, "defs");
    clip = document.createElementNS(svgNS, "clipPath");
    clip.setAttribute("id", "wire-globe-clip");
    const clipCircle = document.createElementNS(svgNS, "circle");
    clipCircle.setAttribute("cx", String(cx));
    clipCircle.setAttribute("cy", String(cy));
    clipCircle.setAttribute("r", String(R));
    clip.appendChild(clipCircle);
    defs.appendChild(clip);
    svg.insertBefore(defs, svg.firstChild);
  }
  lats.setAttribute("clip-path", "url(#wire-globe-clip)");
  lons.setAttribute("clip-path", "url(#wire-globe-clip)");

  for (let i = 1; i < latCount; i++) {
    const lat = -Math.PI / 2 + (Math.PI * i) / latCount;
    const pts = [];
    for (let s = 0; s <= samples; s++) {
      const lon = -Math.PI / 2 + (Math.PI * s) / samples;
      pts.push(project(lon, lat));
    }
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("class", "wire-globe__lat");
    path.setAttribute("d", pathFromPoints(pts));
    path.setAttribute("fill", "none");
    lats.appendChild(path);
  }

  const lonPaths = [];
  for (let i = 0; i < lonCount; i++) {
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("class", "wire-globe__lon");
    path.setAttribute("fill", "none");
    lons.appendChild(path);
    lonPaths.push(path);
  }

  const setMeridian = (path, lon, opacity) => {
    const pts = [];
    for (let s = 0; s <= samples; s++) {
      const lat = -Math.PI / 2 + (Math.PI * s) / samples;
      pts.push(project(lon, lat));
    }
    path.setAttribute("d", pathFromPoints(pts));
    path.setAttribute("opacity", String(opacity));
  };

  let raf = 0;
  let alive = true;
  const t0 = performance.now();
  const periodMs = 11000; // slower spin

  const draw = (now) => {
    if (!alive) return;
    const phase = ((now - t0) % periodMs) / periodMs;
    for (let i = 0; i < lonCount; i++) {
      let u = phase + i / lonCount;
      u -= Math.floor(u);
      const lon = -Math.PI / 2 + Math.PI * u;
      const edge = Math.abs(u - 0.5) * 2;
      const opacity = 0.35 + 0.65 * (1 - edge * 0.55);
      setMeridian(lonPaths[i], lon, opacity);
    }
    raf = requestAnimationFrame(draw);
  };

  if (prefersReducedMotion()) {
    for (let i = 0; i < lonCount; i++) {
      const u = (i + 0.5) / lonCount;
      const lon = -Math.PI / 2 + Math.PI * u;
      setMeridian(lonPaths[i], lon, 0.75);
    }
    return () => {};
  }

  raf = requestAnimationFrame(draw);
  return () => {
    alive = false;
    cancelAnimationFrame(raf);
  };
}


function initHullPlan() {
  const plan = document.getElementById("hull-plan");
  const eye = document.getElementById("hull-plan-eye");
  const tabs = document.querySelectorAll("[data-hull-tab]");
  const outer = document.getElementById("hull-view-outer");
  const inner = document.getElementById("hull-view-inner");

  if (eye && plan) {
    eye.addEventListener("click", () => {
      const on = eye.classList.toggle("is-on");
      plan.classList.toggle("is-labels-off", !on);
      eye.setAttribute("aria-pressed", on ? "true" : "false");
      eye.setAttribute(
        "aria-label",
        on ? "Hide station labels" : "Show station labels"
      );
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const which = tab.dataset.hullTab;
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      if (outer) {
        outer.hidden = which !== "outer";
        outer.classList.toggle("is-active", which === "outer");
      }
      if (inner) {
        inner.hidden = which !== "inner";
        inner.classList.toggle("is-active", which === "inner");
      }
    });
  });
}

function initFthConsole() {
  const consoleEl = document.getElementById("fth-console");
  const form = document.getElementById("fth-console-form");
  const input = document.getElementById("fth-console-input");
  const log = document.getElementById("fth-console-log");
  const awaitEl = document.getElementById("fth-console-await");
  if (!form || !input || !log) return;

  consoleEl?.classList.add("is-awaiting");

  const clearAwait = () => {
    if (!awaitEl || awaitEl.hidden) return;
    awaitEl.hidden = true;
    awaitEl.classList.remove("is-blink");
    consoleEl?.classList.remove("is-awaiting");
  };

  const push = (text, cls) => {
    const line = document.createElement("div");
    line.className = `fth-console__line${cls ? ` ${cls}` : ""}`;
    line.textContent = text;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  };

  input.addEventListener("input", () => {
    if (input.value.length > 0) clearAwait();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    input.value = "";
    if (!raw) return;

    clearAwait();
    audio.play("click");
    push(`> ${raw}`, "fth-console__line--in");
    push(
      "ERR 0xFTH-RECOV — software still being recovered. No commands are operational yet.",
      "fth-console__line--err"
    );
  });
}

function initFlightLog() {
  const flog = document.getElementById("flog");
  const host = document.getElementById("flog-journals");
  const reader = document.getElementById("flog-reader");
  const searchForm = document.getElementById("flog-search");
  const searchInput = document.getElementById("flog-query");
  const railFill = document.getElementById("flog-rail-fill");
  const split = document.getElementById("flog-split");
  if (!host || !reader || !FLIGHT_LOG) return;

  const journals = FLIGHT_LOG.journals ?? [];
  const corruption = FLIGHT_LOG.corruption ?? "";
  const idle = FLIGHT_LOG.idle ?? "SELECT JOURNAL ENTRY";
  let selectedBtn = null;
  let activeEntry = null;
  let pages = [];
  let pageIndex = 0;

  const formatDate = (entry) => {
    const year = entry.dateCorrupted
      ? entry.yearDisplay ?? "····"
      : String(entry.year);
    const cycle = entry.dateCorrupted
      ? entry.cycleDisplay ?? "··"
      : String(entry.cycle).padStart(2, "0");
    return `${year} AE · CYCLE ${cycle}`;
  };

  const formatListDate = (entry) => {
    const year = entry.dateCorrupted
      ? entry.yearDisplay ?? "····"
      : String(entry.year);
    const cycle = entry.dateCorrupted
      ? entry.cycleDisplay ?? "··"
      : String(entry.cycle).padStart(2, "0");
    return `${year} AE · C.${cycle}`;
  };

  const updateRail = () => {
    if (!railFill) return;
    const max = host.scrollHeight - host.clientHeight;
    const fill = max <= 0 ? 1 : 1 - host.scrollTop / max;
    railFill.style.transform = `scaleY(${Math.max(0, Math.min(1, fill))})`;
  };

  const tokenize = (text, breakAll) => {
    if (!text) return [];
    if (breakAll) return Array.from(text);
    return text.split(/(\s+)/).filter((t) => t.length > 0);
  };

  const fitTokens = (tokens, start, measure, maxH) => {
    if (start >= tokens.length) return start;
    let lo = start + 1;
    let hi = tokens.length;
    let best = start;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      measure.textContent = tokens.slice(start, mid).join("");
      if (measure.scrollHeight <= maxH) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (best === start) best = Math.min(start + 1, tokens.length);
    return best;
  };

  const buildPages = (text, breakAll) => {
    const spread = reader.querySelector(".flog-reader__spread");
    const col = reader.querySelector(".flog-reader__col");
    if (!spread || !col) return [{ left: text, right: "" }];

    const colW = col.clientWidth;
    const colH = col.clientHeight;
    if (colW < 8 || colH < 8) return [{ left: text, right: "" }];

    const measure = document.createElement("div");
    measure.className = `flog-reader__measure${breakAll ? " is-corrupt" : ""}`;
    measure.style.width = `${colW}px`;
    measure.style.font = getComputedStyle(col).font;
    measure.style.fontSize = getComputedStyle(col).fontSize;
    measure.style.lineHeight = getComputedStyle(col).lineHeight;
    measure.style.letterSpacing = getComputedStyle(col).letterSpacing;
    document.body.appendChild(measure);

    const tokens = tokenize(text, breakAll);
    const out = [];
    let i = 0;
    let guard = 0;
    while (i < tokens.length && guard < 500) {
      guard += 1;
      const leftEnd = fitTokens(tokens, i, measure, colH);
      const left = tokens.slice(i, leftEnd).join("");
      i = leftEnd;
      let right = "";
      if (i < tokens.length) {
        const rightEnd = fitTokens(tokens, i, measure, colH);
        right = tokens.slice(i, rightEnd).join("");
        i = rightEnd;
      }
      out.push({ left, right });
    }
    measure.remove();
    if (!out.length) out.push({ left: "", right: "" });
    return out;
  };

  const paintPage = () => {
    const left = reader.querySelector('[data-col="0"]');
    const right = reader.querySelector('[data-col="1"]');
    const prev = reader.querySelector(".flog-turn--prev");
    const next = reader.querySelector(".flog-turn--next");
    const folio = reader.querySelector(".flog-reader__folio");
    if (!left || !right || !prev || !next) return;

    const page = pages[pageIndex] || { left: "", right: "" };
    left.textContent = page.left;
    right.textContent = page.right;

    const canPrev = pageIndex > 0;
    const canNext = pageIndex < pages.length - 1;
    prev.disabled = !canPrev;
    next.disabled = !canNext;
    prev.classList.toggle("is-lit", canPrev);
    next.classList.toggle("is-lit", canNext);
    if (folio) {
      folio.textContent = `PAGE ${pageIndex + 1} / ${Math.max(pages.length, 1)}`;
    }
  };

  const layoutEntry = () => {
    if (!activeEntry) return;
    const body = activeEntry.corrupted
      ? corruption
      : activeEntry.body ?? "";
    const keep = pageIndex;
    pages = buildPages(body, Boolean(activeEntry.corrupted));
    pageIndex = Math.min(keep, Math.max(0, pages.length - 1));
    paintPage();
  };

  const showIdle = () => {
    activeEntry = null;
    pages = [];
    pageIndex = 0;
    reader.innerHTML = `<p class="flog__idle">${idle}</p>`;
    if (selectedBtn) {
      selectedBtn.classList.remove("is-active");
      selectedBtn = null;
    }
  };

  const showEntry = (entry, btn) => {
    if (selectedBtn) selectedBtn.classList.remove("is-active");
    selectedBtn = btn;
    btn.classList.add("is-active");
    audio.play("open");

    activeEntry = entry;
    pageIndex = 0;
    const status = entry.corrupted ? "CORRUPTED" : "RECOVERED";
    const titleCls = entry.corrupted
      ? "flog-reader__title flog-reader__title--corrupt"
      : "flog-reader__title";
    const colCls = entry.corrupted
      ? "flog-reader__col flog-reader__col--corrupt"
      : "flog-reader__col";

    reader.innerHTML = `
      <header class="flog-reader__head">
        <p class="flog-reader__status">${status}</p>
        <h3 class="${titleCls}">${entry.title}</h3>
        <p class="flog-reader__date">${formatDate(entry)}</p>
      </header>
      <div class="flog-reader__stage">
        <button type="button" class="flog-turn flog-turn--prev" aria-label="Previous page" disabled>‹</button>
        <div class="flog-reader__spread">
          <div class="${colCls}" data-col="0"></div>
          <div class="${colCls}" data-col="1"></div>
        </div>
        <button type="button" class="flog-turn flog-turn--next" aria-label="Next page" disabled>›</button>
      </div>
      <p class="flog-reader__folio">PAGE 1 / 1</p>`;

    reader.querySelector(".flog-turn--prev")?.addEventListener("click", () => {
      if (pageIndex <= 0) return;
      pageIndex -= 1;
      audio.play("click");
      paintPage();
    });
    reader.querySelector(".flog-turn--next")?.addEventListener("click", () => {
      if (pageIndex >= pages.length - 1) return;
      pageIndex += 1;
      audio.play("click");
      paintPage();
    });

    requestAnimationFrame(() => {
      layoutEntry();
      requestAnimationFrame(layoutEntry);
    });
  };

  const applySearch = (raw) => {
    const q = raw.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

    host.querySelectorAll(".flog-journal").forEach((details) => {
      const journalName = (
        details.querySelector(".flog-journal__name")?.textContent || ""
      ).toLowerCase();
      let anyVisible = !tokens.length;

      details.querySelectorAll(".flog-entry").forEach((btn) => {
        const hay = (btn.dataset.search || "").toLowerCase();
        const match =
          !tokens.length ||
          tokens.every((t) => hay.includes(t) || journalName.includes(t));
        btn.closest("li").hidden = !match;
        if (match) anyVisible = true;
      });

      details.hidden = !anyVisible;
      if (tokens.length && anyVisible) details.open = true;
    });

    updateRail();
  };

  const bindSplit = () => {
    if (!flog || !split) return;
    const index = flog.querySelector(".flog__index");
    if (!index) return;

    const applyWidth = (px, vertical) => {
      if (vertical) {
        const total = flog.clientHeight;
        const clamped = Math.max(total * 0.22, Math.min(total * 0.65, px));
        index.style.flexBasis = `${clamped}px`;
        flog.style.setProperty("--flog-index-w", `${clamped}px`);
      } else {
        const total = flog.clientWidth;
        const clamped = Math.max(160, Math.min(total * 0.68, px));
        index.style.flexBasis = `${clamped}px`;
        flog.style.setProperty("--flog-index-w", `${clamped}px`);
      }
    };

    let dragging = false;

    const onMove = (clientX, clientY) => {
      if (!dragging) return;
      const rect = flog.getBoundingClientRect();
      const vertical = window.matchMedia("(max-width: 720px)").matches;
      if (vertical) applyWidth(clientY - rect.top, true);
      else applyWidth(clientX - rect.left, false);
      layoutEntry();
    };

    split.addEventListener("pointerdown", (e) => {
      dragging = true;
      flog.classList.add("is-resizing");
      split.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    split.addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY));
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      flog.classList.remove("is-resizing");
      layoutEntry();
      updateRail();
    };
    split.addEventListener("pointerup", endDrag);
    split.addEventListener("pointercancel", endDrag);

    split.addEventListener("keydown", (e) => {
      const vertical = window.matchMedia("(max-width: 720px)").matches;
      const step = e.shiftKey ? 32 : 16;
      const current = index.getBoundingClientRect()[vertical ? "height" : "width"];
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        applyWidth(current - step, vertical);
        layoutEntry();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        applyWidth(current + step, vertical);
        layoutEntry();
      }
    });
  };

  host.replaceChildren();

  journals.forEach((journal, ji) => {
    const details = document.createElement("details");
    details.className = "flog-journal";
    details.dataset.journal = journal.id;
    if (ji === journals.length - 1) details.open = true;

    const spanText = journal.titleCorrupted
      ? journal.spanDisplay ?? "····–···· AE"
      : `${journal.yearStart}–${journal.yearEnd} AE`;

    const summary = document.createElement("summary");
    summary.className = "flog-journal__summary";
    summary.innerHTML = `
      <span class="flog-journal__name${journal.titleCorrupted ? " is-corrupt" : ""}">${journal.title}</span>
      <span class="flog-journal__span">${spanText}</span>`;
    details.appendChild(summary);

    const list = document.createElement("ul");
    list.className = "flog-journal__entries";

    (journal.entries ?? []).forEach((entry) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "flog-entry";
      btn.dataset.sfx = "open";
      btn.dataset.search = [
        journal.title,
        entry.title,
        entry.year,
        entry.cycle,
        entry.yearDisplay,
        entry.cycleDisplay,
      ]
        .filter(Boolean)
        .join(" ");
      btn.innerHTML = `
        <span class="flog-entry__date">${formatListDate(entry)}</span>
        <span class="flog-entry__title${entry.corrupted ? " is-corrupt" : ""}">${entry.title}</span>
        <span class="flog-entry__flag">${entry.corrupted ? "Ø" : "·"}</span>`;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showEntry(entry, btn);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });

    details.appendChild(list);
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      host.querySelectorAll(".flog-journal").forEach((other) => {
        if (other !== details) other.open = false;
      });
      requestAnimationFrame(updateRail);
    });
    host.appendChild(details);
  });

  host.addEventListener("scroll", updateRail, { passive: true });
  window.addEventListener("resize", () => {
    updateRail();
    layoutEntry();
  });
  requestAnimationFrame(updateRail);

  if (searchInput) {
    searchInput.addEventListener("input", () => applySearch(searchInput.value));
  }
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applySearch(searchInput?.value ?? "");
    });
  }

  bindSplit();
  showIdle();
}

function initArchives() {
  const form = document.getElementById("adb-search");
  const input = document.getElementById("adb-query");
  const log = document.getElementById("adb-log");
  const pane = document.getElementById("adb-pane");
  const meta = document.getElementById("adb-meta");
  if (!form || !input || !log || !pane) return;

  const entries = LORE_CATALOG?.entries ?? [];
  if (meta) meta.textContent = `${entries.length} RECORDS INDEXED`;

  const push = (text, cls) => {
    const line = document.createElement("p");
    line.className = `adb__line${cls ? ` ${cls}` : ""}`;
    line.textContent = text;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  };

  const showPending = (query) => {
    pane.innerHTML = `
      <p class="adb-pane__title">${query}</p>
      <p class="adb-pane__pending">Recovery pending</p>`;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    input.value = "";
    if (!query) return;

    audio.play("click");

    // Clear the initial idle prompt once the operator starts querying
    const idleLine = log.querySelector(".adb__line--sys");
    if (idleLine && log.children.length === 1) idleLine.remove();

    push(`> ${query}`, "adb__line--in");

    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = entries.filter((entry) =>
      tokens.every((t) => (entry.search || "").includes(t))
    );
    push(
      hits.length
        ? `${hits.length} INDEX HIT${hits.length === 1 ? "" : "S"} · RECOVERY PENDING`
        : "NO INDEX HITS · RECOVERY PENDING",
      "adb__line--out"
    );
    showPending(query);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initSystems();
  initImagoReturn();
  initWhisper();
  initCartography();
  initHullPlan();
  initFthConsole();
  initFlightLog();
  initArchives();
  runBoot();
});
