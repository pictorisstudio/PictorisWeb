import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { LetterField } from "../objects/LetterField.js";

export class LiteraryIntroScene {
  constructor({ scene, camera, root, config, onComplete }) {
    this.scene = scene;
    this.camera = camera;
    this.root = root;
    this.config = config.literaryIntro;
    this.onComplete = onComplete;
    this.group = new THREE.Group();
    this.letterField = null;
    this.node = null;
    this.coverTitleNode = null;
    this.previousBackground = null;
    this.elapsed = 0;
    this.coverTransitionElapsed = 0;
    this.coverTransitionComplete = false;
    this.phaseElapsed = 0;
    this.holdElapsed = 0;
    this.lostTrackingElapsed = 0;
    this.canContinueElapsed = 0;
    this.phase = "EXPLORE";
    this.wasHandRaised = false;
    this.completionTimer = null;
    this.completed = false;
    this.isActive = false;
    this.debugStats = {
      phase: "EXPLORE",
      movement: 0,
      canContinue: false,
      handRaised: false,
      holdProgress: 0,
      letterCount: this.config.letters.count,
      coverTransitionPhase: "--",
      coverTransitionProgress: 0,
      interactionRadius: this.config.letters.interactionRadius,
      pushStrength: this.config.letters.pushStrength,
      maxPush: this.config.letters.maxPush,
      handSpeed: 0,
      activeInteractions: 0
    };
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.elapsed = 0;
    this.coverTransitionElapsed = 0;
    this.coverTransitionComplete = false;
    this.phaseElapsed = 0;
    this.holdElapsed = 0;
    this.lostTrackingElapsed = 0;
    this.canContinueElapsed = 0;
    this.phase = "EXPLORE";
    this.wasHandRaised = false;
    this.completionTimer = null;
    this.completed = false;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(0x080b1d);
    this.letterField = new LetterField({
      camera: this.camera,
      config: this.config.letters
    });
    this.letterField.setOpacity(0);
    this.letterField.setInteractionEnabled(false);
    this.group.add(this.letterField.group);
    this.scene.add(this.group);
    this.createTutorial();
    this.createCoverTitle();
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    if (!this.coverTransitionComplete) {
      this.updateCoverTransition(deltaTime, progress);
      this.updateDebugStats(input);
      return;
    }

    this.elapsed += deltaTime;
    this.phaseElapsed += deltaTime;
    this.letterField.update(deltaTime, input, progress);
    this.updatePhase(deltaTime, input);
    this.updateTutorial();
    this.updateDebugStats(input);
  }

