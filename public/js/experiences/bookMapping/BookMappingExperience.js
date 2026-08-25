import { experienceConfig } from "./config/experienceConfig.js";
import { AudioManager } from "./audio/AudioManager.js";
import { ExperienceManager } from "./core/ExperienceManager.js";
import { ExperienceState } from "./core/ExperienceState.js";
import { HandCursor } from "./interaction/HandCursor.js";
import { AliceGameScene } from "./scenes/AliceGameScene.js";
import { AliceIntroScene } from "./scenes/AliceIntroScene.js";
import { AliceResultScene } from "./scenes/AliceResultScene.js";
import { IdleScene } from "./scenes/IdleScene.js";
import { LiteraryIntroScene } from "./scenes/LiteraryIntroScene.js";
import { LiteraryTitleScene } from "./scenes/LiteraryTitleScene.js";
import { PrinceGameScene } from "./scenes/PrinceGameScene.js";
import { PrinceIntroScene } from "./scenes/PrinceIntroScene.js";
import { PrinceResultScene } from "./scenes/PrinceResultScene.js";
import { PrinceTransitionScene } from "./scenes/PrinceTransitionScene.js";
import { SubmarineGameScene } from "./scenes/SubmarineGameScene.js";
import { SubmarineIntroScene } from "./scenes/SubmarineIntroScene.js";
import { SubmarineResultScene } from "./scenes/SubmarineResultScene.js";
import { SubmarineTransitionScene } from "./scenes/SubmarineTransitionScene.js";

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
    this.audioManager = new AudioManager({ config: this.config.audio });
    this.cursor = new HandCursor({ config: this.config.cursor });
    this.root = null;
    this.debugPanel = null;
    this.debugControls = null;
    this.styleNode = null;
    this.idleScene = null;
    this.literaryIntroScene = null;
    this.literaryTitleScene = null;
    this.aliceIntroScene = null;
    this.aliceGameScene = null;
    this.aliceResultScene = null;
    this.princeTransitionScene = null;
    this.princeIntroScene = null;
    this.princeGameScene = null;
    this.princeResultScene = null;
    this.submarineTransitionScene = null;
    this.submarineIntroScene = null;
    this.submarineGameScene = null;
    this.submarineResultScene = null;
    this.unsubscribeState = null;
    this.lastResult = null;
    this.lastPrinceResult = null;
    this.lastSubmarineResult = null;
    this.lastFrameAt = performance.now();
    this.deltaTime = 0;
    this.fps = 0;
    this.handActivationElapsed = 0;
    this.coverLostTrackingElapsed = 0;
    this.coverHandRaised = false;
    this.absenceElapsed = 0;
    this.cursorState = null;
    this.isCoverAudioPlaying = false;
    this.isLiteraryAudioPlaying = false;
    this.isDestroyed = false;
  }

  init() {
    this.injectStyles();
    this.createUi();
    this.registerAudio();
    this.idleScene = new IdleScene({ root: this.root, config: this.config });
    this.literaryIntroScene = new LiteraryIntroScene({
      scene: this.scene,
      camera: this.camera,
      root: this.root,
      config: this.config,
      onComplete: () => this.manager.setState(ExperienceState.LITERARY_TITLE)
    });
    this.literaryTitleScene = new LiteraryTitleScene({
      scene: this.scene,
      camera: this.camera,
      root: this.root,
      config: this.config
    });
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
    this.princeTransitionScene = new PrinceTransitionScene({
      scene: this.scene,
      root: this.root,
      config: this.config
    });
    this.princeIntroScene = new PrinceIntroScene({
      scene: this.scene,
      root: this.root,
      config: this.config
    });
    this.princeGameScene = new PrinceGameScene({
      scene: this.scene,
      root: this.root,
      config: this.config,
      onComplete: (result) => {
        this.lastPrinceResult = result;
        this.manager.setState(ExperienceState.PRINCE_RESULT);
      }
    });
    this.princeResultScene = new PrinceResultScene({
      scene: this.scene,
      root: this.root,
      config: this.config
    });
    this.submarineTransitionScene = new SubmarineTransitionScene({
      scene: this.scene,
      root: this.root,
      config: this.config
    });
    this.submarineIntroScene = new SubmarineIntroScene({
      scene: this.scene,
      camera: this.camera,
      root: this.root,
      config: this.config
    });
    this.submarineGameScene = new SubmarineGameScene({
      scene: this.scene,
      camera: this.camera,
      root: this.root,
      config: this.config,
      onComplete: (result) => {
        this.lastSubmarineResult = result;
        this.manager.setState(ExperienceState.SUBMARINE_RESULT);
      }
    });
    this.submarineResultScene = new SubmarineResultScene({
      scene: this.scene,
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

  update({ input, poseInput = null, cameraActive = false, coverReady = cameraActive, trackedHandsCount = 0, trackedPose = false, fps = null } = {}) {
    if (this.isDestroyed) {
      return;
    }

    this.updateTime(fps);

    const handDetected = trackedHandsCount > 0;
    const poseDetected = Boolean(trackedPose || poseInput?.stable);
    const state = this.manager.getState();
    this.updateCoverAudio(state);
    this.updateLiteraryAudio(state);

    if (this.config.debug && state !== ExperienceState.ALICE_GAME) {
      this.cursorState = this.cursor.update(input);
    } else {
      this.cursor.hide();
      this.cursorState = null;
    }

    if (state === ExperienceState.IDLE) {
      this.updateIdleActivation(input, coverReady);
    } else {
      this.updateAbsence(
        this.isPrinceState(state) ? poseDetected : handDetected,
        this.isPrinceState(state) ? this.config.prince.absenceTimeout : this.config.idle.absenceResetDelay
      );
      this.manager.update(this.deltaTime);
    }

    const currentState = this.manager.getState();
    const snapshot = this.manager.getSnapshot();

    if (currentState === ExperienceState.IDLE) {
      this.idleScene.update(this.deltaTime, input, snapshot.progress, {
        cameraReady: coverReady,
        holdProgress: this.getCoverHoldProgress()
      });
    } else if (currentState === ExperienceState.LITERARY_INTRO) {
      this.literaryIntroScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.LITERARY_TITLE) {
      this.literaryTitleScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.ALICE_INTRO) {
      this.aliceIntroScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.ALICE_GAME) {
      this.aliceGameScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.ALICE_RESULT) {
      this.aliceResultScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.TRANSITION_TO_PRINCE) {
      this.princeTransitionScene.update(this.deltaTime, input, snapshot.progress, { poseInput });
    } else if (currentState === ExperienceState.PRINCE_INTRO) {
      this.princeIntroScene.update(this.deltaTime, input, snapshot.progress, { poseInput });
    } else if (currentState === ExperienceState.PRINCE_GAME) {
      this.princeGameScene.update(this.deltaTime, input, snapshot.progress, { poseInput });
    } else if (currentState === ExperienceState.PRINCE_RESULT) {
      this.princeResultScene.update(this.deltaTime, input, snapshot.progress, { poseInput });
    } else if (currentState === ExperienceState.TRANSITION_TO_SUBMARINE) {
      this.submarineTransitionScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.SUBMARINE_INTRO) {
      this.submarineIntroScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.SUBMARINE_GAME) {
      this.submarineGameScene.update(this.deltaTime, input, snapshot.progress);
    } else if (currentState === ExperienceState.SUBMARINE_RESULT) {
      this.submarineResultScene.update(this.deltaTime, input, snapshot.progress);
    }

    this.updateDebug({
      cameraActive,
      handDetected,
      poseDetected,
      poseInput,
      input
    });
  }

  reset() {
    this.handActivationElapsed = 0;
    this.coverLostTrackingElapsed = 0;
    this.coverHandRaised = false;
    this.absenceElapsed = 0;
    this.lastResult = null;
    this.lastPrinceResult = null;
    this.lastSubmarineResult = null;
    this.exitAllScenes();
    const wasIdle = this.manager.getState() === ExperienceState.IDLE;
    this.manager.reset();

    if (wasIdle) {
      this.enterState(ExperienceState.IDLE);
    }
  }

  nextState() {
    if (this.manager.getState() === ExperienceState.IDLE) {
      this.manager.setState(ExperienceState.LITERARY_INTRO);
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
    this.literaryIntroScene?.destroy();
    this.literaryTitleScene?.destroy();
    this.aliceIntroScene?.destroy();
    this.aliceGameScene?.destroy();
    this.aliceResultScene?.destroy();
    this.princeTransitionScene?.destroy();
    this.princeIntroScene?.destroy();
    this.princeGameScene?.destroy();
    this.princeResultScene?.destroy();
    this.submarineTransitionScene?.destroy();
    this.submarineIntroScene?.destroy();
    this.submarineGameScene?.destroy();
    this.submarineResultScene?.destroy();
    this.cursor.destroy();
    this.audioManager.destroy();
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
    this.audioManager = null;
    this.idleScene = null;
    this.literaryIntroScene = null;
    this.literaryTitleScene = null;
    this.aliceIntroScene = null;
    this.aliceGameScene = null;
    this.aliceResultScene = null;
    this.princeTransitionScene = null;
    this.princeIntroScene = null;
    this.princeGameScene = null;
    this.princeResultScene = null;
    this.submarineTransitionScene = null;
    this.submarineIntroScene = null;
    this.submarineGameScene = null;
    this.submarineResultScene = null;
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
    this.coverLostTrackingElapsed = state === ExperienceState.IDLE ? 0 : this.coverLostTrackingElapsed;
    this.coverHandRaised = state === ExperienceState.IDLE ? false : this.coverHandRaised;
    this.absenceElapsed = 0;

    if (state === ExperienceState.ALICE_RESULT) {
      this.lastResult = this.aliceGameScene?.getResult() ?? this.lastResult;
    }

    if (state === ExperienceState.PRINCE_RESULT) {
      this.lastPrinceResult = this.princeGameScene?.getResult() ?? this.lastPrinceResult;
    }

    if (state === ExperienceState.SUBMARINE_RESULT) {
      this.lastSubmarineResult = this.submarineGameScene?.getResult() ?? this.lastSubmarineResult;
    }

    this.exitAllScenes();

    if (state === ExperienceState.IDLE) {
      this.idleScene?.enter();
      return;
    }

    if (state === ExperienceState.LITERARY_INTRO) {
      this.literaryIntroScene?.enter();
      return;
    }

    if (state === ExperienceState.LITERARY_TITLE) {
      this.literaryTitleScene?.enter();
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
      return;
    }

    if (state === ExperienceState.TRANSITION_TO_PRINCE) {
      this.princeTransitionScene?.enter();
      return;
    }

    if (state === ExperienceState.PRINCE_INTRO) {
      this.princeIntroScene?.enter();
      return;
    }

    if (state === ExperienceState.PRINCE_GAME) {
      this.lastPrinceResult = null;
      this.princeGameScene?.enter();
      return;
    }

    if (state === ExperienceState.PRINCE_RESULT) {
      this.princeResultScene?.enter(this.lastPrinceResult);
      return;
    }

    if (state === ExperienceState.TRANSITION_TO_SUBMARINE) {
      this.submarineTransitionScene?.enter();
      return;
    }

    if (state === ExperienceState.SUBMARINE_INTRO) {
      this.submarineIntroScene?.enter();
      return;
    }

    if (state === ExperienceState.SUBMARINE_GAME) {
      this.lastSubmarineResult = null;
      this.submarineGameScene?.enter();
      return;
    }

    if (state === ExperienceState.SUBMARINE_RESULT) {
      this.submarineResultScene?.enter(this.lastSubmarineResult);
    }
  }

  registerAudio() {
    const coverAudio = this.config.audio?.cover;
    const coverConfirm = this.config.audio?.coverConfirm;
    const literaryAudio = this.config.literaryIntro?.audio;

    if (coverAudio) {
      this.audioManager.registerLoop(coverAudio.id, {
        src: coverAudio.src,
        volume: coverAudio.volume,
        fadeIn: coverAudio.fadeIn,
        fadeOut: coverAudio.fadeOut,
        resetOnStop: coverAudio.resetOnStop
      });
    }

    if (coverConfirm) {
      this.audioManager.registerSfx(coverConfirm.id, {
        src: coverConfirm.src,
        volume: coverConfirm.volume
      });
    }

    if (!literaryAudio) {
      return;
    }

    this.audioManager.registerLoop(literaryAudio.id, {
      src: literaryAudio.src,
      volume: literaryAudio.volume,
      fadeIn: literaryAudio.fadeIn,
      fadeOut: literaryAudio.fadeOut
    });
  }

  exitAllScenes() {
    this.idleScene?.exit();
    this.literaryIntroScene?.exit();
    this.literaryTitleScene?.exit();
    this.aliceIntroScene?.exit();
    this.aliceGameScene?.exit();
    this.aliceResultScene?.exit();
    this.princeTransitionScene?.exit();
    this.princeIntroScene?.exit();
    this.princeGameScene?.exit();
    this.princeResultScene?.exit();
    this.submarineTransitionScene?.exit();
    this.submarineIntroScene?.exit();
    this.submarineGameScene?.exit();
    this.submarineResultScene?.exit();
  }

  getState() {
    return this.manager.getState();
  }

  updateCoverAudio(state = this.manager.getState()) {
    const coverAudio = this.config.audio?.cover;

    if (!coverAudio || !this.audioManager) {
      return;
    }

    const shouldPlay = state === ExperienceState.IDLE;

    if (shouldPlay && !this.isCoverAudioPlaying) {
      this.audioManager.play(coverAudio.id);
      this.isCoverAudioPlaying = true;
      return;
    }

    if (!shouldPlay && this.isCoverAudioPlaying) {
      this.audioManager.stop(coverAudio.id);
      this.isCoverAudioPlaying = false;
    }
  }

  updateLiteraryAudio(state = this.manager.getState()) {
    const literaryAudio = this.config.literaryIntro?.audio;

    if (!literaryAudio || !this.audioManager) {
      return;
    }

    const shouldPlay = state === ExperienceState.LITERARY_INTRO
      || state === ExperienceState.LITERARY_TITLE;

    if (shouldPlay && !this.isLiteraryAudioPlaying) {
      this.audioManager.play(literaryAudio.id);
      this.isLiteraryAudioPlaying = true;
      return;
    }

    if (!shouldPlay && this.isLiteraryAudioPlaying) {
      this.audioManager.stop(literaryAudio.id);
      this.isLiteraryAudioPlaying = false;
    }
  }

  isPrinceState(state = this.manager.getState()) {
    return state === ExperienceState.TRANSITION_TO_PRINCE
      || state === ExperienceState.PRINCE_INTRO
      || state === ExperienceState.PRINCE_GAME
      || state === ExperienceState.PRINCE_RESULT;
  }

  isSubmarineState(state = this.manager.getState()) {
    return state === ExperienceState.TRANSITION_TO_SUBMARINE
      || state === ExperienceState.SUBMARINE_INTRO
      || state === ExperienceState.SUBMARINE_GAME
      || state === ExperienceState.SUBMARINE_RESULT;
  }

  needsHandTracking() {
    const state = this.manager.getState();
    return state === ExperienceState.IDLE
      || state === ExperienceState.LITERARY_INTRO
      || state === ExperienceState.LITERARY_TITLE
      || state === ExperienceState.ALICE_INTRO
      || state === ExperienceState.ALICE_GAME
      || state === ExperienceState.ALICE_RESULT
      || state === ExperienceState.TRANSITION_TO_SUBMARINE
      || state === ExperienceState.SUBMARINE_INTRO
      || state === ExperienceState.SUBMARINE_GAME
      || state === ExperienceState.SUBMARINE_RESULT;
  }

  needsPoseTracking() {
    const state = this.manager.getState();
    return state === ExperienceState.TRANSITION_TO_PRINCE
      || state === ExperienceState.PRINCE_INTRO
      || state === ExperienceState.PRINCE_GAME
      || state === ExperienceState.PRINCE_RESULT;
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

  updateIdleActivation(input, cameraReady) {
    if (!cameraReady) {
      this.handActivationElapsed = 0;
      this.coverLostTrackingElapsed = 0;
      this.coverHandRaised = false;
      return;
    }

    const palm = input?.primaryHand?.palm ?? null;
    const gesture = this.config.idle.gesture;
    const hasPalm = Boolean(palm);
    const y = palm?.y ?? 1;
    const raised = this.coverHandRaised
      ? hasPalm && y < gesture.exitThreshold
      : hasPalm && y < gesture.enterThreshold;

    if (raised) {
      this.coverHandRaised = true;
      this.coverLostTrackingElapsed = 0;
      this.handActivationElapsed += this.deltaTime;
    } else if (!hasPalm && this.handActivationElapsed > 0 && this.coverLostTrackingElapsed < gesture.lostTrackingGrace) {
      this.coverLostTrackingElapsed += this.deltaTime;
    } else {
      this.coverHandRaised = false;
      this.coverLostTrackingElapsed = 0;
      this.handActivationElapsed = Math.max(0, this.handActivationElapsed - this.deltaTime * 1.8);
    }

    if (this.handActivationElapsed >= gesture.holdDuration) {
      this.handActivationElapsed = 0;
      this.coverHandRaised = false;
      this.playCoverConfirmSfx();
      this.manager.setState(ExperienceState.LITERARY_INTRO);
    }
  }

  getCoverHoldProgress() {
    const duration = this.config.idle.gesture?.holdDuration ?? 1;
    return Math.min(this.handActivationElapsed / duration, 1);
  }

  playCoverConfirmSfx() {
    const coverConfirm = this.config.audio?.coverConfirm;

    if (!coverConfirm || !this.audioManager) {
      return;
    }

    this.audioManager.playSfx(coverConfirm.id);
  }

  updateAbsence(userDetected, absenceResetDelay = this.config.idle.absenceResetDelay) {
    if (userDetected) {
      this.absenceElapsed = 0;
      return;
    }

    this.absenceElapsed += this.deltaTime;

    if (this.absenceElapsed >= absenceResetDelay) {
      this.reset();
    }
  }

  updateDebug({ cameraActive, handDetected, poseDetected, poseInput, input }) {
    if (!this.debugPanel) {
      return;
    }

    const snapshot = this.manager.getSnapshot();
    const rendererInfo = this.renderer?.info;
    const gameStats = this.aliceGameScene?.getDebugStats();
    const literaryStats = this.literaryIntroScene?.getDebugStats();
    const princeStats = this.princeGameScene?.getDebugStats();
    const submarineStats = this.submarineGameScene?.getDebugStats();
    const stateSeconds = (snapshot.elapsed / 1000).toFixed(1);
    const durationSeconds = snapshot.duration ? (snapshot.duration / 1000).toFixed(1) : "--";
    const absenceSeconds = (this.absenceElapsed / 1000).toFixed(1);
    const absenceLimit = ((this.isPrinceState(snapshot.state) ? this.config.prince.absenceTimeout : this.config.idle.absenceResetDelay) / 1000).toFixed(1);

    this.debugPanel.innerHTML = `
      <span>STATE: ${snapshot.state}</span>
      <span>TIME: ${stateSeconds} / ${durationSeconds}</span>
      <span>PROGRESS: ${Math.round(snapshot.progress * 100)}%</span>
      <span>CAMERA: ${cameraActive ? "ACTIVE" : "INACTIVE"}</span>
      <span>HAND: ${handDetected ? "DETECTED" : "NONE"}</span>
      <span>POSE DETECTED: ${poseDetected ? "YES" : "NO"}</span>
      <span>POSE CONF: ${Number(poseInput?.confidence ?? 0).toFixed(2)}</span>
      <span>INPUT: ${input?.source ?? "none"}</span>
      <span>LITERARY PHASE: ${literaryStats?.phase ?? "--"}</span>
      <span>MOVEMENT: ${Number(literaryStats?.movement ?? 0).toFixed(2)}</span>
      <span>CAN CONTINUE: ${literaryStats?.canContinue ? "YES" : "NO"}</span>
      <span>HAND RAISED: ${literaryStats?.handRaised ? "YES" : "NO"}</span>
      <span>HOLD: ${Number(literaryStats?.holdProgress ?? 0).toFixed(2)}</span>
      <span>LETTER COUNT: ${literaryStats?.letterCount ?? this.config.literaryIntro.letters.count}</span>
      <span>ABSENCE: ${absenceSeconds} / ${absenceLimit}</span>
      <span>ACTIVATION: ${Math.round(this.handActivationElapsed)}ms</span>
      <span>PLAYER X: ${(gameStats?.playerX ?? 0).toFixed(2)}</span>
      <span>PLAYER Y: ${(gameStats?.playerY ?? 0).toFixed(2)}</span>
      <span>RAW PALM: ${this.formatDebugPoint(gameStats?.rawPalmX, gameStats?.rawPalmY)}</span>
      <span>TARGET: ${this.formatDebugPoint(gameStats?.targetX, gameStats?.targetY)}</span>
      <span>COLLECTED: ${gameStats?.collected ?? 0} / ${gameStats?.target ?? this.config.aliceGame.collectibles.targetCount}</span>
      <span>LEFT WRIST: ${this.formatDebugPoint(princeStats?.leftWrist?.x, princeStats?.leftWrist?.y)}</span>
      <span>RIGHT WRIST: ${this.formatDebugPoint(princeStats?.rightWrist?.x, princeStats?.rightWrist?.y)}</span>
      <span>STARS RECOVERED: ${princeStats?.starsRecovered ?? 0} / ${this.config.prince.stars.count}</span>
      <span>PRINCE TIME: ${((princeStats?.gameTime ?? 0) / 1000).toFixed(1)}s</span>
      <span>LIGHT: ${this.formatDebugPoint(submarineStats?.lightX, submarineStats?.lightY)}</span>
      <span>SUB DISCOVERED: ${submarineStats?.discoveredCount ?? 0} / ${this.config.submarine.discovery.objectCount}</span>
      <span>ACTIVE OBJECT: ${submarineStats?.activeObject ?? "--"}</span>
      <span>REVEAL: ${Number(submarineStats?.activeRevealProgress ?? 0).toFixed(2)}</span>
      <span>SUB TIME: ${((submarineStats?.time ?? 0) / 1000).toFixed(1)}s</span>
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

      .book-idle-gesture {
        display: grid;
        justify-items: center;
        gap: 0.65rem;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 260ms ease, transform 260ms ease;
      }

      .book-idle-scene.is-camera-ready .book-idle-gesture {
        opacity: 1;
        transform: translateY(0);
      }

      .book-idle-hold-circle {
        width: clamp(3.4rem, 7vw, 5.2rem);
        aspect-ratio: 1;
        transform: scale(1);
        transition: transform 160ms ease;
      }

      .book-idle-scene.is-hold-complete .book-idle-hold-circle {
        transform: scale(1.1);
      }

      .book-idle-hold-circle svg {
        width: 100%;
        height: 100%;
        display: block;
        transform: rotate(-90deg);
      }

      .book-idle-hold-track,
      .book-idle-hold-progress {
        fill: none;
        stroke-width: 6;
      }

      .book-idle-hold-track {
        stroke: rgba(248, 245, 255, 0.18);
      }

      .book-idle-hold-progress {
        stroke: #d8bd74;
        stroke-linecap: round;
        stroke-dasharray: 163.36;
        stroke-dashoffset: 163.36;
        transition: stroke-dashoffset 120ms linear;
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

      body[data-book-mapping-state="IDLE"] .mapping-panel {
        position: fixed;
        inset: auto 1rem clamp(2.4rem, 8vh, 4.8rem);
        width: min(100% - 2rem, 460px);
        min-height: auto;
        padding: 0;
        z-index: 17;
      }

      body[data-book-mapping-state="IDLE"] .mapping-camera-field {
        margin-bottom: 0.9rem;
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
      body[data-book-mapping-state="ALICE_RESULT"] .mapping-start-camera,
      body[data-book-mapping-state="LITERARY_INTRO"] .mapping-start-camera,
      body[data-book-mapping-state="LITERARY_TITLE"] .mapping-start-camera,
      body[data-book-mapping-state="TRANSITION_TO_PRINCE"] .mapping-start-camera,
      body[data-book-mapping-state="PRINCE_INTRO"] .mapping-start-camera,
      body[data-book-mapping-state="PRINCE_GAME"] .mapping-start-camera,
      body[data-book-mapping-state="PRINCE_RESULT"] .mapping-start-camera,
      body[data-book-mapping-state="TRANSITION_TO_SUBMARINE"] .mapping-start-camera,
      body[data-book-mapping-state="SUBMARINE_INTRO"] .mapping-start-camera,
      body[data-book-mapping-state="SUBMARINE_GAME"] .mapping-start-camera,
      body[data-book-mapping-state="SUBMARINE_RESULT"] .mapping-start-camera {
        position: fixed;
        left: clamp(1rem, 3vw, 2rem);
        top: clamp(5.6rem, 12vh, 7rem);
        z-index: 22;
        transform: none;
      }

      .literary-tutorial {
        position: fixed;
        left: 50%;
        top: clamp(5.5rem, 13vh, 8rem);
        z-index: 21;
        padding: 0.52rem 0.72rem;
        border: 1px solid rgba(248, 245, 255, 0.16);
        background: rgba(8, 7, 18, 0.58);
        color: #f3ead2;
        font-size: clamp(0.82rem, 2vw, 1.12rem);
        font-weight: 900;
        letter-spacing: 0.12em;
        text-align: center;
        text-transform: uppercase;
        opacity: 1;
        transform: translateX(-50%);
        transition: opacity 240ms ease, transform 240ms ease;
        pointer-events: none;
      }

      .literary-tutorial.is-hidden {
        opacity: 0;
        transform: translate(-50%, -8px);
      }

      .literary-tutorial.is-continue {
        display: grid;
        gap: 0.5rem;
        min-width: min(84vw, 360px);
        color: #ffffff;
      }

      .literary-tutorial.is-complete {
        opacity: 0;
        transform: translate(-50%, -14px);
      }

      .literary-hold {
        display: none;
        width: 100%;
        height: 6px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(243, 234, 210, 0.18);
      }

      .literary-tutorial.is-continue .literary-hold {
        display: block;
      }

      .literary-hold span {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: inherit;
        background: #d8bd74;
        transform: scaleX(0);
        transform-origin: left center;
        transition: transform 120ms linear;
      }

      .literary-title {
        position: fixed;
        left: 50%;
        top: 50%;
        z-index: 22;
        display: grid;
        gap: 0.42rem;
        width: min(100% - 2rem, 980px);
        color: #f3ead2;
        text-align: center;
        text-transform: uppercase;
        transform: translate(-50%, -50%);
        pointer-events: none;
        text-shadow: 0 10px 44px rgba(0, 0, 0, 0.45);
      }

      .literary-title span,
      .literary-title strong {
        display: block;
        line-height: 0.96;
        letter-spacing: 0.04em;
      }

      .literary-title span {
        font-size: clamp(1.2rem, 3.2vw, 2.6rem);
        font-weight: 800;
        color: rgba(243, 234, 210, 0.88);
      }

      .literary-title strong {
        font-size: clamp(2.2rem, 6.5vw, 6rem);
        font-weight: 900;
        color: #ffffff;
      }

      .prince-transition-label,
      .prince-result-label,
      .prince-instruction {
        position: fixed;
        left: 50%;
        z-index: 21;
        transform: translateX(-50%);
        text-align: center;
        text-transform: uppercase;
        pointer-events: none;
      }

      .prince-transition-label {
        bottom: clamp(2rem, 9vh, 5rem);
        transition: opacity 180ms ease;
      }

      .prince-transition-label h1,
      .prince-result-label h1 {
        margin: 0;
        font-size: clamp(1.6rem, 4vw, 3.2rem);
        line-height: 0.95;
      }

      .prince-instruction {
        top: clamp(5.5rem, 13vh, 8rem);
        padding: 0.52rem 0.72rem;
        border: 1px solid rgba(248, 245, 255, 0.16);
        background: rgba(8, 7, 18, 0.58);
        color: #f3d66b;
        font-size: clamp(0.82rem, 2vw, 1.12rem);
        font-weight: 900;
        letter-spacing: 0.12em;
        opacity: 1;
        transition: opacity 240ms ease, transform 240ms ease;
      }

      .prince-instruction.is-hidden {
        opacity: 0;
        transform: translate(-50%, -8px);
      }

      .prince-result-label {
        bottom: clamp(2rem, 9vh, 5rem);
      }

      .prince-result-label p {
        margin: 0.55rem 0 0;
        color: #f3d66b;
        font-weight: 900;
      }

      .submarine-transition-label,
      .submarine-instruction,
      .submarine-result-label {
        position: fixed;
        left: 50%;
        z-index: 21;
        transform: translateX(-50%);
        text-align: center;
        text-transform: uppercase;
        pointer-events: none;
      }

      .submarine-transition-label {
        bottom: clamp(2rem, 9vh, 5rem);
        color: #d8f3ff;
        transition: opacity 180ms ease;
      }

      .submarine-transition-label h1,
      .submarine-result-label h1 {
        margin: 0;
        font-size: clamp(1.5rem, 4vw, 3rem);
        line-height: 0.95;
      }

      .submarine-instruction {
        top: clamp(5.5rem, 13vh, 8rem);
        padding: 0.52rem 0.72rem;
        border: 1px solid rgba(216, 243, 255, 0.18);
        background: rgba(3, 18, 37, 0.64);
        color: #d8f3ff;
        font-size: clamp(0.82rem, 2vw, 1.12rem);
        font-weight: 900;
        letter-spacing: 0.12em;
      }

      .submarine-hud {
        position: fixed;
        left: 50%;
        top: clamp(1rem, 5vh, 2.2rem);
        z-index: 22;
        padding: 0.48rem 0.72rem;
        border: 1px solid rgba(216, 243, 255, 0.2);
        background: rgba(3, 18, 37, 0.58);
        color: #d8f3ff;
        font-size: clamp(0.95rem, 2vw, 1.22rem);
        font-weight: 900;
        letter-spacing: 0.08em;
        transform: translateX(-50%);
        pointer-events: none;
      }

      .submarine-result-label {
        bottom: clamp(2rem, 9vh, 5rem);
        color: #d8f3ff;
      }

      .submarine-result-label p {
        margin: 0.55rem 0 0;
        color: #d8bd74;
        font-weight: 900;
      }
    `;
    document.head.appendChild(this.styleNode);
  }
}
