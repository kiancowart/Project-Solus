/**
 * Imperial Clearance — 9-slot assembler + purge
 */

import { IMPERIAL_SLOTS } from "../content/arg-path.js";
import { wipeLatticeProgress } from "./cold-start.js";
import { playBootLogo } from "./boot.js";
import { audio } from "./audio.js";
import { sleep, bootMs } from "./motion.js";
import {
  grantImperialClearance,
  hasImperialClearance,
} from "./milestones.js";
import { applyClearanceUI } from "./clearance.js";
import {
  getClearanceDraft,
  setClearanceDraft,
  getRecoveredFragments,
} from "./progress.js";

const INTERCEPT_HREF = "intercept.html";
const BLACKOUT_MS = 900;
const SEAL_HOLDS_MS = 1500;

function normFrag(s) {
  return String(s ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function initImperialClearance() {
  const root = document.getElementById("imperial-gate");
  const grid = document.getElementById("imperial-grid");
  const tray = document.getElementById("imperial-tray");
  const submit = document.getElementById("imperial-submit");
  const status = document.getElementById("imperial-assemble-status");
  const assemble = document.getElementById("imperial-assemble");
  const btn = document.getElementById("imperial-purge-btn");
  const menu = document.getElementById("imperial-confirm");
  const input = document.getElementById("imperial-confirm-input");
  if (!root || !grid) return;

  let busy = false;
  let sealHoldsTimer = 0;
  const slotState = {};

  const clearSealHolds = () => {
    if (sealHoldsTimer) {
      window.clearTimeout(sealHoldsTimer);
      sealHoldsTimer = 0;
    }
    if (status) status.textContent = "";
  };

  const flashSealHolds = () => {
    if (!status) return;
    if (sealHoldsTimer) window.clearTimeout(sealHoldsTimer);
    status.textContent = "SEAL HOLDS";
    sealHoldsTimer = window.setTimeout(() => {
      sealHoldsTimer = 0;
      if (status.textContent === "SEAL HOLDS") status.textContent = "";
    }, SEAL_HOLDS_MS);
  };

  const draft = getClearanceDraft();
  for (const slot of IMPERIAL_SLOTS) {
    const saved = draft.slots?.[slot.slot] ?? {};
    slotState[slot.slot] = {
      planetId: saved.planetId ?? "",
      fragment: saved.fragment ?? "",
    };
  }

  const persistDraft = () => {
    setClearanceDraft({ slots: { ...slotState } });
  };

  const syncGrantedUI = () => {
    const granted = hasImperialClearance();
    root.classList.toggle("is-granted", granted);
    if (assemble) assemble.hidden = granted;
  };

  const renderTray = () => {
    if (!tray) return;
    tray.replaceChildren();
    const frags = getRecoveredFragments();
    const known = IMPERIAL_SLOTS.filter((s) => frags.has(s.fragment));
    if (!known.length) {
      const empty = document.createElement("p");
      empty.className = "imperial-tray__empty";
      empty.textContent = "TRAY EMPTY";
      tray.appendChild(empty);
      return;
    }
    for (const s of known) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "imperial-frag";
      chip.textContent = s.fragment;
      chip.title = s.planetName;
      chip.draggable = true;
      chip.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", s.fragment);
        e.dataTransfer.effectAllowed = "copy";
      });
      chip.addEventListener("click", () => {
        audio.play("click");
        // Fill first empty fragment field
        for (const slot of IMPERIAL_SLOTS) {
          const st = slotState[slot.slot];
          if (!st.fragment) {
            st.fragment = s.fragment;
            persistDraft();
            renderGrid();
            return;
          }
        }
      });
      tray.appendChild(chip);
    }
  };

  const renderGrid = () => {
    grid.replaceChildren();
    for (const slot of IMPERIAL_SLOTS) {
      const st = slotState[slot.slot];
      const well = document.createElement("div");
      well.className = "imperial-well";
      well.dataset.slot = String(slot.slot);

      const idx = document.createElement("span");
      idx.className = "imperial-well__idx";
      idx.textContent = String(slot.slot).padStart(2, "0");

      const planet = document.createElement("select");
      planet.className = "imperial-well__planet";
      planet.setAttribute("aria-label", `Slot ${slot.slot} planet`);
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "▽";
      planet.appendChild(blank);
      for (const s of IMPERIAL_SLOTS) {
        const opt = document.createElement("option");
        opt.value = s.planetId;
        opt.textContent = s.planetName;
        planet.appendChild(opt);
      }
      planet.value = st.planetId || "";
      planet.addEventListener("change", () => {
        st.planetId = planet.value;
        persistDraft();
        audio.play("click");
      });

      const frag = document.createElement("input");
      frag.className = "imperial-well__frag";
      frag.type = "text";
      frag.autocomplete = "off";
      frag.spellcheck = false;
      frag.placeholder = "····";
      frag.setAttribute("aria-label", `Slot ${slot.slot} fragment`);
      frag.value = st.fragment || "";
      frag.addEventListener("input", () => {
        st.fragment = frag.value;
        persistDraft();
      });
      frag.addEventListener("dragover", (e) => e.preventDefault());
      frag.addEventListener("drop", (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        if (!data) return;
        frag.value = data;
        st.fragment = data;
        persistDraft();
        audio.play("click");
      });

      well.appendChild(idx);
      well.appendChild(planet);
      well.appendChild(frag);
      grid.appendChild(well);
    }
  };

  const tryBind = () => {
    if (hasImperialClearance()) return;
    clearSealHolds();

    let ok = true;
    for (const slot of IMPERIAL_SLOTS) {
      const st = slotState[slot.slot];
      if (st.planetId !== slot.planetId) ok = false;
      if (normFrag(st.fragment) !== normFrag(slot.fragment)) ok = false;
    }

    if (!ok) {
      flashSealHolds();
      audio.play("click");
      return;
    }

    grantImperialClearance();
    audio.play("imperial");
    clearSealHolds();
    syncGrantedUI();
    applyClearanceUI();
  };

  submit?.addEventListener("click", tryBind);

  renderGrid();
  renderTray();
  syncGrantedUI();

  // Re-render tray when panel might gain fragments
  root.addEventListener("imperial:fragments", () => {
    renderTray();
  });
  window.addEventListener("lattice:fragments", () => {
    renderTray();
  });
  window.addEventListener("focus", () => {
    renderTray();
    syncGrantedUI();
  });

  /* ---- RESET — always available; wipes ARG and returns to tuner ---- */
  if (!btn || !menu || !input) return;

  const closeMenu = () => {
    menu.hidden = true;
    btn.hidden = false;
    input.value = "";
    btn.focus();
  };

  const openMenu = () => {
    btn.hidden = true;
    menu.hidden = false;
    input.value = "";
    input.focus();
  };

  const runResetExit = async () => {
    busy = true;
    audio.play("select");
    menu.hidden = true;
    btn.hidden = true;

    wipeLatticeProgress();
    audio.stopSoundtrack();

    const hub = document.getElementById("hub");
    const boot = document.getElementById("boot");
    const log = document.getElementById("boot-log");
    const gate = document.getElementById("boot-gate");
    const skip = document.getElementById("boot-skip");
    const logo = document.getElementById("boot-logo");

    if (hub) hub.hidden = true;
    if (boot) boot.hidden = false;
    if (gate) gate.hidden = true;
    if (skip) skip.hidden = true;
    if (log) {
      log.innerHTML = "";
      log.classList.remove("is-dimmed");
    }
    if (logo) {
      logo.hidden = true;
      logo.classList.remove("is-visible", "is-loading", "is-dismissed");
      logo.style.opacity = "";
    }

    document.body.classList.remove(
      "has-deep-clearance",
      "has-imperial-clearance"
    );

    await playBootLogo();
    await sleep(bootMs(BLACKOUT_MS));
    window.location.href = INTERCEPT_HREF;
  };

  btn.addEventListener("click", () => {
    if (busy || !menu.hidden) return;
    openMenu();
  });

  input.addEventListener("keydown", (e) => {
    if (menu.hidden || busy) return;
    if (e.key === "Escape") {
      e.preventDefault();
      audio.play("select");
      closeMenu();
      return;
    }
    if (e.key !== "Enter") return;
    e.preventDefault();
    const answer = input.value.trim().toLowerCase();
    if (answer === "y" || answer === "yes") {
      void runResetExit();
      return;
    }
    if (answer === "n" || answer === "no") {
      audio.play("select");
      closeMenu();
      return;
    }
    input.value = "";
  });
}

export function refreshImperialTray() {
  window.dispatchEvent(new CustomEvent("lattice:fragments"));
}