  exit() {
    this.isActive = false;
    if (this.completionTimer) {
      window.clearTimeout(this.completionTimer);
      this.completionTimer = null;
    }
    this.node?.remove();
    this.node = null;
    this.coverTitleNode?.remove();
    this.coverTitleNode = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.letterField?.dispose();
    this.group.clear();
    this.letterField = null;
    this.phase = "EXPLORE";
    this.coverTransitionComplete = false;
    this.coverTransitionElapsed = 0;

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }
  }

  destroy() {
    this.exit();
  }

  createTutorial() {
    this.node = document.createElement("div");
    this.node.className = "literary-tutorial";
    this.node.innerHTML = `
      <span data-role="label">MUEVE TU MANO</span>
      <span class="literary-hold" data-role="hold" aria-hidden="true">
        <span></span>
      </span>
    `;
    this.root.appendChild(this.node);
  }

  createCoverTitle() {
    this.coverTitleNode = document.createElement("div");
    this.coverTitleNode.className = "literary-cover-title";
    this.coverTitleNode.innerHTML = `
      <h1>DEL LIBRO A LA<br>PANTALLA</h1>
      <div class="literary-cover-gesture" aria-hidden="true">
        <p>LEVANTA TU MANO<br>PARA COMENZAR</p>
        <div></div>
      </div>
    `;
    this.root.appendChild(this.coverTitleNode);
    this.node?.classList.add("is-transitioning");
  }

  updateCoverTransition(deltaTime, progress) {
    const transition = this.config.coverTransition;
    this.coverTransitionElapsed += deltaTime;

    const transitionProgress = Math.min(this.coverTransitionElapsed / transition.duration, 1);
    const reactProgress = Math.min(this.coverTransitionElapsed / transition.titleReactDuration, 1);
    const crossfadeStart = transition.titleReactDuration;
    const crossfadeProgress = Math.min(
      Math.max((this.coverTransitionElapsed - crossfadeStart) / transition.crossfadeDuration, 0),
      1
    );
    const easedCrossfade = crossfadeProgress * crossfadeProgress * (3 - 2 * crossfadeProgress);
    const scale = 1 + (transition.titleScale - 1) * reactProgress;

    this.letterField.setOpacity(easedCrossfade);
    this.letterField.update(deltaTime, null, progress);

    if (this.coverTitleNode) {
      this.coverTitleNode.style.opacity = String(1 - easedCrossfade);
      this.coverTitleNode.style.transform = `translate(-50%, -50%) scale(${scale})`;
      this.coverTitleNode.style.letterSpacing = transition.titleLetterSpacing;
    }

    if (transitionProgress >= 1) {
      this.coverTransitionComplete = true;
      this.coverTransitionElapsed = transition.duration;
      this.elapsed = 0;
      this.phaseElapsed = 0;
      this.letterField.setOpacity(1);
      this.letterField.setInteractionEnabled(true);
      this.coverTitleNode?.remove();
      this.coverTitleNode = null;
      this.node?.classList.remove("is-transitioning");
    }
  }

  updatePhase(deltaTime, input) {
    const movementReady = this.letterField.getMovementAmount() >= this.config.exploration.movementThreshold;
    const minimumReady = this.elapsed >= this.config.exploration.minimumTime;

    if (this.phase === "EXPLORE") {
      const canLeaveMovePrompt = this.elapsed >= this.config.tutorial.moveHandMinDuration && movementReady;
      const forcedLeaveMovePrompt = this.elapsed >= this.config.tutorial.moveHandMaxDuration;

      if (minimumReady && (canLeaveMovePrompt || forcedLeaveMovePrompt)) {
        this.setPhase("FREE");
      }
      return;
    }

    if (this.phase === "FREE") {
      if (this.phaseElapsed >= this.config.exploration.freeInteractionTime) {
        this.setPhase("WAIT_RAISE");
      }
      return;
    }

    if (this.phase === "WAIT_RAISE") {
      this.canContinueElapsed += deltaTime;
      this.updateHold(deltaTime, input);

      if (this.canContinueElapsed >= this.config.continueGesture.fallbackTimeout) {
        this.completeIntro();
      }
    }
  }

  updateHold(deltaTime, input) {
    const palm = input?.primaryHand?.palm ?? null;
    const hasPalm = Boolean(palm);
    const y = palm?.y ?? 1;
    const gesture = this.config.continueGesture;
    const raised = this.wasHandRaised
      ? hasPalm && y < gesture.exitThreshold
      : hasPalm && y < gesture.enterThreshold;

    if (raised) {
      this.wasHandRaised = true;
      this.lostTrackingElapsed = 0;
      this.holdElapsed += deltaTime;
    } else if (!hasPalm && this.holdElapsed > 0 && this.lostTrackingElapsed < gesture.lostTrackingGrace) {
      this.lostTrackingElapsed += deltaTime;
    } else {
      this.wasHandRaised = false;
      this.lostTrackingElapsed = 0;
      this.holdElapsed = Math.max(0, this.holdElapsed - deltaTime * 1.8);
    }

    if (this.holdElapsed >= gesture.holdDuration) {
      this.completeIntro();
    }
  }

  setPhase(phase) {
    if (this.phase === phase) {
      return;
    }

    this.phase = phase;
    this.phaseElapsed = 0;

    if (phase === "WAIT_RAISE") {
      this.canContinueElapsed = 0;
    }
  }

  completeIntro() {
    if (this.completed) {
      return;
    }

    this.completed = true;
    this.letterField.setCenterClearing(true);
    this.node?.classList.add("is-complete");
    this.completionTimer = window.setTimeout(() => this.onComplete?.(), 850);
  }

  updateTutorial() {
    if (!this.node) {
      return;
    }

    const label = this.node.querySelector('[data-role="label"]');
    const hold = this.node.querySelector('[data-role="hold"] span');
    const holdProgress = Math.min(this.holdElapsed / this.config.continueGesture.holdDuration, 1);

    if (label) {
      label.innerHTML = this.phase === "WAIT_RAISE"
        ? "LEVANTA TU MANO<br>PARA CONTINUAR"
        : "MUEVE TU MANO";
    }

    if (hold) {
      hold.style.transform = `scaleX(${holdProgress})`;
    }

    this.node.classList.toggle("is-hidden", this.phase === "FREE");
    this.node.classList.toggle("is-continue", this.phase === "WAIT_RAISE");
  }

  updateDebugStats(input) {
    const interactionStats = this.letterField?.getInteractionStats();
    this.debugStats = {
      phase: this.phase,
      movement: this.letterField?.getMovementAmount() ?? 0,
      canContinue: this.phase === "WAIT_RAISE",
      handRaised: this.wasHandRaised,
      holdProgress: Math.min(this.holdElapsed / this.config.continueGesture.holdDuration, 1),
      letterCount: interactionStats?.count ?? this.config.letters.count,
      palmY: input?.primaryHand?.palm?.y ?? null,
      coverTransitionPhase: this.coverTransitionComplete ? "COMPLETE" : "CROSSFADE",
      coverTransitionProgress: this.coverTransitionComplete
        ? 1
        : Math.min(this.coverTransitionElapsed / this.config.coverTransition.duration, 1),
      interactionRadius: interactionStats?.interactionRadius ?? this.config.letters.interactionRadius,
      pushStrength: interactionStats?.pushStrength ?? this.config.letters.pushStrength,
      maxPush: interactionStats?.maxPush ?? this.config.letters.maxPush,
      handSpeed: interactionStats?.handSpeed ?? 0,
      activeInteractions: interactionStats?.activeInteractions ?? 0
    };
  }

  getDebugStats() {
    return this.debugStats;
  }
}
