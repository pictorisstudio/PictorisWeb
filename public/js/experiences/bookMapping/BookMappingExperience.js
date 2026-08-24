import { experienceConfig } from "./config/experienceConfig.js";
import { ExperienceManager } from "./core/ExperienceManager.js";
import { ExperienceState } from "./core/ExperienceState.js";
import { HandCursor } from "./interaction/HandCursor.js";
import { AliceGameScene } from "./scenes/AliceGameScene.js";
import { AliceIntroScene } from "./scenes/AliceIntroScene.js";
import { AliceResultScene } from "./scenes/AliceResultScene.js";
import { IdleScene } from "./scenes/IdleScene.js";

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
    this.idleScene = null;
    this.aliceIntroScene = null;
    this.aliceGameScene = null;
    this.aliceResultScene = null;
    this.unsubscribeState = null;
    this.lastResult = null;
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
    this.idleScene = new IdleScene({ root: this.root, config: this.config });
    this.aliceIntroScene = new AliceIntroScene({ root: this.root, config: this.config });
    this.aliceGameScene = new AliceGameScene({
      scene: this.scene,
      camera: this.camera,
      root: this.root,
      config: this.config
    });
    this.aliceResultScene = new AliceResultScene({
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

    if (this.config.debug && state !== ExperienceState.ALICE_GAME) {
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

    if (currentState === ExperienceState.IDLE) {
      this.idleScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.ALICE_INTRO) {
      this.aliceIntroScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.ALICE_GAME) {
      this.aliceGameScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.ALICE_RESULT) {
      this.aliceResultScene.update(this.deltaTime, input, snapshot.progress);
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
    this.lastResult = null;
    this.exitAllScenes();
    const wasIdle = this.manager.getState() === ExperienceState.IDLE;
    this.manager.reset();

    if (wasIdle) {
      this.enterState(ExperienceState.IDLE);
    }
  }

  nextState() {
    if (this.manager.getState() === ExperienceState.IDLE) {
      this.manager.setState(ExperienceState.ALICE_INTRO);
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

    this.idleScene?.destroy();
    this.aliceIntroScene?.destroy();
    this.aliceGameScene?.destroy();
    this.aliceResultScene?.destroy();
    this.cursor.destroy();
    this.manager.destroy();
    this.root?.remove();
    this.debugPanel?.remove();
    this.debugControls?.remove();
    this.styleNode?.remove();
    delete document.body.dataset.bookMappingState;
    this.root = null;
    this.debugPanel = null;
    this.debugControls = null;
    this.styleNode = null;
    this.idleScene = null;
    this.aliceIntroScene = null;
    this.aliceGameScene = null;
    this.aliceResultScene = null;
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

  enterState(state) {
    this.root.dataset.state = state;
    document.body.dataset.bookMappingState = state;
    this.handActivationElapsed = state === ExperienceState.IDLE ? 0 : this.handActivationElapsed;
    this.absenceElapsed = 0;

    if (state === ExperienceState.ALICE_RESULT) {
      this.lastResult = this.aliceGameScene?.getResult() ?? this.lastResult;
    }

    this.exitAllScenes();

    if (state === ExperienceState.IDLE) {
      this.idleScene?.enter();
      return;
    }

    if (state === ExperienceState.ALICE_INTRO) {
      this.aliceIntroScene?.enter();
      return;
    }

    if (state === ExperienceState.ALICE_GAME) {
      this.lastResult = null;
      this.aliceGameScene?.enter();
      return;
    }

    if (state === ExperienceState.ALICE_RESULT) {
      this.aliceResultScene?.enter(this.lastResult);
    }
  }

  exitAllScenes() {
    this.idleScene?.exit();
    this.aliceIntroScene?.exit();
    this.aliceGameScene?.exit();
    this.aliceResultScene?.exit();
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
      this.manager.setState(ExperienceState.ALICE_INTRO);
    }
  }

  updateAbsence(handDetected) {
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
    const gameStats = this.aliceGameScene?.getDebugStats();
    const stateSeconds = (snapshot.elapsed / 1000).toFixed(1);
    const durationSeconds = snapshot.duration ? (snapshot.duration / 1000).toFixed(1) : "--";
    const absenceSeconds = (this.absenceElapsed / 1000).toFixed(1);
    const absenceLimit = (this.config.idle.absenceResetDelay / 1000).toFixed(1);

    this.debugPanel.innerHTML = `
      <span>STATE: ${snapshot.state}</span>
      <span>TIME: ${stateSeconds} / ${durationSeconds}</span>
      <span>PROGRESS: ${Math.round(snapshot.progress * 100)}%</span>
      <span>CAMERA: ${cameraActive ? "ACTIVE" : "INACTIVE"}</span>
      <span>HAND: ${handDetected ? "DETECTED" : "NONE"}</span>
      <span>INPUT: ${input?.source ?? "none"}</span>
      <span>ABSENCE: ${absenceSeconds} / ${absenceLimit}</span>
      <span>ACTIVATION: ${Math.round(this.handActivationElapsed)}ms</span>
      <span>PLAYER X: ${(gameStats?.playerX ?? 0).toFixed(2)}</span>
      <span>PLAYER Y: ${(gameStats?.playerY ?? 0).toFixed(2)}</span>
      <span>RAW PALM: ${this.formatDebugPoint(gameStats?.rawPalmX, gameStats?.rawPalmY)}</span>
      <span>TARGET: ${this.formatDebugPoint(gameStats?.targetX, gameStats?.targetY)}</span>
      <span>COLLECTED: ${gameStats?.collected ?? 0} / ${gameStats?.target ?? this.config.aliceGame.collectibles.targetCount}</span>
      <span>ACTIVE ITEMS: ${gameStats?.activeItems ?? 0}</span>
      <span>POOL: ${gameStats?.poolSize ?? this.config.aliceGame.collectibles.poolSize}</span>
      <span>FX PARTICLES: OFF</span>
      <span>LOOP: ${snapshot.loopCount}</span>
      <span>FPS: ${this.fps}</span>
      <span>THREE CHILDREN: ${this.scene?.children?.length ?? "--"}</span>
      <span>RENDER CALLS: ${rendererInfo?.render?.calls ?? "--"}</span>
      <span>GEOMETRIES: ${rendererInfo?.memory?.geometries ?? "--"}</span>
      <span>TEXTURES: ${rendererInfo?.memory?.textures ?? "--"}</span>
    `;
  }

  formatDebugPoint(x, y) {
    if (x === null || y === null || x === undefined || y === undefined) {
      return "--";
    }

    return `${Number(x).toFixed(2)}, ${Number(y).toFixed(2)}`;
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

      .book-idle-scene,
      .alice-intro-scene {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        padding: clamp(1rem, 4vw, 3rem);
      }

      .book-idle-bg,
      .alice-intro-bg {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 48% 42%, rgba(54, 80, 207, 0.28), transparent 34%),
          #07050d;
      }

      .book-idle-content,
      .alice-intro-content {
        position: relative;
        width: min(100%, 980px);
        text-align: center;
      }

      .book-idle-content h1,
      .alice-intro-content h1 {
        margin: 0 auto 0.75rem;
        font-size: clamp(2.5rem, 8vw, 7rem);
        line-height: 0.9;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .book-idle-content p,
      .alice-intro-content p {
        margin: 0;
        color: #ea45be;
        font-size: clamp(0.82rem, 2vw, 1.05rem);
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .alice-game-hud {
        position: fixed;
        left: 50%;
        top: clamp(1rem, 5vh, 2.2rem);
        z-index: 20;
        transform: translateX(-50%);
      }

      .alice-game-tutorial {
        position: fixed;
        left: 50%;
        top: clamp(4.2rem, 14vh, 7rem);
        z-index: 20;
        display: grid;
        gap: 0.48rem;
        justify-items: center;
        transform: translateX(-50%);
        text-align: center;
      }

      .alice-game-tutorial p {
        margin: 0;
        padding: 0.45rem 0.62rem;
        border: 1px solid rgba(248, 245, 255, 0.16);
        background: rgba(8, 7, 18, 0.58);
        color: #f8f5ff;
        font-size: clamp(0.78rem, 2.2vw, 1rem);
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        opacity: 1;
        transform: translateY(0);
        transition: opacity 280ms ease, transform 280ms ease;
      }

      .alice-game-tutorial p[data-role="catch"] {
        color: #d7a947;
      }

      .alice-game-tutorial p.is-hidden {
        opacity: 0;
        transform: translateY(-8px);
      }

      .alice-progress {
        display: flex;
        gap: 0.42rem;
        padding: 0.48rem 0.62rem;
        border: 1px solid rgba(248, 245, 255, 0.16);
        background: rgba(8, 7, 18, 0.54);
        backdrop-filter: blur(12px);
      }

      .alice-progress span {
        width: 0.72rem;
        height: 0.72rem;
        border-radius: 999px;
        border: 1px solid rgba(248, 245, 255, 0.42);
        background: rgba(248, 245, 255, 0.1);
      }

      .alice-progress span.is-found {
        border-color: #ea45be;
        background: #ea45be;
        box-shadow: 0 0 16px rgba(234, 69, 190, 0.55);
      }

      .alice-result-label {
        position: fixed;
        left: 50%;
        bottom: clamp(2rem, 9vh, 5rem);
        z-index: 20;
        text-align: center;
        transform: translateX(-50%);
      }

      .alice-result-label h1 {
        margin: 0;
        font-size: clamp(1.5rem, 4vw, 3rem);
        line-height: 0.95;
        text-transform: uppercase;
      }

      .alice-result-label p {
        margin: 0.5rem 0 0;
        color: #ea45be;
        font-weight: 900;
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

      body[data-book-mapping-state="ALICE_GAME"] .mapping-start-camera,
      body[data-book-mapping-state="ALICE_RESULT"] .mapping-start-camera {
        position: fixed;
        left: clamp(1rem, 3vw, 2rem);
        top: clamp(5.6rem, 12vh, 7rem);
        z-index: 22;
        transform: none;
      }
    `;
    document.head.appendChild(this.styleNode);
  }
}
