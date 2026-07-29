/**
 * LATTICE.OS — Navigation, chrono, diagnostics
 */

import { audio } from "./audio.js";
import { typeText, revealPanel } from "./motion.js";
import { CHANNEL_TITLES } from "./clearance.js";
import { refreshGuestCorruptDisplay } from "./guest.js";

/* ==========================================================================
   NAVIGATION — channel switching + typed banner title
   ========================================================================== */

/** Cancels an in-flight banner typewriter when a new channel is selected */
let bannerTypeAbort = { skipped: true };

export async function typeChannelBanner(panelId, titleOverride) {
  const banner = document.getElementById("channel-banner");
  if (!banner) return;

  const title = titleOverride || CHANNEL_TITLES[panelId] || "";
  bannerTypeAbort.skipped = true;
  const skippedRef = { skipped: false };
  bannerTypeAbort = skippedRef;

  banner.textContent = "";
  await typeText(banner, title, skippedRef);
}

export function initNav() {
  const rail = document.querySelector(".nav-rail");
  const panels = document.querySelectorAll(".panel");
  if (!rail) return;

  let revealing = false;

  rail.addEventListener("click", async (e) => {
    const toggle = e.target.closest(".nav-item--toggle");
    if (toggle && rail.contains(toggle)) {
      if (revealing) return;
      if (toggle.classList.contains("is-locked")) {
        audio.play("deny");
        return;
      }
      const group = toggle.closest(".nav-group");
      const sub = group?.querySelector(".nav-group__sub");
      const open = !group?.classList.contains("is-open");
      group?.classList.toggle("is-open", open);
      if (sub) sub.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      audio.play(toggle.dataset.sfx || "click");
      return;
    }

    const btn = e.target.closest(".nav-item[data-panel]");
    if (!btn || !rail.contains(btn)) return;
    if (revealing) return;
    if (btn.classList.contains("is-locked")) {
      audio.play("deny");
      return;
    }

    const id = btn.dataset.panel;
    if (!id) return;

    const group = btn.closest(".nav-group");
    if (group) {
      group.classList.add("is-open");
      const sub = group.querySelector(".nav-group__sub");
      if (sub) sub.hidden = false;
      const parentToggle = group.querySelector(".nav-item--toggle");
      parentToggle?.setAttribute("aria-expanded", "true");
    }

    rail.querySelectorAll(".nav-item[data-panel]").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });

    let shown = null;
    panels.forEach((panel) => {
      const match = panel.dataset.panel === id;
      panel.hidden = !match;
      panel.classList.toggle("is-active", match);
      if (match) shown = panel;
    });

    audio.play("channelSwitch");

    if (id === "guest-corrupt") refreshGuestCorruptDisplay();

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

export function startChrono() {
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

export function updateAudioToggle(on) {
  const btn = document.getElementById("audio-toggle");
  if (!btn) return;
  const label = btn.querySelector(".sys-toggle__label");
  btn.classList.toggle("is-on", on);
  if (label) label.textContent = on ? "AUDIO: ON" : "AUDIO: OFF";
}

export function updateMotionToggle(reduced) {
  const btn = document.getElementById("reduce-motion");
  if (!btn) return;
  const label = btn.querySelector(".sys-toggle__label");
  /* Filled when motion is ON (not reduced); hollow when OFF */
  btn.classList.toggle("is-on", !reduced);
  if (label) label.textContent = reduced ? "MOTION: OFF" : "MOTION: ON";
  document.body.classList.toggle("reduce-motion", reduced);
}

export function setFillBarValue(bar, value) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const fill = bar.querySelector(".fill-bar__fill");
  if (fill) fill.style.width = `${v}%`;
  bar.setAttribute("aria-valuenow", String(v));
  bar.dataset.value = String(v);
  return v;
}

export function readFillBarValue(bar) {
  return Number(bar.dataset.value ?? bar.getAttribute("aria-valuenow") ?? 0);
}

export function valueFromPointer(bar, clientX) {
  const rect = bar.getBoundingClientRect();
  if (rect.width <= 0) return 0;
  return ((clientX - rect.left) / rect.width) * 100;
}

export function bindFillBar(bar, onChange) {
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

export function initSystems() {
  const form = document.getElementById("systems-form");
  const audioBtn = document.getElementById("audio-toggle");
  const motionBtn = document.getElementById("reduce-motion");
  const sfxGain = document.getElementById("sfx-gain");
  const ambienceGain = document.getElementById("ambience-gain");
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

  bindFillBar(ambienceGain, (v) => {
    audio.setAmbienceGain(v / 100);
  });
  audio.setAmbienceGain(readFillBarValue(ambienceGain) / 100);

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
