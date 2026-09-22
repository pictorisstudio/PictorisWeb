import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { PlayerSilhouette } from "../objects/PlayerSilhouette.js";
import { PrinceAvatar } from "../objects/PrinceAvatar.js";
import { Rose } from "../objects/Rose.js";
import { SmallPlanet } from "../objects/SmallPlanet.js";

export class PrinceIntroScene {
  constructor({ scene, camera, root, config }) {
    this.scene = scene;
    this.camera = camera;
    this.root = root;
    this.config = config.prince;
    this.group = new THREE.Group();
    this.planet = null;
    this.silhouette = null;
    this.avatar = null;
    this.rose = null;
    this.node = null;
    this.previousBackground = null;
    this.poseStableElapsed = 0;
    this.isActive = false;
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.poseStableElapsed = 0;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.planet = new SmallPlanet({ config: this.config.planet });
    this.silhouette = new PlayerSilhouette({ camera: this.camera, config: this.config.silhouette });
    this.avatar = new PrinceAvatar({ config: this.config.avatar, colors: this.config.colors });
    this.rose = new Rose({ config: this.config.rose, colors: this.config.colors });
    this.rose.group.position.set(0, this.planet.getSurfaceY() - 0.1, -0.62);
    this.group.add(this.silhouette.group, this.planet.group, this.avatar.group, this.rose.group);
    this.scene.add(this.group);
    this.createInstruction();
  }

  update(deltaTime, input, progress, context = {}) {
    if (!this.isActive) {
      return;
    }

    const pose = context.poseInput;
    this.silhouette.update(context.segmentationInput);
    const stable = Boolean(pose?.stable);
    this.poseStableElapsed = stable ? this.poseStableElapsed + deltaTime : 0;
    this.avatar.update(stable ? pose : null);
    this.planet.update({ progress: Math.min(progress * 1.6, 1) });
    this.rose.update(0);
    this.updateInstruction(stable);
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
    this.rose?.dispose();
    this.group.clear();
    this.planet = null;
    this.silhouette = null;
    this.avatar = null;
    this.rose = null;

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }
  }

  destroy() {
    this.exit();
  }

  createInstruction() {
    this.node = document.createElement("div");
    this.node.className = "prince-instruction";
    this.node.textContent = "PONTE FRENTE A LA CAMARA";
    this.root.appendChild(this.node);
  }

  updateInstruction(stable) {
    if (!this.node) {
      return;
    }

    this.node.textContent = stable ? "MUEVE TUS BRAZOS" : "PONTE FRENTE A LA CAMARA";
  }
}
