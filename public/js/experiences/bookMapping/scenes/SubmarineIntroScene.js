import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { SubmarineBackground } from "../objects/SubmarineBackground.js";
import { SubmarineDarkness } from "../objects/SubmarineDarkness.js";
import { SubmarineLight } from "../objects/SubmarineLight.js";

export class SubmarineIntroScene {
  constructor({ scene, camera, root, config }) {
    this.scene = scene;
    this.camera = camera;
    this.root = root;
    this.config = config.submarine;
    this.group = new THREE.Group();
    this.background = null;
    this.darkness = null;
    this.light = null;
    this.node = null;
    this.previousBackground = null;
    this.elapsed = 0;
    this.movement = 0;
    this.lastLight = null;
    this.isActive = false;
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.elapsed = 0;
    this.movement = 0;
    this.lastLight = null;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.background = new SubmarineBackground({ config: this.config.background, camera: this.camera });
    this.group.add(this.background.group);
    this.light = new SubmarineLight({ config: this.config.light, camera: this.camera });
    this.darkness = new SubmarineDarkness({ config: this.config.darkness, camera: this.camera });
    this.group.add(this.darkness.group);
    this.group.add(this.light.group);
    this.scene.add(this.group);
    this.createInstruction();
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    this.elapsed += deltaTime;
    this.light.update(input);
    this.background?.update();
    this.darkness?.update(this.light.getPosition());
    this.trackMovement();
    this.updateInstruction();
    this.group.children.forEach((child, index) => {
      if (child !== this.light.group && child !== this.background?.group && child !== this.darkness?.group) {
        child.position.x += Math.sin(performance.now() * 0.0004 + index) * 0.0008;
      }
    });
  }

  exit() {
    this.isActive = false;
    this.node?.remove();
    this.node = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.background?.dispose();
    this.darkness?.dispose();
    this.light?.dispose();
    this.group.children.forEach((child) => {
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    });
    this.group.clear();
    this.background = null;
    this.darkness = null;
    this.light = null;

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
    this.node.className = "submarine-instruction";
    this.node.textContent = "MUEVE TU MANO";
    this.root.appendChild(this.node);
  }

  updateInstruction() {
    if (!this.node) {
      return;
    }

    const ready = this.elapsed >= this.config.intro.moveHandMinDuration
      && this.movement >= this.config.intro.detectMovementThreshold;
    this.node.textContent = ready ? "ILUMINA EL FONDO DEL MAR" : "MUEVE TU MANO";
  }

  trackMovement() {
    const current = this.light.getPosition();
    if (this.lastLight) {
      this.movement += current.distanceTo(this.lastLight);
    }
    this.lastLight = current.clone();
  }
}
