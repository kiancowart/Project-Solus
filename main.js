/**
 * LATTICE.OS — G512 Carapace (Cara), bonded: Solus
 * Boot playback, navigation, CRT fidelity, and interface audio.
 *
 * Intro splash COPY lives in: boot-content.js  ← edit text / logo there
 */

import { BOOT_LINES, BOOT_LOGO, ACCESS_CODE, ACCESS_SUCCESS, MOTION, GATE_EASTER_EGGS } from "./boot-content.js";

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
  }

  disable() {
    this.enabled = false;
  }

  setSfxGain(normalized) {
    this.sfxGain = Math.max(0, Math.min(1, normalized));
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

function prefersReducedMotion() {
  return (
    document.body.classList.contains("reduce-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

async function typeText(el, fullText, skippedRef = null) {
  if (prefersReducedMotion()) {
    el.textContent = fullText;
    return;
  }

  const typeMs = MOTION.typeMs ?? 22;
  const hitchEvery = MOTION.hitchEvery ?? 7;
  const hitchMs = MOTION.hitchMs ?? 55;
  let out = "";

  for (let i = 0; i < fullText.length; i++) {
    if (skippedRef?.skipped) {
      el.textContent = fullText;
      return;
    }
    out += fullText[i];
    el.textContent = out;
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

  const loadMs = BOOT_LOGO.loadMs ?? 1200;
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

  await sleep(BOOT_LOGO.holdMs ?? 1400);

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

      // Skip is available immediately — aborts acceptance text + later boot stages
      skipBtn.hidden = false;

      await sleep(420);
      if (skippedRef.skipped) {
        cleanupAndResolve();
        return;
      }

      cascade.hidden = false;
      cascade.classList.remove("is-pending");
      cascade.classList.add("is-shown");
      const lines = ACCESS_SUCCESS?.lines ?? [];
      for (const line of lines) {
        if (skippedRef.skipped) break;
        const row = document.createElement("div");
        row.className = "gate__cascade-line";
        cascade.appendChild(row);
        await typeText(row, `> ${line.text}`, skippedRef);
        if (skippedRef.skipped) break;
        await sleep(line.delay ?? 100);
      }

      if (!skippedRef.skipped) {
        await sleep(ACCESS_SUCCESS?.holdMs ?? 700);
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
    logoStage.classList.remove("is-visible");
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

  for (const line of BOOT_LINES) {
    if (skippedRef.skipped) break;
    const el = document.createElement("div");
    el.className = line.cls || "";
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    await typeText(el, `> ${line.text}`, skippedRef);
    if (line.awaitDotsMs && !skippedRef.skipped) {
      const dots = document.createElement("span");
      dots.className = "boot-dots";
      el.appendChild(dots);
      await blinkBootDots(dots, line.awaitDotsMs, skippedRef);
    }
    log.scrollTop = log.scrollHeight;
    if (!skippedRef.skipped) await sleep(line.delay);
  }

  window.removeEventListener("keydown", onSkipKey);
  if (!skippedRef.skipped) await sleep(80);
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
    audio.play(target.dataset.sfx || "click");
  });
}

/* ==========================================================================
   INIT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initSystems();
  runBoot();
});
