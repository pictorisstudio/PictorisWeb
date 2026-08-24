import { experienceConfig } from "./config/experienceConfig.js";
import { ExperienceManager } from "./core/ExperienceManager.js";
import { ExperienceState } from "./core/ExperienceState.js";
import { HandCursor } from "./interaction/HandCursor.js";
import { AliceScene } from "./scenes/AliceScene.js";
import { CinemaScene } from "./scenes/CinemaScene.js";
import { FrankensteinScene } from "./scenes/FrankensteinScene.js";
import { IntroScene } from "./scenes/IntroScene.js";
import { LinearScene } from "./scenes/LinearScene.js";
import { OzScene } from "./scenes/OzScene.js";
import { TransitionAliceOzScene } from "./scenes/TransitionAliceOzScene.js";
import { TransitionFrankensteinCinemaScene } from "./scenes/TransitionFrankensteinCinemaScene.js";
import { TransitionOzFrankensteinScene } from "./scenes/TransitionOzFrankensteinScene.js";

export class BookMappingExperience {
  constructor({ renderer, scene, camera, config = experienceConfig } = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.config = config;
    this.manager = new ExperienceManager({
      timeline: this.config.timeline,
      initialState: ExperienceState.IDLE
    });
    this.cursor = new HandCursor({ config: this.config.cursor });
    this.root = null;
    this.debugPanel = null;
    this.debugControls = null;
    this.styleNode = null;
    this.linearScene = null;
    this.introScene = null;
    this.aliceScene = null;
    this.ozScene = null;
    this.aliceOzTransitionScene = null;
    this.ozFrankensteinTransitionScene = null;
    this.frankensteinScene = null;
    this.frankensteinCinemaTransitionScene = null;
    this.cinemaScene = null;
    this.unsubscribeState = null;
    this.lastFrameAt = performance.now();
    this.deltaTime = 0;
    this.fps = 0;
    this.handActivationElapsed = 0;
    this.absenceElapsed = 0;
    this.cursorState = null;
    this.isDestroyed = false;
  }

  init() {
    this.injectStyles();
    this.createUi();
    this.linearScene = new LinearScene({ root: this.root, config: this.config });
    this.introScene = new IntroScene({
      scene: this.scene,
      camera: this.camera,
      config: this.config
    });
    this.aliceScene = new AliceScene({
      scene: this.scene,
      camera: this.camera,
      root: this.root,
      config: this.config
    });
    this.ozFrankensteinTransitionScene = new TransitionOzFrankensteinScene({
      scene: this.scene,
      camera: this.camera,
      config: this.config
    });
    this.frankensteinScene = new FrankensteinScene({
      scene: this.scene,
      camera: this.camera,
      config: this.config
    });
    this.frankensteinCinemaTransitionScene = new TransitionFrankensteinCinemaScene({
      scene: this.scene,
      config: this.config
    });
    this.cinemaScene = new CinemaScene({
      scene: this.scene,
      camera: this.camera,
      config: this.config
    });
    this.ozScene = new OzScene({
      scene: this.scene,
      camera: this.camera,
      config: this.config
    });
    this.aliceOzTransitionScene = new TransitionAliceOzScene({
      scene: this.scene,
      camera: this.camera,
      root: this.root,
      config: this.config
    });
    this.unsubscribeState = this.manager.onChange((state, previousState) => this.enterState(state, previousState));

    if (this.config.debug) {
      this.cursor.init();
      this.createDebugControls();
    }

    this.enterState(this.manager.getState());
  }

