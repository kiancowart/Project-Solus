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
  overview: "HULL TELEMETRY // CRAFT STATUS",
  flightlog: "FLIGHT LOG // PERSONAL RECORD",
  imperial: "IMPERIAL CLEARANCE // AUTHORIZATION",
  archives: "ARCHIVES // SHIP MEMORY",
  cartography: "CARTOGRAPHY // STELLAR FIX",
  diagnostics: "FIDELITY BUS // SIGNAL DIAGNOSTICS",
  auxiliary: "EXTERNAL // GUEST CHANNEL",
};

const LOCKED_UNTIL_IMPERIAL =
  CLEARANCE?.lockedUntilImperial ?? ["archives", "auxiliary"];

const LOCKED_UNTIL_PROGRESS =
  CLEARANCE?.lockedUntilProgress ?? ["flightlog", "cartography"];

export function isPanelLocked(panelId) {
  if (LOCKED_UNTIL_IMPERIAL.includes(panelId)) {
    return !hasImperialClearance();
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

  if (imperial) initGuestChannel();

  const meta = document.getElementById("adb-meta");
  if (meta && LORE_CATALOG) {
    const entries = LORE_CATALOG.entries ?? [];
    const n = entries.length;
    meta.textContent = imperial
      ? `${n} PARTITION${n === 1 ? "" : "S"} · ONLINE`
      : `${n} PARTITION${n === 1 ? "" : "S"} · SEALED`;
  }
}
