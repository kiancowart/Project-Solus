/**
 * LATTICE.OS — Boot sequence & clearance gate
 */

import {
  BOOT_LINES,
  BOOT_LOGO,
  ACCESS_CODE,
  ACCESS_SUCCESS,
  GATE_EASTER_EGGS,
  GATE_NICE_TRY_CODES,
  GATE_NICE_TRY_TEXT,
  MUSIC,
} from "../content/boot-content.js";
import { audio } from "./audio.js";
import {
  sleep,
  bootPace,
  bootMs,
  prefersReducedMotion,
  typeText,
  blinkBootDots,
  revealPanel,
} from "./motion.js";
import {
  applyClearanceUI,
  grantImperialClearance,
  hasImperialClearance,
} from "./clearance.js";
import { unlockChannelsForImperialBind } from "./progress.js";
import { initHullPlan } from "./hull.js";
import { initFlightLog } from "./flight-log.js";
import { setWhisperPadVisible, whisperPadControl } from "./whisper.js";
import { typeChannelBanner, updateAudioToggle } from "./nav.js";
import { startChrono } from "./chrono.js";
import { wipeLatticeProgress } from "./progress.js";

/* ==========================================================================
   BOOT SEQUENCE — clearance keypad → log → logo → hub
   ========================================================================== */

export function prepareBootLogo() {
  const stage = document.getElementById("boot-logo");
  const img = document.getElementById("boot-logo-img");
  const placeholder = document.getElementById("boot-logo-placeholder");

  if (!BOOT_LOGO.enabled) {
    stage.hidden = true;
    return stage;
  }

  stage.hidden = false;
  stage.classList.remove("is-visible");
  img.alt = BOOT_LOGO.alt || img.alt;

  if (BOOT_LOGO.src) {
    img.src = BOOT_LOGO.src;
    img.hidden = false;
    placeholder.hidden = true;
  } else {
    img.removeAttribute("src");
    img.hidden = true;
    placeholder.hidden = false;
  }

  return stage;
}

export async function playBootLogo({ variant = "boot" } = {}) {
  if (!BOOT_LOGO.enabled) return;

  const log = document.getElementById("boot-log");
  log.classList.add("is-dimmed");

  const stage = prepareBootLogo();
  void stage.offsetWidth;

  const loadMs = bootMs(BOOT_LOGO.loadMs ?? 1200);
  const holdMs = bootMs(BOOT_LOGO.holdMs ?? 1400);
  const steps = Math.max(1, BOOT_LOGO.loadSteps ?? 5);
  const stepMs = loadMs / steps;
  const onScreenMs = prefersReducedMotion() ? holdMs : loadMs + holdMs;

  const sting = variant === "reset" ? "imagoReset" : "imagoBoot";
  audio.play(sting, { durationMs: onScreenMs });

  // Stiff stepped load-in (not a smooth fade)
  stage.style.opacity = "0";
  stage.classList.add("is-loading");

  if (prefersReducedMotion()) {
    stage.style.opacity = "";
    stage.classList.remove("is-loading");
    stage.classList.add("is-visible");
  } else {
    for (let i = 1; i <= steps; i++) {
      stage.style.opacity = String(i / steps);
      await sleep(stepMs);
    }
    stage.style.opacity = "";
    stage.classList.remove("is-loading");
    stage.classList.add("is-visible");
  }

  await sleep(holdMs);

  stage.classList.remove("is-visible");
  stage.style.opacity = "";
  stage.hidden = true;
  log.classList.remove("is-dimmed");
}

export function formatGateDisplay(value, maxLen) {
  const chars = value.split("");
  while (chars.length < maxLen) chars.push("_");
  return chars.join(" ");
}

