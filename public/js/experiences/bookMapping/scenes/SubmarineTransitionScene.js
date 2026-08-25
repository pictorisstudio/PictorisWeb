import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class SubmarineTransitionScene {
  constructor({ scene, root, config }) {
    this.scene = scene;
    this.root = root;
    this.config = config.submarine;
    this.group = new THREE.Group();
    this.node = null;
    this.materials = [];
    this.geometries = [];
    this.previousBackground = null;
    this.isActive = false;
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.createWaterLayers();
    this.scene.add(this.group);
    this.createLabel();
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    const eased = progress * progress * (3 - 2 * progress);
    this.materials.forEach((material, index) => {
      material.opacity = (index + 1) * 0.11 * eased;
    });
    if (this.node) {
      this.node.style.opacity = String(eased);
    }
  }

  exit() {
    this.isActive = false;
    this.node?.remove();
    this.node = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.group.clear();
    this.geometries = [];
    this.materials = [];

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }
  }

  destroy() {
    this.exit();
  }

  createWaterLayers() {
    [0, 1, 2].forEach((index) => {
      const geometry = new THREE.PlaneGeometry(14, 1.4);
      const material = new THREE.MeshBasicMaterial({
        color: index % 2 ? this.config.colors.water : this.config.colors.deep,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, -2.45 + index * 0.62, -0.95 - index * 0.05);
      mesh.rotation.z = index % 2 ? 0.04 : -0.03;
      this.group.add(mesh);
      this.geometries.push(geometry);
      this.materials.push(material);
    });
  }

  createLabel() {
    this.node = document.createElement("div");
    this.node.className = "submarine-transition-label";
    this.node.innerHTML = "<h1>DESCUBRIR LAS PROFUNDIDADES</h1>";
    this.root.appendChild(this.node);
  }
}
