/**
 * LATTICE.OS — Header compass (ship / Skyrim-style heading ribbon)
 * Idle drift + live gyro readouts for an active FUI feel.
 */

import { prefersReducedMotion } from "./motion.js";

const CARDINAL_DEG = { N: 0, E: 90, S: 180, W: 270 };
const DEG_CARDINAL = { 0: "N", 90: "E", 180: "S", 270: "W" };

const POINT_LABELS = {
  0: "N",
  45: "NE",
  90: "E",
  135: "SE",
  180: "S",
  225: "SW",
  270: "W",
  315: "NW",
};

/** Pixels per degree — denser ticks read more like a binnacle card */
const PX_PER_DEG = 2.6;
const LOOP = 360;
const ANIM_MS = 700;
/** Extra copies on each side so wide viewports never run out mid-scroll */
const LOOPS_BEFORE = 2;
const LOOPS_AFTER = 2;
/** Minor tick every 5°; numbered every 15°; named every 45° */
const TICK_STEP = 5;
const NUMBER_STEP = 15;
const POINT_STEP = 45;

let heading = 90; // locked cardinal target
let displayHeading = 90;
let root = null;
let ribbon = null;
let readoutEl = null;
let rateEl = null;
let modeEl = null;
let animFrame = 0;
let animFrom = 90;
let animTo = 90;
let animStart = 0;
let lastPaintHeading = 90;
let lastNow = 0;

/** Organic idle wander around the locked heading (degrees). */
let drift = 0;
let driftVel = 0;
let driftTarget = 0;
let driftRetargetAt = 0;
let breathPhase = 0;
let scanPhase = 0;
let readoutAcc = 0;

function wrapDeg(d) {
  return ((d % 360) + 360) % 360;
}

/**
 * Unwrapped target heading for smooth tweening (may be <0 or >360).
 * Prefer the shorter arc; on exact 180° ties, turn clockwise.
 */
function shortestTarget(from, to) {
  const a = from;
  const b = wrapDeg(to);
  const aNorm = wrapDeg(a);
  let delta = b - aNorm;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  if (delta === -180) delta = 180;
  return a + delta;
}

/** Fold display into [0, 360) without changing the painted frame (periodic ribbon). */
function foldDisplayHeading() {
  while (displayHeading >= LOOP) displayHeading -= LOOP;
  while (displayHeading < 0) displayHeading += LOOP;
}

function tickClass(deg) {
  if (deg % POINT_STEP === 0) return "compass-bar__tick compass-bar__tick--point";
  if (deg % NUMBER_STEP === 0) return "compass-bar__tick compass-bar__tick--mid";
  if (deg % 10 === 0) return "compass-bar__tick compass-bar__tick--ten";
  return "compass-bar__tick";
}

function buildRibbon() {
  if (!ribbon) return;
  ribbon.replaceChildren();

  const totalLoops = LOOPS_BEFORE + LOOPS_AFTER + 1;
  const originPx = -LOOPS_BEFORE * LOOP * PX_PER_DEG;

  const baseline = document.createElement("div");
  baseline.className = "compass-bar__baseline";
  baseline.style.left = `${originPx}px`;
  baseline.style.width = `${totalLoops * LOOP * PX_PER_DEG}px`;
  baseline.style.right = "auto";
  ribbon.appendChild(baseline);

  for (let loop = -LOOPS_BEFORE; loop <= LOOPS_AFTER; loop++) {
    for (let deg = 0; deg < LOOP; deg += TICK_STEP) {
      const abs = deg + loop * LOOP;
      const x = abs * PX_PER_DEG;

      const tick = document.createElement("span");
      tick.className = tickClass(deg);
      tick.style.left = `${x}px`;
      tick.setAttribute("aria-hidden", "true");
      ribbon.appendChild(tick);

      const label = POINT_LABELS[deg];
      if (label) {
        const lab = document.createElement("span");
        lab.className =
          deg % 90 === 0
            ? "compass-bar__label compass-bar__label--cardinal"
            : "compass-bar__label";
        lab.textContent = label;
        lab.style.left = `${x}px`;
        ribbon.appendChild(lab);
      }

      if (deg % NUMBER_STEP === 0) {
        const num = document.createElement("span");
        num.className =
          deg % POINT_STEP === 0
            ? "compass-bar__deg compass-bar__deg--point"
            : "compass-bar__deg";
        num.textContent = String(deg);
        num.style.left = `${x}px`;
        ribbon.appendChild(num);
      }
    }
  }

  ribbon.style.width = `${totalLoops * LOOP * PX_PER_DEG}px`;
}

