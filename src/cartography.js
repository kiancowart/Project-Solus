/**
 * LATTICE.OS — Cartography / wire globe / Chart puzzles
 */

import { SYSTEM_CHART } from "../content/boot-content.js";
import {
  CHART_PUZZLES,
  PLANET_DOSSIERS,
  sealById,
} from "../content/arg-path.js";
import { audio } from "./audio.js";
import { prefersReducedMotion } from "./motion.js";
import {
  getHullProgress,
  isDossierUnlocked,
  markDossierUnlocked,
} from "./progress.js";
import { hasImperialClearance } from "./milestones.js";

/* ==========================================================================
   CARTOGRAPHY — The Nine orbital chart
   ========================================================================== */

export function polarToXY(cx, cy, r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function normalizeAnswer(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function answersMatch(input, answers) {
  const n = normalizeAnswer(input).replace(/[.\-]/g, "");
  return (answers ?? []).some((a) => {
    const t = normalizeAnswer(a).replace(/[.\-]/g, "");
    return t === n || normalizeAnswer(a) === normalizeAnswer(input);
  });
}

export function initCartography() {
  const mapHost = document.getElementById("chart-map");
  const readout = document.getElementById("chart-readout");
  const archiveEl = document.getElementById("chart-archive");
  const archiveBody = document.getElementById("chart-archive-body");
  if (!mapHost || !readout || !SYSTEM_CHART) return;

  const bodies = SYSTEM_CHART.bodies ?? [];
  const sturm = SYSTEM_CHART.sturm;
  const mystery = SYSTEM_CHART.mystery;
  const archive = SYSTEM_CHART.archive;
  const idle = SYSTEM_CHART.idle ?? "SELECT ORBITAL BODY";
  const errorText = SYSTEM_CHART.error ?? "GYROSCOPIC DATA SYNC ERROR";

  if (archiveEl && archiveBody && archive) {
    const title = archiveEl.querySelector(".chart-archive__title");
    if (title && archive.title) title.textContent = archive.title;
    archiveBody.innerHTML = `
      <p class="chart-archive__code">${archive.code ?? ""}</p>
      <p class="chart-archive__text">${archive.body ?? ""}</p>`;
  }

  const vb = 520;
  const cx = vb / 2;
  const cy = vb / 2;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${vb} ${vb}`);
  svg.setAttribute("class", "chart-svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "The Nine");

  const add = (tag, attrs = {}, parent = svg) => {
    const el = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    parent.appendChild(el);
    return el;
  };

  for (let i = 0; i < 28; i++) {
    add("circle", {
      class: "chart-svg__star",
      cx: 20 + ((i * 97) % (vb - 40)),
      cy: 18 + ((i * 53) % (vb - 36)),
      r: i % 5 === 0 ? 1.1 : 0.55,
    });
  }

  for (const body of bodies) {
    add("circle", {
      class: "chart-svg__orbit",
      cx,
      cy,
      r: body.r,
      fill: "none",
    });
  }

  add("circle", { class: "chart-svg__sun", cx, cy, r: 8 });

  let stopWire = null;
  let selectedId = null;
  let selectedG = null;

  const fitSelectBox = (g) => {
    const content = g.querySelector(".chart-svg__content");
    const box = g.querySelector(".chart-svg__box");
    if (!content || !box) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const include = (x0, y0, x1, y1) => {
      minX = Math.min(minX, x0);
      minY = Math.min(minY, y0);
      maxX = Math.max(maxX, x1);
      maxY = Math.max(maxY, y1);
    };

    content.querySelectorAll("circle").forEach((c) => {
      const r = Number(c.getAttribute("r") || 0);
      const x = Number(c.getAttribute("cx") || 0);
      const y = Number(c.getAttribute("cy") || 0);
      include(x - r, y - r, x + r, y + r);
    });

    content.querySelectorAll("text").forEach((t) => {
      const x = Number(t.getAttribute("x") || 0);
      const y = Number(t.getAttribute("y") || 0);
      const fs = Number.parseFloat(getComputedStyle(t).fontSize) || 8;
      let w = 0;
      try {
        w = t.getComputedTextLength();
      } catch {
        w = (t.textContent || "").length * fs * 0.62;
      }
      if (!w) w = (t.textContent || "").length * fs * 0.62;
      const anchor = t.getAttribute("text-anchor") || "start";
      let x0 = x;
      let x1 = x + w;
      if (anchor === "middle") {
        x0 = x - w / 2;
        x1 = x + w / 2;
      } else if (anchor === "end") {
        x0 = x - w;
        x1 = x;
      }
      include(x0, y - fs * 0.9, x1, y + fs * 0.3);
    });

    if (!Number.isFinite(minX)) return;

    const padLeft = 3.5;
    const padRight = 6.5;
    const padY = 2.5;
    box.setAttribute("x", String(minX - padLeft));
    box.setAttribute("y", String(minY - padY));
    box.setAttribute("width", String(maxX - minX + padLeft + padRight));
    box.setAttribute("height", String(maxY - minY + padY * 2));
  };

  const clearSelection = () => {
    if (selectedG) selectedG.classList.remove("is-selected");
    selectedId = null;
    selectedG = null;
  };

  const showIdle = () => {
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    readout.innerHTML = `<p class="chart__idle">${idle}</p>`;
  };

  const showError = () => {
    audio.play("open");
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    readout.innerHTML = `<p class="chart__error">${errorText}</p>`;
  };

  const showDossier = (planetId) => {
    const d = PLANET_DOSSIERS[planetId];
    if (!d) {
      showError();
      return;
    }
    audio.play("dropdownToggle");
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    const seal = sealById(d.sealId) ?? null;
    const showSealHeader = hasImperialClearance() && seal;
    const sealLine = showSealHeader
      ? `<p class="chart-dossier__slot">SEAL OF ${seal.name}</p>`
      : "";
    const facts = d.facts ?? d.body ?? "";
    const why = d.sealWhy ?? "";
    readout.innerHTML = `
      <div class="chart-dossier">
        <div class="wire-globe" aria-hidden="true">
          <svg class="wire-globe__svg" viewBox="0 0 100 100">
            <circle class="wire-globe__rim" cx="50" cy="50" r="44" fill="none" />
            <g class="wire-globe__lats"></g>
            <g class="wire-globe__lons"></g>
          </svg>
          <div class="wire-globe__scan"></div>
        </div>
        <p class="chart-dossier__title">${d.title}</p>
        ${sealLine}
        <p class="chart-dossier__body">${facts}</p>
        ${why ? `<p class="chart-dossier__body chart-dossier__body--seal">${why}</p>` : ""}
      </div>`;
    const globeSvg = readout.querySelector(".wire-globe__svg");
    if (globeSvg) stopWire = startWireGlobe(globeSvg);
  };

  const unlockAndShow = (planetId) => {
    markDossierUnlocked(planetId);
    audio.play("unlock");
    showDossier(planetId);
    window.dispatchEvent(
      new CustomEvent("lattice:dossier", { detail: { planetId } })
    );
    initFlightLogRefresh();
  };

  const initFlightLogRefresh = () => {
    import("./flight-log.js")
      .then((m) => m.initFlightLog.refreshAccess?.())
      .catch(() => {});
  };

  const shakeLock = (el) => {
    if (!el) return;
    el.classList.remove("is-shake");
    void el.offsetWidth;
    el.classList.add("is-shake");
    audio.play("deny");
  };

  const showPuzzle = (planetId) => {
    const puzzle = CHART_PUZZLES[planetId];
    const name = PLANET_DOSSIERS[planetId]?.title ?? planetId.toUpperCase();
    if (!puzzle) {
      showError();
      return;
    }

    audio.play("dropdownToggle");
    if (stopWire) {
      stopWire();
      stopWire = null;
    }

    if (puzzle.type === "flag") {
      const prog = getHullProgress();
      const ok = Boolean(prog[puzzle.hullFlag]);
      readout.innerHTML = `
        <div class="chart-lock" id="chart-lock">
          <p class="chart-lock__title">${name}</p>
          <p class="chart-lock__prompt">${puzzle.prompt}</p>
          <p class="chart-lock__hint">${puzzle.hint ?? ""}</p>
          <p class="chart-lock__feedback" id="chart-lock-feedback">${
            ok ? "FLAG SET — OPENING…" : "AWAITING TERMINAL FLAG"
          }</p>
        </div>`;
      if (ok) {
        requestAnimationFrame(() => unlockAndShow(planetId));
      }
      return;
    }

    if (puzzle.type === "sequence") {
      let seq = [];
      readout.innerHTML = `
        <div class="chart-lock" id="chart-lock">
          <p class="chart-lock__title">${name}</p>
          <p class="chart-lock__prompt">${puzzle.prompt}</p>
          <p class="chart-lock__hint">${puzzle.hint ?? ""}</p>
          <div class="chart-lock__nodes" id="chart-lock-nodes"></div>
          <p class="chart-lock__feedback" id="chart-lock-feedback" aria-live="polite"></p>
          <button type="button" class="chart-lock__reset" id="chart-lock-reset">RESET</button>
        </div>`;
      const host = readout.querySelector("#chart-lock-nodes");
      const feedback = readout.querySelector("#chart-lock-feedback");
      const lock = readout.querySelector("#chart-lock");
      const paint = () => {
        host.replaceChildren();
        (puzzle.nodes ?? []).forEach((node) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "chart-lock__node";
          btn.textContent = node.label;
          btn.dataset.id = node.id;
          if (seq.includes(node.id)) btn.classList.add("is-lit");
          btn.addEventListener("click", () => {
            if (seq.includes(node.id)) return;
            seq.push(node.id);
            btn.classList.add("is-lit");
            audio.play("click");
            if (seq.length === puzzle.answer.length) {
              const ok = seq.every((id, i) => id === puzzle.answer[i]);
              if (ok) unlockAndShow(planetId);
              else {
                if (feedback) feedback.textContent = "SEQUENCE REJECTED";
                shakeLock(lock);
                seq = [];
                host.querySelectorAll(".chart-lock__node").forEach((n) =>
                  n.classList.remove("is-lit")
                );
              }
            }
          });
          host.appendChild(btn);
        });
      };
      paint();
      readout.querySelector("#chart-lock-reset")?.addEventListener("click", () => {
        seq = [];
        if (feedback) feedback.textContent = "";
        paint();
        audio.play("click");
      });
      return;
    }

    if (puzzle.type === "reorder") {
      let order = (puzzle.lines ?? []).map((l) => l.id);
      const byId = Object.fromEntries((puzzle.lines ?? []).map((l) => [l.id, l]));
      const render = () => {
        readout.innerHTML = `
          <div class="chart-lock" id="chart-lock">
            <p class="chart-lock__title">${name}</p>
            <p class="chart-lock__prompt">${puzzle.prompt}</p>
            <p class="chart-lock__hint">${puzzle.hint ?? ""}</p>
            <ul class="chart-lock__lines" id="chart-lock-lines"></ul>
            <button type="button" class="chart-lock__submit" id="chart-lock-submit">COMMIT ORDER</button>
            <p class="chart-lock__feedback" id="chart-lock-feedback" aria-live="polite"></p>
          </div>`;
        const list = readout.querySelector("#chart-lock-lines");
        order.forEach((id, idx) => {
          const li = document.createElement("li");
          li.className = "chart-lock__line";
          li.innerHTML = `
            <span class="chart-lock__line-text">${byId[id]?.text ?? id}</span>
            <span class="chart-lock__line-ops">
              <button type="button" data-dir="up" data-idx="${idx}" aria-label="Move up">↑</button>
              <button type="button" data-dir="down" data-idx="${idx}" aria-label="Move down">↓</button>
            </span>`;
          list.appendChild(li);
        });
        list.querySelectorAll("button[data-dir]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const i = Number(btn.dataset.idx);
            const dir = btn.dataset.dir;
            const j = dir === "up" ? i - 1 : i + 1;
            if (j < 0 || j >= order.length) return;
            const next = [...order];
            [next[i], next[j]] = [next[j], next[i]];
            order = next;
            audio.play("click");
            render();
          });
        });
        readout.querySelector("#chart-lock-submit")?.addEventListener("click", () => {
          const ok = order.every((id, i) => id === puzzle.answer[i]);
          if (ok) unlockAndShow(planetId);
          else {
            const feedback = readout.querySelector("#chart-lock-feedback");
            if (feedback) feedback.textContent = "HYMN REJECTED";
            shakeLock(readout.querySelector("#chart-lock"));
          }
        });
      };
      render();
      return;
    }

    if (puzzle.type === "assemble") {
      let slots = Array(puzzle.answer.length).fill(null);
      const pool = [...(puzzle.pieces ?? [])];
      const render = () => {
        readout.innerHTML = `
          <div class="chart-lock" id="chart-lock">
            <p class="chart-lock__title">${name}</p>
            <p class="chart-lock__prompt">${puzzle.prompt}</p>
            <p class="chart-lock__hint">${puzzle.hint ?? ""}</p>
            <div class="chart-lock__slots" id="chart-lock-slots"></div>
            <div class="chart-lock__pool" id="chart-lock-pool"></div>
            <button type="button" class="chart-lock__submit" id="chart-lock-submit">SEAL SIGIL</button>
            <p class="chart-lock__feedback" id="chart-lock-feedback" aria-live="polite"></p>
          </div>`;
        const slotsEl = readout.querySelector("#chart-lock-slots");
        const poolEl = readout.querySelector("#chart-lock-pool");
        slots.forEach((piece, i) => {
          const slot = document.createElement("button");
          slot.type = "button";
          slot.className = "chart-lock__slot";
          slot.textContent = piece ?? "·";
          slot.addEventListener("click", () => {
            if (!slots[i]) return;
            pool.push(slots[i]);
            slots[i] = null;
            audio.play("click");
            render();
          });
          slotsEl.appendChild(slot);
        });
        pool.forEach((piece) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "chart-lock__piece";
          btn.textContent = piece;
          btn.addEventListener("click", () => {
            const empty = slots.findIndex((s) => s == null);
            if (empty < 0) return;
            slots[empty] = piece;
            const pi = pool.indexOf(piece);
            if (pi >= 0) pool.splice(pi, 1);
            audio.play("click");
            render();
          });
          poolEl.appendChild(btn);
        });
        readout.querySelector("#chart-lock-submit")?.addEventListener("click", () => {
          const ok = slots.every((p, i) => p === puzzle.answer[i]);
          if (ok) unlockAndShow(planetId);
          else {
            const feedback = readout.querySelector("#chart-lock-feedback");
            if (feedback) feedback.textContent = "SIGIL REJECTED";
            shakeLock(readout.querySelector("#chart-lock"));
          }
        });
      };
      render();
      return;
    }

    if (puzzle.type === "dial") {
      let step = 0;
      const render = () => {
        readout.innerHTML = `
          <div class="chart-lock" id="chart-lock">
            <p class="chart-lock__title">${name}</p>
            <p class="chart-lock__prompt">${puzzle.prompt}</p>
            <p class="chart-lock__hint">${puzzle.hint ?? ""}</p>
            <div class="chart-lock__dial">
              <button type="button" class="chart-lock__dial-btn" id="chart-dial-ccw" aria-label="Rotate counter-clockwise">↺</button>
              <p class="chart-lock__dial-readout">TICK ${step} / ${puzzle.steps - 1}</p>
              <button type="button" class="chart-lock__dial-btn" id="chart-dial-cw" aria-label="Rotate clockwise">↻</button>
            </div>
            <button type="button" class="chart-lock__submit" id="chart-lock-submit">LOCK ALIGNMENT</button>
            <p class="chart-lock__feedback" id="chart-lock-feedback" aria-live="polite"></p>
          </div>`;
        const wrap = (n) => ((n % puzzle.steps) + puzzle.steps) % puzzle.steps;
        readout.querySelector("#chart-dial-cw")?.addEventListener("click", () => {
          step = wrap(step + 1);
          audio.play("click");
          render();
        });
        readout.querySelector("#chart-dial-ccw")?.addEventListener("click", () => {
          step = wrap(step - 1);
          audio.play("click");
          render();
        });
        readout.querySelector("#chart-lock-submit")?.addEventListener("click", () => {
          if (step === puzzle.answer) unlockAndShow(planetId);
          else {
            const feedback = readout.querySelector("#chart-lock-feedback");
            if (feedback) feedback.textContent = "SHADOW MISALIGNED";
            shakeLock(readout.querySelector("#chart-lock"));
          }
        });
      };
      render();
      return;
    }

    // text
    readout.innerHTML = `
      <div class="chart-lock" id="chart-lock">
        <p class="chart-lock__title">${name}</p>
        <p class="chart-lock__prompt">${puzzle.prompt}</p>
        <p class="chart-lock__hint">${puzzle.hint ?? ""}</p>
        <form class="chart-lock__form" id="chart-lock-form" autocomplete="off">
          <label class="visually-hidden" for="chart-lock-input">Puzzle answer</label>
          <input class="chart-lock__input" id="chart-lock-input" type="text" spellcheck="false" />
          <button type="submit" class="chart-lock__submit">SUBMIT</button>
        </form>
        <p class="chart-lock__feedback" id="chart-lock-feedback" aria-live="polite"></p>
      </div>`;
    const form = readout.querySelector("#chart-lock-form");
    const input = readout.querySelector("#chart-lock-input");
    input?.focus();
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (answersMatch(input?.value, puzzle.answers)) unlockAndShow(planetId);
      else {
        const feedback = readout.querySelector("#chart-lock-feedback");
        if (feedback) feedback.textContent = "REJECTED";
        shakeLock(readout.querySelector("#chart-lock"));
      }
    });
  };

  const selectPlanet = (planetId) => {
    if (isDossierUnlocked(planetId)) showDossier(planetId);
    else showPuzzle(planetId);
  };

  const showSturm = () => {
    audio.play("dropdownToggle");
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    readout.innerHTML = `
      <div class="chart-sturm">
        <div class="wire-globe" aria-hidden="true">
          <svg class="wire-globe__svg" viewBox="0 0 100 100">
            <circle class="wire-globe__rim" cx="50" cy="50" r="44" fill="none" />
            <g class="wire-globe__lats"></g>
            <g class="wire-globe__lons"></g>
          </svg>
          <div class="wire-globe__scan"></div>
        </div>
        <p class="chart-sturm__name">${sturm.name}</p>
        <p class="chart-sturm__meta">UROS · LOCAL FIX · ▽</p>
        <p class="chart-sturm__blurb">${sturm.blurb ?? ""}</p>
      </div>`;
    const globeSvg = readout.querySelector(".wire-globe__svg");
    if (globeSvg) stopWire = startWireGlobe(globeSvg);
  };

  const showMystery = () => {
    audio.play("dropdownToggle");
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    const text =
      mystery?.readout ??
      "NU LUNAE // AUX bleed — not Imperial.";
    readout.innerHTML = `<p class="chart__mystery">${text}</p>`;
  };

  const toggleSelect = (id, g, onSelect) => {
    if (selectedId === id) {
      clearSelection();
      showIdle();
      return;
    }
    clearSelection();
    selectedId = id;
    selectedG = g;
    g.classList.add("is-selected");
    onSelect();
  };

  const sunHit = add("circle", { class: "chart-svg__hit", cx, cy, r: 14 });
  sunHit.addEventListener("click", () => {
    clearSelection();
    showError();
  });

  const movers = [];

  const bindBody = (g, id, onSelect) => {
    g.style.cursor = "pointer";
    const activate = () => toggleSelect(id, g, onSelect);
    g.addEventListener("click", activate);
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  };

  bodies.forEach((body) => {
    const g = add("g", {
      class: "chart-svg__body",
      tabindex: "0",
      role: "button",
      "aria-label": body.name,
    });
    g.dataset.body = body.id;
    const { x, y } = polarToXY(cx, cy, body.r, body.angle);

    add("rect", { class: "chart-svg__box", x: 0, y: 0, width: 1, height: 1 }, g);
    add(
      "circle",
      { class: "chart-svg__hit", cx: 0, cy: 0, r: Math.max(12, body.size + 8) },
      g
    );
    const content = add("g", { class: "chart-svg__content" }, g);
    add("circle", { class: "chart-svg__dot", cx: 0, cy: 0, r: body.size }, content);
    const label = add(
      "text",
      { class: "chart-svg__label", x: body.size + 4, y: 2.5 },
      content
    );
    label.textContent = body.name;
    g.setAttribute("transform", `translate(${x} ${y})`);
    bindBody(g, body.id, () => selectPlanet(body.id));

    movers.push({
      g,
      r: body.r,
      angle: body.angle,
      speed: 4.5 / Math.sqrt(body.r),
      id: body.id,
    });
  });

  const makeSatellite = (cfg, className, ariaLabel, onSelect) => {
    if (!cfg) return null;
    const g = add("g", {
      class: className,
      tabindex: "0",
      role: "button",
      "aria-label": ariaLabel,
    });
    g.dataset.body = cfg.id;

    const parent = bodies.find((b) => b.id === cfg.parent);
    const parentXY = parent
      ? polarToXY(cx, cy, parent.r, parent.angle)
      : { x: cx, y: cy };
    const xy = polarToXY(
      parentXY.x,
      parentXY.y,
      cfg.offset ?? 16,
      cfg.angle ?? 0
    );

    add("rect", { class: "chart-svg__box", x: 0, y: 0, width: 1, height: 1 }, g);
    add("circle", { class: "chart-svg__hit", cx: 0, cy: 0, r: 14 }, g);
    const content = add("g", { class: "chart-svg__content" }, g);
    const mark = add(
      "text",
      { class: "chart-svg__mark", x: 0, y: 4, "text-anchor": "middle" },
      content
    );
    mark.textContent = cfg.mark ?? "▽";
    if (cfg.name) {
      const label = add(
        "text",
        { class: "chart-svg__label chart-svg__label--sturm", x: 8, y: 3 },
        content
      );
      label.textContent = cfg.name;
    }
    g.setAttribute("transform", `translate(${xy.x} ${xy.y})`);
    bindBody(g, cfg.id, onSelect);

    return {
      g,
      parentId: cfg.parent,
      offset: cfg.offset ?? 16,
      angle: cfg.angle ?? 0,
      speed: cfg.speed ?? 18,
    };
  };

  const sturmMover = makeSatellite(
    sturm ? { ...sturm, mark: "▽" } : null,
    "chart-svg__sturm",
    `${sturm?.name ?? "Sturm"}, current location`,
    showSturm
  );

  const mysteryMover = makeSatellite(
    mystery,
    "chart-svg__mystery",
    "Nu Lunae anomaly in Teavicta orbit",
    showMystery
  );

  mapHost.replaceChildren(svg);
  const refitAll = () => {
    svg
      .querySelectorAll(".chart-svg__body, .chart-svg__sturm, .chart-svg__mystery")
      .forEach((g) => fitSelectBox(g));
  };
  refitAll();
  requestAnimationFrame(refitAll);
  if (document.fonts?.ready) document.fonts.ready.then(refitAll);

  showIdle();

  // Re-check flag puzzles when returning from Terminal
  window.addEventListener("lattice:hull", () => {
    if (!selectedId || !CHART_PUZZLES[selectedId]) return;
    if (isDossierUnlocked(selectedId)) return;
    if (CHART_PUZZLES[selectedId].type === "flag") {
      selectPlanet(selectedId);
    }
  });

  if (!prefersReducedMotion()) {
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const pos = Object.create(null);
      for (const m of movers) {
        m.angle += m.speed * dt;
        const { x, y } = polarToXY(cx, cy, m.r, m.angle);
        m.g.setAttribute("transform", `translate(${x} ${y})`);
        pos[m.id] = { x, y };
      }

      const tickSat = (sat) => {
        if (!sat) return;
        sat.angle += sat.speed * dt;
        let parent = pos[sat.parentId];
        if (!parent) {
          const m = movers.find((entry) => entry.id === sat.parentId);
          if (m) parent = polarToXY(cx, cy, m.r, m.angle);
        }
        if (parent) {
          const s = polarToXY(parent.x, parent.y, sat.offset, sat.angle);
          sat.g.setAttribute("transform", `translate(${s.x} ${s.y})`);
        }
      };

      tickSat(sturmMover);
      tickSat(mysteryMover);

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

/**
 * 2D wireframe globe with sphere-projected (bowed) latitudes & longitudes.
 */
export function startWireGlobe(svg) {
  const svgNS = "http://www.w3.org/2000/svg";
  const lats = svg.querySelector(".wire-globe__lats");
  const lons = svg.querySelector(".wire-globe__lons");
  if (!lats || !lons) return () => {};

  const cx = 50;
  const cy = 50;
  const R = 44;
  const tilt = 0.42;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const yScale = 1 / cosT;
  const latCount = 5;
  const lonCount = 7;
  const samples = 32;

  const project = (lon, lat) => {
    const cl = Math.cos(lat);
    const x = R * cl * Math.sin(lon);
    const y = R * Math.sin(lat);
    const z = R * cl * Math.cos(lon);
    const yt = y * cosT - z * sinT;
    const zt = y * sinT + z * cosT;
    return { x: cx + x, y: cy + yt * yScale, z: zt };
  };

  const pathFromPoints = (pts) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
    }
    return d;
  };

  let clip = svg.querySelector("#wire-globe-clip");
  if (!clip) {
    const defs = document.createElementNS(svgNS, "defs");
    clip = document.createElementNS(svgNS, "clipPath");
    clip.setAttribute("id", "wire-globe-clip");
    const clipCircle = document.createElementNS(svgNS, "circle");
    clipCircle.setAttribute("cx", String(cx));
    clipCircle.setAttribute("cy", String(cy));
    clipCircle.setAttribute("r", String(R));
    clip.appendChild(clipCircle);
    defs.appendChild(clip);
    svg.insertBefore(defs, svg.firstChild);
  }
  lats.setAttribute("clip-path", "url(#wire-globe-clip)");
  lons.setAttribute("clip-path", "url(#wire-globe-clip)");

  for (let i = 1; i < latCount; i++) {
    const lat = -Math.PI / 2 + (Math.PI * i) / latCount;
    const pts = [];
    for (let s = 0; s <= samples; s++) {
      const lon = -Math.PI / 2 + (Math.PI * s) / samples;
      pts.push(project(lon, lat));
    }
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("class", "wire-globe__lat");
    path.setAttribute("d", pathFromPoints(pts));
    path.setAttribute("fill", "none");
    lats.appendChild(path);
  }

  const lonPaths = [];
  for (let i = 0; i < lonCount; i++) {
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("class", "wire-globe__lon");
    path.setAttribute("fill", "none");
    lons.appendChild(path);
    lonPaths.push(path);
  }

  const setMeridian = (path, lon, opacity) => {
    const pts = [];
    for (let s = 0; s <= samples; s++) {
      const lat = -Math.PI / 2 + (Math.PI * s) / samples;
      pts.push(project(lon, lat));
    }
    path.setAttribute("d", pathFromPoints(pts));
    path.setAttribute("opacity", String(opacity));
  };

  let raf = 0;
  let alive = true;
  const t0 = performance.now();
  const periodMs = 11000;

  const draw = (now) => {
    if (!alive) return;
    const phase = ((now - t0) % periodMs) / periodMs;
    for (let i = 0; i < lonCount; i++) {
      let u = phase + i / lonCount;
      u -= Math.floor(u);
      const lon = -Math.PI / 2 + Math.PI * u;
      const edge = Math.abs(u - 0.5) * 2;
      const opacity = 0.35 + 0.65 * (1 - edge * 0.55);
      setMeridian(lonPaths[i], lon, opacity);
    }
    raf = requestAnimationFrame(draw);
  };

  if (prefersReducedMotion()) {
    for (let i = 0; i < lonCount; i++) {
      const u = (i + 0.5) / lonCount;
      const lon = -Math.PI / 2 + Math.PI * u;
      setMeridian(lonPaths[i], lon, 0.75);
    }
    return () => {};
  }

  raf = requestAnimationFrame(draw);
  return () => {
    alive = false;
    cancelAnimationFrame(raf);
  };
}
