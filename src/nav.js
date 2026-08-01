/**
 * LATTICE.OS — Navigation, chrono, diagnostics
 */

import { audio } from "./audio.js";
import {
  CHANNEL_TITLES,
  hasImperialClearance,
  refreshGuestCorruptDisplay,
} from "./clearance.js";
import { MUSIC } from "../content/boot-content.js";
import {
  areAllPlanetDossiersUnlocked,
  areAllFragmentsRecovered,
} from "./progress.js";
import { typeText, revealPanel, corruptChromeLabel, descrambleText } from "./motion.js";

/* ==========================================================================
   NAVIGATION — channel switching + typed banner title
   ========================================================================== */

/** Cancels an in-flight banner typewriter when a new channel is selected */
let bannerTypeAbort = { skipped: true };

/** Blocks channel switches (e.g. during Imperial bind sequence). */
let navInteractionLocked = false;

const CHROME_CLEAR = {
  terminal: {
    label: "TERMINAL",
    title: "FTHFLL // KERNEL INTERFACE",
  },
  overview: {
    label: "STATUS",
    title: "HULL TELEMETRY // CRAFT FUNCTIONALITY",
  },
  flightlog: {
    label: "FLIGHT LOG",
    title: "INTERNAL DATABASE // PERSONAL RECORD",
  },
  imperial: {
    label: "IMPERIAL CLEARANCE",
    title: "EMERGENCY OVERRIDE // RECOVERY AUTHORIZATION",
  },
  archives: {
    label: "ARCHIVES",
    title: "ARCHIVES // SHIP MEMORY",
  },
  cartography: {
    label: "SYSTEM MAP",
    title: "CARTOGRAPHY // STELLAR CHART",
  },
  diagnostics: {
    label: "DIAGNOSTICS",
    title: "FIDELITY BUS // SIGNAL DIAGNOSTICS",
  },
  "guest-campaign-1": {
    label: "CAMPAIGN 1",
    title: "EXTERNAL // CAMPAIGN 1",
  },
};

function ensureClearChrome(btn, panelId) {
  const known = CHROME_CLEAR[panelId];
  if (!btn.dataset.clearLabel) {
    const raw = (btn.textContent || known?.label || "").replace(/\s+/g, " ").trim();
    btn.dataset.clearLabel = known?.label || raw;
  }
  if (!btn.dataset.clearTitle) {
    btn.dataset.clearTitle =
      known?.title || btn.dataset.channelTitle || CHANNEL_TITLES[panelId] || "";
  }
}

function setNavButtonLabel(btn, label) {
  btn.textContent = label;
}

export function refreshChannelCorruption() {
  const chartCorrupt = !areAllPlanetDossiersUnlocked();
  const flogCorrupt = !areAllFragmentsRecovered();

  document.querySelectorAll(".nav-item[data-panel]").forEach((btn) => {
    const panelId = btn.dataset.panel;
    if (!panelId || panelId === "guest-corrupt") return;

    ensureClearChrome(btn, panelId);
    const locked = btn.classList.contains("is-locked");
    const special =
      (panelId === "cartography" && chartCorrupt) ||
      (panelId === "flightlog" && flogCorrupt);
    const corrupt = locked || special;
    const seed = panelId.length + 4;
    const clearLabel = btn.dataset.clearLabel;
    const clearTitle = btn.dataset.clearTitle;

    if (corrupt) {
      if (btn.classList.contains("is-descrambling")) return;
      setNavButtonLabel(btn, corruptChromeLabel(clearLabel, seed));
      btn.dataset.channelTitle = corruptChromeLabel(clearTitle, seed + 2);
      btn.classList.add("is-chrome-corrupt");
      btn.dataset.chromeCorrupt = "1";
    } else if (btn.dataset.chromeCorrupt === "1") {
      btn.dataset.chromeCorrupt = "0";
      btn.classList.remove("is-chrome-corrupt");
      btn.dataset.channelTitle = clearTitle;
      void descrambleText(btn, clearLabel);
    } else {
      setNavButtonLabel(btn, clearLabel);
      btn.dataset.channelTitle = clearTitle;
      btn.classList.remove("is-chrome-corrupt");
    }
  });

  document.querySelectorAll(".nav-group--guest .nav-item--toggle").forEach((btn) => {
    if (!btn.dataset.clearLabel) btn.dataset.clearLabel = "GUEST CHANNEL";
    const locked = btn.classList.contains("is-locked");
    const clear = btn.dataset.clearLabel;
    const paintCaret = (label) => {
      btn.replaceChildren();
      btn.append(document.createTextNode(`${label} `));
      const caret = document.createElement("span");
      caret.className = "nav-item__caret";
      caret.setAttribute("aria-hidden", "true");
      caret.textContent = "▼";
      btn.appendChild(caret);
    };
    if (locked) {
      btn.classList.add("is-chrome-corrupt");
      btn.dataset.chromeCorrupt = "1";
      paintCaret(corruptChromeLabel(clear, 11));
    } else if (btn.dataset.chromeCorrupt === "1") {
      btn.dataset.chromeCorrupt = "0";
      btn.classList.remove("is-chrome-corrupt");
      btn.textContent = corruptChromeLabel(clear, 11);
      void descrambleText(btn, clear).then(() => paintCaret(clear));
    } else {
      btn.classList.remove("is-chrome-corrupt");
      paintCaret(clear);
    }
  });

  const banner = document.getElementById("channel-banner");
  const active = document.querySelector(".nav-item[data-panel].is-active");
  if (
    banner &&
    active?.classList.contains("is-chrome-corrupt") &&
    active.dataset.channelTitle
  ) {
    banner.textContent = active.dataset.channelTitle;
  }
}

