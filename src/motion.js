/**
 * LATTICE.OS — Motion helpers
 */

import { MOTION } from "../content/boot-content.js";
import { audio } from "./audio.js";

/* ==========================================================================
   MOTION HELPERS — stiff Alien-terminal typing / stepped reveal
   ========================================================================== */

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pace factor for boot-only timings (< 1 = faster). */
export function bootPace() {
  return MOTION.bootPace ?? 1;
}

export function bootMs(ms) {
  return Math.max(0, Math.round(Number(ms) * bootPace()));
}

export function prefersReducedMotion() {
  return (
    document.body.classList.contains("reduce-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export async function typeText(el, fullText, skippedRef = null, onTick = null, pace = 1) {
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
    // Skip pure whitespace ticks so spaces don't spam the bed
    if (fullText[i].trim()) audio.play("typewriter");
    let wait = typeMs;
    if (hitchEvery > 0 && i > 0 && i % hitchEvery === 0) wait += hitchMs;
    await sleep(wait);
  }
}

/** Blink . / .. / ... on a span for durationMs (loading hold) */
export async function blinkBootDots(dotsEl, durationMs, skippedRef = null) {
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

export async function revealTopToBottom(container, abortedRef = null) {
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

  if (!blocks.length) return;

  blocks.forEach((el) => {
    el.classList.remove("is-shown");
    el.classList.add("is-pending");
  });

  const step = MOTION.blockStepMs ?? 70;
  const totalMs = Math.max(step, blocks.length * step);
  audio.play("revealScan", { durationMs: totalMs });

  for (const el of blocks) {
    if (abortedRef?.aborted) {
      audio.stopRevealScan();
      return;
    }
    el.classList.remove("is-pending");
    el.classList.add("is-shown");
    await sleep(step);
  }
}

export async function revealPanel(panel) {
  panel.classList.add("is-revealing");
  const body = panel.querySelector(".panel__body");
  if (body) await revealTopToBottom(body);
  panel.classList.remove("is-revealing");
}

/* ==========================================================================
   CORRUPTION / SCRAMBLE GLYPHS — Flight Log · Chart · chrome
   ========================================================================== */

/** Block/shade glyphs only — no punctuation or math symbols */
export const SCRAMBLE_GLYPHS = "░▒▓█▄▀■□▪▫";

export function scrambleText(clear, seed = 0) {
  const src = String(clear ?? "");
  if (!src) return "";
  const n = SCRAMBLE_GLYPHS.length;
  let out = "";
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === " " || ch === "\n" || ch === "-" || ch === ".") {
      out += ch;
      continue;
    }
    const idx =
      ((seed + 1) * 31 + i * 13 + src.length * 7 + (src.charCodeAt(i) || 0)) %
      n;
    out += SCRAMBLE_GLYPHS[idx < 0 ? idx + n : idx];
  }
  return out;
}

/**
 * Punch a few letters out of a string (corruption vibe, still mostly readable).
 * Non-letters and spaces stay. Deterministic per seed.
 */
export function punchLetters(clear, { ratio = 0.18, seed = 1 } = {}) {
  const src = String(clear ?? "");
  if (!src) return "";
  const letters = [];
  for (let i = 0; i < src.length; i++) {
    if (/[A-Za-z]/.test(src[i])) letters.push(i);
  }
  const punchCount = Math.max(
    1,
    Math.min(letters.length - 1, Math.round(letters.length * ratio))
  );
  const pick = new Set();
  let s = (seed * 1103515245 + 12345) >>> 0;
  while (pick.size < punchCount && letters.length) {
    s = (s * 1103515245 + 12345) >>> 0;
    pick.add(letters[s % letters.length]);
  }
  let out = "";
  for (let i = 0; i < src.length; i++) {
    if (pick.has(i)) {
      out += SCRAMBLE_GLYPHS[(i * 7 + seed) % SCRAMBLE_GLYPHS.length];
    } else out += src[i];
  }
  return out;
}

/** Light chrome corruption — a few glyphs, keeps the string recognizable. */
export function corruptChromeLabel(clear, seed = 3) {
  return punchLetters(clear, { ratio: 0.22, seed });
}

function noiseLine(width, seed, t) {
  const n = SCRAMBLE_GLYPHS.length;
  let out = "";
  for (let i = 0; i < width; i++) {
    const idx = (seed * 17 + i * 13 + t * 7) % n;
    out += SCRAMBLE_GLYPHS[idx < 0 ? idx + n : idx];
  }
  return out;
}

/**
 * Animate corruption streams inside `.chart-corrupt-bar` elements.
 * Returns a stop() function.
 */
export function animateCorruptBars(root, clearTitle = "") {
  if (!root) return () => {};
  const streams = [...root.querySelectorAll("[data-corrupt-stream]")];
  const titleEl = root.querySelector("[data-corrupt-title]");
  if (prefersReducedMotion()) {
    streams.forEach((el) => {
      el.textContent = noiseLine(48, 2, 0);
    });
    if (titleEl && clearTitle) {
      titleEl.textContent = scrambleText(clearTitle, 5);
    }
    return () => {};
  }

  let frame = 0;
  let raf = 0;
  let alive = true;

  const tick = () => {
    if (!alive) return;
    frame += 1;
    // ~20fps text churn is enough; full 60fps DOM writes were expensive
    if (frame % 3 === 0) {
      streams.forEach((el, si) => {
        const w = Math.max(36, Math.floor((el.parentElement?.clientWidth || 220) / 7));
        el.textContent = noiseLine(w, si + 3, frame);
      });
      if (titleEl && clearTitle && frame % 6 === 0) {
        titleEl.textContent = scrambleText(clearTitle, frame);
      }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    alive = false;
    if (raf) cancelAnimationFrame(raf);
  };
}
