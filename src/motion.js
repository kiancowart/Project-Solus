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

  const showAll = () => {
    blocks.forEach((el) => {
      el.classList.remove("is-pending");
      el.classList.add("is-shown");
    });
  };

  if (prefersReducedMotion()) {
    showAll();
    return;
  }

  if (!blocks.length) return;

  blocks.forEach((el) => {
    el.classList.remove("is-shown");
    el.classList.add("is-pending");
  });

  try {
    const step = MOTION.blockStepMs ?? 70;
    const totalMs = Math.max(step, blocks.length * step);
    audio.play("revealScan", { durationMs: totalMs });

    for (const el of blocks) {
      if (abortedRef?.aborted) {
        audio.stopRevealScan();
        break;
      }
      el.classList.remove("is-pending");
      el.classList.add("is-shown");
      await sleep(step);
    }
  } finally {
    // Never leave interactive chrome stuck at visibility:hidden
    showAll();
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
  if (letters.length < 2) return src;

  const punchCount = Math.max(
    1,
    Math.min(letters.length - 1, Math.round(letters.length * ratio))
  );

  // Shuffle a copy (Fisher–Yates) so we always get unique indices — never spin
  // forever if an LCG collapses onto a short residue cycle.
  const pool = [...letters];
  let s = (seed * 1103515245 + 12345) >>> 0;
  for (let i = pool.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const pick = new Set(pool.slice(0, punchCount));

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

/**
 * Animate an element from scramble glyphs → clear text (Flight Log / Imperial style).
 * Works for HTML nodes and SVG `<text>`.
 *
 * @param {Element | null} el
 * @param {string} clearText
 * @param {{ durationMs?: number, onFrame?: (el: Element, text: string) => void }} [opts]
 */
export async function descrambleText(el, clearText, opts = {}) {
  if (!el) return;
  const clear = String(clearText ?? "");
  const durationMs = opts.durationMs ?? 900;
  const onFrame = opts.onFrame;

  if (!clear) {
    el.textContent = "";
    el.classList.remove("is-scrambled", "is-descrambling");
    el.classList.add("is-clear");
    return;
  }

  if (prefersReducedMotion()) {
    el.textContent = clear;
    el.classList.remove("is-scrambled", "is-descrambling");
    el.classList.add("is-clear");
    onFrame?.(el, clear);
    return;
  }

  el.classList.add("is-scrambled", "is-descrambling");
  el.classList.remove("is-clear");

  const steps = Math.max(8, Math.min(22, Math.round(durationMs / 45)));
  for (let s = 0; s <= steps; s++) {
    if (!el.isConnected) return;
    const t = s / steps;
    let out = "";
    for (let i = 0; i < clear.length; i++) {
      const ch = clear[i];
      if (ch === " " || ch === "\n") {
        out += ch;
        continue;
      }
      const threshold = t * 1.15 - (i / Math.max(1, clear.length)) * 0.35;
      if (Math.random() < threshold) out += ch;
      else out += SCRAMBLE_GLYPHS[(i * 13 + s * 7) % SCRAMBLE_GLYPHS.length];
    }
    el.textContent = out;
    onFrame?.(el, out);
    await sleep(Math.round(durationMs / steps));
  }

  if (!el.isConnected) return;
  el.textContent = clear;
  el.classList.remove("is-descrambling", "is-scrambled");
  el.classList.add("is-clear");
  onFrame?.(el, clear);
}

/* ==========================================================================
   CRT scroll rails — match intercept message (progress fill, native bar hidden)
   ========================================================================== */

/** Set phosphor rail fill amount (0–1). Origin is top, like intercept. */
export function setCrtRailFill(fillEl, amount) {
  if (!fillEl) return;
  const t = Math.max(0, Math.min(1, Number(amount) || 0));
  fillEl.style.transform = `scaleY(${t})`;
}

/**
 * Sync a CRT rail to a scroll host.
 * Rail is hidden unless content overflows (same rule as a real scrollbar).
 * Returns `{ update, destroy }`.
 */
export function bindCrtScrollRail(scrollEl, fillEl, { railEl = null } = {}) {
  if (!scrollEl || !fillEl) {
    return { update() {}, destroy() {} };
  }

  const rail =
    railEl ||
    fillEl.closest?.(".crt-rail") ||
    fillEl.closest?.(".crt-scroll__rail") ||
    null;

  const update = () => {
    if (!scrollEl.isConnected || !fillEl.isConnected) return;
    const max = scrollEl.scrollHeight - scrollEl.clientHeight;
    if (max <= 0) {
      if (rail) rail.hidden = true;
      setCrtRailFill(fillEl, 0);
      return;
    }
    if (rail) rail.hidden = false;
    setCrtRailFill(fillEl, scrollEl.scrollTop / max);
  };

  scrollEl.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  let ro = null;
  let mo = null;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(update);
    ro.observe(scrollEl);
  }
  if (typeof MutationObserver !== "undefined") {
    mo = new MutationObserver(update);
    mo.observe(scrollEl, { childList: true, subtree: true, characterData: true });
  }
  update();

  return {
    update,
    destroy() {
      scrollEl.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro?.disconnect();
      mo?.disconnect();
    },
  };
}

/** Bind every `.crt-scroll` shell under `root` (host + rail fill). */
export function initCrtScrollRails(root = document) {
  const shells = root.querySelectorAll?.(".crt-scroll") ?? [];
  const bindings = [];
  for (const shell of shells) {
    const host =
      shell.querySelector(".crt-scroll__host") ||
      shell.querySelector("[data-crt-scroll-host]");
    const fill =
      shell.querySelector(".crt-rail__fill") ||
      shell.querySelector("[data-crt-scroll-fill]");
    const rail = shell.querySelector(".crt-rail");
    if (!host || !fill) continue;
    if (host.dataset.crtRailBound === "1") continue;
    host.dataset.crtRailBound = "1";
    bindings.push(bindCrtScrollRail(host, fill, { railEl: rail }));
  }
  return bindings;
}

/* ==========================================================================
   CRT select — custom listbox (never use native <select> popups)
   ========================================================================== */

let crtSelectDocBound = false;

function closeAllCrtSelects(except = null) {
  document.querySelectorAll(".crt-select.is-open").forEach((el) => {
    if (except && el === except) return;
    el._crtSelect?.close?.();
  });
}

/**
 * Custom phosphor dropdown. Returns `{ root, getValue, setValue, setOptions, open, close }`.
 * @param {{
 *   options?: { value: string, label: string }[],
 *   value?: string,
 *   className?: string,
 *   ariaLabel?: string,
 *   placeholder?: string,
 *   onChange?: (value: string) => void,
 * }} opts
 */
export function createCrtSelect({
  options = [],
  value = "",
  className = "",
  ariaLabel = "",
  placeholder = "—",
  onChange = null,
} = {}) {
  const root = document.createElement("div");
  root.className = ["crt-select", className].filter(Boolean).join(" ");

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "crt-select__trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  if (ariaLabel) trigger.setAttribute("aria-label", ariaLabel);

  const labelEl = document.createElement("span");
  labelEl.className = "crt-select__label";
  const caret = document.createElement("span");
  caret.className = "crt-select__caret";
  caret.setAttribute("aria-hidden", "true");
  caret.textContent = "▼";
  trigger.append(labelEl, caret);

  const menu = document.createElement("ul");
  menu.className = "crt-select__menu";
  menu.setAttribute("role", "listbox");
  menu.hidden = true;
  if (ariaLabel) menu.setAttribute("aria-label", ariaLabel);

  root.append(trigger, menu);

  let opts = (options ?? []).map((o) => ({
    value: String(o.value ?? ""),
    label: String(o.label ?? o.value ?? ""),
  }));
  let current = String(value ?? "");

  const labelFor = (v) => {
    const hit = opts.find((o) => o.value === v);
    return hit ? hit.label : placeholder;
  };

  const paintTrigger = () => {
    labelEl.textContent = labelFor(current);
    root.dataset.value = current;
    root.classList.toggle("is-empty", !current);
    menu.querySelectorAll(".crt-select__option").forEach((li) => {
      const on = li.dataset.value === current;
      li.classList.toggle("is-selected", on);
      li.setAttribute("aria-selected", on ? "true" : "false");
    });
  };

  const paintMenu = () => {
    menu.replaceChildren();
    for (const o of opts) {
      const li = document.createElement("li");
      li.className = "crt-select__option";
      li.setAttribute("role", "option");
      li.dataset.value = o.value;
      li.textContent = o.label;
      li.tabIndex = -1;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        api.setValue(o.value);
        api.close();
        trigger.focus();
      });
      menu.appendChild(li);
    }
    paintTrigger();
  };

  const api = {
    root,
    getValue: () => current,
    setValue(next, { silent = false } = {}) {
      const v = String(next ?? "");
      const prev = current;
      current = v;
      paintTrigger();
      if (!silent && v !== prev) onChange?.(v);
    },
    setOptions(next, { keepValue = true } = {}) {
      opts = (next ?? []).map((o) => ({
        value: String(o.value ?? ""),
        label: String(o.label ?? o.value ?? ""),
      }));
      if (keepValue && !opts.some((o) => o.value === current) && current) {
        /* keep stale label until sync clears it */
      }
      if (!keepValue || (current && !opts.some((o) => o.value === current))) {
        current = opts.some((o) => o.value === current) ? current : "";
      }
      paintMenu();
    },
    open() {
      closeAllCrtSelects(root);
      root.classList.add("is-open");
      menu.hidden = false;
      menu.classList.remove("crt-select__menu--up");
      trigger.setAttribute("aria-expanded", "true");
      requestAnimationFrame(() => {
        const rect = menu.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 8) {
          menu.classList.add("crt-select__menu--up");
        }
      });
    },
    close() {
      root.classList.remove("is-open");
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    },
  };

  root._crtSelect = api;

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (root.classList.contains("is-open")) api.close();
    else api.open();
  });

  trigger.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      api.open();
      const focusOpt =
        menu.querySelector(".crt-select__option.is-selected") ||
        menu.querySelector(".crt-select__option");
      focusOpt?.focus?.();
    } else if (e.key === "Escape") {
      api.close();
    }
  });

  menu.addEventListener("keydown", (e) => {
    const items = [...menu.querySelectorAll(".crt-select__option")];
    const i = items.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      api.close();
      trigger.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[Math.min(items.length - 1, i + 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[Math.max(0, i - 1)]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      document.activeElement?.click?.();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  });

  if (!crtSelectDocBound) {
    crtSelectDocBound = true;
    document.addEventListener(
      "pointerdown",
      (e) => {
        const hit = e.target?.closest?.(".crt-select");
        if (!hit) closeAllCrtSelects();
      },
      true
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAllCrtSelects();
    });
  }

  paintMenu();
  return api;
}