function pickDriftTarget(now) {
  // Soft wander ±0.35–1.1° with occasional quieter holds
  const quiet = Math.random() < 0.28;
  driftTarget = quiet ? (Math.random() - 0.5) * 0.25 : (Math.random() - 0.5) * 2.2;
  driftRetargetAt = now + 900 + Math.random() * 2200;
}

function stepIdleDrift(dt, now) {
  if (prefersReducedMotion() || animStart) {
    // Ease drift out while slewing so cardinal anim stays clean
    drift *= 0.85;
    driftVel *= 0.85;
    return;
  }
  if (now >= driftRetargetAt) pickDriftTarget(now);

  // Critically-damped-ish spring toward wander target
  const stiffness = 6.5;
  const damping = 4.2;
  const force = (driftTarget - drift) * stiffness - driftVel * damping;
  driftVel += force * dt;
  drift += driftVel * dt;
  // Clamp so it never looks broken
  if (drift > 1.6) drift = 1.6;
  if (drift < -1.6) drift = -1.6;
}

function updateHud(dt, paintedHeading) {
  if (!readoutEl) return;
  const shown = wrapDeg(paintedHeading);
  const rate = (paintedHeading - lastPaintHeading) / Math.max(dt, 0.001);
  lastPaintHeading = paintedHeading;

  readoutAcc += dt;
  // Refresh digits ~12 Hz so they feel live without thrashing the DOM
  if (readoutAcc < 1 / 12 && Math.abs(rate) < 0.05) return;
  readoutAcc = 0;

  const whole = Math.floor(shown);
  const frac = Math.floor((shown % 1) * 10);
  readoutEl.textContent = `${String(whole).padStart(3, "0")}.${frac}°`;

  if (rateEl) {
    const r = Math.abs(rate) < 0.08 ? 0 : rate;
    const sign = r > 0.05 ? "+" : r < -0.05 ? "−" : " ";
    rateEl.textContent = `${sign}${Math.abs(r).toFixed(1)}°/s`;
    rateEl.dataset.sign = r > 0.05 ? "cw" : r < -0.05 ? "ccw" : "flat";
  }

  if (modeEl) {
    modeEl.textContent = animStart ? "SLEW" : "GYRO";
    modeEl.classList.toggle("is-slewing", Boolean(animStart));
  }
}

function paint() {
  if (!ribbon) return;
  breathPhase += 0.018;
  scanPhase += 0.03;

  const breath = prefersReducedMotion() ? 0 : Math.sin(breathPhase) * 0.12;
  const painted = displayHeading + drift + breath;
  const x = -(painted + LOOPS_BEFORE * LOOP) * PX_PER_DEG;
  ribbon.style.transform = `translate3d(${x}px, 0, 0)`;

  if (root) {
    const scan = prefersReducedMotion()
      ? 0.5
      : 0.5 + Math.sin(scanPhase) * 0.5;
    root.style.setProperty("--compass-scan", String(scan));
    root.style.setProperty(
      "--compass-breath",
      String(0.72 + Math.sin(breathPhase * 0.7) * 0.18)
    );
  }
}

function finishAnim() {
  displayHeading = animTo;
  heading = wrapDeg(animTo);
  foldDisplayHeading();
  animStart = 0;
  drift = 0;
  driftVel = 0;
  pickDriftTarget(performance.now());
  paint();
  window.dispatchEvent(
    new CustomEvent("lattice:compass", {
      detail: { heading, cardinal: getCompassCardinal() },
    })
  );
}

