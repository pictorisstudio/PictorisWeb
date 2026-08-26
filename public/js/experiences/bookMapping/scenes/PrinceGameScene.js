import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { PlayerSilhouette } from "../objects/PlayerSilhouette.js";
import { PrinceAvatar } from "../objects/PrinceAvatar.js";
import { Rose } from "../objects/Rose.js";
import { SmallPlanet } from "../objects/SmallPlanet.js";
import { StarField } from "../objects/StarField.js";

export class PrinceGameScene {
  constructor({ scene, camera, root, config, onComplete }) {
    this.scene = scene;
    this.camera = camera;
    this.root = root;
    this.config = config.prince;
    this.onComplete = onComplete;
    this.group = new THREE.Group();
    this.planet = null;
    this.silhouette = null;
    this.avatar = null;
    this.stars = null;
    this.rose = null;
    this.node = null;
    this.previousBackground = null;
    this.absenceElapsed = 0;
    this.completed = false;
    this.isActive = false;
    this.debugStats = {
      poseDetected: false,
      poseConfidence: 0,
      leftWrist: null,
      rightWrist: null,
      starsRecovered: 0,
      gameTime: 0,
      segmentationActive: false,
      segmentationFps: 0,
      maskAge: null
    };
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.completed = false;
    this.absenceElapsed = 0;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.planet = new SmallPlanet({ config: this.config.planet });
    this.silhouette = new PlayerSilhouette({ camera: this.camera, config: this.config.silhouette });
    this.avatar = new PrinceAvatar({ config: this.config.avatar, colors: this.config.colors });
    this.stars = new StarField({ config: this.config.stars, colors: this.config.colors });
    this.rose = new Rose({ config: this.config.rose, colors: this.config.colors });
    this.rose.group.position.set(0, this.planet.getSurfaceY() - 0.1, -0.62);
    this.group.add(this.silhouette.group, this.planet.group, this.avatar.group, this.stars.group, this.rose.group);
    this.scene.add(this.group);
    this.createInstruction();
  }

  update(deltaTime, input, progress, context = {}) {
    if (!this.isActive) {
      return;
    }

    const now = performance.now();
    const pose = context.poseInput;
    const segmentationInput = context.segmentationInput;
    const poseStable = Boolean(pose?.stable);

    this.absenceElapsed = poseStable ? 0 : this.absenceElapsed + deltaTime;
    this.silhouette.update(segmentationInput);
    this.avatar.update(poseStable ? pose : null);

    const torsoTilt = this.getTorsoTilt(pose);
    this.planet.update({ torsoTilt, progress: 1 });
    this.stars.update({
      deltaTime,
      now,
      wristPositions: this.avatar.getWristWorldPositions(),
      planetCenter: this.planet.getOrbitCenter()
    });
    this.rose.update(this.stars.getRecoveredCount());
    this.updateInstruction();

    this.debugStats = {
      poseDetected: poseStable,
      poseConfidence: pose?.confidence ?? 0,
      leftWrist: pose?.world?.leftWrist ?? null,
      rightWrist: pose?.world?.rightWrist ?? null,
      starsRecovered: this.stars.getRecoveredCount(),
      gameTime: progress * this.config.gameDuration,
      segmentationActive: Boolean(segmentationInput?.active),
      segmentationFps: segmentationInput?.fps ?? 0,
      maskAge: Number.isFinite(segmentationInput?.age) ? segmentationInput.age : null
    };

    if (!this.completed && (this.stars.isComplete() || progress >= 0.995 || this.absenceElapsed >= this.config.absenceTimeout)) {
      this.completed = true;
      this.onComplete?.(this.getResult());
    }
  }

  exit() {
    this.isActive = false;
    this.node?.remove();
    this.node = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.planet?.dispose();
    this.silhouette?.dispose();
    this.avatar?.dispose();
    this.stars?.dispose();
    this.rose?.dispose();
    this.group.clear();
    this.planet = null;
    this.silhouette = null;
    this.avatar = null;
    this.stars = null;
    this.rose = null;

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }
  }

  destroy() {
    this.exit();
  }

  getResult() {
    return {
      starsRecovered: this.stars?.getRecoveredCount() ?? 0,
      totalStars: this.config.stars.count
    };
  }

  getDebugStats() {
    return this.debugStats;
  }

  getTorsoTilt(pose) {
    if (!pose?.stable) {
      return 0;
    }

    const left = pose.world.leftShoulder;
    const right = pose.world.rightShoulder;
    return THREE.MathUtils.clamp((right.y - left.y) * 0.45, -1, 1);
  }

  createInstruction() {
    this.node = document.createElement("div");
    this.node.className = "prince-instruction";
    this.node.textContent = "TOCA UNA ESTRELLA";
    this.root.appendChild(this.node);
  }

  updateInstruction() {
    if (!this.node) {
      return;
    }

    this.node.classList.toggle("is-hidden", this.stars.getRecoveredCount() > 0);
  }
}
