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
    if (i % 8 === 0) audio.play("boot");
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

export async function revealTopToBottom(container) {
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

export async function revealPanel(panel) {
  panel.classList.add("is-revealing");
  const body = panel.querySelector(".panel__body");
  if (body) await revealTopToBottom(body);
  panel.classList.remove("is-revealing");
}
