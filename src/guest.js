/**
 * LATTICE.OS — Guest channel
 */

import { GUEST_CAMPAIGNS } from "../content/boot-content.js";
import { hasDeepClearance } from "./clearance.js";
import { escapeHtml } from "./archives.js";

export function initGuestChannel() {
  const host = document.getElementById("guest-roster");
  if (!host) return;

  const campaigns = GUEST_CAMPAIGNS?.campaigns ?? [];
  const visible = campaigns.filter((c) => c && c.status !== "SEALED");

  if (!hasDeepClearance()) {
    host.innerHTML = "";
    return;
  }

  if (!visible.length) {
    host.innerHTML = `
      <div class="guest-empty locked-block locked-block--aux">
        <p class="locked-block__sigil" aria-hidden="true">▽</p>
        <p class="guest-empty__title">${escapeHtml(GUEST_CAMPAIGNS?.emptyTitle ?? "GUEST CHANNEL")}</p>
        <p class="locked-block__text">${escapeHtml(
          GUEST_CAMPAIGNS?.emptyBody ??
            "AUX link idle — no active roster. Campaign dossiers will appear here."
        )}</p>
      </div>`;
    return;
  }

  const cards = visible
    .map((camp) => {
      const status = String(camp.status || "ACTIVE").toUpperCase();
      return `
        <article class="guest-card" data-status="${escapeHtml(status)}">
          <header class="guest-card__head">
            <p class="guest-card__status">${escapeHtml(status)}</p>
            <h3 class="guest-card__title">${escapeHtml(camp.title)}</h3>
            ${
              camp.cycle
                ? `<p class="guest-card__cycle">${escapeHtml(camp.cycle)}</p>`
                : ""
            }
          </header>
          <p class="guest-card__brief">${escapeHtml(camp.briefing ?? "")}</p>
        </article>`;
    })
    .join("");

  host.innerHTML = `
    <header class="guest-roster__head">
      <p class="guest-roster__label">AUX · CAMPAIGN ROSTER</p>
      <p class="guest-roster__meta">${visible.length} DOSSIER${visible.length === 1 ? "" : "S"}</p>
    </header>
    <div class="guest-roster__list">${cards}</div>`;
}
