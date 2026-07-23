/**
 * LATTICE.OS — Archives / ship memory digests
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

/** Minimal markdown → CRT-safe HTML for recovered digests. */
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
    const n = entries.length;
    meta.textContent = hasDeepClearance()
      ? `${n} PARTITION${n === 1 ? "" : "S"} · ONLINE`
      : `${n} PARTITION${n === 1 ? "" : "S"} · SEALED`;
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

  const showLocked = (label) => {
    pane.innerHTML = `
      <p class="adb-pane__title">${escapeHtml(label)}</p>
      <p class="adb-pane__pending">Partition locked · Imperial Clearance required</p>`;
  };

  const showRecord = (entry) => {
    if (!hasDeepClearance()) {
      showLocked(entry.title);
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
        const flag = deep ? "READY" : "SEALED";
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
    let status;
    if (!hits.length) {
      status = "NO MEMORY HITS";
    } else if (!deep) {
      status = `${hits.length} HIT${hits.length === 1 ? "" : "S"} · PARTITION LOCKED`;
    } else {
      status = `${hits.length} HIT${hits.length === 1 ? "" : "S"} · SHIP MEMORY`;
    }
    push(status, "adb__line--out");
    showHitList(hits, query);
  });
}
