/**
 * LATTICE.OS — Chrono (local military time + Terra offset bus)
 *
 * Display uses the visitor's computer clock (local), not UTC.
 * Hours/minutes can carry intentional offsets (Terra Chart puzzle);
 * seconds always track real local seconds.
 */

import { isDossierUnlocked } from "./progress.js";

const HOUR_OFFSET_DEFAULT = -5;
const MINUTE_OFFSET_DEFAULT = -12;

let hourOffset = HOUR_OFFSET_DEFAULT;
let minuteOffset = MINUTE_OFFSET_DEFAULT;
let running = false;
let chronoEl = null;

function wrap(n, mod) {
  return ((n % mod) + mod) % mod;
}

/** Real local wall-clock parts from the visitor's machine. */
export function getRealLocalTime(date = new Date()) {
  return {
    h: date.getHours(),
    m: date.getMinutes(),
    s: date.getSeconds(),
    ms: date.getMilliseconds(),
  };
}

export function getChronoOffsets() {
  if (isDossierUnlocked("terra")) {
    return { hourOffset: 0, minuteOffset: 0 };
  }
  return { hourOffset, minuteOffset };
}

export function isChronoAligned() {
  const o = getChronoOffsets();
  return o.hourOffset === 0 && o.minuteOffset === 0;
}

/** Displayed military time after offsets (seconds always real). */
export function getDisplayLocalTime(date = new Date()) {
  const real = getRealLocalTime(date);
  if (isDossierUnlocked("terra")) {
    return { ...real, hourOffset: 0, minuteOffset: 0 };
  }
  let totalMins = real.h * 60 + real.m + hourOffset * 60 + minuteOffset;
  totalMins = wrap(totalMins, 24 * 60);
  return {
    h: Math.floor(totalMins / 60),
    m: totalMins % 60,
    s: real.s,
    ms: real.ms,
    hourOffset,
    minuteOffset,
  };
}

function emit() {
  const display = getDisplayLocalTime();
  window.dispatchEvent(
    new CustomEvent("lattice:chrono", {
      detail: { ...display, aligned: isChronoAligned() },
    })
  );
}

function ensureChronoParts() {
  if (!chronoEl) return null;
  if (chronoEl.dataset.parts === "1") {
    return {
      h: chronoEl.querySelector("[data-chrono-part='h']"),
      m: chronoEl.querySelector("[data-chrono-part='m']"),
      s: chronoEl.querySelector("[data-chrono-part='s']"),
    };
  }
  chronoEl.dataset.parts = "1";
  chronoEl.innerHTML =
    `<span class="chrono-part" data-chrono-part="h">--</span>` +
    `<span class="chrono-sep">:</span>` +
    `<span class="chrono-part" data-chrono-part="m">--</span>` +
    `<span class="chrono-sep">:</span>` +
    `<span class="chrono-part" data-chrono-part="s">--</span>`;
  return {
    h: chronoEl.querySelector("[data-chrono-part='h']"),
    m: chronoEl.querySelector("[data-chrono-part='m']"),
    s: chronoEl.querySelector("[data-chrono-part='s']"),
  };
}

function paintChrono() {
  if (!chronoEl) return;
  const { h, m, s } = getDisplayLocalTime();
  const parts = ensureChronoParts();
  if (parts?.h) parts.h.textContent = String(h).padStart(2, "0");
  if (parts?.m) parts.m.textContent = String(m).padStart(2, "0");
  if (parts?.s) parts.s.textContent = String(s).padStart(2, "0");
  chronoEl.dateTime = new Date().toISOString();
}

/** Partial CRT hitch on HH or MM when Terra rings are nudged. */
export function glitchChronoPart(part, { durationMs = 280 } = {}) {
  const key = part === "hours" || part === "h" ? "h" : part === "minutes" || part === "m" ? "m" : null;
  if (!key || !chronoEl) return;
  const parts = ensureChronoParts();
  const el = parts?.[key];
  if (!el) return;
  el.classList.remove("is-glitching");
  void el.offsetWidth;
  el.classList.add("is-glitching");
  window.setTimeout(() => el.classList.remove("is-glitching"), durationMs);
}

export function setHourOffset(value) {
  if (isDossierUnlocked("terra")) return;
  hourOffset = Math.trunc(value);
  // Keep offsets in a sane band for UX (still wraps on display)
  while (hourOffset > 12) hourOffset -= 24;
  while (hourOffset < -12) hourOffset += 24;
  paintChrono();
  emit();
}

export function setMinuteOffset(value) {
  if (isDossierUnlocked("terra")) return;
  minuteOffset = Math.trunc(value);
  while (minuteOffset > 30) minuteOffset -= 60;
  while (minuteOffset < -30) minuteOffset += 60;
  paintChrono();
  emit();
}

export function nudgeHourOffset(delta) {
  setHourOffset(hourOffset + delta);
}

export function nudgeMinuteOffset(delta) {
  setMinuteOffset(minuteOffset + delta);
}

export function resetChronoOffsets() {
  if (isDossierUnlocked("terra")) {
    hourOffset = 0;
    minuteOffset = 0;
  } else {
    hourOffset = HOUR_OFFSET_DEFAULT;
    minuteOffset = MINUTE_OFFSET_DEFAULT;
  }
  paintChrono();
  emit();
}

/** Call after Terra dossier unlock so the header clock snaps true. */
export function lockChronoAligned() {
  hourOffset = 0;
  minuteOffset = 0;
  paintChrono();
  emit();
}

export function startChrono() {
  chronoEl = document.getElementById("chrono");
  if (!chronoEl || running) return;
  running = true;
  if (isDossierUnlocked("terra")) {
    hourOffset = 0;
    minuteOffset = 0;
  }
  const tick = () => {
    paintChrono();
  };
  tick();
  // Sub-second so Terra seconds ring stays smooth
  setInterval(tick, 200);
  emit();
}
