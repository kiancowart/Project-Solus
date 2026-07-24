/**
 * LATTICE.OS — Cartography / wire globe
 */

import { SYSTEM_CHART } from "../content/boot-content.js";
import { PLANET_DOSSIERS } from "../content/arg-path.js";
import { audio } from "./audio.js";
import { prefersReducedMotion } from "./motion.js";

/* ==========================================================================
   CARTOGRAPHY — The Nine orbital chart
   ========================================================================== */

export function polarToXY(cx, cy, r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
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
    audio.play("select");
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    readout.innerHTML = `
      <p class="chart__dossier-title">${d.title}</p>
      <p class="chart__dossier-slot">${d.slotMark}</p>
      <p class="chart__dossier-body">${d.body}</p>`;
  };

  const showSturm = () => {
    audio.play("select");
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
    audio.play("select");
    if (stopWire) {
      stopWire();
      stopWire = null;
    }
    const text = mystery?.readout ?? "A mystery in the orbit of Unconquered Storm...";
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
    // Primary is not a labeled body — always error, no sticky box
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
    add("circle", { class: "chart-svg__hit", cx: 0, cy: 0, r: Math.max(12, body.size + 8) }, g);
    const content = add("g", { class: "chart-svg__content" }, g);
    add("circle", { class: "chart-svg__dot", cx: 0, cy: 0, r: body.size }, content);
    const label = add("text", { class: "chart-svg__label", x: body.size + 4, y: 2.5 }, content);
    label.textContent = body.name;
    g.setAttribute("transform", `translate(${x} ${y})`);
    bindBody(g, body.id, () => showDossier(body.id));

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
    const parentXY = parent ? polarToXY(cx, cy, parent.r, parent.angle) : { x: cx, y: cy };
    const xy = polarToXY(parentXY.x, parentXY.y, cfg.offset ?? 16, cfg.angle ?? 0);

    add("rect", { class: "chart-svg__box", x: 0, y: 0, width: 1, height: 1 }, g);
    add("circle", { class: "chart-svg__hit", cx: 0, cy: 0, r: 14 }, g);
    const content = add("g", { class: "chart-svg__content" }, g);
    const mark = add("text", { class: "chart-svg__mark", x: 0, y: 4, "text-anchor": "middle" }, content);
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
    "Unidentified object in Teavicta orbit",
    showMystery
  );

  mapHost.replaceChildren(svg);
  // Boxes need layout after mount (getComputedTextLength / fonts)
  const refitAll = () => {
    svg
      .querySelectorAll(".chart-svg__body, .chart-svg__sturm, .chart-svg__mystery")
      .forEach((g) => fitSelectBox(g));
  };
  refitAll();
  requestAnimationFrame(refitAll);
  if (document.fonts?.ready) document.fonts.ready.then(refitAll);

  showIdle();

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
 * Meridians sweep L→R; poles remapped onto the rim circle.
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
  // Stretch Y so tilted poles land on the outer circle
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

  // Clip grid to the rim so stretch never spills outside the sphere
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
  const periodMs = 11000; // slower spin

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

