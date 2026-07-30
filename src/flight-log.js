/**
 * LATTICE.OS — Flight Log (flat chronological entries)
 */

import { FLIGHT_LOG } from "../content/boot-content.js";
import { IMPERIAL_SLOTS, sealByPlanetId } from "../content/arg-path.js";
import { audio } from "./audio.js";
import { applyClearanceUI } from "./clearance.js";
import {
  getRecoveredFragments,
  markFragmentRecovered,
  isDossierUnlocked,
} from "./progress.js";
import { prefersReducedMotion, sleep } from "./motion.js";

/** Block/shade glyphs only — no punctuation or math symbols */
const SCRAMBLE_GLYPHS = "░▒▓█▄▀■□▪▫";

function scrambleText(clear, seed = 0) {
  const src = String(clear ?? "");
  if (!src) return "";
  const n = SCRAMBLE_GLYPHS.length;
  let out = "";
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === " " || ch === "\n" || ch === "-" || ch === ".") {
      out += ch;
      continue;
    }
    // Mix per index (coprime step) so runs aren't identical glyphs
    const idx =
      ((seed + 1) * 31 + i * 13 + src.length * 7 + (src.charCodeAt(i) || 0)) %
      n;
    out += SCRAMBLE_GLYPHS[idx < 0 ? idx + n : idx];
  }
  return out;
}

async function runDescramble(el, clearText, { durationMs = 900 } = {}) {
  if (!el) return;
  const clear = String(clearText ?? "");
  if (!clear) {
    el.textContent = "";
    return;
  }
  if (prefersReducedMotion()) {
    el.textContent = clear;
    el.classList.remove("is-scrambled");
    el.classList.add("is-clear");
    return;
  }
  el.classList.add("is-descrambling");
  const steps = Math.max(8, Math.min(22, Math.round(durationMs / 45)));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    let out = "";
    for (let i = 0; i < clear.length; i++) {
      const ch = clear[i];
      if (ch === " " || ch === "\n") {
        out += ch;
        continue;
      }
      const threshold = t * 1.15 - (i / Math.max(1, clear.length)) * 0.35;
      if (Math.random() < threshold) out += ch;
      else out += SCRAMBLE_GLYPHS[(i * 13 + s * 7) % SCRAMBLE_GLYPHS.length];
    }
    el.textContent = out;
    await sleep(Math.round(durationMs / steps));
  }
  el.textContent = clear;
  el.classList.remove("is-descrambling", "is-scrambled");
  el.classList.add("is-clear");
}

