/**
 * Imperial Clearance — triad seal assembler + purge
 */

import { IMPERIAL_SLOTS } from "../content/arg-path.js";
import { wipeLatticeProgress } from "./cold-start.js";
import { playBootLogo } from "./boot.js";
import { audio } from "./audio.js";
import { sleep, bootMs, prefersReducedMotion } from "./motion.js";
import {
  grantImperialClearance,
  hasImperialClearance,
} from "./milestones.js";
import {
  applyClearanceUI,
  syncImperialGateVisual,
} from "./clearance.js";
import {
  getClearanceDraft,
  setClearanceDraft,
  getRecoveredFragments,
  unlockChannelsForImperialBind,
} from "./progress.js";
import { initHullPlan } from "./hull.js";
import { initFlightLog } from "./flight-log.js";

const INTERCEPT_HREF = "intercept.html";
const BLACKOUT_MS = 900;
const CORNER_ORDER = ["tl", "tr", "bb"];
const SIDES_OUT_MS = 2000;
const BANQUET_SCAN_MS = 1500;
const RESET_SCAN_MS = 900;

function normFrag(s) {
  return String(s ?? "")
    .trim()
    .toUpperCase()
    .replace(/[▽▼\s]+/g, "");
}

function slotByIndex(n) {
  return IMPERIAL_SLOTS.find((s) => s.slot === n);
}

/**
 * Same unlocks as a successful 9-slot Imperial bind:
 * clearance flag + Chart/Flight Log channels + STATUS hull progress.
 * Used by the assembler and the pad "111" dev cheat.
 */
export function completeImperialBind({ playStinger = true } = {}) {
  grantImperialClearance();
  unlockChannelsForImperialBind();
  if (playStinger) audio.play("imperial");
  applyClearanceUI();
  initHullPlan.applyHullUI?.();
  initFlightLog.refreshAccess?.();
}

