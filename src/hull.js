/**
 * LATTICE.OS — Hull plan, STATUS puzzles, FTH console
 */

import { audio } from "./audio.js";
import {
  PUZZLE_A,
  PUZZLE_B,
  BAY_UNLOCKS,
  OUTER_STATIONS,
  DAMAGE_EPOCH,
} from "../content/arg-path.js";
import {
  getHullProgress,
  setHullProgress,
  setChannelUnlock,
} from "./progress.js";
import { applyClearanceUI } from "./clearance.js";

const PROMPT = {
  IDLE: "idle",
  OUTER_SHIP: "outer_ship",
  OUTER_KHAN: "outer_khan",
  INNER_CODE: "inner_code",
};

function normalizeToken(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

/** Khan id: ignore spaces; period optional ("S. Raei" ≈ "S RAEI" ≈ "S.RAEI") */
function normalizeKhanId(raw) {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/\./g, "");
}

function normalizeInnerCode(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/[\s\-_.·]+/g, "")
    .toUpperCase();
}

function parseSlash(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed.startsWith("/")) return null;
  const parts = trimmed.slice(1).trim().split(/\s+/);
  const verb = (parts[0] || "").toLowerCase();
  const args = parts.slice(1);
  return { verb, args, raw: trimmed };
}

function severityClass(sev) {
  if (sev === "warn") return "hull-detail__v--warn";
  if (sev === "fault" || sev === "crit") return "hull-detail__v--crit";
  return "";
}