export function runClearanceGate(skippedRef) {
  return new Promise((resolve) => {
    const gate = document.getElementById("boot-gate");
    const display = document.getElementById("gate-display");
    const status = document.getElementById("gate-status");
    const cascade = document.getElementById("gate-cascade");
    const flash = document.getElementById("gate-flash");
    const pad = gate?.querySelector(".gate__pad");
    const eyes = document.getElementById("gate-eyes");
    const skipBtn = document.getElementById("boot-skip");
    if (!gate || !display || !status || !cascade || !flash || !pad || !skipBtn) {
      console.error("[lattice] clearance gate DOM missing");
      resolve();
      return;
    }
    const maxLen = ACCESS_CODE.length;

    let buffer = "";
    let locked = false;

    skipBtn.hidden = true;
    gate.hidden = false;
    gate.classList.remove("is-unlocked", "is-staring");
    setWhisperPadVisible(true);
    status.textContent = "";
    status.className = "gate__status";
    cascade.hidden = true;
    cascade.innerHTML = "";
    if (eyes) eyes.hidden = true;
    display.hidden = false;
    pad.hidden = false;
    display.textContent = formatGateDisplay("", maxLen);
    pad.querySelectorAll(".gate__key").forEach((k) => {
      k.disabled = false;
    });

    // Paint pad immediately — stepped reveal previously left it visibility:hidden
    const gateRoot = gate.querySelector(".gate");
    gateRoot?.querySelectorAll(":scope > *").forEach((el) => {
      if (el.hidden || el.hasAttribute("hidden")) return;
      el.classList.remove("is-pending");
      el.classList.add("is-shown");
    });

    const interceptLink = gate.querySelector('.lattice-route[data-route="tuner"]');
    const hubBtn = document.getElementById("gate-hub");
    if (hubBtn) hubBtn.hidden = !hasImperialClearance();

    interceptLink?.addEventListener("click", () => {
      // Carry ambient bed across full-page jump back to the tuner
      if (audio.enabled) audio.markAmbienceLive();
    });

    const render = () => {
      display.textContent = formatGateDisplay(buffer, maxLen);
    };

    const cleanupAndResolve = () => {
      setWhisperPadVisible(false);
      gate.hidden = true;
      gate.classList.remove("is-unlocked");
      flash.classList.remove("is-fire");
      gate.removeEventListener("click", onPadClick);
      window.removeEventListener("keydown", onKeydown);
      resolve();
    };

    const enterHubFromPad = async () => {
      if (!hasImperialClearance() || gate.classList.contains("is-unlocked")) return;
      locked = true;
      audio.exitDeadSilence();
      try {
        if (!audio.enabled) await audio.enable();
        updateAudioToggle(true);
        await audio.startSoundtrack(
          MUSIC?.postImperialDefault ?? "ascendancy"
        );
      } catch {
        /* ignore */
      }
      audio.play("select");
      if (skippedRef) skippedRef.skipped = true;
      cleanupAndResolve();
    };

    hubBtn?.addEventListener("click", () => {
      void enterHubFromPad();
    });

    const fail = (message = "DENIED") => {
      locked = true;
      status.textContent = message;
      status.className = "gate__status gate__status--deny";
      gate.classList.add("is-denied");
      audio.play("deny");
      whisperPadControl.onDenied();
      setTimeout(() => {
        buffer = "";
        render();
        status.textContent = "";
        status.className = "gate__status";
        gate.classList.remove("is-denied");
        locked = false;
      }, 700);
    };

    const stare = () => {
      setWhisperPadVisible(false);
      locked = true;
      pad.querySelectorAll(".gate__key").forEach((k) => {
        k.disabled = true;
      });
      display.hidden = true;
      status.textContent = "";
      status.className = "gate__status";
      cascade.hidden = true;
      pad.hidden = true;
      skipBtn.hidden = true;
      gate.classList.add("is-staring");
      if (eyes) {
        eyes.hidden = false;
        eyes.setAttribute("aria-hidden", "false");
      }
      // No ambience, no SFX on the no-mask stare — caption returns to pad
      audio.enterDeadSilence();
      gate.removeEventListener("click", onPadClick);
      window.removeEventListener("keydown", onKeydown);
    };

    const unstare = async () => {
      if (!gate.classList.contains("is-staring")) return;
      audio.exitDeadSilence();
      try {
        await audio.enable();
        updateAudioToggle(true);
      } catch {
        /* ignore */
      }
      if (eyes) {
        eyes.hidden = true;
        eyes.setAttribute("aria-hidden", "true");
      }
      gate.classList.remove("is-staring");
      display.hidden = false;
      pad.hidden = false;
      pad.querySelectorAll(".gate__key").forEach((k) => {
        k.disabled = false;
      });
      buffer = "";
      render();
      status.textContent = "";
      status.className = "gate__status";
      locked = false;
      setWhisperPadVisible(true);
      gate.addEventListener("click", onPadClick);
      window.addEventListener("keydown", onKeydown);
      audio.play("channelSwitch");
    };

    eyes?.querySelector(".gate__face-caption")?.addEventListener("click", () => {
      void unstare();
    });

    const succeed = async () => {
      setWhisperPadVisible(false);
      locked = true;
      pad.querySelectorAll(".gate__key").forEach((k) => {
        k.disabled = true;
      });

      // Full code stays on the display through the unlock ritual
      render();
      status.textContent = "ACCEPTED";
      status.className = "gate__status gate__status--ok";
      gate.classList.add("is-unlocked");
      flash.classList.remove("is-fire");
      void flash.offsetWidth;
      flash.classList.add("is-fire");
      audio.play("codeSuccess");
      try {
        if (!audio.enabled) await audio.enable();
        const trackId = hasImperialClearance()
          ? MUSIC?.postImperialDefault ?? "ascendancy"
          : MUSIC?.hubDefault ?? "recursion";
        await audio.startSoundtrack(trackId);
      } catch {
        /* hub ensureSoundtrack will retry */
      }

      // Skip is available immediately — aborts acceptance text + later boot stages
      skipBtn.hidden = false;

      await sleep(bootMs(420));
      if (skippedRef.skipped) {
        cleanupAndResolve();
        return;
      }

      cascade.hidden = false;
      cascade.classList.remove("is-pending");
      cascade.classList.add("is-shown");
      const lines = ACCESS_SUCCESS?.lines ?? [];
      const pace = bootPace();
      for (const line of lines) {
        if (skippedRef.skipped) break;
        const row = document.createElement("div");
        row.className = "gate__cascade-line";
        cascade.appendChild(row);
        await typeText(row, `> ${line.text}`, skippedRef, null, pace);
        if (skippedRef.skipped) break;
        await sleep(bootMs(line.delay ?? 100));
      }

      if (!skippedRef.skipped) {
        await sleep(bootMs(ACCESS_SUCCESS?.holdMs ?? 700));
      }

      cleanupAndResolve();
    };

    const submit = () => {
      if (locked) return;
      if (buffer.length < maxLen) return;
      if (buffer === ACCESS_CODE) {
        succeed();
        return;
      }
      const egg = GATE_EASTER_EGGS?.[buffer];
      if (egg?.type === "coldReset") {
        locked = true;
        wipeLatticeProgress();
        window.location.reload();
        return;
      }
      if (egg?.type === "devFullAccess") {
        // Dev cheat: same hub path as 512, then full Imperial + STATUS unlocks
        grantImperialClearance();
        unlockChannelsForImperialBind();
        applyClearanceUI();
        initHullPlan.applyHullUI?.();
        initFlightLog.refreshAccess?.();
        succeed();
        return;
      }
      if (egg?.type === "eyes") {
        stare();
        return;
      }
      if (egg?.type === "message") {
        fail(egg.text || "DENIED");
        return;
      }
      if (GATE_NICE_TRY_CODES?.includes(buffer)) {
        fail(GATE_NICE_TRY_TEXT || "NICE TRY");
        return;
      }
      fail();
    };

    const pushDigit = (digit) => {
      if (locked) return;
      if (buffer.length >= maxLen) return;
      buffer += digit;
      status.textContent = "";
      render();
      audio.play("channelSwitch");
    };

    const clear = () => {
      if (locked) return;
      buffer = "";
      status.textContent = "";
      render();
      audio.play("channelSwitch");
    };

    const onPadClick = async (e) => {
      const key = e.target.closest("[data-key]")?.dataset.key;
      if (!key) return;
      if (!audio.enabled) {
        await audio.enable();
        updateAudioToggle(true);
      }
      if (key === "clear") clear();
      else if (key === "enter") submit();
      else pushDigit(key);
    };

    const onKeydown = async (e) => {
      if (gate.hidden) return;
      if (e.target.closest?.("#whisper")) return;
      if (!audio.enabled && ((e.key >= "0" && e.key <= "9") || e.key === "Enter")) {
        await audio.enable();
        updateAudioToggle(true);
      }
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        pushDigit(e.key);
      } else if (e.key === "Enter") {
        e.preventDefault();
        // After unlock, Enter is handled by the shared skip listener
        if (locked) return;
        submit();
      } else if (e.key === "Backspace" || e.key === "Escape") {
        e.preventDefault();
        clear();
      }
    };

    gate.addEventListener("click", onPadClick);
    window.addEventListener("keydown", onKeydown);
  });
}

