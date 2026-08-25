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
    this.previousBackground = null;
    this.elapsed = 0;
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
      letterCount: this.config.letters.count
    };
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.elapsed = 0;
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
    this.group.add(this.letterField.group);
    this.scene.add(this.group);
    this.createTutorial();
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
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

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.letterField?.dispose();
    this.group.clear();
    this.letterField = null;
    this.phase = "EXPLORE";

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
    this.debugStats = {
      phase: this.phase,
      movement: this.letterField?.getMovementAmount() ?? 0,
      canContinue: this.phase === "WAIT_RAISE",
      handRaised: this.wasHandRaised,
      holdProgress: Math.min(this.holdElapsed / this.config.continueGesture.holdDuration, 1),
      letterCount: this.config.letters.count,
      palmY: input?.primaryHand?.palm?.y ?? null
    };
  }

  getDebugStats() {
    return this.debugStats;
  }
}
