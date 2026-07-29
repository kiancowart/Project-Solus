/**
 * LATTICE.OS — Flight Log (ARG hub)
 */

import { FLIGHT_LOG } from "../content/boot-content.js";
import { audio } from "./audio.js";
import { applyClearanceUI } from "./clearance.js";
import {
  isEntryRecovered,
  isJournalUnlocked,
  recoverByQuery,
  unlockJournalWithCode,
} from "./milestones.js";
import { markFragmentRecovered } from "./progress.js";

/* ==========================================================================
   FLIGHT LOG — journals, reader, keyword recovery, volume keys
   ========================================================================== */

export function initFlightLog() {
  const flog = document.getElementById("flog");
  const host = document.getElementById("flog-journals");
  const reader = document.getElementById("flog-reader");
  const searchForm = document.getElementById("flog-search");
  const searchInput = document.getElementById("flog-query");
  const railFill = document.getElementById("flog-rail-fill");
  const split = document.getElementById("flog-split");
  const journalCountEl = document.getElementById("flog-journal-count");
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
  const idleHint =
    FLIGHT_LOG.idleHint ??
    [
      "Search recovery keywords to decrypt sealed entries.",
      "Each journal tracks recovered / total partitions.",
      "Locked volumes need a three-digit access key.",
    ].join("\n");

  let selectedBtn = null;
  let activeEntry = null;
  let pages = [];
  let pageIndex = 0;
  let keyTarget = null;

  const corruptToken = (len = 8) => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz0123456789/·#";
    let out = "";
    for (let i = 0; i < len; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  };

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
      if (
        isEntryRecovered(e.id, e) &&
        (e.fragmentId || e.imperialFragment)
      ) {
        markFragmentRecovered(e.fragmentId || e.imperialFragment);
      }
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

  const entryStats = (journal) => {
    const entries = journal.entries ?? [];
    const total = entries.length;
    const recovered = entries.filter((e) => isEntryRecovered(e.id, e)).length;
    return { recovered, total };
  };

  const updateJournalCount = () => {
    if (!journalCountEl) return;
    const total = journals.length;
    const open = journals.filter((j) => isJournalUnlocked(j)).length;
    journalCountEl.textContent = `${open}/${total}`;
  };

  const updateRail = () => {
    if (!railFill) return;
    const max = host.scrollHeight - host.clientHeight;
    const fill = max <= 0 ? 1 : host.scrollTop / max;
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
    keyTarget = null;
    pages = [];
    pageIndex = 0;
    reader.innerHTML = `
      <div class="flog__idle-block">
        <p class="flog__idle">${idle}</p>
        <p class="flog__idle-hint">${idleHint.replace(/\n/g, "<br />")}</p>
      </div>`;
    if (selectedBtn) {
      selectedBtn.classList.remove("is-active");
      selectedBtn = null;
    }
  };

  const showJournalKeyPad = (journal) => {
    activeEntry = null;
    keyTarget = journal;
    pages = [];
    pageIndex = 0;
    if (selectedBtn) {
      selectedBtn.classList.remove("is-active");
      selectedBtn = null;
    }

    const label = journal.titleCorrupted
      ? "CORRUPTED VOLUME"
      : journal.title || "JOURNAL";

    reader.innerHTML = `
      <div class="flog-key">
        <p class="flog-key__status">VOLUME LOCKED</p>
        <h3 class="flog-key__title">${label}</h3>
        <p class="flog-key__meta">${journal.yearStart}–${journal.yearEnd} AE</p>
        <p class="flog-key__copy">Enter three-digit access key to open this journal.</p>
        <form class="flog-key__form" id="flog-key-form" autocomplete="off">
          <label class="visually-hidden" for="flog-key-input">Journal access key</label>
          <input
            class="flog-key__input"
            id="flog-key-input"
            type="text"
            inputmode="numeric"
            maxlength="3"
            pattern="[0-9]*"
            placeholder="···"
            spellcheck="false"
          />
          <button type="submit" class="flog-key__submit">UNLOCK</button>
        </form>
        <p class="flog-key__feedback" id="flog-key-feedback" aria-live="polite"></p>
      </div>`;

    const form = reader.querySelector("#flog-key-form");
    const input = reader.querySelector("#flog-key-input");
    const feedback = reader.querySelector("#flog-key-feedback");
    input?.focus();

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = input?.value ?? "";
      const result = unlockJournalWithCode(journal, code);
      if (!result.ok) {
        audio.play("deny");
        if (feedback) {
          feedback.textContent =
            result.reason === "unknown"
              ? "NO KEY ON RECORD FOR THIS VOLUME"
              : "ACCESS DENIED";
          feedback.classList.add("is-deny");
        }
        form.classList.remove("is-shake");
        void form.offsetWidth;
        form.classList.add("is-shake");
        return;
      }

      if (feedback) {
        feedback.textContent = "VOLUME OPEN";
        feedback.classList.remove("is-deny");
      }
      rebuildJournalList(journal.id);
      updateJournalCount();
      const details = host.querySelector(
        `.flog-journal[data-journal="${journal.id}"]`
      );
      if (details) details.open = true;
      showIdle();
      syncIndexVisibility();
    });
  };

  const showEntry = (entry, btn) => {
    keyTarget = null;
    syncEntryDisplay(entry);
    if (selectedBtn) selectedBtn.classList.remove("is-active");
    selectedBtn = btn;
    btn.classList.add("is-active");
    audio.play("dropdownToggle");

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

  const missEl = document.getElementById("flog-index-miss");
  const awaitEl = document.getElementById("flog-index-await");
  let searchFocused = false;
  let committedQuery = null;

  const wordsOf = (text) =>
    String(text ?? "")
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  /** Exact word / keyword match — case-insensitive; symbols kept (im ≠ i'm). */
  const entryMatchesQuery = (btn, query) => {
    const q = String(query ?? "")
      .trim()
      .toLowerCase();
    if (!q) return true;

    const keywords = String(btn.dataset.keywords || "")
      .toLowerCase()
      .split("\u001f")
      .filter(Boolean);
    if (keywords.includes(q)) return true;

    return wordsOf(btn.dataset.search || "").includes(q);
  };

  const setMissVisible = (show) => {
    if (!missEl) return;
    missEl.hidden = !show;
  };

  const setAwaitVisible = (show) => {
    if (!awaitEl) return;
    awaitEl.hidden = !show;
  };

  const syncIndexVisibility = () => {
    if (searchFocused) {
      host.classList.add("is-suppressed");
      setMissVisible(false);
      setAwaitVisible(true);
      return;
    }

    setAwaitVisible(false);

    if (committedQuery == null || committedQuery === "") {
      host.classList.remove("is-suppressed");
      host.querySelectorAll(".flog-journal").forEach((details) => {
        details.hidden = false;
        details.querySelectorAll(".flog-entry").forEach((btn) => {
          const li = btn.closest("li");
          if (li) li.hidden = false;
        });
      });
      setMissVisible(false);
      updateJournalCount();
      updateRail();
      return;
    }

    let anyVisible = false;
    host.querySelectorAll(".flog-journal").forEach((details) => {
      if (details.classList.contains("is-locked")) {
        details.hidden = true;
        return;
      }

      let journalHit = false;
      details.querySelectorAll(".flog-entry").forEach((btn) => {
        const match = entryMatchesQuery(btn, committedQuery);
        const li = btn.closest("li");
        if (li) li.hidden = !match;
        if (match) journalHit = true;
      });

      details.hidden = !journalHit;
      if (journalHit) {
        details.open = true;
        anyVisible = true;
      }
    });

    if (anyVisible) {
      host.classList.remove("is-suppressed");
      setMissVisible(false);
    } else {
      host.classList.add("is-suppressed");
      setMissVisible(true);
    }
    updateJournalCount();
    updateRail();
  };

  const commitSearch = (raw) => {
    const q = String(raw ?? "").trim();
    committedQuery = q || null;
    searchFocused = false;

    let playedStinger = false;
    if (q) {
      const hits = recoverByQuery(q, journals);
      if (hits.length) {
        hits.forEach(({ entry, fragmentId }) => {
          syncEntryDisplay(entry);
          const frag =
            fragmentId ||
            entry.fragmentId ||
            entry.imperialFragment ||
            null;
          if (frag) markFragmentRecovered(frag);
        });
        rebuildJournalList();
        applyClearanceUI();
        window.dispatchEvent(new CustomEvent("lattice:fragments"));
        const last = hits[hits.length - 1];
        if (last?.grantedImperial) {
          audio.play("imperial");
          playedStinger = true;
        }
      }
    }

    syncIndexVisibility();

    if (q && !playedStinger) {
      const hasResults = [...host.querySelectorAll(".flog-entry")].some(
        (btn) => {
          const journal = btn.closest(".flog-journal");
          const li = btn.closest("li");
          return (
            journal &&
            !journal.hidden &&
            li &&
            !li.hidden
          );
        }
      );
      if (hasResults) audio.play("flogSearchHit");
      else audio.play("deny");
    }

    searchInput?.blur();
  };

  const rebuildJournalList = (preferOpenId = null) => {
    const openId =
      preferOpenId ?? host.querySelector(".flog-journal[open]")?.dataset.journal;
    host.replaceChildren();

    journals.forEach((journal) => {
      const unlocked = isJournalUnlocked(journal);
      const { recovered, total } = entryStats(journal);

      const details = document.createElement("details");
      details.className = "flog-journal";
      details.dataset.journal = journal.id;
      if (!unlocked) details.classList.add("is-locked");
      // Never auto-open on first paint; only restore an already-open volume
      details.open = Boolean(unlocked && openId && openId === journal.id);

      const spanText = journal.titleCorrupted
        ? journal.spanDisplay ?? "····–···· AE"
        : `${journal.yearStart}–${journal.yearEnd} AE`;

      const summary = document.createElement("summary");
      summary.className = "flog-journal__summary";
      summary.innerHTML = `
      <span class="flog-journal__name${journal.titleCorrupted ? " is-corrupt" : ""}">${journal.title}</span>
      <span class="flog-journal__meta">
        <span class="flog-journal__count">${recovered}/${total}</span>
        <span class="flog-journal__span">${spanText}</span>
      </span>`;
      details.appendChild(summary);

      if (!unlocked) {
        summary.addEventListener("click", (e) => {
          e.preventDefault();
          details.open = false;
          audio.play("dropdownToggle");
          showJournalKeyPad(journal);
        });
        host.appendChild(details);
        return;
      }

      const list = document.createElement("ul");
      list.className = "flog-journal__entries";

      (journal.entries ?? []).forEach((entry) => {
        syncEntryDisplay(entry);
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "flog-entry";
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
        btn.dataset.keywords = (entry.unlockKeywords ?? []).join("\u001f");
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
      let silencingPeers = false;
      details.addEventListener("toggle", () => {
        if (!silencingPeers) audio.play("dropdownToggle");
        if (!details.open) return;
        silencingPeers = true;
        host.querySelectorAll(".flog-journal").forEach((other) => {
          if (other !== details) other.open = false;
        });
        silencingPeers = false;
        requestAnimationFrame(updateRail);
      });
      host.appendChild(details);
    });

    updateJournalCount();
    syncIndexVisibility();
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
  showIdle();

  initFlightLog.refreshAccess = () => {
    journals.forEach((j) => {
      (j.entries ?? []).forEach((e) => {
        syncEntryDisplay(e);
        if (
          isEntryRecovered(e.id, e) &&
          (e.fragmentId || e.imperialFragment)
        ) {
          markFragmentRecovered(e.fragmentId || e.imperialFragment);
        }
      });
    });
    rebuildJournalList();
    updateJournalCount();
    if (activeEntry) layoutEntry();
  };

  host.addEventListener("scroll", updateRail, { passive: true });
  window.addEventListener("resize", () => {
    updateRail();
    layoutEntry();
  });
  requestAnimationFrame(updateRail);

  if (searchInput) {
    searchInput.addEventListener("focus", () => {
      searchFocused = true;
      syncIndexVisibility();
    });
    searchInput.addEventListener("blur", () => {
      // Keep list suppressed only while focused; restore last committed view
      searchFocused = false;
      syncIndexVisibility();
    });
  }
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      commitSearch(searchInput?.value ?? "");
    });
  }

  bindSplit();
}
