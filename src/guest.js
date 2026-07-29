/**
 * LATTICE.OS — Guest channel sub-panels
 */

const NOISE_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz0123456789/·#▓░▒";

function makeCorruptNoise(len = 52) {
  let out = "";
  for (let i = 0; i < len; i++) {
    if (i > 0 && i % 13 === 0) out += " ";
    else out += NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)];
  }
  return out;
}

/** Paint a fresh corrupt string in the signal channel display. */
export function refreshGuestCorruptDisplay() {
  const el = document.getElementById("guest-corrupt-display");
  if (el) el.textContent = makeCorruptNoise();
}

export function initGuestChannel() {
  refreshGuestCorruptDisplay();
}