export function setNavInteractionLocked(locked) {
  navInteractionLocked = Boolean(locked);
  document.body.classList.toggle("is-nav-locked", navInteractionLocked);
}

export function isNavInteractionLocked() {
  return navInteractionLocked;
}

export async function typeChannelBanner(panelId, titleOverride) {
  const banner = document.getElementById("channel-banner");
  if (!banner) return;

  const title = titleOverride || CHANNEL_TITLES[panelId] || "";
  bannerTypeAbort.skipped = true;
  const skippedRef = { skipped: false };
  bannerTypeAbort = skippedRef;

  banner.textContent = "";
  await typeText(banner, title, skippedRef);
}

export function initNav() {
  const rail = document.querySelector(".nav-rail");
  const panels = document.querySelectorAll(".panel");
  if (!rail) return;

  let revealing = false;
  refreshChannelCorruption();
  window.addEventListener("lattice:dossier", refreshChannelCorruption);
  window.addEventListener("lattice:fragments", refreshChannelCorruption);
  window.addEventListener("lattice:clearance", refreshChannelCorruption);

  rail.addEventListener("click", async (e) => {
    const toggle = e.target.closest(".nav-item--toggle");
    if (toggle && rail.contains(toggle)) {
      if (revealing) return;
      if (navInteractionLocked) {
        audio.play("deny");
        return;
      }
      if (toggle.classList.contains("is-locked")) {
        audio.play("deny");
        return;
      }
      const group = toggle.closest(".nav-group");
      const sub = group?.querySelector(".nav-group__sub");
      const open = !group?.classList.contains("is-open");
      group?.classList.toggle("is-open", open);
      if (sub) sub.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      audio.play(toggle.dataset.sfx || "click");
      return;
    }

    const btn = e.target.closest(".nav-item[data-panel]");
    if (!btn || !rail.contains(btn)) return;
    if (revealing) return;
    if (navInteractionLocked) {
      // Stay on current channel while a critical sequence (Imperial bind) runs
      if (!btn.classList.contains("is-active")) audio.play("deny");
      return;
    }
    if (btn.classList.contains("is-locked")) {
      audio.play("deny");
      return;
    }

    const id = btn.dataset.panel;
    if (!id) return;

    const group = btn.closest(".nav-group");
    if (group) {
      group.classList.add("is-open");
      const sub = group.querySelector(".nav-group__sub");
      if (sub) sub.hidden = false;
      const parentToggle = group.querySelector(".nav-item--toggle");
      parentToggle?.setAttribute("aria-expanded", "true");
    }

    rail.querySelectorAll(".nav-item[data-panel]").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });

    let shown = null;
    panels.forEach((panel) => {
      const match = panel.dataset.panel === id;
      panel.hidden = !match;
      panel.classList.toggle("is-active", match);
      if (match) shown = panel;
    });

    audio.play("channelSwitch");

    if (id === "guest-corrupt") refreshGuestCorruptDisplay();

    window.dispatchEvent(
      new CustomEvent("lattice:channel", { detail: { panel: id } })
    );

    revealing = true;
    try {
      await typeChannelBanner(id, btn.dataset.channelTitle);
      if (shown) await revealPanel(shown);
    } finally {
      revealing = false;
    }
  });
}

/* ==========================================================================
   CHRONO — re-exported from chrono.js for older imports
   ========================================================================== */


/* ==========================================================================
   DIAGNOSTICS / AUDIO UI
   ========================================================================== */

export function updateAudioToggle(on) {
  const btn = document.getElementById("audio-toggle");
  if (!btn) return;
  const label = btn.querySelector(".sys-toggle__label");
  btn.classList.toggle("is-on", on);
  if (label) label.textContent = on ? "AUDIO: ON" : "AUDIO: OFF";
}

export function updateMotionToggle(reduced) {
  const btn = document.getElementById("reduce-motion");
  if (!btn) return;
  const label = btn.querySelector(".sys-toggle__label");
  /* Filled when motion is ON (not reduced); hollow when OFF */
  btn.classList.toggle("is-on", !reduced);
  if (label) label.textContent = reduced ? "MOTION: OFF" : "MOTION: ON";
  document.body.classList.toggle("reduce-motion", reduced);
}