export function initHullPlan() {
  const plan = document.getElementById("hull-plan");
  const eye = document.getElementById("hull-plan-eye");
  const tabs = document.querySelectorAll("[data-hull-tab]");
  const outer = document.getElementById("hull-view-outer");
  const inner = document.getElementById("hull-view-inner");
  const mon = document.querySelector(".hull-mon");
  const overlays = document.getElementById("hull-plan-overlays");
  const partDetail = document.getElementById("hull-part-detail");
  const summaryLive = document.getElementById("hull-detail-summary");

  const stationById = Object.fromEntries(
    OUTER_STATIONS.map((s) => [s.id, s])
  );

  let selectedId = null;

  const clearPartSelection = () => {
    selectedId = null;
    overlays
      ?.querySelectorAll(".hull-plan__mark.is-selected")
      .forEach((el) => el.classList.remove("is-selected"));
    if (partDetail) {
      partDetail.hidden = true;
      partDetail.replaceChildren();
    }
    if (summaryLive) summaryLive.hidden = false;
  };

  const showPartDetail = (station) => {
    if (!partDetail) return;
    partDetail.hidden = false;
    if (summaryLive) summaryLive.hidden = true;
    partDetail.replaceChildren();

    const section = document.createElement("p");
    section.className = "hull-mon__section";
    section.textContent = "STATION DETAIL";
    partDetail.appendChild(section);

    const nameLine = document.createElement("p");
    nameLine.className = "hull-detail__line";
    nameLine.innerHTML = `<span class="hull-detail__k">PART</span><span class="hull-detail__v">${station.name}</span>`;
    partDetail.appendChild(nameLine);

    const sevLine = document.createElement("p");
    sevLine.className = "hull-detail__line";
    const sevCls = severityClass(station.severity);
    sevLine.innerHTML = `<span class="hull-detail__k">STATE</span><span class="hull-detail__v${sevCls ? ` ${sevCls}` : ""}">${String(station.severity).toUpperCase()}</span>`;
    partDetail.appendChild(sevLine);

    if (station.serial) {
      const serialLine = document.createElement("p");
      serialLine.className = "hull-detail__line";
      serialLine.innerHTML = `<span class="hull-detail__k">SERIAL</span><span class="hull-detail__v">${station.serial}</span>`;
      partDetail.appendChild(serialLine);
    } else {
      const serialLine = document.createElement("p");
      serialLine.className = "hull-detail__line";
      serialLine.innerHTML = `<span class="hull-detail__k">SERIAL</span><span class="hull-detail__v">—</span>`;
      partDetail.appendChild(serialLine);
    }

    const todHead = document.createElement("p");
    todHead.className = "hull-mon__section hull-mon__section--spaced";
    todHead.textContent = "TIME OF DAMAGE";
    partDetail.appendChild(todHead);

    if (station.damageTime) {
      const stampLine = document.createElement("p");
      stampLine.className = "hull-detail__line";
      stampLine.innerHTML = `<span class="hull-detail__k">TIMESTAMP</span><span class="hull-detail__v">${station.damageTime} UTC</span>`;
      partDetail.appendChild(stampLine);

      const cycleLine = document.createElement("p");
      cycleLine.className = "hull-detail__line";
      cycleLine.innerHTML = `<span class="hull-detail__k">CYCLE</span><span class="hull-detail__v">${DAMAGE_EPOCH.cycle}</span>`;
      partDetail.appendChild(cycleLine);

      const aeLine = document.createElement("p");
      aeLine.className = "hull-detail__line";
      aeLine.innerHTML = `<span class="hull-detail__k">AE</span><span class="hull-detail__v">${DAMAGE_EPOCH.ae}</span>`;
      partDetail.appendChild(aeLine);
    } else {
      const timeLine = document.createElement("p");
      timeLine.className = "hull-detail__line";
      timeLine.innerHTML = `<span class="hull-detail__k">EVENT</span><span class="hull-detail__v">NONE</span>`;
      partDetail.appendChild(timeLine);
    }

    const back = document.createElement("button");
    back.type = "button";
    back.className = "hull-part-back";
    back.textContent = "← SUMMARY";
    back.addEventListener("click", () => {
      clearPartSelection();
      audio.play("click");
    });
    partDetail.appendChild(back);
  };

  const selectMark = (mark) => {
    const id = mark?.dataset?.station;
    const station = id ? stationById[id] : null;
    if (!station) return;
    if (!getHullProgress().optics) return;
    if (plan?.classList.contains("is-labels-off")) return;

    overlays
      ?.querySelectorAll(".hull-plan__mark.is-selected")
      .forEach((el) => el.classList.remove("is-selected"));
    mark.classList.add("is-selected");
    selectedId = id;
    showPartDetail(station);
    audio.play("click");
  };

  overlays?.querySelectorAll(".hull-plan__mark[data-station]").forEach((mark) => {
    mark.setAttribute("role", "button");
    mark.tabIndex = 0;
    mark.addEventListener("click", (e) => {
      e.preventDefault();
      selectMark(mark);
    });
    mark.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      selectMark(mark);
    });
  });

  const applyHullUI = () => {
    const prog = getHullProgress();
    mon?.classList.toggle("hull-mon--optics", prog.optics);
    mon?.classList.toggle("hull-mon--inner", prog.inner);
    document.body.classList.toggle("hull-optics-online", prog.optics);
    document.body.classList.toggle("hull-inner-online", prog.inner);

    if (eye) {
      const dead = !prog.optics;
      eye.disabled = dead;
      eye.classList.toggle("is-dead", dead);
      eye.setAttribute("aria-disabled", dead ? "true" : "false");
      if (dead) {
        eye.classList.remove("is-on");
        plan?.classList.add("is-labels-off");
        eye.setAttribute("aria-pressed", "false");
        eye.setAttribute("aria-label", "Station labels offline");
        eye.title = "Optics bus dark";
        clearPartSelection();
      } else {
        eye.setAttribute("aria-label", "Toggle station labels");
        eye.title = "Toggle station labels";
        if (!eye.dataset.userToggled) {
          eye.classList.add("is-on");
          plan?.classList.remove("is-labels-off");
          eye.setAttribute("aria-pressed", "true");
        }
      }
    }

    if (plan?.classList.contains("is-labels-off")) {
      clearPartSelection();
    } else if (selectedId && stationById[selectedId]) {
      showPartDetail(stationById[selectedId]);
    }

    const sealed = document.getElementById("hull-inner-sealed");
    const live = document.getElementById("hull-inner-live");
    if (sealed && live) {
      sealed.hidden = prog.inner;
      live.hidden = !prog.inner;
    }

    document.querySelectorAll(".hull-bay[data-bay]").forEach((bay) => {
      const id = bay.dataset.bay;
      const spec = BAY_UNLOCKS[id];
      if (!spec) return;
      const done = Boolean(prog[spec.hullFlag]);
      bay.classList.toggle("is-open", done);
      bay.setAttribute("aria-pressed", done ? "true" : "false");
    });
  };

  document.querySelectorAll(".hull-bay[data-bay]").forEach((bay) => {
    bay.addEventListener("click", () => {
      if (!getHullProgress().inner) return;
      const id = bay.dataset.bay;
      const spec = BAY_UNLOCKS[id];
      if (!spec) return;
      const prog = getHullProgress();
      if (prog[spec.hullFlag]) {
        audio.play("click");
        return;
      }
      setHullProgress({ [spec.hullFlag]: true });
      setChannelUnlock(spec.unlock, true);
      audio.play("unlock");
      applyHullUI();
      applyClearanceUI();
    });
  });

  if (eye && plan) {
    eye.addEventListener("click", () => {
      if (!getHullProgress().optics) return;
      eye.dataset.userToggled = "1";
      const on = eye.classList.toggle("is-on");
      plan.classList.toggle("is-labels-off", !on);
      eye.setAttribute("aria-pressed", on ? "true" : "false");
      eye.setAttribute(
        "aria-label",
        on ? "Hide station labels" : "Show station labels"
      );
      if (!on) clearPartSelection();
      audio.play("click");
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const which = tab.dataset.hullTab;
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      if (outer) {
        outer.hidden = which !== "outer";
        outer.classList.toggle("is-active", which === "outer");
      }
      if (inner) {
        inner.hidden = which !== "inner";
        inner.classList.toggle("is-active", which === "inner");
      }
    });
  });

  applyHullUI();
  startEngBusJitter();
  initHullPlan.applyHullUI = applyHullUI;
}