export function initFlightLog() {
  const flog = document.getElementById("flog");
  const host = document.getElementById("flog-journals");
  const reader = document.getElementById("flog-reader");
  const searchForm = document.getElementById("flog-search");
  const searchInput = document.getElementById("flog-query");
  const rail = document.getElementById("flog-rail");
  const railFill = document.getElementById("flog-rail-fill");
  const split = document.getElementById("flog-split");
  const journalCountEl = document.getElementById("flog-journal-count");
  const indexLabel = document.querySelector(".flog__index-label");
  const missEl = document.getElementById("flog-index-miss");
  const awaitEl = document.getElementById("flog-index-await");
  if (!host || !reader || !FLIGHT_LOG) return;

  const entries = FLIGHT_LOG.entries ?? [];
  const idle = FLIGHT_LOG.idle ?? "SELECT LOG ENTRY";
  const idleHint = FLIGHT_LOG.idleHint ?? "";

  let selectedBtn = null;
  let activeEntry = null;
  let filterQuery = "";
  let pages = [];
  let pageIndex = 0;
  /** Descramble plays once per entry per Flight Log channel visit */
  const descrambledIds = new Set();
  /** While set, paint fragments as scrambled so descramble has something to reveal */
  let pendingDescrambleId = null;

  const knownFragments = new Set(
    IMPERIAL_SLOTS.map((s) => String(s.fragment).toUpperCase())
  );

  const escapeHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  /** Unscrambled fragment-entry locations render as <strong> */
  const locationInnerHtml = (text, { scrambled, hasFragment }) => {
    const esc = escapeHtml(text);
    if (hasFragment && !scrambled) return `<strong>${esc}</strong>`;
    return esc;
  };

  const isFragInTray = (frag) => {
    const id = String(frag ?? "")
      .trim()
      .toUpperCase()
      .replace(/[▽▼\s]+/g, "");
    return Boolean(id) && getRecoveredFragments().has(id);
  };

  const planetMetaClear = (entry) => {
    if (entry?.location) return String(entry.location).toUpperCase();
    if (!entry?.planetId) return "—";
    const seal = sealByPlanetId(entry.planetId);
    return (seal?.planetName ?? entry.planetId).toUpperCase();
  };

  const planetUnlocked = (entry) =>
    Boolean(entry?.planetId) && isDossierUnlocked(entry.planetId);

  /** Only the nine fragment entries scramble LOC — until Chart dossier unlock. */
  const needsScramble = (entry) =>
    Boolean(entry?.fragment) && Boolean(entry?.planetId) && !planetUnlocked(entry);

  const plainBody = (text) =>
    String(text ?? "").replace(/\[\[([A-Za-z0-9\-]+)\]\]/g, "$1");

  const claimFragment = (frag) => {
    const id = String(frag ?? "")
      .trim()
      .toUpperCase()
      .replace(/[▽▼\s]+/g, "");
    if (!id || !knownFragments.has(id)) return;
    if (isFragInTray(id)) return;
    markFragmentRecovered(id);
    audio.play("imperial");
    window.dispatchEvent(new CustomEvent("lattice:fragments"));
    applyClearanceUI();
    if (activeEntry) void openEntry(activeEntry, { replayDescramble: false });
    paintList();
  };

  /** Paint column HTML — fragment words become boxed/claimed buttons. */
  const colHtml = (text, entry) => {
    const scrambled =
      needsScramble(entry) ||
      (pendingDescrambleId != null && pendingDescrambleId === entry?.id);
    let html = escapeHtml(text);
    // Wrap known fragment tokens (whole words)
    for (const id of knownFragments) {
      const re = new RegExp(`\\b(${id})\\b`, "gi");
      html = html.replace(re, (_, word) => {
        const up = word.toUpperCase();
        const claimed = isFragInTray(up);
        const display = scrambled ? scrambleText(up, 3) : up;
        const cls = [
          "flog-inline-frag",
          claimed ? "is-claimed" : "is-boxed",
          scrambled ? "is-scrambled" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<button type="button" class="${cls}" data-inline-frag="${up}" aria-pressed="${claimed ? "true" : "false"}">${display}</button>`;
      });
    }
    return html.replace(/\n/g, "<br />");
  };

  const bindInlineFrags = () => {
    reader.querySelectorAll("[data-inline-frag]").forEach((btn) => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        claimFragment(btn.dataset.inlineFrag);
      });
    });
  };

  const updateRail = () => {
    if (!railFill) return;
    const max = host.scrollHeight - host.clientHeight;
    if (max <= 0) {
      if (rail) rail.hidden = true;
      railFill.style.transform = "scaleY(0)";
      return;
    }
    if (rail) rail.hidden = false;
    const fill = host.scrollTop / max;
    railFill.style.transform = `scaleY(${Math.max(0, Math.min(1, fill))})`;
  };

  const tokenize = (text) => {
    if (!text) return [];
    return text.split(/(\s+)/).filter((t) => t.length > 0);
  };

  const fitTokens = (tokens, start, measure, maxH) => {
    if (start >= tokens.length) return start;
    let lo = start + 1;
    let hi = tokens.length;
    let best = start;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      measure.textContent = tokens.slice(start, mid).join("");
      if (measure.scrollHeight <= maxH) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (best === start) best = Math.min(start + 1, tokens.length);
    return best;
  };

  const buildPages = (text) => {
    const spread = reader.querySelector(".flog-reader__spread");
    const col = reader.querySelector(".flog-reader__col");
    if (!spread || !col) return [{ left: text, right: "" }];

    const colW = col.clientWidth;
    const colH = col.clientHeight;
    if (colW < 8 || colH < 8) return [{ left: text, right: "" }];

    const measure = document.createElement("div");
    measure.className = "flog-reader__measure";
    measure.style.width = `${colW}px`;
    measure.style.font = getComputedStyle(col).font;
    measure.style.fontSize = getComputedStyle(col).fontSize;
    measure.style.lineHeight = getComputedStyle(col).lineHeight;
    measure.style.letterSpacing = getComputedStyle(col).letterSpacing;
    document.body.appendChild(measure);

    const tokens = tokenize(text);
    const out = [];
    let i = 0;
    let guard = 0;
    while (i < tokens.length && guard < 500) {
      guard += 1;
      const leftEnd = fitTokens(tokens, i, measure, colH);
      const left = tokens.slice(i, leftEnd).join("");
      i = leftEnd;
      let right = "";
      if (i < tokens.length) {
        const rightEnd = fitTokens(tokens, i, measure, colH);
        right = tokens.slice(i, rightEnd).join("");
        i = rightEnd;
      }
      out.push({ left, right });
    }
    measure.remove();
    if (!out.length) out.push({ left: "", right: "" });
    return out;
  };

  const paintPage = () => {
    if (!activeEntry) return;
    const left = reader.querySelector('[data-col="0"]');
    const right = reader.querySelector('[data-col="1"]');
    const prev = reader.querySelector(".flog-turn--prev");
    const next = reader.querySelector(".flog-turn--next");
    const folio = reader.querySelector(".flog-reader__folio");
    if (!left || !right || !prev || !next) return;

    const page = pages[pageIndex] || { left: "", right: "" };
    left.innerHTML = colHtml(page.left, activeEntry);
    right.innerHTML = colHtml(page.right, activeEntry);
    bindInlineFrags();

    const canPrev = pageIndex > 0;
    const canNext = pageIndex < pages.length - 1;
    prev.disabled = !canPrev;
    next.disabled = !canNext;
    prev.classList.toggle("is-lit", canPrev);
    next.classList.toggle("is-lit", canNext);
    if (folio) {
      folio.textContent = `PAGE ${pageIndex + 1} / ${Math.max(pages.length, 1)}`;
    }
  };

  const layoutEntry = () => {
    if (!activeEntry) return;
    const body = plainBody(activeEntry.body ?? "");
    const keep = pageIndex;
    pages = buildPages(body);
    pageIndex = Math.min(keep, Math.max(0, pages.length - 1));
    paintPage();
  };

  const showIdle = () => {
    activeEntry = null;
    pages = [];
    pageIndex = 0;
    selectedBtn?.classList.remove("is-active");
    selectedBtn = null;
    reader.innerHTML = `
      <div class="flog__idle-block">
        <p class="flog__idle">${escapeHtml(idle)}</p>
        <p class="flog__idle-hint">${escapeHtml(idleHint).replace(/\n/g, "<br />")}</p>
      </div>`;
  };

  const openEntry = async (entry, { replayDescramble = true } = {}) => {
    activeEntry = entry;
    pageIndex = 0;
    const scramble = needsScramble(entry);
    const metaClear = planetMetaClear(entry);
    const canDescramble =
      Boolean(entry.fragment) && !scramble && isDossierUnlocked(entry.planetId);
    const playDescramble =
      replayDescramble && canDescramble && !descrambledIds.has(entry.id);
    const metaShow =
      scramble || playDescramble ? scrambleText(metaClear, 1) : metaClear;
    const locScrambled = scramble || playDescramble;
    const planetCls = [
      locScrambled ? "is-scrambled" : "",
      entry.fragment && !locScrambled ? "is-frag-clear" : "",
    ]
      .filter(Boolean)
      .join(" ");

    reader.innerHTML = `
      <header class="flog-reader__head">
        <h3 class="flog-reader__title">${escapeHtml(entry.title)}</h3>
        <div class="flog-reader__cats">
          <p class="flog-reader__cat">
            <span class="flog-reader__cat-label">DATE</span>
            <span class="flog-reader__date">${escapeHtml(entry.date)}</span>
          </p>
          <p class="flog-reader__cat">
            <span class="flog-reader__cat-label">LOCATION</span>
            <span class="flog-reader__planet${planetCls ? ` ${planetCls}` : ""}" data-flog-planet>${locationInnerHtml(metaShow, { scrambled: locScrambled, hasFragment: Boolean(entry.fragment) })}</span>
          </p>
        </div>
      </header>
      <div class="flog-reader__stage">
        <button type="button" class="flog-turn flog-turn--prev" aria-label="Previous page" disabled>‹</button>
        <div class="flog-reader__spread">
          <div class="flog-reader__col" data-col="0"></div>
          <div class="flog-reader__col" data-col="1"></div>
        </div>
        <button type="button" class="flog-turn flog-turn--next" aria-label="Next page" disabled>›</button>
      </div>
      <p class="flog-reader__folio">PAGE 1 / 1</p>`;

    reader.querySelector(".flog-turn--prev")?.addEventListener("click", () => {
      if (pageIndex <= 0) return;
      pageIndex -= 1;
      audio.play("click");
      paintPage();
    });
    reader.querySelector(".flog-turn--next")?.addEventListener("click", () => {
      if (pageIndex >= pages.length - 1) return;
      pageIndex += 1;
      audio.play("click");
      paintPage();
    });

    if (playDescramble) {
      pendingDescrambleId = entry.id;
      descrambledIds.add(entry.id);
    } else {
      pendingDescrambleId = null;
    }

    await new Promise((r) => {
      requestAnimationFrame(() => {
        layoutEntry();
        requestAnimationFrame(() => {
          layoutEntry();
          r();
        });
      });
    });

    if (playDescramble) {
      const planetEl = reader.querySelector("[data-flog-planet]");
      audio.play("glitchClick");
      await runDescramble(planetEl, metaClear);
      const fragBtns = [...reader.querySelectorAll("[data-inline-frag]")];
      await Promise.all(
        fragBtns.map((btn) =>
          runDescramble(btn, btn.dataset.inlineFrag || btn.textContent)
        )
      );
      pendingDescrambleId = null;
      paintPage();
      const planetAfter = reader.querySelector("[data-flog-planet]");
      if (planetAfter && entry.fragment) {
        planetAfter.classList.remove("is-scrambled");
        planetAfter.classList.add("is-frag-clear");
        planetAfter.innerHTML = `<strong>${escapeHtml(metaClear)}</strong>`;
      }
    }
  };

  const paintList = () => {
    const q = filterQuery.trim().toLowerCase();
    const visible = !q
      ? entries
      : entries.filter((e) => {
          const hay = [
            e.title,
            e.date,
            e.planetId,
            e.location,
            planetMetaClear(e),
            e.body,
            e.fragment,
            e.keyword,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        });

    host.replaceChildren();
    for (const entry of visible) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "flog-entry";
      btn.dataset.entryId = entry.id;
      const scramble = needsScramble(entry);
      const hasFrag = Boolean(entry.fragment);
      const meta = scramble
        ? scrambleText(planetMetaClear(entry), 2)
        : planetMetaClear(entry);
      const planetCls = [
        scramble ? "is-scrambled" : "",
        hasFrag && !scramble ? "is-frag-clear" : "",
      ]
        .filter(Boolean)
        .join(" ");
      btn.innerHTML = `
        <span class="flog-entry__title">${escapeHtml(entry.title)}</span>
        <span class="flog-entry__date">${escapeHtml(entry.date)}</span>
        <span class="flog-entry__loc">
          <span class="flog-entry__loc-label">LOC</span>
          <span class="flog-entry__planet${planetCls ? ` ${planetCls}` : ""}">${locationInnerHtml(meta, { scrambled: scramble, hasFragment: hasFrag })}</span>
        </span>`;
      if (activeEntry?.id === entry.id) {
        btn.classList.add("is-active");
        selectedBtn = btn;
      }
      btn.addEventListener("click", () => {
        selectedBtn?.classList.remove("is-active");
        selectedBtn = btn;
        btn.classList.add("is-active");
        audio.play("journalSelect");
        void openEntry(entry);
      });
      host.appendChild(btn);
    }

    if (journalCountEl) {
      journalCountEl.textContent = `${visible.length}/${entries.length}`;
    }
    if (missEl) missEl.hidden = !(q && visible.length === 0);
    if (awaitEl) awaitEl.hidden = true;
    updateRail();
  };

  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    filterQuery = searchInput?.value ?? "";
    audio.play("flogSearchHit");
    paintList();
  });

  searchInput?.addEventListener("input", () => {
    filterQuery = searchInput.value ?? "";
    paintList();
  });

  host.addEventListener("scroll", updateRail, { passive: true });
  window.addEventListener("resize", () => {
    updateRail();
    if (activeEntry) layoutEntry();
  });

  /* Panel resize split */
  if (flog && split) {
    let dragging = false;
    const onMove = (clientX) => {
      if (!dragging) return;
      const rect = flog.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(18, Math.min(62, (x / rect.width) * 100));
      flog.style.setProperty("--flog-index-w", `${pct}%`);
      if (activeEntry) layoutEntry();
      updateRail();
    };
    split.addEventListener("pointerdown", (e) => {
      dragging = true;
      flog.classList.add("is-resizing");
      split.setPointerCapture(e.pointerId);
    });
    split.addEventListener("pointermove", (e) => onMove(e.clientX));
    const endDrag = () => {
      dragging = false;
      flog.classList.remove("is-resizing");
    };
    split.addEventListener("pointerup", endDrag);
    split.addEventListener("pointercancel", endDrag);
  }

  if (indexLabel && !indexLabel.dataset.relabeled) {
    indexLabel.dataset.relabeled = "1";
  }

  const refreshAccess = () => {
    paintList();
    if (activeEntry) {
      const fresh = entries.find((e) => e.id === activeEntry.id) ?? activeEntry;
      void openEntry(fresh, { replayDescramble: true });
    }
  };

  initFlightLog.refreshAccess = refreshAccess;

  window.addEventListener("lattice:fragments", () => {
    if (activeEntry) paintPage();
    paintList();
  });

  window.addEventListener("lattice:dossier", () => {
    refreshAccess();
  });

  let onFlightLogChannel = false;
  window.addEventListener("lattice:channel", (e) => {
    const here = e.detail?.panel === "flightlog";
    if (here && !onFlightLogChannel) {
      descrambledIds.clear();
      if (activeEntry) void openEntry(activeEntry, { replayDescramble: true });
    }
    onFlightLogChannel = here;
  });

  paintList();
  showIdle();
  updateRail();
}

initFlightLog.refreshAccess = () => {};