export function setFillBarValue(bar, value) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const fill = bar.querySelector(".fill-bar__fill");
  if (fill) fill.style.width = `${v}%`;
  bar.setAttribute("aria-valuenow", String(v));
  bar.dataset.value = String(v);
  return v;
}

export function readFillBarValue(bar) {
  return Number(bar.dataset.value ?? bar.getAttribute("aria-valuenow") ?? 0);
}

export function valueFromPointer(bar, clientX) {
  const rect = bar.getBoundingClientRect();
  if (rect.width <= 0) return 0;
  return ((clientX - rect.left) / rect.width) * 100;
}

export function bindFillBar(bar, onChange) {
  if (!bar || bar.classList.contains("is-disabled")) return;

  const apply = (clientX) => {
    const v = setFillBarValue(bar, valueFromPointer(bar, clientX));
    onChange(v);
  };

  bar.addEventListener("pointerdown", (e) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    bar.setPointerCapture(e.pointerId);
    apply(e.clientX);
  });

  bar.addEventListener("pointermove", (e) => {
    if (!bar.hasPointerCapture(e.pointerId)) return;
    apply(e.clientX);
  });

  bar.addEventListener("keydown", (e) => {
    let next = readFillBarValue(bar);
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next -= 5;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") next += 5;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 100;
    else return;
    e.preventDefault();
    const v = setFillBarValue(bar, next);
    onChange(v);
  });
}

export function syncMusicTrackPicker() {
  const row = document.getElementById("music-track-row");
  const select = document.getElementById("music-track");
  if (!row || !select) return;

  const unlocked = hasImperialClearance();
  row.hidden = !unlocked;
  if (!unlocked) return;

  const tracks = audio.getMusicTracks?.() ?? MUSIC?.tracks ?? [];
  if (select.options.length !== tracks.length) {
    select.replaceChildren();
    for (const t of tracks) {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.title;
      select.appendChild(opt);
    }
  }

  const active =
    audio.getActiveTrackId?.() ||
    MUSIC?.postImperialDefault ||
    "ascendancy";
  if ([...select.options].some((o) => o.value === active)) {
    select.value = active;
  }
}

export function initSystems() {
  const form = document.getElementById("systems-form");
  const audioBtn = document.getElementById("audio-toggle");
  const motionBtn = document.getElementById("reduce-motion");
  const sfxGain = document.getElementById("sfx-gain");
  const ambienceGain = document.getElementById("ambience-gain");
  const musicGain = document.getElementById("music-gain");
  const musicTrack = document.getElementById("music-track");
  const scan = document.getElementById("scan-intensity");

  form?.addEventListener("submit", (e) => e.preventDefault());
  audioBtn.addEventListener("click", async () => {
    if (audio.enabled) {
      audio.disable();
      updateAudioToggle(false);
    } else {
      await audio.enable();
      updateAudioToggle(true);
      audio.play("click");
    }
  });

  motionBtn.addEventListener("click", () => {
    updateMotionToggle(!document.body.classList.contains("reduce-motion"));
  });

  bindFillBar(ambienceGain, (v) => {
    audio.setAmbienceGain(v / 100);
  });
  audio.setAmbienceGain(readFillBarValue(ambienceGain) / 100);

  bindFillBar(sfxGain, (v) => {
    audio.setSfxGain(v / 100);
  });
  audio.setSfxGain(readFillBarValue(sfxGain) / 100);

  bindFillBar(musicGain, (v) => {
    audio.setMusicGain(v / 100);
  });
  audio.setMusicGain(readFillBarValue(musicGain) / 100);

  musicTrack?.addEventListener("change", async () => {
    const id = musicTrack.value;
    if (!id) return;
    audio.play("dropdownToggle");
    try {
      if (!audio.enabled) await audio.enable();
      await audio.setMusicTrack(id);
      syncMusicTrackPicker();
    } catch {
      /* ignore */
    }
  });
  syncMusicTrackPicker();
  window.addEventListener("lattice:clearance", syncMusicTrackPicker);

  bindFillBar(scan, (v) => {
    document.documentElement.style.setProperty(
      "--scan-opacity",
      String(0.1 + (v / 100) * 0.28)
    );
  });
  {
    const v = readFillBarValue(scan) / 100;
    document.documentElement.style.setProperty("--scan-opacity", String(0.1 + v * 0.28));
  }

  document.body.addEventListener("click", (e) => {
    const target = e.target.closest("[data-sfx]");
    if (!target || target.classList.contains("nav-item")) return;
    if (target.id === "audio-toggle" || target.id === "reduce-motion") return;
    if (target.classList.contains("imago-mark")) return;
    audio.play(target.dataset.sfx || "click");
  });
}
