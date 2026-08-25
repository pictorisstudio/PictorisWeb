import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { SubmarineLight } from "../objects/SubmarineLight.js";

export class SubmarineIntroScene {
  constructor({ scene, camera, root, config }) {
    this.scene = scene;
    this.camera = camera;
    this.root = root;
    this.config = config.submarine;
    this.group = new THREE.Group();
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
    this.createBackdrop();
    this.light = new SubmarineLight({ config: this.config.light, camera: this.camera });
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
    this.trackMovement();
    this.updateInstruction();
    this.group.children.forEach((child, index) => {
      if (child !== this.light.group) {
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

    this.light?.dispose();
    this.group.children.forEach((child) => {
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    });
    this.group.clear();
    this.light = null;

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }
  }

  destroy() {
    this.exit();
  }

  createBackdrop() {
    [0, 1].forEach((index) => {
      const geometry = new THREE.PlaneGeometry(15, 1.2);
      const material = new THREE.MeshBasicMaterial({
        color: index ? this.config.colors.water : this.config.colors.deep,
        transparent: true,
        opacity: 0.18,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, -2.5 + index * 0.58, -1);
      mesh.rotation.z = index ? 0.035 : -0.025;
      this.group.add(mesh);
    });
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