  update({ input, cameraActive = false, trackedHandsCount = 0, fps = null } = {}) {
    if (this.isDestroyed) {
      return;
    }

    this.updateTime(fps);

    const handDetected = trackedHandsCount > 0;
    const state = this.manager.getState();

    if (this.config.debug) {
      this.cursorState = this.cursor.update(input);
    } else {
      this.cursor.hide();
      this.cursorState = null;
    }

    if (state === ExperienceState.IDLE) {
      this.updateIdleActivation(handDetected);
    } else {
      this.updateAbsence(handDetected);
      this.manager.update(this.deltaTime);
    }

    const currentState = this.manager.getState();
    const snapshot = this.manager.getSnapshot();

    if (currentState === ExperienceState.INTRO) {
      this.introScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.ALICE) {
      this.aliceScene.update(this.deltaTime, input);
    } else if (currentState === ExperienceState.TRANSITION_ALICE_OZ) {
      this.aliceScene.updateTransition(this.deltaTime, input, snapshot.progress);
      this.aliceOzTransitionScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.OZ) {
      this.ozScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.TRANSITION_OZ_FRANKENSTEIN) {
      this.ozFrankensteinTransitionScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.FRANKENSTEIN) {
      this.frankensteinScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.TRANSITION_FRANKENSTEIN_CINEMA) {
      this.frankensteinCinemaTransitionScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.CINEMA) {
      this.cinemaScene.update(this.deltaTime, input, snapshot.progress);
    } else {
      this.linearScene.update(this.deltaTime, input);
    }
    this.updateDebug({
      cameraActive,
      handDetected,
      input
    });
  }

  reset() {
    this.handActivationElapsed = 0;
    this.absenceElapsed = 0;
    this.exitAllScenes();
    const wasIdle = this.manager.getState() === ExperienceState.IDLE;
    this.manager.reset();

    if (wasIdle) {
      this.enterState(ExperienceState.IDLE);
    }
  }

  nextState() {
    if (this.manager.getState() === ExperienceState.IDLE) {
      this.manager.setState(ExperienceState.INTRO);
      return;
    }

    this.manager.advance();
  }

  destroy() {
    this.isDestroyed = true;

    if (this.unsubscribeState) {
      this.unsubscribeState();
      this.unsubscribeState = null;
    }

    this.aliceScene?.destroy();
    this.introScene?.destroy();
    this.ozScene?.destroy();
    this.aliceOzTransitionScene?.destroy();
    this.ozFrankensteinTransitionScene?.destroy();
    this.frankensteinScene?.destroy();
    this.frankensteinCinemaTransitionScene?.destroy();
    this.cinemaScene?.destroy();
    this.linearScene?.destroy();
    this.cursor.destroy();
    this.manager.destroy();
    this.root?.remove();
    this.debugPanel?.remove();
    this.debugControls?.remove();
    this.styleNode?.remove();
    this.root = null;
    this.debugPanel = null;
    this.debugControls = null;
    this.styleNode = null;
    this.introScene = null;
    this.aliceScene = null;
    this.ozScene = null;
    this.aliceOzTransitionScene = null;
    this.ozFrankensteinTransitionScene = null;
    this.frankensteinScene = null;
    this.frankensteinCinemaTransitionScene = null;
    this.cinemaScene = null;
  }

  createUi() {
    this.root = document.createElement("section");
    this.root.className = "book-mapping-ui";
    this.root.setAttribute("aria-live", "polite");
    document.body.appendChild(this.root);

    if (this.config.debug) {
      this.debugPanel = document.createElement("aside");
      this.debugPanel.className = "book-mapping-debug";
      document.body.appendChild(this.debugPanel);
    }
  }

  createDebugControls() {
    this.debugControls = document.createElement("div");
    this.debugControls.className = "book-mapping-debug-controls";
    this.debugControls.innerHTML = `
      <button type="button" data-action="next">Next state</button>
      <button type="button" data-action="reset">Reset</button>
    `;
    this.debugControls.querySelector('[data-action="next"]').addEventListener("click", () => this.nextState());
    this.debugControls.querySelector('[data-action="reset"]').addEventListener("click", () => this.reset());
    document.body.appendChild(this.debugControls);
  }

