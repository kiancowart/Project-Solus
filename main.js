/**
 * LATTICE OS — G512 Carapace (Cara), bonded: Solus
 * Boot, navigation, CRT fidelity, and interface audio.
 */

const BOOT_LINES = [
  { text: "LATTICE OS — FTHFLL resuscitating…", cls: "boot-line--ok", delay: 420 },
  { text: "Scarlet Order of the Veil · consecrated craftware", cls: "boot-line--gold", delay: 480 },
  { text: "Craft ID … G512 Carapace-class · CARA", cls: "boot-line--ok", delay: 450 },
  { text: "Khan-link handshake … SOLUS · BOUND", cls: "boot-line--ok", delay: 520 },
  { text: "WARNING: hull integrity critical", cls: "boot-line--err", delay: 400 },
  { text: "Propulsion lattice … OFFLINE", cls: "boot-line--err", delay: 380 },
  { text: "Life support … partial / recycling", cls: "boot-line--warn", delay: 420 },
  { text: "Imperial relay … NO SIGNAL", cls: "boot-line--err", delay: 450 },
  { text: "Nav fix … Uros · Sturm", cls: "boot-line--warn", delay: 400 },
  { text: "Flight log partition … recoverable", cls: "boot-line--ok", delay: 380 },
  { text: "Guest channel … sealed", cls: "", delay: 320 },
  { text: "Operator session opened aboard Cara.", cls: "boot-line--ok", delay: 650 },
];

const PANEL_HINTS = {
  overview: "HULL TELEMETRY — CRITICAL · G512 CARA",
  flightlog: "FLIGHT LOG — PERSONAL RECORD",
  archives: "ARCHIVES — PARTIAL SURVIVAL",
  cartography: "CARTOGRAPHY — UROS · STURM",
  diagnostics: "DIAGNOSTICS — FIDELITY CONTROLS",
  auxiliary: "GUEST CHANNEL — SEALED",
};

/* ---------- Audio (Web Audio API synthesizer) ---------- */

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
      this.#tone(master, 180, 0.08, t, "square");
      this.#tone(master, 320, 0.06, t + 0.09, "square");
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

    // click / default
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

/* ---------- Boot ---------- */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBoot() {
  const log = document.getElementById("boot-log");
  const skipBtn = document.getElementById("boot-skip");
  const bootScreen = document.getElementById("boot");
  const hubScreen = document.getElementById("hub");

  let skipped = false;
  skipBtn.hidden = false;
  skipBtn.addEventListener(
    "click",
    () => {
      skipped = true;
      audio.play("click");
    },
    { once: true }
  );

  // First interaction path: enable audio on skip or any key during boot
  const unlockAudio = async () => {
    await audio.enable();
    updateAudioToggle(true);
  };
  document.addEventListener(
    "keydown",
    () => {
      unlockAudio();
    },
    { once: true }
  );
  skipBtn.addEventListener("click", unlockAudio, { once: true });

  for (const line of BOOT_LINES) {
    if (skipped) break;
    const el = document.createElement("div");
    el.className = line.cls;
    el.textContent = `> ${line.text}`;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    audio.play("boot");
    await sleep(line.delay);
  }

  if (!skipped) await sleep(400);

  bootScreen.hidden = true;
  hubScreen.hidden = false;
  audio.play("select");
  startChrono();
}

/* ---------- Navigation ---------- */

function initNav() {
  const items = document.querySelectorAll(".nav-item");
  const panels = document.querySelectorAll(".panel");
  const hint = document.getElementById("footer-hint");

  items.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.panel;
      items.forEach((b) => b.classList.toggle("is-active", b === btn));
      panels.forEach((panel) => {
        const match = panel.dataset.panel === id;
        panel.hidden = !match;
        panel.classList.toggle("is-active", match);
      });
      hint.textContent = PANEL_HINTS[id] || "";
      audio.play(btn.dataset.sfx || "select");
    });
  });
}

/* ---------- Chrono ---------- */

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

/* ---------- Systems / audio UI ---------- */

function updateAudioToggle(on) {
  const btn = document.getElementById("audio-toggle");
  const label = btn.querySelector(".audio-toggle__label");
  btn.classList.toggle("is-on", on);
  label.textContent = on ? "AUDIO: ON" : "AUDIO: OFF";
}

function initSystems() {
  const audioBtn = document.getElementById("audio-toggle");
  const sfxGain = document.getElementById("sfx-gain");
  const scan = document.getElementById("scan-intensity");
  const reduce = document.getElementById("reduce-motion");

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

  sfxGain.addEventListener("input", () => {
    audio.setSfxGain(Number(sfxGain.value) / 100);
  });
  audio.setSfxGain(Number(sfxGain.value) / 100);

  scan.addEventListener("input", () => {
    const v = Number(scan.value) / 100;
    document.documentElement.style.setProperty("--scan-opacity", String(0.04 + v * 0.18));
  });

  reduce.addEventListener("change", () => {
    document.body.classList.toggle("reduce-motion", reduce.checked);
  });

  // Global click SFX for interactive controls
  document.body.addEventListener("click", (e) => {
    const target = e.target.closest("[data-sfx]");
    if (!target || target.classList.contains("nav-item")) return;
    if (target.id === "audio-toggle") return;
    audio.play(target.dataset.sfx || "click");
  });
}

/* ---------- Init ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initSystems();
  runBoot();
});
