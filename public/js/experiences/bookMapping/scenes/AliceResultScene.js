import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { createClockGeometry, createClockMaterial, getClockTexture } from "../objects/ClockVisual.js";
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
    this.elapsed = 0;
    this.isActive = false;
  }

  enter(result = null) {
    this.exit();
    this.isActive = true;
    this.elapsed = 0;
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

  update(deltaTime) {
    if (!this.isActive) {
      return;
    }

    this.elapsed += deltaTime;
    const duration = this.timeline.ALICE_RESULT.duration;
    const fadeDuration = Math.min(700, duration * 0.25);
    const fadeIn = Math.min(this.elapsed / fadeDuration, 1);
    const fadeOutStart = duration - fadeDuration;
    const fadeOut = this.elapsed > fadeOutStart
      ? Math.max(1 - (this.elapsed - fadeOutStart) / fadeDuration, 0)
      : 1;
    const visibility = Math.min(fadeIn, fadeOut);

    this.page.group.rotation.z = Math.sin(performance.now() * 0.0014) * 0.08;
    this.resultClocks.forEach((clock, index) => {
      clock.mesh.position.lerp(clock.target, 0.055 + visibility * 0.04);
      clock.mesh.rotation.z += 0.01 + index * 0.0008;
      clock.material.opacity = Math.min(clock.material.opacity + 0.025, 1);
    });

    if (this.node) {
      this.node.style.opacity = String(visibility);
    }
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
    const clockGeometry = createClockGeometry(this.config.collectibles, 0.78);
    const clockTexture = getClockTexture(this.config.collectibles.clockAssetPath);
    const material = createClockMaterial(clockTexture, 0);
    this.geometries.push(clockGeometry);
    this.materials.push(material);

    for (let index = 0; index < count; index += 1) {
      const mesh = new THREE.Mesh(clockGeometry, material);
      const angle = (index / count) * Math.PI * 2;
      mesh.position.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3.4, -1.2);
      this.group.add(mesh);
      this.resultClocks.push({
        mesh,
        material,
        target: new THREE.Vector3(Math.cos(angle) * 1.05, -0.1 + Math.sin(angle) * 0.88, -1.05)
      });
    }
  }

  createTitle(result) {
    const target = result?.targetCount ?? this.config.collectibles.targetCount;
    this.node = document.createElement("div");
    this.node.className = "alice-result-label";
    this.node.innerHTML = `
      <h1>${this.timeline.ALICE_RESULT.title}</h1>
      <p>RECUPERASTE LOS ${target} RELOJES</p>
    `;
    this.root.appendChild(this.node);
  }
}