  enterState(state, previousState = null) {
    this.root.dataset.state = state;
    this.handActivationElapsed = state === ExperienceState.IDLE ? 0 : this.handActivationElapsed;
    this.absenceElapsed = 0;

    if (state === ExperienceState.INTRO) {
      this.exitAllScenes();
      this.introScene?.enter();
      return;
    }

    if (state === ExperienceState.ALICE) {
      this.exitAllScenes();
      this.aliceScene?.enter();
      return;
    }

    if (state === ExperienceState.TRANSITION_ALICE_OZ) {
      this.introScene?.exit();
      this.ozScene?.exit();
      this.ozFrankensteinTransitionScene?.exit();
      this.frankensteinScene?.exit();
      this.frankensteinCinemaTransitionScene?.exit();
      this.cinemaScene?.exit();
      this.linearScene?.exit();
      this.aliceScene?.beginTransition();
      this.aliceOzTransitionScene?.enter();
      return;
    }

    if (state === ExperienceState.OZ) {
      this.exitAllScenes();
      this.ozScene?.enter();
      return;
    }

    if (state === ExperienceState.TRANSITION_OZ_FRANKENSTEIN) {
      this.exitAllScenes();
      this.ozFrankensteinTransitionScene?.enter();
      return;
    }

    if (state === ExperienceState.FRANKENSTEIN) {
      this.exitAllScenes();
      this.frankensteinScene?.enter();
      return;
    }

    if (state === ExperienceState.TRANSITION_FRANKENSTEIN_CINEMA) {
      this.exitAllScenes();
      this.frankensteinCinemaTransitionScene?.enter();
      return;
    }

    if (state === ExperienceState.CINEMA) {
      this.exitAllScenes();
      this.cinemaScene?.enter();
      return;
    }

    this.exitAllScenes();
    this.linearScene?.enter(state, {
      suppressTitle: state === ExperienceState.OZ && previousState === ExperienceState.TRANSITION_ALICE_OZ
    });
  }

  exitAllScenes() {
    this.introScene?.exit();
    this.aliceOzTransitionScene?.exit();
    this.ozFrankensteinTransitionScene?.exit();
    this.frankensteinCinemaTransitionScene?.exit();
    this.cinemaScene?.exit();
    this.frankensteinScene?.exit();
    this.ozScene?.exit();
    this.aliceScene?.exit();
    this.linearScene?.exit();
  }

  updateTime(fps) {
    if (typeof fps === "number") {
      this.fps = fps;
      this.deltaTime = this.fps > 0 ? 1000 / this.fps : 0;
      return;
    }

    const now = performance.now();
    const delta = now - this.lastFrameAt;
    this.lastFrameAt = now;
    this.deltaTime = delta;
    this.fps = delta > 0 ? Math.round(1000 / delta) : 0;
  }

  updateIdleActivation(handDetected) {
    if (!handDetected) {
      this.handActivationElapsed = 0;
      return;
    }

    this.handActivationElapsed += this.deltaTime;

    if (this.handActivationElapsed >= this.config.idle.handActivationDelay) {
      this.handActivationElapsed = 0;
      this.manager.setState(ExperienceState.INTRO);
    }
  }

  updateAbsence(handDetected) {
    if (this.manager.getState() === ExperienceState.END) {
      this.absenceElapsed = 0;
      return;
    }

    if (handDetected) {
      this.absenceElapsed = 0;
      return;
    }

    this.absenceElapsed += this.deltaTime;

    if (this.absenceElapsed >= this.config.idle.absenceResetDelay) {
      this.reset();
    }
  }

