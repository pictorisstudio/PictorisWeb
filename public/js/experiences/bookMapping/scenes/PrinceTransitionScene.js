import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class PrinceTransitionScene {
  constructor({ scene, root, config }) {
    this.scene = scene;
    this.root = root;
    this.config = config.prince;
    this.timeline = config.timeline;
    this.group = new THREE.Group();
    this.node = null;
    this.planet = null;
    this.geometry = null;
    this.material = null;
    this.previousBackground = null;
    this.isActive = false;
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.geometry = new THREE.CircleGeometry(this.config.planet.size / 2, 56);
    this.material = new THREE.MeshBasicMaterial({
      color: this.config.colors.planet,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    this.planet = new THREE.Mesh(this.geometry, this.material);
    this.planet.position.set(0, this.config.planet.y, -0.74);
    this.planet.scale.setScalar(0.03);
    this.group.add(this.planet);
    this.scene.add(this.group);
    this.createLabel();
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    const eased = progress * progress * (3 - 2 * progress);
    this.material.opacity = eased;
    this.planet.scale.setScalar(0.03 + eased * 0.97);

    if (this.node) {
      this.node.style.opacity = String(Math.max(1 - progress * 1.35, 0));
    }
  }

  exit() {
    this.isActive = false;
    this.node?.remove();
    this.node = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.geometry?.dispose();
    this.material?.dispose();
    this.group.clear();
    this.planet = null;
    this.geometry = null;
    this.material = null;

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
    this.node.className = "prince-transition-label";
    this.node.innerHTML = `
      <h1>${this.timeline.ALICE_RESULT.title}</h1>
    `;
    this.root.appendChild(this.node);
  }
}
