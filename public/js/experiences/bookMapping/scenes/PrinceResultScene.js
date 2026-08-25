import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { Rose } from "../objects/Rose.js";
import { SmallPlanet } from "../objects/SmallPlanet.js";

export class PrinceResultScene {
  constructor({ scene, root, config }) {
    this.scene = scene;
    this.root = root;
    this.config = config.prince;
    this.timeline = config.timeline;
    this.group = new THREE.Group();
    this.planet = null;
    this.rose = null;
    this.node = null;
    this.previousBackground = null;
    this.result = null;
    this.isActive = false;
  }

  enter(result = null) {
    this.exit();
    this.isActive = true;
    this.result = result ?? { starsRecovered: 0, totalStars: this.config.stars.count };
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.planet = new SmallPlanet({ config: this.config.planet });
    this.rose = new Rose({ config: this.config.rose, colors: this.config.colors });
    this.rose.group.position.set(0, this.planet.getSurfaceY() - 0.1, -0.62);
    this.group.add(this.planet.group, this.rose.group);
    this.scene.add(this.group);
    this.rose.update(this.result.starsRecovered);
    this.createLabel();
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    this.planet.update({ torsoTilt: Math.sin(performance.now() * 0.001) * 0.35, progress: 1 });
    this.rose.update(this.result.starsRecovered);
  }

  exit() {
    this.isActive = false;
    this.node?.remove();
    this.node = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.planet?.dispose();
    this.rose?.dispose();
    this.group.clear();
    this.planet = null;
    this.rose = null;

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
    this.node.className = "prince-result-label";
    this.node.innerHTML = `
      <h1>${this.timeline.PRINCE_RESULT.title}</h1>
      <p>${this.result.starsRecovered} estrellas regresaron</p>
    `;
    this.root.appendChild(this.node);
  }
}