  updateDebug({ cameraActive, handDetected, input }) {
    if (!this.debugPanel) {
      return;
    }

    const snapshot = this.manager.getSnapshot();
    const rendererInfo = this.renderer?.info;
    const introStats = this.introScene?.getDebugStats();
    const aliceStats = this.aliceScene?.getDebugStats();
    const ozStats = this.ozScene?.getDebugStats();
    const transitionStats = this.aliceOzTransitionScene?.getDebugStats();
    const ozFrankensteinStats = this.ozFrankensteinTransitionScene?.getDebugStats();
    const frankensteinStats = this.frankensteinScene?.getDebugStats();
    const frankensteinCinemaStats = this.frankensteinCinemaTransitionScene?.getDebugStats();
    const cinemaStats = this.cinemaScene?.getDebugStats();
    const stateSeconds = (snapshot.elapsed / 1000).toFixed(1);
    const durationSeconds = snapshot.duration ? (snapshot.duration / 1000).toFixed(1) : "--";
    const absenceSeconds = (this.absenceElapsed / 1000).toFixed(1);
    const absenceLimit = (this.config.idle.absenceResetDelay / 1000).toFixed(1);

    this.debugPanel.innerHTML = `
      <span>STATE: ${snapshot.state}</span>
      <span>STATE TIME: ${stateSeconds} / ${durationSeconds}</span>
      <span>STATE PROGRESS: ${Math.round(snapshot.progress * 100)}%</span>
      <span>CAMERA: ${cameraActive ? "ACTIVE" : "INACTIVE"}</span>
      <span>HAND: ${handDetected ? "DETECTED" : "NONE"}</span>
      <span>INPUT: ${input?.source ?? "none"}</span>
      <span>ABSENCE: ${absenceSeconds} / ${absenceLimit}</span>
      <span>ACTIVATION: ${Math.round(this.handActivationElapsed)}ms</span>
      <span>LOOP: ${snapshot.loopCount}</span>
      <span>INTRO WORDS: ${introStats?.words ?? 0}</span>
      <span>ALICE OBJECTS: ${aliceStats?.objects ?? 0}</span>
      <span>TRAIL ACTIVE: ${aliceStats?.activeTrail ?? 0} / ${aliceStats?.maxTrail ?? 0}</span>
      <span>PALM FORCE: ${aliceStats?.palmForceActive ? "ACTIVE" : "NONE"}</span>
      <span>TRANSITION PHASE: ${transitionStats?.phase ?? "NONE"}</span>
      <span>ROAD PIECES: ${transitionStats?.roadPieces ?? 0}</span>
      <span>OZ ROAD: ${ozStats?.roadPieces ?? 0}</span>
      <span>OZ WIND: ${ozStats?.wind ?? 0}</span>
      <span>OZ TRAIL: ${ozStats?.activeTrail ?? 0} / ${ozStats?.maxTrail ?? 0}</span>
      <span>PALM WAVE: ${ozStats?.palmWaveActive ? "ACTIVE" : "NONE"}</span>
      <span>OZ-FRANK PHASE: ${ozFrankensteinStats?.phase ?? "NONE"}</span>
      <span>FRANK BOLTS: ${frankensteinStats?.activeBolts ?? 0}</span>
      <span>FRANK PALM: ${frankensteinStats?.palmCharge ? "ACTIVE" : "NONE"}</span>
      <span>FRANK-CINEMA: ${frankensteinCinemaStats?.phase ?? "NONE"}</span>
      <span>CINEMA BURSTS: ${cinemaStats?.activeBursts ?? 0}</span>
      <span>CINEMA PALM: ${cinemaStats?.palmDistortion ? "ACTIVE" : "NONE"}</span>
      <span>FPS: ${this.fps}</span>
      <span>THREE CHILDREN: ${this.scene?.children?.length ?? "--"}</span>
      <span>RENDER CALLS: ${rendererInfo?.render?.calls ?? "--"}</span>
      <span>GEOMETRIES: ${rendererInfo?.memory?.geometries ?? "--"}</span>
      <span>TEXTURES: ${rendererInfo?.memory?.textures ?? "--"}</span>
    `;
  }

