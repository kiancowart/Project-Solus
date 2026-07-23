/**
 * LATTICE.OS — Whisper ARG
 */

import { WHISPER } from "../content/boot-content.js";
import { audio } from "./audio.js";
import { sleep, typeText } from "./motion.js";

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
  const form = document.getElementById("whisper-form");
  const input = document.getElementById("whisper-input");
  if (!root || !tab || !panel || !log || !form || !input) return;

  root.hidden = true;

  if (head && WHISPER?.title) head.textContent = WHISPER.title;

  const steps = WHISPER?.steps ?? [];
  const deny = WHISPER?.deny ?? "DENIED";
  const farewell = WHISPER?.farewell ?? [
    "I'm done with you now. I just wanna watch you delve into hell.",
    "Don't make me repeat myself.",
    "Fine.",
  ];
  let step = 0;
  let open = false;
  let done = false;
  let busy = false;
  let farewellIndex = 0;
  let lastBot = null; // { text, cls, grid? }
  let denyHeat = 0;
  let strugglePending = false;
  let struggleSaid = false;

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

  const stick = () => {
    log.scrollTop = log.scrollHeight;
  };

  const typeLine = async (text, cls = "", { record = true } = {}) => {
    const line = document.createElement("div");
    line.className = `whisper__line${cls ? ` ${cls}` : ""}`;
    log.appendChild(line);
    stick();
    await typeText(line, text, null, stick);
    stick();
    if (record && !text.startsWith("> ")) {
      lastBot = { text, cls, grid: null };
    }
  };

  const buildSudokuBoard = (grid) => {
    const board = document.createElement("div");
    board.className = "whisper__line whisper__sudoku whisper__line--prompt";
    const cells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const n = grid[r][c] ?? 0;
        const cell = document.createElement("span");
        cell.className = `whisper__sudoku-cell${n ? "" : " is-blank"}`;
        cell.dataset.target = String(n);
        cell.textContent = "";
        board.appendChild(cell);
        cells.push(cell);
      }
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
      const order = shuffle(filled);
      const startDelays = [];
      let cursor = 0;
      for (let i = 0; i < order.length; i++) {
        startDelays.push(cursor);
        const t = i / Math.max(1, order.length - 1);
        cursor += Math.round(lerp(311, 21, t * t));
      }

      await Promise.all(
        order.map(async (cell, i) => {
          const target = Number(cell.dataset.target);
          await sleep(startDelays[i]);
          for (let v = 1; v <= target; v++) {
            cell.textContent = String(v);
            stick();
            const cellProg = (v - 1) / Math.max(1, target - 1);
            const globalProg = (i + cellProg) / Math.max(1, order.length);
            const tick = Math.round(
              lerp(163, 30, Math.min(1, globalProg) ** 0.9)
            );
            await sleep(tick);
          }
        })
      );

      blanks.forEach((cell) => {
        cell.textContent = "·";
        cell.classList.add("is-blink");
      });
      await sleep(560);
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
    matchesExact(raw, WHISPER?.identity?.match ?? ["who are you"]);

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
      return;
    }
    await showStepPrompt(steps[step]);
  };

  const openPanel = async () => {
    if (busy || root.hidden) return;
    open = true;
    panel.hidden = false;
    tab.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    audio.play("select");

    const firstOpen = !log.childElementCount;
    if (firstOpen) {
      setBusy(true);
      try {
        if (strugglePending && !struggleSaid) {
          struggleSaid = true;
          await typeLine(
            WHISPER?.struggleLine ?? "I see you're struggling.",
            "whisper__line--prompt",
            { record: false }
          );
        }
        await showStepPrompt(steps[step]);
      } finally {
        setBusy(false);
        if (open) input.focus();
      }
      return;
    }
    input.focus();
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
      root.hidden = false;
      // Gate reveal may leave this stuck pending / clipped from view
      root.classList.remove("is-pending");
      root.classList.add("is-shown");
      paintHeat();
    },
    hide() {
      closePanel({ silent: true });
      root.hidden = true;
    },
    onDenied() {
      denyHeat += 1;
      if (denyHeat >= 3) strugglePending = true;
      paintHeat();
    },
    resetHeat() {
      denyHeat = 0;
      strugglePending = false;
      struggleSaid = false;
      step = 0;
      done = false;
      farewellIndex = 0;
      lastBot = null;
      log.replaceChildren();
      root.classList.remove("is-expanded-x", "is-expanded-y", "is-open");
      panel.hidden = true;
      tab.setAttribute("aria-expanded", "false");
      paintHeat();
    },
  };

  tab.addEventListener("click", () => {
    if (root.hidden) return;
    if (open) closePanel();
    else openPanel();
  });

  // Keep keypad / skip from seeing whisper keystrokes
  root.addEventListener("keydown", (e) => e.stopPropagation());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;

    const raw = input.value.trim();
    input.value = "";
    if (!raw) return;

    setBusy(true);
    try {
      await typeLine(`> ${raw}`, "", { record: false });

      // Name forbid — works at any point (before other interrupts)
      if (hasForbiddenName(raw)) {
        const reply = WHISPER?.forbiddenName?.reply ?? "Don't say that name.";
        audio.play("select");
        await typeLine(reply, "whisper__line--prompt", { record: false });
        await repeatLastBot();
        return;
      }

      // Identity interrupt — works at any point
      if (isIdentityAsk(raw)) {
        const reply = WHISPER?.identity?.reply ?? "Your guide.";
        audio.play("select");
        await typeLine(reply, "whisper__line--prompt", { record: false });
        await repeatLastBot();
        return;
      }

      // After the riddle is solved — escalate dismissals
      if (done || step >= steps.length) {
        const idx = Math.min(farewellIndex, farewell.length - 1);
        farewellIndex = Math.min(farewellIndex + 1, farewell.length - 1);
        audio.play("open");
        await typeLine(farewell[idx], "whisper__line--deny");
        return;
      }

      const current = steps[step];
      const soft = current.softReject;
      const softHit =
        soft &&
        matchesStepList(
          raw,
          soft.match ?? [],
          soft.matchMode ?? current.acceptMode ?? "exact"
        );
      const accepted = matchesStepList(
        raw,
        current.accept ?? [],
        current.acceptMode ?? "exact"
      );

      // Negatives win over affirmatives when both could match
      if (softHit && !accepted) {
        audio.play("open");
        await typeLine(soft.text, "whisper__line--deny");
        return;
      }

      if (accepted) {
        audio.play("select");
        await advanceAfterAccept(current, raw);
        return;
      }

      if (softHit) {
        audio.play("open");
        await typeLine(soft.text, "whisper__line--deny");
        return;
      }

      audio.play("open");
      await typeLine(deny, "whisper__line--deny");
      await showStepPrompt(current, { animateGrid: false });
    } finally {
      setBusy(false);
      if (open) input.focus();
    }
  });
}