/** Dead thrust bus: low feed levels jitter slightly; fill + % stay in lockstep. */
function startEngBusJitter() {
  const rows = [...document.querySelectorAll("[data-eng-bus]")];
  if (!rows.length) return;

  const states = rows.map((row, i) => {
    const fill = row.querySelector(".hull-bar__fill");
    const val = row.querySelector(".hull-bar__val");
    return {
      fill,
      val,
      base: 2.2 + i * 0.55,
      amp: 1.6 + (i % 3) * 0.45,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0011 + i * 0.00027 + Math.random() * 0.0004,
      wobble: 0.0007 + Math.random() * 0.0009,
      noise: 0,
    };
  });

  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(48, now - last);
    last = now;

    for (const s of states) {
      if (!s.fill || !s.val) continue;
      s.phase += s.speed * dt;
      s.noise += (Math.random() - 0.5) * 0.085 * dt * 0.06;
      s.noise *= 0.92;
      const wave =
        Math.sin(s.phase) * 0.55 +
        Math.sin(s.phase * 2.37 + 1.1) * 0.28 +
        Math.sin(s.phase * 0.41 + s.wobble * now) * 0.17 +
        s.noise;
      const pct = Math.max(0.4, Math.min(9.5, s.base + s.amp * wave));
      s.fill.style.width = `${pct.toFixed(2)}%`;
      s.val.textContent = `${Math.round(pct)}%`;
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

export function initFthConsole() {
  const consoleEl = document.getElementById("fth-console");
  const form = document.getElementById("fth-console-form");
  const input = document.getElementById("fth-console-input");
  const log = document.getElementById("fth-console-log");
  const awaitEl = document.getElementById("fth-console-await");
  if (!form || !input || !log) return;

  consoleEl?.classList.add("is-awaiting");

  let promptState = PROMPT.IDLE;

  const clearAwait = () => {
    if (!awaitEl || awaitEl.hidden) return;
    awaitEl.hidden = true;
    awaitEl.classList.remove("is-blink");
    consoleEl?.classList.remove("is-awaiting");
  };

  const push = (text, cls) => {
    const line = document.createElement("div");
    line.className = `fth-console__line${cls ? ` ${cls}` : ""}`;
    line.textContent = text;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  };

  const refreshHull = () => {
    initHullPlan.applyHullUI?.();
    applyClearanceUI();
  };

  const setPrompt = (state, line) => {
    promptState = state;
    if (line) push(line, "fth-console__line--sys");
  };

  const resetPrompt = () => {
    promptState = PROMPT.IDLE;
  };

  const handlePromptReply = (raw) => {
    const prog = getHullProgress();

    if (promptState === PROMPT.OUTER_SHIP) {
      const ship = normalizeToken(raw);
      if (ship !== normalizeToken(PUZZLE_A.shipId)) {
        push("ERR", "fth-console__line--err");
        resetPrompt();
        return;
      }
      setPrompt(PROMPT.OUTER_KHAN, PUZZLE_A.promptKhan);
      return;
    }

    if (promptState === PROMPT.OUTER_KHAN) {
      const khan = normalizeKhanId(raw);
      if (khan !== normalizeKhanId(PUZZLE_A.khanId)) {
        push("ERR", "fth-console__line--err");
        resetPrompt();
        return;
      }
      if (prog.optics) {
        push("OUTER AUTH ALREADY ONLINE", "fth-console__line--sys");
      } else {
        setHullProgress({ optics: true });
        push(PUZZLE_A.successLine, "fth-console__line--ok");
        audio.play("codeSuccess");
        refreshHull();
      }
      resetPrompt();
      return;
    }

    if (promptState === PROMPT.INNER_CODE) {
      if (!prog.optics) {
        push("ERR", "fth-console__line--err");
        resetPrompt();
        return;
      }
      if (prog.inner) {
        push("INNER PARTITION ALREADY RESTORED", "fth-console__line--sys");
        resetPrompt();
        return;
      }
      const code = normalizeInnerCode(raw);
      const ok = normalizeInnerCode(PUZZLE_B.codeCompact);
      if (code !== ok) {
        // Flat deny — no coaching
        push(PUZZLE_B.denyLine, "fth-console__line--err");
        audio.play("deny");
        resetPrompt();
        return;
      }
      setHullProgress({ inner: true });
      push(PUZZLE_B.successLine, "fth-console__line--ok");
      audio.play("codeSuccess");
      refreshHull();
      resetPrompt();
    }
  };

  const unknownCmd = (raw) => {
    const token = String(raw ?? "").trim().split(/\s+/)[0] || "—";
    push(
      `CMD ${token.toUpperCase()} NOT RECOGNIZED — TYPE /help FOR COMMAND LIST`,
      "fth-console__line--sys"
    );
  };

  const handleCommand = (raw) => {
    const parsed = parseSlash(raw);

    // A new slash command cancels any open code/auth prompt
    if (parsed) {
      if (promptState !== PROMPT.IDLE) resetPrompt();
    } else if (promptState !== PROMPT.IDLE) {
      handlePromptReply(raw);
      return;
    }

    const prog = getHullProgress();

    if (!parsed) {
      unknownCmd(raw);
      return;
    }

    const { verb } = parsed;

    if (verb === "help") {
      push(PUZZLE_A.helpLine, "fth-console__line--sys");
      return;
    }

    if (verb === "outer") {
      if (prog.optics) {
        push("OUTER AUTH ALREADY ONLINE", "fth-console__line--sys");
        return;
      }
      setPrompt(PROMPT.OUTER_SHIP, PUZZLE_A.promptShip);
      return;
    }

    if (verb === "inner") {
      if (!prog.optics) {
        push("ERR — OUTER AUTH REQUIRED", "fth-console__line--err");
        return;
      }
      if (prog.inner) {
        push("INNER PARTITION ALREADY RESTORED", "fth-console__line--sys");
        return;
      }
      setPrompt(PROMPT.INNER_CODE, PUZZLE_B.promptLabel);
      push(PUZZLE_B.promptMask, "fth-console__line--sys");
      return;
    }

    unknownCmd(parsed.raw);
  };

  input.addEventListener("focus", clearAwait);
  input.addEventListener("pointerdown", clearAwait);

  form.addEventListener("pointerdown", (e) => {
    if (e.target === input) return;
    clearAwait();
    input.focus();
  });

  input.addEventListener("input", () => {
    if (input.value.length > 0) clearAwait();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    input.value = "";
    if (!raw) return;

    clearAwait();
    audio.play("click");
    push(`> ${raw}`, "fth-console__line--in");
    handleCommand(raw);
  });
}
