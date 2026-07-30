/**
 * LATTICE.OS — Clearance / Imperial partitions
 */

import { CLEARANCE } from "../content/boot-content.js";
import { LORE_CATALOG } from "../content/lore-catalog.js";
import { initGuestChannel } from "./guest.js";
import {
  hasImperialClearance,
  hasDeepClearance,
  grantImperialClearance,
  grantDeepClearance,
} from "./milestones.js";
import { isChannelUnlocked } from "./progress.js";

export {
  hasImperialClearance,
  hasDeepClearance,
  grantImperialClearance,
  grantDeepClearance,
};

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

  gate.classList.toggle("is-granted", granted);
  const assemble = document.getElementById("imperial-assemble");
  if (assemble) assemble.hidden = false;

  for (const cls of IMPERIAL_GATE_TRANSIENT_CLASSES) {
    gate.classList.remove(cls);
  }

  if (granted) {
    gate.classList.add(...IMPERIAL_GATE_BOUND_CLASSES);
  } else {
    gate.classList.remove(...IMPERIAL_GATE_BOUND_CLASSES);
  }

  const fillEl = gate.querySelector(".imperial-tri__glyph--fill");
  if (fillEl) fillEl.style.clipPath = "";
}

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
    meta.textContent = imperial
      ? `${n} PARTITION${n === 1 ? "" : "S"} · ONLINE`
      : `${n} PARTITION${n === 1 ? "" : "S"} · SEALED`;
  }
}
