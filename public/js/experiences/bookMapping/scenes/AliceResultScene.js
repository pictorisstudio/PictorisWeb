import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { PlayerPage } from "../objects/PlayerPage.js";

export class AliceResultScene {
  constructor({ scene, camera, root, config }) {
    this.scene = scene;
    this.camera = camera;
    this.root = root;
    this.config = config.aliceGame;
    this.timeline = config.timeline;
    this.group = new THREE.Group();
    this.page = null;
    this.resultClocks = [];
    this.geometries = [];
    this.materials = [];
    this.node = null;
    this.previousBackground = null;
    this.isActive = false;
  }

  enter(result = null) {
    this.exit();
    this.isActive = true;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.page = new PlayerPage({
      camera: this.camera,
      config: this.config.player
    });
    this.page.group.position.set(0, -0.12, -1.1);
    this.group.add(this.page.group);
    this.buildResultClocks(result);
    this.scene.add(this.group);
    this.createTitle(result);
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    this.page.group.rotation.z = Math.sin(performance.now() * 0.0014) * 0.08;
    this.resultClocks.forEach((clock, index) => {
      clock.mesh.position.lerp(clock.target, 0.055 + progress * 0.04);
      clock.mesh.rotation.z += 0.01 + index * 0.0008;
      clock.material.opacity = Math.min(clock.material.opacity + 0.025, 0.88);
    });
  }

  exit() {
    this.isActive = false;
    this.node?.remove();
    this.node = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.page?.dispose();
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.resultClocks = [];
    this.geometries = [];
    this.materials = [];
    this.group.clear();
    this.page = null;

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }
  }

  destroy() {
    this.exit();
  }

  buildResultClocks(result) {
    const count = Math.max(result?.collectedCount ?? 0, 1);
    const clockGeometry = new THREE.CircleGeometry(0.13, 24);
    const handGeometry = new THREE.PlaneGeometry(0.16, 0.018);
    this.geometries.push(clockGeometry, handGeometry);

    for (let index = 0; index < count; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index % 2 ? this.config.colors.pink : this.config.colors.gold,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Group();
      const face = new THREE.Mesh(clockGeometry, material);
      const hand = new THREE.Mesh(handGeometry, new THREE.MeshBasicMaterial({
        color: this.config.colors.ink,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        side: THREE.DoubleSide
      }));
      const angle = (index / count) * Math.PI * 2;
      hand.position.z = 0.01;
      hand.rotation.z = angle;
      mesh.add(face, hand);
      mesh.position.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3.4, -1.2);
      this.materials.push(material, hand.material);
      this.group.add(mesh);
      this.resultClocks.push({
        mesh,
        material,
        target: new THREE.Vector3(Math.cos(angle) * 1.05, -0.1 + Math.sin(angle) * 0.88, -1.05)
      });
    }
  }

  createTitle(result) {
    const collected = result?.collectedCount ?? 0;
    const target = result?.targetCount ?? this.config.collectibles.targetCount;
    this.node = document.createElement("div");
    this.node.className = "alice-result-label";
    this.node.innerHTML = `
      <h1>${this.timeline.ALICE_RESULT.title}</h1>
      <p>${collected} / ${target}</p>
    `;
    this.root.appendChild(this.node);
  }
}
