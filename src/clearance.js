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
  archives: "ARCHIVES // SHIP MEMORY",
  cartography: "CARTOGRAPHY // STELLAR FIX",
  diagnostics: "FIDELITY BUS // SIGNAL DIAGNOSTICS",
  auxiliary: "EXTERNAL // GUEST CHANNEL",
};

/* ==========================================================================
   CLEARANCE — Imperial Clearance gates hub depth (localStorage)
   Pad code opens Flight Log ARG hub; Imperial Clearance opens the rest.
   ========================================================================== */

const LOCKED_UNTIL_IMPERIAL =
  CLEARANCE?.lockedUntilImperial ??
  CLEARANCE?.lockedUntilDeep ?? [
    "archives",
    "cartography",
    "auxiliary",
  ];

export function isPanelLocked(panelId) {
  if (!LOCKED_UNTIL_IMPERIAL.includes(panelId)) return false;
  return !hasImperialClearance();
}

export function sealMarkup() {
  const title = CLEARANCE?.seal?.title ?? "PARTITION LOCKED";
  const body =
    CLEARANCE?.seal?.body ??
    "Imperial Clearance required. Repair Flight Log partitions — or return to the guide.";
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

    if (locked) {
      body.classList.add("is-sealed");
      if (!seal) {
        body.insertAdjacentHTML("afterbegin", sealMarkup());
      }
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
