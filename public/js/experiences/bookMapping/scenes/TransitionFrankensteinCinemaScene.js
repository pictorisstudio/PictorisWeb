import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class TransitionFrankensteinCinemaScene {
  constructor({ scene, config }) {
    this.scene = scene;
    this.config = config.frankensteinToCinema;
    this.group = new THREE.Group();
    this.lines = [];
    this.frames = [];
    this.geometries = [];
    this.materials = [];
    this.startColor = new THREE.Color(this.config.colors.start);
    this.endColor = new THREE.Color(this.config.colors.end);
    this.currentColor = new THREE.Color();
    this.previousBackground = null;
    this.clock = 0;
    this.isActive = false;
    this.debugStats = { lines: 0, frames: 0, phase: "IDLE" };
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.clock = 0;
    this.previousBackground = this.scene.background;
    this.buildLines();
    this.buildFrames();
    this.scene.add(this.group);
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    this.clock += deltaTime / 1000;
    this.currentColor.copy(this.startColor).lerp(this.endColor, progress);
    this.scene.background = this.currentColor;
    this.updateLines(progress);
    this.updateFrames(progress);
    this.debugStats.phase = progress < 0.45 ? "LIGHTNING" : progress < 0.82 ? "FRAMES" : "FILM";
  }

  exit() {
    this.isActive = false;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.group.clear();
    this.lines = [];
    this.frames = [];
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.geometries = [];
    this.materials = [];

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }

    this.debugStats = { lines: 0, frames: 0, phase: "IDLE" };
  }

  destroy() {
    this.exit();
  }

  buildLines() {
    for (let index = 0; index < this.config.lines; index += 1) {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({
        color: index % 2 ? this.config.colors.electric : this.config.colors.pink,
        transparent: true,
        opacity: 0.65,
        depthWrite: false
      });
      const line = new THREE.Line(geometry, material);
      this.geometries.push(geometry);
      this.materials.push(material);
      this.group.add(line);
      this.lines.push({ line, material, seed: index * 0.42 });
    }

    this.debugStats.lines = this.lines.length;
  }

  buildFrames() {
    const geometry = new THREE.PlaneGeometry(0.72, 0.46);
    this.geometries.push(geometry);

    for (let index = 0; index < this.config.frames; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index % 3 === 0 ? this.config.colors.blue : this.config.colors.frame,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((Math.random() - 0.5) * 5.5, (Math.random() - 0.5) * 4, -2 - Math.random() * 2);
      this.materials.push(material);
      this.group.add(mesh);
      this.frames.push({ mesh, material, seed: index * 0.38, start: mesh.position.clone() });
    }

    this.debugStats.frames = this.frames.length;
  }

  updateLines(progress) {
    const fade = 1 - this.smoothstep(0.35, 0.88, progress);
    this.lines.forEach((item, index) => {
      const y = -2.4 + index * 0.25;
      item.line.geometry.setFromPoints([
        new THREE.Vector3(-3.8 + Math.sin(this.clock + item.seed) * 0.4, y, -2.2),
        new THREE.Vector3(Math.sin(this.clock * 2 + item.seed), y + Math.sin(item.seed) * 0.7, -3.1),
        new THREE.Vector3(3.8 - Math.cos(this.clock + item.seed) * 0.4, y + 0.2, -2.2)
      ]);
      item.material.opacity = fade * (0.28 + (index % 4 === 0 ? 0.45 : 0));
    });
  }

  updateFrames(progress) {
    const appear = this.smoothstep(0.24, 0.62, progress);
    const organize = this.smoothstep(0.55, 1, progress);
    this.frames.forEach((frame, index) => {
      const row = index % this.config.strips;
      const column = Math.floor(index / this.config.strips) - Math.floor(this.config.frames / (this.config.strips * 2));
      const target = new THREE.Vector3(column * 0.62, row ? -0.66 : 0.66, -2.4);
      frame.mesh.position.copy(frame.start).lerp(target, organize);
      frame.mesh.position.y += Math.sin(this.clock * 1.2 + frame.seed) * 0.06 * (1 - organize);
      frame.mesh.rotation.z = (1 - organize) * Math.sin(this.clock + frame.seed) * 0.55;
      frame.mesh.scale.setScalar(THREE.MathUtils.lerp(0.42, 1, organize));
      frame.material.opacity = appear * 0.72;
    });
  }

  smoothstep(edge0, edge1, value) {
    const x = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
    return x * x * (3 - 2 * x);
  }

  getDebugStats() {
    return this.debugStats;
  }
}