export async function enterHub() {
  const bootScreen = document.getElementById("boot");
  const hubScreen = document.getElementById("hub");
  const logoStage = document.getElementById("boot-logo");

  bootScreen.hidden = true;
  hubScreen.hidden = false;
  if (logoStage) {
    logoStage.hidden = true;
    logoStage.classList.remove("is-visible", "is-loading");
    logoStage.style.opacity = "";
  }
  audio.play("select");
  void audio.ensureSoundtrack();
  startChrono();
  applyClearanceUI();

  const activeBtn = document.querySelector(".nav-item.is-active");
  if (activeBtn) {
    await typeChannelBanner(activeBtn.dataset.panel, activeBtn.dataset.channelTitle);
  }

  const active = document.querySelector(".panel.is-active");
  if (active) await revealPanel(active);
}

/** Leave hub and reopen the clearance keypad; success returns to hub */
export async function returnToClearance() {
  const bootScreen = document.getElementById("boot");
  const hubScreen = document.getElementById("hub");
  const log = document.getElementById("boot-log");
  const skipBtn = document.getElementById("boot-skip");
  const logoStage = document.getElementById("boot-logo");

  hubScreen.hidden = true;
  bootScreen.hidden = false;
  log.innerHTML = "";
  log.classList.remove("is-dimmed");
  skipBtn.hidden = true;
  if (logoStage) {
    logoStage.hidden = true;
    logoStage.classList.remove("is-visible", "is-loading");
    logoStage.style.opacity = "";
  }

  const skippedRef = { skipped: false };

  const triggerSkip = () => {
    if (skippedRef.skipped || skipBtn.hidden) return;
    skippedRef.skipped = true;
    audio.play("click");
  };

  skipBtn.addEventListener("click", triggerSkip, { once: true });
  const onSkipKey = (e) => {
    if (e.key !== "Enter") return;
    if (e.target.closest?.("#whisper")) return;
    if (skipBtn.hidden || skippedRef.skipped) return;
    e.preventDefault();
    triggerSkip();
  };
  window.addEventListener("keydown", onSkipKey);

  await runClearanceGate(skippedRef);

  window.removeEventListener("keydown", onSkipKey);
  skipBtn.hidden = true;
  await enterHub();
}

