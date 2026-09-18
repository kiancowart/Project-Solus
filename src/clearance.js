/**
 * =============================================================================
 * clearance.js — Imperial flag + which hub channels are locked
 * =============================================================================
 * WHAT THIS FILE DOES
 *   Remembers whether Imperial Clearance is granted, and paints the hub:
 *   locked nav items, partition-seal overlays, Guest Channel noise, and
 *   the Imperial triad's already-bound visual state.
 *
 * FLAG STORAGE
 *   localStorage key / values come from CLEARANCE in content/boot-content.js
 *   (lattice.clearance = "imperial"). Legacy "deep" still counts as granted.
 *
 * LOCK RULES (isPanelLocked)
 *   Imperial granted     → nothing locked
 *   lockedUntilImperial  → Archives + Guest Channel (need 9-slot bind)
 *   lockedUntilProgress  → Flight Log + Chart (need STATUS bay puzzles)
 *
 * WHERE TO EDIT
 *   Which panels stay sealed          → CLEARANCE in content/boot-content.js
 *   Banner titles                     → CHANNEL_TITLES below (keep in sync
 *                                       with CHROME_CLEAR in src/nav.js)
 *   Seal overlay copy                 → CLEARANCE.seal / progressSeal
 *
 * EVENTS
 *   lattice:clearance — fired after applyClearanceUI({ imperial })
 * =============================================================================
 */

import { CLEARANCE } from "../content/boot-content.js";
import { LORE_CATALOG } from "../content/lore-catalog.js";
import { isChannelUnlocked } from "./progress.js";

/* ==========================================================================
   IMPERIAL CLEARANCE — persistence (localStorage)
   ========================================================================== */

const CLEARANCE_KEY = CLEARANCE?.storageKey ?? "lattice.clearance";
const CLEARANCE_IMPERIAL = CLEARANCE?.imperialValue ?? "imperial";
const CLEARANCE_LEGACY_DEEP = CLEARANCE?.deepValue ?? "deep";

/** True for this page load even if localStorage is blocked. */
let sessionImperial = false;

/** True after a successful 9-slot bind (or pad cheat 111). */
export function hasImperialClearance() {
  if (sessionImperial) return true;
  try {
    const v = localStorage.getItem(CLEARANCE_KEY);
    return v === CLEARANCE_IMPERIAL || v === CLEARANCE_LEGACY_DEEP;
  } catch {
    return false;
  }
}

/** @deprecated use hasImperialClearance */
export function hasDeepClearance() {
  return hasImperialClearance();
}

/** Write the Imperial flag. Call completeImperialBind() in imperial.js for the full unlock. */
export function grantImperialClearance() {
  sessionImperial = true;
  try {
    localStorage.setItem(CLEARANCE_KEY, CLEARANCE_IMPERIAL);
  } catch {
    /* session flag still unlocks */
  }
}

/** @deprecated use grantImperialClearance */
export function grantDeepClearance() {
  grantImperialClearance();
}

/* ==========================================================================
   GUEST CHANNEL — corrupt signal display
   ========================================================================== */

/** Glyph soup for the Guest "corrupt signal" sub-channel (visual only). */
const GUEST_NOISE =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz0123456789/·#▓░▒";

function makeCorruptNoise(len = 52) {
  let out = "";
  for (let i = 0; i < len; i++) {
    if (i > 0 && i % 13 === 0) out += " ";
    else out += GUEST_NOISE[Math.floor(Math.random() * GUEST_NOISE.length)];
  }
  return out;
}

/** Paint a fresh corrupt string in the signal channel display. */
export function refreshGuestCorruptDisplay() {
  const el = document.getElementById("guest-corrupt-display");
  if (el) el.textContent = makeCorruptNoise();
}

export function initGuestChannel() {
  refreshGuestCorruptDisplay();
}

/* ==========================================================================
   CHANNEL LOCKS / PARTITION UI
   ========================================================================== */

/** Red channel-banner copy — keyed by nav `data-panel` */
export const CHANNEL_TITLES = {
  terminal: "FTHFLL // KERNEL INTERFACE",
  overview: "HULL TELEMETRY // CRAFT FUNCTIONALITY",
  flightlog: "INTERNAL DATABASE // PERSONAL RECORD",
  imperial: "EMERGENCY OVERRIDE // RECOVERY AUTHORIZATION",
  archives: "ARCHIVES // SHIP MEMORY",
  cartography: "CARTOGRAPHY // STELLAR CHART",
  diagnostics: "FIDELITY BUS // SIGNAL DIAGNOSTICS",
  "guest-campaign-1": "EXTERNAL // CAMPAIGN 1",
  "guest-corrupt": "EXTERNAL // CORRUPT SIGNAL",
};

const LOCKED_UNTIL_IMPERIAL =
  CLEARANCE?.lockedUntilImperial ?? ["archives", "auxiliary"];

const LOCKED_UNTIL_PROGRESS =
  CLEARANCE?.lockedUntilProgress ?? ["flightlog", "cartography"];

export function isPanelLocked(panelId) {
  if (hasImperialClearance()) return false;
  if (LOCKED_UNTIL_IMPERIAL.includes(panelId)) {
    return true;
  }
  if (LOCKED_UNTIL_PROGRESS.includes(panelId)) {
    return !isChannelUnlocked(panelId);
  }
  return false;
}

