/**
 * LATTICE.OS — Flight Log (ARG hub)
 */

import { FLIGHT_LOG } from "../content/boot-content.js";
import { audio } from "./audio.js";
import { applyClearanceUI } from "./clearance.js";
import {
  isEntryRecovered,
  recoverByQuery,
} from "./milestones.js";

/* ==========================================================================
   FLIGHT LOG — journals, reader, keyword recovery
   ========================================================================== */

export function initFlightLog() {
  const flog = document.getElementById("flog");
  const host = document.getElementById("flog-journals");
  const reader = document.getElementById("flog-reader");
  const searchForm = document.getElementById("flog-search");
  const searchInput = document.getElementById("flog-query");
  const railFill = document.getElementById("flog-rail-fill");
  const split = document.getElementById("flog-split");
  if (!host || !reader || !FLIGHT_LOG) return;

  const journals = FLIGHT_LOG.journals ?? [];
  const corruptHint =
    FLIGHT_LOG.corruptHint ??
    [
      "PARTITION CORRUPTED",
      "",
      "Lattice cannot decrypt this record in-place.",
      "Query the journal index with a recovery key.",
      "",
      "SEARCH ACTIVATES RECOVER.",
      "Keywords wake sealed files.",
    ].join("\n");
  const idle = FLIGHT_LOG.idle ?? "SELECT JOURNAL ENTRY";
  let selectedBtn = null;
  let activeEntry = null;
  let pages = [];
  let pageIndex = 0;

  const corruptToken = (len = 8) => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz0123456789/·#";
    let out = "";
    for (let i = 0; i < len; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  };

  /** Apply recovered vs corrupted display fields from milestone state. */
  const syncEntryDisplay = (entry) => {
    const recovered = isEntryRecovered(entry.id, entry);
    entry.corrupted = !recovered;
    entry.dateCorrupted = !recovered;
    if (recovered) {
      entry.title = entry.authorTitle || entry.title || "Untitled";
      entry.yearDisplay = String(entry.year ?? "····");
      entry.cycleDisplay = String(entry.cycle ?? 0).padStart(2, "0");
    } else {
      if (!entry._corruptTitle) entry._corruptTitle = corruptToken(7 + Math.floor(Math.random() * 6));
      if (!entry._corruptYear) entry._corruptYear = corruptToken(4);
      if (!entry._corruptCycle) entry._corruptCycle = corruptToken(2);
      entry.title = entry._corruptTitle;
      entry.yearDisplay = entry._corruptYear;
      entry.cycleDisplay = entry._corruptCycle;
    }
    return recovered;
  };

  journals.forEach((j) => {
    (j.entries ?? []).forEach((e) => {
      e.authorTitle = e.title;
      e.authorBody = e.body;
      syncEntryDisplay(e);
    });
  });

  const formatDate = (entry) => {
    const year = entry.dateCorrupted
      ? entry.yearDisplay ?? "····"
      : String(entry.year);
    const cycle = entry.dateCorrupted
      ? entry.cycleDisplay ?? "··"
      : String(entry.cycle).padStart(2, "0");
    return `${year} AE · CYCLE ${cycle}`;
  };

  const formatListDate = (entry) => {
    const year = entry.dateCorrupted
      ? entry.yearDisplay ?? "····"
      : String(entry.year);
    const cycle = entry.dateCorrupted
      ? entry.cycleDisplay ?? "··"
      : String(entry.cycle).padStart(2, "0");
    return `${year} AE · C.${cycle}`;
  };

  const updateRail = () => {
    if (!railFill) return;
    const max = host.scrollHeight - host.clientHeight;
    const fill = max <= 0 ? 1 : 1 - host.scrollTop / max;
    railFill.style.transform = `scaleY(${Math.max(0, Math.min(1, fill))})`;
  };

  const tokenize = (text, breakAll) => {
    if (!text) return [];
    if (breakAll) return Array.from(text);
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

  const buildPages = (text, breakAll) => {
    const spread = reader.querySelector(".flog-reader__spread");
    const col = reader.querySelector(".flog-reader__col");
    if (!spread || !col) return [{ left: text, right: "" }];

    const colW = col.clientWidth;
    const colH = col.clientHeight;
    if (colW < 8 || colH < 8) return [{ left: text, right: "" }];

    const measure = document.createElement("div");
    measure.className = `flog-reader__measure${breakAll ? " is-corrupt" : ""}`;
    measure.style.width = `${colW}px`;
    measure.style.font = getComputedStyle(col).font;
    measure.style.fontSize = getComputedStyle(col).fontSize;
    measure.style.lineHeight = getComputedStyle(col).lineHeight;
    measure.style.letterSpacing = getComputedStyle(col).letterSpacing;
    document.body.appendChild(measure);

    const tokens = tokenize(text, breakAll);
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
    const left = reader.querySelector('[data-col="0"]');
    const right = reader.querySelector('[data-col="1"]');
    const prev = reader.querySelector(".flog-turn--prev");
    const next = reader.querySelector(".flog-turn--next");
    const folio = reader.querySelector(".flog-reader__folio");
    if (!left || !right || !prev || !next) return;

    const page = pages[pageIndex] || { left: "", right: "" };
    left.textContent = page.left;
    right.textContent = page.right;

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
    syncEntryDisplay(activeEntry);
    const body = activeEntry.corrupted
      ? corruptHint
      : activeEntry.authorBody ?? activeEntry.body ?? "";
    const keep = pageIndex;
    pages = buildPages(body, false);
    pageIndex = Math.min(keep, Math.max(0, pages.length - 1));
    paintPage();
  };

  const showIdle = () => {
    activeEntry = null;
    pages = [];
    pageIndex = 0;
    reader.innerHTML = `<p class="flog__idle">${idle}</p>`;
    if (selectedBtn) {
      selectedBtn.classList.remove("is-active");
      selectedBtn = null;
    }
  };

  const showEntry = (entry, btn) => {
    syncEntryDisplay(entry);
    if (selectedBtn) selectedBtn.classList.remove("is-active");
    selectedBtn = btn;
    btn.classList.add("is-active");
    audio.play("open");

    activeEntry = entry;
    pageIndex = 0;
    const status = entry.corrupted ? "CORRUPTED" : "RECOVERED";
    const titleCls = entry.corrupted
      ? "flog-reader__title flog-reader__title--corrupt"
      : "flog-reader__title";
    const colCls = entry.corrupted
      ? "flog-reader__col flog-reader__col--corrupt"
      : "flog-reader__col";
    const displayTitle = entry.corrupted
      ? entry.title
      : entry.authorTitle || entry.title || "Untitled";

    reader.innerHTML = `
      <header class="flog-reader__head">
        <p class="flog-reader__status">${status}</p>
        <h3 class="${titleCls}">${displayTitle}</h3>
        <p class="flog-reader__date">${formatDate(entry)}</p>
      </header>
      <div class="flog-reader__stage">
        <button type="button" class="flog-turn flog-turn--prev" aria-label="Previous page" disabled>‹</button>
        <div class="flog-reader__spread">
          <div class="${colCls}" data-col="0"></div>
          <div class="${colCls}" data-col="1"></div>
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

    requestAnimationFrame(() => {
      layoutEntry();
      requestAnimationFrame(layoutEntry);
    });
  };

  const applySearch = (raw) => {
    const hits = recoverByQuery(raw, journals);
    if (hits.length) {
      hits.forEach(({ entry }) => syncEntryDisplay(entry));
      rebuildJournalList();
      applyClearanceUI();
      const last = hits[hits.length - 1];
      if (last?.grantedImperial) {
        audio.play("imperial");
      }
    }

    const q = raw.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

    host.querySelectorAll(".flog-journal").forEach((details) => {
      const journalName = (
        details.querySelector(".flog-journal__name")?.textContent || ""
      ).toLowerCase();
      let anyVisible = !tokens.length;

      details.querySelectorAll(".flog-entry").forEach((btn) => {
        const hay = (btn.dataset.search || "").toLowerCase();
        const match =
          !tokens.length ||
          tokens.every((t) => hay.includes(t) || journalName.includes(t));
        btn.closest("li").hidden = !match;
        if (match) anyVisible = true;
      });

      details.hidden = !anyVisible;
      if (tokens.length && anyVisible) details.open = true;
    });

    updateRail();
  };

  const rebuildJournalList = () => {
    const openId = host.querySelector(".flog-journal[open]")?.dataset.journal;
    host.replaceChildren();
    journals.forEach((journal, ji) => {
      const details = document.createElement("details");
      details.className = "flog-journal";
      details.dataset.journal = journal.id;
      details.open =
        openId === journal.id || (!openId && ji === journals.length - 1);

      const spanText = journal.titleCorrupted
        ? journal.spanDisplay ?? "····–···· AE"
        : `${journal.yearStart}–${journal.yearEnd} AE`;

      const summary = document.createElement("summary");
      summary.className = "flog-journal__summary";
      summary.innerHTML = `
      <span class="flog-journal__name${journal.titleCorrupted ? " is-corrupt" : ""}">${journal.title}</span>
      <span class="flog-journal__span">${spanText}</span>`;
      details.appendChild(summary);

      const list = document.createElement("ul");
      list.className = "flog-journal__entries";

      (journal.entries ?? []).forEach((entry) => {
        syncEntryDisplay(entry);
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "flog-entry";
        btn.dataset.sfx = "open";
        btn.dataset.entryId = entry.id;
        const listTitle = entry.corrupted
          ? entry.title
          : entry.authorTitle || entry.title || "Untitled";
        btn.dataset.search = [
          journal.title,
          entry.authorTitle,
          listTitle,
          entry.year,
          entry.cycle,
          ...(entry.unlockKeywords ?? []),
        ]
          .filter(Boolean)
          .join(" ");
        btn.innerHTML = `
        <span class="flog-entry__date">${formatListDate(entry)}</span>
        <span class="flog-entry__title${entry.corrupted ? " is-corrupt" : ""}">${listTitle}</span>
        <span class="flog-entry__flag">${entry.corrupted ? "Ø" : "·"}</span>`;
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          showEntry(entry, btn);
        });
        li.appendChild(btn);
        list.appendChild(li);
      });

      details.appendChild(list);
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        host.querySelectorAll(".flog-journal").forEach((other) => {
          if (other !== details) other.open = false;
        });
        requestAnimationFrame(updateRail);
      });
      host.appendChild(details);
    });
  };

  const bindSplit = () => {
    if (!flog || !split) return;
    const index = flog.querySelector(".flog__index");
    if (!index) return;

    const applyWidth = (px, vertical) => {
      if (vertical) {
        const total = flog.clientHeight;
        const clamped = Math.max(total * 0.22, Math.min(total * 0.65, px));
        index.style.flexBasis = `${clamped}px`;
        flog.style.setProperty("--flog-index-w", `${clamped}px`);
      } else {
        const total = flog.clientWidth;
        const clamped = Math.max(160, Math.min(total * 0.68, px));
        index.style.flexBasis = `${clamped}px`;
        flog.style.setProperty("--flog-index-w", `${clamped}px`);
      }
    };

    let dragging = false;

    const onMove = (clientX, clientY) => {
      if (!dragging) return;
      const rect = flog.getBoundingClientRect();
      const vertical = window.matchMedia("(max-width: 720px)").matches;
      if (vertical) applyWidth(clientY - rect.top, true);
      else applyWidth(clientX - rect.left, false);
      layoutEntry();
    };

    split.addEventListener("pointerdown", (e) => {
      dragging = true;
      flog.classList.add("is-resizing");
      split.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    split.addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY));
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      flog.classList.remove("is-resizing");
      layoutEntry();
      updateRail();
    };
    split.addEventListener("pointerup", endDrag);
    split.addEventListener("pointercancel", endDrag);

    split.addEventListener("keydown", (e) => {
      const vertical = window.matchMedia("(max-width: 720px)").matches;
      const step = e.shiftKey ? 32 : 16;
      const current = index.getBoundingClientRect()[vertical ? "height" : "width"];
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        applyWidth(current - step, vertical);
        layoutEntry();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        applyWidth(current + step, vertical);
        layoutEntry();
      }
    });
  };

  host.replaceChildren();
  rebuildJournalList();

  host.addEventListener("scroll", updateRail, { passive: true });
  window.addEventListener("resize", () => {
    updateRail();
    layoutEntry();
  });
  requestAnimationFrame(updateRail);

  if (searchInput) {
    searchInput.addEventListener("input", () => applySearch(searchInput.value));
  }
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applySearch(searchInput?.value ?? "");
    });
  }

  bindSplit();

  /* Open the first seeded recovered entry so the ARG starts mid-story */
  const seedEntry = journals
    .flatMap((j) => j.entries ?? [])
    .filter((e) => e.seedAfterPad && isEntryRecovered(e.id, e))
    .sort((a, b) => (a.tellOrder ?? 999) - (b.tellOrder ?? 999))[0];

  if (seedEntry) {
    const btn = host.querySelector(
      `.flog-entry[data-entry-id="${seedEntry.id}"]`
    );
    const details = btn?.closest(".flog-journal");
    if (details) details.open = true;
    if (btn) showEntry(seedEntry, btn);
    else showIdle();
  } else {
    showIdle();
  }
}
