import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { DiscoverableObject } from "../objects/DiscoverableObject.js";
import { SubmarineLight } from "../objects/SubmarineLight.js";

export class SubmarineGameScene {
  constructor({ scene, camera, root, config, onComplete }) {
    this.scene = scene;
    this.camera = camera;
    this.root = root;
    this.config = config.submarine;
    this.onComplete = onComplete;
    this.group = new THREE.Group();
    this.light = null;
    this.objects = [];
    this.hudNode = null;
    this.previousBackground = null;
    this.completed = false;
    this.isActive = false;
    this.debugStats = {
      lightX: 0,
      lightY: 0,
      discoveredCount: 0,
      activeObject: "--",
      activeRevealProgress: 0,
      time: 0
    };
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.completed = false;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.createBackdrop();
    this.objects = this.config.objects.map((definition) => new DiscoverableObject({
      definition,
      config: this.config.discovery,
      colors: this.config.colors
    }));
    this.objects.forEach((object) => this.group.add(object.group));
    this.light = new SubmarineLight({ config: this.config.light, camera: this.camera });
    this.group.add(this.light.group);
    this.scene.add(this.group);
    this.createHud();
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    const now = performance.now();
    this.light.update(input);
    const lightPosition = this.light.getPosition();
    this.objects.forEach((object) => object.update(deltaTime, lightPosition, this.light.getRadius(), now));
    const discoveredCount = this.getDiscoveredCount();
    const active = this.objects.find((object) => object.getDebugState().active);
    this.updateHud(discoveredCount);
    this.debugStats = {
      lightX: lightPosition.x,
      lightY: lightPosition.y,
      discoveredCount,
      activeObject: active?.definition?.name ?? "--",
      activeRevealProgress: active?.progress ?? 0,
      time: progress * this.config.game.duration
    };

    if (!this.completed && (discoveredCount >= this.config.discovery.objectCount || progress >= 0.995)) {
      this.completed = true;
      this.onComplete?.(this.getResult());
    }
  }

  exit() {
    this.isActive = false;
    this.hudNode?.remove();
    this.hudNode = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.objects.forEach((object) => object.dispose());
    this.light?.dispose();
    this.group.children.forEach((child) => {
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    });
    this.group.clear();
    this.objects = [];
    this.light = null;

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }
  }

  destroy() {
    this.exit();
  }

  getDiscoveredCount() {
    return this.objects.filter((object) => object.discovered).length;
  }

  getResult() {
    return {
      discoveredCount: this.getDiscoveredCount(),
      totalCount: this.config.discovery.objectCount
    };
  }

  getDebugStats() {
    return this.debugStats;
  }

  createBackdrop() {
    [0, 1, 2].forEach((index) => {
      const geometry = new THREE.PlaneGeometry(15, 1.1);
      const material = new THREE.MeshBasicMaterial({
        color: index % 2 ? this.config.colors.water : this.config.colors.deep,
        transparent: true,
        opacity: 0.14 + index * 0.04,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, -2.7 + index * 0.5, -1);
      mesh.rotation.z = index % 2 ? 0.04 : -0.035;
      this.group.add(mesh);
    });
  }

  createHud() {
    this.hudNode = document.createElement("div");
    this.hudNode.className = "submarine-hud";
    this.root.appendChild(this.hudNode);
    this.updateHud(0);
  }

  updateHud(discoveredCount) {
    if (!this.hudNode) {
      return;
    }

    this.hudNode.textContent = `${discoveredCount} / ${this.config.discovery.objectCount}`;
  }
}
