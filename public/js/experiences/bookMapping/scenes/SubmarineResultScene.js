import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { DiscoverableObject } from "../objects/DiscoverableObject.js";

export class SubmarineResultScene {
  constructor({ scene, root, config }) {
    this.scene = scene;
    this.root = root;
    this.config = config.submarine;
    this.group = new THREE.Group();
    this.objects = [];
    this.node = null;
    this.previousBackground = null;
    this.result = null;
    this.isActive = false;
  }

  enter(result = null) {
    this.exit();
    this.isActive = true;
    this.result = result ?? { discoveredCount: 0, totalCount: this.config.discovery.objectCount };
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(0x08213b);
    this.objects = this.config.objects.map((definition) => {
      const object = new DiscoverableObject({ definition, config: this.config.discovery, colors: this.config.colors });
      object.progress = 1;
      object.discovered = true;
      return object;
    });
    this.objects.forEach((object) => this.group.add(object.group));
    this.scene.add(this.group);
    this.createLabel();
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    const now = performance.now();
    this.objects.forEach((object) => object.update(deltaTime, null, 0, now));
  }

  exit() {
    this.isActive = false;
    this.node?.remove();
    this.node = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.objects.forEach((object) => object.dispose());
    this.group.clear();
    this.objects = [];

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }
  }

  destroy() {
    this.exit();
  }

  createLabel() {
    this.node = document.createElement("div");
    this.node.className = "submarine-result-label";
    this.node.innerHTML = `
      <h1>20.000 LEGUAS DE VIAJE SUBMARINO</h1>
      <p>${this.result.discoveredCount} / ${this.result.totalCount} descubrimientos</p>
    `;
    this.root.appendChild(this.node);
  }
}
