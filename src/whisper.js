/**
 * LATTICE.OS — Whisper ARG
 */

import { WHISPER, MOTION } from "../content/boot-content.js";
import { audio } from "./audio.js";
import { sleep, typeText, revealTopToBottom, prefersReducedMotion } from "./motion.js";

/* ==========================================================================
   WHISPER — Kharon-Celeste corner ARG (pad screen only)
   ========================================================================== */

/** Shown only while the clearance number pad is active */
export let whisperPadControl = {
  show() {},
  hide() {},
  onDenied() {},
  resetHeat() {},
};

export function setWhisperPadVisible(on) {
  if (on) {
    whisperPadControl.resetHeat();
    whisperPadControl.show();
  } else whisperPadControl.hide();
}

export function initWhisper() {
  const root = document.getElementById("whisper");
  const tab = document.getElementById("whisper-tab");
  const panel = document.getElementById("whisper-panel");
  const head = document.getElementById("whisper-head");
  const log = document.getElementById("whisper-log");
  const rail = document.getElementById("whisper-rail");
  const railFill = document.getElementById("whisper-scroll-fill");
  const form = document.getElementById("whisper-form");
  const input = document.getElementById("whisper-input");
  if (!root || !tab || !panel || !log || !form || !input) return;

  root.hidden = true;

  if (head && WHISPER?.title) head.textContent = WHISPER.title;

  const steps = WHISPER?.steps ?? [];
  const deny = WHISPER?.deny ?? "DENIED";
  const farewell = WHISPER?.farewell ?? [
    "I'm done helping.",
    "Don't make me repeat myself.",
    "Fine.",
  ];
  const progressKey = WHISPER?.progressKey ?? "lattice.whisperStep";
  const doneKey = WHISPER?.doneKey ?? "lattice.whisperDone";
  const sealedKey = WHISPER?.sealedKey ?? "lattice.whisperSealed";

  const readSealed = () => {
    try {
      return localStorage.getItem(sealedKey) === "1";
    } catch {
      return false;
    }
  };

  const writeSealed = () => {
    try {
      localStorage.setItem(sealedKey, "1");
      localStorage.setItem(doneKey, "1");
      localStorage.setItem(progressKey, String(steps.length));
    } catch {
      /* private mode */
    }
  };

  const readProgress = () => {
    try {
      if (localStorage.getItem(doneKey) === "1") {
        return { step: steps.length, done: true };
      }
      const n = Number(localStorage.getItem(progressKey) ?? "0");
      const step = Number.isFinite(n) ? Math.max(0, Math.min(steps.length, Math.floor(n))) : 0;
      return { step, done: step >= steps.length };
    } catch {
      return { step: 0, done: false };
    }
  };

  const writeProgress = (nextStep, nextDone) => {
    try {
      if (nextDone) {
        localStorage.setItem(doneKey, "1");
        localStorage.setItem(progressKey, String(steps.length));
      } else {
        localStorage.setItem(progressKey, String(nextStep));
        localStorage.removeItem(doneKey);
      }
    } catch {
      /* private mode */
    }
  };

  /** expandAfter fires when leaving a step — restore shell if past that beat */
  const applyExpandShell = () => {
    for (let i = 0; i < step; i++) {
      if (steps[i]?.expandAfter) {
        root.classList.add("is-expanded-x", "is-expanded-y");
        return;
      }
    }
  };

  let open = false;
  let busy = false;
  let farewellIndex = 0;
  let lastBot = null; // { text, cls, grid? }
  let denyHeat = 0;
  let strugglePending = false;
  let struggleSaid = false;
  let sealed = readSealed();
  if (sealed) {
    tab.disabled = true;
    tab.setAttribute("aria-hidden", "true");
  }
  /** Bumped to abort in-flight sudoku reveal / fill (and its SFX). */
  let motionEpoch = 0;
  const motionAbort = { aborted: false };

  const cancelMotion = () => {
    motionEpoch += 1;
    motionAbort.aborted = true;
    audio.stopTypewriter();
    audio.stopRevealScan();
  };

  let { step, done } = readProgress();

  /** Letters/digits + spacing only; apostrophes dropped so don't → dont */
  const normalizeAnswer = (raw) =>
    String(raw ?? "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  /** Phrase may sit among other words; longer needles win first. */
  const containsPhrase = (raw, list = []) => {
    const n = normalizeAnswer(raw);
    if (!n) return false;
    const needles = [...list]
      .map((a) => normalizeAnswer(a))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    return needles.some((needle) => {
      const re = new RegExp(`(?:^|\\s)${escapeRegExp(needle)}(?:\\s|$)`);
      return re.test(n);
    });
  };

  const matchesExact = (raw, list = []) => {
    const n = normalizeAnswer(raw);
    return list.some((a) => normalizeAnswer(a) === n);
  };

  const matchesStepList = (raw, list, mode) => {
    if (mode === "affirmative") return containsPhrase(raw, WHISPER?.affirmatives ?? list);
    if (mode === "negative") return containsPhrase(raw, WHISPER?.negatives ?? list);
    if (mode === "contains") return containsPhrase(raw, list);
    return matchesExact(raw, list);
  };

  const formatSudoku = (grid) => {
    const cell = (n) => (n ? String(n) : "·");
    const rowLine = (row) =>
      [0, 3, 6]
        .map((b) => row.slice(b, b + 3).map(cell).join(" "))
        .join(" │ ");
    const band = (i) =>
      [0, 1, 2].map((r) => rowLine(grid[i + r])).join("\n");
    const sep = "──────┼───────┼──────";
    return [band(0), sep, band(3), sep, band(6)].join("\n");
  };

  const updateRail = () => {
    if (!rail || !railFill) return;
    const max = log.scrollHeight - log.clientHeight;
    if (max <= 0) {
      rail.hidden = true;
      railFill.style.transform = "scaleY(0)";
      return;
    }
    rail.hidden = false;
    const fill = log.scrollTop / max;
    railFill.style.transform = `scaleY(${Math.max(0, Math.min(1, fill))})`;
  };

  const stick = () => {
    log.scrollTop = log.scrollHeight;
    updateRail();
  };

  const typeLine = async (text, cls = "", { record = true, pace = 1 } = {}) => {
    const line = document.createElement("div");
    line.className = `whisper__line${cls ? ` ${cls}` : ""}`;
    log.appendChild(line);
    stick();
    await typeText(line, text, null, stick, pace);
    stick();
    if (record && !text.startsWith("> ")) {
      lastBot = { text, cls, grid: null };
    }
  };

  const softRejectList = (stepObj) => {
    if (Array.isArray(stepObj?.softRejects)) return stepObj.softRejects;
    if (stepObj?.softReject) return [stepObj.softReject];
    return [];
  };

  const findSoftReject = (stepObj, raw) => {
    for (const soft of softRejectList(stepObj)) {
      const mode = soft.matchMode ?? stepObj.acceptMode ?? "exact";
      if (matchesStepList(raw, soft.match ?? [], mode)) return soft;
    }
    return null;
  };

  const sealTerminal = () => {
    sealed = true;
    writeSealed();
    done = true;
    step = steps.length;
    cancelMotion();
    closePanel({ silent: true });
    root.hidden = true;
    tab.disabled = true;
    tab.setAttribute("aria-hidden", "true");
  };

  /** Type HAHA L→R with wrap until the viewport is packed, then seal. */
  const runLaughLock = async () => {
    log.replaceChildren();
    lastBot = null;
    if (rail) rail.hidden = true;
    log.scrollTop = 0;

    const block = document.createElement("div");
    block.className = "whisper__line whisper__line--deny whisper__line--laugh";
    log.appendChild(block);

    const styles = getComputedStyle(log);
    const padY =
      (parseFloat(styles.paddingTop) || 0) +
      (parseFloat(styles.paddingBottom) || 0);
    const fillH = () => Math.max(1, log.clientHeight - padY);
    const isPacked = () => block.scrollHeight >= fillH() - 1;

    if (prefersReducedMotion()) {
      let text = "";
      while (!isPacked() && text.length < 8000) {
        text += "HAHA";
        block.textContent = text;
      }
      log.scrollTop = 0;
      await sleep(350);
      sealTerminal();
      return;
    }

    // Start slower than normal typewriter so the ramp is obvious, then
    // add +0.3 speed each "HAHA" (wait = baseMs / speed).
    const baseMs = Math.max(28, (MOTION.typeMs ?? 8) * 3.5);
    const stream = "HAHA";
    let speed = 1;
    let text = "";
    let typed = 0;
    let guard = 0;

    while (!isPacked() && guard < 12000) {
      const ch = stream[typed % stream.length];
      typed += 1;
      guard += 1;
      text += ch;
      block.textContent = text;
      log.scrollTop = 0;
      if (ch.trim()) audio.play("typewriter");

      const wait = Math.max(0, baseMs / speed);
      if (wait > 0) await sleep(wait);

      if (typed % stream.length === 0) {
        speed += 0.3;
      }
    }

    log.scrollTop = 0;
    await sleep(280);
    sealTerminal();
  };

  const buildSudokuBoard = (grid) => {
    const board = document.createElement("div");
    board.className = "whisper__line whisper__sudoku whisper__line--prompt";
    const cells = [];
    for (let r = 0; r < 9; r++) {
      const row = document.createElement("div");
      row.className = "whisper__sudoku-row";
      for (let c = 0; c < 9; c++) {
        const n = grid[r][c] ?? 0;
        const cell = document.createElement("span");
        cell.className = `whisper__sudoku-cell${n ? "" : " is-blank"}`;
        cell.dataset.target = String(n);
        cell.textContent = "";
        row.appendChild(cell);
        cells.push(cell);
      }
      board.appendChild(row);
    }
    return { board, cells };
  };

  const paintSudokuFinal = (cells) => {
    cells.forEach((cell) => {
      const n = Number(cell.dataset.target || 0);
      cell.textContent = n ? String(n) : "·";
      cell.classList.toggle("is-blank", !n);
      cell.classList.remove("is-blink");
    });
  };

  const showGrid = async (grid, { record = true, animate = true } = {}) => {
    const { board, cells } = buildSudokuBoard(grid);
    log.appendChild(board);
    stick();

    if (animate) {
      motionAbort.aborted = false;
      const epoch = motionEpoch;
      const dead = () => epoch !== motionEpoch || motionAbort.aborted;

      // Frame loads top→bottom (same reveal-scan bed as the clearance pad)
      await revealTopToBottom(board, motionAbort);
      if (dead()) return;

      const filled = cells.filter((cell) => Number(cell.dataset.target) > 0);
      const blanks = cells.filter((cell) => Number(cell.dataset.target) === 0);

      const lerp = (a, b, t) => a + (b - a) * t;
      const shuffle = (list) => {
        const a = [...list];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      // Random order; start gaps begin long and tighten (slow → fast kickoffs)
      // Fill pace: prior 40% faster, then another 50% faster
      const fillPace = 1 / (1.4 * 1.5);
      const order = shuffle(filled);
      const startDelays = [];
      let cursor = 0;
      for (let i = 0; i < order.length; i++) {
        startDelays.push(cursor);
        const t = i / Math.max(1, order.length - 1);
        cursor += Math.round(lerp(311, 21, t * t) * fillPace);
      }

      await Promise.all(
        order.map(async (cell, i) => {
          if (dead()) return;
          const target = Number(cell.dataset.target);
          await sleep(startDelays[i]);
          if (dead()) return;
          for (let v = 1; v <= target; v++) {
            if (dead()) return;
            cell.textContent = String(v);
            audio.play("typewriter");
            stick();
            const cellProg = (v - 1) / Math.max(1, target - 1);
            const globalProg = (i + cellProg) / Math.max(1, order.length);
            const tick = Math.round(
              lerp(163, 30, Math.min(1, globalProg) ** 0.9) * fillPace
            );
            await sleep(tick);
          }
        })
      );

      if (dead()) return;

      blanks.forEach((cell) => {
        cell.textContent = "·";
        cell.classList.add("is-blink");
      });
      await sleep(Math.round(560 * fillPace));
      if (dead()) return;
      blanks.forEach((cell) => cell.classList.remove("is-blink"));
    } else {
      paintSudokuFinal(cells);
    }

    if (record) {
      lastBot = { text: formatSudoku(grid), cls: "whisper__line--prompt", grid };
    }
  };

  /** Prompt line + optional sudoku. */
  const showStepPrompt = async (stepObj, { record = true, animateGrid = true } = {}) => {
    if (stepObj?.prompt) {
      await typeLine(stepObj.prompt, "whisper__line--prompt", {
        record: !stepObj.grid && record,
      });
    }
    if (stepObj?.grid) {
      await showGrid(stepObj.grid, { record, animate: animateGrid });
    }
  };

  const isIdentityAsk = (raw) =>
    containsPhrase(raw, WHISPER?.identity?.match ?? ["who are you"]);

  const hasForbiddenName = (raw) => {
    const word = normalizeAnswer(WHISPER?.forbiddenName?.word ?? "Kian");
    if (!word) return false;
    return normalizeAnswer(raw)
      .split(" ")
      .some((token) => token === word);
  };

  const repeatLastBot = async () => {
    if (!lastBot) return;
    if (lastBot.grid) {
      await showGrid(lastBot.grid, { record: false, animate: false });
      return;
    }
    await typeLine(lastBot.text, lastBot.cls || "whisper__line--prompt", {
      record: false,
    });
  };

  const setBusy = (on) => {
    busy = on;
    input.disabled = on;
  };

  const paintHeat = () => {
    const heat = Math.min(3, denyHeat);
    tab.dataset.heat = String(heat);
  };

  const expandTerminal = async () => {
    root.classList.add("is-expanded-x");
    await sleep(1900);
    root.classList.add("is-expanded-y");
    await sleep(2150);
  };

  const advanceAfterAccept = async (current, raw) => {
    if (current.success) {
      await typeLine(current.success, "whisper__line--ok");
    }

    let shouldExpand = Boolean(current.expandAfter);
    const magicWords =
      steps.find((s) => s.skipIfPleaseSaid)?.accept ?? ["please", "plz"];
    const pleaseAlready = containsPhrase(raw, magicWords);

    step += 1;
    while (
      pleaseAlready &&
      step < steps.length &&
      steps[step]?.skipIfPleaseSaid
    ) {
      if (steps[step].expandAfter) shouldExpand = true;
      step += 1;
    }

    if (shouldExpand) await expandTerminal();

    if (step >= steps.length) {
      done = true;
      writeProgress(step, true);
      return;
    }
    writeProgress(step, false);
    await showStepPrompt(steps[step]);
  };

  const openPanel = async () => {
    // Do not gate on `busy` — replies/expands keep busy true for seconds after
    // a close, which made reopen feel permanently broken.
    if (root.hidden || open) return;
    open = true;
    panel.hidden = false;
    tab.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    audio.play("revealScan", { durationMs: 850 });

    const firstOpen = !log.childElementCount;
    if (firstOpen) {
      if (busy) return;
      setBusy(true);
      try {
        applyExpandShell();
        if (strugglePending && !struggleSaid) {
          struggleSaid = true;
          await typeLine(
            WHISPER?.struggleLine ?? "I see you're struggling.",
            "whisper__line--prompt",
            { record: false }
          );
        }
        if (done || step >= steps.length) {
          await typeLine(
            farewell[0] ?? "I'm done with you now.",
            "whisper__line--deny",
            { record: false }
          );
        } else {
          await showStepPrompt(steps[step]);
        }
      } finally {
        setBusy(false);
        if (open) input.focus();
      }
      return;
    }
    if (!busy) input.focus();
  };

  const closePanel = ({ silent = false } = {}) => {
    open = false;
    panel.hidden = true;
    tab.setAttribute("aria-expanded", "false");
    root.classList.remove("is-open");
    if (!silent) audio.play("click");
  };

  whisperPadControl = {
    show() {
      if (sealed) {
        root.hidden = true;
        tab.disabled = true;
        return;
      }
      root.hidden = false;
      // Gate reveal may leave this stuck pending / clipped from view
      root.classList.remove("is-pending");
      root.classList.add("is-shown");
      paintHeat();
    },
    hide() {
      cancelMotion();
      closePanel({ silent: true });
      root.hidden = true;
    },
    onDenied() {
      if (sealed) return;
      denyHeat += 1;
      if (denyHeat >= 3) strugglePending = true;
      paintHeat();
    },
    resetHeat() {
      if (sealed) {
        root.hidden = true;
        tab.disabled = true;
        return;
      }
      // Deny heat only — guide step persists across tuner trips
      denyHeat = 0;
      strugglePending = false;
      struggleSaid = false;
      ({ step, done } = readProgress());
      farewellIndex = 0;
      lastBot = null;
      open = false;
      log.replaceChildren();
      root.classList.remove("is-expanded-x", "is-expanded-y", "is-open");
      applyExpandShell();
      panel.hidden = true;
      tab.setAttribute("aria-expanded", "false");
      paintHeat();
    },
  };

  tab.addEventListener("click", () => {
    if (root.hidden || sealed || tab.disabled) return;
    if (open) closePanel();
    else openPanel();
  });

  // Keep keypad / skip from seeing whisper keystrokes
  root.addEventListener("keydown", (e) => e.stopPropagation());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy || sealed) return;

    const raw = input.value.trim();
    input.value = "";
    if (!raw) return;

    setBusy(true);
    let keepBusy = false;
    try {
      await typeLine(`> ${raw}`, "", { record: false });

      // Name forbid — works at any point (before other interrupts)
      if (hasForbiddenName(raw)) {
        const reply = WHISPER?.forbiddenName?.reply ?? "Don't say that name.";
        await typeLine(reply, "whisper__line--prompt", { record: false });
        await repeatLastBot();
        return;
      }

      // Identity interrupt — phrase may sit among other words; no follow-up
      if (isIdentityAsk(raw)) {
        const reply = WHISPER?.identity?.reply ?? "TURN AROUND";
        await typeLine(reply, "whisper__line--prompt", { record: false });
        return;
      }

      // Pad code before sudoku — dismiss guide into farewell mode
      const sudokuStep = steps.findIndex((s) => s?.grid);
      const early = WHISPER?.earlyCode;
      if (
        !done &&
        sudokuStep >= 0 &&
        step < sudokuStep &&
        containsPhrase(raw, early?.match ?? ["512", "g512"])
      ) {
        audio.play("deny");
        await typeLine(
          early?.text ?? "So you already know. Stop wasting my time.",
          "whisper__line--deny"
        );
        done = true;
        step = steps.length;
        farewellIndex = 0;
        writeProgress(step, true);
        return;
      }

      // After the riddle is solved — escalate dismissals
      if (done || step >= steps.length) {
        const idx = Math.min(farewellIndex, farewell.length - 1);
        farewellIndex = Math.min(farewellIndex + 1, farewell.length - 1);
        audio.play("deny");
        await typeLine(farewell[idx], "whisper__line--deny");
        return;
      }

      const current = steps[step];
      const soft = findSoftReject(current, raw);
      const accepted = matchesStepList(
        raw,
        current.accept ?? [],
        current.acceptMode ?? "exact"
      );

      // Negatives win over affirmatives when both could match
      if (soft && !accepted) {
        if (soft.laughLock) {
          keepBusy = true;
          await runLaughLock();
          return;
        }
        audio.play("deny");
        await typeLine(
          soft.text,
          soft.cls || "whisper__line--deny"
        );
        return;
      }

      if (accepted) {
        await advanceAfterAccept(current, raw);
        return;
      }

      audio.play("deny");
      await typeLine(deny, "whisper__line--deny");
      await showStepPrompt(current, { animateGrid: false });
    } finally {
      if (!keepBusy && !sealed) {
        setBusy(false);
        if (open) input.focus();
      }
    }
  });

  log.addEventListener("scroll", updateRail, { passive: true });
  window.addEventListener("resize", updateRail);
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(updateRail);
    ro.observe(log);
    if (panel) ro.observe(panel);
  }
  updateRail();
}
