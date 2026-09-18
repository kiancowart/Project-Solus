/**
 * =============================================================================
 * archives.js — Ship-memory search (Imperial-gated)
 * =============================================================================
 * WHAT THIS FILE DOES
 *   Searches LORE_CATALOG.entries (content/lore-catalog.js).
 *   recovered:true  → body opens only after Imperial Clearance
 *   recovered:false → search can hit; partition stays locked (mystery)
 *
 * WHERE TO EDIT LORE
 *   lore/Player Facing/Archives/Recovered/  — sparse readable digests
 *   lore/Player Facing/Archives/Sealed/     — index stubs (keywords only)
 *   Then: node scripts/build-lore-catalog.js
 * =============================================================================
 */

import { LORE_CATALOG } from "../content/lore-catalog.js";
import { audio } from "./audio.js";
import { hasDeepClearance } from "./clearance.js";

export function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal markdown → CRT-safe HTML (bold, italic, paragraphs). No raw HTML. */
export function renderLoreBody(md) {
  const raw = String(md ?? "").trim();
  if (!raw) return `<p class="adb-pane__pending">Recovery pending</p>`;

  const esc = escapeHtml(raw);
  const paras = esc.split(/\n{2,}/).map((block) => {
    let t = block.trim().replace(/\n/g, "<br>");
    t = t.replace(/^#+\s+/gm, "");
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>");
    t = t.replace(/^&gt;\s?/gm, "");
    t = t.replace(/^- /gm, "· ");
    return `<p class="adb-pane__text">${t}</p>`;
  });
  return paras.join("");
}

function partitionMetaText() {
  const entries = LORE_CATALOG?.entries ?? [];
  const n = entries.length;
  const r = LORE_CATALOG?.recoveredCount ?? entries.filter((e) => e.recovered).length;
  if (!hasDeepClearance()) {
    return `${n} PARTITION${n === 1 ? "" : "S"} · SEALED`;
  }
  return `${r}/${n} RECOVERED · ONLINE`;
}

/** Bind Archives search form (#adb-search). Token AND-match against entry.search. */
export function initArchives() {
  const form = document.getElementById("adb-search");
  const input = document.getElementById("adb-query");
  const log = document.getElementById("adb-log");
  const pane = document.getElementById("adb-pane");
  const meta = document.getElementById("adb-meta");
  if (!form || !input || !log || !pane) return;

  const entries = LORE_CATALOG?.entries ?? [];
  const paintMeta = () => {
    if (!meta) return;
    meta.textContent = partitionMetaText();
  };
  paintMeta();

  const push = (text, cls) => {
    const line = document.createElement("p");
    line.className = `adb__line${cls ? ` ${cls}` : ""}`;
    line.textContent = text;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  };

  const showPending = (label) => {
    pane.innerHTML = `
      <p class="adb-pane__title">${escapeHtml(label)}</p>
      <p class="adb-pane__pending">Recovery pending</p>`;
  };

  const showImperialLocked = (label) => {
    pane.innerHTML = `
      <p class="adb-pane__title">${escapeHtml(label)}</p>
      <p class="adb-pane__pending">Partition locked · Imperial Clearance required</p>`;
  };

  const showSealedIndex = (entry) => {
    pane.innerHTML = `
      <p class="adb-pane__status">INDEX MATCH · UNRECOVERED</p>
      <p class="adb-pane__title">${escapeHtml(entry.title)}</p>
      <p class="adb-pane__path">${escapeHtml(entry.path)}</p>
      <p class="adb-pane__pending">Lattice found a pointer. The body is corrupt or beyond this clearance.</p>`;
  };

  const showRecord = (entry) => {
    if (!entry.recovered) {
      showSealedIndex(entry);
      return;
    }
    if (!hasDeepClearance()) {
      showImperialLocked(entry.title);
      return;
    }
    if (!entry.body) {
      showPending(entry.title);
      return;
    }
    pane.innerHTML = `
      <p class="adb-pane__status">RECOVERED · SHIP MEMORY</p>
      <p class="adb-pane__title">${escapeHtml(entry.title)}</p>
      <p class="adb-pane__path">${escapeHtml(entry.path)}</p>
      <div class="adb-pane__body">${renderLoreBody(entry.body)}</div>`;
  };

  const showHitList = (hits, query) => {
    if (!hits.length) {
      showPending(query);
      return;
    }
    if (hits.length === 1) {
      showRecord(hits[0]);
      return;
    }
    const deep = hasDeepClearance();
    const items = hits
      .slice(0, 24)
      .map((entry) => {
        let flag = "SEALED";
        if (!entry.recovered) flag = "INDEX";
        else if (deep) flag = "READY";
        return `<button type="button" class="adb-hit" data-id="${escapeHtml(entry.id)}" data-sfx="open">
          <span class="adb-hit__title">${escapeHtml(entry.title)}</span>
          <span class="adb-hit__flag">${flag}</span>
        </button>`;
      })
      .join("");
    pane.innerHTML = `
      <p class="adb-pane__title">${escapeHtml(query)}</p>
      <p class="adb-pane__path">${hits.length} MATCHES</p>
      <div class="adb-hitlist">${items}</div>`;
    pane.querySelectorAll(".adb-hit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entry = hits.find((h) => h.id === btn.dataset.id);
        if (!entry) return;
        audio.play("open");
        showRecord(entry);
      });
    });
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    input.value = "";
    if (!query) return;

    audio.play("click");

    const idleLine = log.querySelector(".adb__line--sys");
    if (idleLine && log.children.length === 1) idleLine.remove();

    push(`> ${query}`, "adb__line--in");

    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = entries.filter((entry) =>
      tokens.every((t) => (entry.search || "").includes(t))
    );

    const deep = hasDeepClearance();
    const openable = hits.filter((h) => h.recovered);
    const sealedOnly = hits.length > 0 && openable.length === 0;

    let status;
    if (!hits.length) {
      status = "NO MEMORY HITS";
    } else if (sealedOnly) {
      status = `${hits.length} INDEX HIT${hits.length === 1 ? "" : "S"} · BODY UNRECOVERED`;
    } else if (!deep) {
      status = `${hits.length} HIT${hits.length === 1 ? "" : "S"} · PARTITION LOCKED`;
    } else {
      status = `${hits.length} HIT${hits.length === 1 ? "" : "S"} · SHIP MEMORY`;
    }
    push(status, "adb__line--out");
    showHitList(hits, query);
  });
}
