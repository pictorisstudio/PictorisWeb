import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class TransitionOzFrankensteinScene {
  constructor({ scene, camera, config }) {
    this.scene = scene;
    this.camera = camera;
    this.config = config.ozToFrankenstein;
    this.group = new THREE.Group();
    this.pieces = [];
    this.cables = [];
    this.sparks = [];
    this.materials = [];
    this.geometries = [];
    this.startColor = new THREE.Color(this.config.colors.start);
    this.endColor = new THREE.Color(this.config.colors.end);
    this.currentColor = new THREE.Color();
    this.previousBackground = null;
    this.clock = 0;
    this.isActive = false;
    this.debugStats = { roadPieces: 0, cables: 0, sparks: 0, phase: "IDLE" };
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.clock = 0;
    this.previousBackground = this.scene.background;
    this.buildPieces();
    this.buildCables();
    this.buildSparks();
    this.scene.add(this.group);
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    const delta = deltaTime / 1000;
    this.clock += delta;
    this.currentColor.copy(this.startColor).lerp(this.endColor, this.smoothstep(0, 1, progress));
    this.scene.background = this.currentColor;
    const palmWorld = this.toWorld(input?.primaryHand?.palm, input?.source);

    this.updatePieces(palmWorld, progress);
    this.updateCables(progress);
    this.updateSparks(delta, progress);
    this.debugStats.phase = progress < 0.42 ? "ROAD_BREAK" : progress < 0.75 ? "WIRES" : "ELECTRIC";
  }

  exit() {
    this.isActive = false;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.group.clear();
    this.pieces = [];
    this.cables = [];
    this.sparks = [];
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.geometries = [];
    this.materials = [];

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }

    this.debugStats = { roadPieces: 0, cables: 0, sparks: 0, phase: "IDLE" };
  }

  destroy() {
    this.exit();
  }

  buildPieces() {
    const geometry = new THREE.PlaneGeometry(0.9, 0.28);
    this.geometries.push(geometry);

    for (let index = 0; index < this.config.pieces; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index % 2 ? this.config.colors.yellow : "#8A691B",
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      const t = index / Math.max(this.config.pieces - 1, 1);
      const roadX = Math.sin(t * Math.PI * 2) * 0.42 * (0.7 + t);
      const roadY = THREE.MathUtils.lerp(-3.15, 2.55, t);
      const roadZ = THREE.MathUtils.lerp(-1.15, -6.6, t);
      mesh.position.set(roadX, roadY, roadZ);
      mesh.scale.setScalar(THREE.MathUtils.lerp(1.25, 0.35, t));
      mesh.rotation.z = Math.sin(t * Math.PI * 2) * 0.16;
      this.materials.push(material);
      this.group.add(mesh);
      this.pieces.push({
        mesh,
        material,
        seed: index * 0.61,
        road: mesh.position.clone(),
        target: new THREE.Vector3((index % 6 - 2.5) * 0.62, -2.4 + (index % 8) * 0.64, -2.3 - Math.random() * 2.3)
      });
    }

    this.debugStats.roadPieces = this.pieces.length;
  }

  buildCables() {
    for (let index = 0; index < this.config.cables; index += 1) {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({
        color: index % 3 === 0 ? this.config.colors.electric : this.config.colors.wire,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const line = new THREE.Line(geometry, material);
      this.geometries.push(geometry);
      this.materials.push(material);
      this.group.add(line);
      this.cables.push({ line, material, seed: index * 0.47 });
    }

    this.debugStats.cables = this.cables.length;
  }

  buildSparks() {
    const geometry = new THREE.PlaneGeometry(0.08, 0.08);
    this.geometries.push(geometry);

    for (let index = 0; index < this.config.sparks; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: this.config.colors.electric,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.materials.push(material);
      this.group.add(mesh);
      this.sparks.push({ mesh, material, seed: Math.random() * Math.PI * 2 });
    }

    this.debugStats.sparks = this.sparks.length;
  }

  updatePieces(palmWorld, progress) {
    const breakAmount = this.smoothstep(0.12, 0.72, progress);

    this.pieces.forEach((piece) => {
      piece.mesh.position.copy(piece.road).lerp(piece.target, breakAmount);
      piece.mesh.rotation.z += 0.012 + breakAmount * 0.02;
      piece.mesh.material.opacity = 0.86 * (1 - this.smoothstep(0.62, 1, progress));

      if (palmWorld) {
        const distance = piece.mesh.position.distanceTo(palmWorld);
        if (distance < this.config.interaction.radius && distance > 0.001) {
          piece.mesh.position.add(piece.mesh.position.clone().sub(palmWorld).normalize().multiplyScalar((1 - distance / this.config.interaction.radius) * this.config.interaction.strength));
        }
      }
    });
  }

  updateCables(progress) {
    const opacity = this.smoothstep(0.34, 0.88, progress);

    this.cables.forEach((cable, index) => {
      const y = -2.8 + (index / Math.max(this.cables.length - 1, 1)) * 5.2;
      const wobble = Math.sin(this.clock * 2.1 + cable.seed) * 0.16;
      const points = [
        new THREE.Vector3(-3.8, y + wobble, -2.4),
        new THREE.Vector3(-1.0 + Math.sin(cable.seed) * 0.8, y + Math.sin(this.clock + cable.seed) * 0.35, -3.6),
        new THREE.Vector3(3.8, y - wobble, -2.2)
      ];
      cable.line.geometry.setFromPoints(points);
      cable.material.opacity = opacity * (0.26 + (index % 4 === 0 ? 0.4 : 0));
    });
  }

  updateSparks(delta, progress) {
    const visible = this.smoothstep(0.55, 1, progress);
    this.sparks.forEach((spark) => {
      spark.seed += delta * 2.4;
      spark.mesh.position.set(
        Math.sin(spark.seed * 1.7) * 3.1,
        Math.cos(spark.seed * 1.2) * 2.3,
        -2.1 - Math.abs(Math.sin(spark.seed)) * 2.4
      );
      spark.mesh.scale.setScalar(0.6 + Math.sin(spark.seed * 3.0) * 0.35);
      spark.material.opacity = visible * Math.max(Math.sin(spark.seed * 4.0), 0) * 0.72;
    });
  }

  toWorld(point, source) {
    if (!point) {
      return null;
    }

    const normalizedX = source === "hand" ? 1 - point.x : point.x;
    return new THREE.Vector3(
      this.camera.left + normalizedX * (this.camera.right - this.camera.left),
      this.camera.top - point.y * (this.camera.top - this.camera.bottom),
      -1.2
    );
  }

  smoothstep(edge0, edge1, value) {
    const x = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
    return x * x * (3 - 2 * x);
  }

  getDebugStats() {
    return this.debugStats;
  }
}