export function sealMarkup(kind = "imperial") {
  const cfg =
    kind === "progress"
      ? CLEARANCE?.progressSeal
      : CLEARANCE?.seal;
  const title = cfg?.title ?? "PARTITION LOCKED";
  const body =
    cfg?.body ??
    (kind === "progress"
      ? "Channel offline. Restore INNER diagnostics on STATUS."
      : "Imperial Clearance required.");
  return `
    <div class="partition-seal" role="status">
      <p class="partition-seal__sigil" aria-hidden="true">▽</p>
      <p class="partition-seal__title">${title}</p>
      <p class="partition-seal__body">${body}</p>
    </div>`;
}

/** Classes snapped on when Imperial Clearance is already granted. */
export const IMPERIAL_GATE_BOUND_CLASSES = [
  "is-binding",
  "is-sides-out",
  "is-mid-filled",
  "is-banquet-in",
  "is-seal-bound",
  "is-reset-in",
  "is-reset-ready",
];

const IMPERIAL_GATE_TRANSIENT_CLASSES = ["is-mid-filling", "is-mid-glitch"];

/** Sync #imperial-gate to the final bound (or cleared) visual state. */
export function syncImperialGateVisual(granted) {
  const gate = document.getElementById("imperial-gate");
  if (!gate) return;

  // Bind sequence owns these classes + the mid-fill clip-path. A window
  // focus / applyClearanceUI pass mid-animation used to strip is-sides-out
  // while playGlitchMidFill kept painting the fill — outline triangles
  // overlapping the solid mid glyph.
  if (!granted && gate.classList.contains("is-playing-bind")) return;

  gate.classList.toggle("is-granted", granted);
  const assemble = document.getElementById("imperial-assemble");
  if (assemble) assemble.hidden = false;

  for (const cls of IMPERIAL_GATE_TRANSIENT_CLASSES) {
    gate.classList.remove(cls);
  }

  if (granted) {
    gate.classList.add(...IMPERIAL_GATE_BOUND_CLASSES);
    const img = gate.querySelector(".imperial-tri__banquet-img");
    const deferred = img?.getAttribute("data-src");
    if (img && deferred && !img.getAttribute("src")) {
      img.src = deferred;
      img.removeAttribute("data-src");
    }
  } else {
    gate.classList.remove(...IMPERIAL_GATE_BOUND_CLASSES);
  }

  const fillEl = gate.querySelector(".imperial-tri__glyph--fill");
  if (fillEl) fillEl.style.clipPath = "";
}

/**
 * Repaint locks, seals, Imperial gate chrome, and Archives meta line.
 * Call after any clearance / STATUS unlock change.
 */
export function applyClearanceUI() {
  const imperial = hasImperialClearance();
  document.body.classList.toggle("has-deep-clearance", imperial);
  document.body.classList.toggle("has-imperial-clearance", imperial);

  document.querySelectorAll(".nav-item[data-panel]").forEach((btn) => {
    const locked = isPanelLocked(btn.dataset.panel);
    btn.classList.toggle("is-locked", locked);
    if (locked) btn.setAttribute("aria-disabled", "true");
    else btn.removeAttribute("aria-disabled");
  });

  document.querySelectorAll(".nav-group--guest .nav-item--toggle").forEach((btn) => {
    const locked = isPanelLocked("guest-campaign-1");
    btn.classList.toggle("is-locked", locked);
    if (locked) btn.setAttribute("aria-disabled", "true");
    else btn.removeAttribute("aria-disabled");
  });

  document.querySelectorAll(".panel[data-panel]").forEach((panel) => {
    const id = panel.dataset.panel;
    const body = panel.querySelector(".panel__body");
    if (!body) return;

    const seal = body.querySelector(":scope > .partition-seal");
    const locked = isPanelLocked(id);
    const kind = LOCKED_UNTIL_PROGRESS.includes(id) ? "progress" : "imperial";

    if (locked) {
      body.classList.add("is-sealed");
      if (seal) seal.remove();
      body.insertAdjacentHTML("afterbegin", sealMarkup(kind));
    } else {
      body.classList.remove("is-sealed");
      seal?.remove();
    }
  });

  syncImperialGateVisual(imperial);

  document.querySelectorAll(".lattice-route--nav, .nav-route").forEach((el) => {
    el.hidden = !imperial;
  });
  const gateHub = document.getElementById("gate-hub");
  if (gateHub) gateHub.hidden = !imperial;

  if (imperial) initGuestChannel();

  window.dispatchEvent(
    new CustomEvent("lattice:clearance", { detail: { imperial } })
  );

  const meta = document.getElementById("adb-meta");
  if (meta && LORE_CATALOG) {
    const entries = LORE_CATALOG.entries ?? [];
    const n = entries.length;
    const r =
      LORE_CATALOG.recoveredCount ??
      entries.filter((e) => e.recovered).length;
    meta.textContent = imperial
      ? `${r}/${n} RECOVERED · ONLINE`
      : `${n} PARTITION${n === 1 ? "" : "S"} · SEALED`;
  }
}
