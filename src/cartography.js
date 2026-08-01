/**
 * LATTICE.OS — Cartography / wire globe / Chart puzzles
 */

import { SYSTEM_CHART } from "../content/boot-content.js";
import {
  CHART_PUZZLES,
  PLANET_DOSSIERS,
  sealById,
  PARTNER_MORSE,
  morseCodesMatch,
} from "../content/arg-path.js";
import { audio } from "./audio.js";
import {
  prefersReducedMotion,
  scrambleText,
  descrambleText,
} from "./motion.js";
import {
  isDossierUnlocked,
  markDossierUnlocked,
  getVolTrayPlanets,
  hasSeenDescramble,
  markDescrambleSeen,
} from "./progress.js";
import { hasImperialClearance } from "./clearance.js";
import {
  getDisplayLocalTime,
  getRealLocalTime,
  isChronoAligned,
  lockChronoAligned,
  glitchChronoPart,
  nudgeHourOffset,
  nudgeMinuteOffset,
  resetChronoOffsets,
} from "./chrono.js";
import {
  getCompassCardinal,
  glitchCompass,
  resetCompass,
  setCompassCardinal,
} from "./compass.js";

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

  const IKEPH_ARCHIVE = {
    code: "CART.ARCHIVE // STATUS=PARTIAL · ANCHOR BLEED",
    body:
      "Corrupt extract hitch on Ikeph. Latched residue overheard — Terminal accepts hidden command /passage.",
  };

  const paintArchive = (forPlanetId = null) => {
    if (!archiveBody || !archive) return;
    const showPassageHint =
      forPlanetId === "ikeph" && !isDossierUnlocked("ikeph");
    const code = showPassageHint ? IKEPH_ARCHIVE.code : (archive.code ?? "");
    const body = showPassageHint ? IKEPH_ARCHIVE.body : (archive.body ?? "");
    archiveBody.innerHTML = `
      <p class="chart-archive__code">${code}</p>
      <p class="chart-archive__text">${body}</p>`;
    archiveEl?.classList.toggle("is-live", showPassageHint);
  };

  if (archiveEl && archive) {
    const title = archiveEl.querySelector(".chart-archive__title");
    if (title && archive.title) title.textContent = archive.title;
    paintArchive(null);
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

  const showIdle = () => {
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    paintArchive(null);
    readout.innerHTML = `<p class="chart__idle">${idle}</p>`;
  };

  const showError = () => {
    audio.play("open");
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    paintArchive(null);
    readout.innerHTML = `<p class="chart__error">${errorText}</p>`;
  };

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
    paintArchive(null);
  };

  const showDossier = (planetId, { scanIn = false } = {}) => {
    const d = PLANET_DOSSIERS[planetId];
    if (!d) {
      showError();
      return;
    }
    if (!scanIn) audio.play("dropdownToggle");
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    paintArchive(planetId);
    const seal = sealById(d.sealId) ?? null;
    const showSealHeader = hasImperialClearance() && seal;
    const sealLine = showSealHeader
      ? `<p class="chart-dossier__slot">SEAL OF ${seal.name}</p>`
      : "";
    const facts = d.facts ?? d.body ?? "";
    const why = d.sealWhy ?? "";
    const scanClass = scanIn ? " is-scanning-in" : "";
    readout.innerHTML = `
      <div class="chart-dossier${scanClass}">
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
    if (scanIn && !prefersReducedMotion()) {
      audio.play("revealScan", { durationMs: 720, gainScale: 2.6 });
    }
  };

  let unlockRevealTimer = 0;
  let unlockRevealBusy = false;

  const unlockAndShow = (planetId) => {
    if (unlockRevealBusy) return;
    if (isDossierUnlocked(planetId)) {
      showDossier(planetId);
      return;
    }
    unlockRevealBusy = true;
    markDossierUnlocked(planetId);
    audio.play("unlock");
    if (planetId === "terra") lockChronoAligned();
    paintArchive(planetId);
    if (planetId === "teavicta") resetCompass({ animate: true });
    window.dispatchEvent(
      new CustomEvent("lattice:dossier", { detail: { planetId } })
    );
    initFlightLogRefresh();

    const lock = readout.querySelector(".chart-lock");
    const finish = () => {
      unlockRevealTimer = 0;
      unlockRevealBusy = false;
      refreshPlanetLabels({ animate: false });
      showDossier(planetId, { scanIn: true });
    };

    window.clearTimeout(unlockRevealTimer);
    if (lock && !prefersReducedMotion()) {
      lock.classList.add("is-purging");
      lock.setAttribute("aria-busy", "true");
      audio.playGlitchBurst({ count: 4, gapMs: 55 });
      unlockRevealTimer = window.setTimeout(finish, 480);
    } else {
      finish();
    }
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

  /** Match number-pad DENIED flash duration (src/boot.js). */
  const DENY_FLASH_MS = 700;
  let denyFlashTimer = 0;

  const flashDenyFeedback = (feedback, message = "DENIED") => {
    if (!feedback) return;
    window.clearTimeout(denyFlashTimer);
    feedback.textContent = message;
    feedback.classList.add("is-deny");
    denyFlashTimer = window.setTimeout(() => {
      feedback.textContent = "";
      feedback.classList.remove("is-deny");
      denyFlashTimer = 0;
    }, DENY_FLASH_MS);
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
    paintArchive(planetId);

    if (puzzle.type === "orbit-order") {
      const need = puzzle.requireDossiers ?? 3;
      const orbitAnswer =
        puzzle.answer ?? (SYSTEM_CHART.bodies ?? []).map((b) => b.id);
      const orbitRank = Object.fromEntries(
        orbitAnswer.map((id, i) => [id, i])
      );
      const nameById = Object.fromEntries(
        (SYSTEM_CHART.bodies ?? []).map((b) => [b.id, b.name])
      );
      const collected = getVolTrayPlanets({
        limit: need,
        exclude: planetId,
      });
      /** Chips currently seated on the order bar (inner→outer L→R). */
      let barOrder = [];
      let dragId = null;
      let dragFrom = null;
      let ghostEl = null;

      const trayIds = () => collected.filter((id) => !barOrder.includes(id));

      const correctOrder = () =>
        [...collected].sort(
          (a, b) => (orbitRank[a] ?? 99) - (orbitRank[b] ?? 99)
        );

      const orderMatches = () => {
        if (collected.length < need || barOrder.length !== need) return false;
        const want = correctOrder();
        return barOrder.every((id, i) => id === want[i]);
      };

      const clearGhost = () => {
        ghostEl?.remove();
        ghostEl = null;
      };

      const placeGhost = (id, clientX, clientY) => {
        const lockEl = readout.querySelector("#chart-lock");
        if (!lockEl) return;
        if (!ghostEl) {
          ghostEl = document.createElement("div");
          ghostEl.className = "chart-lock__orbit-ghost";
          ghostEl.setAttribute("aria-hidden", "true");
          lockEl.appendChild(ghostEl);
        }
        ghostEl.textContent = (nameById[id] ?? id).toUpperCase();
        const rect = lockEl.getBoundingClientRect();
        const w = ghostEl.offsetWidth || 72;
        const h = ghostEl.offsetHeight || 32;
        ghostEl.style.transform = `translate(${clientX - rect.left - w / 2}px, ${clientY - rect.top - h / 2}px)`;
      };

      const paint = () => {
        const bar = readout.querySelector("#orbit-bar");
        const tray = readout.querySelector("#orbit-tray");
        const status = readout.querySelector("#orbit-tray-status");
        if (!bar || !tray) return;

        const fillZone = (host, ids, zone) => {
          host.replaceChildren();
          for (let i = 0; i < need; i++) {
            const slot = document.createElement("div");
            slot.className = "chart-lock__orbit-slot";
            slot.dataset.slot = String(i);
            slot.dataset.zone = zone;
            const id = ids[i];
            if (id) {
              const chip = document.createElement("button");
              chip.type = "button";
              chip.className = "chart-lock__orbit-chip";
              chip.dataset.id = id;
              chip.dataset.zone = zone;
              chip.textContent = (nameById[id] ?? id).toUpperCase();
              chip.setAttribute(
                "aria-label",
                `${nameById[id] ?? id}, drag between tray and order bar`
              );
              chip.addEventListener("pointerdown", (e) => {
                if (e.button !== 0) return;
                dragId = id;
                dragFrom = zone;
                chip.classList.add("is-dragging");
                chip.setPointerCapture(e.pointerId);
                placeGhost(id, e.clientX, e.clientY);
                audio.play("click");
              });
              chip.addEventListener("pointermove", (e) => {
                if (dragId !== id) return;
                placeGhost(id, e.clientX, e.clientY);
              });
              chip.addEventListener("pointerup", (e) => {
                if (dragId !== id) return;
                const under = document.elementFromPoint(e.clientX, e.clientY);
                chip.classList.remove("is-dragging");
                clearGhost();
                try {
                  chip.releasePointerCapture(e.pointerId);
                } catch {
                  /* ignore */
                }
                const overChip = under?.closest?.(".chart-lock__orbit-chip");
                const overSlot = under?.closest?.(".chart-lock__orbit-slot");
                const resolvedZone =
                  overChip?.dataset.zone ||
                  overSlot?.dataset.zone ||
                  (under?.closest?.("#orbit-bar") ? "bar" : null) ||
                  (under?.closest?.("#orbit-tray") ? "tray" : null);

                if (dragFrom === "tray" && resolvedZone === "bar") {
                  if (!barOrder.includes(id) && barOrder.length < need) {
                    const slotIdx = overSlot
                      ? Number(overSlot.dataset.slot)
                      : barOrder.length;
                    const next = [...barOrder];
                    const at = Number.isFinite(slotIdx)
                      ? Math.min(Math.max(0, slotIdx), next.length)
                      : next.length;
                    next.splice(at, 0, id);
                    barOrder = next.slice(0, need);
                  }
                } else if (dragFrom === "bar" && resolvedZone === "tray") {
                  barOrder = barOrder.filter((x) => x !== id);
                } else if (
                  dragFrom === "bar" &&
                  resolvedZone === "bar" &&
                  overChip &&
                  overChip !== chip
                ) {
                  const from = barOrder.indexOf(id);
                  const to = barOrder.indexOf(overChip.dataset.id);
                  if (from >= 0 && to >= 0 && from !== to) {
                    const next = [...barOrder];
                    next.splice(from, 1);
                    next.splice(to, 0, id);
                    barOrder = next;
                  }
                } else if (
                  dragFrom === "bar" &&
                  resolvedZone === "bar" &&
                  overSlot &&
                  !overChip
                ) {
                  const from = barOrder.indexOf(id);
                  let to = Number(overSlot.dataset.slot);
                  if (from >= 0 && Number.isFinite(to)) {
                    const next = [...barOrder];
                    next.splice(from, 1);
                    to = Math.min(to, next.length);
                    next.splice(to, 0, id);
                    barOrder = next;
                  }
                }

                dragId = null;
                dragFrom = null;
                paint();
              });
              chip.addEventListener("pointercancel", () => {
                chip.classList.remove("is-dragging");
                clearGhost();
                dragId = null;
                dragFrom = null;
              });
              slot.appendChild(chip);
              slot.classList.add("is-filled");
            }
            host.appendChild(slot);
          }
        };

        fillZone(bar, barOrder, "bar");
        fillZone(tray, trayIds(), "tray");
        if (status) {
          status.textContent = `RECOVERED ${collected.length}/${need}`;
        }
      };

      readout.innerHTML = `
        <div class="chart-lock chart-lock--orbit" id="chart-lock">
          <p class="chart-lock__title">${name}</p>
          <p class="chart-lock__prompt">${puzzle.prompt}</p>
          <p class="chart-lock__hint">${puzzle.hint ?? ""}</p>
          <p class="chart-lock__orbit-legend" aria-hidden="true">
            <span>INNER</span><span class="chart-lock__orbit-legend-arrow">→</span><span>OUTER</span>
          </p>
          <div
            class="chart-lock__orbit-bar"
            id="orbit-bar"
            role="list"
            aria-label="Orbital order bar, inner to outer left to right"
          ></div>
          <p class="chart-lock__orbit-tray-label" id="orbit-tray-status">RECOVERED ${collected.length}/${need}</p>
          <div
            class="chart-lock__orbit-tray"
            id="orbit-tray"
            role="list"
            aria-label="Recovered dossier purges"
          ></div>
          <div class="chart-lock__orbit-ops">
            <button type="button" class="chart-lock__reset" id="orbit-reset">RESET</button>
            <button type="button" class="chart-lock__submit" id="orbit-commit">COMMIT</button>
          </div>
          <p class="chart-lock__feedback" id="chart-lock-feedback" aria-live="polite"></p>
        </div>`;

      const feedback = readout.querySelector("#chart-lock-feedback");
      const lock = readout.querySelector("#chart-lock");
      paint();

      readout.querySelector("#orbit-reset")?.addEventListener("click", () => {
        barOrder = [];
        clearGhost();
        dragId = null;
        dragFrom = null;
        if (feedback) {
          feedback.textContent = "";
          feedback.classList.remove("is-deny");
        }
        paint();
        audio.play("click");
      });
      readout.querySelector("#orbit-commit")?.addEventListener("click", () => {
        if (collected.length < need) {
          flashDenyFeedback(
            feedback,
            `NEED ${need} PURGES — ${collected.length} / ${need}`
          );
          shakeLock(lock);
          return;
        }
        if (orderMatches()) unlockAndShow(planetId);
        else {
          flashDenyFeedback(feedback, "ORBITAL STACK REJECTED");
          shakeLock(lock);
        }
      });
      return;
    }

    if (puzzle.type === "cardinal-eye") {
      const answer = puzzle.answer ?? ["E", "W", "N", "S"];
      let step = 0;
      resetCompass({ animate: false });

      readout.innerHTML = `
        <div class="chart-lock chart-lock--eye" id="chart-lock">
          <p class="chart-lock__title">${name}</p>
          <p class="chart-lock__prompt">${puzzle.prompt}</p>
          <p class="chart-lock__hint">${puzzle.hint ?? ""}</p>
          <div class="chart-eye" id="chart-eye">
            <svg
              class="chart-eye__svg"
              viewBox="0 0 220 180"
              aria-hidden="true"
            >
              <!-- Diamond eye -->
              <polygon
                class="chart-eye__lid"
                points="110,42 188,90 110,138 32,90"
                fill="none"
              />
              <!-- Inverted triangle pupil (outline) -->
              <polygon
                class="chart-eye__pupil"
                id="chart-eye-pupil"
                points="110,108 92,74 128,74"
              />
              <!-- Cardinal chevrons outside vertices -->
              <path class="chart-eye__chevron" data-dir="N" d="M98 30 L110 16 L122 30" fill="none" />
              <path class="chart-eye__chevron" data-dir="E" d="M196 78 L210 90 L196 102" fill="none" />
              <path class="chart-eye__chevron" data-dir="S" d="M98 150 L110 164 L122 150" fill="none" />
              <path class="chart-eye__chevron" data-dir="W" d="M24 78 L10 90 L24 102" fill="none" />
            </svg>
            <button type="button" class="chart-eye__arrow chart-eye__arrow--n" data-dir="N" aria-label="Look north"></button>
            <button type="button" class="chart-eye__arrow chart-eye__arrow--e" data-dir="E" aria-label="Look east"></button>
            <button type="button" class="chart-eye__arrow chart-eye__arrow--s" data-dir="S" aria-label="Look south"></button>
            <button type="button" class="chart-eye__arrow chart-eye__arrow--w" data-dir="W" aria-label="Look west"></button>
          </div>
          <p class="chart-lock__feedback" id="chart-lock-feedback" aria-live="polite"></p>
        </div>`;

      const lock = readout.querySelector("#chart-lock");
      const eye = readout.querySelector("#chart-eye");
      const pupil = readout.querySelector("#chart-eye-pupil");
      const feedback = readout.querySelector("#chart-lock-feedback");

      const lookOffsets = {
        N: "0 -8",
        E: "10 0",
        S: "0 8",
        W: "-10 0",
      };

      const setLook = (dir) => {
        eye?.setAttribute("data-look", dir || "");
        eye?.querySelectorAll(".chart-eye__chevron").forEach((c) => {
          c.classList.toggle("is-active", Boolean(dir) && c.dataset.dir === dir);
        });
        const off = lookOffsets[dir] ?? "0 0";
        if (pupil) {
          pupil.style.transform = dir
            ? `translate(${off.split(" ")[0]}px, ${off.split(" ")[1]}px)`
            : "";
        }
      };

      readout.querySelectorAll(".chart-eye__arrow").forEach((btn) => {
        btn.addEventListener("click", () => {
          const dir = btn.dataset.dir;
          if (!dir) return;
          setLook(dir);
          const needed = answer[step];
          const facing = getCompassCardinal();
          // Required look matches current compass facing (starts East)
          if (dir === needed && dir === facing) {
            audio.play("click");
            glitchCompass();
            step += 1;
            if (step >= answer.length) {
              unlockAndShow(planetId);
              return;
            }
            setCompassCardinal(answer[step], { animate: true });
            return;
          }
          shakeLock(lock);
          step = 0;
          resetCompass({ animate: true });
          window.setTimeout(() => setLook(""), 280);
        });
      });
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
                flashDenyFeedback(feedback);
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
        window.clearTimeout(denyFlashTimer);
        denyFlashTimer = 0;
        if (feedback) {
          feedback.textContent = "";
          feedback.classList.remove("is-deny");
        }
        paint();
        audio.play("click");
      });
      return;
    }

    if (puzzle.type === "reorder") {
      let order = (puzzle.lines ?? []).map((l) => l.id);
      const byId = Object.fromEntries((puzzle.lines ?? []).map((l) => [l.id, l]));
      let swapping = false;

      const syncLineButtons = (list) => {
        list.querySelectorAll(".chart-lock__line").forEach((li, idx) => {
          li.querySelectorAll("button[data-dir]").forEach((btn) => {
            btn.dataset.idx = String(idx);
          });
        });
      };

      const bindLineOps = (list) => {
        list.querySelectorAll("button[data-dir]").forEach((btn) => {
          btn.addEventListener("click", () => {
            if (swapping) return;
            const i = Number(btn.dataset.idx);
            const dir = btn.dataset.dir;
            const j = dir === "up" ? i - 1 : i + 1;
            if (j < 0 || j >= order.length) return;

            const next = [...order];
            [next[i], next[j]] = [next[j], next[i]];
            order = next;
            audio.play("click");

            const items = [...list.children];
            const a = items[i];
            const b = items[j];
            if (!a || !b) {
              paintLines();
              return;
            }

            if (prefersReducedMotion()) {
              paintLines();
              return;
            }

            const firstA = a.getBoundingClientRect();
            const firstB = b.getBoundingClientRect();

            if (i < j) list.insertBefore(b, a);
            else list.insertBefore(a, b);

            syncLineButtons(list);

            const lastA = a.getBoundingClientRect();
            const lastB = b.getBoundingClientRect();
            const dxA = firstA.left - lastA.left;
            const dyA = firstA.top - lastA.top;
            const dxB = firstB.left - lastB.left;
            const dyB = firstB.top - lastB.top;

            swapping = true;
            a.classList.add("is-swapping");
            b.classList.add("is-swapping");
            a.style.transform = `translate(${dxA}px, ${dyA}px)`;
            b.style.transform = `translate(${dxB}px, ${dyB}px)`;

            const clearSwap = (el) => {
              el.classList.remove("is-swapping");
              el.style.transform = "";
            };

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                a.style.transform = "translate(0, 0)";
                b.style.transform = "translate(0, 0)";
              });
            });

            let pending = 2;
            const onEnd = (ev) => {
              if (ev.propertyName !== "transform") return;
              const el = ev.currentTarget;
              el.removeEventListener("transitionend", onEnd);
              clearSwap(el);
              pending -= 1;
              if (pending <= 0) swapping = false;
            };
            a.addEventListener("transitionend", onEnd);
            b.addEventListener("transitionend", onEnd);
            window.setTimeout(() => {
              if (!swapping) return;
              clearSwap(a);
              clearSwap(b);
              swapping = false;
            }, 320);
          });
        });
      };

      const paintLines = () => {
        const list = readout.querySelector("#chart-lock-lines");
        if (!list) return;
        list.replaceChildren();
        order.forEach((id, idx) => {
          const li = document.createElement("li");
          li.className = "chart-lock__line";
          li.dataset.lineId = id;
          li.innerHTML = `
            <span class="chart-lock__line-text">${byId[id]?.glyph ?? byId[id]?.text ?? id}</span>
            <span class="chart-lock__line-ops">
              <button type="button" data-dir="up" data-idx="${idx}" aria-label="Move up">↑</button>
              <button type="button" data-dir="down" data-idx="${idx}" aria-label="Move down">↓</button>
            </span>`;
          list.appendChild(li);
        });
        bindLineOps(list);
      };

      readout.innerHTML = `
        <div class="chart-lock" id="chart-lock">
          <p class="chart-lock__title">${name}</p>
          <p class="chart-lock__prompt">${puzzle.prompt}</p>
          <p class="chart-lock__hint">${puzzle.hint ?? ""}</p>
          <ul class="chart-lock__lines" id="chart-lock-lines"></ul>
          <button type="button" class="chart-lock__submit" id="chart-lock-submit">COMMIT ORDER</button>
          <p class="chart-lock__feedback" id="chart-lock-feedback" aria-live="polite"></p>
        </div>`;
      paintLines();
      readout.querySelector("#chart-lock-submit")?.addEventListener("click", () => {
        const ok = order.every((id, i) => id === puzzle.answer[i]);
        if (ok) unlockAndShow(planetId);
        else {
          const feedback = readout.querySelector("#chart-lock-feedback");
          flashDenyFeedback(feedback);
          shakeLock(readout.querySelector("#chart-lock"));
        }
      });
      return;
    }

    if (puzzle.type === "lights-out") {
      const rows = puzzle.rows ?? 3;
      const cols = puzzle.cols ?? 5;
      const size = rows * cols;
      const clone = (arr) => (arr ?? []).map((v) => (v ? 1 : 0));
      let grid = clone(puzzle.start);
      if (grid.length !== size) grid = Array(size).fill(0);
      const goalAllOn = puzzle.goal !== "all-off";

      const neighbors = (i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const out = [i];
        if (r > 0) out.push(i - cols);
        if (r < rows - 1) out.push(i + cols);
        if (c > 0) out.push(i - 1);
        if (c < cols - 1) out.push(i + 1);
        return out;
      };

      const toggleAt = (i) => {
        for (const j of neighbors(i)) grid[j] = grid[j] ? 0 : 1;
      };

      const isSolved = () =>
        goalAllOn ? grid.every((v) => v) : grid.every((v) => !v);

      const paint = () => {
        const host = readout.querySelector("#chart-lock-lights");
        if (!host) return;
        host.replaceChildren();
        host.style.setProperty("--lights-cols", String(cols));
        for (let i = 0; i < size; i++) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "chart-lock__light";
          if (grid[i]) btn.classList.add("is-on");
          btn.setAttribute("aria-label", `Data block ${i + 1}`);
          btn.setAttribute("aria-pressed", grid[i] ? "true" : "false");
          btn.dataset.idx = String(i);
          btn.addEventListener("click", () => {
            if (isDossierUnlocked(planetId)) return;
            toggleAt(i);
            audio.play("click");
            paint();
            if (isSolved()) unlockAndShow(planetId);
          });
          host.appendChild(btn);
        }
      };

      readout.innerHTML = `
        <div class="chart-lock chart-lock--lights" id="chart-lock">
          <p class="chart-lock__title">${name}</p>
          <p class="chart-lock__prompt">${puzzle.prompt}</p>
          <p class="chart-lock__hint">${puzzle.hint ?? ""}</p>
          <div
            class="chart-lock__lights"
            id="chart-lock-lights"
            role="group"
            aria-label="Data block grid"
          ></div>
          <button type="button" class="chart-lock__reset" id="chart-lock-reset">RESET</button>
          <p class="chart-lock__feedback" id="chart-lock-feedback" aria-live="polite"></p>
        </div>`;
      paint();
      readout.querySelector("#chart-lock-reset")?.addEventListener("click", () => {
        grid = clone(puzzle.start);
        if (grid.length !== size) grid = Array(size).fill(0);
        paint();
        audio.play("click");
      });
      return;
    }

    if (puzzle.type === "morse-translate") {
      let buffer = "";
      let phase = "morse";
      const targetMorse = puzzle.morse ?? PARTNER_MORSE.code;
      let transitionBusy = false;

      const bindTranslateForm = () => {
        readout.querySelector("#morse-translate-form")?.addEventListener("submit", (e) => {
          e.preventDefault();
          if (phase !== "translate") return;
          const input = readout.querySelector("#morse-translate-input");
          const lockEl = readout.querySelector("#chart-lock");
          const feedbackEl = readout.querySelector("#chart-lock-feedback");
          if (answersMatch(input?.value, puzzle.answers)) unlockAndShow(planetId);
          else {
            flashDenyFeedback(feedbackEl, "TRANSLATION REJECTED");
            shakeLock(lockEl);
          }
        });
      };

      const syncDisplay = () => {
        const display = readout.querySelector("#morse-display");
        if (display) display.value = buffer;
        const lockEl = readout.querySelector("#chart-lock");
        if (lockEl) lockEl.dataset.phase = phase;
      };

      const setMorsePadLocked = (locked) => {
        const lockEl = readout.querySelector("#chart-lock");
        lockEl?.classList.toggle("is-morse-locked", locked);
        readout
          .querySelectorAll("[data-sym], #morse-back, #morse-commit")
          .forEach((btn) => {
            btn.disabled = locked;
            btn.setAttribute("aria-disabled", locked ? "true" : "false");
          });
      };

      const mountTranslateForm = () => {
        if (readout.querySelector("#morse-translate-wrap")) return;
        const lockEl = readout.querySelector("#chart-lock");
        const feedbackEl = readout.querySelector("#chart-lock-feedback");
        if (!lockEl) return;
        const wrap = document.createElement("div");
        wrap.className = "chart-lock__morse-translate";
        wrap.id = "morse-translate-wrap";
        wrap.innerHTML = `
          <form class="chart-lock__form" id="morse-translate-form" autocomplete="off">
            <label class="visually-hidden" for="morse-translate-input">Plaintext translation</label>
            <input
              class="chart-lock__input"
              id="morse-translate-input"
              type="text"
              spellcheck="false"
              placeholder="PLAINTEXT"
            />
            <button type="submit" class="chart-lock__submit">COMMIT</button>
          </form>`;
        if (feedbackEl) lockEl.insertBefore(wrap, feedbackEl);
        else lockEl.appendChild(wrap);
        bindTranslateForm();
        if (!prefersReducedMotion()) {
          wrap.classList.add("is-scan-in");
          audio.play("revealScan", { durationMs: 720, gainScale: 2.2 });
        }
        window.setTimeout(() => {
          readout.querySelector("#morse-translate-input")?.focus();
        }, prefersReducedMotion() ? 0 : 120);
      };

      const glitchOutResetThenTranslate = () => {
        const footer = readout.querySelector(".chart-lock__morse-footer");
        const resetBtn = readout.querySelector("#morse-reset");
        const finish = () => {
          footer?.remove();
          mountTranslateForm();
          transitionBusy = false;
        };

        setMorsePadLocked(true);
        syncDisplay();

        if (!footer || !resetBtn || prefersReducedMotion()) {
          finish();
          return;
        }

        resetBtn.classList.add("is-glitching-out");
        resetBtn.disabled = true;
        audio.playGlitchBurst({ count: 4, gapMs: 55 });
        let done = false;
        const once = () => {
          if (done) return;
          done = true;
          finish();
        };
        resetBtn.addEventListener("animationend", once, { once: true });
        window.setTimeout(once, 900);
      };

      const appendSym = (sym) => {
        if (phase !== "morse" || transitionBusy) return;
        buffer += sym;
        audio.play("click");
        syncDisplay();
      };

      const deleteSym = () => {
        if (phase !== "morse" || transitionBusy) return;
        if (!buffer) return;
        buffer = buffer.slice(0, -1);
        audio.play("click");
        syncDisplay();
      };

      const resetMorse = () => {
        if (phase !== "morse" || transitionBusy) return;
        buffer = "";
        if (feedback) {
          feedback.textContent = "";
          feedback.classList.remove("is-deny");
        }
        audio.play("click");
        syncDisplay();
      };

      const commitMorse = () => {
        if (phase !== "morse" || transitionBusy) return;
        if (!morseCodesMatch(buffer, targetMorse)) {
          flashDenyFeedback(feedback, "CARRIER REJECTED");
          shakeLock(lock);
          audio.play("deny");
          return;
        }
        transitionBusy = true;
        phase = "translate";
        audio.play("click");
        const display = readout.querySelector("#morse-display");
        if (display) {
          display.focus();
          display.select();
        }
        glitchOutResetThenTranslate();
      };

      readout.innerHTML = `
        <div class="chart-lock chart-lock--morse" id="chart-lock" data-phase="morse">
          <p class="chart-lock__title">${name}</p>
          <p class="chart-lock__prompt">${puzzle.prompt}</p>
          <p class="chart-lock__hint">${puzzle.hint ?? ""}</p>
          <label class="visually-hidden" for="morse-display">Morse buffer</label>
          <input
            class="chart-lock__morse-display"
            id="morse-display"
            type="text"
            readonly
            spellcheck="false"
            value=""
            aria-live="polite"
          />
          <div class="chart-lock__morse-row" role="group" aria-label="Morse keys">
            <button type="button" class="chart-lock__morse-key" data-sym="." aria-label="Dot">.</button>
            <button type="button" class="chart-lock__morse-key" data-sym="-" aria-label="Dash">-</button>
            <button type="button" class="chart-lock__morse-key" data-sym="/" aria-label="Space">/</button>
            <button type="button" class="chart-lock__morse-action" id="morse-back">DELETE</button>
            <button type="button" class="chart-lock__morse-action chart-lock__morse-action--commit" id="morse-commit">COMMIT</button>
          </div>
          <div class="chart-lock__morse-footer">
            <button type="button" class="chart-lock__morse-action" id="morse-reset">RESET</button>
          </div>
          <p class="chart-lock__feedback" id="chart-lock-feedback" aria-live="polite"></p>
        </div>`;

      const feedback = readout.querySelector("#chart-lock-feedback");
      const lock = readout.querySelector("#chart-lock");

      readout.querySelectorAll("[data-sym]").forEach((btn) => {
        btn.addEventListener("click", () => {
          appendSym(btn.dataset.sym);
          readout.querySelector("#morse-display")?.focus();
        });
      });
      readout.querySelector("#morse-back")?.addEventListener("click", () => {
        deleteSym();
        readout.querySelector("#morse-display")?.focus();
      });
      readout.querySelector("#morse-reset")?.addEventListener("click", () => {
        resetMorse();
        readout.querySelector("#morse-display")?.focus();
      });
      readout.querySelector("#morse-commit")?.addEventListener("click", commitMorse);

      const onMorseKeydown = (e) => {
        if (phase !== "morse" || transitionBusy) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.repeat) return;

        let handled = true;
        if (e.key === ".") appendSym(".");
        else if (e.key === "-") appendSym("-");
        else if (e.key === "/") appendSym("/");
        else if (e.key === "Backspace" || e.key === "Delete") deleteSym();
        else if (e.key === "Enter") commitMorse();
        else handled = false;

        if (handled) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      readout.querySelector("#morse-display")?.addEventListener("keydown", onMorseKeydown);
      syncDisplay();
      readout.querySelector("#morse-display")?.focus();
      return;
    }

    if (puzzle.type === "chrono-rings") {
      let selected = "minutes";
      let raf = 0;
      let unlocking = false;
      let keyHandler = null;
      let onChrono = null;

      const cleanup = () => {
        cancelAnimationFrame(raf);
        if (keyHandler) window.removeEventListener("keydown", keyHandler);
        if (onChrono) window.removeEventListener("lattice:chrono", onChrono);
      };

      readout.innerHTML = `
        <div class="chart-lock chart-lock--chrono" id="chart-lock" tabindex="0">
          <p class="chart-lock__title">${name}</p>
          <p class="chart-lock__prompt">${puzzle.prompt}</p>
          <p class="chart-lock__hint">${puzzle.hint ?? ""}</p>
          <div class="chrono-align">
            <div class="chrono-align__stage">
              <svg class="chrono-align__svg" viewBox="0 0 220 220" aria-hidden="true">
                <g class="chrono-align__ring" data-ring="hours" id="chrono-ring-hours"></g>
                <g class="chrono-align__ring" data-ring="minutes" id="chrono-ring-minutes"></g>
                <g class="chrono-align__ring chrono-align__ring--seconds" data-ring="seconds" id="chrono-ring-seconds"></g>
              </svg>
              <button type="button" class="chrono-align__nudge chrono-align__nudge--w" data-dir="-1" aria-label="Rotate selected ring counter-clockwise">
                <svg class="chrono-align__nudge-svg" viewBox="0 0 28 48" aria-hidden="true">
                  <path class="chrono-align__chevron" d="M18 10 L6 24 L18 38" fill="none" />
                </svg>
              </button>
              <button type="button" class="chrono-align__nudge chrono-align__nudge--e" data-dir="1" aria-label="Rotate selected ring clockwise">
                <svg class="chrono-align__nudge-svg" viewBox="0 0 28 48" aria-hidden="true">
                  <path class="chrono-align__chevron" d="M10 10 L22 24 L10 38" fill="none" />
                </svg>
              </button>
            </div>
          </div>
          <div class="chrono-align__actions">
            <button type="button" class="chart-lock__reset chrono-align__reset" id="chrono-reset">RESET</button>
            <button type="button" class="chart-lock__submit chrono-align__enter" id="chrono-enter">COMMIT</button>
          </div>
        </div>`;

      const lock = readout.querySelector("#chart-lock");
      const hoursG = readout.querySelector("#chrono-ring-hours");
      const minutesG = readout.querySelector("#chrono-ring-minutes");
      const secondsG = readout.querySelector("#chrono-ring-seconds");
      const spin = { h: 0, m: 0, s: 0 };
      let spinReady = false;

      const unwrapToward = (current, targetMod360) => {
        const curMod = ((current % 360) + 360) % 360;
        const delta = ((targetMod360 - curMod + 540) % 360) - 180;
        return current + delta;
      };

      const setSpinInstant = (angles) => {
        const rings = [hoursG, minutesG, secondsG];
        rings.forEach((g) => {
          if (!g) return;
          g.style.transition = "none";
        });
        spin.h = angles.h;
        spin.m = angles.m;
        spin.s = angles.s;
        if (hoursG) hoursG.style.transform = `rotate(${spin.h}deg)`;
        if (minutesG) minutesG.style.transform = `rotate(${spin.m}deg)`;
        if (secondsG) secondsG.style.transform = `rotate(${spin.s}deg)`;
        rings.forEach((g) => {
          if (!g) return;
          void g.getBoundingClientRect();
          g.style.transition = "";
        });
      };

      const paintRingMarks = (g, radius, marks) => {
        if (!g) return;
        g.replaceChildren();
        const rim = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        rim.setAttribute("cx", "110");
        rim.setAttribute("cy", "110");
        rim.setAttribute("r", String(radius));
        rim.setAttribute("class", "chrono-align__rim");
        g.appendChild(rim);
        for (let i = 0; i < marks; i++) {
          const ang = (i / marks) * Math.PI * 2 - Math.PI / 2;
          const isIndex = i === 0;
          const outer = radius + (isIndex ? 3 : 0);
          const inner = radius - (isIndex ? 16 : 10);
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", String(110 + Math.cos(ang) * inner));
          line.setAttribute("y1", String(110 + Math.sin(ang) * inner));
          line.setAttribute("x2", String(110 + Math.cos(ang) * outer));
          line.setAttribute("y2", String(110 + Math.sin(ang) * outer));
          line.setAttribute(
            "class",
            isIndex ? "chrono-align__tick chrono-align__tick--index" : "chrono-align__tick"
          );
          g.appendChild(line);
        }
        if (g.dataset.ring !== "seconds") {
          const hit = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          hit.setAttribute("cx", "110");
          hit.setAttribute("cy", "110");
          hit.setAttribute("r", String(radius));
          hit.setAttribute("class", "chrono-align__hit");
          hit.dataset.ring = g.dataset.ring;
          // Annular target so outer/inner rings pick cleanly
          hit.style.strokeWidth = g.dataset.ring === "hours" ? "22" : "20";
          g.appendChild(hit);
        }
      };

      // Uniform tick marks only — no minor subdivisions
      paintRingMarks(hoursG, 96, 24);
      paintRingMarks(minutesG, 70, 12);
      paintRingMarks(secondsG, 44, 12);

      const syncSelection = () => {
        readout.querySelectorAll(".chrono-align__ring").forEach((g) => {
          g.classList.toggle("is-selected", g.dataset.ring === selected);
        });
      };

      const applyRotations = () => {
        if (unlocking || !readout.querySelector(".chart-lock--chrono")) return;
        const d = getDisplayLocalTime();
        const real = getRealLocalTime();
        // Hard steps only — no fractional creep between units
        const secAngle = real.s * 6;
        const minAngle = d.m * 6;
        const hourAngle = (d.h % 24) * 15;
        if (!spinReady) {
          setSpinInstant({ h: hourAngle, m: minAngle, s: secAngle });
          spinReady = true;
        } else {
          spin.h = unwrapToward(spin.h, hourAngle);
          spin.m = unwrapToward(spin.m, minAngle);
          spin.s = unwrapToward(spin.s, secAngle);
          if (hoursG) hoursG.style.transform = `rotate(${spin.h}deg)`;
          if (minutesG) minutesG.style.transform = `rotate(${spin.m}deg)`;
          if (secondsG) secondsG.style.transform = `rotate(${spin.s}deg)`;
        }
      };

      const tryEnter = () => {
        if (unlocking || isDossierUnlocked(planetId)) return;
        if (!isChronoAligned()) {
          shakeLock(lock);
          return;
        }
        unlocking = true;
        cleanup();
        unlockAndShow(planetId);
      };

      const nudge = (dir) => {
        if (selected === "hours") {
          nudgeHourOffset(dir);
          glitchChronoPart("hours");
        } else if (selected === "minutes") {
          nudgeMinuteOffset(dir);
          glitchChronoPart("minutes");
        } else return;
        audio.play("click");
        applyRotations();
      };

      const selectRing = (ring) => {
        if (ring === "seconds") return;
        selected = ring;
        syncSelection();
        audio.play("click");
        lock?.focus();
      };

      syncSelection();
      applyRotations();
      lock?.focus();

      readout.querySelectorAll(".chrono-align__hit").forEach((hit) => {
        hit.addEventListener("click", () => selectRing(hit.dataset.ring));
      });
      readout.querySelectorAll(".chrono-align__nudge").forEach((btn) => {
        btn.addEventListener("click", () => nudge(Number(btn.dataset.dir) || 0));
      });
      readout.querySelector("#chrono-reset")?.addEventListener("click", () => {
        resetChronoOffsets();
        selected = "minutes";
        syncSelection();
        applyRotations();
        audio.play("click");
      });
      readout.querySelector("#chrono-enter")?.addEventListener("click", () => {
        tryEnter();
      });

      keyHandler = (e) => {
        const panel = document.querySelector('.panel[data-panel="cartography"]');
        if (panel?.hidden) return;
        if (!readout.querySelector(".chart-lock--chrono")) return;
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
          e.preventDefault();
          nudge(-1);
        } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
          e.preventDefault();
          nudge(1);
        } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
          e.preventDefault();
          selectRing("hours");
        } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
          e.preventDefault();
          selectRing("minutes");
        } else if (e.key === "Enter") {
          e.preventDefault();
          tryEnter();
        }
      };
      window.addEventListener("keydown", keyHandler);

      onChrono = () => applyRotations();
      window.addEventListener("lattice:chrono", onChrono);

      const loop = () => {
        if (!readout.querySelector(".chart-lock--chrono")) {
          cleanup();
          return;
        }
        applyRotations();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
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
          <button type="submit" class="chart-lock__submit">COMMIT</button>
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
    paintArchive(null);
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
    paintArchive(null);
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

  const sunHit = add("circle", {
    class: "chart-svg__hit chart-svg__hit--sun",
    cx,
    cy,
    r: 14,
  });
  sunHit.style.pointerEvents = "none";
  svg.querySelector(".chart-svg__sun")?.setAttribute("pointer-events", "none");

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

  const refreshPlanetLabels = ({ animate = true } = {}) => {
    svg.querySelectorAll(".chart-svg__body[data-body]").forEach((g) => {
      const id = g.dataset.body;
      const body = bodies.find((b) => b.id === id);
      const label = g.querySelector(".chart-svg__label");
      if (!body || !label) return;
      const clear = String(body.name ?? id).toUpperCase();
      const seenId = `planet:${id}`;
      if (isDossierUnlocked(id)) {
        g.setAttribute("aria-label", body.name);
        // Don't clobber an in-flight descramble (unlock fires refresh twice)
        if (label.classList.contains("is-descrambling")) {
          fitSelectBox(g);
          return;
        }
        const alreadySeen =
          hasSeenDescramble(seenId) || label.dataset.latticeClear === "1";
        if (animate && !alreadySeen) {
          markDescrambleSeen(seenId);
          label.dataset.latticeClear = "1";
          if (!label.classList.contains("is-scrambled")) {
            label.textContent = scrambleText(clear, clear.length + 3);
            label.classList.add("is-scrambled");
          }
          void descrambleText(label, clear, {
            onFrame: () => fitSelectBox(g),
          }).then(() => fitSelectBox(g));
        } else {
          markDescrambleSeen(seenId);
          label.dataset.latticeClear = "1";
          label.textContent = clear;
          label.classList.remove("is-scrambled", "is-descrambling");
          label.classList.add("is-clear");
        }
      } else {
        delete label.dataset.latticeClear;
        label.classList.remove("is-clear", "is-descrambling");
        label.textContent = scrambleText(clear, clear.length + 3);
        label.classList.add("is-scrambled");
        g.setAttribute("aria-label", "Corrupted orbital body");
      }
      fitSelectBox(g);
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
    label.textContent = String(body.name ?? "").toUpperCase();
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
  refreshPlanetLabels({ animate: false });

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

  // Refresh Vol tray as dossiers unlock elsewhere
  window.addEventListener("lattice:dossier", () => {
    refreshPlanetLabels({ animate: true });
    if (selectedId !== "vol") return;
    if (isDossierUnlocked("vol")) return;
    selectPlanet("vol");
  });

  if (!prefersReducedMotion()) {
    let last = performance.now();
    let raf = 0;
    let orbitLive = false;

    const tick = (now) => {
      if (!orbitLive) {
        raf = 0;
        return;
      }
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

      raf = requestAnimationFrame(tick);
    };

    const setOrbitLive = (on) => {
      if (on === orbitLive) return;
      orbitLive = on;
      if (on) {
        last = performance.now();
        if (!raf) raf = requestAnimationFrame(tick);
      }
    };

    const chartPanel = document.getElementById("panel-cartography");
    setOrbitLive(Boolean(chartPanel?.classList.contains("is-active")));
    window.addEventListener("lattice:channel", (e) => {
      setOrbitLive(e.detail?.panel === "cartography");
    });
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
