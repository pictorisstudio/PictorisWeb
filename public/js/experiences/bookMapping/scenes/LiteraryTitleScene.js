import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { LetterField } from "../objects/LetterField.js";

export class LiteraryTitleScene {
  constructor({ scene, camera, root, config }) {
    this.scene = scene;
    this.camera = camera;
    this.root = root;
    this.config = config.literaryIntro;
    this.group = new THREE.Group();
    this.letterField = null;
    this.node = null;
    this.previousBackground = null;
    this.elapsed = 0;
    this.isActive = false;
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.elapsed = 0;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(0x080b1d);
    this.letterField = new LetterField({
      camera: this.camera,
      config: {
        ...this.config.letters,
        count: Math.round(this.config.letters.count * 0.62),
        driftSpeed: this.config.letters.driftSpeed * 0.58,
        pushStrength: this.config.letters.pushStrength * 0.7
      }
    });
    this.letterField.setTitleMode(true);
    this.group.add(this.letterField.group);
    this.scene.add(this.group);
    this.createTitle();
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    this.elapsed += deltaTime;
    this.letterField.update(deltaTime, input, progress);
    this.updateTitle();
  }

  exit() {
    this.isActive = false;
    this.node?.remove();
    this.node = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.letterField?.dispose();
    this.group.clear();
    this.letterField = null;

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }
  }

  destroy() {
    this.exit();
  }

  createTitle() {
    this.node = document.createElement("div");
    this.node.className = "literary-title";
    this.node.innerHTML = `
      <span>VAMOS A RECONSTRUIR</span>
      <strong>GRANDES HISTORIAS</strong>
      <span>DE LA LITERATURA</span>
    `;
    this.root.appendChild(this.node);
  }

  updateTitle() {
    if (!this.node) {
      return;
    }

    const { fadeIn: fadeInDuration, readableDuration, fadeOut: fadeOutDuration } = this.config.title;
    const fadeOutStart = fadeInDuration + readableDuration;
    const fadeIn = Math.min(this.elapsed / fadeInDuration, 1);
    const fadeOut = this.elapsed > fadeOutStart
      ? Math.max(1 - (this.elapsed - fadeOutStart) / fadeOutDuration, 0)
      : 1;
    this.node.style.opacity = String(Math.min(fadeIn, fadeOut));
  }
}