  injectStyles() {
    if (document.getElementById("book-mapping-styles")) {
      return;
    }

    this.styleNode = document.createElement("style");
    this.styleNode.id = "book-mapping-styles";
    this.styleNode.textContent = `
      .book-mapping-ui {
        position: fixed;
        inset: 0;
        z-index: 14;
        overflow: hidden;
        color: #f8f5ff;
        pointer-events: none;
      }

      .book-linear-scene {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        padding: clamp(1rem, 4vw, 3rem);
        opacity: 0;
        transition: opacity 520ms ease;
      }

      .book-linear-scene.is-active {
        opacity: 1;
      }

      .book-linear-bg {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 25% 20%, color-mix(in srgb, var(--scene-color), white 18%), transparent 28%),
          linear-gradient(135deg, var(--scene-color), #05040a 78%);
        opacity: 0.86;
      }

      .book-linear-content {
        position: relative;
        width: min(100%, 980px);
        text-align: center;
      }

      .book-linear-content p {
        margin: 0 0 0.75rem;
        color: #ea45be;
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .book-linear-content h1 {
        margin: 0 auto 0.8rem;
        font-size: clamp(2.4rem, 8vw, 7rem);
        line-height: 0.9;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .book-linear-scene.is-title-suppressed .book-linear-content h1 {
        opacity: 0;
      }

      .book-linear-content span {
        color: rgba(248, 245, 255, 0.78);
        font-weight: 700;
      }

      .oz-transition-title {
        position: fixed;
        inset: auto 0 clamp(3rem, 10vh, 6rem);
        z-index: 18;
        display: grid;
        place-items: center;
        padding: 0 1rem;
        opacity: 0;
        pointer-events: none;
        transform: translateY(18px);
        transition: opacity 520ms ease, transform 520ms ease;
      }

      .oz-transition-title.is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      .oz-transition-title h1 {
        max-width: 920px;
        margin: 0;
        color: #f8f5ff;
        font-size: clamp(2rem, 6vw, 5.6rem);
        line-height: 0.92;
        letter-spacing: 0;
        text-align: center;
        text-transform: uppercase;
      }

      .book-linear-hand-orb {
        position: fixed;
        left: 50%;
        top: 50%;
        width: 92px;
        height: 92px;
        border-radius: 999px;
        background: rgba(98, 231, 255, 0.18);
        box-shadow:
          0 0 36px rgba(98, 231, 255, 0.22),
          inset 0 0 24px rgba(234, 69, 190, 0.14);
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.82);
        transition: opacity 180ms ease, transform 180ms ease;
      }

      .book-linear-hand-orb.is-visible {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }

      .alice-title {
        position: fixed;
        inset: 0;
        z-index: 18;
        display: grid;
        place-items: center;
        padding: clamp(1rem, 5vw, 4rem);
        background: radial-gradient(circle at center, rgba(5, 7, 11, 0.24), rgba(5, 7, 11, 0.74));
        opacity: 1;
        pointer-events: none;
        transition: opacity 720ms ease, transform 720ms ease;
      }

      .alice-title.is-hidden {
        opacity: 0;
        transform: translateY(-18px) scale(0.98);
      }

      .alice-title h1 {
        margin: 0;
        color: #f2f2f2;
        font-size: clamp(2.5rem, 8vw, 7rem);
        line-height: 0.9;
        letter-spacing: 0;
        text-align: center;
        text-transform: uppercase;
      }

      .book-mapping-debug,
      .book-mapping-debug-controls {
        position: fixed;
        z-index: 30;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: rgba(5, 4, 10, 0.78);
        color: rgba(248, 245, 255, 0.76);
        backdrop-filter: blur(14px);
      }

      .book-mapping-debug {
        right: 1rem;
        bottom: 1rem;
        display: grid;
        gap: 0.2rem;
        padding: 0.7rem 0.8rem;
        font: 700 0.72rem/1.35 Inter, system-ui, sans-serif;
        letter-spacing: 0.04em;
        pointer-events: none;
      }

      .book-mapping-debug-controls {
        left: 1rem;
        bottom: 1rem;
        display: flex;
        gap: 0.5rem;
        padding: 0.55rem;
        pointer-events: auto;
      }

      .book-mapping-debug-controls button {
        min-height: 36px;
        padding: 0 0.8rem;
        border: 0;
        background: #3650cf;
        color: #ffffff;
        font: 900 0.72rem Inter, system-ui, sans-serif;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
      }

      .book-mapping-cursor-position {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 28;
        box-sizing: border-box;
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: opacity 160ms ease;
        will-change: left, top, opacity;
      }

      .book-mapping-cursor {
        position: relative;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 2px solid rgba(98, 231, 255, 0.95);
        border-radius: 999px;
        background: rgba(234, 69, 190, 0.16);
        box-shadow:
          0 0 0 6px rgba(98, 231, 255, 0.10),
          0 0 24px rgba(234, 69, 190, 0.28);
      }

      .book-mapping-cursor-position.is-visible {
        opacity: 1;
      }

      .mapping-panel {
        z-index: 16;
        pointer-events: none;
      }

      .mapping-panel .mapping-kicker,
      .mapping-panel h1,
      .mapping-panel p:not(.mapping-kicker) {
        display: none;
      }

      .mapping-start-camera {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(this.styleNode);
  }
}
