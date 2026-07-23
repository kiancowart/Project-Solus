/**
 * LATTICE.OS — Hull plan & FTH console
 */

import { audio } from "./audio.js";

export function initHullPlan() {
  const plan = document.getElementById("hull-plan");
  const eye = document.getElementById("hull-plan-eye");
  const tabs = document.querySelectorAll("[data-hull-tab]");
  const outer = document.getElementById("hull-view-outer");
  const inner = document.getElementById("hull-view-inner");

  if (eye && plan) {
    eye.addEventListener("click", () => {
      const on = eye.classList.toggle("is-on");
      plan.classList.toggle("is-labels-off", !on);
      eye.setAttribute("aria-pressed", on ? "true" : "false");
      eye.setAttribute(
        "aria-label",
        on ? "Hide station labels" : "Show station labels"
      );
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
}

export function initFthConsole() {
  const consoleEl = document.getElementById("fth-console");
  const form = document.getElementById("fth-console-form");
  const input = document.getElementById("fth-console-input");
  const log = document.getElementById("fth-console-log");
  const awaitEl = document.getElementById("fth-console-await");
  if (!form || !input || !log) return;

  consoleEl?.classList.add("is-awaiting");

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
    push(
      "ERR 0xFTH-RECOV — software still being recovered. No commands are operational yet.",
      "fth-console__line--err"
    );
  });
}
