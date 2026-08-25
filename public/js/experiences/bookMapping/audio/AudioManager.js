export class AudioManager {
  constructor({ config = {} } = {}) {
    this.config = config;
    this.tracks = new Map();
    this.fadeFrame = null;
    this.isMutedByPolicy = false;
    this.hasUnlockListener = false;
    this.unlockHandler = null;
  }

  registerLoop(id, { src, volume = 0.2, fadeIn = 1200, fadeOut = 1400, resetOnStop = false } = {}) {
    if (this.tracks.has(id)) {
      return;
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;

    this.tracks.set(id, {
      audio,
      targetVolume: volume,
      fadeIn,
      fadeOut,
      fadeStartedAt: 0,
      fadeDuration: 0,
      fromVolume: 0,
      toVolume: 0,
      stopWhenSilent: false,
      resetOnStop,
      desiredPlaying: false
    });
  }

  registerSfx(id, { src, volume = 0.45 } = {}) {
    if (this.tracks.has(id)) {
      return;
    }

    const audio = new Audio(src);
    audio.loop = false;
    audio.preload = "auto";
    audio.volume = volume;

    this.tracks.set(id, {
      audio,
      targetVolume: volume,
      fadeIn: 0,
      fadeOut: 0,
      fadeStartedAt: 0,
      fadeDuration: 0,
      fromVolume: volume,
      toVolume: volume,
      stopWhenSilent: false,
      resetOnStop: true,
      desiredPlaying: false,
      isSfx: true
    });
  }

  play(id) {
    const track = this.tracks.get(id);

    if (!track) {
      return;
    }

    track.stopWhenSilent = false;
    track.desiredPlaying = true;

    if (track.audio.paused) {
      this.tryPlayTrack(track);
    }

    this.fadeTo(id, track.targetVolume, track.fadeIn, false);
  }

  stop(id) {
    const track = this.tracks.get(id);

    if (!track) {
      return;
    }

    track.desiredPlaying = false;
    this.fadeTo(id, 0, track.fadeOut, true);
  }

  playSfx(id) {
    const track = this.tracks.get(id);

    if (!track) {
      return;
    }

    track.desiredPlaying = true;
    track.audio.pause();
    track.audio.currentTime = 0;
    track.audio.volume = track.targetVolume;
    this.tryPlayTrack(track);
    track.desiredPlaying = false;
  }

  tryPlayTrack(track) {
    track.audio.play().catch((error) => {
      this.isMutedByPolicy = true;
      this.ensureUnlockListener();
      console.warn("Audio playback was blocked by the browser.", error);
    });
  }

  ensureUnlockListener() {
    if (this.hasUnlockListener) {
      return;
    }

    const unlock = () => {
      this.tracks.forEach((track) => {
        if (track.desiredPlaying && track.audio.paused) {
          this.tryPlayTrack(track);
        }
      });
      this.isMutedByPolicy = false;
    };

    this.unlockHandler = unlock;
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    this.hasUnlockListener = true;
  }

  fadeTo(id, volume, duration, stopWhenSilent) {
    const track = this.tracks.get(id);

    if (!track) {
      return;
    }

    track.fadeStartedAt = performance.now();
    track.fadeDuration = Math.max(duration, 1);
    track.fromVolume = track.audio.volume;
    track.toVolume = volume;
    track.stopWhenSilent = stopWhenSilent;
    this.ensureFadeLoop();
  }

  ensureFadeLoop() {
    if (this.fadeFrame) {
      return;
    }

    const tick = () => {
      let hasActiveFade = false;
      const now = performance.now();

      this.tracks.forEach((track) => {
        const elapsed = now - track.fadeStartedAt;
        const progress = Math.min(elapsed / track.fadeDuration, 1);
        const eased = progress * progress * (3 - 2 * progress);
        track.audio.volume = track.fromVolume + (track.toVolume - track.fromVolume) * eased;

        if (progress < 1) {
          hasActiveFade = true;
        } else if (track.stopWhenSilent && track.toVolume === 0) {
          track.audio.pause();
          if (track.resetOnStop) {
            track.audio.currentTime = 0;
          }
        }
      });

      this.fadeFrame = hasActiveFade ? window.requestAnimationFrame(tick) : null;
    };

    this.fadeFrame = window.requestAnimationFrame(tick);
  }

  destroy() {
    if (this.fadeFrame) {
      window.cancelAnimationFrame(this.fadeFrame);
      this.fadeFrame = null;
    }

    if (this.unlockHandler) {
      window.removeEventListener("pointerdown", this.unlockHandler);
      window.removeEventListener("keydown", this.unlockHandler);
      this.unlockHandler = null;
      this.hasUnlockListener = false;
    }

    this.tracks.forEach((track) => {
      track.audio.pause();
      track.audio.src = "";
    });
    this.tracks.clear();
  }
}