function tick(now) {
  const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016;
  lastNow = now;

  if (animStart) {
    const t = Math.min(1, (now - animStart) / ANIM_MS);
    const ease = t * (2 - t);
    displayHeading = animFrom + (animTo - animFrom) * ease;
    if (t >= 1) finishAnim();
  }

  stepIdleDrift(dt, now);
  paint();
  updateHud(dt, displayHeading + drift);
  animFrame = requestAnimationFrame(tick);
}

export function getCompassHeading() {
  return wrapDeg(heading);
}

export function getCompassCardinal() {
  const h = Math.round(wrapDeg(heading) / 90) * 90;
  return DEG_CARDINAL[wrapDeg(h)] ?? "E";
}

export function setCompassCardinal(cardinal, { animate = true } = {}) {
  const key = String(cardinal ?? "E").toUpperCase();
  const deg = CARDINAL_DEG[key];
  if (deg == null) return;

  const from = displayHeading;
  const to = shortestTarget(from, deg);
  heading = wrapDeg(deg);

  if (!animate || prefersReducedMotion() || Math.abs(to - from) < 0.05) {
    animStart = 0;
    displayHeading = to;
    foldDisplayHeading();
    drift = 0;
    driftVel = 0;
    paint();
    window.dispatchEvent(
      new CustomEvent("lattice:compass", {
        detail: { heading, cardinal: key },
      })
    );
    return;
  }

  animFrom = from;
  animTo = to;
  animStart = performance.now();
}

export function resetCompass({ animate = true } = {}) {
  setCompassCardinal("E", { animate });
}

/** Brief CRT hitch on correct Teavicta eye lock-ins. */
export function glitchCompass({ durationMs = 220 } = {}) {
  const bar = root?.querySelector(".compass-bar");
  if (!bar || prefersReducedMotion()) return;
  bar.classList.remove("is-glitching");
  void bar.offsetWidth;
  bar.classList.add("is-glitching");
  window.setTimeout(() => {
    bar.classList.remove("is-glitching");
  }, durationMs);
}

export function initCompass() {
  root = document.getElementById("lattice-compass");
  if (!root) return;

  root.innerHTML = `
    <div class="compass-bar" role="img" aria-label="Heading East 090">
      <div class="compass-bar__meta" aria-hidden="true">
        <span class="compass-bar__mode" id="compass-mode">GYRO</span>
        <span class="compass-bar__readout" id="compass-readout">090.0°</span>
        <span class="compass-bar__rate" id="compass-rate" data-sign="flat"> 0.0°/s</span>
      </div>
      <span class="compass-bar__edge compass-bar__edge--left"></span>
      <div class="compass-bar__viewport">
        <div class="compass-bar__scan" aria-hidden="true"></div>
        <div class="compass-bar__ribbon" id="compass-ribbon"></div>
      </div>
      <span class="compass-bar__edge compass-bar__edge--right"></span>
      <div class="compass-bar__lubber">
        <span class="compass-bar__lubber-line"></span>
        <span class="compass-bar__lubber-cap"></span>
      </div>
    </div>`;

  ribbon = root.querySelector("#compass-ribbon");
  readoutEl = root.querySelector("#compass-readout");
  rateEl = root.querySelector("#compass-rate");
  modeEl = root.querySelector("#compass-mode");
  buildRibbon();
  heading = 90;
  displayHeading = 90;
  lastPaintHeading = 90;
  pickDriftTarget(performance.now());
  paint();

  cancelAnimationFrame(animFrame);
  lastNow = 0;
  animFrame = requestAnimationFrame(tick);

  const label = root.querySelector(".compass-bar");
  window.addEventListener("lattice:compass", (e) => {
    const c = e.detail?.cardinal;
    const h = e.detail?.heading;
    if (label && c != null && h != null) {
      label.setAttribute(
        "aria-label",
        `Heading ${c} ${String(Math.round(h)).padStart(3, "0")}`
      );
    }
  });
}