export function initImperialClearance() {
  const root = document.getElementById("imperial-gate");
  const triad = document.getElementById("imperial-triad");
  const tray = document.getElementById("imperial-tray");
  const submit = document.getElementById("imperial-submit");
  const autofillBtn = document.getElementById("imperial-autofill");
  const assemble = document.getElementById("imperial-assemble");
  const btn = document.getElementById("imperial-purge-btn");
  const menu = document.getElementById("imperial-confirm");
  const input = document.getElementById("imperial-confirm-input");
  if (!root || !triad) return;

  let busy = false;
  const slotState = {};

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
    if (assemble) assemble.hidden = false;
    applyClearanceUI();
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
        for (const slot of IMPERIAL_SLOTS) {
          const st = slotState[slot.slot];
          if (!st.fragment) {
            st.fragment = s.fragment;
            persistDraft();
            renderTriad();
            return;
          }
        }
      });
      tray.appendChild(chip);
    }
  };

  const buildWell = (slotNum, corner) => {
    const slot = slotByIndex(slotNum);
    const st = slotState[slotNum];
    const well = document.createElement("div");
    well.className = "imperial-well";
    well.dataset.slot = String(slotNum);
    well.dataset.corner = corner;

    const body = document.createElement("div");
    body.className = "imperial-well__body";

    const idx = document.createElement("span");
    idx.className = "imperial-well__idx";
    idx.textContent = String(slotNum).padStart(2, "0");

    const planet = document.createElement("select");
    planet.className = "imperial-well__planet";
    planet.setAttribute("aria-label", `Slot ${slotNum} planet`);
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
      audio.play("dropdownToggle");
    });

    const frag = document.createElement("input");
    frag.className = "imperial-well__frag";
    frag.type = "text";
    frag.autocomplete = "off";
    frag.spellcheck = false;
    frag.placeholder = "····";
    frag.setAttribute("aria-label", `Slot ${slotNum} fragment`);
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

    body.append(idx, planet, frag);
    well.appendChild(body);

    body.addEventListener("animationend", (e) => {
      if (e.animationName === "imperial-deny-glitch") {
        well.classList.remove("is-deny-shake");
      }
    });

    if (slot) well.title = slot.planetName;
    return well;
  };

  const renderTriad = () => {
    for (const host of triad.querySelectorAll(".imperial-tri__corners")) {
      host.replaceChildren();
      const nums = String(host.dataset.slots || "")
        .split(",")
        .map((n) => Number(n.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      nums.forEach((slotNum, i) => {
        host.appendChild(buildWell(slotNum, CORNER_ORDER[i] || "bb"));
      });
    }
  };

  /** Slow stop-start loading-bar fill with warped button ticks. */
  const playGlitchMidFill = async () => {
    const fillEl = root.querySelector(".imperial-tri__glyph--fill");
    root.classList.add("is-mid-filling");

    const chunks = [
      0.05, 0.04, 0.07, 0.03, 0.09, 0.05, 0.06, 0.04, 0.08, 0.03, 0.1, 0.05,
      0.07, 0.04, 0.06, 0.08, 0.03, 0.05,
    ];
    let progress = 0;

    for (const chunk of chunks) {
      progress = Math.min(1, progress + chunk);
      if (fillEl) {
        const remain = Math.max(0, (1 - progress) * 100);
        fillEl.style.clipPath = `inset(0 0 ${remain.toFixed(2)}% 0)`;
      }
      audio.play("glitchClick");
      await sleep(90 + Math.floor(Math.random() * 110));
      if (progress < 1 && Math.random() < 0.7) {
        await sleep(280 + Math.floor(Math.random() * 320));
      }
    }

    if (fillEl) fillEl.style.clipPath = "";
    root.classList.remove("is-mid-filling");
    root.classList.add("is-mid-filled");
  };

  const playRevealScan = async (durationMs, gainScale = 3.6) => {
    if (!audio.enabled) {
      try {
        await audio.enable();
      } catch {
        /* ignore */
      }
    }
    audio.play("revealScan", { durationMs, gainScale });
  };

  const playBindSequence = async () => {
    busy = true;
    if (submit) submit.disabled = true;
    audio.play("imperial");

    if (prefersReducedMotion()) {
      syncImperialGateVisual(true);
      completeImperialBind({ playStinger: false });
      busy = false;
      return;
    }

    // 1) Chrome hide; seals glitch out
    root.classList.add("is-binding");
    await sleep(900);
    await sleep(450);

    // 2) Left + right hitch onto mid
    void playRevealScan(SIDES_OUT_MS, 3.6);
    root.classList.add("is-sides-out");
    await sleep(SIDES_OUT_MS + 80);
    await sleep(1100);

    // Brief mid glitch, then fill
    root.classList.add("is-mid-glitch");
    audio.play("glitchClick");
    await sleep(180);
    audio.play("glitchClick");
    await sleep(400);
    root.classList.remove("is-mid-glitch");

    await playGlitchMidFill();
    await sleep(900);

    // 3) Banquet scan
    void playRevealScan(BANQUET_SCAN_MS, 4.0);
    root.classList.add("is-banquet-in");
    await sleep(BANQUET_SCAN_MS + 80);

    root.classList.add("is-seal-bound");

    // 4) RESET scans back in, then grant
    root.classList.add("is-reset-in");
    await sleep(RESET_SCAN_MS);
    root.classList.add("is-reset-ready");

    completeImperialBind({ playStinger: false });
    busy = false;
  };

  const shakeWrongSeals = (slotNums) => {
    for (const slotNum of slotNums) {
      const well = triad.querySelector(`.imperial-well[data-slot="${slotNum}"]`);
      if (!well) continue;
      well.classList.remove("is-deny-shake");
      void well.offsetWidth;
      well.classList.add("is-deny-shake");
    }
  };

  const tryBind = () => {
    if (hasImperialClearance() || busy) return;

    const wrong = [];
    for (const slot of IMPERIAL_SLOTS) {
      const st = slotState[slot.slot];
      if (
        st.planetId !== slot.planetId ||
        normFrag(st.fragment) !== normFrag(slot.fragment)
      ) {
        wrong.push(slot.slot);
      }
    }

    if (wrong.length) {
      audio.play("deny");
      shakeWrongSeals(wrong);
      return;
    }

    void playBindSequence();
  };

  const autofillSeals = () => {
    if (hasImperialClearance() || busy) return;
    for (const slot of IMPERIAL_SLOTS) {
      slotState[slot.slot] = {
        planetId: slot.planetId,
        fragment: slot.fragment,
      };
    }
    persistDraft();
    renderTriad();
    audio.play("click");
  };

  submit?.addEventListener("click", tryBind);
  autofillBtn?.addEventListener("click", autofillSeals);

  renderTriad();
  renderTray();
  syncGrantedUI();

  window.addEventListener("lattice:fragments", renderTray);
  window.addEventListener("focus", () => {
    renderTray();
    syncGrantedUI();
  });

  /* ---- RESET — wipe ARG and return to tuner ---- */
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

    await playBootLogo({ variant: "reset" });
    await sleep(bootMs(BLACKOUT_MS));
    if (audio.enabled) audio.markAmbienceLive();
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