export function initImagoReturn() {
  const mark = document.querySelector(".imago-mark");
  let busy = false;

  const goPad = async () => {
    if (busy) return;
    const hub = document.getElementById("hub");
    if (!hub || hub.hidden) return;
    busy = true;
    try {
      await returnToClearance();
    } finally {
      busy = false;
    }
  };

  mark?.addEventListener("click", () => {
    void goPad();
  });

  document.getElementById("nav-goto-pad")?.addEventListener("click", () => {
    void goPad();
  });

  document.getElementById("nav-goto-tuner")?.addEventListener("click", () => {
    if (audio.enabled) audio.markAmbienceLive();
  });
}

function consumeHubEntryQuery() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("hub") !== "1") return false;
    url.searchParams.delete("hub");
    const qs = url.searchParams.toString();
    history.replaceState(
      null,
      "",
      `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`
    );
    return hasImperialClearance();
  } catch {
    return false;
  }
}

export async function runBoot() {
  const log = document.getElementById("boot-log");
  const skipBtn = document.getElementById("boot-skip");

  const unlockAudio = async () => {
    await audio.enable();
    updateAudioToggle(true);
  };
  document.addEventListener("keydown", () => unlockAudio(), { once: true });
  document.addEventListener(
    "pointerdown",
    () => {
      void unlockAudio();
    },
    { once: true }
  );

  // Resume terminal ambience after intercept → clearance navigation
  if (audio.shouldResumeAmbience()) {
    void unlockAudio();
  }

  if (consumeHubEntryQuery()) {
    skipBtn.hidden = true;
    const gate = document.getElementById("boot-gate");
    if (gate) gate.hidden = true;
    setWhisperPadVisible(false);
    await unlockAudio();
    try {
      await audio.startSoundtrack(
        MUSIC?.postImperialDefault ?? "ascendancy"
      );
    } catch {
      /* ignore */
    }
    await enterHub();
    return;
  }

  const skippedRef = { skipped: false };
  skipBtn.hidden = true;

  const triggerSkip = () => {
    if (skippedRef.skipped || skipBtn.hidden) return;
    skippedRef.skipped = true;
    audio.play("click");
  };

  skipBtn.addEventListener("click", triggerSkip);

  const onSkipKey = (e) => {
    if (e.key !== "Enter") return;
    if (e.target.closest?.("#whisper")) return;
    if (skipBtn.hidden || skippedRef.skipped) return;
    e.preventDefault();
    triggerSkip();
  };
  window.addEventListener("keydown", onSkipKey);

  await runClearanceGate(skippedRef);
  await unlockAudio();

  // Skipped during acceptance → jump straight to hub
  if (skippedRef.skipped) {
    window.removeEventListener("keydown", onSkipKey);
    skipBtn.hidden = true;
    await enterHub();
    return;
  }

  const stickLog = () => {
    log.scrollTop = log.scrollHeight;
  };

  const pace = bootPace();
  for (const line of BOOT_LINES) {
    if (skippedRef.skipped) break;
    const el = document.createElement("div");
    el.className = line.cls || "";
    log.appendChild(el);
    stickLog();
    await typeText(el, `> ${line.text}`, skippedRef, stickLog, pace);
    if (line.awaitDotsMs && !skippedRef.skipped) {
      const dots = document.createElement("span");
      dots.className = "boot-dots";
      el.appendChild(dots);
      await blinkBootDots(dots, bootMs(line.awaitDotsMs), skippedRef);
      stickLog();
    }
    stickLog();
    if (!skippedRef.skipped) await sleep(bootMs(line.delay));
  }

  window.removeEventListener("keydown", onSkipKey);
  if (!skippedRef.skipped) await sleep(bootMs(80));
  skipBtn.hidden = true;

  if (!skippedRef.skipped) {
    await playBootLogo();
  }

  await enterHub();
}
