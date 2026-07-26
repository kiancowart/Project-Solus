/**
 * Intercept message audio reader.
 * Left rail tracks playback progress (top → bottom).
 * Click a point on the rail to jump there. Right rail mirrors scroll.
 */

/** Spoken Presage Projection intercept (Celeste). */
export const INTERCEPT_MESSAGE_AUDIO = "assets/audio/KCintercept.mp3";

function setRailFill(el, amount) {
  if (!el) return;
  const t = Math.max(0, Math.min(1, amount));
  el.style.transform = `scaleY(${t})`;
}

function formatClock(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/**
 * @param {{
 *   playBtn?: HTMLButtonElement | null,
 *   audioScrub?: HTMLElement | null,
 *   audioRail?: HTMLElement | null,
 *   audioFill?: HTMLElement | null,
 *   audioTip?: HTMLElement | null,
 *   scrollHost?: HTMLElement | null,
 *   scrollFill?: HTMLElement | null,
 *   src?: string,
 * }} els
 */
export function initInterceptMessageAudio(els = {}) {
  const playBtn = els.playBtn ?? document.getElementById("intercept-audio-play");
  const audioScrub =
    els.audioScrub ?? document.getElementById("intercept-audio-scrub");
  const audioRail =
    els.audioRail ?? document.getElementById("intercept-audio-rail");
  const audioFill =
    els.audioFill ?? document.getElementById("intercept-audio-fill");
  const audioTip =
    els.audioTip ?? document.getElementById("intercept-audio-tip");
  const scrollHost =
    els.scrollHost ?? document.getElementById("intercept-scroll");
  const scrollFill =
    els.scrollFill ?? document.getElementById("intercept-scroll-fill");
  const src = els.src ?? INTERCEPT_MESSAGE_AUDIO;

  if (!playBtn) {
    return { ready: false, show() {}, destroy() {} };
  }

  const audio = new Audio(src);
  audio.preload = "metadata";

  let ready = false;
  let raf = 0;
  let destroyed = false;

  const ratioFromClientY = (clientY) => {
    // Use the visible rail height so click position matches the fill.
    const host = audioRail ?? audioScrub;
    if (!host) return 0;
    const rect = host.getBoundingClientRect();
    if (rect.height <= 0) return 0;
    return Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  };

  const progressRatio = () => {
    const dur = audio.duration;
    if (!Number.isFinite(dur) || dur <= 0) return 0;
    return Math.max(0, Math.min(1, audio.currentTime / dur));
  };

  const syncPlayingUi = () => {
    const playing = !audio.paused && !audio.ended;
    playBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    playBtn.classList.toggle("is-playing", playing);
    playBtn.setAttribute(
      "aria-label",
      playing ? "Pause intercept message" : "Play intercept message"
    );
  };

  const syncAudioRail = () => {
    const ratio = progressRatio();
    setRailFill(audioFill, ratio);
    if (audioRail) {
      audioRail.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
    }
  };

  const placeTip = (clientY, seconds) => {
    if (!audioTip || !audioScrub) return;
    const rect = audioScrub.getBoundingClientRect();
    if (rect.height <= 0) return;
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    audioTip.textContent = formatClock(seconds);
    audioTip.style.top = `${y}px`;
  };

  const seekToRatio = (ratio) => {
    const dur = audio.duration;
    if (!Number.isFinite(dur) || dur <= 0) return false;
    const next = Math.max(0, Math.min(Math.max(dur - 0.05, 0), ratio * dur));
    try {
      audio.currentTime = next;
    } catch {
      return false;
    }
    syncAudioRail();
    return true;
  };

  const syncScrollRail = () => {
    if (!scrollHost || !scrollFill) return;
    const max = scrollHost.scrollHeight - scrollHost.clientHeight;
    if (max <= 0) {
      setRailFill(scrollFill, 1);
      return;
    }
    setRailFill(scrollFill, scrollHost.scrollTop / max);
  };

  const tick = () => {
    if (destroyed) return;
    syncAudioRail();
    syncPlayingUi();
    if (!audio.paused && !audio.ended) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
    }
  };

  const startTick = () => {
    if (raf || destroyed) return;
    raf = requestAnimationFrame(tick);
  };

  const setLive = (on) => {
    audioScrub?.classList.toggle("is-live", on);
    audioRail?.classList.toggle("is-live", on);
    if (audioRail) audioRail.tabIndex = on ? 0 : -1;
  };

  const onMeta = () => {
    ready = Number.isFinite(audio.duration) && audio.duration > 0;
    playBtn.disabled = !ready;
    playBtn.title = ready ? "Play intercept message" : "Audio unavailable";
    setLive(ready);
    syncAudioRail();
    syncPlayingUi();
  };

  const onError = () => {
    ready = false;
    playBtn.disabled = true;
    playBtn.setAttribute("aria-pressed", "false");
    playBtn.classList.remove("is-playing");
    setRailFill(audioFill, 0);
    playBtn.title = "Audio unavailable";
    setLive(false);
  };

  audio.addEventListener("loadedmetadata", onMeta);
  audio.addEventListener("durationchange", onMeta);
  audio.addEventListener("error", onError);
  audio.addEventListener("ended", () => {
    syncPlayingUi();
    syncAudioRail();
  });
  audio.addEventListener("pause", syncPlayingUi);
  audio.addEventListener("play", () => {
    syncPlayingUi();
    startTick();
  });
  audio.addEventListener("seeked", syncAudioRail);
  audio.addEventListener("timeupdate", () => {
    if (!raf) syncAudioRail();
  });

  playBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!ready || playBtn.disabled) return;
    try {
      if (audio.paused || audio.ended) {
        if (audio.ended) audio.currentTime = 0;
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      onError();
    }
  });

  const scrubHost = audioScrub ?? audioRail;
  if (scrubHost) {
    scrubHost.addEventListener("pointermove", (e) => {
      if (!ready) return;
      const ratio = ratioFromClientY(e.clientY);
      const dur = audio.duration;
      if (Number.isFinite(dur) && dur > 0) {
        placeTip(e.clientY, ratio * dur);
      }
    });

    // Single click jumps playback to that point — no drag scrubbing.
    scrubHost.addEventListener("click", (e) => {
      if (!ready || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const ratio = ratioFromClientY(e.clientY);
      const dur = audio.duration;
      if (!seekToRatio(ratio)) return;
      if (Number.isFinite(dur) && dur > 0) {
        placeTip(e.clientY, ratio * dur);
      }
    });

    audioRail?.addEventListener("keydown", (e) => {
      if (!ready) return;
      const dur = audio.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      const step = dur * 0.05;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        seekToRatio((audio.currentTime + step) / dur);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        seekToRatio((audio.currentTime - step) / dur);
      } else if (e.key === "Home") {
        e.preventDefault();
        seekToRatio(0);
      } else if (e.key === "End") {
        e.preventDefault();
        seekToRatio(1);
      }
    });
  }

  scrollHost?.addEventListener("scroll", syncScrollRail, { passive: true });
  window.addEventListener("resize", syncScrollRail);

  try {
    audio.load();
  } catch {
    onError();
  }

  syncScrollRail();
  setRailFill(audioFill, 0);
  syncPlayingUi();

  return {
    ready: () => ready,
    audio,
    show() {
      syncScrollRail();
      syncAudioRail();
      syncPlayingUi();
    },
    hide() {
      try {
        audio.pause();
      } catch {
        /* ignore */
      }
      audioScrub?.classList.remove("is-scrubbing");
      audioRail?.classList.remove("is-scrubbing");
      syncPlayingUi();
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      try {
        audio.pause();
      } catch {
        /* ignore */
      }
      window.removeEventListener("resize", syncScrollRail);
    },
  };
}
